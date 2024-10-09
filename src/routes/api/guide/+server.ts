import { env } from '$env/dynamic/private'

import { createOpenAI } from '@ai-sdk/openai'
// import { createAnthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'

import type { RequestHandler } from './$types'

import { guideMessages, imageIdentificationMessages } from '$lib/prompts'
import { getCategoryNames, getGuides } from '$lib/utils/supabase'

import { imageIdentificationResponseSchema, singleGuideResponseSchema } from '$lib/schemas'
import type {
  ErrorResponseData,
  GuideResponseData,
  MatchedIdentifiedObject,
  ObjectResponseData,
  ResponseTypes,
  RetrievedGuide
} from './types'

// const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY ?? '' })
const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })

const identifyObjects = async (image: string, categories: string[]) =>
  generateObject({
    model: openai('gpt-4o-2024-08-06'),
    schema: imageIdentificationResponseSchema,
    messages: imageIdentificationMessages(image, categories)
  }).then((result) => result.object)

const generateGuide = async (
  description: string,
  identifiedObjects: MatchedIdentifiedObject[],
  sourceGuides: RetrievedGuide[],
  isApartment: boolean
) =>
  generateObject({
    model: openai('gpt-4o-mini'),
    output: 'array',
    schema: singleGuideResponseSchema,
    messages: guideMessages(
      description ?? '',
      identifiedObjects as MatchedIdentifiedObject[],
      sourceGuides,
      isApartment
    )
  }).then((result) => result.object)

const sendData = (
  controller: ReadableStreamDefaultController,
  type: ResponseTypes,
  data: ObjectResponseData | GuideResponseData | ErrorResponseData
) => {
  controller.enqueue(JSON.stringify({ type, data }))
}

export const POST: RequestHandler = async ({ request }) => {
  const { image, isApartment } = await request.json()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const categories = await getCategoryNames()
        const identificationResult = await identifyObjects(image, categories)

        if ('error' in identificationResult.result) {
          sendData(controller, 'error', {
            error: true,
            errors: identificationResult.result.errors ?? { other: true }
          })
          controller.close()
          return
        }

        const identifiedObjectsWithCategories = identificationResult.result?.filter(
          (obj: object): obj is { name: string; category: string[] } =>
            'category' in obj && obj.category !== null
        )

        if (identifiedObjectsWithCategories?.length === 0) {
          sendData(controller, 'error', { error: true, errors: { noMatches: true } })
          controller.close()
          return
        } else if ('result' in identificationResult) {
          const identifiedObjects = identificationResult.result!.map(({ name }) => name)
          sendData(controller, 'objects', { objects: identifiedObjects })
        } else {
          throw new Error('Unexpected Error Occurred')
        }

        const guideQueries = identifiedObjectsWithCategories.map(({ category }) => category).flat()
        const retrievedGuides = await getGuides(guideQueries)

        const generatedGuides = await generateGuide(
          identificationResult.description,
          identifiedObjectsWithCategories,
          retrievedGuides,
          isApartment
        )

        if (generatedGuides.length === 0) {
          sendData(controller, 'error', { error: true, errors: { other: true } })
        } else if (generatedGuides.every((guide) => 'error' in guide && guide.error)) {
          sendData(controller, 'error', { error: true, errors: { other: true } })
        } else {
          sendData(controller, 'guide', { guide: generatedGuides })
        }
      } catch (error) {
        sendData(controller, 'error', { error: true, errors: { other: true } })
        console.error(error)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    }
  })
}

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

let requestIndex = 0

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

  const index = requestIndex++
  const startTime = Date.now()
  const timings: { step: string; duration: number }[] = []

  console.log(`✦ #${index} Received request`)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const categoriesStartTime = Date.now()
        const categories = await getCategoryNames()
        timings.push({ step: 'Fetching categories', duration: Date.now() - categoriesStartTime })
        console.log(
          `✧ #${index} Fetched categories: ${categories.slice(0, 5).join(', ')}... (${categories.length})`
        )

        const identificationStartTime = Date.now()
        const identificationResult = await identifyObjects(image, categories)
        timings.push({
          step: 'Identifying objects',
          duration: Date.now() - identificationStartTime
        })
        console.log(
          `✧ #${index} Object identification result: ${JSON.stringify(identificationResult)}`
        )

        if ('error' in identificationResult.result) {
          console.log(`✧ #${index} Error generated`)
          sendData(controller, 'error', {
            error: true,
            errors: identificationResult.result.errors ?? { other: true }
          })
          controller.close()
          console.log(`✧ #${index} Closed controller`)
          return
        }

        const identifiedObjectsWithCategories = identificationResult.result?.filter(
          (obj: object): obj is { name: string; category: string[] } =>
            'category' in obj && obj.category !== null
        )

        if (identifiedObjectsWithCategories?.length === 0) {
          sendData(controller, 'error', { error: true, errors: { noMatches: true } })
          console.log(`✧ #${index} No objects found`)
          controller.close()
          console.log(`✧ #${index} Closed controller`)
          return
        } else if ('result' in identificationResult) {
          const identifiedObjects = identificationResult.result!.map(({ name }) => name)
          sendData(controller, 'objects', { objects: identifiedObjects })
          console.log(
            `✧ #${index} Successfully identified objects: ${identifiedObjects.join(', ')}`
          )
        } else {
          console.log(`✧ #${index} Unexpected error occurred`)
          throw new Error('Unexpected Error Occurred')
        }

        const guidesStartTime = Date.now()
        const guideQueries = identifiedObjectsWithCategories.map(({ category }) => category).flat()
        console.log(
          `✧ #${index} Searching guides for: ${guideQueries.join(', ')} (${guideQueries.length})`
        )
        const retrievedGuides = await getGuides(guideQueries)
        timings.push({ step: 'Fetching guides', duration: Date.now() - guidesStartTime })
        console.log(
          `✧ #${index} Fetched guides: ${JSON.stringify(retrievedGuides)} (${retrievedGuides.length})`
        )

        const generationStartTime = Date.now()
        const generatedGuides = await generateGuide(
          identificationResult.description,
          identifiedObjectsWithCategories,
          retrievedGuides,
          isApartment
        )
        timings.push({ step: 'Generating guides', duration: Date.now() - generationStartTime })
        console.log(
          `✧ #${index} Generated guides: ${JSON.stringify(generatedGuides)} (${generatedGuides.length})`
        )

        if (generatedGuides.length === 0) {
          sendData(controller, 'error', { error: true, errors: { other: true } })
          console.log(`✧ #${index} No guides generated`)
        } else if (generatedGuides.every((guide) => 'error' in guide && guide.error)) {
          sendData(controller, 'error', { error: true, errors: { other: true } })
          console.log(`✧ #${index} All guides have errors`)
        } else {
          sendData(controller, 'guide', { guide: generatedGuides })
          console.log(`✧ #${index} Sent guides to client`)
        }
      } catch (error) {
        sendData(controller, 'error', { error: true, errors: { other: true } })
        console.log(`✧ #${index} Error catched: ${error}`)
        console.error(error)
      } finally {
        controller.close()
        const totalTime = Date.now() - startTime
        const indent = ' '.repeat(4 + index.toString().length)
        console.log(`✧ #${index} Timings:`)
        timings.forEach(({ step, duration }) => {
          console.log(`${indent}${step}: ${duration}ms`)
        })
        console.log(`${indent}Total time: ${totalTime}ms`)
        console.log(`✧ #${index} Closed controller`)
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

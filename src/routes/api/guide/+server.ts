import { env } from '$env/dynamic/private'
// import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { createClient } from '@supabase/supabase-js'
import type { RequestHandler } from './$types'
import { identificationMessages, guideMessages } from '$lib/prompts'
import type {
  ErrorResponseData,
  GuideResponseData,
  MatchedIdentifiedObject,
  ObjectResponseData,
  ResponseTypes,
  RetrievedGuide
} from './types'
import { identificationResponseSchema, singleGuideResponseSchema } from '$lib/schemas'

// const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY ?? '' })
const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY ?? '')

const identifyObjects = async (image: string, categories: string[]) =>
  generateObject({
    model: openai('gpt-4o-2024-08-06'),
    schema: identificationResponseSchema,
    messages: identificationMessages(image, categories)
  }).then((result) => result.object)

const fetchGuides = async (queries: string[]) => {
  console.log(`• Searching for: ${queries.join(', ')}`)
  return supabase
    .from('guidebook')
    .select('*')
    .in('name', queries)
    .then(
      (result) =>
        result.data?.map(({ name, guide, tips, category }) => ({
          name,
          guide: guide.split('\n'),
          tips: tips?.split('\n'),
          category
        })) ?? []
    )
}

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

  const categories = await supabase
    .from('guidebook')
    .select('name')
    .then((result) => result.data?.map(({ name }) => name) ?? [])

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const identificationResult = await identifyObjects(image, categories)

        if ('error' in identificationResult.result) {
          sendData(controller, 'error', {
            error: true,
            errors: identificationResult.result.errors ?? { other: true }
          })
          controller.close()
          return
        }

        // identified objects that has categories (length > 0 or not null)
        const identifiedObjectsWithCategories = identificationResult.result?.filter(
          (obj: object): obj is { name: string; category: string[] } =>
            'category' in obj && obj.category !== null
        )

        if (identifiedObjectsWithCategories?.length === 0) {
          sendData(controller, 'error', { error: true, errors: { noObjects: true } })
          controller.close()
          return
        } else if ('result' in identificationResult) {
          const identifiedObjects = identificationResult.result!.map(({ name }) => name)
          sendData(controller, 'objects', { objects: identifiedObjects })
        } else {
          throw new Error('Unexpected Error Occurred')
        }

        const retrievedGuides = await fetchGuides(
          identifiedObjectsWithCategories.map(({ category }) => category).flat()
        )

        console.log(JSON.stringify(identifiedObjectsWithCategories))
        console.log(JSON.stringify(retrievedGuides))

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
        console.log('An error occurred and has been sent to the client. Here is the error:')
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

// recycle/src/routes/api/guide/+server.ts

import { env } from '$env/dynamic/private'

import { createClient } from '@supabase/supabase-js'

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import type { RequestHandler } from './$types'

import { imageIdentificationMessages, guideMessages } from '$lib/prompts'

import type {
  ErrorResponseData,
  GuideResponseData,
  ObjectResponseData,
  ResponseTypes,
  RetrievedGuide,
  IdentifiedObject,
  ResultObject
} from './types'
import { imageIdentificationResponseSchema, guideResponseSchema } from '$lib/schemas'

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '', compatibility: 'strict' })
const supabase = createClient(env.SUPABASE_URL ?? '', env.SUPABASE_ANON_KEY ?? '')

let requestIndex = 0

const identifyObjects = async (image: string, categories: string[]) =>
  generateObject({
    model: openai('gpt-4o', {
      structuredOutputs: true
    }),
    schemaName: 'imageIdentification',
    schemaDescription:
      '올바른 분리배출을 위해 이미지의 물건을 인식하고 알맞는 카테고리로 분류합니다.',
    schema: imageIdentificationResponseSchema(categories as [string, ...string[]]),
    messages: imageIdentificationMessages(image, categories)
  }).then((result) => result.object)

const fetchGuides = async (queries: string[]) =>
  supabase
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

const generateGuide = async (
  description: string,
  identifiedObjects: IdentifiedObject[],
  sourceGuides: RetrievedGuide[],
  isApartment: boolean
): Promise<ResultObject[]> =>
  generateObject({
    model: openai('gpt-4o-mini', {
      structuredOutputs: true
    }),
    schemaName: 'guideGeneration',
    schemaDescription: '분리배출 방법에서 필요없는 부분을 정리합니다.',
    schema: guideResponseSchema,
    messages: guideMessages(
      description ?? '',
      identifiedObjects,
      sourceGuides,
      isApartment
    )
  }).then((result) => result.object.guides as ResultObject[])

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
        const categories = await supabase
          .from('guidebook')
          .select('name')
          .then((result) => result.data?.map(({ name }) => name) ?? [])
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

        const identifiedObjects = identificationResult.result as IdentifiedObject[]

        if (identifiedObjects.every((obj) => !obj.category)) {
          sendData(controller, 'error', { error: true, errors: { noMatches: true } })
          console.log(`✧ #${index} All objects have empty categories`)
          controller.close()
          console.log(`✧ #${index} Closed controller`)
          return
        } else {
          const identifiedObjectNames = identifiedObjects.map(({ name }) => name)
          sendData(controller, 'objects', { objects: identifiedObjectNames })
          console.log(
            `✧ #${index} Successfully identified objects: ${identifiedObjectNames.join(', ')}`
          )
        }

        const guidesStartTime = Date.now()
        const guideQueries = identifiedObjects.flatMap(({ category }) => category).filter((category): category is string => Boolean(category))
        console.log(
          `✧ #${index} Searching guides for: ${guideQueries.join(', ')} (${guideQueries.length})`
        )
        const retrievedGuides = await fetchGuides(guideQueries)
        timings.push({ step: 'Fetching guides', duration: Date.now() - guidesStartTime })
        console.log(
          `✧ #${index} Fetched guides: ${JSON.stringify(retrievedGuides)} (${retrievedGuides.length})`
        )

        const generationStartTime = Date.now()
        const generatedGuides = await generateGuide(
          identificationResult.description,
          identifiedObjects,
          retrievedGuides,
          isApartment
        )
        timings.push({ step: 'Generating guides', duration: Date.now() - generationStartTime })
        console.log(
          `✧ #${index} Generated guides: ${JSON.stringify(generatedGuides)} (${generatedGuides.length})`
        )

        if (generatedGuides.every((guide) => guide.type === 'error')) {
          sendData(controller, 'error', { error: true, errors: { other: true } })
          console.log(`✧ #${index} All generated guides have errors`)
        } else {
          sendData(controller, 'guide', { guide: generatedGuides })
          console.log(`✧ #${index} Sent guides to client`)
        }
      } catch (error) {
        sendData(controller, 'error', { error: true, errors: { other: true } })
        console.log(`✧ #${index} Error caught: ${error}`)
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

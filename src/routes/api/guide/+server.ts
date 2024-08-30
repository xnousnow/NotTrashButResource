import { env } from '$env/dynamic/private'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { createClient } from '@supabase/supabase-js'
import type { RequestHandler } from './$types'
import { identificationMessages, guideMessages } from '$lib/prompts'
import type { MatchedIdentifiedObject, RetrievedGuide } from './types'
import {
  supportedIdentificationResponseSchema,
  supportedSingleGuideResponseSchema
} from '$lib/schemas'

const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY ?? '' })
const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY ?? '')

const identifyObjects = async (image: string, categories: string[]) =>
  generateObject({
    model: anthropic('claude-3-5-sonnet-20240620', { cacheControl: true }),
    schema: supportedIdentificationResponseSchema,
    messages: identificationMessages(image, categories)
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
  identifiedObjects: MatchedIdentifiedObject[],
  sourceGuides: RetrievedGuide[],
  isApartment: boolean
) =>
  generateObject({
    model: openai('gpt-4o-mini'),
    output: 'array',
    schema: supportedSingleGuideResponseSchema,
    messages: guideMessages(
      description ?? '',
      identifiedObjects as MatchedIdentifiedObject[],
      sourceGuides,
      isApartment
    )
  }).then((result) => result.object)

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

        const identifiedObjectsWithCategories = identificationResult.result?.filter(
          (obj: object): obj is { name: string; category: string[] } =>
            'category' in obj && obj.category !== null
        )

        if ('error' in identificationResult) {
          controller.enqueue(JSON.stringify({ ...identificationResult, type: 'error' }))
          controller.close()
          return
        } else if ('result' in identificationResult) {
          const identifiedObjects = identificationResult.result!.map(({ name }) => name)
          controller.enqueue(JSON.stringify(identifiedObjects))
        } else if (identifiedObjectsWithCategories?.length === 0) {
          controller.enqueue(
            JSON.stringify({ type: 'error', error: true, errors: { noObjects: true } })
          )
          controller.close()
          return
        } else {
          throw new Error('결과가 올바른 형식이 아닙니다.')
        }

        const retrievedGuides = await fetchGuides(
          identifiedObjectsWithCategories?.map(({ name }) => name) ?? []
        )

        const generatedGuides = await generateGuide(
          identificationResult.description!,
          identifiedObjectsWithCategories!,
          retrievedGuides,
          isApartment
        )

        controller.enqueue(JSON.stringify(generatedGuides))
      } catch (error) {
        controller.enqueue(JSON.stringify({ type: 'error', error: true, errors: { other: true } }))
        console.log('오류가 발생했지만 안전하게 처리했습니다. 다음은 오류 메시지입니다:')
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

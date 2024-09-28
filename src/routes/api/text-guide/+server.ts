import { env } from '$env/dynamic/private'

import { createClient } from '@supabase/supabase-js'
import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { categorizationMessages } from '$lib/prompts'
import { categorizationResponseSchema } from '$lib/schemas'

import type { RequestHandler } from './$types'
import type { ErrorResponse, GuideResponse, ObjectError, ResultObject } from './types'

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })
const supabase = createClient(env.SUPABASE_URL ?? '', env.SUPABASE_ANON_KEY ?? '')

let requestIndex = 0

const categorizeObject = async (object: string, categories: string[]) =>
  generateObject({
    model: openai('gpt-4o'),
    schema: categorizationResponseSchema(categories as [string, ...string[]]),
    messages: categorizationMessages(object, categories)
  }).then((result) => result.object.result)

const fetchGuides = async (queries: string[]) =>
  supabase
    .from('guidebook')
    .select('*')
    .in('name', queries)
    .then(
      (result) =>
        result.data?.map(({ name, guide, tips }) => ({
          name,
          guide: guide.split('\n'),
          tips: tips?.split('\n')
        })) ?? []
    )

export const POST: RequestHandler = async ({ request }) => {
  const { object } = await request.json()

  const index = requestIndex++
  const timings: { step: string; duration: number }[] = []

  console.log(`✦ #${index} Received request`)

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

    if (categories.includes(object)) {
      const guideStartTime = Date.now()
      const guide = await fetchGuides([object])
      timings.push({ step: 'Fetching guide', duration: Date.now() - guideStartTime })
      console.log(`✧ #${index} Fetched guide: ${JSON.stringify(guide)}`)
      
      const editedGuide = guide.map((item) => ({
        ...item,
        reference: [object]
      }))

      const response: GuideResponse = {
        type: 'guide',
        data: {
          guide: editedGuide
        }
      }
      return new Response(JSON.stringify(response))
    }

    const identificationStartTime = Date.now()
    const categorizationResult = await categorizeObject(object, categories)
    timings.push({
      step: 'Identifying objects',
      duration: Date.now() - identificationStartTime
    })
    console.log(`✧ #${index} Categorization result: ${JSON.stringify(categorizationResult)}`)

    if (categorizationResult.length == 0) {
      const errorResponse: ErrorResponse = {
        type: 'error',
        data: {
          error: true,
          errors: {
            unrelated: true
          }
        }
      }
      return new Response(JSON.stringify(errorResponse))
    }

    const allNoMatch = categorizationResult.every(
      (result) => 'error' in result && result.errors.noMatch
    )
    const allErrors = categorizationResult.every((result) => 'error' in result)

    if (allNoMatch) {
      const errorResponse: ErrorResponse = {
        type: 'error',
        data: {
          error: true,
          errors: {
            noMatches: true
          }
        }
      }
      return new Response(JSON.stringify(errorResponse))
    }

    if (allErrors) {
      const errorResponse: ErrorResponse = {
        type: 'error',
        data: {
          error: true,
          errors: {
            other: true
          }
        }
      }
      return new Response(JSON.stringify(errorResponse))
    }

    const guideStartTime = Date.now()
    const guideQueries = categorizationResult
      .filter(
        (obj): obj is { name: string; category: string[] } =>
          'category' in obj && obj.category !== null
      )
      .map(({ category }) => category)
      .flat()
    console.log(
      `✧ #${index} Searching guides for: ${guideQueries.join(', ')} (${guideQueries.length})`
    )
    const retrievedGuides = await fetchGuides(guideQueries)
    timings.push({ step: 'Fetching guides', duration: Date.now() - guideStartTime })
    console.log(
      `✧ #${index} Fetched guides: ${JSON.stringify(retrievedGuides)} (${retrievedGuides.length})`
    )

    const guides: ResultObject[] = categorizationResult.flatMap((result): ResultObject[] => {
      if ('category' in result && result.category !== null) {
        return result.category.map((categoryName) => {
          const matchingGuide = retrievedGuides.find((guide) => guide.name === categoryName)
          return {
            name: result.name,
            category: [categoryName],
            guide: matchingGuide?.guide ?? [],
            tips: matchingGuide?.tips ?? [],
            reference: [matchingGuide?.name ?? '']
          }
        })
      } else {
        return [result as ObjectError]
      }
    })

    const response: GuideResponse = {
      type: 'guide',
      data: { guide: guides }
    }
    return new Response(JSON.stringify(response))
  } catch (error) {
    console.error(`✧ #${index} Error occurred:`, error)
    const errorResponse: ErrorResponse = {
      type: 'error',
      data: { error: true, errors: { other: true } }
    }
    return new Response(JSON.stringify(errorResponse))
  } finally {
    console.log(`✧ #${index} Timings:`)
    timings.forEach(({ step, duration }) => {
      console.log(`    ${step}: ${duration}ms`)
    })
  }
}

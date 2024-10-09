import { json } from '@sveltejs/kit'

import { getCategoryNames, getGuides } from '$lib/utils/supabase'
import { categorizeObject } from '$lib/ai'

import type { RequestHandler } from './$types'
import type {
  TextErrorResponse as ErrorResponse,
  TextGuideResponse as GuideResponse,
  TextObjectError as ObjectError,
  TextResultObject as ResultObject
} from '$lib/types'

export const POST: RequestHandler = async ({ request }) => {
  const { object } = await request.json()

  try {
    const categories = await getCategoryNames()

    if (categories.includes(object)) {
      const guide = await getGuides([object])

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
      return json(response)
    }

    const categorizationResult = await categorizeObject(object, categories)

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
      return json(errorResponse)
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
      return json(errorResponse)
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
      return json(errorResponse)
    }

    const guideQueries = categorizationResult
      .filter(
        (obj): obj is { name: string; category: string[] } =>
          'category' in obj && obj.category !== null
      )
      .map(({ category }) => category)
      .flat()
    const retrievedGuides = await getGuides(guideQueries)

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
    return json(response)
  } catch (error) {
    console.error('Error occurred:', error)
    const errorResponse: ErrorResponse = {
      type: 'error',
      data: { error: true, errors: { other: true } }
    }
    return json(errorResponse)
  }
}

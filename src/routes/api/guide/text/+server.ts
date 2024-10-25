import { getCategoryNames, getGuides } from '$lib/utils/supabase'
import { categorizeObject } from '$lib/ai/ai'

import type { RequestHandler } from './$types'
import type { TextModeRequest, GuideResponse, ErrorResponse, InfoResponse } from '../types'

export const POST: RequestHandler = async ({ request }) => {
  const { query } = (await request.json()) as TextModeRequest
  const startTime = Date.now()

  let totalPromptTokens = 0
  let totalCompletionTokens = 0

  const categories = await getCategoryNames()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (categories.includes(query)) {
          const guide = await getGuides([query])

          const editedGuide = guide.map((item) => ({
            ...item,
            reference: [query]
          }))

          const response: GuideResponse = {
            type: 'guide',
            data: {
              guide: editedGuide
            }
          }

          controller.enqueue(JSON.stringify(response) + '\n')
          controller.close()
          return
        }

        const { object: categorizationResult, usage: categorizationUsage } = await categorizeObject(
          query,
          categories
        )

        totalPromptTokens += categorizationUsage.promptTokens
        totalCompletionTokens += categorizationUsage.completionTokens

        if (!categorizationResult.result.length) {
          const errorResponse: ErrorResponse = {
            type: 'error',
            data: {
              error: true,
              errors: { unrelated: true }
            }
          }

          controller.enqueue(JSON.stringify(errorResponse) + '\n')
          controller.close()
          return
        } else if (categorizationResult.result.every((object) => !object.category.length)) {
          const errorResponse: ErrorResponse = {
            type: 'error',
            data: {
              error: true,
              errors: { noMatches: true }
            }
          }

          controller.enqueue(JSON.stringify(errorResponse) + '\n')
          controller.close()
          return
        }

        const retrievedGuides = await getGuides(
          categorizationResult.result.flatMap((object) => object.category)
        )

        const organizedGuides = categorizationResult.result.flatMap(
          (object): GuideResponse['data']['guide'] => {
            if (object.category.length) {
              return object.category.map((categoryName) => {
                const matchingGuide = retrievedGuides.find((guide) => guide.name === categoryName)
                return {
                  name: object.name,
                  steps: matchingGuide?.steps ?? [],
                  tips: matchingGuide?.tips,
                  reference: [matchingGuide?.name ?? '']
                }
              })
            } else {
              return [
                {
                  name: object.name,
                  error: true,
                  errors: {
                    noGuide: true,
                    other: false
                  }
                }
              ]
            }
          }
        )

        const guideResponse: GuideResponse = {
          type: 'guide',
          data: { guide: organizedGuides }
        }

        controller.enqueue(JSON.stringify(guideResponse) + '\n')
      } catch (err) {
        console.error(err)

        const errorResponse: ErrorResponse = {
          type: 'error',
          data: {
            error: true,
            errors: {
              server: true
            }
          }
        }

        controller.enqueue(JSON.stringify(errorResponse) + '\n')
      } finally {
        const infoResponse: InfoResponse = {
          type: 'info',
          data: {
            usage: {
              inputTokenUsage: totalPromptTokens,
              outputTokenUsage: totalCompletionTokens
            },
            latency: Date.now() - startTime
          }
        }

        controller.enqueue(JSON.stringify(infoResponse) + '\n')

        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Transfer-Encoding': 'chunked'
    }
  })
}

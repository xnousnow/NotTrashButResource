import { getCategoryNames, getGuides } from '$utils/supabase'
import { identifyObjects, generateGuides } from '$lib/ai/ai'

import type { RequestHandler } from './$types'
import type {
  ImageModeRequest,
  ObjectsResponse,
  GuideResponse,
  ErrorResponse,
  InfoResponse
} from '../types'

export const POST: RequestHandler = async ({ request }) => {
  const { image, options } = (await request.json()) as ImageModeRequest
  const startTime = Date.now()

  let totalPromptTokens = 0
  let totalCompletionTokens = 0

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const categories = await getCategoryNames()
        const { object: identificationResult, usage: identificationUsage } = await identifyObjects(
          image,
          categories
        )

        console.log(JSON.stringify(identificationResult))

        totalPromptTokens += identificationUsage.promptTokens
        totalCompletionTokens += identificationUsage.completionTokens

        if ('error' in identificationResult.result) {
          const errorResponse: ErrorResponse = {
            type: 'error',
            data: {
              error: true,
              errors: identificationResult.result.errors ?? { other: true }
            }
          }

          controller.enqueue(JSON.stringify(errorResponse) + '\n')
          controller.close()
          return
        } else if (identificationResult.result.length === 0) {
          const errorResponse: ErrorResponse = {
            type: 'error',
            data: {
              error: true,
              errors: { noObjects: true }
            }
          }

          controller.enqueue(JSON.stringify(errorResponse) + '\n')
          controller.close()
          return
        } else if (!identificationResult.result.every((object) => object.category.length)) {
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

        const objectsResponse: ObjectsResponse = {
          type: 'objects',
          data: {
            objects: identificationResult.result.map(({ name }) => name)
          }
        }

        controller.enqueue(JSON.stringify(objectsResponse) + '\n')

        const originalGuides = await getGuides(
          identificationResult.result.flatMap(({ category }) => category)
        )

        const { object: generatedGuides, usage: guideGenerationUsage } = await generateGuides(
          identificationResult.description,
          identificationResult.result,
          originalGuides,
          options
        )

        console.log(JSON.stringify(generatedGuides))

        totalPromptTokens += guideGenerationUsage.promptTokens
        totalCompletionTokens += guideGenerationUsage.completionTokens

        if (generatedGuides.length === 0) {
          const errorResponse: ErrorResponse = {
            type: 'error',
            data: {
              error: true,
              errors: { other: true }
            }
          }

          controller.enqueue(JSON.stringify(errorResponse) + '\n')
        }

        const guideResponse: GuideResponse = {
          type: 'guide',
          data: {
            guide: generatedGuides
          }
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

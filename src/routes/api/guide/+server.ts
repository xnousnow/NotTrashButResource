import type { RequestHandler } from './$types'

import { getCategoryNames, getGuides } from '$lib/utils/supabase'
import { identifyObjects, generateGuides } from '$lib/ai'

import type {
  ErrorResponseData,
  GuideResponseData,
  ObjectResponseData,
  ResponseTypes,
  ResultObject
} from '$lib/types'

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

        const generatedGuides = await generateGuides(
          identificationResult.description,
          identifiedObjectsWithCategories,
          retrievedGuides,
          isApartment
        )

        if (generatedGuides.length === 0) {
          sendData(controller, 'error', { error: true, errors: { other: true } })
        } else if (
          generatedGuides.every((guide: ResultObject) => 'error' in guide && guide.error)
        ) {
          sendData(controller, 'error', { error: true, errors: { other: true } })
        } else {
          sendData(controller, 'guide', { guide: generatedGuides as ResultObject[] })
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

import type { ObjectResponseData, GuideResponseData, ErrorResponseData } from '$api/guide/types'
import { processImage } from './processImage'

export const useAPI = async (
  image: File,
  isApartment: boolean,
  handleObjects: (objects: ObjectResponseData) => void,
  handleGuides: (guides: GuideResponseData) => void,
  handleError: (error: ErrorResponseData) => void,
  close: () => void
) => {
  try {
    const processedImage = await processImage(image, 200, 200)

    const response = await fetch('/api/guide', {
      method: 'POST',
      body: JSON.stringify({ image: processedImage, isApartment }),
      headers: { 'Content-Type': 'application/json' }
    })

    const reader = response.body?.getReader()
    if (!reader) {
      handleError({ error: true, errors: { other: true } })
      return
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      let startIndex = 0
      while (true) {
        const endIndex = buffer.indexOf('}', startIndex) + 1
        if (endIndex === 0) break

        try {
          const jsonString = buffer.slice(startIndex, endIndex)
          const { type, data } = JSON.parse(jsonString)

          switch (type) {
            case 'objects':
              handleObjects(data)
              break
            case 'guide':
              handleGuides(data)
              break
            case 'error':
              handleError(data)
              break
          }

          startIndex = endIndex
        } catch {
          startIndex++
        }
      }

      buffer = buffer.slice(startIndex)
    }
  } catch (error) {
    console.error(error)
    handleError({ error: true, errors: { other: true } })
  } finally {
    close()
  }
}

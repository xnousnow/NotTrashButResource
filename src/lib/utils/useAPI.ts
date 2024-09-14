import { processImage } from '$utils/processImage'

import type { ObjectResponseData, GuideResponseData, ErrorResponseData } from '$api/guide/types'

const findJsonObjects = (str: string): string[] => {
  const objects: string[] = []
  let depth = 0
  let startIndex = -1

  for (let i = 0; i < str.length; i++) {
    if (str[i] === '{') {
      if (depth === 0) startIndex = i
      depth++
    } else if (str[i] === '}') {
      depth--
      if (depth === 0 && startIndex !== -1) {
        objects.push(str.substring(startIndex, i + 1))
        startIndex = -1
      }
    }
  }

  return objects
}

export const useAPI = {
  image: async (
    image: File,
    isApartment: boolean,
    handleObjects: (objects: ObjectResponseData['objects']) => void,
    handleGuides: (guides: GuideResponseData['guide']) => void,
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

      await handleStreamResponse(response, handleObjects, handleGuides, handleError, close)
    } catch (error) {
      console.error(error)
      handleError({ error: true, errors: { other: true } })
    }
  },

  text: async (
    object: string,
    handleGuides: (guides: GuideResponseData['guide']) => void,
    handleError: (error: ErrorResponseData) => void
  ) => {
    try {
      const response = await fetch('/api/text-guide', {
        method: 'POST',
        body: JSON.stringify({ object }),
        headers: { 'Content-Type': 'application/json' }
      })

      const { type, data } = await response.json()

      switch (type) {
        case 'guide':
          handleGuides(data.guide)
          break
        case 'error':
          handleError(data)
          break
      }
    } catch (error) {
      console.error(error)
      handleError({ error: true, errors: { other: true } })
    }
  }
}

const handleStreamResponse = async (
  response: Response,
  handleObjects: (objects: ObjectResponseData['objects']) => void,
  handleGuides: (guides: GuideResponseData['guide']) => void,
  handleError: (error: ErrorResponseData) => void,
  close: () => void
) => {
  const reader = response.body?.getReader()
  if (!reader) {
    handleError({ error: true, errors: { other: true } })
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      close()
      break
    }

    buffer += decoder.decode(value, { stream: true })

    const jsonObjects = findJsonObjects(buffer)

    for (const jsonString of jsonObjects) {
      try {
        const { type, data } = JSON.parse(jsonString)

        switch (type) {
          case 'objects':
            handleObjects(data.objects)
            break
          case 'guide':
            handleGuides(data.guide)
            break
          case 'error':
            handleError(data)
            break
        }

        const endIndex = buffer.indexOf(jsonString) + jsonString.length
        buffer = buffer.slice(endIndex)
      } catch (error) {
        console.error('Error parsing JSON:', error)
      }
    }
  }
}

import type { ObjectResponseData, GuideResponseData, ErrorResponseData } from '$api/guide/types'

const resizeImage = (file: File, maxWidth: number, maxHeight: number) =>
  new Promise<string>((resolve, reject) => {
    if (!(file instanceof Blob))
      return reject(new TypeError('The provided value is not a Blob or File.'))

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height
          width = aspectRatio > 1 ? maxWidth : Math.round(maxHeight * aspectRatio)
          height = aspectRatio > 1 ? Math.round(maxWidth / aspectRatio) : maxHeight
        }

        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL())
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

function findJsonObjects(str: string): string[] {
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

export const useAPI = async (
  image: File,
  isApartment: boolean,
  handleObjects: (objects: ObjectResponseData) => void,
  handleGuides: (guides: GuideResponseData) => void,
  handleError: (error: ErrorResponseData) => void,
  close: () => void
) => {
  try {
    const processedImage = await resizeImage(image, 200, 200)

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
              handleObjects(data)
              break
            case 'guide':
              handleGuides(data)
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
  } catch (error) {
    console.error(error)
    handleError({ error: true, errors: { other: true } })
  }
}

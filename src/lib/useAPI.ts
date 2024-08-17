import type {
  IdentifiedObjects,
  ObjectGuide,
  ObjectError,
  FullError
} from '../routes/api/guide/types'

export const resizeImage = (file: File, maxWidth: number, maxHeight: number) =>
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

export const useAPI = async (
  image: string,
  isApartment: boolean,
  setObjects: (objects: IdentifiedObjects) => void,
  addGuide: (guide: ObjectGuide) => void,
  addError: (error: ObjectError) => void,
  fullError: (error: FullError) => void,
  close: () => void
) => {
  try {
    const response = await fetch('/api/guide', {
      method: 'POST',
      body: JSON.stringify({ image, isApartment }),
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()

    let buffer = ''
    const pattern = /(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\])/g

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      let match: RegExpExecArray | null
      while ((match = pattern.exec(buffer)) !== null) {
        const jsonString = match[0]

        try {
          const currentObject = JSON.parse(jsonString)

          if (Array.isArray(currentObject)) {
            setObjects(currentObject)
          } else if (currentObject.name && !currentObject.error) {
            addGuide(currentObject)
          } else if (currentObject.name && currentObject.error) {
            addError(currentObject)
          } else if (currentObject.error && typeof currentObject.error === 'boolean') {
            fullError(currentObject)
          }
        } catch (error) {
          console.error('Error parsing JSON:', error)
          console.error('Invalid jsonString:', jsonString)
        }
      }

      // Remove processed part from buffer
      const lastMatch = buffer.lastIndexOf('}')
      if (lastMatch !== -1) {
        buffer = buffer.slice(lastMatch + 1)
      }
      pattern.lastIndex = 0 // Reset regex index
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      console.warn('Unprocessed data in buffer:', buffer)
    }
  } catch (error: unknown) {
    fullError({ error: true, errors: { processing: true }, debug: JSON.stringify(error) })
  } finally {
    close()
  }
}

import type {
  IdentifiedObjects,
  FullError,
  ObjectError,
  ObjectGuide
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

    const processBuffer = (buffer: string) => {
      let depth = 0
      let startIndex = 0
      let inString = false

      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i]

        if (char === '"' && buffer[i - 1] !== '\\') {
          inString = !inString
        }

        if (!inString) {
          if (char === '{' || char === '[') {
            if (depth === 0) startIndex = i
            depth++
          } else if (char === '}' || char === ']') {
            depth--
            if (depth === 0) {
              const jsonString = buffer.slice(startIndex, i + 1)
              try {
                const parsedObject = JSON.parse(jsonString)
                processObject(parsedObject)
              } catch (e) {
                console.error('Error parsing JSON:', jsonString, e)
              }
            }
          }
        }
      }
    }

    const processObject = (obj: IdentifiedObjects | ObjectGuide | ObjectError | FullError) => {
      if ('noObject' in obj) {
        console.warn('Received noObject response', obj)
        return
      }

      if (Array.isArray(obj)) {
        setObjects(obj)
      } else if ('error' in obj && 'name' in obj) {
        addError(obj)
      } else if ('error' in obj) {
        fullError(obj)
      } else if ('name' in obj) {
        addGuide(obj)
      }
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      processBuffer(buffer)
      buffer = ''
    }

    // Handle any leftover buffer
    if (buffer.length > 0) {
      processBuffer(buffer)
    }
  } catch (error: unknown) {
    console.error(error)
    fullError({ error: true, errors: { processing: true }, debug: JSON.stringify(error) })
  } finally {
    close()
  }
}

import type { IdentifiedObjects, FullError } from '../routes/api/guide/types'

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
  addGuide: (guide: { name: string; guide: string[]; tips?: string[] }) => void,
  addError: (error: { name: string; error: boolean; errors: { noMatch?: boolean } }) => void,
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

    let done: boolean | undefined
    let value: Uint8Array | undefined
    ;({ done, value } = await reader.read())
    if (done) {
      fullError({ error: true, errors: { other: true } })
      return
    } else {
      const currentObject = JSON.parse(decoder.decode(value))

      if (currentObject.error) {
        fullError(currentObject)
        return
      }

      if (Array.isArray(currentObject)) {
        setObjects(currentObject)
      }
    }

    while (true) {
      ;({ done, value } = await reader.read())
      if (done) break

      const currentObject = JSON.parse(decoder.decode(value))

      if (currentObject.name && !currentObject.error) {
        addGuide(currentObject)
      } else if (currentObject.name && currentObject.error) {
        addError(currentObject)
      } else if (currentObject.error) {
        fullError(currentObject)
        return
      }
    }
  } catch (error: unknown) {
    fullError({ error: true, errors: { processing: true }, debug: JSON.stringify(error) })
  } finally {
    close()
  }
}

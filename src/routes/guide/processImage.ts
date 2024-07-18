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

export const useAPI = async (data: { image: string; isApartment: boolean }) =>
  fetch('/api/guide', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  }).then((r) => r.json())

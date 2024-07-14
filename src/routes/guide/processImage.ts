// processImage.ts

export const resizeImage = (file: File, maxWidth: number, maxHeight: number) =>
  new Promise<string>((resolve, reject) => {
    if (!(file instanceof Blob)) {
      reject(new TypeError('The provided value is not a Blob or File.'))
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const img = new Image()
      img.src = reader.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height *= maxWidth / width))
            width = maxWidth
          } else {
            width = Math.round((width *= maxHeight / height))
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL())
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })

export const useAPI = async (base64: string) => {
  return await fetch('/api/guide', {
    method: 'POST',
    body: JSON.stringify({ image: base64 }),
    headers: { 'Content-Type': 'application/json' }
  }).then((r) => r.json())
}

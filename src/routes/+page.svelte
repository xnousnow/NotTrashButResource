<script lang="ts">
  let status = 'Waiting for image...'
  let res = {}

  const toBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  const resizeImage = (base64: string, maxWidth: number, maxHeight: number) => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image()
      img.src = base64
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate the new dimensions while maintaining the aspect ratio
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
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL())
      }
      img.onerror = (error) => reject(error)
    })
  }

  const useAPI = async (base64: string) => {
    let response = {}
    await fetch('/api/guide', {
      method: 'POST',
      body: JSON.stringify({ image: base64 }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((r) => {
        status = 'Done'
        return r.json()
      })
      .then((r) => {
        response = r
      })
    return response
  }

  const generate = async (e: Event) => {
    status = 'Converting to base64...'
    const file = (e.target as HTMLInputElement).files![0]
    toBase64(file)
      .then((base64: string) => {
        status = 'Resizing image...'
        return resizeImage(base64, 512, 512)
      })
      .then((resizedBase64: string) => {
        status = 'Sending to API...'
        return useAPI(resizedBase64)
      })
      .then((r) => {
        res = r
      })
  }
</script>

<input type="file" accept="image/*" on:change={(e) => generate(e)} />
<br />
{status}
{JSON.stringify(res)}

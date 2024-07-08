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
    toBase64((e.target as HTMLInputElement).files![0])
      .then((base64: string) => {
        status = 'Sending to API...'
        return useAPI(base64)
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

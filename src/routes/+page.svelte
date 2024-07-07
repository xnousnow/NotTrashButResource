<script lang="ts">
  let image: File | null = null
  let status = 'Waiting for image...'
  let res = {}

  const generate = async (e: Event) => {
    status = 'Converting to base64...'
    const target = e.target as HTMLInputElement
    image = target.files ? target.files[0] : null
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target!.result

      status = 'Generating...'
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
          res = r
        })
    }
    reader.readAsDataURL(image as File)
  }
</script>

<input type="file" accept="image/*" on:change={(e) => generate(e)} />
<br />
{status}
{JSON.stringify(res)}

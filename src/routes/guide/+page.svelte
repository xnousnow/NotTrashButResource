<script lang="ts">
  import { onMount } from 'svelte'
  import { blur } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import { image } from '../../stores'
  import ArrowBack from '~icons/material-symbols/ArrowBack'
  import AutoAwesome from '~icons/material-symbols/AutoAwesome'
  import ResultSkeletonLoader from '../../components/ResultSkeletonLoader.svelte'
  import ResultDisplay from '../../components/ResultDisplay.svelte'
  import IssuesDisplay from '../../components/IssuesDisplay.svelte'

  const resizeImage = (file: File, maxWidth: number, maxHeight: number) => {
    return new Promise<string>((resolve, reject) => {
      if (!(file instanceof Blob)) {
        reject(new TypeError('The provided value is not a Blob or File.'))
        return
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        const img = new Image()
        img.src = base64
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

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
      }
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
        return r.json()
      })
      .then((r) => {
        response = r
      })
    return response
  }

  let response: any
  let generating = true
  let error = false

  onMount(async () => {
    if (!$image) await goto('/')

    try {
      const resized = await resizeImage($image!, 512, 512)
      response = await useAPI(resized)

      if (response.message) {
        response = null
        error = true
      }
    } catch {
      error = true
    } finally {
      generating = false
    }
  })
</script>

<div class="flex h-[100dvh] w-full flex-col space-y-2 bg-black p-2 text-white">
  <a href="/">
    <ArrowBack class="h-6 w-6" />
  </a>
  {#if $image}
    <div class="rounded-3xl overflow-hidden relative">
      <img
        src={URL.createObjectURL($image)}
        alt="Captured"
        class="h-full max-h-[30vh] w-full object-cover duration-300"
        class:generating
      />
      {#if generating}
        <div class="absolute top-0 left-0 flex justify-center items-center w-full h-full opacity-50" out:blur={{ duration: 300 }}>
          <AutoAwesome class="h-16 w-16 animate-pulse" />
        </div>
      {/if}
    </div>
  {/if}
  <div class="relative">
    {#if generating}
      <ResultSkeletonLoader />
    {:else if error || response.issues}
      <IssuesDisplay response={response} error={error} />
    {:else}
      <ResultDisplay response={response} />
    {/if}
  </div>
</div>

<style lang="postcss">
  .generating {
    @apply opacity-70 animate-pulse blur scale-110;
  }
</style>

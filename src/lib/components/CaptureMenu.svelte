<script lang="ts">
  import { goto } from '$app/navigation'
  import { blur } from 'svelte/transition'

  import AddPhotoAlternate from '~icons/material-symbols/AddPhotoAlternate'
  import Keyboard from '~icons/material-symbols/Keyboard'
  import ViewInAr from '~icons/material-symbols/ViewInAr'

  import { image, inputMode, localStorageLoaded } from '$lib/stores'

  export let imageFile: File
  export let video: HTMLVideoElement

  const upload = (event: Event) => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files[0]) {
      imageFile = input.files[0]
      image.set(imageFile)

      goto('/guide')
    }
  }

  const capture = () => {
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' })
      } else {
        console.error('Failed to capture image from video.')
        return
      }
      image.set(imageFile)

      goto('/guide')
    }, 'image/jpeg')
  }
</script>

<div class="mx-auto flex h-32 w-full max-w-96 items-center justify-around">
  <label
    class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/20 duration-200 hover:bg-white/30"
  >
    <input type="file" accept="image/*" on:change={upload} hidden />
    <AddPhotoAlternate class="h-6 w-6" />
  </label>
  <button
    class="h-14 w-14 rounded-full bg-white outline outline-4 outline-offset-2 duration-200 hover:scale-105 active:scale-95 active:outline-offset-4"
    on:click={capture}
  ></button>
  <button
    class="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20 duration-200 hover:bg-white/30"
    on:click={() => inputMode.set($inputMode === 'image' ? 'text' : 'image')}
  >
    {#if !$localStorageLoaded}
      <div transition:blur={{ duration: 200, amount: 2 }} class="absolute"></div>
    {:else if $inputMode === 'image'}
      <div transition:blur={{ duration: 200, amount: 2 }} class="absolute">
        <ViewInAr class="h-6 w-6" />
      </div>
    {:else}
      <div transition:blur={{ duration: 200, amount: 2 }} class="absolute">
        <Keyboard class="h-6 w-6" />
      </div>
    {/if}
  </button>
</div>

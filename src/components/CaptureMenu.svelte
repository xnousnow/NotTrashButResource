<script lang="ts">
  import AddPhotoAlternate from '~icons/material-symbols/AddPhotoAlternate'
  import House from '~icons/material-symbols/House'
  import Apartment from '~icons/material-symbols/Apartment'
  import { image, isApartment, localStorageLoaded } from '$lib/stores'
  import { goto } from '$app/navigation'
  import { blur } from 'svelte/transition'

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
    on:click={() => isApartment.set(!$isApartment)}
  >
    {#if !$localStorageLoaded}
      <div transition:blur={{ duration: 200, amount: 2 }} class="absolute"></div>
    {:else if $isApartment}
      <div transition:blur={{ duration: 200, amount: 2 }} class="absolute">
        <Apartment class="h-6 w-6" />
      </div>
    {:else}
      <div transition:blur={{ duration: 200, amount: 2 }} class="absolute">
        <House class="h-6 w-6" />
      </div>
    {/if}
  </button>
</div>

<script lang="ts">
  import AddPhotoAlternate from '~icons/material-symbols/AddPhotoAlternate'
  import House from '~icons/material-symbols/House'
  import Apartment from '~icons/material-symbols/Apartment'
  import { image } from '$lib/stores'
  import { goto } from '$app/navigation'

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
    canvas.toBlob((blob: any) => {
      imageFile = new File([blob], 'image.jpg', { type: 'image/jpeg' })
      image.set(imageFile)

      goto('/guide')
    }, 'image/jpeg')
  }

  let isApartment = true
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
    class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 duration-200 hover:bg-white/30"
    on:click={() => (isApartment = !isApartment)}
  >
    {#if isApartment}
      <Apartment class="h-6 w-6" />
    {:else}
      <House class="h-6 w-6" />
    {/if}
  </button>
</div>

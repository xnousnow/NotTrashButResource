<script lang="ts">
  import AddPhotoAlternate from '~icons/material-symbols/AddPhotoAlternate'
  import Title from '~icons/material-symbols/Title'
  import { image } from '../stores'
  import { goto } from '$app/navigation'

  export let imageFile: File
  export let video: HTMLVideoElement

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
</script>

<div class="mx-auto flex h-32 w-full max-w-96 items-center justify-around">
  <button class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
    <AddPhotoAlternate class="h-6 w-6" />
  </button>
  <button
    class="h-14 w-14 rounded-full bg-white outline outline-4 outline-offset-2"
    on:click={capture}
  ></button>
  <button class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
    <Title class="h-6 w-6" />
  </button>
</div>

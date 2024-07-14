<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { image } from '../stores'

  import { fade } from 'svelte/transition'

  import Info from '~icons/material-symbols/Info'

  import CaptureMenu from '../components/CaptureMenu.svelte'

  let video: HTMLVideoElement

  onMount(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        video.srcObject = stream
      })
      .catch((error) => {
        console.error('Error accessing the camera', error)
      })
  })

  let imageFile: File
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

<div class="flex h-[100dvh] w-full flex-col bg-black p-2 text-white">
  <div class="relative w-full grow overflow-hidden rounded-3xl">
    <button class="absolute left-3 top-3 z-50">
      <Info class="h-6 w-6" />
    </button>
    {#if imageFile}
      <img
        src={URL.createObjectURL(imageFile)}
        alt="Captured"
        class="absolute left-1/2 top-1/2 h-auto min-h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 transform object-cover"
        transition:fade={{ duration: 300 }}
      />
    {:else}
      <video
        bind:this={video}
        class="absolute left-1/2 top-1/2 h-auto min-h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 transform object-cover"
        muted
        autoplay
        playsinline
        transition:fade={{ duration: 300 }}
      ></video>
    {/if}
  </div>
  <CaptureMenu {capture} />
</div>

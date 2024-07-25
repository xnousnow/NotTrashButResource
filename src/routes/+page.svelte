<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { blur, fade } from 'svelte/transition'

  import Info from '~icons/material-symbols/Info'
  import CaptureMenu from '$components/CaptureMenu.svelte'

  let video: HTMLVideoElement
  let imageFile: File

  const startCam = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        video.srcObject = stream
      })
      .catch((error) => {
        console.error('Error accessing the camera', error)
        alert('Unable to access camera. Please check your permissions.')
      })
  }

  const restartCam = () => {
    if (video?.srcObject) {
      ;(video.srcObject as MediaStream).getTracks().forEach((track) => track.stop())
    }
    startCam()
  }

  const handleVisibilityChange = () => {
    if (document?.hidden) {
      if (video?.srcObject) {
        ;(video.srcObject as MediaStream).getTracks().forEach((track) => track.stop())
      }
    } else {
      restartCam()
    }
  }

  const handleFocus = () => {
    restartCam()
  }

  onMount(() => {
    startCam()
  })

  onDestroy(() => {
    if (video?.srcObject) {
      ;(video.srcObject as MediaStream).getTracks().forEach((track) => track.stop())
    }
  })
</script>

<svelte:window on:focus={handleFocus} />
<svelte:document on:visibilitychange={handleVisibilityChange} />

<div class="absolute left-0 top-0 flex h-full w-full flex-col p-2" transition:blur>
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
  <CaptureMenu {imageFile} {video} />
</div>

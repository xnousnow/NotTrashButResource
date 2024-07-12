<script lang="ts">
  import { onMount } from 'svelte'

  import Photo from '~icons/material-symbols/Add-Photo-Alternate'
  import Title from '~icons/material-symbols/Title'
  import Info from '~icons/material-symbols/Info'

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

  const capture = () => {}
</script>

<div class="flex h-[100dvh] w-full flex-col bg-black p-2 text-white">
  <div class="relative w-full grow overflow-hidden rounded-3xl">
    <button class="absolute left-3 top-3 z-50">
      <Info class="h-6 w-6" />
    </button>
  </div>
  <div class="relative w-full grow overflow-hidden rounded-3xl">
    <video
      bind:this={video}
      class="absolute left-1/2 top-1/2 h-auto min-h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 transform object-cover"
      playsinline
      autoplay
      muted
    ></video>
  </div>
  <div class="mx-auto flex h-32 w-full max-w-96 items-center justify-around">
    <button class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
      <Photo class="h-6 w-6" />
    </button>
    <button
      class="h-14 w-14 rounded-full bg-white outline outline-4 outline-offset-2"
      on:click={capture}
    ></button>
    <button class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
      <Title class="h-6 w-6" />
    </button>
  </div>
</div>

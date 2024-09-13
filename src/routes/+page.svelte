<script lang="ts">
  import { onMount } from 'svelte'
  import { blur, fade } from 'svelte/transition'

  import Apartment from '~icons/material-symbols/Apartment'
  import House from '~icons/material-symbols/House'

  import CaptureMenu from '$components/CaptureMenu.svelte'

  import { isApartment, localStorageLoaded } from '$lib/stores'

  let video: HTMLVideoElement
  let imageFile: File

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
</script>

<div
  class="absolute left-0 top-0 flex h-full w-full flex-col p-2"
  transition:blur={{ duration: 300 }}
>
  <div class="relative w-full grow overflow-hidden rounded-3xl">
    <div class="absolute z-50 flex w-full p-3">
      <button
        class="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20 p-2 duration-200 hover:bg-white/30"
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

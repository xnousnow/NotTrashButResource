<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { quintOut } from 'svelte/easing'
  import { blur, fly } from 'svelte/transition'

  import autosize from 'svelte-autosize'

  import Apartment from '~icons/material-symbols/Apartment'
  import House from '~icons/material-symbols/House'
  import Search from '~icons/material-symbols/Search'

  import CaptureMenu from '$components/CaptureMenu.svelte'

  import { inputMode, inputStore, isApartment, localStorageLoaded } from '$lib/stores'

  let video: HTMLVideoElement
  let imageFile: File

  let textInput = ''

  let autocomplete: string[]
  $: suggestions = autocomplete?.filter((item) => item.includes(textInput))

  const initializeCamera = async () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then((stream) => {
        video.srcObject = stream
      })
      .catch((error) => {
        console.error('Error accessing the camera', error)
      })
  }

  onMount(async function () {
    inputMode.subscribe((value) => {
      if (value === 'image') {
        initializeCamera()
        inputStore.set(textInput)
      }
    })

    autocomplete = await fetch('/api/get-names', { method: 'POST' }).then((res) => res.json())
  })

  function focusOnElement(node: HTMLElement) {
    node.focus()
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      capture()
    }
  }

  const upload = (event: Event) => {
    const inputElement = event.target as HTMLInputElement
    if (inputElement.files && inputElement.files[0]) {
      imageFile = inputElement.files[0]
      inputStore.set(imageFile)
      goto('/guide')
    }
  }

  const capture = () => {
    if ($inputMode === 'image') {
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
        inputStore.set(imageFile)
        goto('/guide')
      }, 'image/jpeg')
    } else if ($inputMode === 'text') {
      inputStore.set(textInput)
      goto('/guide')
    }
  }
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
    <input
      type="file"
      accept="image/*"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0"
      on:change={upload}
    />
    <div class="relative h-full w-full">
      {#if $inputMode === 'image'}
        <div
          in:blur={{ duration: 300, delay: 80 }}
          out:blur={{ duration: 300 }}
          class="absolute left-0 top-0 h-full w-full bg-black/50"
        >
          <video
            bind:this={video}
            class="absolute left-1/2 top-1/2 h-auto min-h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 transform object-cover"
            muted
            autoplay
            playsinline
          ></video>
        </div>
      {:else if $inputMode === 'text'}
        <div
          class="absolute left-0 top-0 h-full w-full px-3 pt-20"
          in:fly={{ y: 30, duration: 300, easing: quintOut, delay: 80 }}
          out:fly={{ y: 30, duration: 300, easing: quintOut }}
        >
          <label class="block h-full cursor-text">
            <textarea
              use:focusOnElement
              use:autosize
              class="w-full resize-none bg-transparent text-4xl font-medium placeholder:text-white/60 focus:outline-none"
              placeholder={'분리배출할 물건을\n입력해주세요'}
              bind:value={textInput}
              on:keydown={handleKeydown}
            ></textarea>
            {#if textInput.length > 0}
              <div class="flex flex-wrap gap-2">
                {#each suggestions as suggestion}
                  <button
                    class="flex shrink-0 items-center gap-1 rounded-xl bg-white/20 px-2 py-1 text-xl"
                    transition:blur|global={{ duration: 200, delay: 200 }}
                    on:click={() => {
                      textInput = suggestion
                      capture()
                    }}
                  >
                    <Search class="h-5 w-5" />
                    {suggestion}
                  </button>
                {/each}
              </div>
            {/if}
          </label>
        </div>
      {/if}
    </div>
  </div>
  <CaptureMenu {upload} {capture} />
</div>

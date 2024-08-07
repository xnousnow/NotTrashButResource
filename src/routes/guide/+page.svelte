<script lang="ts">
  import { onMount } from 'svelte'
  import { blur } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import { image, isApartment } from '$lib/stores'
  import ArrowBack from '~icons/material-symbols/ArrowBack'
  import AutoAwesome from '~icons/material-symbols/AutoAwesome'
  import ResultSkeletonLoader from '$components/ResultSkeletonLoader.svelte'
  import ResultDisplay from '$components/ResultDisplay.svelte'
  import IssuesDisplay from '$components/IssuesDisplay.svelte'
  import { resizeImage, useAPI } from './processImage'

  let response: any
  let generating = true
  let error = false

  let resized: string

  const generate = async () => {
    if (!$image) await goto('/')

    generating = true
    error = false

    try {
      if (!resized) resized = await resizeImage($image!, 512, 512)
      response = await useAPI(resized, $isApartment)

      if (response.message) {
        response = null
        error = true
      }
    } catch {
      error = true
    } finally {
      generating = false
    }
  }

  onMount(async () => {
    await generate()
  })
</script>

<div class="absolute left-0 top-0 flex h-full w-full flex-col gap-2 p-2" transition:blur>
  <a href="/">
    <ArrowBack class="h-6 w-6" />
  </a>
  {#if $image}
    <div class="relative overflow-hidden rounded-3xl">
      <img
        src={URL.createObjectURL($image)}
        alt="Captured"
        class="h-full max-h-[30vh] w-full object-cover duration-300"
        class:generating
      />
      {#if generating}
        <div
          class="absolute left-0 top-0 flex h-full w-full items-center justify-center opacity-50"
          out:blur={{ duration: 300 }}
        >
          <AutoAwesome class="h-16 w-16 animate-pulse" />
        </div>
      {/if}
    </div>
  {/if}
  <div
    class="grow [-ms-overflow-style:none] [scrollbar-width:0] [&::-webkit-scrollbar]:hidden"
    class:overflow-y-scroll={!generating}
  >
    <div class="relative">
      {#if generating}
        <ResultSkeletonLoader />
      {:else if error || response.issues && Object.values(response.issues).some(value => value)}
        <IssuesDisplay {response} {error} regenerate={generate} />
      {:else}
        <ResultDisplay {response} regenerate={generate} />
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  .generating {
    @apply scale-110 animate-pulse opacity-70 blur;
  }
</style>

<script lang="ts">
  import { onMount } from 'svelte'
  import { blur, fly } from 'svelte/transition'
  import { backOut } from 'svelte/easing'
  import { goto } from '$app/navigation'

  import ArrowBack from '~icons/material-symbols/ArrowBack'
  import AutoAwesome from '~icons/material-symbols/AutoAwesome'

  import ResultDisplay from '$components/ResultDisplay.svelte'
  import ErrorDisplay from '$components/ErrorDisplay.svelte'
  import ParticleEffect from '$components/ParticleEffect.svelte'

  import { image, isApartment } from '$lib/stores'
  import { useAPI } from '$utils/useAPI'

  import type {
    ObjectResponseData,
    GuideResponseData,
    ErrorResponseData,
    ResultObject,
    ErrorInterface
  } from '../api/guide/types'

  let generating = true

  let objects: string[] = []
  let guides: ResultObject[] = []
  let error: ErrorInterface = { error: false }

  const generate = async () => {
    if (!$image) goto('/')

    generating = true
    error = { error: false }
    objects = []
    guides = []

    try {
      useAPI(
        $image!,
        $isApartment,
        function (data: ObjectResponseData) {
          objects = data.objects
        },
        function (data: GuideResponseData) {
          guides = [...data.guide]
        },
        function (data: ErrorResponseData) {
          error = data
        },
        () => {
          generating = false
        }
      )
    } catch {
      error = { error: true, errors: { other: true } }
      generating = false
    }
  }

  onMount(async () => {
    await generate()
  })
</script>

<div class="absolute left-0 top-0 h-full w-full" transition:blur={{ duration: 300 }}>
  {#if generating}
    <div
      class="absolute left-0 top-0 flex h-full w-full overflow-hidden"
      transition:fly={{ y: 30, duration: 300 }}
    >
      {#if $image}
        <img
          src={URL.createObjectURL($image)}
          alt="Captured"
          class="h-full w-full scale-110 object-cover opacity-70 blur-lg"
        />
      {/if}
      <ParticleEffect />
      {#if objects.length}
        <ul
          class="absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center text-3xl font-bold opacity-50"
          transition:blur={{ duration: 300 }}
        >
          {#each objects as object, i}
            <li
              class="animate-pulse duration-500 ease-out"
              in:fly|global={{ y: 30, duration: 500, delay: i * 75, easing: backOut }}
            >
              {object}
            </li>
          {/each}
        </ul>
      {:else if generating}
        <div
          class="absolute left-0 top-0 flex h-full w-full items-center justify-center opacity-50"
          out:fly={{ y: -30, duration: 300 }}
        >
          <AutoAwesome class="h-16 w-16 animate-pulse" />
        </div>
      {/if}
    </div>
  {:else}
    <div
      class="absolute left-0 top-0 flex h-full w-full flex-col gap-2 p-2 pb-0"
      transition:blur={{ duration: 300 }}
    >
      <a href="/">
        <ArrowBack class="h-6 w-6" />
      </a>
      {#if $image}
        <div class="relative overflow-hidden rounded-3xl">
          <img
            src={URL.createObjectURL($image)}
            alt="Captured"
            class="h-full max-h-[30vh] w-full object-cover"
          />
        </div>
      {/if}
      <div
        class="grow [-ms-overflow-style:none] [scrollbar-width:0] [&::-webkit-scrollbar]:hidden"
        class:overflow-y-scroll={!generating}
      >
        <div class="relative">
          {#if error.error}
            <ErrorDisplay {error} usePlural={objects.length > 1} regenerate={generate} />
          {:else}
            <ResultDisplay {guides} regenerate={generate} />
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

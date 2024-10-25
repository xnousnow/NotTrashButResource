<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { backOut } from 'svelte/easing'
  import { blur, fly } from 'svelte/transition'

  import ArrowBack from '~icons/material-symbols/ArrowBack'
  import AutoAwesome from '~icons/material-symbols/AutoAwesome'

  import ErrorDisplay from '$components/ErrorDisplay.svelte'
  import ParticleEffect from '$components/ParticleEffect.svelte'
  import ResultDisplay from '$components/ResultDisplay.svelte'

  import { input, options } from '$lib/stores'
  import { useAPI } from '$utils/useAPI'

  import type {
    ErrorResponse,
    GuideResponse,
    InfoResponse,
    ObjectsResponse
  } from '$api/guide/types'

  let generating = true

  let objects: string[] = []
  let guides: GuideResponse['data']['guide'] = []
  let error: ErrorResponse['data'] | { error: false } = { error: false }

  $: capturedImageURL = $input ? URL.createObjectURL($input as unknown as Blob) : null

  const generate = async () => {
    generating = true
    error = { error: false }
    objects = []
    guides = []

    try {
      await useAPI(
        {
          image: $input! as unknown as File,
          options: $options
        },
        function (data: ObjectsResponse['data']['objects']) {
          objects = data
        },
        function (data: GuideResponse['data']['guide']) {
          guides = [...data]
        },
        function (data: ErrorResponse['data']) {
          error = data
        },
        function (data: InfoResponse['data']) {
          console.log(data)
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
    if (!$input) goto('/')

    await generate()
  })
</script>

<div class="absolute left-0 top-0 h-full w-full" transition:blur={{ duration: 300 }}>
  {#if generating}
    <div
      class="absolute left-0 top-0 flex h-full w-full overflow-hidden"
      transition:fly={{ y: 30, duration: 300 }}
    >
      <img
        src={capturedImageURL}
        alt="Captured"
        class="h-full w-full scale-110 object-cover opacity-70 blur-lg"
      />
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
      <div class="relative overflow-hidden rounded-3xl">
        <img src={capturedImageURL} alt="Captured" class="h-full max-h-[30vh] w-full object-cover" />
      </div>
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

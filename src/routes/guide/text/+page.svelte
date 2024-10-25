<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { blur } from 'svelte/transition'

  import ArrowBack from '~icons/material-symbols/ArrowBack'
  import ProgressActivity from '~icons/material-symbols/ProgressActivity'

  import ErrorDisplay from '$components/ErrorDisplay.svelte'
  import ResultDisplay from '$components/ResultDisplay.svelte'

  import { input, options } from '$lib/stores'
  import { useAPI } from '$utils/useAPI'

  import type {
    ErrorResponse,
    GuideResponse,
    InfoResponse
  } from '$api/guide/types'

  let generating = true

  let guides: GuideResponse['data']['guide'] = []
  let error: ErrorResponse['data'] | { error: false } = { error: false }

  const generate = async () => {
    generating = true
    error = { error: false }
    guides = []

    try {
      await useAPI(
        {
          query: $input as unknown as string,
          options: $options
        },
        () => {},
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
    <div class="flex h-64 w-full items-center justify-center" transition:blur={{ duration: 300 }}>
      <ProgressActivity class="h-8 w-8 animate-spin text-white/50" />
    </div>
  {:else}
    <div
      class="absolute left-0 top-0 flex h-full w-full flex-col gap-2 p-2 pb-0"
      transition:blur={{ duration: 300 }}
    >
      <a href="/">
        <ArrowBack class="h-6 w-6" />
      </a>
      <div
        class="grow [-ms-overflow-style:none] [scrollbar-width:0] [&::-webkit-scrollbar]:hidden"
        class:overflow-y-scroll={!generating}
      >
        <div class="relative pt-8">
          {#if error.error}
            <ErrorDisplay {error}  regenerate={generate} />
          {:else}
            <ResultDisplay {guides} regenerate={generate} />
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

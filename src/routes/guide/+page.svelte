<script lang="ts">
  import { onMount } from 'svelte'
  import { blur, fly } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import { image, isApartment } from '$lib/stores'
  import ArrowBack from '~icons/material-symbols/ArrowBack'
  import AutoAwesome from '~icons/material-symbols/AutoAwesome'
  import ResultDisplay from '$components/ResultDisplay.svelte'
  import IssuesDisplay from '$components/IssuesDisplay.svelte'
  import { resizeImage, useAPI } from '$lib/useAPI'
  import type {
    FullError,
    IdentifiedObjects,
    ObjectError,
    ObjectGuide,
    EachObject
  } from '../api/guide/types'

  let generating = true
  let resized: string

  let objects: string[] = []
  let guides: EachObject[] = []
  let error: FullError = { error: false }

  let imageEffect: HTMLCanvasElement
  let particles: { x: number; y: number; delay: number }[] = []
  let animationId: number
  let shownObjects = 0

  const resizeCanvas = () => {
    imageEffect.width = window.innerWidth
    imageEffect.height = window.innerHeight
    initParticles()
  }

  const initParticles = () => {
    const particleCount = Math.floor(20000 / (window.devicePixelRatio || 1))
    particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * imageEffect.width,
      y: Math.random() * imageEffect.height,
      delay: Math.random() * 2
    }))
  }

  const startEffect = () => {
    resizeCanvas()
    const ctx = imageEffect.getContext('2d')!

    const drawParticles = () => {
      ctx.clearRect(0, 0, imageEffect.width, imageEffect.height)
      particles.forEach(({ x, y, delay }) => {
        const time = Date.now() / 1000 + delay
        const opacity = (Math.sin(time * Math.PI) + 1) / 2
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        ctx.fillRect(x, y, 1, 1)
      })
      requestAnimationFrame(drawParticles)
    }
    drawParticles()
  }

  const stopEffect = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  }

  const generate = async function () {
    if (!$image) await goto('/')

    generating = true
    error = { error: false }
    objects = []
    guides = []
    shownObjects = 0

    setTimeout(() => startEffect(), 0)

    try {
      if (!resized) resized = await resizeImage($image!, 512, 512)
      useAPI(
        resized,
        $isApartment,
        function (data: IdentifiedObjects) {
          objects = data

          for (let i = 0; i < objects.length; i++) {
            setTimeout(() => {
              shownObjects++
            }, i * 100)
          }
        },
        function (data: ObjectGuide) {
          guides.push(data)
          error = { error: false }
        },
        function (data: ObjectError) {
          guides.push(data)
          if (guides.every((g) => 'error' in g)) {
            error = { error: true, errors: { noMatches: true } }
          }
        },
        function (data: FullError) {
          error = data
        },
        function () {
          generating = false
        }
      )
    } catch {
      error = { error: true }
      generating = false
    }
  }

  onMount(async () => {
    startEffect()
    await generate()
    stopEffect()
  })
</script>

<svelte:window on:resize={resizeCanvas} />
<div class="absolute left-0 top-0 h-full w-full" transition:blur={{ duration: 300 }}>
  {#if generating}
    <div
      class="absolute left-0 top-0 flex h-full w-full overflow-hidden"
      transition:fly={{ y: 30, duration: 300 }}
    >
      <img
        src={resized}
        alt="Captured"
        class="h-full w-full scale-110 object-cover opacity-70 blur-lg"
      />
      <button on:click={startEffect} class="absolute left-0 top-0 z-50">re</button>
      <canvas bind:this={imageEffect} class="absolute left-0 top-0 h-full w-full opacity-30" />
      {#if objects.length}
        <ul
          class="absolute left-0 top-0 flex h-full w-full flex-col items-center justify-center text-3xl font-bold opacity-50"
          transition:blur={{ duration: 300 }}
        >
          {#each objects as object, i}
            <li
              class="duration-500 ease-out"
              class:translate-y-5={shownObjects <= i}
              class:opacity-0={shownObjects < i}
            >
              {object}
            </li>
          {/each}
        </ul>
      {:else if generating}
        <div
          class="absolute left-0 top-0 flex h-full w-full items-center justify-center opacity-50"
          out:fly={{ y: 30, duration: 300 }}
        >
          <AutoAwesome class="h-16 w-16 animate-pulse" />
        </div>
      {/if}
    </div>
  {:else}
    <div
      class="absolute left-0 top-0 flex h-full w-full flex-col gap-2 p-2"
      transition:blur={{ duration: 300 }}
    >
      <a href="/">
        <ArrowBack class="h-6 w-6" />
      </a>
      {#if $image}
        <div class="relative overflow-hidden rounded-3xl">
          <img src={resized} alt="Captured" class="h-full max-h-[30vh] w-full object-cover" />
        </div>
      {/if}
      <div
        class="grow [-ms-overflow-style:none] [scrollbar-width:0] [&::-webkit-scrollbar]:hidden"
        class:overflow-y-scroll={!generating}
      >
        <div class="relative">
          {#if error.error || guides.every((g) => 'error' in g)}
            <IssuesDisplay {error} {objects} regenerate={generate} />
          {:else}
            <ResultDisplay {guides} regenerate={generate} />
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>

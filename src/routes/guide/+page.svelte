<script lang="ts">
  import { onMount } from 'svelte'
  import { blur } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import { image } from '../../stores'
  import ArrowBack from '~icons/material-symbols/ArrowBack'
  import AutoAwesome from '~icons/material-symbols/AutoAwesome'
  import CloudOff from '~icons/material-symbols/CloudOff'
  import BrokenImage from '~icons/material-symbols/BrokenImage'
  import ViewInAr from '~icons/material-symbols/ViewInAr'
  import ViewInArOff from '~icons/material-symbols/ViewInArOff'
  import Description from '~icons/material-symbols/Description'
  import Reply from '~icons/material-symbols/Reply'
  import SmallButtonLink from '../../components/SmallButtonLink.svelte'

  const resizeImage = (file: File, maxWidth: number, maxHeight: number) => {
    return new Promise<string>((resolve, reject) => {
      if (!(file instanceof Blob)) {
        reject(new TypeError('The provided value is not a Blob or File.'))
        return
      }

      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result as string
        const img = new Image()
        img.src = base64
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height *= maxWidth / width))
              width = maxWidth
            } else {
              width = Math.round((width *= maxHeight / height))
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL())
        }
        img.onerror = (error) => reject(error)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const useAPI = async (base64: string) => {
    let response = {}
    await fetch('/api/guide', {
      method: 'POST',
      body: JSON.stringify({ image: base64 }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then((r) => {
        return r.json()
      })
      .then((r) => {
        response = r
      })
    return response
  }

  let response: any
  let generating = true
  let error = false

  onMount(async () => {
    if (!$image) await goto('/')

    try {
      const resized = await resizeImage($image!, 512, 512)
      response = await useAPI(resized)

      if (response.message) {
        response = null
        error = true
      }
    } catch {
      error = true
    } finally {
      generating = false
    }
  })
</script>

<div class="flex h-[100dvh] w-full flex-col space-y-2 bg-black p-2 text-white">
  <a href="/">
    <ArrowBack class="h-6 w-6" />
  </a>
  {#if $image}
    <div class="rounded-3xl overflow-hidden relative">
      <img
        src={URL.createObjectURL($image)}
        alt="Captured"
        class="h-full max-h-[30vh] w-full object-cover duration-300"
        class:generating
      />
      {#if generating}
        <div class="absolute top-0 left-0 flex justify-center items-center w-full h-full opacity-50" out:blur={{ duration: 300 }}>
          <AutoAwesome class="h-16 w-16 animate-pulse" />
        </div>
      {/if}
    </div>
  {/if}
  <div class="relative">
    {#if generating}
      <div class="absolute top-0 left-0 space-y-2" transition:blur={{ duration: 300 }}>
        <div class="my-1 h-10 w-48 animate-pulse rounded-xl bg-white/30 pl-1"></div>
        {#each ['w-48', 'w-32', 'w-40'] as width}
          <div class="flex gap-2">
            <div class="h-7 w-8 animate-pulse rounded-full bg-white/30 shrink-0"></div>
            <div class="{width} h-7 animate-pulse rounded-lg bg-white/30"></div>
          </div>
        {/each}
        {#each ['w-56', 'w-32'] as width}
          <div class="flex items-center gap-2">
            <div class="mx-1 h-2 w-6 animate-pulse rounded-full bg-white/30 shrink-0"></div>
            <div class="{width} h-7 animate-pulse rounded-lg bg-white/30"></div>
          </div>
        {/each}
      </div>
    {:else if error}
      <div class="mt-5 text-white/60 space-y-1 text-center" transition:blur={{ duration: 300 }}>
        <CloudOff class="h-16 w-16 mx-auto" />
        <p>결과를 불러오는 데 실패했어요.<br />나중에 다시 시도해 보세요.</p>
      </div>
    {:else if response.issues}
      <div class="mt-5 text-white/60 flex flex-col gap-1 items-center text-center" transition:blur={{ duration: 300 }}>
        {#if Object.keys(response.issues).length === 0}
          <BrokenImage class="h-16 w-16 mx-auto" />
          <p>사진에 여러 문제가 있어요.</p>
        {:else if response.issues.multipleObjects}
          <ViewInAr class="h-16 w-16 mx-auto" />
          <p>사진에 여러 물체가 있어요.</p>
        {:else if response.issues.noObject}
          <ViewInArOff class="h-16 w-16 mx-auto" />
          <p>사진에 물체가 없어요.</p>
        {:else if response.issues.noMatch}
          <Description class="h-16 w-16 mx-auto" />
          {#if response.identified}
            <p><span class="bg-white/20 rounded px-1 py-0.5">{response.identified}</span>이(가) 인식되었지만<br />정확한 정보를 찾지 못했어요.</p>
          {:else}
            <p>물건의 정확한 분리배출 방법을 찾지 못했어요.</p>
          {/if}
        {/if}
        <SmallButtonLink Icon={Reply} text="돌아가기" href='/' />
      </div>
    {:else}
      <div class="absolute top-0 left-0 space-y-2" transition:blur={{ duration: 300 }}>
        <h1 class="my-1 pl-1 text-4xl font-bold">{response.name}</h1>
        <ul class="space-y-2">
          {#each response.guide as step, i}
            <li class="flex items-center gap-2">
              <span
                class="flex w-8 items-center justify-center rounded-full bg-white/20 p-0.5 font-semibold shrink-0"
              >
                {i + 1}
              </span>
              <p class="inline">{step}</p>
            </li>
          {/each}
        </ul>
        {#if response.tips}
          <ul class="mt-2 space-y-2">
            {#each response.tips as tip}
              <li class="flex items-center gap-2">
                <div class="mx-1 h-2 w-6 rounded-full bg-white/20 shrink-0"></div>
                <p class="inline h-7">{tip}</p>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .generating {
    @apply opacity-70 animate-pulse blur scale-110;
  }
</style>

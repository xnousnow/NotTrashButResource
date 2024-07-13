<script lang="ts">
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { image } from '../../stores'
  import ArrowBack from '~icons/material-symbols/ArrowBack'

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

  onMount(async () => {
    if (!$image) await goto('/')

    const resized = await resizeImage($image!, 512, 512)
    response = await useAPI(resized)

    generating = false

    // response = {name: "휴대폰 케이스", guide: ["일반쓰레기로 배출해요.", "잘 씻어요.", "종량제"], tips: ["휴대폰 케이스는 일반쓰레기로 배출해요.", "휴대폰 케이스는 일반쓰레기로 배출해요."]}
  })
</script>

<div class="flex h-[100dvh] w-full flex-col gap-2 bg-black p-2 text-white">
  <a href="/">
    <ArrowBack class="h-6 w-6" />
  </a>
  {#if $image}
    <img
      src={URL.createObjectURL($image)}
      alt="Captured"
      class="h-full max-h-[30vh] w-full rounded-3xl object-cover"
      class:generating={generating}
    />
  {/if}
  {#if generating}
    <div class="flex flex-col gap-2">
      <div class="my-1 pl-1 w-48 h-10 bg-white/30 rounded-xl animate-pulse"></div>
      {#each ['w-48', 'w-32', 'w-40'] as width}
        <div class="flex gap-2">
          <div class="w-8 h-7 rounded-full bg-white/30 animate-pulse"></div>
          <div class="{width} h-7 rounded-lg bg-white/30 animate-pulse"></div>
        </div>
      {/each}
      <div></div>
      {#each ['w-56', 'w-32'] as width}
        <div class="flex gap-2 items-center">
          <div class="mx-1 h-2 w-6 rounded-full bg-white/30 animate-pulse"></div>
          <div class="{width} h-7 rounded-lg bg-white/30 animate-pulse"></div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex flex-col gap-2">
      <h1 class="my-1 pl-1 text-4xl font-bold">{response.name}</h1>
      <ul class="flex flex-col gap-2">
        {#each response.guide as step, i}
          <li class="flex items-center gap-2">
            <span
              class="flex w-8 items-center justify-center rounded-full bg-white/20 p-0.5 font-semibold"
              >{i + 1}</span
            >
            <p class="inline">{step}</p>
          </li>
        {/each}
      </ul>
      <ul class="mt-2 flex flex-col gap-2">
        {#if response.tips}
          {#each response.tips as tip}
            <li class="flex items-center gap-2">
              <div class="mx-1 h-2 w-6 rounded-full bg-white/20"></div>
              <p class="inline h-7">{tip}</p>
            </li>
          {/each}
        {/if}
      </ul>
    </div>
  {/if}
</div>

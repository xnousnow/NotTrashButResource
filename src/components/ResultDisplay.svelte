<script lang="ts">
  import { blur } from 'svelte/transition'
  import Refresh from '~icons/material-symbols/Refresh'
  import SmallButton from '$components/SmallButton.svelte'

  export let response: any
  export let regenerate: () => void
</script>

<div class="absolute left-0 top-0 flex w-full flex-col gap-2" transition:blur={{ duration: 300 }}>
  <h1 class="my-1 pl-1 text-4xl font-bold">{response.name}</h1>
  <ul class="space-y-2">
    {#each response.guide as step, i}
      <li class="flex gap-2">
        <span
          class="flex h-6 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 p-0.5 font-semibold"
        >
          {i + 1}
        </span>
        <p>{step}</p>
      </li>
    {/each}
  </ul>
  {#if response.tips}
    <ul class="mt-2 space-y-2">
      {#each response.tips as tip}
        <li class="flex gap-2">
          <div class="mx-1 mt-2 h-2 w-6 shrink-0 rounded-full bg-white/20"></div>
          <p>{tip}</p>
        </li>
      {/each}
    </ul>
  {/if}
  <div class="mx-auto">
    <SmallButton Icon={Refresh} text="다른 답변 받기" action={regenerate} />
  </div>
</div>

<script lang="ts">
  import { blur, fly } from 'svelte/transition'
  import { backOut } from 'svelte/easing'
  import Refresh from '~icons/material-symbols/Refresh'
  import Description from '~icons/material-symbols/Description'
  import SmallButton from '$components/SmallButton.svelte'
  import ImportContacts from '~icons/material-symbols/ImportContacts'
  import type { ResultObject } from '../routes/api/guide/types'

  export let guides: ResultObject[]
  export let regenerate: () => void
</script>

<div class="absolute left-0 top-0 flex w-full flex-col gap-2" transition:blur={{ duration: 300 }}>
  {#each guides as guide}
    {#if 'guide' in guide}
      <div class="">
        <h1 class="my-1 pl-1 text-4xl font-bold">{guide.name}</h1>
        <span class="my-1 ml-1 flex items-center gap-1 text-base font-medium text-white/50">
          <ImportContacts class="h-6 w-6" />
          {guide.reference.join(', ')}
        </span>
      </div>
      <ul class="space-y-2">
        {#each guide.guide as step, i}
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
      {#if guide.tips}
        <ul class="mt-2 space-y-2">
          {#each guide.tips as tip}
            <li class="flex gap-2">
              <div class="mx-1 mt-2 h-2 w-6 shrink-0 rounded-full bg-white/20"></div>
              <p>{tip}</p>
            </li>
          {/each}
        </ul>
      {/if}
    {:else}
      <div class="flex items-center text-white/60">
        <h1 class="my-1 pl-1 text-2xl font-semibold">{guide.name}</h1>
        <Description class="ml-3 h-6 w-6" />
        <p class="ml-1">정보가 없어요</p>
      </div>
    {/if}
  {/each}
  <div
    class="sticky bottom-0 flex w-full justify-center pb-10 pt-3 backdrop-blur"
    in:fly|global={{ y: 30, duration: 500, easing: backOut, delay: 300 }}
  >
    <SmallButton Icon={Refresh} text="다른 답변 받기" action={regenerate} />
  </div>
</div>

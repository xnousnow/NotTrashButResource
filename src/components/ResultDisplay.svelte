<script lang="ts">
  import { blur } from "svelte/transition";

  export let response: any
</script>

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

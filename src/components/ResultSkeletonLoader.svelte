<script lang="ts">
  import { blur } from 'svelte/transition'
</script>

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

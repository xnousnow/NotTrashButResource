<script lang="ts">
  import type { IconifyIcon } from 'iconify'

  export let Icon: typeof IconifyIcon
  export let text: string | undefined = undefined
  export let action: () => void
</script>

<button
  class="mt-2 flex shrink justify-center gap-1 rounded-full bg-white/20 px-2 py-1 duration-200 hover:bg-white/30"
  class:pr-3={text}
  on:click={action}
>
  <Icon class="h-6 w-6" />
  {#if text}
    <span>{text}</span>
  {/if}
</button>

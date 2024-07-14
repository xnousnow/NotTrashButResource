<script lang="ts">
  export let Icon: any
  export let text: string
  export let action: any
</script>

<button
  class="mt-2 flex shrink justify-center gap-1 rounded-full bg-white/20 py-1 pl-2 pr-3 duration-200 hover:bg-white/30"
  on:click={action}
>
  <Icon class="h-6 w-6" />
  {text}
</button>

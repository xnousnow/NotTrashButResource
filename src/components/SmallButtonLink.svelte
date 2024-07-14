<script lang="ts">
  export let Icon: any
  export let text: string
  export let href: string
</script>

<a
  {href}
  class="mt-2 flex shrink justify-center gap-1 rounded-full bg-white/20 py-1 pl-2 pr-3 duration-200 hover:bg-white/30"
>
  <Icon class="h-6 w-6" />
  {text}
</a>

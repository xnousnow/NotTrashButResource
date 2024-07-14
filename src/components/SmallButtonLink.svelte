<script lang="ts">
  export let Icon: any
  export let text: string
  export let href: string
</script>

<a {href} class="pl-2 pr-3 py-1 bg-white/20 rounded-full flex shrink justify-center gap-1 mt-2">
  <Icon class="h-6 w-6" />
  {text}
</a>

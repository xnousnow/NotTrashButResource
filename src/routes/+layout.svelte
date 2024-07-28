<script>
  import '../app.css'
  import { image, didOnboarding } from '$lib/stores'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  onMount(() => {
    if (!$didOnboarding) goto('/onboarding')
    else if (!$image) goto('/')
    console.log($didOnboarding)
  })
</script>

<div class="relative w-full">
  <slot />
</div>

<style>
  div {
    height: calc(100dvh - env(safe-area-inset-top));
    margin-top: env(safe-area-inset-top);
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);
  }
</style>

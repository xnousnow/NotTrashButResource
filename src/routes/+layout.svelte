<script>
  import '../app.css'
  import { image, didOnboarding } from '$lib/stores'
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'

  onMount(() => {
    if (!$image) goto('/')
    if ($didOnboarding) goto('/onboarding')
    console.log($didOnboarding)
  })
</script>

<div class="relative h-[100dvh] w-full bg-black text-white">
  <slot />
</div>

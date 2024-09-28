<script>
  import '../app.css'
</script>

<div class="relative h-full w-full overflow-hidden">
  <slot />
</div>

<style>
  div {
    height: calc(100dvh - env(safe-area-inset-top));
  }
</style>

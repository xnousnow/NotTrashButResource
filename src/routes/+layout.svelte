<script>
  import '../app.css'
</script>

<div class="relative w-full">
  <slot />
</div>

<style>
  div {
    height: calc(100dvh - env(safe-area-inset-top));
    margin-top: env(safe-area-inset-top);
    padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom)
      env(safe-area-inset-left);
  }
</style>

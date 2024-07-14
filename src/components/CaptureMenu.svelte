<script lang="ts">
  import AddPhotoAlternate from '~icons/material-symbols/AddPhotoAlternate'
  import Title from '~icons/material-symbols/Title'

  export let capture: () => void
</script>

<div class="mx-auto flex h-32 w-full max-w-96 items-center justify-around">
  <button class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
    <AddPhotoAlternate class="h-6 w-6" />
  </button>
  <button
    class="h-14 w-14 rounded-full bg-white outline outline-4 outline-offset-2"
    on:click={capture}
  ></button>
  <button class="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
    <Title class="h-6 w-6" />
  </button>
</div>

<script lang="ts">
  import { blur } from 'svelte/transition'

  import AddPhotoAlternate from '~icons/material-symbols/AddPhotoAlternate'
  import Check from '~icons/material-symbols/Check'
  import Keyboard from '~icons/material-symbols/Keyboard'
  import ViewInAr from '~icons/material-symbols/ViewInAr'

  import { inputMode, localStorageLoaded } from '$lib/stores'

  export let upload: (event: Event) => void
  export let capture: () => void
</script>

<div class="mx-auto flex h-32 w-full max-w-96 items-center justify-around">
  <label
    class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-white/20 duration-200 hover:bg-white/30"
    class:disabled={$inputMode !== 'image'}
  >
    <input
      type="file"
      accept="image/*"
      on:change={upload}
      hidden
      disabled={$inputMode !== 'image'}
    />
    <AddPhotoAlternate class="h-6 w-6" />
  </label>
  <button
    class="flex h-14 w-14 items-center justify-center rounded-full bg-white outline outline-4 outline-offset-2 duration-200 hover:scale-105 active:scale-95 active:outline-offset-4"
    on:click={capture}
  >
    {#if $inputMode === 'text'}
      <div transition:blur={{ duration: 200 }}>
        <Check class="h-8 w-8 text-black" />
      </div>
    {/if}
  </button>
  <button
    class="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20 duration-200 hover:bg-white/30"
    on:click={() => inputMode.set($inputMode === 'image' ? 'text' : 'image')}
  >
    {#if !$localStorageLoaded}
      <div transition:blur={{ duration: 200, amount: 2 }} class="absolute"></div>
    {:else if $inputMode === 'image'}
      <div transition:blur={{ duration: 200, amount: 2 }} class="absolute">
        <ViewInAr class="h-6 w-6" />
      </div>
    {:else}
      <div transition:blur={{ duration: 200, amount: 2 }} class="absolute">
        <Keyboard class="h-6 w-6" />
      </div>
    {/if}
  </button>
</div>

<style lang="postcss">
  .disabled {
    @apply pointer-events-none opacity-50;
  }
</style>

<script lang="ts">
  import { blur } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import CloudOff from '~icons/material-symbols/CloudOff'
  import ViewInArOff from '~icons/material-symbols/ViewInArOff'
  import PhotoCamera from '~icons/material-symbols/PhotoCamera'
  import BrokenImage from '~icons/material-symbols/BrokenImage'
  import Refresh from '~icons/material-symbols/Refresh'
  import SmallButton from './SmallButton.svelte'
  import type { ErrorResponseData } from '../routes/api/guide/types'

  export let error: ErrorResponseData
  export let regenerate: () => void
</script>

<div
  class="mt-5 flex flex-col items-center gap-1 text-center text-white/60"
  transition:blur={{ duration: 300 }}
>
  {#if error.errors?.noObjects}
    <ViewInArOff class="mx-auto h-16 w-16" />
    <p>사진에 물건이 없어요.</p>
  {:else if error.errors?.other}
    <BrokenImage class="mx-auto h-16 w-16" />
    <p>이미지에 문제가 있어요.<br />물건이 잘 보이도록 다시 찍어주세요.</p>
  {:else}
    <CloudOff class="mx-auto h-16 w-16" />
    <p>결과를 불러오는 데 실패했어요.<br />나중에 다시 시도해 보세요.</p>
  {/if}
  <div class="flex gap-1.5">
    <SmallButton
      Icon={PhotoCamera}
      action={() => {
        goto('/')
      }}
    />
    <SmallButton Icon={Refresh} text="다시 시도" action={regenerate} />
  </div>
</div>

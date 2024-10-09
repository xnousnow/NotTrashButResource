<script lang="ts">
  import { goto } from '$app/navigation'
  import { blur } from 'svelte/transition'

  import BrokenImage from '~icons/material-symbols/BrokenImage'
  import CloudOff from '~icons/material-symbols/CloudOff'
  import Description from '~icons/material-symbols/Description'
  import Keyboard from '~icons/material-symbols/Keyboard'
  import PhotoCamera from '~icons/material-symbols/PhotoCamera'
  import Refresh from '~icons/material-symbols/Refresh'
  import SearchOff from '~icons/material-symbols/SearchOff'
  import ViewInArOff from '~icons/material-symbols/ViewInArOff'

  import SmallButton from '$components/SmallButton.svelte'

  import { inputMode } from '$lib/stores'

  import type { ErrorResponseData as ImageErrorResponseData } from '$lib/ai/types'
  import type { TextErrorResponseData } from '$lib/ai/types'

  export let error: ImageErrorResponseData & TextErrorResponseData
  export let usePlural: boolean
  export let regenerate: () => void
</script>

<div
  class="mt-5 flex flex-col items-center gap-1 text-center text-white/60"
  transition:blur={{ duration: 300 }}
>
  {#if error.errors?.noObjects}
    <ViewInArOff class="mx-auto h-16 w-16" />
    <p>사진에 물건이 없어요.</p>
  {:else if error.errors?.noMatches}
    <Description class="mx-auto h-16 w-16" />
    {#if $inputMode === 'image'}
      <p>물건{usePlural ? '들' : ''}을 인식했지만<br />정확한 정보를 찾지 못했어요.</p>
    {:else}
      <p>정확한 정보를 찾지 못했어요.</p>
    {/if}
  {:else if error.errors?.imageError}
    <BrokenImage class="mx-auto h-16 w-16" />
    <p>물건을 인식할 수 없어요.<br />물건이 잘 보이도록 다시 찍어주세요.</p>
  {:else if error.errors?.unrelated}
    <SearchOff class="mx-auto h-16 w-16" />
    <p>분리배출할 물건을<br />정확히 입력해주세요.</p>
  {:else if error.errors?.other}
    <CloudOff class="mx-auto h-16 w-16" />
    <p>기타 오류가 발생했어요.<br />나중에 다시 시도해보세요.</p>
  {:else}
    <CloudOff class="mx-auto h-16 w-16" />
    <p>결과를 불러오는 데 실패했어요.<br />인터넷 연결을 확인해주세요.</p>
  {/if}
  <div class="flex gap-1.5">
    <SmallButton
      Icon={$inputMode === 'image' ? PhotoCamera : Keyboard}
      action={() => {
        goto('/')
      }}
    />
    <SmallButton Icon={Refresh} text="다시 시도" action={regenerate} />
  </div>
</div>

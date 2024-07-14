<script lang="ts">
  import { blur } from 'svelte/transition'
  import { goto } from '$app/navigation'
  import CloudOff from '~icons/material-symbols/CloudOff'
  import ViewInAr from '~icons/material-symbols/ViewInAr'
  import ViewInArOff from '~icons/material-symbols/ViewInArOff'
  import Description from '~icons/material-symbols/Description'
  import BrokenImage from '~icons/material-symbols/BrokenImage'
  import SmartToy from '~icons/material-symbols/SmartToy'
  import Reply from '~icons/material-symbols/Reply'
  import SmallButtonLink from './SmallButton.svelte'

  export let response: any
  export let error: boolean
</script>

<div
  class="mt-5 flex flex-col items-center gap-1 text-center text-white/60"
  transition:blur={{ duration: 300 }}
>
  {#if error}
    <CloudOff class="mx-auto h-16 w-16" />
    <p>결과를 불러오는 데 실패했어요.<br />나중에 다시 시도해 보세요.</p>
  {:else if Object.keys(response.issues).length === 0}
    <BrokenImage class="mx-auto h-16 w-16" />
    <p>사진에 여러 문제가 있어요.</p>
  {:else if response.issues.multipleObjects}
    <ViewInAr class="mx-auto h-16 w-16" />
    <p>사진에 여러 물체가 있어요.</p>
  {:else if response.issues.noObject}
    <ViewInArOff class="mx-auto h-16 w-16" />
    <p>사진에 물체가 없어요.</p>
  {:else if response.issues.noMatch}
    <Description class="mx-auto h-16 w-16" />
    <p>
      <span class="rounded bg-white/20 px-1 py-0.5">{response.identified}</span>이(가) 인식되었지만<br
      />정확한 정보를 찾지 못했어요.
    </p>
  {:else}
    <SmartToy class="mx-auto h-16 w-16" />
    <p>기타 오류가 발생했어요.</p>
  {/if}
  <SmallButtonLink Icon={Reply} text="돌아가기" action={() => {goto('/')}} />
</div>

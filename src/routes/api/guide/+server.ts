import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { RequestHandler } from './$types'
import { createClient } from '@supabase/supabase-js'
import { env } from '$env/dynamic/private'

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY ?? '')

export const POST: RequestHandler = async ({ request }) => {
  const { image } = await request.json()

  // 이름 가져오기
  const { data: guidebookNamesData } = await supabase.from('guidebook').select('name')
  const guidebookNames = guidebookNamesData?.map(({ name }) => name) ?? []

  const identificationPrompt = [
    '다음 중 이미지의 물건을 가장 잘 나타내는 항목을 고르세요.',
    '- `result`에는 다음 항목에 있는 물건만 포함하세요.',
    '- 모든 답변은 한국어로 작성하세요.',
    '',
    `> ${guidebookNames.join(', ')}`
  ].join('\n')

  // 물건 인식하기
  const identificationResult = await generateObject({
    model: openai('gpt-4o'),
    messages: [
      { role: 'system', content: identificationPrompt },
      { role: 'user', content: [{ type: 'image', image }] }
    ],
    schema: z.object({
      result: z
        .array(z.string().describe('위 중 이미지의 물건을 가장 잘 나타내는 항목, 재질 등이 다르다면 noMatch를 선택하세요'))
        .max(2)
        .optional(),
      identified: z.string().describe('(항목과 상관없이) 이미지에 나타난 물건'),
      issues: z
        .object({
          multipleObjects: z.boolean().optional().describe('이미지에 여러 물건이 있음'),
          noObject: z.boolean().optional().describe('이미지에 물건이 없음'),
          noMatch: z.boolean().optional().describe('항목에 일치하는 물건이 없음')
        })
        .optional()
        .describe('result가 없을 때, 이미지를 인식할 수 없을 때')
    })
  })

  // 가이드에서 인식된 물건 찾기
  const { data: selectedGuidesData } = await supabase
    .from('guidebook')
    .select('*')
    .in('name', identificationResult.object.result!)
  const selectedGuides = selectedGuidesData?.map(({ name, guide, tips }) => ({ name, guide, tips }))

  // 오류 처리
  if (
    identificationResult.object.issues && // 인식 오류
    Object.keys(identificationResult.object.issues).length > 0
  ) {
    return new Response(JSON.stringify(identificationResult.object))
  } else if (!selectedGuides || selectedGuides.length === 0) {
    // 가이드 없음
    identificationResult.object.issues = { noMatch: true }
    return new Response(JSON.stringify(identificationResult))
  }

  const formattedGuides = selectedGuides.map(
    ({ name, guide, tips }) => `# ${name}\n\n${guide}\n\n${tips ? `## 팁\n${tips}` : ''}`
  )

  const finalPrompt = [
    '다음 자료를 참고하여 이미지의 물건을 분리배출하는 방법을 안내하세요.',
    '- 문장에는 해요체 (해요, 예요)를 사용하고 마침표를 찍으세요.',
    '- 사용자가 단계를 따라하기 쉽도록 단계를 나누고, 각 단계에는 한 문장으로 동작을 나타내세요.',
    '- 물건에 따라 분리배출하는 방법이 여러 가지라면 선택되지 않은 방법은 팁에 추가할 수 있어요.',
    '- 물건의 상태에 따라 필요없는 단계나 문구를 제거하세요. 예시:',
    ' - 이미지 물건이 이미 세척되어 있다면 세척 단계를 제거합니다.',
    ' - 라벨이 없다면 라벨 단계를 제거합니다.',
    ' - 물건과 상관없는 팁을 제거합니다.',
    '',
    '무조건 분리해 배출하려 시도하지 마세요. 또한 작은 물건은 보통 선별되기 어렵습니다. 만약 다음 자료가 이미지의 물건을 분리배출하는 방법을 잘 설명하지 않는다면, notEnough를 선택하세요.',
    '',
    formattedGuides.join('\n\n')
  ].join('\n')

  // 최종 가이드 생성
  const finalResult = await generateObject({
    model: openai('gpt-4o'),
    messages: [
      { role: 'system', content: finalPrompt },
      { role: 'user', content: [{ type: 'image', image }] }
    ],
    schema: z.object({
      name: z.string().describe('물건의 이름, 1~3 단어 이내로 작성'),
      guide: z
        .array(z.string().describe('한 문장 이내'))
        .describe('단계별 분리배출 안내, 필요없는 단계는 빼세요'),
      tips: z.array(z.string().describe('한 문장 이내')).optional().describe('추가 팁'),
      notEnough: z.boolean().optional().describe('자료가 이미지의 물건을 분리배출하는 방법을 잘 설명하지 않음')
    })
  })

  if (finalResult.object.notEnough) {
    return new Response(JSON.stringify(finalResult.object))
  }

  return new Response(JSON.stringify({ ...finalResult.object, ...identificationResult.object }))
}

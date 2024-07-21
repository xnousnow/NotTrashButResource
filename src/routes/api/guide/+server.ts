import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { RequestHandler } from './$types'
import { createClient } from '@supabase/supabase-js'
import { env } from '$env/dynamic/private'

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY ?? '')

export const POST: RequestHandler = async ({ request }) => {
  const { image, isApartment } = await request.json()

  // 이름 가져오기
  const { data: guidebookNamesData } = await supabase.from('guidebook').select('name')
  const guidebookNames = guidebookNamesData?.map(({ name }) => name) ?? []

  const identificationPrompt = [
    '당신은 사용자의 분리배출을 도와야 합니다. 입력된 사진은 사용자가 분리배출을 원하는 물건입니다. 다음 목록은 분리배출 가이드에서 찾아볼 수 있는 물건들입니다. 물건을 분리배출하기 위해 참고해야 할 항목을 찾으세요. 만약 직접적인 항목이 없다면 재질을 선택하세요. 플라스틱과 비닐을 구분하세요. **답변은 모두 한국어로 작성하세요.**',
    '',
    `> ${guidebookNames.join(', ')}`,
    '',
    ''
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
        .array(
          z
            .string()
            .describe(
              '위 중 이미지의 물건을 가장 잘 나타내는 항목'
            )
        )
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
    }),
    temperature: 0.8
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
    return new Response(JSON.stringify(identificationResult.object))
  }

  const formattedGuides = selectedGuides.map(
    ({ name, guide, tips }) =>
      `## ${name}\n${guide.split('\n').map((line: string, index: number) => `${index + 1}. ${line}`).join('\n')}\n\n${tips ? `### 팁\n${tips.split('\n').join('\n- ')}` : ''}`
  )

  const finalPrompt = [
    `당신은 사용자의 분리배출을 도와야 합니다. 입력된 사진은 사용자가 분리배출을 원하는 물건입니다. 다음 정보를 그대로 출력하되, 사용자의 주거 환경에 맞지 않거나 이미지에 따라 필요없는 단계를 제거하세요. 사용자는 **${isApartment ? '아파트' : '주택'}**에 살고 있습니다. *필요없는 단계는 빼되, 단계나 문장을 추가하지 마세요.*`,
    '',
    formattedGuides.join('\n')
  ].join('\n')

  // 최종 가이드 생성
  const finalResult = await generateObject({
    model: openai('gpt-4o-mini'),
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
      notEnough: z
        .boolean()
        .optional()
        .describe('자료가 이미지의 물건을 분리배출하는 방법을 잘 설명하지 않음')
    }),
    temperature: 0.5
  })

  if (finalResult.object.notEnough) {
    return new Response(JSON.stringify(finalResult.object))
  }

  return new Response(JSON.stringify({ ...finalResult.object, ...identificationResult.object }))
}

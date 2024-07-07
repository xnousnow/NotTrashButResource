import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { RequestHandler } from './$types'

import { createClient } from '@supabase/supabase-js'

import { env } from '$env/dynamic/private'

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY ?? ''
})

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY ?? '')

export const POST = (async ({ request }) => {
  let { image } = await request.json()
  let data

  ({ data } = await supabase.from('guidebook').select('name'))
  let names: string[] = data?.map(({ name }) => name) ?? [];

  const identifyPrompt = `다음 중 이미지의 물건을 가장 잘 나타내는 항목을 고르세요. \`result\`에는 다음 항목에 있는 물건만 포함하세요. 모든 답변은 한국어로 작성하세요.\n\n> ${names.join(', ')}`

  const identifyResult = await generateObject({
    model: openai('gpt-4o'),
    messages: [
      {
        role: 'system',
        content: identifyPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image
          }
        ]
      }
    ],
    schema: z.object({
      result: z
        .array(z.string().describe('이미지의 물건을 가장 잘 나타내는 항목'))
        .max(2)
        .optional(),
      identified: z.string().describe('항목과 상관없이 이미지의 물건'),
      issues: z
        .object({
          multipleObjects: z.boolean().optional().describe('이미지 중심에 여러 물건이 있음'),
          noObject: z.boolean().optional().describe('이미지에 물건이 없음'),
          noMatch: z.boolean().optional().describe('항목에 일치하는 물건이 없음')
        })
        .optional().describe('result가 없을 때, 이미지를 인식할 수 없을 때')
    })
  });

  // select rows where object.result contains name
  ({ data } = await supabase.from('guidebook').select('*').in('name', identifyResult.object.result!));
  const selectedGuides = data?.map(({ name, guide, tips }) => ({ name, guide, tips }))

  if (identifyResult.object.issues && Object.keys(identifyResult.object.issues).length > 0) {
    return new Response(JSON.stringify(identifyResult.object))
  } else if (!selectedGuides || selectedGuides.length === 0) {
    return new Response(JSON.stringify({ supabaseIssue: true }))
  }

  const markdownGuides = selectedGuides?.map(({ name, guide, tips }) => {
    return `# ${name}\n\n${guide}\n\n${tips ? `## 팁\n${tips}` : ''}`
  })

  const finalPrompt =
    [
      '다음 자료를 참고하여 이미지의 물건을 분리배출하는 방법을 안내하세요.',
      '- 문장에는 해요체 (해요, 예요)를 사용하고 마침표를 찍으세요.',
      '- 사용자가 단계를 따라하기 쉽도록 단계를 나누고, 각 단계에는 한 문장으로 동작을 나타내세요.',
      '- 물건에 따라 분리배출하는 방법이 여러 가지라면 선택되지 않은 방법은 팁에 추가할 수 있어요.',
      '- 자료를 똑같이 사용하지 말고 **이미지에 맞춰 단계와 팁을 수정**하세요. 예시:',
      ' - 이미지 물건이 이미 세척되어 있다면 세척 단계를 제거합니다.',
      ' - 라벨이 없다면 라벨 단계를 제거합니다.',
      ' - 물건과 상관없는 팁을 제거합니다.',
      '',
      markdownGuides.join('\n\n')
    ].join('\n')

  const result = await generateObject({
    model: openai('gpt-4o'),
    messages: [
      {
        role: 'system',
        content: finalPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'image',
            image
          }
        ]
      }
    ],
    schema: z.object({
      name: z.string().describe('물건의 이름, 1~3 단어 이내로 작성'),
      guide: z
        .array(z.string().describe('한 문장 이내'))
        .describe('단계별 분리배출 안내, 필요없는 단계는 빼세요'),
      tips: z.array(z.string().describe('한 문장 이내')).optional().describe('추가 팁')
    })
  })

  return new Response(JSON.stringify(result.object))
}) satisfies RequestHandler

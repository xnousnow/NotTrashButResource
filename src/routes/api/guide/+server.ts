import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { z } from 'zod'
import type { RequestHandler } from './$types'

import { env } from '$env/dynamic/private'

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY ?? ''
})

export const POST = (async ({ request }) => {
  let { image } = await request.json()

  const guidebook = [
    {
      id: 'bl',
      name: '스펀지',
      guide: '일반 쓰레기로 배출해요.',
      tips: 'PS가 아닌 재질에 공기를 넣어 만들었기 때문이예요.'
    },
    { id: 'je', name: '고무', guide: '일반 쓰레기로 배출해요.' },
    {
      id: 'mz',
      name: '페트병',
      guide:
        '내용물을 비우고 깨끗이 세척해요. 라벨을 제거해요. 페트병을 최대한 압축시킨 후 뚜껑을 닫아 페트로 배출해요. 유색 페트병은 일반 플라스틱으로 배출해요.',
      tips: '페트병을 최대한 압축시켜 배출하면 운송/압축/보관 과정에 도움이 돼요. 페트병 뚜껑은 닫고 함께 버려도, 따로 분리해서 버려도 괜찮아요. 페트병 뚜껑과 링은 제거하지 않아도 파쇄 과정에서 분리되어 괜찮아요.'
    },
    {
      id: 'nh',
      name: '랩',
      guide:
        '가정용 랩(PE)은 깨끗하다면 재활용이 가능해요. 업소용 랩(PVC)은 재활용이 어려워 일반 쓰레기로 배출해요.',
      tips: 'PVC는 태우면 독성 물질이 나와 기계를 부식시키고 대기를 오염시켜요.'
    },
    {
      id: 'ou',
      name: '과일망',
      guide: '일반 쓰레기로 배출해요.',
      tips: 'PS가 아닌 재질에 공기를 넣어 만들었기 때문이예요.'
    },
    {
      id: 'rm',
      name: '아이스팩',
      guide:
        '아이스팩 고흡수성 수지(젤 형태)가 포함된 아이스팩은 일반 쓰레기로 배출해요. 물 아이스팩은 내용물을 모두 비우면 비닐로 배출할 수 있어요.',
      tips: '아이스팩 겉면에 고흡수성 수지 포함 여부가 표기되어 있어요.'
    },
    {
      id: 'tn',
      name: '레고',
      guide: '일반 쓰레기로 배출해요.',
      tips: '레고는 고급 플라스틱인 ABS 재질이어서 따로 모은다면 가능하지만 현재는 선별이 어렵습니다.'
    }
  ]
  const names = guidebook.map(({ name }) => name)

  let prompt = `다음 중 이미지의 물건을 가장 잘 나타내는 항목을 고르세요. \`result\`에는 다음 항목에 있는 물건만 포함하세요. 모든 답변은 한국어로 작성하세요.\n\n> ${names.join(', ')}`
  console.log(prompt)

  const result = await generateObject({
    model: openai('gpt-4o'),
    messages: [
      {
        role: 'system',
        content: prompt
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
        .array(
          z.string().describe('항목의 정확한 이름, 항목이 없다면 최대한 가까운 항목을 고르세요')
        )
        .max(2)
        .optional(),
      identified: z.string().describe('이미지의 물건'),
      issues: z
        .object({
          multipleObjects: z.boolean().optional().describe('이미지 중심에 여러 물건이 있음'),
          noObject: z.boolean().optional().describe('이미지에 물건이 없음'),
          noMatch: z.boolean().optional().describe('항목에 일치하는 물건이 없음')
        })
        .optional()
    })
  })

  return new Response(JSON.stringify(result))
}) satisfies RequestHandler

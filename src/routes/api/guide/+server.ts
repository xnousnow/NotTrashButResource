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
      tips: 'PS가 아닌 재질에 공기를 넣어 만들었기 때문이에요.'
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
        '고흡수성 수지(젤 형태)가 포함된 아이스팩은 일반 쓰레기로 배출해요. 물 아이스팩은 내용물을 모두 비우고 비닐로 배출할 수 있어요.',
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

  const identifyPrompt = `다음 중 이미지의 물건을 가장 잘 나타내는 항목을 고르세요. \`result\`에는 다음 항목에 있는 물건만 포함하세요. 모든 답변은 한국어로 작성하세요.\n\n> ${names.join(', ')}`
  console.log(identifyPrompt)

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
        .optional()
    })
  })

  if (identifyResult.object.issues && Object.keys(identifyResult.object.issues).length > 0) {
    return new Response(JSON.stringify(identifyResult.object))
  }

  const selectedGuides = guidebook.filter(({ name }) =>
    identifyResult.object.result?.includes(name)
  )
  console.log(identifyResult.object)
  console.log(selectedGuides)
  const markdownGuides = selectedGuides.map(({ name, guide, tips }) => {
    return `# ${name}\n\n${guide}\n\n${tips ? `## 팁\n${tips}` : ''}`
  })
  const finalPrompt =
    [
      '다음 자료를 참고하여 이미지의 물건을 분리배출하는 방법을 안내하세요.',
      '- 문장에는 해요체 (해요, 예요)를 사용하고 마침표를 찍으세요.',
      '- 자료를 똑같이 사용하지 말고 **이미지에 맞춰 단계와 팁을 수정**하세요. 예시:',
      ' - 이미지 물건이 이미 세척되어 있다면 세척 단계를 제거합니다.',
      ' - 라벨이 없다면 라벨 단계를 제거합니다.',
      ' - 물건과 상관없는 팁을 제거합니다.',
      '',
      markdownGuides.join('\n\n')
    ].join('\n')
  console.log(finalPrompt)

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

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

  const guidebook: { id: string; name: string; guide: string; tips?: string }[] = []
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

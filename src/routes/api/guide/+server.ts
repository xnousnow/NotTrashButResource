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

  const result = await generateObject({
    model: openai('gpt-4o'),
    messages: [
      {
        role: 'system',
        content: 'Identify the object in the image.'
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
      object: z.string()
    })
  })

  return new Response(JSON.stringify(result))
}) satisfies RequestHandler

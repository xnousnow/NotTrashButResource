import { createOpenAI } from '@ai-sdk/openai'
import { StreamingTextResponse, streamText } from 'ai'
import type { RequestHandler } from './$types'

import { env } from '$env/dynamic/private'

const openai = createOpenAI({
  apiKey: env.OPENAI_API_KEY ?? ''
})

export const POST = (async ({ request }) => {
  const { messages } = await request.json()

  const result = await streamText({
    model: openai('gpt-4o'),
    messages
  })

  return result.toAIStreamResponse()
}) satisfies RequestHandler

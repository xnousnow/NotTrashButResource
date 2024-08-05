import { env } from '$env/dynamic/private'
import { getIdentificationPrompt, getFinalPrompt } from '$lib/prompts'
import { createOpenAI } from '@ai-sdk/openai'
import { createClient } from '@supabase/supabase-js'
import { generateText, streamText } from 'ai'
import type { RequestHandler } from './$types'

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY ?? '')

async function identifyObjects(image: string, guidebookNames: string[]): Promise<string> {
  const result = await generateText({
    model: openai(env.IMAGE_IDENTIFICATION_MODEL ?? 'gpt-4o'),
    messages: getIdentificationPrompt(guidebookNames, image)
  })
  return result.text
}

async function fetchGuidebookData(
  categories: string[]
): Promise<{ name: string; guide: string; tips?: string }[]> {
  const { data: retrievedGuides } = await supabase
    .from('guidebook')
    .select('*')
    .in('name', categories)
  return retrievedGuides?.map(({ name, guide, tips }) => ({ name, guide, tips })) || []
}

async function generateGuide(
  isApartment: boolean,
  identificationResult: string,
  guide: { name: string; guide: string; tips?: string }[]
): Promise<{ textStream: ReadableStream<string> }> {
  return streamText({
    model: openai(env.GUIDE_GENERATION_MODEL ?? 'gpt-4o'),
    messages: getFinalPrompt(isApartment, identificationResult, guide)
  })
}

async function processStream(
  result: { textStream: ReadableStream<string> },
  controller: ReadableStreamDefaultController<string>
) {
  const reader = result.textStream.getReader()
  let buffer = ''
  let isExpectingMoreData = true

  while (isExpectingMoreData) {
    const { done, value } = await reader.read()
    isExpectingMoreData = !done

    if (value) {
      buffer += value

      buffer = buffer.replace(/\n+/g, '\n')
      let newlineIndex

      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const jsonString = buffer.slice(0, newlineIndex).trim()
        buffer = buffer.slice(newlineIndex + 1)

        if (jsonString) {
          try {
            const object = JSON.parse(jsonString)
            controller.enqueue(JSON.stringify(object))
          } catch (error) {
            console.error('Error parsing JSON:', error, jsonString)
          }
        }
      }
    }
  }

  if (buffer.trim()) {
    try {
      const object = JSON.parse(buffer.trim())
      controller.enqueue(JSON.stringify(object))
    } catch (error) {
      console.error('Error parsing JSON:', error, buffer)
      controller.enqueue(JSON.stringify({ error: true, errors: { generation: true } }))
    }
  }
}

async function handleRequest(request: Request): Promise<Response> {
  const { image, isApartment } = await request.json()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { data: guidebookNamesData } = await supabase.from('guidebook').select('name')
        const guidebookNames = guidebookNamesData?.map(({ name }) => name) ?? []

        const identificationResult = await identifyObjects(image, guidebookNames)

        if (identificationResult.includes('물건 없음') || identificationResult.includes('오류')) {
          controller.enqueue(
            JSON.stringify({
              error: true,
              errors: {
                noObject: identificationResult.includes('물건 없음'),
                other: identificationResult.includes('오류')
              }
            })
          )
        } else {
          const objects = identificationResult.split('\n')[1].split(', ')
          const categories = identificationResult
            .split('\n')
            .slice(2)
            .map((line) => {
              const parts = line.split(': ')
              return parts.length > 1 ? parts[1].split(', ') : []
            })

          controller.enqueue(JSON.stringify(objects))

          const guide = await fetchGuidebookData(categories.flat())
          const result = await generateGuide(isApartment, identificationResult, guide)

          await processStream(result, controller)
        }
      } catch (error) {
        console.error('Error in processing:', error)
        controller.enqueue(JSON.stringify({ error: true, errors: { processing: true } }))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    }
  })
}

export const POST: RequestHandler = ({ request }) => handleRequest(request)

import { env } from '$env/dynamic/private'

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { imageIdentificationMessages, categorizationMessages, guideMessages } from '$lib/ai/prompts'
import {
  imageIdentificationResponseSchema,
  categorizationResponseSchema,
  singleGuideResponseSchema
} from '$lib/ai/schemas'
import type { RetrievedGuide } from '$lib/utils/supabase'

import type { RequestBase } from '$routes/api/guide/types'
import type { ImageIdentificationAIResponse } from './types'

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })

export const identifyObjects = async (image: string, categories: string[]) =>
  generateObject({
    model: openai('gpt-4o'),
    schema: imageIdentificationResponseSchema,
    messages: imageIdentificationMessages(image, categories)
  })

export const categorizeObject = async (object: string, categories: string[]) =>
  generateObject({
    model: openai('gpt-4o'),
    schema: categorizationResponseSchema,
    messages: categorizationMessages(object, categories)
  })

export const generateGuides = async (
  imageDescription: string,
  identificationResult: Extract<ImageIdentificationAIResponse['result'], object[]>,
  sourceGuides: RetrievedGuide[],
  options: RequestBase['options']
) =>
  generateObject({
    model: openai('gpt-4o-mini'),
    output: 'array',
    schema: singleGuideResponseSchema,
    messages: guideMessages(imageDescription, identificationResult, sourceGuides, options)
  })

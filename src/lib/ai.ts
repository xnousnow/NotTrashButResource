import { env } from '$env/dynamic/private'

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'

import { imageIdentificationMessages, categorizationMessages, guideMessages } from '$lib/prompts'
import {
  imageIdentificationResponseSchema,
  categorizationResponseSchema,
  singleGuideResponseSchema
} from '$lib/schemas'

import type { MatchedIdentifiedObject, RetrievedGuide } from '$lib/types'

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY ?? '' })

export const identifyObjects = async (image: string, categories: string[]) =>
  generateObject({
    model: openai('gpt-4o'),
    schema: imageIdentificationResponseSchema,
    messages: imageIdentificationMessages(image, categories)
  }).then((result) => result.object)

export const categorizeObject = async (object: string, categories: string[]) =>
  generateObject({
    model: openai('gpt-4o'),
    schema: categorizationResponseSchema,
    messages: categorizationMessages(object, categories)
  }).then((result) => result.object.result)

export const generateGuides = async (
  description: string,
  identifiedObjects: MatchedIdentifiedObject[],
  sourceGuides: RetrievedGuide[],
  isApartment: boolean
) =>
  generateObject({
    model: openai('gpt-4o-mini'),
    output: 'array',
    schema: singleGuideResponseSchema,
    messages: guideMessages(
      description ?? '',
      identifiedObjects as MatchedIdentifiedObject[],
      sourceGuides,
      isApartment
    )
  }).then((result) => result.object)

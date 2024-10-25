import { z } from 'zod'

import {
  imageIdentificationResponseSchema,
  categorizationResponseSchema,
  singleGuideResponseSchema
} from './schemas'

export type ImageIdentificationAIResponse = z.infer<typeof imageIdentificationResponseSchema>
export type CategorizationAIResponse = z.infer<typeof categorizationResponseSchema>
export type GuideAIResponse = z.infer<typeof singleGuideResponseSchema>[]

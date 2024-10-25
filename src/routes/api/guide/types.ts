import type { ImageIdentificationAIResponse, GuideAIResponse } from '$lib/ai/types'

export interface RequestBase {
  options: {
    residenceType: 'apartment' | 'house'
  }
}

export interface ImageModeRequest extends RequestBase {
  image: string
}

export interface TextModeRequest extends RequestBase {
  query: string
}

export interface ObjectsResponse {
  type: 'objects'
  data: {
    objects: string[]
  }
}

export interface GuideResponse {
  type: 'guide'
  data: {
    guide: GuideAIResponse
  }
}

export interface ErrorResponse {
  type: 'error'
  data: {
    error: true
    errors: Partial<Extract<ImageIdentificationAIResponse['result'], { error: true }>['errors']> & {
      noMatches?: boolean
      unrelated?: boolean
      server?: boolean
      other?: boolean
    }
  }
}

export interface InfoResponse {
  type: 'info'
  data: {
    usage?: {
      inputTokenUsage: number
      outputTokenUsage: number
    }
    latency: number
  }
}

export type Response = ObjectsResponse | GuideResponse | ErrorResponse | InfoResponse

export interface RetrievedGuide {
  name: string
  guide: string[]
  tips: string[] | null
} // FIXME: duplicated with api/guide/types.ts

export interface ObjectGuide {
  name: string
  guide: string[]
  tips?: string[]
  reference: string[]
} // FIXME: duplicated with api/guide/types.ts

export interface ObjectError {
  name: string
  error: true
  errors: {
    noMatch?: boolean
    other?: boolean
  }
}

export type ResultObject = ObjectGuide | ObjectError

export type ResponseTypes = 'guide' | 'error'

export interface ResponseBase {
  type: ResponseTypes
}

export interface GuideResponseData {
  guide: ResultObject[]
}

export interface GuideResponse extends ResponseBase {
  type: 'guide'
  data: GuideResponseData
}

export interface ErrorResponseData {
  error: true
  errors: {
    unrelated?: boolean
    noMatches?: boolean
    other?: boolean
  }
}

export interface ErrorResponse extends ResponseBase {
  type: 'error'
  data: ErrorResponseData
}

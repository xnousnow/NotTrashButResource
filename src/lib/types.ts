export interface RetrievedGuide {
  name: string
  guide: string[]
  tips: string[] | null
}

// 인식 결과 항목

export interface IdentifiedObjectBase {
  name: string
}

export interface MatchedIdentifiedObject extends IdentifiedObjectBase {
  category: string[]
}

export interface UnmatchedIdentifiedObject extends IdentifiedObjectBase {
  error: true
  errors: {
    noMatch: true
    notReal?: boolean
    other?: boolean
  }
}

export type IdentifiedObject = MatchedIdentifiedObject | UnmatchedIdentifiedObject

// 인식 결과
export interface IdentificationResult {
  description: string
  result: IdentifiedObject[]
}

// 생성된 물건 분리배출 방법
export interface ObjectGuide {
  name: string
  guide: string[]
  tips?: string[]
  reference: string[]
}

// 생성된 물건 오류
export interface ObjectError {
  name: string
  error: true
  errors: {
    noMatch?: boolean
    noGuide?: boolean
    other?: boolean
  }
}

export type ResultObject = ObjectGuide | ObjectError

// 처음 인식된 물건들
export type ResponseTypes = 'objects' | 'guide' | 'error'
export interface ResponseBase {
  type: ResponseTypes
}

// 첫 물건 응답
export interface ObjectResponseData {
  objects: string[]
}

export interface ObjectResponse extends ResponseBase {
  type: 'objects'
  data: ObjectResponseData
}

// 가이드 응답
export interface GuideResponseData {
  guide: ResultObject[]
}

export interface GuideResponse extends ResponseBase {
  type: 'guide'
  data: GuideResponseData
}

// 전체 오류 응답
export interface ErrorResponseData {
  error: true
  errors: {
    noObjects?: boolean
    noMatches?: boolean
    imageError?: boolean
    other?: boolean
  }
}

export interface NoErrorData {
  error: false
}

export type ErrorInterface = ErrorResponseData | NoErrorData

export interface ErrorResponse extends ResponseBase {
  type: 'error'
  data: ErrorResponseData
}

export type Response = ObjectResponse | GuideResponse | ErrorResponse
export type ResponseData = ObjectResponseData | GuideResponseData | ErrorResponseData

// TEXT GUIDE
export interface TextObjectError {
  name: string
  error: true
  errors: {
    noMatch?: boolean
    other?: boolean
  }
}

export type TextResultObject = ObjectGuide | ObjectError

export type TextResponseTypes = 'guide' | 'error'

export interface TextResponseBase {
  type: ResponseTypes
}

export interface TextGuideResponseData {
  guide: ResultObject[]
}

export interface TextGuideResponse extends TextResponseBase {
  type: 'guide'
  data: GuideResponseData
}

export interface TextErrorResponseData {
  error: true
  errors: {
    unrelated?: boolean
    noMatches?: boolean
    other?: boolean
  }
}

export interface TextErrorResponse extends TextResponseBase {
  type: 'error'
  data: TextErrorResponseData
}

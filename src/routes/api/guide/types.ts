export interface RetrievedGuide {
  name: string
  guide: string[]
  tips: string[] | null
}

// 인식 결과 항목
export interface IdentifiedObject {
  name: string
  category: string[]
  error?: boolean
  errors?: {
    noMatch?: boolean
    notReal?: boolean
    other?: boolean
  }
}

// 인식 결과
export interface IdentificationResult {
  description: string
  result: IdentifiedObject[]
}

// 처음 인식된 물건들
export type IdentifiedObjects = string[]

export interface ResponseBase {
  type: 'objects' | 'guide' | 'error'
}

// 생성된 물건 분리배출 방법
export interface ObjectGuide {
  name: string
  guide: string[]
  tips?: string[]
  reference: string
}

// 생성된 물건 오류
export interface ObjectError {
  name: string
  error: true
  errors: {
    noMatch?: boolean
    other?: boolean
  }
}

export type ResultObject = ObjectGuide | ObjectError

// 첫 물건 응답
export interface ObjectResponse extends ResponseBase {
  type: 'objects'
  objects: IdentifiedObjects
}

// 가이드 응답
export interface GuideResponse extends ResponseBase {
  type: 'guide'
  guides: ResultObject[]
}

// 전체 오류
export interface ErrorResponse extends ResponseBase {
  type: 'error'
  errors: {
    noObjects?: boolean
    other?: boolean
  }
}

export type Response = ObjectResponse | GuideResponse | ErrorResponse

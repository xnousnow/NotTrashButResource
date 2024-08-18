export type IdentifiedObjects = string[]

export interface ObjectGuide {
  name: string
  guide: string[]
  tips?: string[]
  reference: string
}

export interface ObjectError {
  name: string
  error: true
  errors?: {
    guide: true
  }
}

export type EachObject = ObjectGuide | ObjectError

export interface FullError {
  error: boolean
  errors?: {
    noObject?: true
    processing?: true
    noMatches?: true
    other?: true
  }
  debug?: string
}

export type IdentificationResult = string

export type ObjectPairs = Record<string, string[]>

export type APIResponse = {
  textStream: ReadableStream<string>
}

export interface GuidebookData {
  name: string
  guide: string
  tips?: string
}

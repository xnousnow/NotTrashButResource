import { z } from 'zod'

export const identificationResponseSchema = z.union([
  z.object({
    description: z.string(),
    result: z.array(
      z.union([
        z.object({
          name: z.string(),
          category: z.array(z.string())
        }),
        z.object({
          name: z.string(),
          error: z.literal(true),
          errors: z.object({
            noMatch: z.boolean(),
            other: z.boolean()
          })
        })
      ])
    )
  }),
  z.object({
    error: z.literal(true),
    errors: z.object({
      noObjects: z.boolean(),
      notReal: z.boolean(),
      other: z.boolean()
    })
  })
])

export const supportedIdentificationResponseSchema = z.object({
  description: z.string().optional(),
  result: z
    .array(
      z.union([
        z.object({
          name: z.string(),
          category: z.array(z.string())
        }),
        z.object({
          name: z.string(),
          error: z.literal(true),
          errors: z.object({
            noMatch: z.boolean(),
            other: z.boolean()
          })
        })
      ])
    )
    .optional(),
  error: z.literal(true).optional(),
  errors: z
    .object({
      noObjects: z.boolean(),
      notReal: z.boolean(),
      other: z.boolean()
    })
    .optional()
})

export const singleGuideResponseSchema = z.union([
  z.object({
    name: z.string().describe('물건의 이름'),
    guide: z.array(z.string()).describe('분리배출 방법'),
    tips: z.array(z.string()).optional().describe('분리배출 팁'),
    reference: z.array(z.string()).describe('사용한 분리배출 정보의 이름')
  }),
  z.object({
    name: z.string().describe('물건의 이름'),
    error: z.literal(true),
    errors: z.object({
      notEnough: z.boolean().describe('정보가 주어졌지만 충분하지 않음'),
      noGuide: z.boolean().describe('물건이 인식되었지만 분리배출 방법이 없음'),
      other: z.boolean().describe('기타 오류')
    })
  })
])

export const supportedSingleGuideResponseSchema = z.object({
  name: z.string().describe('물건의 이름'),
  guide: z.array(z.string()).describe('분리배출 방법').optional(),
  tips: z.array(z.string()).describe('분리배출 팁').optional(),
  reference: z.array(z.string()).describe('사용한 분리배출 정보의 이름').optional(),
  error: z.literal(true).optional(),
  errors: z
    .object({
      notEnough: z.boolean().describe('정보가 주어졌지만 충분하지 않음').optional(),
      noGuide: z.boolean().describe('물건이 인식되었지만 분리배출 방법이 없음').optional(),
      other: z.boolean().describe('기타 오류').optional()
    })
    .optional()
})

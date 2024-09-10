import { z } from 'zod'

export const identificationResponseSchema = z.object({
  description: z
    .string()
    .describe(
      '물건들의 특징을 자세히 설명하세요. 물건의 재질, 모양 등을 포함하세요. 예시: "페트병"이 아닌 "물이 조금 남은 찌그러진 투명 페트병"'
    ),
  result: z.union([
    z.array(
      z.union([
        z.object({
          name: z.string().describe('물건의 이름'),
          category: z.array(z.string()).describe('알맞는 카테고리(들)')
        }),
        z.object({
          name: z.string().describe('물건의 이름'),
          error: z.literal(true),
          errors: z.object({
            noMatch: z.boolean().describe('물건에 알맞는 카테고리가 없음'),
            notReal: z
              .boolean()
              .optional()
              .describe('이미지가 현실의 물건을 나타내지 않으며 분리배출할 수 없음'),
            other: z.boolean().describe('기타 오류')
          })
        })
      ])
    ),
    z.object({
      error: z.literal(true),
      errors: z.object({
        noObjects: z.boolean().describe('이미지에 물건이 없음'),
        imageError: z.boolean().describe('이미지가 현실의 물건을 나타내지 않으며 분리배출할 수 없음, 또는 이미지 오류'),
        other: z.boolean().describe('기타 이미지 오류')
      })
    })
  ])
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
      notEnough: z.boolean().describe('분리배출 방법이 부족함'),
      noGuide: z.boolean().describe('물건이 인식되었지만 분리배출 방법이 없음'),
      other: z.boolean().describe('기타 오류')
    })
  })
])

import { z } from 'zod'

export const imageIdentificationResponseSchema = (categories: [string, ...string[]]) =>
  z.object({
    description: z.string().describe('이미지의 물건을 한두 문장 이내로 설명하세요.'),
    result: z.union([
      z.array(
        z.object({
          name: z.string().describe('물건의 이름'),
          category: z.array(z.enum(categories)).nullable().describe('알맞는 카테고리(들)')
        })
      ),
      z.object({
        error: z.literal(true),
        errors: z.object({
          noObjects: z.boolean().describe('이미지에 물건이 없음'),
          imageError: z
            .boolean()
            .describe(
              '이미지가 현실의 물건을 나타내지 않으며 분리배출할 수 없음, 또는 이미지 오류'
            ),
          other: z.boolean().describe('기타 이미지 오류')
        })
      })
    ])
  })

export const categorizationResponseSchema = (categories: [string, ...string[]]) =>
  z.object({
    thought: z.string().describe('카테고리를 정하기 위한 이유 및 과정'),
    result: z.array(
      z.object({
        name: z.string().describe('물건의 이름'),
        category: z.array(z.enum(categories)).describe('알맞는 카테고리(들)')
      })
    )
  })

export const guideResponseSchema =
  z.object({
    guides: z.array(
      z.discriminatedUnion('type', [
        z.object({
          type: z.literal('guide'),
          name: z.string().describe('물건의 이름'),
          guide: z.array(z.string()).describe('분리배출 방법'),
          tips: z.array(z.string()).nullable().describe('분리배출 팁'),
          reference: z.array(z.string()).describe('사용한 분리배출 정보의 이름')
        }),
        z.object({
          type: z.literal('error'),
          name: z.string().describe('물건의 이름'),
          errors: z.object({
            noGuide: z.boolean().describe('분리배출 방법이 없거나 부족함'),
            other: z.boolean().describe('기타 오류')
          })
        })
      ])
    )
  })

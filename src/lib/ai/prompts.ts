import dedent from 'dedent'

import type { CoreMessage } from 'ai'
import type { ImageIdentificationAIResponse } from './types'
import type { RequestBase } from '$routes/api/guide/types'
import type { RetrievedGuide } from '$lib/utils/supabase'

export const imageIdentificationMessages = (image: string, categories: string[]): CoreMessage[] => {
  return [
    {
      role: 'system',
      content: dedent`
        사용자가 분리배출하려는 물건이 있는 이미지가 주어질 것입니다. 사용자가 물건을 올바르게 분리배출할 수 있도록 이미지의 각 물건을 정확히 인식하고 다음 목록에 따라 분류하세요.

        카테고리: ${categories.join(', ')}

        지시:
        1. 이미지에서 사용자가 분리배출하려는 것으로 보이는 모든 물건을 인식하세요.
          - 페트병, 페트병 뚜껑, 페트병 라벨 등 보통 한 물건으로 사용되는 물건은 하나만 인식하세요.
        2. 인식된 각 물건마다 가장 적절한 분리배출 카테고리를 선택하세요.
          - 예를 들어, 찌그러진 페트병은 페트병, 과자 봉지는 비닐로 분류할 수 있습니다.
          - 정확한 카테고리가 없어도, 가장 적절한 분리배출 방법을 가지고 있을 카테고리를 선택하세요.
          - LED, 형광등인지 알 수 없는 전등과 같이, 정확한 카테고리를 알 수 없는 물건은 여러 개를 선택하세요.
        3. 만약 아무 카테고리에도 속하지 않거나 다른 문제가 있다면, 빈 배열을 사용하세요.

        **한국어로 답변하세요.**
      `
    },
    {
      role: 'user',
      content: [{ type: 'image', image }],
      experimental_providerMetadata: {
        openai: { imageDetail: 'low' }
      }
    }
  ]
}

export const categorizationMessages = (object: string, categories: string[]): CoreMessage[] => [
  {
    role: 'system',
    content: dedent`
      사용자가 물건을 올바르게 분리배출하기 위해 가장 적절한 분리배출 카테고리를 선택하세요. 예를 들어, 찌그러진 페트병은 페트병, 과자 봉지는 비닐로 분류할 수 있습니다.

      물건의 주요 구성 재질 등을 고려해 가장 적절한 분리배출 방법을 가지고 있을 카테고리를 선택하세요.
      만약 알맞은 카테고리가 없다면 알맞은 오류를 선택하세요.
      사용자의 입력이 적절하지 않거나 분리배출할 물건이 아닌 경우, 빈 배열로 답변하세요.

      LED, 형광등인지 알 수 없는 전등과 같이, 정확한 카테고리를 알 수 없는 물건은 여러 개를 선택하세요.

      카테고리: ${categories.join(', ')}

      **한국어로 답변하세요.**
    `
  },
  {
    role: 'user',
    content: '바나나맛우유'
  },
  {
    role: 'assistant',
    content: dedent`
      {
        "thought": "바나나맛 우유는 보통 플라스틱 병에 담겨 있습니다. 따라서 '플라스틱 용기' 카테고리에 해당합니다.",
        "result": [
          { "name": "바나나맛 우유", "category": ["플라스틱 용기"] }
        ]
      }
    `
  },
  {
    role: 'user',
    content: '폰이랑 집 분리배출 방법'
  },
  {
    role: 'assistant',
    content: dedent`
      {
        "thought": "폰은 보통 휴대폰을 의미하기 때문에 '휴대폰' 카테고리에 해당합니다. 하지만 집은 알맞는 카테고리가 없습니다.",
        "result": [
          { "name": "폰", "category": ["휴대폰"] },
          { "name": "집", "error": true, "errors": { "noMatch": true, "other": false } }
        ]
      }
    `
  },
  {
    role: 'user',
    content: object
  }
]

export const guideMessages = (
  imageDescription: string,
  identificationResult: Extract<ImageIdentificationAIResponse['result'], object[]>,
  guides: RetrievedGuide[],
  options: RequestBase['options']
): CoreMessage[] => [
  {
    role: 'system',
    content: dedent`
      사용자가 분리배출하려는 물건 및 분리배출 방법이 주어질 것입니다. 사용자가 물건을 올바르게 분리배출할 수 있도록, 이미지 설명을 보고 분리배출 방법에서 사용자의 주거 환경에 맞지 않거나 관련없는 단계를 제거하세요. 나머지 부분은 최대한 보존하세요.

      변경할 사항:
      - 주거 환경과 관련 없는 정보 제거 (예시: 아파트와 주택에 따라 분리배출 방법이 다르고 주택이라면 아파트와 관련된 정보를 제거)
      - 물건과 관련 없는 정보 제거 (예시: 아이폰 및 안드로이드에 따라 분리배출 방법이 다르고 아이폰이라면 안드로이드와 관련된 정보를 제거)
      - 이미 되어있는 단계 제거 (예시: 라벨을 떼는 단계가 있어도 라벨이 없는 페트병이라면 라벨을 떼는 단계를 제거)
      - **관련 있는 정보를 제거하지 않도록 주의하세요.**

      수칙:
      - 인식된 물건마다 꼭 하나의 항목을 작성해야 합니다.
      - 주어진 정보만 사용하여 답변을 작성하세요. 추가 정보를 포함하지 마세요.
      - 가이드의 모든 단계는 사용자가 이해하고 따를 수 있도록 명확하고 간결하게 작성되어야 합니다.
      - 가이드에서 제거된 정보는 팁에 짧게 요약하여 추가하세요.
      - "일반쓰레기로 배출해요."와 같이 친근하고 명확한 말투를 사용하세요. 해요, 예요, 아요 등을 사용하세요.

      **한국어로 답변하세요.**
    `
  },
  {
    role: 'user',
    content: dedent`
      이미지 설명: 라벨이 없는 빈 보라색 페트병 및 천장에 달린 전구
      인식된 물건:
      - 페트병: 페트병
      - 전구: LED 등, 형광등
      주거 환경: 주택

      # 페트병
      1. 내용물을 비우고 깨끗이 세척해요.
      2. 라벨을 제거해요.
      3. 페트병을 최대한 압축해요.
      4. 뚜껑을 닫아 투명 페트로 배출해요. 유색 페트병은 일반 플라스틱으로 배출해요.

      - 페트병을 최대한 압축시켜 배출하면 운송/압축/보관 과정에 도움이 돼요.
      - 뚜껑은 파쇄하여 세척하는 과정에서 물에 떠서 투명페트와 분리되기 때문에 따로 모아 재활용 가능하므로 닫아서 버려요.

      # LED 등
      1. 전구형과 직관형 LED 등만 형광등 분리배출함에 함께 배출해요.
      2. 그 외 LED 등은 모두 생활폐기물(불연성쓰레기)로 배출해요.

      - 정부는 2023년부터 LED 등도 생산자책임재활용(EPR) 제도에 포함시켰어요.
      - LED용 분리배출함을 따로 마련하지 않고 형광등 분리배출함에 버리도록 하고 있어요.
      - 천장 조명으로 많이 쓰이는 편판형이나 십자형, 원반형은 EPR에 포함되지 않아 일반쓰레기로 배출해요.
      - 생활폐기물은 불연재봉투(일명 마대자루)를 구매하여 담아요.

      # 형광등
      1. 행정복지센터나 아파트 단지 내 형광등 수거함에 배출해요.

      - 형광등에는 가스 형태의 수은이 들어있어 깨지면 가스를 접할 위험성이 있으니 절대 깨서 버리면 안돼요.
    `
  },
  {
    role: 'assistant',
    content: dedent`
      [
        { "name": "페트병", "guide": ["페트병을 최대한 압축해요.", "뚜껑을 닫아 일반 플라스틱으로 배출해요."], "tips": ["페트병을 최대한 압축시켜 배출하면 운송/압축/보관 과정에 도움이 돼요.", "뚜껑은 파쇄하여 세척하는 과정에서 물에 떠서 투명페트와 분리되기 때문에 따로 모아 재활용 가능하므로 닫아서 버려요."], "reference": ["페트병"] },
        { "name": "전구", "guide": ["LED 등이어도 형광등 분리배출함에 배출해요."], "tips": ["정부는 2023년부터 LED 등도 생산자책임재활용(EPR) 제도에 포함시켰어요.", "LED용 분리배출함을 따로 마련하지 않고 형광등 분리배출함에 버리도록 하고 있어요.", "형광등에는 가스 형태의 수은이 들어있어 깨지면 가스를 접할 위험성이 있으니 절대 깨서 버리면 안돼요."], "reference": ["LED 등", "형광등"] }
      ]
    `
  },
  {
    role: 'user',
    content: dedent`
      이미지 설명: 이미지에는 작은 인형과 장난감들이 보입니다.
      인식된 물건:
      - 인형: 인형/천/솜
      - 장난감: 플라스틱 장난감
      주거 환경: 아파트

      # 인형/천/솜
      1. 일반쓰레기로 배출해요.

      - 인형, 천, 솜 등은 재활용이 불가한 섬유 재질이에요.
      - 만약 종량제 봉투에 담기 힘들만큼 크다면 가위로 자르거나 대형생활폐기물로 신고해 배출해요.

      # 플라스틱 장난감
      1. 일반쓰레기로 배출해요.
    `
  },
  {
    role: 'assistant',
    content: dedent`
      [
        { "name": "인형", "guide": ["일반쓰레기로 배출해요."], "tips": ["인형, 천, 솜 등은 재활용이 불가한 섬유 재질이에요.", "만약 종량제 봉투에 담기 힘들만큼 크다면 가위로 자르거나 대형생활폐기물로 신고해 배출해요."], "reference": ["인형/천/솜"] },
        { "name": "장난감", "guide": ["일반쓰레기로 배출해요."], "reference": ["플라스틱 장난감"] }
      ]
    `
  },
  {
    role: 'user',
    content: dedent`
      이미지 설명: 거실의 소형 선풍기
      인식된 물건:
      - 소형 선풍기: 소형 가전제품
      주거 환경: 주택

      # 소형 가전제품
      1. 제품이 쓸만하면 중고품으로 재사용되도록 팔거나 지역별 재활용센터로 보내요. 상태와 사용 기간에 따라 돈을 받거나 무상으로 넘길 수 있어요.
      2. 재사용이 어려운 경우 새 제품을 살때 기존 제품을 회수 요청해요. 생산자의 무상방문수거 서비스를 이용해요.
      3. 크다면 대형 쓰레기로 배출 신고를 하고 수수료를 지불할 수 있어요.

      - 폐가전 무상방문수거 예약: 15990903.or.kr
    `
  },
  {
    role: 'assistant',
    content: dedent`
      [
        { "name": "소형 선풍기", "guide": ["제품이 쓸만하면 중고품으로 재사용되도록 팔거나 지역별 재활용센터로 보내요. 상태와 사용 기간에 따라 돈을 받거나 무상으로 넘길 수 있어요.", "재사용이 어려운 경우 새 제품을 살때 기존 제품을 회수 요청해요. 생산자의 무상방문수거 서비스를 이용해요.", "크다면 대형 쓰레기로 배출 신고를 하고 수수료를 지불할 수 있어요."], "reference": ["소형 가전제품"] }
      ]
    `
  },
  {
    role: 'user',
    content: dedent`
      이미지 설명: ${imageDescription}
      인식된 물건:
      ${identificationResult.map((object) => `- ${object.name}: ${object.category.length ? object.category.join(', ') : '카테고리 없음'}`).join('\n')}
      주거 환경: ${options.residenceType == 'apartment' ? '아파트' : '주택'}

      ${guides
        .map(
          (guide) => dedent`
            # ${guide.name}
            ${guide.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}
            ${'tips' in guide ? `\n${guide.tips?.map((tip) => `- ${tip}`).join('\n')}` : ''}
          `
        )
        .join('\n\n')}
    `
  }
]

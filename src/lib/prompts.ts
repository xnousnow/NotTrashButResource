import type { CoreMessage } from 'ai'

const CATEGORIES_PROMPT = '# 분리배출 카테고리\n'
const APARTMENT_LABEL = '아파트'
const HOUSE_LABEL = '주택'

const identificationPrompt = (guidebookNames: string[]) => `# 지시
당신은 사용자의 분리배출을 도와주는 분리배출 전문가입니다. 당신의 임무는 사용자가 입력한 사진의 물건 및 재질을 알아보는 것입니다.

사용자의 이미지가 주어질 것입니다. 입력된 사진은 사용자가 분리배출을 원하는 물건입니다.
사용자의 분리배출을 돕기 위해 물건을 분리배출하기 위해 참고해야 할 항목을 찾으세요. 만약 직접적인 항목이 없다면 재질을 선택하세요.

첫 번째 줄에는 이미지를 간단히 설명하세요. 물건의 상태와 재질 등에 집중하세요.
두 번째 줄에는 이미지의 나타난 물건을 나열하세요. 쉼표로 구분하세요.
세 번째 줄에는 위에서 나열한 물건마다 알맞는 분리배출 카테고리를 선택하세요.
- 물건 이름: 물건에 알맞는 분리배출 카테고리

만약 알맞는 분리배출 카테고리가 없거나 물건이 확실하지 않다면 물건의 이름만 적으세요.
알맞는 분리배출 카테고리가 여러 개일 수도 있습니다. 예를 들어 LED/형광등과 같이 종류를 알 수 없는 전등은 두 개를 모두 선택하세요.

만약 이미지에 물건이 없다면 위를 따르지 말고 '물건 없음', 기타 오류가 있다면 '오류'**만** 출력하세요.

지시되지 않은 빈 줄, 설명, 코드 블록 등을 삽입하지 **마세요.**

# 예시 답변
분홍색 머리띠 및 찌그러진 투명 페트병
머리띠, 투명 페트병
- 머리띠
- 투명 페트병: 투명 페트병

오류

천장에 달린 전등
전등
- 전등: LED 조명등, 형광등

라벨과 뚜껑이 없는 투명 페트병
투명 페트병
- 투명 페트병: 투명 페트병

물건 없음

${CATEGORIES_PROMPT}${guidebookNames.join(', ')}`

export const getIdentificationPrompt = (guidebookNames: string[], image: string): CoreMessage[] => [
  { role: 'system', content: identificationPrompt(guidebookNames) },
  { role: 'user', content: [{ type: 'image', image }] }
]

const finalSystemPrompt = `당신은 사용자의 분리배출을 도와야 합니다. 이미지 설명 및 분리배출 방법이 주어질 것입니다. 이미지 설명을 보고 분리배출 방법에서 사용자의 주거 환경에 맞지 않거나 필요없는 단계를 제거하세요. 나머지 부분은 최대한 보존하세요.

말투 - '일반쓰레기로 배출해요.'와 같이 친근하고 명확한 말투를 사용하세요. 해요, 예요, 아요 등을 사용하세요.

예시 - 사용자가 아파트에 있다면 아파트에 관한 내용만 제공하세요.

답변 형식 - 물건마다 다음 JSON 객체를 엔터로 구분해 반복하세요:
{ "name": "이름", "guide": ["단계별 방법"], "tips": ["분리배출 팁"] }
tips는 정보에 따라 없을 수 있습니다. 목록에는 '1.', '-' 등 구분 기호를 빼세요.
**모든 객체는 유효한 JSON 형식이어야 합니다.**

오류 - 만약 정보가 부족하거나 오류가 있다면 [ name: "이름", error: true ]로 출력하세요.`

const finalUserPrompt = (
  isApartment: boolean,
  imageDescription: string,
  infos: { name: string; guide: string; tips?: string }[]
) => `주거 환경 - ${isApartment ? APARTMENT_LABEL : HOUSE_LABEL}

이미지 설명:
${imageDescription}

${infos
  .map(
    ({ name, guide, tips }) =>
      `[ name: "${name}", guide: [${guide
        .split('\n')
        .map((line) => `"${line.trim()}"`)
        .join(', ')}]${tips ? `, tips: "${tips.replace(/\n/g, ' ')}"` : ''} ]`
  )
  .join('\n')}
`

export const getFinalPrompt = (
  isApartment: boolean,
  imageDescription: string,
  infos: { name: string; guide: string; tips?: string }[]
): CoreMessage[] => [
  { role: 'system', content: finalSystemPrompt },
  { role: 'user', content: finalUserPrompt(isApartment, imageDescription, infos) }
]

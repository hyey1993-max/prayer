export type ChoiceKey =
  | 'recurring'
  | 'hope'
  | 'evidence'
  | 'thread'
  | 'burning'
  | 'companions'
  | 'return'

export interface Option {
  id: string
  /** 선택지에 보이는 문장 (사용자의 1인칭) */
  label: string
  /** 결과 글에 끼워 넣을 때 쓰는 2인칭 명사구. 없으면 label을 그대로 쓴다. */
  echo?: string
  /** 결과 화면의 두 번째 선 옆에 붙는 짧은 이름 (6단계 전용) */
  short?: string
}

export interface Scene {
  /** 예: '누가복음 24:17' */
  ref: string
  /** 짧게 인용되는 구절 (개역한글) */
  quote: string
  /** 결과 화면 접이식 목록에서 보이는 장면 설명 */
  scene: string
}

export interface Step {
  number: number
  key: ChoiceKey
  question: string
  /** 질문 아래 한 줄 도움말. 없어도 된다. */
  hint?: string
  options: Option[]
  scene: Scene
  /** 배경 시간대. 0 = 한낮, 1 = 저녁 */
  dusk: number
  /** 4단계처럼 정거장 입력을 먼저 받는 단계 */
  collectsStations?: boolean
}

export interface Answers {
  recurring: string[]
  hope: string[]
  evidence: string[]
  stations: string[]
  thread: string[]
  burning: string[]
  companions: string[]
  return: string[]
  /** '직접 적기'로 적은 한 줄. 단계 키별로 하나. */
  custom?: Partial<Record<ChoiceKey, string>>
}

export const emptyAnswers = (): Answers => ({
  recurring: [],
  hope: [],
  evidence: [],
  stations: [],
  thread: [],
  burning: [],
  companions: [],
  return: [],
  custom: {},
})

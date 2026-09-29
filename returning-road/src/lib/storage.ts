import type { Answers } from '../content/types'

/**
 * '이어서 걷기'를 위한 저장. 이 기기의 브라우저 안에만 남는다.
 * 저장소가 막혀 있거나(시크릿 창 등) 실패해도 조용히 넘어간다.
 */

// v2: step은 화면 순서(flow)의 위치. 4단계가 두 화면으로 나뉘며 바뀌었다.
const KEY = 'returning-road/v2'

export interface Saved {
  /** flow 안의 화면 위치 */
  step: number
  answers: Answers
  scriptureFirst: boolean
}

export function load(): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Saved
    if (typeof parsed?.step !== 'number' || !parsed.answers) return null
    return parsed
  } catch {
    return null
  }
}

export function save(data: Saved): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* 저장하지 못해도 걷기는 계속된다 */
  }
}

export function clear(): void {
  try {
    window.localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

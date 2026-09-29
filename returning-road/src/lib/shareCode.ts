import { steps } from '../content/steps'
import { MAX_STATIONS } from '../content/steps'
import type { Answers, ChoiceKey } from '../content/types'

/**
 * 결과 링크: 답을 주소 끝(#r1.…)에 담아, 서버 없이 결과를 그대로 다시 보여 준다.
 * 누군가 결과 링크를 직접 공유할 때만 답이 기기 밖으로 나간다.
 *
 * 형식: 'r1.' + base64url(JSON)
 *   JSON = [단계별 고른 선택지 번호[][], 거쳐 온 곳[], 직접 적은 말{단계 번호: 문장}, 성경 구절 함께 보기 0|1]
 * base64url은 영문·숫자·-·_만 쓰므로, 주소의 # 뒤로 그대로 전달된다.
 */

const PREFIX = 'r1.'
const MAX_TEXT = 80

export interface SharedResult {
  answers: Answers
  scriptureFirst: boolean
}

type Packed = [number[][], string[], Record<string, string>, 0 | 1]

const keys: ChoiceKey[] = steps.map((s) => s.key)

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string): string {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

export function encodeResult({ answers, scriptureFirst }: SharedResult): string {
  const picks = steps.map((s) =>
    answers[s.key].map((id) => s.options.findIndex((o) => o.id === id)).filter((i) => i >= 0),
  )
  const custom: Record<string, string> = {}
  keys.forEach((key, i) => {
    const text = answers.custom?.[key]?.trim()
    if (text) custom[i] = text.slice(0, MAX_TEXT)
  })
  const stations = answers.stations.map((s) => s.trim()).filter(Boolean)
  const packed: Packed = [picks, stations, custom, scriptureFirst ? 1 : 0]
  return PREFIX + toBase64Url(JSON.stringify(packed))
}

/** 결과 링크의 # 뒤 부분을 답으로 되돌린다. 모양이 맞지 않으면 null. */
export function decodeResult(hash: string): SharedResult | null {
  const code = hash.replace(/^#/, '')
  if (!code.startsWith(PREFIX)) return null
  try {
    const data = JSON.parse(fromBase64Url(code.slice(PREFIX.length))) as unknown
    if (!Array.isArray(data) || data.length !== 4) return null
    const [picks, stations, custom, scripture] = data as Packed
    if (!Array.isArray(picks) || !Array.isArray(stations) || typeof custom !== 'object' || custom === null) return null

    const answers: Answers = {
      recurring: [], hope: [], evidence: [], stations: [], thread: [], burning: [], companions: [], return: [],
      custom: {},
    }
    steps.forEach((s, i) => {
      const chosen = Array.isArray(picks[i]) ? picks[i] : []
      answers[s.key] = [...new Set(chosen)]
        .filter((n): n is number => Number.isInteger(n) && n >= 0 && n < s.options.length)
        .map((n) => s.options[n].id)
    })
    answers.stations = stations
      .filter((s): s is string => typeof s === 'string')
      .map((s) => s.trim().slice(0, 24))
      .filter(Boolean)
      .slice(0, MAX_STATIONS)
    Object.entries(custom).forEach(([i, text]) => {
      const key = keys[Number(i)]
      if (key && typeof text === 'string' && text.trim()) answers.custom![key] = text.trim().slice(0, MAX_TEXT)
    })
    return { answers, scriptureFirst: scripture === 1 }
  } catch {
    return null
  }
}

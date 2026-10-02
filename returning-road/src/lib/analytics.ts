/**
 * 익명 방문·단계 집계 (GoatCounter).
 *
 * 보내는 것은 '/e/q4a' 같은 사건 이름과 방문 횟수뿐이다.
 * 고른 답, 직접 적은 말, 결과 링크의 #r1.… 은 어떤 경우에도 보내지 않는다.
 * 스크립트를 불러오지 않고 이미지 요청 한 번(픽셀)으로 보내므로 보내는 내용을 이 파일에서 모두 볼 수 있다.
 *
 * 켜는 방법: 빌드할 때 VITE_GOATCOUNTER_URL=https://내코드.goatcounter.com/count 를 정한다.
 * 정하지 않으면(예: 아티팩트 빌드) 아무것도 하지 않는다.
 */

type Send = (url: string) => void

export interface Tracker {
  /** 사건 하나를 센다. 같은 이름은 한 번만(이 페이지를 연 동안). */
  track: (name: string) => void
  /** 방문 한 번을 센다. */
  visit: () => void
  enabled: boolean
}

const noop: Tracker = { track: () => {}, visit: () => {}, enabled: false }

export function createTracker(endpoint: string | undefined, send: Send, allowed = true): Tracker {
  if (!endpoint || !allowed) return noop
  const seen = new Set<string>()
  const ping = (path: string, event: boolean) => {
    const params = new URLSearchParams({ p: path, t: path, rnd: String(Math.random()).slice(2, 8) })
    if (event) params.set('e', 'true')
    send(`${endpoint}?${params}`)
  }
  return {
    enabled: true,
    visit: () => {
      if (seen.has('/')) return
      seen.add('/')
      ping('/', false)
    },
    track: (name) => {
      const path = `/e/${name}`
      if (seen.has(path)) return
      seen.add(path)
      ping(path, true)
    },
  }
}

/** 개발 중(localhost)과 '추적 안 함' 설정을 켠 브라우저에서는 보내지 않는다. */
function allowedHere(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return false
  return navigator.doNotTrack !== '1'
}

export const analytics: Tracker = createTracker(
  import.meta.env.VITE_GOATCOUNTER_URL as string | undefined,
  (url) => {
    try {
      new Image().src = url
    } catch {
      /* 집계가 안 돼도 앱은 그대로 동작한다 */
    }
  },
  allowedHere(),
)

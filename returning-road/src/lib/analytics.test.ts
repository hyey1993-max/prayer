import { describe, expect, it } from 'vitest'
import { createTracker } from './analytics'

const URL_OK = 'https://x.goatcounter.com/count'
const make = (endpoint: string | undefined | null = URL_OK, allowed = true) => {
  const sent: string[] = []
  return { sent, tracker: createTracker(endpoint ?? undefined, (u) => sent.push(u), allowed) }
}

describe('익명 집계', () => {
  it('주소가 없거나 허용되지 않으면 아무것도 보내지 않는다', () => {
    for (const { tracker, sent } of [make(null), make(URL_OK, false)]) {
      tracker.visit()
      tracker.track('start')
      expect(sent).toEqual([])
      expect(tracker.enabled).toBe(false)
    }
  })

  it('방문과 사건을 이름만 담아 보낸다', () => {
    const { tracker, sent } = make()
    tracker.visit()
    tracker.track('q4a')
    expect(sent).toHaveLength(2)
    const visit = new URL(sent[0])
    expect(visit.searchParams.get('p')).toBe('/')
    expect(visit.searchParams.get('e')).toBeNull()
    const event = new URL(sent[1])
    expect(event.searchParams.get('p')).toBe('/e/q4a')
    expect(event.searchParams.get('e')).toBe('true')
  })

  it('같은 사건은 한 번만 센다', () => {
    const { tracker, sent } = make()
    tracker.track('q1')
    tracker.track('q1')
    tracker.visit()
    tracker.visit()
    expect(sent).toHaveLength(2)
  })

  it('보내는 주소에 답이나 결과 링크가 들어가지 않는다', () => {
    const { tracker, sent } = make()
    tracker.visit()
    tracker.track('result')
    for (const url of sent) {
      expect(url).not.toMatch(/r1\./)
      expect([...new URL(url).searchParams.keys()].sort()).toEqual(
        expect.arrayContaining(['p', 't']),
      )
      expect([...new URL(url).searchParams.keys()].every((k) => ['p', 't', 'e', 'rnd'].includes(k))).toBe(true)
    }
  })
})

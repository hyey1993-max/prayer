import { describe, expect, it } from 'vitest'
import { steps } from '../content/steps'
import { contrast, hex, palette, skyAt } from './sky'

const AA = 4.5

// 시작(0), 모든 질문 화면, 결과(1)
const stops = [0, ...steps.flatMap((s) => (s.stations ? [s.stations.dusk, s.dusk] : [s.dusk])), 1]

describe('해가 기우는 길', () => {
  it('걸음마다 배경이 되돌아가지 않고 조금씩만 저문다', () => {
    const questionStops = stops.slice(1, -1)
    for (let i = 1; i < questionStops.length; i++) {
      expect(questionStops[i]).toBeGreaterThanOrEqual(questionStops[i - 1])
    }
  })

  it('6단계에서 저녁이 되고, 그 전까지는 저녁에 닿지 않는다', () => {
    const sixth = steps.find((s) => s.number === 6)!
    expect(skyAt(sixth.dusk).bg).toBe(palette.eveningNavy.toLowerCase())
    steps.filter((s) => s.number < 6).forEach((s) => expect(s.dusk).toBeLessThan(0.7))
  })

  it.each(stops.map((d) => [d]))('dusk %s: 본문·보조 글자·주 버튼이 모두 AA를 넘는다', (d) => {
    const sky = skyAt(d)
    const bg = hex(sky.bg)
    expect(contrast(hex(sky.fg), bg)).toBeGreaterThanOrEqual(AA)
    expect(contrast(hex(sky.muted), bg)).toBeGreaterThanOrEqual(AA)
  })

  it('어두워지는 시점부터 본문은 저녁빛 텍스트가 된다', () => {
    expect(skyAt(0).fg).toBe(palette.ink.toLowerCase())
    expect(skyAt(1).fg).toBe(palette.eveningText.toLowerCase())
    expect(skyAt(0.5).fg).toBe(palette.eveningText.toLowerCase())
  })
})

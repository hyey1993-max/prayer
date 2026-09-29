import { describe, expect, it } from 'vitest'
import { designerSample } from '../compose/__fixtures__/designerSample'
import { emptyAnswers } from '../content/types'
import { decodeResult, encodeResult } from './shareCode'

describe('결과 링크', () => {
  it('샘플 답을 담았다가 그대로 되돌린다', () => {
    const code = encodeResult({ answers: designerSample, scriptureFirst: true })
    const back = decodeResult('#' + code)!
    expect(back.scriptureFirst).toBe(true)
    expect(back.answers).toEqual({ ...designerSample, custom: {} })
  })

  it('직접 적은 말(한글)도 담긴다', () => {
    const answers = { ...emptyAnswers(), custom: { burning: '신입이 처음 발표를 해낸 날', return: '먼저 묻는 사람이 된다' } }
    const back = decodeResult(encodeResult({ answers, scriptureFirst: false }))!
    expect(back.answers.custom).toEqual(answers.custom)
  })

  it('주소 # 뒤로 그대로 전달되는 글자(영문·숫자·.·_·-)만 쓴다', () => {
    const code = encodeResult({ answers: designerSample, scriptureFirst: false })
    expect(code).toMatch(/^[A-Za-z0-9._-]+$/)
    // 메신저로 보내기에 무리 없는 길이
    expect(code.length).toBeLessThan(400)
  })

  it('망가진 링크나 다른 주소는 무시한다', () => {
    expect(decodeResult('')).toBeNull()
    expect(decodeResult('#section')).toBeNull()
    expect(decodeResult('#r1.!!!')).toBeNull()
    expect(decodeResult('#r1.' + btoa('[1,2]'))).toBeNull()
  })

  it('범위를 벗어난 선택지 번호와 너무 긴 글은 걸러 낸다', () => {
    const json = JSON.stringify([[[0, 99, -1, 0]], ['가'.repeat(50)], { 0: 'x'.repeat(500) }, 0])
    const bytes = new TextEncoder().encode(json)
    const code = 'r1.' + btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const back = decodeResult(code)!
    expect(back.answers.recurring).toEqual(['lost_place'])
    expect(back.answers.stations[0]).toHaveLength(24)
    expect(back.answers.custom!.recurring).toHaveLength(80)
  })
})

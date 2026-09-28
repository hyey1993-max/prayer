import { describe, expect, it } from 'vitest'
import { emptyAnswers } from '../content/types'
import { designerSample } from './__fixtures__/designerSample'
import { composeResult, type ResultParagraph } from './composeResult'

const byId = (ps: ResultParagraph[], id: ResultParagraph['id']) => ps.find((p) => p.id === id)!

describe('composeResult — 설계자 샘플 답', () => {
  const result = composeResult(designerSample)

  it('다섯 문단을 순서대로 돌려준다', () => {
    expect(result.map((p) => p.id)).toEqual(['recurring', 'hope', 'path', 'burning', 'return'])
  })

  it('처음 되뇌던 이야기를 그대로 인용하며 시작한다', () => {
    const { text } = byId(result, 'recurring')
    expect(text).toContain("'이만큼 했는데 아직 내 자리를 모르겠다'")
    expect(text).toContain("'지난 곳에서 끝난 방식이 계속 마음에 걸린다'는 이야기")
    expect(text).toContain('이미 있었습니다')
  })

  it('인정은 이미 있었다 — 맡고 있던 역할과, 따라준 사람들로', () => {
    const { text } = byId(result, 'hope')
    expect(text).toContain('인정은 이미 있었어요')
    expect(text).toContain('맡고 있던 역할로도')
    expect(text).toContain('당신의 방식을 따라준 사람들로도요')
    // 문장에 안 쓰인 증거도 호명된다
    expect(text).toContain('일과 함께 끝까지 해낸 다른 것도')
  })

  it('정거장을 순서대로 잇고, 드러내는 일과 기준을 세우는 일을 하나로 묶는다', () => {
    const { text } = byId(result, 'path')
    expect(text).toContain('경제학과, UX 에이전시, HR SaaS, 글로벌 여행 플랫폼, 대학원 논문.')
    expect(text.indexOf('가려진 것을 드러내는 일')).toBeLessThan(text.indexOf('흔들리는 것에 기준을 세우는 일'))
    expect(text).toContain('이 둘은 사실 하나의 일이에요')
  })

  it('바란 건 인정이었지만, 뜨거웠던 건 눈이 열리는 순간이었다', () => {
    const { text } = byId(result, 'burning')
    expect(text).toContain('당신이 바란 건 인정이었는데')
    expect(text).toContain('인정받을 때가 아니라')
    expect(text).toContain('눈이 열리는 순간')
    expect(text).toContain('이 어긋남 안에 당신이 실제로 일하는 이유가 있어요')
  })

  it('면접 질문 한 줄과 "왜 그만뒀나요"에 대한 답 한 줄을 준다', () => {
    const p = byId(result, 'return')
    expect(p.text).toContain('틀렸을 때도 다시 믿어준 동료들')
    expect(p.text).toContain('지친 날 곁에 있어준 가족과 친구들이 함께 걷고 있었어요')
    const actions = p.practices!.map((x) => x.action)
    expect(actions).toHaveLength(2)
    expect(actions[0]).toContain('틀린 결정이 있었을 때')
    expect(actions[1]).toContain("'왜 그만뒀나요'")
  })

  it('유형 라벨, 느낌표, 화살표를 쓰지 않는다', () => {
    const all = result.map((p) => [p.text, ...(p.practices ?? []).map((x) => x.action)].join(' ')).join(' ')
    expect(all).not.toMatch(/[!→]/)
    expect(all).not.toMatch(/형입니다|유형/)
  })
})

describe('composeResult — 규칙 분기', () => {
  it('인정을 바랐고 칭찬받은 순간도 골랐다면, 인정을 부정하지 않는다', () => {
    const r = composeResult({
      ...emptyAnswers(),
      hope: ['recognition'],
      burning: ['was_praised', 'pieces_connected'],
    })
    const text = byId(r, 'burning').text
    expect(text).toContain('인정받은 순간은 분명 당신을 움직였어요')
    expect(text).toContain('흩어진 것들이 하나로 이어진 순간도')
    expect(text).not.toContain('인정받을 때가 아니라')
  })

  it('매칭되는 증거가 없으면 고른 증거를 나열하며 마무리한다', () => {
    const r = composeResult({ ...emptyAnswers(), hope: ['rooted'], evidence: ['results'] })
    const text = byId(r, 'hope').text
    expect(text).toContain('당신의 판단이 만들어낸 결과와 숫자들이 있었어요')
    expect(text).toContain('이미 곁에 있던 것들')
  })

  it('뿌리내림 + 따라준 사람들', () => {
    const r = composeResult({ ...emptyAnswers(), hope: ['rooted'], evidence: ['followed'] })
    expect(byId(r, 'hope').text).toContain('이미 심겨 있었어요')
  })

  it('확실함을 바랐다면 증거가 더 오래 가는 것을 가리킨다고 말한다', () => {
    const r = composeResult({ ...emptyAnswers(), hope: ['certainty'], evidence: ['results'] })
    expect(byId(r, 'hope').text).toContain('더 오래 가는 무언가')
  })

  it('직함보다 반복한 일 — 고른 thread를 실천 문장에 끼워 넣는다', () => {
    const r = composeResult({
      ...emptyAnswers(),
      thread: ['grow_people'],
      return: ['choose_role_not_title'],
    })
    expect(byId(r, 'return').practices![0].action).toContain('누군가를 돌보고 키우는 일을 할 수 있는지')
  })

  it('직접 적은 말도 문장 안에 들어간다', () => {
    const r = composeResult({
      ...emptyAnswers(),
      recurring: [],
      custom: { recurring: '쉬어도 되는지 모르겠어', burning: '새벽에 문제를 풀었을 때' },
    })
    expect(byId(r, 'recurring').text).toContain("'쉬어도 되는지 모르겠어'라는 이야기")
    expect(byId(r, 'burning').text).toContain("'새벽에 문제를 풀었을 때'라고 적은 순간")
  })

  it('아무것도 고르지 않아도 깨지지 않고 다섯 문단을 준다', () => {
    const r = composeResult(emptyAnswers())
    expect(r).toHaveLength(5)
    r.forEach((p) => expect(p.text.length).toBeGreaterThan(10))
  })
})

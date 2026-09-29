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
    expect(text).toContain("'이만큼 했는데, 아직도 내 자리가 어딘지 모르겠다'")
    expect(text).toContain("'지난 회사를 떠난 방식이 계속 마음에 걸린다'는 말이 자주 맴돌았어요")
    expect(text).toContain('방금 고른 답들 안에 이미 있었어요')
  })

  it('인정은 이미 받고 있었다 — 맡고 있던 역할과, 따라 준 동료들로', () => {
    const { text } = byId(result, 'hope')
    expect(text).toContain('인정은 이미 받고 있었어요')
    expect(text).toContain('맡고 있던 역할도, 일하는 방식을 따라 준 동료들도 그 증거예요')
    // 문장에 안 쓰인 것도 빠뜨리지 않는다
    expect(text).toContain('일하면서 끝까지 해낸 다른 일도 마찬가지예요')
  })

  it('거쳐 온 곳을 순서대로 잇고, 원인을 찾는 일과 기준을 세우는 일을 하나로 묶는다', () => {
    const { text } = byId(result, 'path')
    expect(text).toContain('경제학과, UX 에이전시, HR SaaS, 글로벌 여행 플랫폼, 대학원 논문.')
    expect(text.indexOf('가려진 진짜 원인을 찾아내는 일')).toBeLessThan(text.indexOf('흔들리는 결정에 기준을 세우는 일'))
    expect(text).toContain('이 둘은 사실 하나로 이어진 일이에요')
  })

  it('기대한 건 인정이었지만, 가슴 뛰었던 건 무언가를 새롭게 깨닫는 순간이었다', () => {
    const { text } = byId(result, 'burning')
    expect(text).toContain('기대한 건 인정이었는데')
    expect(text).toContain('칭찬받을 때가 아니라')
    expect(text).toContain('새롭게 깨닫는 순간')
    expect(text).toContain('일을 계속하게 만드는 진짜 이유')
  })

  it('면접 질문 한 줄과 "왜 그만두셨어요?"에 대한 답 한 줄을 준다', () => {
    const p = byId(result, 'return')
    expect(p.text).toContain('실수했을 때도 다시 믿어 준 동료')
    expect(p.text).toContain('지친 날 곁에 있어 준 가족과 친구가 있었어요')
    const actions = p.practices!.map((x) => x.action)
    expect(actions).toHaveLength(2)
    expect(actions[0]).toContain('잘못된 결정이 있었을 때')
    expect(actions[1]).toContain("'왜 그만두셨어요?'")
  })

  it("번역투 '당신'과 '-습니다' 섞어 쓰기가 없다", () => {
    const all = result.map((p) => p.text).join(' ')
    expect(all).not.toContain('당신')
    expect(all).not.toMatch(/습니다\./)
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
    expect(text).toContain('인정받은 순간도 분명 큰 힘이 됐어요')
    expect(text).toContain('흩어져 있던 것들이 하나로 연결된 순간도')
    expect(text).not.toContain('칭찬받을 때가 아니라')
  })

  it('매칭되는 증거가 없으면 고른 증거를 나열하며 마무리한다', () => {
    const r = composeResult({ ...emptyAnswers(), hope: ['rooted'], evidence: ['results'] })
    const text = byId(r, 'hope').text
    expect(text).toContain('직접 판단해서 만들어 낸 성과와 숫자가 있었어요')
    expect(text).toContain('이미 가지고 있던 것들')
  })

  it('뿌리내림 + 따라준 사람들', () => {
    const r = composeResult({ ...emptyAnswers(), hope: ['rooted'], evidence: ['followed'] })
    expect(byId(r, 'hope').text).toContain('이미 뿌리내리고 있었어요')
  })

  it('확실함을 바랐다면 증거가 더 오래 가는 것을 가리킨다고 말한다', () => {
    const r = composeResult({ ...emptyAnswers(), hope: ['certainty'], evidence: ['results'] })
    expect(byId(r, 'hope').text).toContain('더 오래가는 무언가')
  })

  it('직함보다 반복한 일 — 고른 thread를 실천 문장에 끼워 넣는다', () => {
    const r = composeResult({
      ...emptyAnswers(),
      thread: ['grow_people'],
      return: ['choose_role_not_title'],
    })
    expect(byId(r, 'return').practices![0].action).toContain('사람을 챙기고 성장하도록 돕는 일을 할 수 있는지')
  })

  it('직접 적은 말도 문장 안에 들어간다', () => {
    const r = composeResult({
      ...emptyAnswers(),
      recurring: [],
      custom: { recurring: '쉬어도 되는지 모르겠어', burning: '새벽에 문제를 풀었을 때' },
    })
    expect(byId(r, 'recurring').text).toContain("'쉬어도 되는지 모르겠어'라는 말")
    expect(byId(r, 'burning').text).toContain("'새벽에 문제를 풀었을 때'였어요")
    expect(byId(r, 'recurring').text).not.toContain('이라는')
  })

  it('아무것도 고르지 않아도 깨지지 않고 다섯 문단을 준다', () => {
    const r = composeResult(emptyAnswers())
    expect(r).toHaveLength(5)
    r.forEach((p) => expect(p.text.length).toBeGreaterThan(10))
  })
})

describe('composeResult — 비어 보이지 않는가', () => {
  const minimumLength = 40

  it('모든 단계에서 선택지 하나씩만 고른 경우', () => {
    const r = composeResult({
      ...emptyAnswers(),
      recurring: ['must_prove'],
      hope: ['belonging'],
      evidence: ['results'],
      stations: ['첫 회사'],
      thread: ['make_first'],
      burning: ['made_something'],
      companions: ['words'],
      return: ['work_for_opening'],
    })
    r.forEach((p) => expect(p.text.length).toBeGreaterThan(minimumLength))
    // belonging인데 관계의 증거가 없으니 fallback으로 증거를 나열한다
    expect(byId(r, 'hope').text).toContain('직접 판단해서 만들어 낸 성과와 숫자가 있었어요')
    expect(byId(r, 'path').text).toContain('첫 회사. 한 곳이었지만')
    expect(byId(r, 'path').text).toContain('바로 없던 것을 처음 만들어 내는 일이에요')
    expect(byId(r, 'burning').text).toContain('처음 만든 것을 세상에 내놓은 순간이었어요')
    expect(byId(r, 'return').text).toContain('힘들 때 붙잡고 있던 말과 신념이 있었어요')
    expect(byId(r, 'return').practices![0].action).toContain('누가 무엇을 새롭게 깨달았지')
  })

  it("모든 단계를 '직접 적기'로만 채운 경우, 적은 말이 따옴표로 그대로 들어간다", () => {
    const custom = {
      recurring: '이 일을 계속해도 되는 걸까',
      hope: '팀을 끝까지 지키는 것',
      evidence: '떠난 뒤에도 연락 오는 후배들',
      thread: '엉킨 일정을 푸는 일',
      burning: '신입이 처음 발표를 해낸 날',
      companions: '매주 걷던 산책길',
      return: '다음 곳에서는 먼저 묻는 사람이 된다',
    }
    const r = composeResult({ ...emptyAnswers(), stations: ['A사', 'B사'], custom })
    r.forEach((p) => expect(p.text.length).toBeGreaterThan(minimumLength))
    const all = r.map((p) => [p.text, ...(p.practices ?? []).map((x) => x.action)].join(' ')).join(' ')
    for (const text of Object.values(custom)) expect(all).toContain(`'${text}'`)
    // 따옴표 안 말의 받침에 맞춰 조사가 붙는다
    expect(byId(r, 'recurring').text).toContain("'이 일을 계속해도 되는 걸까'라는 말")
    expect(byId(r, 'hope').text).toContain("'팀을 끝까지 지키는 것'이었지만")
    expect(byId(r, 'hope').text).toContain("'떠난 뒤에도 연락 오는 후배들'이 있었어요")
    expect(byId(r, 'path').text).toContain("바로 '엉킨 일정을 푸는 일'이에요")
    expect(byId(r, 'return').text).toContain("'매주 걷던 산책길'이 있었어요")
  })
})

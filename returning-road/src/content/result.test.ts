import { describe, expect, it } from 'vitest'
import { paragraphScenes } from './result'
import { steps } from './steps'

describe('말씀과 함께 걸은 사람의 결과 글', () => {
  it('다섯 문단에 일곱 걸음의 구절이 빠짐없이, 한 번씩 붙는다', () => {
    const keys = Object.values(paragraphScenes).flat()
    expect([...keys].sort()).toEqual(steps.map((s) => s.key).sort())
  })
})

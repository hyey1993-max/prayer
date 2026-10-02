import { describe, expect, it } from 'vitest'
import { fill, josa, joinList } from './josa'

describe('josa', () => {
  it('받침에 맞춰 조사를 고른다', () => {
    expect(josa('동료들', '이/가')).toBe('동료들이')
    expect(josa('친구', '이/가')).toBe('친구가')
    expect(josa('일', '을/를')).toBe('일을')
    expect(josa('길', '으로/로')).toBe('길로')
    expect(josa('집', '으로/로')).toBe('집으로')
    expect(josa('것', '이었/였')).toBe('것이었')
  })
  it('fill은 자리 뒤 조사를 고친다', () => {
    expect(fill('{x}이었어요', { x: '나무' })).toBe('나무였어요')
    expect(fill('{x}을 봐요', { x: '바다' })).toBe('바다를 봐요')
    // 따옴표 안 말의 받침을 보고 고른다
    expect(fill('{q}이라고', { q: "'산책길'" })).toBe("'산책길'이라고")
    expect(fill('{q}이라고', { q: "'걸까'" })).toBe("'걸까'라고")
  })
  it('joinList', () => {
    expect(joinList(['a'])).toBe('a')
    expect(joinList(['a', 'b', 'c'])).toBe('a, b, 그리고 c')
  })
})

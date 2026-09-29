/**
 * 한국어 조사를 앞말의 받침에 맞춰 고른다.
 * 한글이 아닌 글자로 끝나면(영문, 따옴표 등) 받침 없는 쪽을 쓴다.
 */

const DIGIT_HAS_FINAL: Record<string, boolean> = {
  '0': true, '1': true, '2': false, '3': true, '4': false,
  '5': false, '6': true, '7': true, '8': true, '9': false,
}

function lastMeaningfulChar(word: string): string {
  const trimmed = word.replace(/[\s'"’”)\].,]+$/u, '')
  return trimmed.charAt(trimmed.length - 1)
}

/** 마지막 글자에 받침이 있는가. 두 번째 값은 그 받침이 ㄹ인가. */
function finalConsonant(word: string): { has: boolean; rieul: boolean } {
  const ch = lastMeaningfulChar(word)
  const code = ch.charCodeAt(0)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const jong = (code - 0xac00) % 28
    return { has: jong !== 0, rieul: jong === 8 }
  }
  if (ch in DIGIT_HAS_FINAL) return { has: DIGIT_HAS_FINAL[ch], rieul: ch === '1' || ch === '7' || ch === '8' }
  return { has: false, rieul: false }
}

type Pair = '을/를' | '이/가' | '은/는' | '과/와' | '으로/로' | '이었/였' | '이에요/예요' | '이라고/라고' | '이라는/라는'

export function josa(word: string, pair: Pair): string {
  const { has, rieul } = finalConsonant(word)
  const [withFinal, without] = pair.split('/')
  if (pair === '으로/로') return word + (has && !rieul ? withFinal : without)
  return word + (has ? withFinal : without)
}

/** 'A, B, 그리고 C' 모양으로 잇는다. */
export function joinList(items: string[], last = '그리고'): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')}, ${last} ${items[items.length - 1]}`
}

/**
 * 템플릿의 {자리}를 채우고, 바로 뒤에 붙은 조사를 채운 말에 맞춰 고친다.
 * 예: fill('{x}이었어요', { x: '순간' }) → '순간이었어요', { x: '것' } → '것이었어요'
 */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(
    /\{(\w+)\}(이라고|라고|이라는|라는|을|를|이었|였|이에요|예요|이|가|은|는|과|와|으로|로)?/g,
    (_, key: string, particle: string | undefined) => {
      const value = values[key] ?? ''
      if (!particle) return value
      const pair = PARTICLE_PAIRS[particle]
      return pair ? josa(value, pair) : value + particle
    },
  )
}

const PARTICLE_PAIRS: Record<string, Pair> = {
  을: '을/를', 를: '을/를',
  이: '이/가', 가: '이/가',
  은: '은/는', 는: '은/는',
  과: '과/와', 와: '과/와',
  으로: '으로/로', 로: '으로/로',
  이었: '이었/였', 였: '이었/였',
  이에요: '이에요/예요', 예요: '이에요/예요',
  이라고: '이라고/라고', 라고: '이라고/라고',
  이라는: '이라는/라는', 라는: '이라는/라는',
}

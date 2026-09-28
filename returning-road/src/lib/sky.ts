/** 해가 기우는 길: 0(한낮) → 1(저녁) 사이의 배경과 글자색을 계산한다. */

export const palette = {
  noonStone: '#DCDFD8',
  duskSlate: '#58657A',
  eveningNavy: '#1E2433',
  ink: '#23262C',
  eveningText: '#E7E4DC',
  lamp: '#E3AE52',
}

type RGB = [number, number, number]

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB
const toHex = (c: RGB) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
const mix = (a: RGB, b: RGB, t: number): RGB => a.map((v, i) => v + (b[i] - v) * t) as RGB

function luminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: RGB, b: RGB): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

export interface Sky {
  bg: string
  fg: string
  muted: string
  hairline: string
  dark: boolean
}

export function skyAt(dusk: number): Sky {
  const t = Math.min(1, Math.max(0, dusk))
  const stone = hex(palette.noonStone)
  const slate = hex(palette.duskSlate)
  const navy = hex(palette.eveningNavy)
  const bg = t < 0.5 ? mix(stone, slate, t / 0.5) : mix(slate, navy, (t - 0.5) / 0.5)

  const ink = hex(palette.ink)
  const light = hex(palette.eveningText)
  const dark = contrast(bg, light) > contrast(bg, ink)
  const fg = dark ? light : ink

  return {
    bg: toHex(bg),
    fg: toHex(fg),
    muted: toHex(mix(fg, bg, 0.32)),
    hairline: toHex(mix(fg, bg, 0.78)),
    dark,
  }
}

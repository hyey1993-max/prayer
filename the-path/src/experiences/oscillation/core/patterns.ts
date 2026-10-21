/** Everything a pattern needs about this moment. Focus is in field units. */
export interface PatternContext {
  t: number
  /** Spatial frequency multiplier. */
  k: number
  /** Amplitude multiplier; rises with pointer energy. */
  amp: number
  fx: number
  fy: number
}

/** Where one digit goes. `s` scales its size, `a` its brightness, both 0..~1.
 * `digit` overrides the cell's own bit when the pattern encodes something. */
export interface Sample {
  x: number
  y: number
  s: number
  a: number
  digit: number
}

export const OWN_BIT = -1

/** A pattern maps grid coordinates u, v ∈ [-1, 1] into the field (x roughly
 * in [-1, 1], y in [-0.75, 0.75]). Writes into `out` to avoid allocation. */
export type Pattern = (u: number, v: number, c: PatternContext, out: Sample) => void

const TAU = Math.PI * 2

/** A ribbon twisting along its length. Digits read out their own depth. */
const twist: Pattern = (u, v, c, out) => {
  const theta = u * Math.PI * 0.9 * c.k + c.t * 0.6 + c.fx * 1.6
  const w = v * 0.32
  const lift = Math.sin(u * 2.2 * c.k + c.t * 0.9) * 0.18 * c.amp + c.fy * 0.3
  const y3 = w * Math.cos(theta) + lift
  const z3 = w * Math.sin(theta)
  const persp = 1 / (1.25 - z3 * 0.9)
  const depth = (z3 / 0.32 + 1) / 2
  out.x = u * persp * 0.92
  out.y = y3 * persp
  out.s = 0.4 + 0.8 * depth
  out.a = 0.2 + 0.8 * depth
  out.digit = Math.min(9, Math.floor(depth * 10))
}

/** Columns narrowing into a waist at the focus, rippling as they go. */
const tunnel: Pattern = (u, v, c, out) => {
  const y = v * 0.78
  const dv = Math.abs(y - c.fy * 0.6)
  const spread = 0.1 + 0.9 * Math.pow(Math.min(1, dv / 0.8), 0.85)
  const wave = Math.sin(y * 5 * c.k - c.t * 1.6 + u * 1.5) * 0.06 * c.amp * (1 - spread * 0.5)
  out.x = (u * spread + c.fx * 0.3 * (1 - spread)) * 0.95 + wave
  out.y = y
  out.s = 0.32 + 0.78 * spread
  out.a = 0.22 + 0.78 * spread
  out.digit = OWN_BIT
}

/** A turning cylinder of rows; its back half recedes. */
const barrel: Pattern = (u, v, c, out) => {
  const phi = u * Math.PI + c.t * 0.45 + c.fx * Math.PI * 0.5
  const ring = 0.6 + 0.18 * Math.cos(v * Math.PI * 0.5) + 0.08 * c.amp * Math.sin(v * 3 * c.k + c.t * 1.2)
  const z = Math.cos(phi)
  const depth = (z + 1) / 2
  out.x = Math.sin(phi) * ring
  out.y = v * 0.66 + z * (0.04 + c.fy * 0.12)
  out.s = 0.38 + 0.72 * depth
  out.a = 0.08 + 0.92 * depth
  out.digit = OWN_BIT
}

/** Two wave sources — the center and the focus — interfering. Each digit is
 * the sign of the wave where it stands. */
const interference: Pattern = (u, v, c, out) => {
  const x0 = u
  const y0 = v * 0.75
  const r1 = Math.hypot(x0, y0)
  const r2 = Math.hypot(x0 - c.fx, y0 - c.fy)
  const w = 9 * c.k
  const h = (Math.sin(r1 * w - c.t * 2.2) + Math.sin(r2 * w - c.t * 2.2)) * 0.5
  const push = (h * 0.025 * c.amp) / (r1 || 1)
  const m = Math.abs(h)
  out.x = x0 + x0 * push
  out.y = y0 + y0 * push
  out.s = 0.32 + 0.8 * m
  out.a = 0.12 + 0.88 * m
  out.digit = h > 0 ? 1 : 0
}

/** A grid carried by slow currents, with a lens wherever the focus is. */
const flow: Pattern = (u, v, c, out) => {
  const x0 = u
  const y0 = v * 0.75
  let x = x0 + 0.07 * c.amp * Math.sin(y0 * 3.1 * c.k + c.t * 0.7) + 0.035 * Math.sin(x0 * 6.3 * c.k - c.t * 1.1)
  let y = y0 + 0.07 * c.amp * Math.cos(x0 * 2.7 * c.k - c.t * 0.6) + 0.035 * Math.cos(y0 * 5.9 * c.k + c.t * 0.9)
  const dx = x - c.fx
  const dy = y - c.fy
  const lens = Math.exp(-(dx * dx + dy * dy) / 0.08)
  x += dx * lens * 0.35
  y += dy * lens * 0.35
  const size = 0.5 + 0.5 * Math.sin(x0 * 4 * c.k + y0 * 3 + c.t)
  out.x = x
  out.y = y
  out.s = 0.38 + 0.5 * size + 0.5 * lens
  out.a = 0.28 + 0.5 * size + 0.22 * lens
  out.digit = OWN_BIT
}

/** Rows gathered into a few data lines that scatter where the focus passes. */
const lines: Pattern = (u, v, c, out) => {
  const bands = 7
  const f = ((v + 1) / 2) * (bands - 0.0001)
  const b = Math.floor(f)
  const within = f - b
  const center = 1 - Math.abs(within - 0.5) * 2
  const near = Math.exp(-((u - c.fx) * (u - c.fx)) / 0.12) * Math.exp(-((v * 0.75 - c.fy) ** 2) / 0.6)
  const baseY = (b - (bands - 1) / 2) * 0.17
  const scatter = (within - 0.5) * (0.04 + near * 0.22 * c.amp)
  const wave = Math.sin(u * 4 * c.k - c.t * 1.8 + b * 1.3) * 0.025 * c.amp
  out.x = u + Math.sin(c.t * 0.5 + b) * 0.02
  out.y = baseY + scatter + wave
  out.s = 0.42 + 0.3 * center
  out.a = 0.06 + 0.94 * Math.pow(center, 3) + near * 0.3 * (1 - center)
  out.digit = OWN_BIT
}

export const PATTERNS: readonly { name: string; map: Pattern }[] = [
  { name: 'TWIST', map: twist },
  { name: 'TUNNEL', map: tunnel },
  { name: 'BARREL', map: barrel },
  { name: 'INTERFERENCE', map: interference },
  { name: 'FLOW', map: flow },
  { name: 'LINES', map: lines },
]

/** Slow wandering focus for when nobody is there. */
export function idleFocus(t: number, amount: number): { x: number; y: number } {
  return { x: Math.sin(t * 0.21 * TAU * 0.25) * amount, y: Math.sin(t * 0.17 * TAU * 0.25 + 1.1) * amount * 0.6 }
}

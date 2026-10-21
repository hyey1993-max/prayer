import { createRng } from '../../../shared/rng'

/** Smooth, deterministic, non-repeating-looking signal in -1..1: a sum of
 * sines at incommensurate frequencies. The object's "own life" is built from
 * these — coherent and continuous, never per-frame randomness. */
export function makeSmoothNoise(seed: number, octaves = 4): (t: number) => number {
  const rng = createRng(seed)
  const terms = Array.from({ length: octaves }, (_, i) => ({
    f: (0.37 + rng() * 0.5) * Math.pow(1.83, i),
    p: rng() * Math.PI * 2,
    a: Math.pow(0.55, i),
  }))
  const norm = terms.reduce((s, term) => s + term.a, 0)
  return (t: number) => terms.reduce((s, term) => s + term.a * Math.sin(t * term.f + term.p), 0) / norm
}

import { CONFIG } from '../config/constants'
import { makeSmoothNoise } from '../../../shared/noise'

export interface Direction {
  fx: number
  fy: number
  /** Amplitude before event surges are added. */
  amp: number
  k: number
}

/**
 * The piece's own hand: where the focus is, how strongly the field swings
 * and at what frequency, at piece time `t`. Built from smooth deterministic
 * noise, so the motion is continuous and never repeats exactly.
 */
export function createDirector(seed: number): (t: number) => Direction {
  const c = CONFIG.choreography
  const nx = makeSmoothNoise(seed + 11)
  const ny = makeSmoothNoise(seed + 12)
  const na = makeSmoothNoise(seed + 13, 3)
  const nk = makeSmoothNoise(seed + 14, 2)
  return (t) => ({
    fx: nx(t * c.focusSpeed) * c.focusRangeX,
    fy: ny(t * c.focusSpeed * 0.83) * c.focusRangeY,
    amp: 1 + c.ampSwing * Math.max(0, na(t * c.ampSpeed)),
    k: c.frequencyMin + (c.frequencyMax - c.frequencyMin) * ((nk(t * c.frequencySpeed) + 1) / 2),
  })
}

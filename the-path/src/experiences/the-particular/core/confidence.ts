import { CONFIG } from '../config/constants'
import type { CycleStatus } from '../models/State'

export function initialConfidence(): number {
  return CONFIG.prediction.confidenceFloor
}

/** Confidence eases toward a ceiling set by how much of this individual the
 * model has learned (`modeledFraction`) — which itself never reaches 1 — and
 * dips on a failed or unexpected cycle before continuing to approach it.
 * It never reaches 100%. */
export function updateConfidence(
  prev: number,
  modeledFraction: number,
  outcome: CycleStatus,
): number {
  const cfg = CONFIG.prediction
  const target = cfg.confidenceFloor + modeledFraction * (cfg.confidenceCeiling - cfg.confidenceFloor)
  let next = prev + (target - prev) * cfg.confidenceLerp
  if (outcome === 'failed' || outcome === 'unexpected') {
    next *= cfg.confidenceDropOnFailure
  }
  return Math.min(cfg.confidenceCeiling, Math.max(cfg.confidenceFloor, next))
}

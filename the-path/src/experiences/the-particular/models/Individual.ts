import type { Action } from './Action'

export interface Vec2 {
  x: number
  y: number
}

export interface Individual {
  id: string
  /** Measurable feature vector, each dimension 0..1. What the system
   * classifies and predicts on. */
  features: number[]
  /** A fixed, never-displayed personal bias vector. Part of what the
   * "unmodeled" residual draws on — the system can partially learn to
   * anticipate it (see `modeledFraction`) but never fully absorb it. */
  signature: number[]
  position: Vec2
  velocity: Vec2
  /** Per-individual deterministic offset from its group anchor, so a
   * cluster reads as a soft cloud rather than overlapping points. */
  clusterOffset: Vec2
  /** Phase offsets for the ambient wandering motion in STATE 01. */
  wanderSeed: number
  groupId: string | null
  /** How much of this individual's behavior the model has learned to
   * anticipate, 0..CONFIG.prediction.maxModeledFraction. Never reaches 1. */
  modeledFraction: number
  /** Rolling model confidence for this individual, 0..1. */
  confidence: number
  history: Action[]
}

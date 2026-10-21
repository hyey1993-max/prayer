import { CONFIG } from '../config/constants'
import type { Memory } from './memory'

/**
 * The relation the returning object starts from. Two strands, both always
 * present, neither a category: an instrumental strand (measured, immediate,
 * rigidly linked) and a mutual strand (its own delay, linked both ways).
 * These describe the relation, not the person, and are never displayed.
 */
export interface Relation {
  instrumental: number
  mutual: number
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export function relationFromMemory(m: Memory): Relation {
  return {
    instrumental: clamp01(
      0.15 + 0.07 * m.measurements + 0.03 * m.clicks + 0.25 * Math.min(1, m.pursuitSeconds / 6),
    ),
    mutual: clamp01(
      0.05 +
        0.55 * Math.min(1, m.meetingMs / 6000) +
        0.25 * Math.min(1, m.stillSeconds / 12) +
        0.15 * Math.min(1, m.longestPauseMs / 8000),
    ),
  }
}

export interface RelationShape {
  /** 0..1 share of the instrumental strand. */
  instrumentalShare: number
  /** 0..1 share of the mutual strand. */
  mutualShare: number
  /** Distance the object keeps from the I. */
  distance: number
  /** How long it takes to answer the I. */
  latencyMs: number
}

export function shapeOf(r: Relation): RelationShape {
  const total = r.instrumental + r.mutual
  const mutualShare = r.mutual / total
  const ret = CONFIG.ret
  return {
    instrumentalShare: 1 - mutualShare,
    mutualShare,
    distance: ret.distanceFar + (ret.distanceNear - ret.distanceFar) * mutualShare,
    latencyMs: ret.latencyMaxMs * mutualShare,
  }
}

export function nudge(r: Relation, instrumental: number, mutual: number) {
  r.instrumental = clamp01(r.instrumental + instrumental)
  r.mutual = clamp01(r.mutual + mutual)
}

import { CONFIG } from '../config/constants'
import type { Vec2 } from '../models/types'

interface Sample {
  t: number
  x: number
  y: number
}

export interface Presence {
  samples: Sample[]
  pos: Vec2 | null
  inside: boolean
  /** Smoothed pointer speed, px/s. */
  speed: number
  /** Smoothed rate of closing distance to the object, px/s (positive = approaching). */
  approach: number
  distance: number
  stillMs: number
  lastMoveAt: number
  lastInputAt: number
}

const HISTORY_MS = 2000

export function createPresence(now: number): Presence {
  return {
    samples: [],
    pos: null,
    inside: false,
    speed: 0,
    approach: 0,
    distance: Infinity,
    stillMs: 0,
    lastMoveAt: now,
    lastInputAt: now,
  }
}

export function recordPointer(p: Presence, x: number, y: number, now: number) {
  p.pos = { x, y }
  p.inside = true
  p.samples.push({ t: now, x, y })
  p.lastMoveAt = now
  while (p.samples.length > 0 && now - p.samples[0].t > HISTORY_MS) p.samples.shift()
}

export function updatePresence(p: Presence, now: number, dtMs: number, objectCenter: Vec2) {
  // Speed from the last ~120ms of samples; zero once the pointer rests.
  let instSpeed = 0
  const recent = p.samples.filter((s) => now - s.t <= 120)
  if (recent.length >= 2) {
    const a = recent[0]
    const b = recent[recent.length - 1]
    const span = Math.max(16, b.t - a.t)
    instSpeed = (Math.hypot(b.x - a.x, b.y - a.y) / span) * 1000
  }
  const k = Math.min(1, dtMs / 140)
  p.speed += (instSpeed - p.speed) * k

  if (p.pos && p.inside) {
    const d = Math.hypot(p.pos.x - objectCenter.x, p.pos.y - objectCenter.y)
    if (Number.isFinite(p.distance)) {
      const instApproach = ((p.distance - d) / Math.max(1, dtMs)) * 1000
      p.approach += (instApproach - p.approach) * k
    }
    p.distance = d
  } else {
    p.distance = Infinity
    p.approach *= 1 - k
  }

  p.stillMs = p.speed < CONFIG.encounter.stillSpeed ? p.stillMs + dtMs : 0
}

/** Where the pointer was `delayMs` ago — the object answers to this, not to
 * where the pointer is now. */
export function delayedPosition(p: Presence, now: number, delayMs: number): Vec2 | null {
  if (!p.pos || !p.inside) return null
  const t = now - delayMs
  for (let i = p.samples.length - 1; i >= 0; i--) {
    if (p.samples[i].t <= t) return { x: p.samples[i].x, y: p.samples[i].y }
  }
  return p.samples.length > 0 ? { x: p.samples[0].x, y: p.samples[0].y } : p.pos
}

/** 0..1 — near, unhurried, simply there. */
export function presenceQuality(p: Presence): number {
  const e = CONFIG.encounter
  if (!p.pos || !p.inside || !Number.isFinite(p.distance)) return 0
  const d = p.distance
  let near: number
  if (d < e.nearMin) near = d / e.nearMin
  else if (d <= e.nearMax) near = 1
  else near = Math.max(0, 1 - (d - e.nearMax) / e.nearMax)
  const calm = Math.max(0, 1 - p.speed / (e.stillSpeed * 4))
  const settled = Math.min(1, p.stillMs / 1200)
  return near * (0.25 * calm + 0.75 * settled)
}

/** 0..1 — closing in on the object quickly. */
export function pursuitLevel(p: Presence): number {
  const e = CONFIG.encounter
  if (!p.pos || !p.inside || p.distance > e.pursuitRange) return 0
  return Math.min(1, Math.max(0, p.approach / e.pursuitSpeed))
}

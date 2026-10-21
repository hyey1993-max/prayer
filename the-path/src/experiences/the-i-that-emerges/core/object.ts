import { CONFIG } from '../config/constants'
import type { Vec2 } from '../models/types'
import { makeSmoothNoise } from './noise'

/** What the object is on its own terms — fixed for its whole life, so that
 * when it is met again it is the same object. */
export interface ObjectNature {
  wanderX: (t: number) => number
  wanderY: (t: number) => number
  hueDrift: (t: number) => number
  initialPhases: number[]
  /** Phase of its own readiness rhythm; never shown. */
  readinessPhase: number
  /** Varies how long it takes to perceive the person, on its own schedule. */
  perceptionDelay: (t: number) => number
}

export interface ObjectState {
  /** Center offset from the screen center. */
  offset: Vec2
  vel: Vec2
  /** 1 = moving entirely on its own; measurement lowers it. */
  autonomy: number
  phases: number[]
  quantize: number
  saturation: number
  outline: number
  hue: number
  orientation: number
  bulge: number
  ownTime: number
  /** Rotation of its point volume; slows as it is measured. */
  spin: number
  center: Vec2
  boundary: Vec2[]
}

export function createNature(seed: number): ObjectNature {
  const phaseNoise = makeSmoothNoise(seed + 7, 2)
  return {
    wanderX: makeSmoothNoise(seed + 1),
    wanderY: makeSmoothNoise(seed + 2),
    hueDrift: makeSmoothNoise(seed + 3, 2),
    initialPhases: CONFIG.object.harmonics.map((_, i) => phaseNoise(i * 3.1) * Math.PI),
    readinessPhase: (phaseNoise(17.3) + 1) * Math.PI,
    perceptionDelay: makeSmoothNoise(seed + 5, 2),
  }
}

export function createObject(nature: ObjectNature): ObjectState {
  return {
    offset: { x: 0, y: 0 },
    vel: { x: 0, y: 0 },
    autonomy: 1,
    phases: [...nature.initialPhases],
    quantize: 0,
    saturation: CONFIG.object.saturation,
    outline: 0,
    hue: CONFIG.object.hue,
    orientation: 0,
    bulge: 0,
    ownTime: 0,
    spin: 0,
    center: { x: 0, y: 0 },
    boundary: Array.from({ length: CONFIG.object.vertices }, () => ({ x: 0, y: 0 })),
  }
}

export function wanderOffset(nature: ObjectNature, t: number, amplitude: number): Vec2 {
  const s = t * CONFIG.object.wanderTimeScale
  return {
    x: nature.wanderX(s) * CONFIG.object.wanderRadius * amplitude,
    y: nature.wanderY(s) * CONFIG.object.wanderRadius * amplitude * 0.75,
  }
}

/** The regular, predictable motion classification replaces it with. */
export function orbitOffset(nowMs: number): Vec2 {
  const a = (nowMs / CONFIG.classify.orbitPeriodMs) * Math.PI * 2
  return { x: Math.cos(a) * CONFIG.classify.orbitRadius, y: Math.sin(a) * CONFIG.classify.orbitRadius }
}

export function perceptionDelayMs(nature: ObjectNature, t: number): number {
  const e = CONFIG.encounter
  const u = (nature.perceptionDelay(t * 0.13) + 1) / 2
  return e.perceptionDelayMinMs + u * (e.perceptionDelayMaxMs - e.perceptionDelayMinMs)
}

/** Its own readiness to turn toward anything, 0..1 — independent of the
 * person, on a rhythm they can't see. */
export function readiness(nature: ObjectNature, t: number): number {
  const period = CONFIG.encounter.readinessPeriodMs / 1000
  const base = Math.sin((t / period) * Math.PI * 2 + nature.readinessPhase)
  const wobble = nature.hueDrift(t * 0.21)
  return Math.min(1, Math.max(0, 0.5 + base * 0.38 + wobble * 0.14))
}

/** Advances the object one frame toward `target` (an offset from the screen
 * center) and recomputes its outline in screen space. */
export function stepObject(
  obj: ObjectState,
  nature: ObjectNature,
  dt: number,
  target: Vec2,
  stiffness: number,
  origin: Vec2,
) {
  const o = CONFIG.object
  obj.ownTime += dt

  // Frame-normalized spring: stiffness ~1 is soft and slow, ~6 is mechanical.
  const f = dt * 60
  const k = 0.008 * stiffness * f
  const damp = Math.pow(o.damping, f)
  obj.vel.x = obj.vel.x * damp + (target.x - obj.offset.x) * k
  obj.vel.y = obj.vel.y * damp + (target.y - obj.offset.y) * k
  obj.offset.x += obj.vel.x * f
  obj.offset.y += obj.vel.y * f

  obj.spin += dt * CONFIG.dots.spinSpeed * (0.1 + 0.9 * obj.autonomy)
  const phaseRate = 0.3 + 0.7 * obj.autonomy
  o.harmonics.forEach((h, i) => {
    obj.phases[i] += h.speed * dt * phaseRate
  })
  obj.hue = o.hue + nature.hueDrift(obj.ownTime * 0.05) * o.hueDrift * obj.autonomy

  obj.center = { x: origin.x + obj.offset.x, y: origin.y + obj.offset.y }
  const grid = CONFIG.classify.gridSize
  for (let i = 0; i < o.vertices; i++) {
    const theta = (i / o.vertices) * Math.PI * 2
    let shape = 0
    o.harmonics.forEach((h, k) => {
      shape += h.amp * Math.sin(h.k * theta + obj.phases[k])
    })
    const r =
      o.radius * (1 + obj.autonomy * shape + obj.bulge * 0.16 * Math.cos(theta - obj.orientation))
    let x = obj.center.x + Math.cos(theta) * r
    let y = obj.center.y + Math.sin(theta) * r
    if (obj.quantize > 0.001) {
      const sx = origin.x + Math.round((x - origin.x) / grid) * grid
      const sy = origin.y + Math.round((y - origin.y) / grid) * grid
      x += (sx - x) * obj.quantize
      y += (sy - y) * obj.quantize
    }
    obj.boundary[i].x = x
    obj.boundary[i].y = y
  }
}

/** Mutual coupling: outline points within reach lean toward the I. */
export function leanBoundaryToward(obj: ObjectState, point: Vec2, coupling: number) {
  if (coupling <= 0.001) return
  const reach = 180
  const k = CONFIG.encounter.boundaryCoupling * coupling
  for (const p of obj.boundary) {
    const dx = point.x - p.x
    const dy = point.y - p.y
    const d = Math.hypot(dx, dy)
    if (d < reach) {
      const f = k * (1 - d / reach)
      p.x += dx * f
      p.y += dy * f
    }
  }
}

export function meanRadius(obj: ObjectState): number {
  return (
    obj.boundary.reduce((s, p) => s + Math.hypot(p.x - obj.center.x, p.y - obj.center.y), 0) /
    obj.boundary.length
  )
}

export function containsPoint(obj: ObjectState, p: Vec2): boolean {
  return Math.hypot(p.x - obj.center.x, p.y - obj.center.y) <= meanRadius(obj) * 1.08
}

import { CONFIG } from '../config/constants'
import type { Vec2 } from '../models/types'

interface IPoint {
  home: Vec2
  p: Vec2
  phase: number
}

/**
 * The person's own presence on screen — the cursor is the I. It has no fixed
 * form: a bare point before any relation, a reticle when measuring, a soft
 * field when meeting, and in between whatever the current relation makes it.
 */
export interface IField {
  pos: Vec2
  visible: boolean
  reticle: number
  cloud: number
  points: IPoint[]
}

export function createIField(): IField {
  const n = CONFIG.iField.points
  const golden = Math.PI * (3 - Math.sqrt(5))
  const points: IPoint[] = Array.from({ length: n }, (_, i) => {
    const r = Math.sqrt((i + 0.5) / n) * CONFIG.iField.radius
    const a = i * golden
    const home = { x: Math.cos(a) * r, y: Math.sin(a) * r }
    return { home, p: { x: 0, y: 0 }, phase: i * 1.7 }
  })
  return { pos: { x: 0, y: 0 }, visible: false, reticle: 0, cloud: 0, points }
}

/**
 * Moves the field with the pointer. When `coupling` > 0, each point is drawn
 * toward the nearest point of the object's outline — the I takes some of its
 * shape from what it is in relation with.
 */
export function stepIField(
  f: IField,
  cursor: Vec2 | null,
  dtMs: number,
  ownTime: number,
  targets: { reticle: number; cloud: number },
  boundary: Vec2[],
  coupling: number,
) {
  const c = CONFIG.iField
  const k = Math.min(1, c.modeEase * (dtMs / 16.7))
  f.reticle += (targets.reticle - f.reticle) * k
  f.cloud += (targets.cloud - f.cloud) * k

  if (cursor) {
    if (!f.visible) {
      f.pos = { ...cursor }
      for (const pt of f.points) pt.p = { x: cursor.x + pt.home.x, y: cursor.y + pt.home.y }
    }
    f.pos = { ...cursor }
    f.visible = true
  }

  const ease = Math.min(1, c.ease * (dtMs / 16.7))
  for (const pt of f.points) {
    const breathe = 1 + Math.sin(ownTime * 0.9 + pt.phase) * 0.12
    let tx = f.pos.x + pt.home.x * breathe
    let ty = f.pos.y + pt.home.y * breathe

    if (coupling > 0.001 && boundary.length > 0) {
      let best = boundary[0]
      let bestD = Infinity
      for (let i = 0; i < boundary.length; i += 3) {
        const b = boundary[i]
        const d = (b.x - tx) * (b.x - tx) + (b.y - ty) * (b.y - ty)
        if (d < bestD) {
          bestD = d
          best = b
        }
      }
      const dist = Math.sqrt(bestD)
      const reach = 220
      if (dist < reach) {
        const pull = c.pull * coupling * (1 - dist / reach)
        tx += (best.x - tx) * pull
        ty += (best.y - ty) * pull
      }
    }

    pt.p.x += (tx - pt.p.x) * ease
    pt.p.y += (ty - pt.p.y) * ease
  }
}

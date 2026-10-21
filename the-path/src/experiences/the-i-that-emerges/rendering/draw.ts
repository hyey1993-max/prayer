import { CONFIG } from '../config/constants'
import type { Attribute, Vec2 } from '../models/types'
import type { IField } from '../core/ifield'
import type { ObjectState } from '../core/object'
import { objectRgb } from '../core/measure'

export const MONO = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

export function ink(alpha: number): string {
  const [r, g, b] = CONFIG.visual.ink
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = CONFIG.visual.bg
  ctx.fillRect(0, 0, w, h)
}

/** A dot matrix rather than ruled lines: the field becomes addressable. */
export function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, origin: Vec2, order: number) {
  const alpha = CONFIG.visual.gridAlphaMax * order
  if (alpha <= 0.004) return
  const g = CONFIG.classify.gridSize
  ctx.fillStyle = ink(alpha)
  ctx.beginPath()
  const startX = origin.x - Math.ceil(origin.x / g) * g
  const startY = origin.y - Math.ceil(origin.y / g) * g
  for (let x = startX; x <= w; x += g) {
    for (let y = startY; y <= h; y += g) ctx.rect(Math.round(x), Math.round(y), 1, 1)
  }
  ctx.fill()
}

export function drawSpecimenFrame(
  ctx: CanvasRenderingContext2D,
  center: Vec2,
  order: number,
  specimen: string,
) {
  if (order <= 0.01) return
  const half = CONFIG.object.radius + 30
  const arm = 12
  ctx.strokeStyle = ink(0.55 * order)
  ctx.lineWidth = 0.8
  ctx.beginPath()
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const cx = center.x + sx * half
    const cy = center.y + sy * half
    ctx.moveTo(cx, cy - sy * arm)
    ctx.lineTo(cx, cy)
    ctx.lineTo(cx - sx * arm, cy)
  }
  ctx.stroke()
  ctx.font = MONO
  ctx.fillStyle = ink(0.5 * order)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(specimen, center.x - half, center.y + half + 8)
}

/** Unit directions spread evenly over a sphere (Fibonacci lattice). */
export function makeSphere(count: number): Float32Array {
  const pts = new Float32Array(count * 3)
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < count; i++) {
    const y = 1 - ((i + 0.5) / count) * 2
    const r = Math.sqrt(1 - y * y)
    const phi = i * golden
    pts[i * 3] = Math.cos(phi) * r
    pts[i * 3 + 1] = y
    pts[i * 3 + 2] = Math.sin(phi) * r
  }
  return pts
}

const LEVELS = 8

/**
 * The object as a volume of points. Each point is a direction on a turning
 * sphere; its projected position is scaled by the object's measured outline
 * in that direction, so the silhouette is exactly what measurement sees.
 *
 * `flatten` (0..1) is what measurement does to it: points snap to a halftone
 * lattice and lose their depth. `pullTo`/`coupling` is what meeting does:
 * points within reach flow toward the I.
 */
export function drawDotObject(
  ctx: CanvasRenderingContext2D,
  obj: ObjectState,
  sphere: Float32Array,
  flatten: number,
  pullTo: Vec2 | null,
  coupling: number,
) {
  const d = CONFIG.dots
  const n = obj.boundary.length
  const radii = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    radii[i] = Math.hypot(obj.boundary[i].x - obj.center.x, obj.boundary[i].y - obj.center.y)
  }

  const cs = Math.cos(obj.spin)
  const ss = Math.sin(obj.spin)
  const ct = Math.cos(d.tilt)
  const st = Math.sin(d.tilt)
  const step = d.halftoneStep
  const breathe = d.breathe * obj.autonomy
  const t = obj.ownTime
  const pulling = pullTo !== null && coupling > 0.001

  const buckets: number[][] = Array.from({ length: LEVELS }, () => [])
  const count = sphere.length / 3
  for (let i = 0; i < count; i++) {
    const x0 = sphere[i * 3]
    const y0 = sphere[i * 3 + 1]
    const z0 = sphere[i * 3 + 2]
    const x1 = x0 * cs + z0 * ss
    const z1 = -x0 * ss + z0 * cs
    const y2 = y0 * ct - z1 * st
    const z2 = y0 * st + z1 * ct

    let theta = Math.atan2(y2, x1)
    if (theta < 0) theta += Math.PI * 2
    const f = (theta / (Math.PI * 2)) * n
    const i0 = Math.floor(f) % n
    const i1 = (i0 + 1) % n
    const r = radii[i0] + (radii[i1] - radii[i0]) * (f - Math.floor(f))

    let x = obj.center.x + x1 * r + Math.sin(t * 1.3 + i * 0.7) * breathe
    let y = obj.center.y + y2 * r + Math.cos(t * 1.1 + i * 0.9) * breathe

    if (pulling && pullTo) {
      const dx = pullTo.x - x
      const dy = pullTo.y - y
      const dist = Math.hypot(dx, dy)
      if (dist < d.reach) {
        const s = d.pull * coupling * (1 - dist / d.reach) * (0.5 + 0.5 * ((z2 + 1) / 2))
        x += dx * s
        y += dy * s
      }
    }
    if (flatten > 0.001) {
      x += (Math.round(x / step) * step - x) * flatten
      y += (Math.round(y / step) * step - y) * flatten
    }

    const depth = (z2 + 1) / 2
    const level = depth * (1 - flatten) + 0.72 * flatten
    const b = Math.min(LEVELS - 1, Math.floor(level * LEVELS))
    buckets[b].push(x, y)
  }

  const [cr, cg, cb] = objectRgb(obj)
  for (let b = 0; b < LEVELS; b++) {
    const pts = buckets[b]
    if (pts.length === 0) continue
    const u = (b + 0.5) / LEVELS
    const alpha = 0.18 + 0.82 * Math.pow(u, 1.4)
    const size = 0.7 + 1.1 * u
    ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha.toFixed(3)})`
    ctx.beginPath()
    for (let k = 0; k < pts.length; k += 2) ctx.rect(pts[k] - size / 2, pts[k + 1] - size / 2, size, size)
    ctx.fill()
  }
}

export interface LabelLayout {
  colX: number
  valueX: number
  rowY: (index: number) => number
}

export function labelLayout(obj: ObjectState, w: number): LabelLayout {
  const R = CONFIG.object.radius
  const row = CONFIG.classify.labelRowHeight
  const narrow = w < 760
  const colX = narrow ? Math.max(16, obj.center.x - 130) : Math.min(obj.center.x + R + 130, w - 350)
  const y0 = narrow ? obj.center.y + R + 64 : obj.center.y - (row * 7) / 2
  return { colX, valueX: colX + 112, rowY: (i) => y0 + i * row }
}

export function anchorPoint(obj: ObjectState, angle: number): Vec2 {
  const n = obj.boundary.length
  const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
  return obj.boundary[Math.round((a / (Math.PI * 2)) * n) % n]
}

/** The attribute column, ordered, each tied back to a point on the object. */
export function drawLabels(
  ctx: CanvasRenderingContext2D,
  obj: ObjectState,
  attributes: Attribute[],
  w: number,
  alpha: number,
) {
  if (alpha <= 0.005 || attributes.length === 0) return
  const layout = labelLayout(obj, w)

  ctx.font = MONO
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  attributes.forEach((a, i) => {
    const y = layout.rowY(i)
    const p = anchorPoint(obj, a.anchorAngle)
    ctx.strokeStyle = ink(0.3 * alpha)
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(layout.colX - 10, y)
    ctx.stroke()
    ctx.fillStyle = ink(0.9 * alpha)
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3)
    ctx.fillStyle = ink(0.42 * alpha)
    ctx.fillText(a.key, layout.colX, y)
    ctx.fillStyle = ink(0.88 * alpha)
    ctx.fillText(a.value, layout.valueX, y)
  })
}

/** The between: thin lines across the space shared by the object and the I. */
export function drawThreads(ctx: CanvasRenderingContext2D, obj: ObjectState, f: IField, strength: number) {
  const alpha = CONFIG.visual.threadAlphaMax * strength
  if (alpha <= 0.003 || !f.visible) return
  ctx.lineWidth = 0.5
  for (let i = 0; i < obj.boundary.length; i += 4) {
    const b = obj.boundary[i]
    let best = f.points[0].p
    let bestD = Infinity
    for (const pt of f.points) {
      const d = (pt.p.x - b.x) ** 2 + (pt.p.y - b.y) ** 2
      if (d < bestD) {
        bestD = d
        best = pt.p
      }
    }
    const dist = Math.sqrt(bestD)
    if (dist > 280) continue
    ctx.strokeStyle = ink(alpha * (1 - dist / 280))
    ctx.beginPath()
    ctx.moveTo(b.x, b.y)
    ctx.lineTo(best.x, best.y)
    ctx.stroke()
  }
}

export function drawIField(ctx: CanvasRenderingContext2D, f: IField, readout: boolean) {
  if (!f.visible) return
  const c = CONFIG.iField
  const { x, y } = f.pos

  // The bare point is always there.
  ctx.fillStyle = ink(0.95)
  ctx.fillRect(x - 1.5, y - 1.5, 3, 3)

  if (f.reticle > 0.01) {
    const a = f.reticle
    ctx.strokeStyle = ink(0.85 * a)
    ctx.lineWidth = 0.8
    ctx.beginPath()
    const g = c.reticleGap
    const arm = c.reticleArm * (0.6 + 0.4 * a)
    ctx.moveTo(x - g - arm, y)
    ctx.lineTo(x - g, y)
    ctx.moveTo(x + g, y)
    ctx.lineTo(x + g + arm, y)
    ctx.moveTo(x, y - g - arm)
    ctx.lineTo(x, y - g)
    ctx.moveTo(x, y + g)
    ctx.lineTo(x, y + g + arm)
    ctx.stroke()
    if (readout) {
      ctx.font = MONO
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      ctx.fillStyle = ink(0.55 * a)
      ctx.fillText(`${Math.round(x)}, ${Math.round(y)}`, x + 14, y - 8)
    }
  }

  if (f.cloud > 0.01) {
    ctx.fillStyle = ink(0.7 * f.cloud)
    ctx.beginPath()
    for (const pt of f.points) ctx.rect(pt.p.x - 0.6, pt.p.y - 0.6, 1.2, 1.2)
    ctx.fill()
  }
}

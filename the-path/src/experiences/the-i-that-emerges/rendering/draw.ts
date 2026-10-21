import { CONFIG } from '../config/constants'
import type { Attribute, Vec2 } from '../models/types'
import type { IField } from '../core/ifield'
import type { ObjectState } from '../core/object'

const MONO = '10px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'

function ink(alpha: number): string {
  const [r, g, b] = CONFIG.visual.ink
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`
}

export function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = CONFIG.visual.bg
  ctx.fillRect(0, 0, w, h)
}

export function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, origin: Vec2, order: number) {
  const alpha = CONFIG.visual.gridAlphaMax * order
  if (alpha <= 0.002) return
  const g = CONFIG.classify.gridSize
  ctx.strokeStyle = ink(alpha)
  ctx.lineWidth = 0.5
  ctx.beginPath()
  const startX = origin.x - Math.ceil(origin.x / g) * g
  for (let x = startX; x <= w; x += g) {
    ctx.moveTo(Math.round(x) + 0.5, 0)
    ctx.lineTo(Math.round(x) + 0.5, h)
  }
  const startY = origin.y - Math.ceil(origin.y / g) * g
  for (let y = startY; y <= h; y += g) {
    ctx.moveTo(0, Math.round(y) + 0.5)
    ctx.lineTo(w, Math.round(y) + 0.5)
  }
  ctx.stroke()
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
  ctx.strokeStyle = ink(0.5 * order)
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
  ctx.fillStyle = ink(0.45 * order)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(specimen, center.x - half, center.y + half + 8)
}

export function drawObject(ctx: CanvasRenderingContext2D, obj: ObjectState) {
  const b = obj.boundary
  ctx.beginPath()
  ctx.moveTo(b[0].x, b[0].y)
  for (let i = 1; i < b.length; i++) ctx.lineTo(b[i].x, b[i].y)
  ctx.closePath()
  ctx.fillStyle = `hsl(${obj.hue.toFixed(1)}, ${(obj.saturation * 100).toFixed(1)}%, ${CONFIG.object.lightness * 100}%)`
  ctx.fill()
  if (obj.outline > 0.01) {
    ctx.strokeStyle = ink(0.75 * obj.outline)
    ctx.lineWidth = 0.8
    ctx.stroke()
  }
}

function anchorPoint(obj: ObjectState, angle: number): Vec2 {
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
  const R = CONFIG.object.radius
  const row = CONFIG.classify.labelRowHeight
  const narrow = w < 760
  const colX = narrow ? Math.max(16, obj.center.x - 130) : Math.min(obj.center.x + R + 130, w - 350)
  const y0 = narrow ? obj.center.y + R + 64 : obj.center.y - (row * 7) / 2

  ctx.font = MONO
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  attributes.forEach((a, i) => {
    const y = y0 + i * row
    const p = anchorPoint(obj, a.anchorAngle)
    ctx.strokeStyle = ink(0.32 * alpha)
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(colX - 10, y)
    ctx.stroke()
    ctx.fillStyle = ink(0.7 * alpha)
    ctx.beginPath()
    ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = ink(0.42 * alpha)
    ctx.fillText(a.key, colX, y)
    ctx.fillStyle = ink(0.85 * alpha)
    ctx.fillText(a.value, colX + 112, y)
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
  ctx.fillStyle = ink(0.85)
  ctx.beginPath()
  ctx.arc(x, y, 1.8, 0, Math.PI * 2)
  ctx.fill()

  if (f.reticle > 0.01) {
    const a = f.reticle
    ctx.strokeStyle = ink(0.8 * a)
    ctx.lineWidth = 0.9
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
      ctx.fillStyle = ink(0.5 * a)
      ctx.fillText(`${Math.round(x)}, ${Math.round(y)}`, x + 14, y - 8)
    }
  }

  if (f.cloud > 0.01) {
    ctx.fillStyle = ink(0.55 * f.cloud)
    for (const pt of f.points) {
      ctx.beginPath()
      ctx.arc(pt.p.x, pt.p.y, 1.1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

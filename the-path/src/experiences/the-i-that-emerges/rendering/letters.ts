import { CONFIG } from '../config/constants'
import type { Attribute } from '../models/types'
import type { ObjectState } from '../core/object'
import { createRng } from '../../../shared/rng'
import { ink, labelLayout, MONO } from './draw'

export interface Letter {
  ch: string
  x: number
  y: number
  vx: number
  vy: number
  rot: number
  vr: number
  /** Key letters start dimmer than value letters, as in the column. */
  weight: number
}

/** Breaks the attribute column into its letters, each set drifting slowly
 * away — mostly outward from the object, never in formation. */
export function scatterLabels(
  ctx: CanvasRenderingContext2D,
  obj: ObjectState,
  attributes: Attribute[],
  w: number,
  seed: number,
): Letter[] {
  const cfg = CONFIG.letters
  const rng = createRng(seed)
  const layout = labelLayout(obj, w)
  ctx.font = MONO
  const letters: Letter[] = []

  const add = (text: string, x0: number, y: number, weight: number) => {
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]
      if (ch === ' ') continue
      const x = x0 + ctx.measureText(text.slice(0, i)).width + ctx.measureText(ch).width / 2
      const ox = x - obj.center.x
      const oy = y - obj.center.y
      const d = Math.hypot(ox, oy) || 1
      const outward = Math.atan2(oy, ox)
      const angle = outward + (rng() - 0.5) * 2.2
      const speed = cfg.speedMin + rng() * (cfg.speedMax - cfg.speedMin) * Math.min(1, 160 / d + 0.4)
      letters.push({
        ch,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: 0,
        vr: (rng() - 0.5) * cfg.spin,
        weight,
      })
    }
  }

  attributes.forEach((a, i) => {
    const y = layout.rowY(i)
    add(a.key, layout.colX, y, 0.42)
    add(a.value, layout.valueX, y, 0.88)
  })
  return letters
}

export function stepLetters(letters: Letter[], dt: number) {
  for (const l of letters) {
    l.x += l.vx * dt
    l.y += l.vy * dt
    l.rot += l.vr * dt
    l.vx *= 0.995
    l.vy *= 0.995
  }
}

export function drawLetters(ctx: CanvasRenderingContext2D, letters: Letter[], life: number) {
  if (life <= 0.003) return
  ctx.font = MONO
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const l of letters) {
    ctx.save()
    ctx.translate(l.x, l.y)
    ctx.rotate(l.rot)
    ctx.fillStyle = ink(l.weight * life)
    ctx.fillText(l.ch, 0, 0)
    ctx.restore()
  }
}

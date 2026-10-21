import { CONFIG } from '../config/constants'
import type { Attribute, AttributeKey } from '../models/types'
import { meanRadius, type ObjectState } from './object'

export const ATTRIBUTE_ORDER: readonly AttributeKey[] = [
  'POSITION',
  'COLOR',
  'SIZE',
  'NAME',
  'FORM',
  'MOTION',
  'CLASS',
  'PREDICTABILITY',
]

/** Spread across the object's right side, top to bottom, so leader lines
 * fan out to an ordered column. */
export function anchorAngleFor(index: number): number {
  const spread = (124 * Math.PI) / 180
  const start = (-62 * Math.PI) / 180
  return start + (index / (ATTRIBUTE_ORDER.length - 1)) * spread
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
  }
  return [f(0), f(8), f(4)]
}

export function objectRgb(obj: ObjectState): [number, number, number] {
  return hslToRgb(((obj.hue % 360) + 360) % 360, obj.saturation, CONFIG.object.lightness)
}

export function objectColor(obj: ObjectState): string {
  return `#${objectRgb(obj)
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()
}

function area(obj: ObjectState): number {
  let sum = 0
  const b = obj.boundary
  for (let i = 0; i < b.length; i++) {
    const p = b[i]
    const q = b[(i + 1) % b.length]
    sum += p.x * q.y - q.x * p.y
  }
  return Math.abs(sum) / 2
}

/** 1 = perfectly round; falls with the spread of the outline's radii. */
function symmetry(obj: ObjectState): number {
  const mean = meanRadius(obj)
  const variance =
    obj.boundary.reduce((s, p) => {
      const r = Math.hypot(p.x - obj.center.x, p.y - obj.center.y)
      return s + (r - mean) * (r - mean)
    }, 0) / obj.boundary.length
  return Math.max(0, 1 - (Math.sqrt(variance) / mean) * 4)
}

function speedPxPerSec(obj: ObjectState): number {
  return Math.hypot(obj.vel.x, obj.vel.y) * 60
}

/** How regular its motion has become: the share of it now explained by the
 * periodic pattern measurement imposed. */
export function predictability(obj: ObjectState): number {
  return 0.35 + 0.62 * (1 - obj.autonomy)
}

export function measure(
  key: AttributeKey,
  obj: ObjectState,
  viewport: { width: number; height: number },
  specimen: string,
): string {
  switch (key) {
    case 'POSITION':
      return `x ${(obj.center.x / viewport.width).toFixed(3)} · y ${(obj.center.y / viewport.height).toFixed(3)}`
    case 'COLOR':
      return objectColor(obj)
    case 'SIZE':
      return `r ${meanRadius(obj).toFixed(1)} · area ${Math.round(area(obj))}`
    case 'NAME':
      return specimen
    case 'FORM':
      return `closed · ${obj.boundary.length} vertices · symmetry ${symmetry(obj).toFixed(2)}`
    case 'MOTION': {
      const regular = obj.autonomy < 0.5 ? 'periodic' : 'irregular'
      return `${speedPxPerSec(obj).toFixed(1)} px/s · ${regular}`
    }
    case 'CLASS': {
      const shape = symmetry(obj) > 0.82 ? 'ROUND' : 'IRREGULAR'
      const motion = speedPxPerSec(obj) < 6 ? 'STATIONARY' : 'MOBILE'
      const texture = obj.quantize > 0.25 ? 'DISCRETE' : 'SOFT'
      return `${shape} / ${motion} / ${texture}`
    }
    case 'PREDICTABILITY':
      return `${Math.round(predictability(obj) * 100)}%`
  }
}

export function measureNext(
  attributes: Attribute[],
  obj: ObjectState,
  viewport: { width: number; height: number },
  specimen: string,
): void {
  const index = attributes.length
  if (index < ATTRIBUTE_ORDER.length) {
    const key = ATTRIBUTE_ORDER[index]
    attributes.push({ key, value: measure(key, obj, viewport, specimen), anchorAngle: anchorAngleFor(index) })
    return
  }
  // Everything has a label already; measuring again only refreshes values.
  for (const a of attributes) a.value = measure(a.key, obj, viewport, specimen)
}

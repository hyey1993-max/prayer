import { CONFIG } from '../config/constants'

/** Scales a duration down under prefers-reduced-motion, so the piece still
 * proceeds through its states without the held silences that make sense
 * only as motion. */
export function scaledDuration(ms: number, reducedMotion: boolean): number {
  return reducedMotion ? ms / CONFIG.reducedMotion.speedFactor : ms
}

/** Scales an easing factor up under prefers-reduced-motion, so positions
 * settle in fewer frames instead of drifting slowly toward their target. */
export function scaledEase(ease: number, reducedMotion: boolean): number {
  return reducedMotion ? Math.min(0.9, ease * CONFIG.reducedMotion.speedFactor) : ease
}

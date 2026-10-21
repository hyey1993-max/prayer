import { PHASE_ORDER, type Phase } from '../models/types'

/** Phases only ever move forward one step; restarting is a fresh session. */
export function canAdvance(from: Phase, to: Phase): boolean {
  return PHASE_ORDER.indexOf(to) === PHASE_ORDER.indexOf(from) + 1
}

/** What form the I takes in each phase, before the relation in RETURN
 * overrides it with its own blend. */
export function iFormFor(phase: Phase): { reticle: number; cloud: number } {
  switch (phase) {
    case 'observe':
      return { reticle: 0, cloud: 0 }
    case 'classify':
      return { reticle: 1, cloud: 0 }
    case 'wait':
      return { reticle: 0, cloud: 0.5 }
    case 'encounter':
      return { reticle: 0, cloud: 1 }
    case 'return':
    case 'closing':
      return { reticle: 0.5, cloud: 0.5 }
  }
}

export function scaled(ms: number, reducedMotion: boolean, factor: number): number {
  return reducedMotion ? ms * factor : ms
}

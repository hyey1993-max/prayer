export interface Vec2 {
  x: number
  y: number
}

/** OBSERVE → CLASSIFY → WAIT → ENCOUNTER → RETURN, then the closing return
 * to the first question. */
export type Phase = 'observe' | 'classify' | 'wait' | 'encounter' | 'return' | 'closing'

export const PHASE_ORDER: readonly Phase[] = [
  'observe',
  'classify',
  'wait',
  'encounter',
  'return',
  'closing',
]

export type AttributeKey =
  | 'POSITION'
  | 'COLOR'
  | 'SIZE'
  | 'NAME'
  | 'FORM'
  | 'MOTION'
  | 'CLASS'
  | 'PREDICTABILITY'

export interface Attribute {
  key: AttributeKey
  value: string
  /** Angle on the object's outline the label's leader line attaches to. */
  anchorAngle: number
}

export type MemoryKind = 'phase' | 'measure' | 'click' | 'pause' | 'meet' | 'part'

export interface MemoryEvent {
  t: number
  phase: Phase
  kind: MemoryKind
  value?: number
}

export type Phase =
  | 'field'
  | 'classifying'
  | 'selecting'
  | 'profiling'
  | 'predicting'
  | 'dissolving'
  | 'final'
  | 'resting'

export interface Group {
  id: string
  label: string
  centroid: number[]
  anchor: { x: number; y: number }
}

export interface ProfileSnapshot {
  behavior: number
  preference: number
  similarity: number
  prediction: number
  confidence: number
}

export type CycleStatus = 'pending' | 'confirmed' | 'failed' | 'unexpected'

export interface CycleSnapshot {
  index: number
  total: number
  predictedGroupLabel: string
  confidence: number
  status: CycleStatus
}

export interface UIState {
  phase: Phase
  groups: { id: string; label: string }[]
  selectedId: string | null
  profile: ProfileSnapshot | null
  cycle: CycleSnapshot | null
  /** Completed cycles so far — drives the visual reduction (person shrinks,
   * data grows) independent of any one cycle's outcome. */
  reductionT: number
  showFinalText: boolean
  sessionId: number
}

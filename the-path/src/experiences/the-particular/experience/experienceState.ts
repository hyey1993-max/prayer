import type { CycleSnapshot, ProfileSnapshot, UIState } from '../models/State'

export type UIAction =
  | { type: 'CLASSIFICATION_STARTED' }
  | { type: 'CLASSIFICATION_DONE'; groups: { id: string; label: string }[] }
  | { type: 'SELECT'; id: string; profile: ProfileSnapshot }
  | { type: 'PROFILED' }
  | { type: 'CYCLE_STARTED'; cycle: CycleSnapshot }
  | { type: 'CYCLE_RESOLVED'; cycle: CycleSnapshot; profile: ProfileSnapshot }
  | { type: 'CYCLES_COMPLETE' }
  | { type: 'DISSOLVED' }
  | { type: 'SHOW_FINAL_TEXT' }
  | { type: 'HIDE_FINAL_TEXT' }
  | { type: 'RESTART' }

export function createInitialUIState(sessionId: number): UIState {
  return {
    phase: 'field',
    groups: [],
    selectedId: null,
    profile: null,
    cycle: null,
    reductionT: 0,
    showFinalText: false,
    sessionId,
  }
}

export function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'CLASSIFICATION_STARTED':
      if (state.phase !== 'field') return state
      return { ...state, phase: 'classifying' }

    case 'CLASSIFICATION_DONE':
      if (state.phase !== 'classifying') return state
      return { ...state, phase: 'selecting', groups: action.groups }

    case 'SELECT':
      if (state.phase !== 'selecting') return state
      return { ...state, phase: 'profiling', selectedId: action.id, profile: action.profile }

    case 'PROFILED':
      if (state.phase !== 'profiling') return state
      return { ...state, phase: 'predicting' }

    case 'CYCLE_STARTED':
      if (state.phase !== 'predicting') return state
      return { ...state, cycle: action.cycle }

    case 'CYCLE_RESOLVED':
      if (state.phase !== 'predicting') return state
      return {
        ...state,
        cycle: action.cycle,
        profile: action.profile,
        reductionT: action.cycle.index / action.cycle.total,
      }

    case 'CYCLES_COMPLETE':
      if (state.phase !== 'predicting') return state
      return { ...state, phase: 'dissolving' }

    case 'DISSOLVED':
      if (state.phase !== 'dissolving') return state
      return { ...state, phase: 'final' }

    case 'SHOW_FINAL_TEXT':
      if (state.phase !== 'final') return state
      return { ...state, showFinalText: true }

    case 'HIDE_FINAL_TEXT':
      if (state.phase !== 'final') return state
      return { ...state, phase: 'resting', showFinalText: false }

    case 'RESTART':
      return createInitialUIState(state.sessionId + 1)

    default:
      return state
  }
}

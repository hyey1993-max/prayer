import { steps } from './content/steps'
import type { Step } from './content/types'

/** 걷는 순서. 4단계는 '걸어온 곳 적기'(4-1)와 '반복되던 것 고르기'(4-2) 두 화면이다. */
export type Screen =
  | { kind: 'start' }
  | { kind: 'stations'; step: Step }
  | { kind: 'choice'; step: Step }
  | { kind: 'result' }

export const flow: Screen[] = [
  { kind: 'start' },
  ...steps.flatMap((step): Screen[] =>
    step.stations ? [{ kind: 'stations', step }, { kind: 'choice', step }] : [{ kind: 'choice', step }],
  ),
  { kind: 'result' },
]

export const RESULT_INDEX = flow.length - 1
/** 질문 화면 수 (시작과 결과를 뺀 것) */
export const QUESTION_SCREENS = flow.length - 2

export function duskOf(screen: Screen): number {
  switch (screen.kind) {
    case 'start':
      return 0
    case 'stations':
      return screen.step.stations!.dusk
    case 'choice':
      return screen.step.dusk
    case 'result':
      return 1
  }
}

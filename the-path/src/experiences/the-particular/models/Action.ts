export type ActionKind = 'drift' | 'predicted' | 'exception'

/** One resolved step in an individual's history. `matched` is what the
 * model's own record keeps — it is what "the model was right" means from
 * the inside, not a claim that the delta was fully explained by it. */
export interface Action {
  tick: number
  kind: ActionKind
  predictedGroupId: string | null
  actualGroupId: string
  delta: number[]
  matched: boolean
}

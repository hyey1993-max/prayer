import type { Action } from '../models/Action'
import type { Individual } from '../models/Individual'
import type { Group } from '../models/State'
import { CONFIG } from '../config/constants'
import type { Rng } from '../../../shared/rng'
import { nearestGroup } from './classification'
import { add, clampMagnitude, clampVector01, scale, subtract, zeros } from './similarity'

function averageRecentDelta(history: Action[], window: number, dims: number): number[] {
  const recent = history.slice(-window)
  if (recent.length === 0) return zeros(dims)
  const sum = recent.reduce((acc, a) => add(acc, a.delta), zeros(dims))
  return scale(sum, 1 / recent.length)
}

function randomUnitVector(rng: Rng, dims: number): number[] {
  const v = Array.from({ length: dims }, () => rng() * 2 - 1)
  const m = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  return v.map((x) => x / m)
}

export interface Prediction {
  groupId: string
  delta: number[]
  /** The individual's rolling confidence as it stood going into this cycle —
   * the number the "EXPECTED / CONFIDENCE" line shows. */
  confidenceBefore: number
}

/**
 * The observable half: built entirely from the individual's own recent
 * history and a pull toward its assigned cluster's centroid. This is what
 * the system is willing to say out loud before anything happens.
 */
export function predictNext(individual: Individual, groups: Group[]): Prediction {
  const cfg = CONFIG.prediction
  const dims = CONFIG.population.featureDimensions
  const group = groups.find((g) => g.id === individual.groupId) ?? groups[0]

  const historyDelta = averageRecentDelta(individual.history, cfg.historyWindow, dims)
  const clusterPull = scale(subtract(group.centroid, individual.features), cfg.clusterPullWeight)
  const delta = clampMagnitude(add(scale(historyDelta, cfg.historyWeight), clusterPull), cfg.maxDeltaMagnitude)
  const predictedFeatures = clampVector01(add(individual.features, delta))

  return {
    groupId: nearestGroup(predictedFeatures, groups).id,
    delta,
    confidenceBefore: individual.confidence,
  }
}

export interface Resolution {
  isException: boolean
  actualDelta: number[]
  actualGroupId: string
  matched: boolean
}

/**
 * The part the system cannot fully see coming: the predicted delta plus a
 * residual drawn from the individual's fixed, never-displayed `signature`
 * and fresh noise. Its magnitude shrinks as `modeledFraction` grows, but per
 * CONFIG.prediction.maxModeledFraction and unmodeledNoiseFloor, it can never
 * reach zero. `influenceDelta` — a small nudge from something the user did
 * during this cycle's pending window — is folded in additively; it biases
 * the outcome without determining it, same as everything else here.
 */
export function resolveNext(
  individual: Individual,
  groups: Group[],
  predicted: Prediction,
  rng: Rng,
  forceException: boolean,
  influenceDelta: number[] | null,
): Resolution {
  const cfg = CONFIG.prediction
  const dims = CONFIG.population.featureDimensions

  const isException = forceException || rng() < cfg.exceptionProbability
  const residualMagnitude =
    (1 - individual.modeledFraction) * cfg.baseResidualMagnitude + cfg.unmodeledNoiseFloor
  const noise = randomUnitVector(rng, dims)
  const residualDirection = add(scale(individual.signature, 0.6), scale(noise, 0.4))
  const residualScale = residualMagnitude * (isException ? cfg.exceptionMultiplier : 1)
  const residual = scale(residualDirection, residualScale)

  let actualDeltaRaw = add(predicted.delta, residual)
  if (influenceDelta) actualDeltaRaw = add(actualDeltaRaw, influenceDelta)

  const actualDelta = clampMagnitude(
    actualDeltaRaw,
    cfg.maxDeltaMagnitude * (isException ? cfg.exceptionMultiplier : 1.4),
  )
  const actualFeatures = clampVector01(add(individual.features, actualDelta))
  const actualGroupId = nearestGroup(actualFeatures, groups).id
  const matched = !isException && actualGroupId === predicted.groupId

  return { isException, actualDelta, actualGroupId, matched }
}

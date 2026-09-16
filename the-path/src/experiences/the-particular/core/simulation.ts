import type { Action } from '../models/Action'
import type { Individual, Vec2 } from '../models/Individual'
import type { CycleStatus, Group, ProfileSnapshot } from '../models/State'
import { CONFIG } from '../config/constants'
import { createRng, type Rng } from '../../../shared/rng'
import { assignStep, initCentroids, layoutAnchors, updateCentroids } from './classification'
import { updateConfidence, initialConfidence } from './confidence'
import { predictNext, resolveNext, type Prediction, type Resolution } from './prediction'
import { euclideanDistance, similarityFromDistance } from './similarity'

export interface SimulationState {
  rng: Rng
  population: Individual[]
  groups: Group[]
  centroids: number[][]
  classificationIteration: number
  selectedId: string | null
}

function randomUnit(rng: Rng): number {
  return rng() * 2 - 1
}

function makeSignature(rng: Rng, dims: number): number[] {
  const v = Array.from({ length: dims }, () => randomUnit(rng))
  const m = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
  return v.map((x) => x / m)
}

export function createSimulation(seed: number): SimulationState {
  const rng = createRng(seed)
  const dims = CONFIG.population.featureDimensions
  const w = CONFIG.world.width
  const h = CONFIG.world.height

  const population: Individual[] = Array.from({ length: CONFIG.population.size }, (_, i) => {
    const position: Vec2 = { x: (rng() - 0.5) * w, y: (rng() - 0.5) * h }
    return {
      id: `ind-${i}`,
      features: Array.from({ length: dims }, () => rng()),
      signature: makeSignature(rng, dims),
      position,
      velocity: { x: randomUnit(rng) * 2, y: randomUnit(rng) * 2 },
      clusterOffset: { x: randomUnit(rng) * 46, y: randomUnit(rng) * 46 },
      wanderSeed: rng() * 1000,
      groupId: null,
      modeledFraction: 0,
      confidence: initialConfidence(),
      history: [],
    }
  })

  return {
    rng,
    population,
    groups: [],
    centroids: [],
    classificationIteration: 0,
    selectedId: null,
  }
}

/** Ambient pre-classification wandering: damped random walk, softly bounded
 * to the world rect, gently perturbed by the pointer. */
export function tickField(sim: SimulationState, dtMs: number, pointer: Vec2 | null) {
  const cfg = CONFIG.field
  const dt = dtMs / 1000
  const w = CONFIG.world.width
  const h = CONFIG.world.height

  for (const ind of sim.population) {
    ind.velocity.x += randomUnit(sim.rng) * cfg.accelerationJitter * dt
    ind.velocity.y += randomUnit(sim.rng) * cfg.accelerationJitter * dt

    if (pointer) {
      const dx = ind.position.x - pointer.x
      const dy = ind.position.y - pointer.y
      const dist = Math.hypot(dx, dy)
      if (dist < cfg.pointerInfluenceRadius && dist > 0.001) {
        const push = ((cfg.pointerInfluenceRadius - dist) / cfg.pointerInfluenceRadius) * cfg.pointerInfluenceStrength
        ind.velocity.x += (dx / dist) * push * dt
        ind.velocity.y += (dy / dist) * push * dt
      }
    }

    ind.velocity.x *= cfg.velocityDamping
    ind.velocity.y *= cfg.velocityDamping
    const speed = Math.hypot(ind.velocity.x, ind.velocity.y)
    if (speed > cfg.driftSpeed) {
      ind.velocity.x = (ind.velocity.x / speed) * cfg.driftSpeed
      ind.velocity.y = (ind.velocity.y / speed) * cfg.driftSpeed
    }

    ind.position.x += ind.velocity.x
    ind.position.y += ind.velocity.y

    const halfW = w / 2
    const halfH = h / 2
    if (ind.position.x < -halfW || ind.position.x > halfW) ind.velocity.x *= -0.6
    if (ind.position.y < -halfH || ind.position.y > halfH) ind.velocity.y *= -0.6
    ind.position.x = Math.max(-halfW, Math.min(halfW, ind.position.x))
    ind.position.y = Math.max(-halfH, Math.min(halfH, ind.position.y))
  }
}

/** One k-means-like iteration. Initializes centroids on first call.
 * Returns true once classification has finished its configured iterations. */
export function stepClassification(sim: SimulationState): boolean {
  const cfg = CONFIG.classification
  const dims = CONFIG.population.featureDimensions

  if (sim.classificationIteration === 0) {
    sim.centroids = initCentroids(sim.rng, cfg.clusterCount, dims)
    const anchors = layoutAnchors(cfg.clusterCount)
    sim.groups = sim.centroids.map((centroid, i) => ({
      id: `group-${i}`,
      label: cfg.groupLabels[i] ?? `GROUP ${i + 1}`,
      centroid,
      anchor: anchors[i],
    }))
  }

  const assignments = assignStep(sim.population, sim.centroids)
  sim.population.forEach((ind, idx) => {
    ind.groupId = sim.groups[assignments[idx]].id
  })
  sim.centroids = updateCentroids(sim.population, assignments, sim.centroids, dims)
  sim.groups.forEach((g, i) => {
    g.centroid = sim.centroids[i]
  })

  sim.classificationIteration += 1
  return sim.classificationIteration >= cfg.iterations
}

/** Ambient post-classification drift: individuals ease toward their group's
 * anchor plus a fixed personal offset, so a cluster reads as a soft cloud
 * that keeps breathing rather than a frozen chart. */
export function tickClustered(sim: SimulationState, dtMs: number) {
  const cfg = CONFIG.classification
  const dt = dtMs / 1000
  for (const ind of sim.population) {
    const group = sim.groups.find((g) => g.id === ind.groupId)
    if (!group) continue
    const targetX = group.anchor.x + ind.clusterOffset.x
    const targetY = group.anchor.y + ind.clusterOffset.y
    ind.position.x += (targetX - ind.position.x) * cfg.clusterEase
    ind.position.y += (targetY - ind.position.y) * cfg.clusterEase
    ind.velocity.x = randomUnit(sim.rng) * 0.6
    ind.velocity.y = randomUnit(sim.rng) * 0.6
    ind.position.x += ind.velocity.x * dt
    ind.position.y += ind.velocity.y * dt
  }
}

export function selectIndividual(sim: SimulationState, id: string) {
  sim.selectedId = id
}

export function buildProfileSnapshot(sim: SimulationState, id: string): ProfileSnapshot {
  const ind = sim.population.find((p) => p.id === id)!
  const group = sim.groups.find((g) => g.id === ind.groupId) ?? sim.groups[0]
  const distance = euclideanDistance(ind.features, group.centroid)
  const similarity = similarityFromDistance(distance, CONFIG.population.featureDimensions)
  const predictionEstimate =
    CONFIG.prediction.confidenceFloor +
    ind.modeledFraction * (CONFIG.prediction.confidenceCeiling - CONFIG.prediction.confidenceFloor)

  return {
    behavior: ind.features[0],
    preference: ind.features[1],
    similarity,
    prediction: predictionEstimate,
    confidence: ind.confidence,
  }
}

/** The observable half of a cycle: what the system predicts, before
 * anything is resolved. Pure — call again freely without side effects. */
export function predictCycle(sim: SimulationState): Prediction {
  const ind = sim.population.find((p) => p.id === sim.selectedId)!
  return predictNext(ind, sim.groups)
}

export interface CycleOutcome {
  resolution: Resolution
  status: CycleStatus
  profile: ProfileSnapshot
}

/** Resolves a previously-predicted cycle, applying its outcome back into
 * simulation state (features, group, history, modeled fraction, confidence,
 * and — via group membership — the individual's on-screen target position).
 * `influenceDelta` folds in whatever the user nudged during the pending
 * window, if anything. */
export function resolveCycle(
  sim: SimulationState,
  tick: number,
  predicted: Prediction,
  forceException: boolean,
  influenceDelta: number[] | null,
): CycleOutcome {
  const ind = sim.population.find((p) => p.id === sim.selectedId)!
  const resolution = resolveNext(ind, sim.groups, predicted, sim.rng, forceException, influenceDelta)

  const status: CycleStatus = resolution.isException
    ? 'unexpected'
    : resolution.matched
      ? 'confirmed'
      : 'failed'

  ind.features = ind.features.map((v, i) => Math.min(1, Math.max(0, v + resolution.actualDelta[i])))
  ind.groupId = resolution.actualGroupId
  ind.modeledFraction +=
    (CONFIG.prediction.maxModeledFraction - ind.modeledFraction) * CONFIG.prediction.learningRate
  ind.confidence = updateConfidence(ind.confidence, ind.modeledFraction, status)

  const action: Action = {
    tick,
    kind: resolution.isException ? 'exception' : 'predicted',
    predictedGroupId: predicted.groupId,
    actualGroupId: resolution.actualGroupId,
    delta: resolution.actualDelta,
    matched: resolution.matched,
  }
  ind.history.push(action)

  return { resolution, status, profile: buildProfileSnapshot(sim, ind.id) }
}

/** Eases the selected individual toward the world's center — used once the
 * piece dissolves the population and the individual remains alone. */
export function tickCenterEase(sim: SimulationState, ease: number) {
  const ind = sim.population.find((p) => p.id === sim.selectedId)
  if (!ind) return
  ind.position.x += (0 - ind.position.x) * ease
  ind.position.y += (0 - ind.position.y) * ease
}

/** Converts a world-space point the user clicked during a pending cycle
 * into a small feature-space nudge, by treating it as "influence toward
 * whichever group's anchor is nearest that point." */
export function influenceFromWorldPoint(
  sim: SimulationState,
  point: { x: number; y: number },
  weight: number,
): number[] | null {
  const ind = sim.population.find((p) => p.id === sim.selectedId)
  if (!ind || sim.groups.length === 0) return null
  let nearest = sim.groups[0]
  let bestDist = Infinity
  for (const g of sim.groups) {
    const d = Math.hypot(g.anchor.x - point.x, g.anchor.y - point.y)
    if (d < bestDist) {
      bestDist = d
      nearest = g
    }
  }
  return nearest.centroid.map((c, i) => (c - ind.features[i]) * weight)
}

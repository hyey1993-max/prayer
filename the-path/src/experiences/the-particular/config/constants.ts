// Every artistic, timing, and algorithmic parameter for THE PARTICULAR lives
// here. Emotional pacing should be tunable from this one file.

export const CONFIG = {
  population: {
    size: 360,
    // [behavior, preference, frequency, response, locationAffinity], each 0..1
    featureDimensions: 5,
  },

  world: {
    width: 1000,
    height: 640,
  },

  field: {
    // How long the population drifts, unclassified, before the system
    // begins grouping it.
    explorationMs: 5200,
    driftSpeed: 5,
    velocityDamping: 0.985,
    accelerationJitter: 0.85,
    pointerInfluenceRadius: 90,
    pointerInfluenceStrength: 10,
  },

  classification: {
    clusterCount: 3,
    // Total k-means-like steps animated across the classification phase.
    iterations: 24,
    stepIntervalMs: 150,
    // Per-frame ease of an individual toward its assigned group's anchor.
    clusterEase: 0.018,
    anchorRadiusFraction: 0.32,
    groupLabels: ['GROUP A', 'GROUP B', 'GROUP C', 'GROUP D', 'GROUP E'],
  },

  selection: {
    isolationZoom: 1.5,
    cameraEase: 0.014,
    dimmedOpacity: 0.14,
  },

  profiling: {
    // How long the initial profile holds before the first prediction cycle.
    holdMs: 1900,
  },

  prediction: {
    cycles: 6,
    cycleDurationMs: 3000,
    recalculatingMs: 950,
    historyWindow: 4,
    historyWeight: 0.5,
    clusterPullWeight: 0.32,
    maxDeltaMagnitude: 0.22,
    // How strongly a user's click-to-influence during a pending cycle
    // biases the outcome. Never absolute — the residual still applies.
    influenceWeight: 0.16,
    // Irreducible residual: base magnitude before an individual's own
    // "modeled fraction" shrinks the predictable part of it.
    baseResidualMagnitude: 0.5,
    // Floor that never goes away, even at maximum modeled fraction.
    unmodeledNoiseFloor: 0.07,
    // The model can never learn more than this fraction of an individual.
    maxModeledFraction: 0.72,
    learningRate: 0.26,
    exceptionProbability: 0.15,
    exceptionMultiplier: 3.2,
    // If no exception has occurred naturally by this cycle, force one —
    // the unmodeled remainder must surface at least once per session.
    guaranteedExceptionByCycle: 4,
    confidenceCeiling: 0.97,
    confidenceFloor: 0.4,
    confidenceLerp: 0.4,
    confidenceDropOnFailure: 0.8,
  },

  dissolve: {
    fadeMs: 3400,
    pauseMs: 2800,
  },

  final: {
    // The text waits for this much pointer inactivity before it appears.
    inactivityThresholdMs: 1800,
    fadeInMs: 3200,
    holdMs: 5200,
    fadeOutMs: 3400,
    text: 'You are not the sum of what I can measure.',
  },

  visual: {
    bg: '#08080a',
    particle: 'rgba(232, 230, 224, 0.55)',
    particleSelected: '#f3f1ea',
    connection: 'rgba(232, 230, 224, 0.07)',
    label: 'rgba(232, 230, 224, 0.3)',
    dimPopulationOpacity: 0.13,
    particleRadius: 1.5,
    particleRadiusSelected: 3,
    finalText: 'rgba(232, 230, 224, 0.72)',
    pulsePeriodMs: 4200,
  },

  reducedMotion: {
    // Applied when prefers-reduced-motion is set: durations are divided by
    // this, eases multiplied by it.
    speedFactor: 2.6,
  },
} as const

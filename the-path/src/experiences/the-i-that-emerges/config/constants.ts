// Every pacing, relational and visual parameter for THE I THAT EMERGES.

export const CONFIG = {
  object: {
    radius: 78,
    vertices: 96,
    // The object's own life: slow harmonic deformation of its outline.
    harmonics: [
      { k: 2, amp: 0.1, speed: 0.21 },
      { k: 3, amp: 0.07, speed: -0.17 },
      { k: 5, amp: 0.034, speed: 0.29 },
      { k: 7, amp: 0.018, speed: -0.37 },
    ],
    wanderRadius: 44,
    wanderTimeScale: 0.09,
    hue: 30,
    hueDrift: 9,
    saturation: 0.24,
    lightness: 0.86,
    damping: 0.86,
  },

  // The object is drawn as a volume of tiny points whose silhouette follows
  // its measured outline. Measurement snaps them to a halftone lattice and
  // flattens their depth; on its own it turns and breathes.
  dots: {
    count: 1500,
    halftoneStep: 5,
    spinSpeed: 0.22,
    tilt: 0.38,
    breathe: 0.7,
    // During a meeting, points within reach flow toward the I.
    reach: 170,
    pull: 0.35,
  },

  // When waiting begins, the measurement labels come apart letter by letter.
  letters: {
    lifeMs: 7000,
    speedMin: 5,
    speedMax: 24,
    spin: 0.45,
  },

  // I–It: each measurement takes a little of the object's own motion away
  // and replaces it with something regular and predictable.
  classify: {
    autonomyDecay: 0.7,
    // Input stopping for this long ends classification. The system does not
    // conclude; it moves into waiting.
    pauseToWaitMs: 4200,
    gridSize: 24,
    maxQuantize: 0.65,
    orbitRadius: 9,
    orbitPeriodMs: 4200,
    labelRowHeight: 22,
  },

  wait: {
    minMs: 6500,
    // ...and no input at all for this long.
    quietMs: 2600,
    autonomyRecoverEase: 0.008,
  },

  // I–Thou: the object cannot be clicked or analyzed. A meeting needs both
  // the person's unhurried presence and the object's own readiness — the
  // person can make room for it but cannot cause it.
  encounter: {
    nearMin: 60,
    nearMax: 300,
    stillSpeed: 40,
    pursuitSpeed: 240,
    pursuitRange: 420,
    openGain: 0.34,
    pursuitLoss: 1.5,
    clickLoss: 0.16,
    decay: 0.05,
    readinessPeriodMs: 11000,
    meetThreshold: 0.78,
    meetHoldMs: 500,
    meetingMinMs: 5200,
    meetingMaxMs: 8800,
    afterMeetingMs: 3800,
    maxMs: 75000,
    perceptionDelayMinMs: 280,
    perceptionDelayMaxMs: 1100,
    meetingDistance: 74,
    approachShare: 0.85,
    // Per-frame velocity impulses, px/frame.
    withdrawGain: 0.9,
    clickRecoil: 5,
    couplingEase: 0.02,
    boundaryCoupling: 0.14,
  },

  // The same object, met again. Memory sets where the relation starts —
  // distance, response delay, how movements are linked — and what the person
  // does now keeps moving it.
  ret: {
    minMs: 22000,
    idleToCloseMs: 3800,
    distanceFar: 230,
    distanceNear: 80,
    latencyMaxMs: 1000,
    measureInstrumental: 0.1,
    stillMutualPerSec: 0.05,
    pursuitInstrumentalPerSec: 0.04,
    labelFlashMs: 2400,
  },

  closing: {
    quoteDelayMs: 4200,
    againDelayMs: 7800,
  },

  iField: {
    points: 34,
    radius: 22,
    reticleArm: 9,
    reticleGap: 4,
    ease: 0.18,
    modeEase: 0.03,
    pull: 0.35,
  },

  visual: {
    bg: '#020202',
    ink: [236, 234, 228] as const,
    gridAlphaMax: 0.3,
    threadAlphaMax: 0.3,
  },

  reducedMotion: {
    durationFactor: 0.45,
    wanderFactor: 0.4,
  },

  text: {
    kicker: 'AN INTERACTIVE STUDY OF RELATION',
    question: 'Who are you, when you say I?',
    invitation: 'Select the object to begin a relation.',
    terms: 'NO SCORE · NO RIGHT ANSWER',
    quote:
      'There is no I taken in itself, but only the I of the primary word I–Thou and the I of the primary word I–It.',
    attribution: 'Martin Buber, I and Thou',
    again: 'Begin again',
  },
} as const

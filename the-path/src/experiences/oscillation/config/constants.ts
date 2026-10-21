// Every parameter for OSCILLATION — a self-running study of a field of
// digits deformed by oscillatory motion. Nothing here waits for input.

export const CONFIG = {
  // Narrow screens get a coarser grid so each digit stays legible.
  grid: { cols: 56, rows: 40, narrowCols: 34, narrowRows: 26 },

  // Field half-extent in px = min(width * widthFrac, height * heightFrac),
  // leaving the black margin around the patterns. Narrow screens use more
  // of their width.
  field: { widthFrac: 0.36, heightFrac: 0.46, narrowWidthFrac: 0.46, narrowBreakpoint: 640 },

  glyph: {
    atlasPx: 48,
    // Glyph height as a share of grid spacing, before per-digit scale.
    scale: 0.66,
  },

  motion: {
    morphMs: 1600,
    timeScale: 1,
    reducedTimeScale: 0.35,
  },

  // The piece's own choreography — what a hand on the mouse used to do.
  choreography: {
    // Each pattern holds this long (piece time, seconds) before morphing on.
    patternHoldSec: 8,
    // The focus — each pattern's center of deformation — wanders this far.
    focusRangeX: 0.75,
    focusRangeY: 0.5,
    focusSpeed: 0.11,
    // Amplitude swells and settles on its own slow wave.
    ampSwing: 0.9,
    ampSpeed: 0.13,
    // Spatial frequency drifts within this range.
    frequencyMin: 0.7,
    frequencyMax: 1.8,
    frequencySpeed: 0.05,
    // Ripples arrive on an irregular beat.
    rippleGapMinSec: 1.8,
    rippleGapMaxSec: 4.4,
    // Surges of energy at each event, decaying back.
    surgeOnPattern: 0.8,
    surgeOnRipple: 0.45,
    surgeDecay: 0.96,
    surgeAmp: 1.2,
  },

  ripple: {
    speed: 0.85,
    width: 0.07,
    push: 0.06,
    grow: 0.8,
    lifeSec: 3.2,
    max: 6,
  },

  // A lens that rides along with the focus: digits there grow and flicker.
  lens: {
    radius: 96,
    magnify: 0.9,
    brighten: 0.55,
    flip: 0.05,
  },

  bits: { flipPerSec: 0.025 },

  visual: {
    bg: '#000000',
    ink: '#f2f1ec',
  },
} as const

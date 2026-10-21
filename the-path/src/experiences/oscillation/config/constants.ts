// Every parameter for OSCILLATION — an interaction study of a field of digits
// deformed by oscillatory motion.

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
    morphMs: 1400,
    timeScale: 1,
    reducedTimeScale: 0.35,
  },

  focus: {
    ease: 0.06,
    // When no pointer is present, the focus drifts on a slow Lissajous.
    idleDrift: 0.35,
  },

  // Pointer speed injects energy into the oscillation; it decays back.
  energy: {
    // Field units per second at which energy saturates.
    speedRef: 2.4,
    decay: 0.95,
    ampBoost: 1.4,
  },

  frequency: { initial: 1, min: 0.4, max: 3, wheel: 0.0012 },

  ripple: {
    speed: 0.85,
    width: 0.07,
    push: 0.06,
    grow: 0.8,
    lifeSec: 3.2,
    max: 6,
  },

  hover: {
    radius: 96,
    magnify: 0.9,
    brighten: 0.55,
    // Chance per frame (at full energy) that a digit under the pointer flips.
    flip: 0.08,
  },

  bits: { flipPerSec: 0.025 },

  // With no input for idleMs, the piece cycles patterns on its own.
  auto: { idleMs: 10000, everyMs: 9000 },

  visual: {
    bg: '#000000',
    ink: '#f2f1ec',
  },
} as const

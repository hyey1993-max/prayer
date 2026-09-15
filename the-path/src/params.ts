// Every artistic and interaction constant lives here. Nothing below is load
// bearing for correctness — the piece should still "work" for a wide range
// of these values. Tune freely.

export const PARAMS = {
  graph: {
    // How many tiers separate the start from the far shore. Roughly
    // controls session length (a playthrough runs ~1.3-2x this many moves,
    // once traps and backtracking are accounted for).
    stageCount: 8,
    nodesPerStageMin: 3,
    nodesPerStageMax: 5,
    // Horizontal distance between stages, in world units.
    stageSpacing: 220,
    // Vertical spread nodes are scattered across within a stage.
    laneSpread: 340,
    // Random positional jitter so the layout doesn't read as a grid.
    jitter: 46,
    // How many forward edges a node reaches out with, before pruning.
    forwardEdgesMin: 1,
    forwardEdgesMax: 3,
    // Chance an extra long-range "shortcut" edge is added, skipping a stage.
    shortcutChance: 0.16,
    // Chance a lateral edge connects two nodes within the same stage.
    lateralChance: 0.12,
    // Fraction of interior nodes (not start/goal) that become dead ends —
    // every edge touching them runs backward/sideways only.
    deadEndFraction: 0.22,
    // Fraction of interior nodes deliberately marked as rich-reconnect
    // detours: visually unpromising, structurally generous.
    richReconnectFraction: 0.14,
    // Chance any single edge is, independently, discovered as blocked once
    // the traveler actually reaches its source. Not correlated with how
    // efficient the edge looks — there is no learnable tell.
    blockedChance: 0.16,
  },

  visibility: {
    // Graph-distance (hops) revealed around the traveler's current node.
    discoveryRadius: 1,
  },

  camera: {
    // Portion of viewport (0-1) the world-to-screen scale targets while
    // exploring, before the final reveal zooms out.
    exploreZoom: 1.35,
    // Easing factor per frame for camera position/zoom (lower = slower,
    // dreamier follow).
    followEase: 0.045,
    revealEase: 0.02,
    // Extra world-space padding around the full graph's bounding box when
    // fit-to-screen during the reveal.
    revealPadding: 120,
  },

  motion: {
    // Duration of a single move animation between two nodes, ms.
    moveDurationMs: 1100,
    // Duration the "blocked" feedback holds before releasing control back
    // to the traveler, ms.
    blockedHoldMs: 1400,
    // Duration of the fade-in when previously undiscovered geometry
    // appears, ms.
    discoveryFadeMs: 900,
    // Idle breathing pulse period for the current point, ms.
    pulsePeriodMs: 3400,
    // How long the zoom-out reveal takes to settle before manual camera
    // control (and the caption) take over, ms.
    revealSettleMs: 3600,
  },

  visual: {
    bg: '#faf9f6',
    bgDark: '#0d0d10',
    lineBase: '#b9b6ad',
    lineDim: '#dedcd4',
    lineDark: '#3a3a40',
    lineDimDark: '#242429',
    lineWarm: '#a9714f',
    lineWarmDark: '#c98f66',
    nodeFill: '#8c8a80',
    nodeFillDark: '#8f8d86',
    pointFill: '#1a1a1c',
    pointFillDark: '#f2f0ea',
    blockedMark: '#b5544a',
    textDim: 'rgba(20, 18, 14, 0.42)',
    textDimDark: 'rgba(240, 238, 230, 0.5)',
    // Node radius range, screen px — small end for undiscovered/background,
    // large end for the current node.
    nodeRadiusMin: 2.4,
    nodeRadiusCurrent: 5.5,
    edgeWidthMin: 0.6,
    edgeWidthMax: 1.8,
    undiscoveredOpacity: 0,
    discoveredDimOpacity: 0.55,
    visitedOpacity: 0.95,
    backgroundRevealOpacity: 0.16,
  },

  text: {
    captionFadeInMs: 3200,
    captionDelayMs: 1600,
    caption: 'You could not see this while you were moving.',
  },
} as const

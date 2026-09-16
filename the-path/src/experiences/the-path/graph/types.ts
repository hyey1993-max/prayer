// The graph is generated once, in full, at session start. Nothing about its
// topology changes afterward — what changes is only what the traveler has
// *discovered*. "Revealing more of the graph" always means widening
// visibility/discovery state, never mutating edges or nodes.

export interface GraphNode {
  id: string
  /** Progress tier, 0 (start) .. stageCount-1 (far shore). Movement is not
   * restricted to forward stages — edges may run sideways or backward. */
  stage: number
  x: number
  y: number
  /** A dead end: every edge touching this node points backward/sideways to
   * already-reachable territory, never further forward. Arriving here is
   * a small collapse, not a puzzle to solve. */
  isDeadEnd: boolean
  /** A node that looks unremarkable (drawn with high apparent cost) but
   * structurally reconnects into a dense, forward-reaching region. The
   * "detour that turns out to matter" beat. */
  isRichReconnect: boolean
  isStart: boolean
  isGoal: boolean
}

export interface GraphEdge {
  id: string
  from: string
  to: string
  /** 0 = reads visually as cheap/efficient (short, bright, thick).
   * 1 = reads as expensive/unpromising. Independent of whether the edge
   * actually leads anywhere good — the whole point is that it can't be
   * used as a reliable signal. */
  apparentCost: number
  /** Resolved once, at generation time, but not *known* until the traveler
   * stands at `from` and looks down this edge. A blocked edge is rendered
   * severed and cannot be taken. */
  blocked: boolean
}

export interface Graph {
  nodes: Map<string, GraphNode>
  edges: GraphEdge[]
  /** Adjacency in both directions, since movement isn't stage-locked. */
  adjacency: Map<string, string[]>
  startId: string
  stageCount: number
  seed: number
}

import { generateGraph } from '../graph/generate'
import type { Graph } from '../graph/types'

export type Phase = 'entry' | 'exploring' | 'moving' | 'blocked' | 'reveal' | 'retrospective'

export interface PendingMove {
  from: string
  to: string
  startedAt: number
}

export interface SessionState {
  graph: Graph
  phase: Phase
  currentNodeId: string
  /** Ordered node ids actually stood on, revisits included as-is — this is
   * the literal trajectory, not a shortest path. */
  path: string[]
  discoveredNodes: Set<string>
  discoveredEdges: Set<string>
  pendingMove: PendingMove | null
}

function freshSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

function discoverAround(state: SessionState, nodeId: string) {
  state.discoveredNodes.add(nodeId)
  for (const neighborId of state.graph.adjacency.get(nodeId) ?? []) {
    state.discoveredNodes.add(neighborId)
  }
  for (const e of state.graph.edges) {
    if (e.from === nodeId || e.to === nodeId) state.discoveredEdges.add(e.id)
  }
}

export function createSession(seed: number = freshSeed()): SessionState {
  const graph = generateGraph(seed)
  const state: SessionState = {
    graph,
    phase: 'entry',
    currentNodeId: graph.startId,
    path: [graph.startId],
    discoveredNodes: new Set(),
    discoveredEdges: new Set(),
    pendingMove: null,
  }
  discoverAround(state, graph.startId)
  return state
}

export type SessionAction =
  | { type: 'BEGIN' }
  | { type: 'MOVE_START'; targetId: string; now: number }
  | { type: 'MOVE_COMPLETE' }
  | { type: 'BLOCKED_RELEASE' }
  | { type: 'REVEAL_SETTLED' }
  | { type: 'RESTART' }

export function isEdgeOpen(state: SessionState, from: string, to: string): boolean {
  const e = state.graph.edges.find(
    (edge) => (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from),
  )
  return !!e && !e.blocked
}

export function availableMoves(state: SessionState): string[] {
  if (state.phase !== 'exploring') return []
  const neighbors = state.graph.adjacency.get(state.currentNodeId) ?? []
  return neighbors.filter((id) => isEdgeOpen(state, state.currentNodeId, id))
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'BEGIN': {
      if (state.phase !== 'entry') return state
      return { ...state, phase: 'exploring' }
    }

    case 'MOVE_START': {
      if (state.phase !== 'exploring') return state
      if (!availableMoves(state).includes(action.targetId)) return state
      return {
        ...state,
        phase: 'moving',
        pendingMove: { from: state.currentNodeId, to: action.targetId, startedAt: action.now },
      }
    }

    case 'MOVE_COMPLETE': {
      if (state.phase !== 'moving' || !state.pendingMove) return state
      const targetId = state.pendingMove.to
      const targetNode = state.graph.nodes.get(targetId)!

      const next: SessionState = {
        ...state,
        currentNodeId: targetId,
        path: [...state.path, targetId],
        pendingMove: null,
        discoveredNodes: new Set(state.discoveredNodes),
        discoveredEdges: new Set(state.discoveredEdges),
      }
      discoverAround(next, targetId)

      if (targetNode.isGoal) {
        next.phase = 'reveal'
      } else if (targetNode.isDeadEnd) {
        next.phase = 'blocked'
      } else {
        next.phase = 'exploring'
      }
      return next
    }

    case 'BLOCKED_RELEASE': {
      if (state.phase !== 'blocked') return state
      return { ...state, phase: 'exploring' }
    }

    case 'REVEAL_SETTLED': {
      if (state.phase !== 'reveal') return state
      return { ...state, phase: 'retrospective' }
    }

    case 'RESTART': {
      return createSession()
    }

    default:
      return state
  }
}

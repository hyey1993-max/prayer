import { PARAMS } from '../params'
import { createRng, randInt, randRange, type Rng } from './rng'
import type { Graph, GraphEdge, GraphNode } from './types'

function nodeId(stage: number, index: number): string {
  return `s${stage}-${index}`
}

function edgeId(from: string, to: string): string {
  return `${from}->${to}`
}

function addAdjacency(adjacency: Map<string, string[]>, a: string, b: string) {
  const listA = adjacency.get(a) ?? []
  if (!listA.includes(b)) listA.push(b)
  adjacency.set(a, listA)

  const listB = adjacency.get(b) ?? []
  if (!listB.includes(a)) listB.push(a)
  adjacency.set(b, listB)
}

/**
 * Builds the full graph up front, deterministically from `seed`. The
 * traveler's experience of "discovering" the graph is entirely a matter of
 * which parts of this fixed structure have been made visible — nothing here
 * changes shape once generated.
 */
export function generateGraph(seed: number): Graph {
  const g = PARAMS.graph
  const rng: Rng = createRng(seed)

  const nodes = new Map<string, GraphNode>()
  const stageNodeIds: string[][] = []

  for (let stage = 0; stage < g.stageCount; stage++) {
    const isFirst = stage === 0
    const isLast = stage === g.stageCount - 1
    const count = isFirst ? 1 : randInt(rng, g.nodesPerStageMin, g.nodesPerStageMax)
    const ids: string[] = []

    for (let i = 0; i < count; i++) {
      const id = nodeId(stage, i)
      const laneT = count === 1 ? 0.5 : i / (count - 1)
      const y = (laneT - 0.5) * g.laneSpread + randRange(rng, -g.jitter, g.jitter)
      const x = stage * g.stageSpacing + randRange(rng, -g.jitter * 0.4, g.jitter * 0.4)

      nodes.set(id, {
        id,
        stage,
        x,
        y,
        isDeadEnd: false,
        isRichReconnect: false,
        isStart: isFirst,
        isGoal: isLast,
      })
      ids.push(id)
    }
    stageNodeIds.push(ids)
  }

  // Designate interior dead ends and rich-reconnect detours before wiring
  // any edges, so the wiring pass can respect both.
  const interior = stageNodeIds.slice(1, -1).flat()
  const shuffled = [...interior].sort(() => rng() - 0.5)
  const deadEndCount = Math.round(interior.length * g.deadEndFraction)
  const richCount = Math.round(interior.length * g.richReconnectFraction)

  for (const id of shuffled.slice(0, deadEndCount)) {
    nodes.get(id)!.isDeadEnd = true
  }
  for (const id of shuffled.slice(deadEndCount, deadEndCount + richCount)) {
    nodes.get(id)!.isRichReconnect = true
  }

  const edges: GraphEdge[] = []
  const edgeSeen = new Set<string>()

  function tryAddEdge(from: string, to: string) {
    if (from === to) return
    const key = edgeSeen.has(edgeId(from, to)) || edgeSeen.has(edgeId(to, from))
    if (key) return
    edgeSeen.add(edgeId(from, to))
    edges.push({ id: edgeId(from, to), from, to, apparentCost: rng(), blocked: false })
  }

  // Forward wiring: every non-dead-end node reaches into the next stage,
  // weighted toward whichever neighbor sits closest in lane position so the
  // layout reads as organic rather than fully random.
  for (let stage = 0; stage < g.stageCount - 1; stage++) {
    const from = stageNodeIds[stage]
    const to = stageNodeIds[stage + 1]

    for (const fromId of from) {
      const fromNode = nodes.get(fromId)!
      if (fromNode.isDeadEnd) continue

      const extra = fromNode.isRichReconnect ? 2 : 0
      const edgeCount = Math.min(
        to.length,
        randInt(rng, g.forwardEdgesMin, g.forwardEdgesMax) + extra,
      )
      const candidates = [...to].sort(
        (a, b) => Math.abs(nodes.get(a)!.y - fromNode.y) - Math.abs(nodes.get(b)!.y - fromNode.y),
      )
      const chosen = new Set<string>()
      // Nearest neighbor always included; remaining picked with some
      // randomness so it isn't purely a proximity graph.
      chosen.add(candidates[0])
      while (chosen.size < edgeCount && chosen.size < candidates.length) {
        chosen.add(candidates[Math.floor(rng() * candidates.length)])
      }
      for (const toId of chosen) tryAddEdge(fromId, toId)
    }

    // Guarantee every next-stage node has at least one way in, sourced from
    // a non-dead-end node in this stage.
    const liveSources = from.filter((id) => !nodes.get(id)!.isDeadEnd)
    for (const toId of to) {
      const hasIncoming = edges.some((e) => e.to === toId && from.includes(e.from))
      if (!hasIncoming && liveSources.length > 0) {
        const sourceId = liveSources[Math.floor(rng() * liveSources.length)]
        tryAddEdge(sourceId, toId)
      }
    }
  }

  // Shortcuts: skip a stage entirely. These read as tempting or risky
  // depending only on the (independently random) apparent cost assigned
  // above, never as a reliable signal either way.
  for (let stage = 0; stage < g.stageCount - 2; stage++) {
    const from = stageNodeIds[stage]
    const to = stageNodeIds[stage + 2]
    for (const fromId of from) {
      const fromNode = nodes.get(fromId)!
      if (fromNode.isDeadEnd) continue
      if (rng() < g.shortcutChance) {
        tryAddEdge(fromId, to[Math.floor(rng() * to.length)])
      }
    }
  }

  // Laterals: sideways connections within a stage, including from dead
  // ends — this is how a dead end is escaped rather than restarted from.
  for (const ids of stageNodeIds) {
    if (ids.length < 2) continue
    for (const fromId of ids) {
      if (rng() < g.lateralChance) {
        tryAddEdge(fromId, ids[Math.floor(rng() * ids.length)])
      }
    }
  }

  // Visually bias (not determine) apparent cost: a dead end's incoming
  // edges skew slightly more inviting; a rich-reconnect node's incoming
  // edges skew slightly less. Both remain probabilistic, never absolute.
  for (const e of edges) {
    const to = nodes.get(e.to)!
    if (to.isDeadEnd) e.apparentCost = Math.min(1, e.apparentCost * 0.72)
    if (to.isRichReconnect) e.apparentCost = Math.min(1, 0.35 + e.apparentCost * 0.65)
  }

  // Resolve which edges are blocked. Independent of apparent cost — there
  // is no visual tell for this.
  for (const e of edges) {
    if (rng() < g.blockedChance) e.blocked = true
  }

  const adjacency = new Map<string, string[]>()
  for (const e of edges) addAdjacency(adjacency, e.from, e.to)

  const startId = nodeId(0, 0)

  // Safety net: guarantee at least one fully open route from start to a
  // goal node exists, without exposing which one. If blocking happened to
  // seal every route, open the shortest one found by BFS.
  ensureSolvable(nodes, edges, adjacency, startId)

  return {
    nodes,
    edges,
    adjacency,
    startId,
    stageCount: g.stageCount,
    seed,
  }
}

function ensureSolvable(
  nodes: Map<string, GraphNode>,
  edges: GraphEdge[],
  adjacency: Map<string, string[]>,
  startId: string,
) {
  const edgeByPair = new Map<string, GraphEdge>()
  for (const e of edges) {
    edgeByPair.set(`${e.from}|${e.to}`, e)
    edgeByPair.set(`${e.to}|${e.from}`, e)
  }

  function reachableGoal(respectBlocked: boolean): string[] | null {
    const queue = [startId]
    const cameFrom = new Map<string, string>()
    const visited = new Set([startId])

    while (queue.length > 0) {
      const current = queue.shift()!
      const node = nodes.get(current)!
      if (node.isGoal) {
        const path = [current]
        let c = current
        while (cameFrom.has(c)) {
          c = cameFrom.get(c)!
          path.unshift(c)
        }
        return path
      }
      for (const neighbor of adjacency.get(current) ?? []) {
        if (visited.has(neighbor)) continue
        if (respectBlocked) {
          const e = edgeByPair.get(`${current}|${neighbor}`)
          if (e?.blocked) continue
        }
        visited.add(neighbor)
        cameFrom.set(neighbor, current)
        queue.push(neighbor)
      }
    }
    return null
  }

  if (reachableGoal(true)) return

  const path = reachableGoal(false)
  if (!path) return // topology itself is disconnected; nothing to unblock

  for (let i = 0; i < path.length - 1; i++) {
    const e = edgeByPair.get(`${path[i]}|${path[i + 1]}`)
    if (e) e.blocked = false
  }
}

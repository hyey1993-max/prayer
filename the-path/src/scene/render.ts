import { PARAMS } from '../params'
import type { Graph } from '../graph/types'
import type { Phase, PendingMove } from '../state/session'
import { worldToScreen, type Camera } from './camera'
import type { Theme } from './theme'

export interface DrawInput {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  camera: Camera
  theme: Theme
  graph: Graph
  phase: Phase
  currentNodeId: string
  path: string[]
  discoveredNodes: Set<string>
  discoveredEdges: Set<string>
  pendingMove: PendingMove | null
  moveT: number
  hoveredId: string | null
  availableMoves: string[]
  pulseT: number
  blockedT: number
  revealT: number
}

function easeInOutSine(t: number) {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

function withAlpha(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex
  const clamped = Math.max(0, Math.min(1, alpha))
  const n = hex.replace('#', '')
  const r = parseInt(n.slice(0, 2), 16)
  const g = parseInt(n.slice(2, 4), 16)
  const b = parseInt(n.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${clamped})`
}

export function drawScene(input: DrawInput) {
  const {
    ctx,
    width,
    height,
    camera,
    theme,
    graph,
    phase,
    currentNodeId,
    path,
    discoveredNodes,
    discoveredEdges,
    pendingMove,
    moveT,
    hoveredId,
    availableMoves,
    pulseT,
    blockedT,
    revealT,
  } = input
  const v = PARAMS.visual

  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, width, height)

  const isRevealing = phase === 'reveal' || phase === 'retrospective'
  const toScreen = (wx: number, wy: number) => worldToScreen(wx, wy, camera, width, height)

  // --- edges ---
  for (const edge of graph.edges) {
    const discovered = discoveredEdges.has(edge.id)
    if (!isRevealing && !discovered) continue

    const a = graph.nodes.get(edge.from)!
    const b = graph.nodes.get(edge.to)!
    const pa = toScreen(a.x, a.y)
    const pb = toScreen(b.x, b.y)

    const isFrontier = edge.from === currentNodeId || edge.to === currentNodeId
    let opacity: number
    if (isRevealing) {
      opacity = discovered ? v.discoveredDimOpacity : v.backgroundRevealOpacity * revealT
    } else {
      opacity = isFrontier ? v.visitedOpacity : v.discoveredDimOpacity
    }

    const width_ = v.edgeWidthMin + (1 - edge.apparentCost) * (v.edgeWidthMax - v.edgeWidthMin)
    ctx.lineWidth = width_

    if (edge.blocked) {
      const gap = 10
      const dx = pb.x - pa.x
      const dy = pb.y - pa.y
      const len = Math.hypot(dx, dy) || 1
      const ux = dx / len
      const uy = dy / len
      const midX = (pa.x + pb.x) / 2
      const midY = (pa.y + pb.y) / 2
      ctx.strokeStyle = withAlpha(theme.lineDim, opacity * 0.8)
      ctx.setLineDash([3, 5])
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(midX - ux * gap, midY - uy * gap)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(midX + ux * gap, midY + uy * gap)
      ctx.lineTo(pb.x, pb.y)
      ctx.stroke()
      ctx.setLineDash([])
    } else {
      ctx.strokeStyle = withAlpha(theme.line, opacity)
      ctx.beginPath()
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(pb.x, pb.y)
      ctx.stroke()
    }
  }

  // --- path trail (the traveler's own memory of where they've been) ---
  if (path.length > 1) {
    const trailOpacity = isRevealing ? 0.55 + 0.4 * revealT : 0.5
    ctx.strokeStyle = withAlpha(theme.lineWarm, trailOpacity)
    ctx.lineWidth = 1.3
    ctx.beginPath()
    const first = graph.nodes.get(path[0])!
    const p0 = toScreen(first.x, first.y)
    ctx.moveTo(p0.x, p0.y)
    for (let i = 1; i < path.length; i++) {
      const n = graph.nodes.get(path[i])!
      const p = toScreen(n.x, n.y)
      ctx.lineTo(p.x, p.y)
    }
    if (pendingMove) {
      const from = graph.nodes.get(pendingMove.from)!
      const to = graph.nodes.get(pendingMove.to)!
      const eased = easeInOutSine(moveT)
      const ix = from.x + (to.x - from.x) * eased
      const iy = from.y + (to.y - from.y) * eased
      const pi = toScreen(ix, iy)
      ctx.lineTo(pi.x, pi.y)
    }
    ctx.stroke()
  }

  // --- nodes ---
  const visitedSet = new Set(path)
  for (const node of graph.nodes.values()) {
    const discovered = discoveredNodes.has(node.id)
    if (!isRevealing && !discovered) continue
    if (node.id === currentNodeId) continue // drawn separately, on top

    const p = toScreen(node.x, node.y)
    const isAvailable = availableMoves.includes(node.id)
    const isHovered = hoveredId === node.id
    const visited = visitedSet.has(node.id)

    let opacity: number
    if (isRevealing) {
      opacity = discovered ? v.discoveredDimOpacity : v.backgroundRevealOpacity * revealT
    } else {
      opacity = isAvailable ? v.visitedOpacity : v.discoveredDimOpacity
    }

    let radius = v.nodeRadiusMin + (visited ? 1.1 : 0)
    if (isAvailable) radius += 0.6
    if (isHovered) radius += 1.2

    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = withAlpha(visited ? theme.lineWarm : theme.nodeFill, opacity)
    ctx.fill()

    if (isAvailable && !isRevealing) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius + 3.2, 0, Math.PI * 2)
      ctx.strokeStyle = withAlpha(theme.nodeFill, isHovered ? 0.45 : 0.22)
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
  }

  // --- the traveler ---
  const currentNode = graph.nodes.get(currentNodeId)!
  let px = currentNode.x
  let py = currentNode.y
  if (pendingMove) {
    const from = graph.nodes.get(pendingMove.from)!
    const to = graph.nodes.get(pendingMove.to)!
    const eased = easeInOutSine(moveT)
    px = from.x + (to.x - from.x) * eased
    py = from.y + (to.y - from.y) * eased
  }
  const pp = toScreen(px, py)

  const pulse = 1 + Math.sin(pulseT * Math.PI * 2) * 0.06
  const blockedPulse = phase === 'blocked' ? 1 - Math.sin(blockedT * Math.PI) * 0.22 : 1
  const r = v.nodeRadiusCurrent * pulse * blockedPulse

  ctx.beginPath()
  ctx.arc(pp.x, pp.y, r + 5, 0, Math.PI * 2)
  ctx.strokeStyle = withAlpha(theme.pointFill, phase === 'blocked' ? 0.12 + blockedT * 0.1 : 0.14)
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(pp.x, pp.y, r, 0, Math.PI * 2)
  ctx.fillStyle = theme.pointFill
  ctx.fill()
}

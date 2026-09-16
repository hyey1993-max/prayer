import { useEffect, useRef } from 'react'
import { PARAMS } from '../params'
import { usePrefersDark } from '../../../shared/usePrefersDark'
import {
  availableMoves,
  type SessionAction,
  type SessionState,
} from '../state/session'
import { screenToWorld, worldToScreen, type Camera } from '../../../shared/camera'
import { drawScene } from './render'
import { resolveTheme } from './theme'

interface SceneProps {
  state: SessionState
  dispatch: React.Dispatch<SessionAction>
}

interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

function graphBounds(state: SessionState): Bounds {
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const n of state.graph.nodes.values()) {
    minX = Math.min(minX, n.x)
    maxX = Math.max(maxX, n.x)
    minY = Math.min(minY, n.y)
    maxY = Math.max(maxY, n.y)
  }
  return { minX, maxX, minY, maxY }
}

function fitCamera(bounds: Bounds, width: number, height: number): Camera {
  const pad = PARAMS.camera.revealPadding
  const w = bounds.maxX - bounds.minX + pad * 2
  const h = bounds.maxY - bounds.minY + pad * 2
  const scale = Math.min(width / w, height / h)
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
    scale,
  }
}

export function Scene({ state, dispatch }: SceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prefersDark = usePrefersDark()

  const stateRef = useRef(state)
  stateRef.current = state

  const themeRef = useRef(resolveTheme(prefersDark))
  themeRef.current = resolveTheme(prefersDark)

  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 })
  const sizeRef = useRef({ width: 0, height: 0 })
  const boundsRef = useRef<Bounds>(graphBounds(state))
  const hoveredRef = useRef<string | null>(null)
  const dragRef = useRef<{ sx: number; sy: number; camX: number; camY: number } | null>(null)

  const lastPhaseRef = useRef(state.phase)
  const blockedStartRef = useRef<number | null>(null)
  const revealStartRef = useRef<number | null>(null)
  const moveCompleteFiredRef = useRef(false)
  const blockedReleaseFiredRef = useRef(false)
  const revealSettledFiredRef = useRef(false)

  // Canvas sizing (device-pixel aware) and initial camera placement.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement!
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(rect.width * dpr)
      canvas.height = Math.round(rect.height * dpr)
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { width: rect.width, height: rect.height }
    }
    resize()

    const startNode = state.graph.nodes.get(state.graph.startId)!
    const visibleStages = 3.2
    const baseScale =
      (sizeRef.current.width / (PARAMS.graph.stageSpacing * visibleStages)) *
      PARAMS.camera.exploreZoom
    cameraRef.current = { x: startNode.x, y: startNode.y, scale: baseScale || 1 }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Main render loop.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0

    const tick = () => {
      const now = performance.now()
      const s = stateRef.current
      const { width, height } = sizeRef.current
      const camera = cameraRef.current

      if (s.phase !== lastPhaseRef.current) {
        if (s.phase === 'blocked') {
          blockedStartRef.current = now
          blockedReleaseFiredRef.current = false
        }
        if (s.phase === 'reveal') {
          revealStartRef.current = now
          revealSettledFiredRef.current = false
        }
        if (s.phase === 'moving') {
          moveCompleteFiredRef.current = false
        }
        lastPhaseRef.current = s.phase
      }

      // --- camera target ---
      const exploringLike = s.phase === 'entry' || s.phase === 'exploring' || s.phase === 'moving' || s.phase === 'blocked'
      if (exploringLike) {
        let wx: number
        let wy: number
        if (s.phase === 'moving' && s.pendingMove) {
          const from = s.graph.nodes.get(s.pendingMove.from)!
          const to = s.graph.nodes.get(s.pendingMove.to)!
          const t = Math.min(1, (now - s.pendingMove.startedAt) / PARAMS.motion.moveDurationMs)
          wx = from.x + (to.x - from.x) * t
          wy = from.y + (to.y - from.y) * t
        } else {
          const cn = s.graph.nodes.get(s.currentNodeId)!
          wx = cn.x
          wy = cn.y
        }
        const visibleStages = 3.2
        const targetScale =
          (width / (PARAMS.graph.stageSpacing * visibleStages)) * PARAMS.camera.exploreZoom
        camera.x += (wx - camera.x) * PARAMS.camera.followEase
        camera.y += (wy - camera.y) * PARAMS.camera.followEase
        camera.scale += ((targetScale || 1) - camera.scale) * PARAMS.camera.followEase
      } else {
        // reveal / retrospective: ease toward the fitted bounding box unless
        // the traveler has taken manual control (drag/wheel), which writes
        // straight into cameraRef and is left alone here.
        if (!dragRef.current) {
          const target = fitCamera(boundsRef.current, width, height)
          const ease = PARAMS.camera.revealEase
          camera.x += (target.x - camera.x) * ease
          camera.y += (target.y - camera.y) * ease
          camera.scale += (target.scale - camera.scale) * ease
        }
      }

      // --- one-shot phase transitions ---
      if (s.phase === 'moving' && s.pendingMove && !moveCompleteFiredRef.current) {
        const t = (now - s.pendingMove.startedAt) / PARAMS.motion.moveDurationMs
        if (t >= 1) {
          moveCompleteFiredRef.current = true
          dispatch({ type: 'MOVE_COMPLETE' })
        }
      }
      if (s.phase === 'blocked' && !blockedReleaseFiredRef.current) {
        const start = blockedStartRef.current ?? now
        if (now - start >= PARAMS.motion.blockedHoldMs) {
          blockedReleaseFiredRef.current = true
          dispatch({ type: 'BLOCKED_RELEASE' })
        }
      }
      if (s.phase === 'reveal' && !revealSettledFiredRef.current) {
        const start = revealStartRef.current ?? now
        if (now - start >= PARAMS.motion.revealSettleMs) {
          revealSettledFiredRef.current = true
          dispatch({ type: 'REVEAL_SETTLED' })
        }
      }

      // --- derived animation values for drawing ---
      const moveT = s.pendingMove
        ? Math.min(1, (now - s.pendingMove.startedAt) / PARAMS.motion.moveDurationMs)
        : 0
      const blockedT =
        s.phase === 'blocked' && blockedStartRef.current !== null
          ? Math.min(1, (now - blockedStartRef.current) / PARAMS.motion.blockedHoldMs)
          : 0
      const revealT =
        s.phase === 'reveal' && revealStartRef.current !== null
          ? Math.min(1, (now - revealStartRef.current) / PARAMS.motion.revealSettleMs)
          : s.phase === 'retrospective'
            ? 1
            : 0
      const pulseT = (now / PARAMS.motion.pulsePeriodMs) % 1

      drawScene({
        ctx,
        width,
        height,
        camera,
        theme: themeRef.current,
        graph: s.graph,
        phase: s.phase,
        currentNodeId: s.currentNodeId,
        path: s.path,
        discoveredNodes: s.discoveredNodes,
        discoveredEdges: s.discoveredEdges,
        pendingMove: s.pendingMove,
        moveT,
        hoveredId: hoveredRef.current,
        availableMoves: availableMoves(s),
        pulseT,
        blockedT,
        revealT,
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [dispatch])

  // --- pointer interaction ---
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const hitRadius = 16

    function findHover(sx: number, sy: number): string | null {
      const s = stateRef.current
      if (s.phase !== 'exploring') return null
      const { width, height } = sizeRef.current
      const moves = availableMoves(s)
      let best: string | null = null
      let bestDist = hitRadius
      for (const id of moves) {
        const n = s.graph.nodes.get(id)!
        const p = worldToScreen(n.x, n.y, cameraRef.current, width, height)
        const d = Math.hypot(p.x - sx, p.y - sy)
        if (d < bestDist) {
          bestDist = d
          best = id
        }
      }
      return best
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top

      if (dragRef.current) {
        const { width, height } = sizeRef.current
        const wStart = screenToWorld(
          dragRef.current.sx,
          dragRef.current.sy,
          cameraRef.current,
          width,
          height,
        )
        const wNow = screenToWorld(sx, sy, cameraRef.current, width, height)
        cameraRef.current.x = dragRef.current.camX - (wNow.x - wStart.x)
        cameraRef.current.y = dragRef.current.camY - (wNow.y - wStart.y)
        return
      }

      const hover = findHover(sx, sy)
      hoveredRef.current = hover
      const phase = stateRef.current.phase
      canvas.style.cursor =
        hover != null || phase === 'entry' ? 'pointer' : phase === 'retrospective' ? 'grab' : 'default'
    }

    const onPointerDown = (e: PointerEvent) => {
      const s = stateRef.current
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top

      if (s.phase === 'entry') {
        dispatch({ type: 'BEGIN' })
        return
      }
      if (s.phase === 'exploring') {
        const hover = findHover(sx, sy)
        if (hover) {
          dispatch({ type: 'MOVE_START', targetId: hover, now: performance.now() })
          hoveredRef.current = null
        }
        return
      }
      if (s.phase === 'retrospective') {
        canvas.setPointerCapture(e.pointerId)
        dragRef.current = { sx, sy, camX: cameraRef.current.x, camY: cameraRef.current.y }
        canvas.style.cursor = 'grabbing'
      }
    }

    const endDrag = (e: PointerEvent) => {
      if (dragRef.current) {
        dragRef.current = null
        canvas.style.cursor = 'grab'
        try {
          canvas.releasePointerCapture(e.pointerId)
        } catch {
          /* no-op: pointer may already be released */
        }
      }
    }

    const onWheel = (e: WheelEvent) => {
      if (stateRef.current.phase !== 'retrospective') return
      e.preventDefault()
      const factor = Math.exp(-e.deltaY * 0.0012)
      cameraRef.current.scale = Math.max(0.08, Math.min(3, cameraRef.current.scale * factor))
    }

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', endDrag)
    canvas.addEventListener('pointercancel', endDrag)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', endDrag)
      canvas.removeEventListener('pointercancel', endDrag)
      canvas.removeEventListener('wheel', onWheel)
    }
  }, [dispatch])

  return <canvas ref={canvasRef} className="the-path-canvas" />
}

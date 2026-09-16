import { useEffect, useReducer, useRef } from 'react'
import { CONFIG } from './config/constants'
import {
  createSimulation,
  influenceFromWorldPoint,
  predictCycle,
  resolveCycle,
  selectIndividual,
  stepClassification,
  tickCenterEase,
  tickClustered,
  tickField,
  buildProfileSnapshot,
  type SimulationState,
} from './core/simulation'
import { createInitialUIState, uiReducer } from './experience/experienceState'
import { scaledDuration, scaledEase } from './experience/transitions'
import { createPointerTracker, idleMs, updatePointer, type PointerTracker } from './interaction/pointer'
import { findNearestIndividual } from './interaction/selection'
import { drawConnections } from './rendering/graph'
import { drawParticles } from './rendering/particles'
import { drawGroupLabels } from './rendering/typography'
import { screenToWorld, type Camera } from '../../shared/camera'
import { usePrefersReducedMotion } from '../../shared/usePrefersReducedMotion'

const HIT_RADIUS = 14

function freshSeed(): number {
  return Math.floor(Math.random() * 0xffffffff)
}

function fitCamera(width: number, height: number): Camera {
  const pad = 90
  const scale = Math.min(
    width / (CONFIG.world.width + pad * 2),
    height / (CONFIG.world.height + pad * 2),
  )
  return { x: 0, y: 0, scale: scale || 1 }
}

function labelFor(sim: SimulationState, groupId: string): string {
  return sim.groups.find((g) => g.id === groupId)?.label ?? ''
}

export default function TheParticularExperience() {
  const [ui, dispatch] = useReducer(uiReducer, undefined, () => createInitialUIState(0))
  const reducedMotion = usePrefersReducedMotion()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const hudRef = useRef<HTMLDivElement>(null)

  const uiRef = useRef(ui)
  uiRef.current = ui
  const reducedMotionRef = useRef(reducedMotion)
  reducedMotionRef.current = reducedMotion

  const simRef = useRef<SimulationState | undefined>(undefined)
  if (simRef.current === undefined) simRef.current = createSimulation(freshSeed())

  const sizeRef = useRef({ width: 0, height: 0 })
  const cameraRef = useRef<Camera>({ x: 0, y: 0, scale: 1 })
  const fitRef = useRef<Camera>({ x: 0, y: 0, scale: 1 })
  const hasSizedRef = useRef(false)

  const lastFrameRef = useRef(performance.now())
  const lastPhaseRef = useRef(ui.phase)
  const phaseEnteredAtRef = useRef(performance.now())

  const classificationNextStepAtRef = useRef(0)
  const cycleIndexRef = useRef(0)
  const cyclePendingRef = useRef<{ predicted: ReturnType<typeof predictCycle>; startedAt: number } | null>(
    null,
  )
  const cycleResolvedAtRef = useRef<number | null>(null)
  const exceptionOccurredRef = useRef(false)
  const influenceRef = useRef<{ x: number; y: number } | null>(null)
  const dissolveStartedAtRef = useRef<number | null>(null)
  const dissolveTRef = useRef(0)
  const finalTextShownAtRef = useRef<number | null>(null)

  const pointerTrackerRef = useRef<PointerTracker>(createPointerTracker(performance.now()))
  const pointerInsideRef = useRef(false)
  const hoveredRef = useRef<string | null>(null)

  const firstRunRef = useRef(true)
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false
      return
    }
    simRef.current = createSimulation(freshSeed())
    lastPhaseRef.current = 'field'
    phaseEnteredAtRef.current = performance.now()
    classificationNextStepAtRef.current = 0
    cycleIndexRef.current = 0
    cyclePendingRef.current = null
    cycleResolvedAtRef.current = null
    exceptionOccurredRef.current = false
    influenceRef.current = null
    dissolveStartedAtRef.current = null
    dissolveTRef.current = 0
    finalTextShownAtRef.current = null
    hoveredRef.current = null
    cameraRef.current = { ...fitRef.current }
    pointerTrackerRef.current = createPointerTracker(performance.now())
  }, [ui.sessionId])

  // Canvas sizing.
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
      fitRef.current = fitCamera(rect.width, rect.height)
      if (!hasSizedRef.current) {
        hasSizedRef.current = true
        cameraRef.current = { ...fitRef.current }
      }
    }
    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)
    return () => ro.disconnect()
  }, [])

  // Main loop.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0

    const tick = () => {
      const now = performance.now()
      const dtMs = Math.min(64, now - lastFrameRef.current)
      lastFrameRef.current = now
      const sim = simRef.current!
      const state = uiRef.current
      const reduced = reducedMotionRef.current
      const { width, height } = sizeRef.current
      const camera = cameraRef.current

      if (state.phase !== lastPhaseRef.current) {
        phaseEnteredAtRef.current = now
        if (state.phase === 'classifying') classificationNextStepAtRef.current = now
        if (state.phase === 'predicting') {
          cycleIndexRef.current = 0
          cyclePendingRef.current = null
          cycleResolvedAtRef.current = null
          exceptionOccurredRef.current = false
        }
        if (state.phase === 'dissolving') dissolveStartedAtRef.current = now
        if (state.phase === 'final') dissolveTRef.current = 1
        lastPhaseRef.current = state.phase
      }

      // --- simulation stepping ---
      if (state.phase === 'field') {
        const pointerWorld =
          pointerInsideRef.current && pointerTrackerRef.current.x != null && pointerTrackerRef.current.y != null
            ? screenToWorld(pointerTrackerRef.current.x, pointerTrackerRef.current.y, camera, width, height)
            : null
        tickField(sim, dtMs, pointerWorld)
        if (now - phaseEnteredAtRef.current >= scaledDuration(CONFIG.field.explorationMs, reduced)) {
          dispatch({ type: 'CLASSIFICATION_STARTED' })
        }
      } else if (state.phase === 'classifying') {
        tickClustered(sim, dtMs)
        if (now >= classificationNextStepAtRef.current) {
          const isFinal = stepClassification(sim)
          classificationNextStepAtRef.current =
            now + scaledDuration(CONFIG.classification.stepIntervalMs, reduced)
          if (isFinal) {
            dispatch({
              type: 'CLASSIFICATION_DONE',
              groups: sim.groups.map((g) => ({ id: g.id, label: g.label })),
            })
          }
        }
      } else if (state.phase === 'selecting' || state.phase === 'profiling') {
        tickClustered(sim, dtMs)
        if (state.phase === 'profiling') {
          if (now - phaseEnteredAtRef.current >= scaledDuration(CONFIG.profiling.holdMs, reduced)) {
            dispatch({ type: 'PROFILED' })
          }
        }
      } else if (state.phase === 'predicting') {
        tickClustered(sim, dtMs)
        const cfg = CONFIG.prediction

        if (cyclePendingRef.current === null && cycleResolvedAtRef.current === null) {
          cycleIndexRef.current += 1
          const predicted = predictCycle(sim)
          cyclePendingRef.current = { predicted, startedAt: now }
          dispatch({
            type: 'CYCLE_STARTED',
            cycle: {
              index: cycleIndexRef.current,
              total: cfg.cycles,
              predictedGroupLabel: labelFor(sim, predicted.groupId),
              confidence: predicted.confidenceBefore,
              status: 'pending',
            },
          })
        } else if (
          cyclePendingRef.current &&
          now - cyclePendingRef.current.startedAt >= scaledDuration(cfg.cycleDurationMs, reduced)
        ) {
          const forceException =
            cycleIndexRef.current === cfg.guaranteedExceptionByCycle && !exceptionOccurredRef.current
          const influence = influenceRef.current
            ? influenceFromWorldPoint(sim, influenceRef.current, cfg.influenceWeight)
            : null
          influenceRef.current = null
          const predicted = cyclePendingRef.current.predicted
          const outcome = resolveCycle(sim, cycleIndexRef.current, predicted, forceException, influence)
          if (outcome.resolution.isException) exceptionOccurredRef.current = true
          cyclePendingRef.current = null
          cycleResolvedAtRef.current = now
          dispatch({
            type: 'CYCLE_RESOLVED',
            cycle: {
              index: cycleIndexRef.current,
              total: cfg.cycles,
              predictedGroupLabel: labelFor(sim, predicted.groupId),
              confidence: outcome.profile.confidence,
              status: outcome.status,
            },
            profile: outcome.profile,
          })
        } else if (
          cycleResolvedAtRef.current !== null &&
          now - cycleResolvedAtRef.current >= scaledDuration(cfg.recalculatingMs, reduced)
        ) {
          cycleResolvedAtRef.current = null
          if (cycleIndexRef.current >= cfg.cycles) {
            dispatch({ type: 'CYCLES_COMPLETE' })
          }
        }
      } else if (state.phase === 'dissolving') {
        tickCenterEase(sim, scaledEase(0.01, reduced))
        const elapsed = now - (dissolveStartedAtRef.current ?? now)
        dissolveTRef.current = Math.min(1, elapsed / scaledDuration(CONFIG.dissolve.fadeMs, reduced))
        if (elapsed >= scaledDuration(CONFIG.dissolve.fadeMs + CONFIG.dissolve.pauseMs, reduced)) {
          dispatch({ type: 'DISSOLVED' })
        }
      } else if (state.phase === 'final') {
        tickCenterEase(sim, scaledEase(0.01, reduced))
        if (!state.showFinalText) {
          if (idleMs(pointerTrackerRef.current, now) >= scaledDuration(CONFIG.final.inactivityThresholdMs, reduced)) {
            finalTextShownAtRef.current = now
            dispatch({ type: 'SHOW_FINAL_TEXT' })
          }
        } else if (finalTextShownAtRef.current !== null) {
          const total = CONFIG.final.fadeInMs + CONFIG.final.holdMs + CONFIG.final.fadeOutMs
          if (now - finalTextShownAtRef.current >= scaledDuration(total, reduced)) {
            dispatch({ type: 'HIDE_FINAL_TEXT' })
          }
        }
      } else if (state.phase === 'resting') {
        tickCenterEase(sim, scaledEase(0.01, reduced))
      }

      // --- camera ---
      let target: Camera
      if (state.phase === 'field' || state.phase === 'classifying' || state.phase === 'selecting') {
        target = fitRef.current
      } else {
        const selected = sim.population.find((p) => p.id === sim.selectedId)
        const cx = selected ? selected.position.x : 0
        const cy = selected ? selected.position.y : 0
        let zoom = CONFIG.selection.isolationZoom
        if (state.phase === 'dissolving') zoom += dissolveTRef.current * 0.6
        if (state.phase === 'final' || state.phase === 'resting') zoom = CONFIG.selection.isolationZoom * 1.6
        target = { x: cx, y: cy, scale: fitRef.current.scale * zoom }
      }
      const camEase = scaledEase(CONFIG.selection.cameraEase, reduced)
      camera.x += (target.x - camera.x) * camEase
      camera.y += (target.y - camera.y) * camEase
      camera.scale += (target.scale - camera.scale) * camEase

      // --- render ---
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = CONFIG.visual.bg
      ctx.fillRect(0, 0, width, height)

      const classificationT = Math.min(1, sim.classificationIteration / CONFIG.classification.iterations)
      drawConnections({
        ctx,
        width,
        height,
        camera,
        population: sim.population,
        groups: sim.groups,
        phase: state.phase,
        classificationT,
        selectedId: sim.selectedId,
      })
      drawParticles({
        ctx,
        width,
        height,
        camera,
        population: sim.population,
        selectedId: sim.selectedId,
        hoveredId: hoveredRef.current,
        phase: state.phase,
        reductionT: state.reductionT,
        dissolveT: dissolveTRef.current,
        pulseT: (now / CONFIG.visual.pulsePeriodMs) % 1,
      })
      drawGroupLabels({
        ctx,
        width,
        height,
        camera,
        groups: sim.groups,
        phase: state.phase,
        labelT: classificationT,
      })

      if (hudRef.current) {
        const opacity = state.phase === 'dissolving' ? 1 - dissolveTRef.current : state.phase === 'final' || state.phase === 'resting' ? 0 : 1
        hudRef.current.style.opacity = String(opacity)
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [dispatch])

  // Pointer interaction.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      updatePointer(pointerTrackerRef.current, sx, sy, performance.now())

      if (uiRef.current.phase === 'selecting') {
        const { width, height } = sizeRef.current
        const hit = findNearestIndividual(
          simRef.current!.population,
          sx,
          sy,
          cameraRef.current,
          width,
          height,
          HIT_RADIUS,
        )
        hoveredRef.current = hit?.id ?? null
        canvas.style.cursor = hit ? 'pointer' : 'default'
      } else if (uiRef.current.phase === 'resting') {
        canvas.style.cursor = 'pointer'
      } else {
        canvas.style.cursor = 'default'
      }
    }

    const onPointerEnter = () => {
      pointerInsideRef.current = true
    }
    const onPointerLeave = () => {
      pointerInsideRef.current = false
      hoveredRef.current = null
    }

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const state = uiRef.current
      const sim = simRef.current!
      const { width, height } = sizeRef.current

      if (state.phase === 'selecting') {
        const hit = findNearestIndividual(sim.population, sx, sy, cameraRef.current, width, height, HIT_RADIUS)
        if (hit) {
          selectIndividual(sim, hit.id)
          const profile = buildProfileSnapshot(sim, hit.id)
          dispatch({ type: 'SELECT', id: hit.id, profile })
        }
      } else if (state.phase === 'predicting' && state.cycle?.status === 'pending') {
        influenceRef.current = screenToWorld(sx, sy, cameraRef.current, width, height)
      } else if (state.phase === 'resting') {
        dispatch({ type: 'RESTART' })
      }
    }

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerenter', onPointerEnter)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('pointerdown', onPointerDown)
    return () => {
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerenter', onPointerEnter)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('pointerdown', onPointerDown)
    }
  }, [dispatch])

  // Minimal keyboard fallback: while waiting for a selection, any key
  // selects the individual nearest the field's center.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const state = uiRef.current
      const sim = simRef.current!
      if (state.phase === 'selecting') {
        let nearest = sim.population[0]
        let bestDist = Infinity
        for (const ind of sim.population) {
          const d = Math.hypot(ind.position.x, ind.position.y)
          if (d < bestDist) {
            bestDist = d
            nearest = ind
          }
        }
        selectIndividual(sim, nearest.id)
        dispatch({ type: 'SELECT', id: nearest.id, profile: buildProfileSnapshot(sim, nearest.id) })
      } else if (state.phase === 'resting') {
        dispatch({ type: 'RESTART' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])

  const pct = (v: number) => `${Math.round(v * 100)}%`

  return (
    <div className="the-particular-root">
      <canvas ref={canvasRef} className="the-particular-canvas" />

      <div ref={hudRef} className="the-particular-hud">
        {ui.profile && (ui.phase === 'profiling' || ui.phase === 'predicting') && (
          <div className="the-particular-profile" aria-live="polite">
            <div className="row">
              <span className="k">BEHAVIOR</span>
              <span className="v">{pct(ui.profile.behavior)}</span>
            </div>
            <div className="row">
              <span className="k">PREFERENCE</span>
              <span className="v">{pct(ui.profile.preference)}</span>
            </div>
            <div className="row">
              <span className="k">SIMILARITY</span>
              <span className="v">{pct(ui.profile.similarity)}</span>
            </div>
            <div className="row">
              <span className="k">PREDICTION</span>
              <span className="v">{pct(ui.profile.prediction)}</span>
            </div>
            <div className="row">
              <span className="k">CONFIDENCE</span>
              <span className="v">{pct(ui.profile.confidence)}</span>
            </div>
          </div>
        )}

        {ui.phase === 'predicting' && ui.cycle && (
          <div className="the-particular-cycle" aria-live="polite">
            {ui.cycle.status === 'pending' && (
              <>
                <div className="expected">
                  EXPECTED
                  <br />→ move toward {ui.cycle.predictedGroupLabel}
                </div>
                <div className="confidence">
                  CONFIDENCE {Math.round(ui.cycle.confidence * 100)}%
                </div>
              </>
            )}
            {ui.cycle.status === 'failed' && <div className="status">PREDICTION FAILED</div>}
            {ui.cycle.status === 'unexpected' && <div className="status">UNEXPECTED</div>}
          </div>
        )}
      </div>

      <div
        className="the-particular-final"
        style={{
          opacity: ui.showFinalText ? 1 : 0,
          transitionDuration: `${ui.showFinalText ? CONFIG.final.fadeInMs : CONFIG.final.fadeOutMs}ms`,
        }}
        aria-hidden={!ui.showFinalText}
      >
        {CONFIG.final.text}
      </div>

      {ui.phase === 'resting' && (
        <button
          type="button"
          className="the-particular-restart"
          onClick={() => dispatch({ type: 'RESTART' })}
          aria-label="Begin again"
        >
          ↺
        </button>
      )}
    </div>
  )
}

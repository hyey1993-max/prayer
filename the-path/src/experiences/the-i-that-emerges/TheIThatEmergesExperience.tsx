import { useEffect, useRef, useState } from 'react'
import { CONFIG } from './config/constants'
import type { Attribute, Phase, Vec2 } from './models/types'
import {
  containsPoint,
  createNature,
  createObject,
  leanBoundaryToward,
  orbitOffset,
  perceptionDelayMs,
  readiness,
  stepObject,
  wanderOffset,
  type ObjectState,
} from './core/object'
import { ATTRIBUTE_ORDER, measureNext } from './core/measure'
import {
  createPresence,
  delayedPosition,
  presenceQuality,
  pursuitLevel,
  recordPointer,
  updatePresence,
} from './core/presence'
import { clickDuringEncounter, createEncounter, stepEncounter, type EncounterState } from './core/encounter'
import { createMemory, remember } from './core/memory'
import { nudge, relationFromMemory, shapeOf, type Relation } from './core/relation'
import { createIField, stepIField } from './core/ifield'
import { canAdvance, iFormFor, scaled } from './experience/phase'
import {
  drawBackground,
  drawDotObject,
  drawGrid,
  drawIField,
  drawLabels,
  drawSpecimenFrame,
  drawThreads,
  makeSphere,
} from './rendering/draw'
import { drawLetters, scatterLabels, stepLetters, type Letter } from './rendering/letters'
import { usePrefersReducedMotion } from '../../shared/usePrefersReducedMotion'

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerpVec = (a: Vec2, b: Vec2, t: number): Vec2 => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) })

export default function TheIThatEmergesExperience() {
  // The same object for as long as the piece is open, across every restart.
  const [seed] = useState(() => Math.floor(Math.random() * 0xffffffff))
  const [session, setSession] = useState(0)
  const [phase, setPhase] = useState<Phase>('observe')
  const [closingStep, setClosingStep] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedRef = useRef(reducedMotion)
  useEffect(() => {
    reducedRef.current = reducedMotion
  }, [reducedMotion])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = 0
    let height = 0
    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement!)

    const start = performance.now()
    const nature = createNature(seed)
    const specimen = `S-${String(session + 1).padStart(2, '0')}`
    const presence = createPresence(start)
    const ifield = createIField()
    const memory = createMemory()
    const attributes: Attribute[] = []
    const sphere = makeSphere(CONFIG.dots.count)
    let letters: Letter[] = []
    let lettersBornAt = 0

    let obj: ObjectState = createObject(nature)
    let encounter: EncounterState = createEncounter()
    let relation: Relation | null = null
    let current: Phase = 'observe'
    let phaseStartedAt = start
    let lastMeasureAt = 0
    let order = 0
    let labelFlashAt = -Infinity
    let shownClosingStep = 0
    let lastFrame = start

    const dur = (ms: number) => scaled(ms, reducedRef.current, CONFIG.reducedMotion.durationFactor)
    const origin = (): Vec2 => ({ x: width / 2, y: height / 2 })

    const goTo = (next: Phase, now: number) => {
      if (!canAdvance(current, next)) return
      current = next
      phaseStartedAt = now
      remember(memory, now, next, 'phase')
      if (next === 'wait') {
        // The measurements are not concluded — they come apart.
        letters = scatterLabels(ctx, obj, attributes, width, seed + session * 31)
        lettersBornAt = now
      }
      if (next === 'encounter') encounter = createEncounter()
      if (next === 'return') {
        // The same object as at the beginning — only the relation differs.
        obj = createObject(nature)
        relation = relationFromMemory(memory)
        encounter = createEncounter()
      }
      setPhase(next)
    }

    const doMeasure = (now: number) => {
      const measuring = current === 'observe' || current === 'classify'
      if (!measuring && current !== 'return' && current !== 'closing') return
      measureNext(attributes, obj, { width, height }, specimen)
      remember(memory, now, current, 'measure')
      if (measuring) {
        if (lastMeasureAt > 0 && now - lastMeasureAt > 1500) {
          remember(memory, now, current, 'pause', now - lastMeasureAt)
        }
        obj.autonomy *= CONFIG.classify.autonomyDecay
      } else if (relation) {
        nudge(relation, CONFIG.ret.measureInstrumental, 0)
        labelFlashAt = now
      }
      lastMeasureAt = now
      if (current === 'observe') goTo('classify', now)
    }

    // --- input ---
    const toLocal = (e: PointerEvent): Vec2 => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e)
      recordPointer(presence, p.x, p.y, performance.now())
    }
    const onLeave = () => {
      presence.inside = false
    }
    const onDown = (e: PointerEvent) => {
      const now = performance.now()
      const p = toLocal(e)
      recordPointer(presence, p.x, p.y, now)
      presence.lastInputAt = now
      const onObject = containsPoint(obj, p)

      if (current === 'encounter') {
        // Cannot be clicked or analyzed. A click is only a reach toward it.
        remember(memory, now, current, 'click')
        clickDuringEncounter(encounter)
        const dx = obj.center.x - p.x
        const dy = obj.center.y - p.y
        const d = Math.hypot(dx, dy) || 1
        obj.vel.x += (dx / d) * CONFIG.encounter.clickRecoil
        obj.vel.y += (dy / d) * CONFIG.encounter.clickRecoil
        return
      }
      if (onObject && current !== 'wait') doMeasure(now)
      else remember(memory, now, current, 'click')
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      if (e.target instanceof HTMLButtonElement) return
      const now = performance.now()
      presence.lastInputAt = now
      if (current === 'observe' || current === 'classify' || current === 'return' || current === 'closing') {
        e.preventDefault()
        doMeasure(now)
      }
    }

    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerleave', onLeave)
    window.addEventListener('keydown', onKey)

    // --- frame ---
    let raf = 0
    const tick = () => {
      const now = performance.now()
      const dtMs = Math.min(64, now - lastFrame)
      lastFrame = now
      const dt = dtMs / 1000
      const f = dtMs / 16.7
      const ease = (cur: number, target: number, k: number) => cur + (target - cur) * Math.min(1, k * f)

      const o = origin()
      updatePresence(presence, now, dtMs, obj.center)
      const elapsed = now - phaseStartedAt
      const t = obj.ownTime
      const wanderAmp = reducedRef.current ? CONFIG.reducedMotion.wanderFactor : 1
      const wander = wanderOffset(nature, t, wanderAmp)
      const R = CONFIG.object.radius

      let target: Vec2 = wander
      let stiffness = 1.4
      let coupling = 0
      let threads = 0
      let iForm = iFormFor(current)
      let gridOrder = 0
      let frameOrder = 0
      let labelAlpha = 0
      let flatten = 0

      // Moves toward where the person was a moment ago, stopping `keep` px
      // short of them; how far it commits depends on how open it is.
      const approach = (delayMs: number, keep: number, weight: number): Vec2 => {
        const perceived = delayedPosition(presence, now, delayMs)
        if (!perceived) return wander
        const dx = perceived.x - obj.center.x
        const dy = perceived.y - obj.center.y
        const d = Math.hypot(dx, dy)
        if (d < 1) return wander
        obj.orientation = Math.atan2(dy, dx)
        const desired = { x: perceived.x - (dx / d) * keep - o.x, y: perceived.y - (dy / d) * keep - o.y }
        return lerpVec(wander, desired, weight)
      }

      const runEncounter = () => {
        const quality = presenceQuality(presence)
        const pursuit = pursuitLevel(presence)
        const span = CONFIG.encounter.meetingMaxMs - CONFIG.encounter.meetingMinMs
        const ownMeetingMs = CONFIG.encounter.meetingMinMs + span * ((nature.hueDrift(t * 0.37) + 1) / 2)
        const step = stepEncounter(encounter, dtMs, now, quality, pursuit, readiness(nature, t), ownMeetingMs)
        if (step.met) remember(memory, now, current, 'meet')
        if (step.parted) remember(memory, now, current, 'part', now - encounter.meetingStart)
        if (current === 'encounter') {
          if (quality > 0.6) memory.stillSeconds += dt
          if (pursuit > 0.4) memory.pursuitSeconds += dt
        }
        if (pursuit > 0 && presence.pos) {
          const ax = obj.center.x - presence.pos.x
          const ay = obj.center.y - presence.pos.y
          const ad = Math.hypot(ax, ay) || 1
          obj.vel.x += (ax / ad) * pursuit * CONFIG.encounter.withdrawGain * f
          obj.vel.y += (ay / ad) * pursuit * CONFIG.encounter.withdrawGain * f
        }
        return { quality, pursuit }
      }

      switch (current) {
        case 'observe':
          obj.outline = ease(obj.outline, 0, 0.05)
          break

        case 'classify': {
          order = ease(order, attributes.length / ATTRIBUTE_ORDER.length, 0.04)
          target = lerpVec(orbitOffset(now), wander, obj.autonomy)
          stiffness = 1.4 + (1 - obj.autonomy) * 3
          obj.quantize = ease(obj.quantize, order * CONFIG.classify.maxQuantize, 0.05)
          obj.saturation = ease(obj.saturation, CONFIG.object.saturation * (0.15 + 0.85 * obj.autonomy), 0.05)
          obj.outline = ease(obj.outline, order, 0.05)
          gridOrder = order
          frameOrder = order
          labelAlpha = 1
          flatten = order
          const idle = now - presence.lastInputAt
          if (idle >= dur(CONFIG.classify.pauseToWaitMs)) {
            remember(memory, now, current, 'pause', idle)
            goTo('wait', now)
          }
          break
        }

        case 'wait': {
          // Nothing is concluded. The measurements loosen; the object slowly
          // recovers its own motion; input is recorded but not answered.
          obj.autonomy = ease(obj.autonomy, 1, CONFIG.wait.autonomyRecoverEase)
          order = ease(order, 0, 0.012)
          target = lerpVec(orbitOffset(now), wander, obj.autonomy)
          obj.quantize = ease(obj.quantize, 0, 0.02)
          obj.saturation = ease(obj.saturation, CONFIG.object.saturation, 0.01)
          obj.outline = ease(obj.outline, 0, 0.02)
          gridOrder = order
          frameOrder = order
          flatten = order
          memory.waitMs = elapsed
          if (elapsed >= dur(CONFIG.wait.minMs) && now - presence.lastInputAt >= dur(CONFIG.wait.quietMs)) {
            goTo('encounter', now)
          }
          break
        }

        case 'encounter': {
          obj.autonomy = ease(obj.autonomy, 1, 0.02)
          obj.quantize = ease(obj.quantize, 0, 0.05)
          obj.saturation = ease(obj.saturation, CONFIG.object.saturation, 0.02)
          obj.outline = ease(obj.outline, 0, 0.05)
          runEncounter()
          const e = CONFIG.encounter
          const delay = perceptionDelayMs(nature, t)
          const weight = encounter.openness * encounter.openness * e.approachShare
          target = approach(delay, R + e.meetingDistance, weight)
          stiffness = 1.1
          obj.bulge = ease(obj.bulge, encounter.openness, 0.04)
          coupling = encounter.coupling
          threads = encounter.coupling
          if (encounter.parted && !encounter.meeting && now - encounter.partedAt >= dur(e.afterMeetingMs)) {
            goTo('return', now)
          } else if (elapsed >= dur(e.maxMs) && !encounter.meeting) {
            goTo('return', now)
          }
          break
        }

        case 'return':
        case 'closing': {
          const rel = relation!
          const { quality, pursuit } = runEncounter()
          if (quality > 0.6) nudge(rel, 0, CONFIG.ret.stillMutualPerSec * dt)
          if (pursuit > 0.4) nudge(rel, CONFIG.ret.pursuitInstrumentalPerSec * dt, 0)
          const shape = shapeOf(rel)
          const is = shape.instrumentalShare
          const ms = shape.mutualShare

          const soft = { x: wander.x * (0.4 + 0.6 * ms), y: wander.y * (0.4 + 0.6 * ms) }
          const keep = shape.distance + R

          // Instrumental strand: no delay, an exact distance from the I.
          let mechTarget = soft
          if (presence.pos && presence.inside) {
            const vx = obj.center.x - presence.pos.x
            const vy = obj.center.y - presence.pos.y
            const d = Math.hypot(vx, vy)
            if (d < keep) {
              const n = d > 0.5 ? { x: vx / d, y: vy / d } : { x: -1, y: 0 }
              mechTarget = { x: presence.pos.x + n.x * keep - o.x, y: presence.pos.y + n.y * keep - o.y }
            }
          }
          // Mutual strand: its own delay, its own distance, its own timing.
          const weight = encounter.openness * encounter.openness * CONFIG.encounter.approachShare
          const mutual = approach(shape.latencyMs, keep, weight)
          target = {
            x: soft.x + (mechTarget.x - soft.x) * is + (mutual.x - wander.x) * ms,
            y: soft.y + (mechTarget.y - soft.y) * is + (mutual.y - wander.y) * ms,
          }
          stiffness = 1.2 + 4.5 * is
          // The object itself stays as it was at the beginning; what differs
          // is the distance, the delay and how the two movements are linked.
          obj.quantize = ease(obj.quantize, 0, 0.04)
          obj.saturation = ease(obj.saturation, CONFIG.object.saturation, 0.04)
          obj.outline = ease(obj.outline, 0.3 * is, 0.04)
          obj.bulge = ease(obj.bulge, encounter.openness * ms, 0.04)
          gridOrder = 0.45 * is
          frameOrder = 0.6 * is
          const ghost = 0.1 + 0.22 * is
          const flash = Math.max(0, 1 - (now - labelFlashAt) / CONFIG.ret.labelFlashMs)
          labelAlpha = Math.max(ghost, flash * 0.9)
          iForm = { reticle: is, cloud: ms }
          coupling = encounter.coupling * ms
          threads = Math.max(encounter.coupling, 0.3 * ms * quality)

          if (current === 'return') {
            const idleMs = Math.min(now - presence.lastMoveAt, now - presence.lastInputAt)
            if (elapsed >= dur(CONFIG.ret.minMs) && idleMs >= dur(CONFIG.ret.idleToCloseMs)) goTo('closing', now)
          } else {
            const step =
              elapsed >= dur(CONFIG.closing.againDelayMs) ? 3 : elapsed >= dur(CONFIG.closing.quoteDelayMs) ? 2 : 1
            if (step !== shownClosingStep) {
              shownClosingStep = step
              setClosingStep(step)
            }
          }
          break
        }
      }

      // Keep the object within the screen.
      const limX = Math.max(0, width / 2 - R - 24)
      const limY = Math.max(0, height / 2 - R - 24)
      target = { x: Math.max(-limX, Math.min(limX, target.x)), y: Math.max(-limY, Math.min(limY, target.y)) }

      stepObject(obj, nature, dt, target, stiffness, o)
      if (coupling > 0.001 && ifield.visible) leanBoundaryToward(obj, ifield.pos, coupling)
      stepIField(ifield, presence.inside ? presence.pos : null, dtMs, t, iForm, obj.boundary, coupling)

      drawBackground(ctx, width, height)
      drawGrid(ctx, width, height, o, gridOrder)
      drawSpecimenFrame(ctx, obj.center, frameOrder, specimen)
      drawThreads(ctx, obj, ifield, threads)
      drawDotObject(ctx, obj, sphere, flatten, ifield.visible ? ifield.pos : null, coupling)
      drawLabels(ctx, obj, attributes, width, labelAlpha)
      if (letters.length > 0) {
        const life = 1 - (now - lettersBornAt) / dur(CONFIG.letters.lifeMs)
        if (life <= 0) letters = []
        else {
          stepLetters(letters, dt)
          drawLetters(ctx, letters, life)
        }
      }
      drawIField(ctx, ifield, current === 'classify')

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('keydown', onKey)
    }
  }, [seed, session])

  const restart = () => {
    setPhase('observe')
    setClosingStep(0)
    setSession((s) => s + 1)
  }

  const text = CONFIG.text
  return (
    <div className="tie-root" data-phase={phase}>
      <canvas
        ref={canvasRef}
        className="tie-canvas"
        role="img"
        aria-label="An object on an empty field, and your presence near it."
      />

      <div className={`tie-intro${phase === 'observe' ? ' is-visible' : ''}`} aria-hidden={phase !== 'observe'}>
        <p className="tie-kicker">{text.kicker}</p>
        <h1 className="tie-question">{text.question}</h1>
        <p className="tie-invitation">{text.invitation}</p>
        <p className="tie-terms">{text.terms}</p>
      </div>

      {phase === 'closing' && (
        <div className="tie-closing">
          <h2 className={`tie-question${closingStep >= 1 ? ' is-visible' : ''}`}>{text.question}</h2>
          <blockquote className={`tie-quote${closingStep >= 2 ? ' is-visible' : ''}`}>
            <p>{text.quote}</p>
            <cite>{text.attribution}</cite>
          </blockquote>
          <button
            type="button"
            className={`tie-again${closingStep >= 3 ? ' is-visible' : ''}`}
            onClick={restart}
            tabIndex={closingStep >= 3 ? 0 : -1}
          >
            {text.again}
          </button>
        </div>
      )}
    </div>
  )
}

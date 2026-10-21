import { useEffect, useRef, useState } from 'react'
import { CONFIG } from './config/constants'
import { idleFocus, OWN_BIT, PATTERNS, type PatternContext, type Sample } from './core/patterns'
import { createGlyphAtlas } from './rendering/glyphs'
import { createRng } from '../../shared/rng'
import { usePrefersReducedMotion } from '../../shared/usePrefersReducedMotion'

interface Ripple {
  x: number
  y: number
  born: number
}

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

export default function OscillationExperience() {
  const [pattern, setPattern] = useState(0)
  const [touched, setTouched] = useState(false)
  const reducedMotion = usePrefersReducedMotion()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const readoutRef = useRef<HTMLDivElement>(null)
  const requestRef = useRef<(index: number, manual: boolean) => void>(() => {})
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

    const narrow = width < CONFIG.field.narrowBreakpoint
    const cols = narrow ? CONFIG.grid.narrowCols : CONFIG.grid.cols
    const rows = narrow ? CONFIG.grid.narrowRows : CONFIG.grid.rows
    const n = cols * rows
    const rng = createRng(Math.floor(Math.random() * 0xffffffff))
    const atlas = createGlyphAtlas()

    const bits = new Uint8Array(n)
    for (let i = 0; i < n; i++) bits[i] = rng() < 0.5 ? 1 : 0
    // Last-drawn layout, so a pattern change morphs from wherever things are.
    const curX = new Float32Array(n)
    const curY = new Float32Array(n)
    const curS = new Float32Array(n)
    const curA = new Float32Array(n)
    const fromX = new Float32Array(n)
    const fromY = new Float32Array(n)
    const fromS = new Float32Array(n)
    const fromA = new Float32Array(n)

    let current = 0
    let morphStart = -Infinity
    let hasLayout = false
    let t = 0
    let k: number = CONFIG.frequency.initial
    let energy = 0
    let focus = { x: 0, y: 0 }
    let pointer: { x: number; y: number } | null = null
    let lastPointerField: { x: number; y: number; at: number } | null = null
    let lastInputAt = performance.now()
    let lastAutoAt = performance.now()
    const ripples: Ripple[] = []

    const scaleOf = () => {
      const fr = CONFIG.field
      const wf = width < fr.narrowBreakpoint ? fr.narrowWidthFrac : fr.widthFrac
      return Math.min(width * wf, height * fr.heightFrac)
    }
    const toField = (sx: number, sy: number) => {
      const s = scaleOf()
      return { x: (sx - width / 2) / s, y: (sy - height / 2) / s }
    }

    const requestPattern = (index: number, manual: boolean) => {
      const next = ((index % PATTERNS.length) + PATTERNS.length) % PATTERNS.length
      if (next === current) return
      fromX.set(curX)
      fromY.set(curY)
      fromS.set(curS)
      fromA.set(curA)
      morphStart = performance.now()
      current = next
      if (manual) lastInputAt = morphStart
      lastAutoAt = morphStart
      setPattern(next)
    }
    requestRef.current = requestPattern

    const markInput = () => {
      lastInputAt = performance.now()
      setTouched(true)
    }

    const local = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      return { x: e.clientX - r.left, y: e.clientY - r.top }
    }
    const onMove = (e: PointerEvent) => {
      const p = local(e)
      pointer = p
      const now = performance.now()
      const f = toField(p.x, p.y)
      if (lastPointerField) {
        const dt = Math.max(8, now - lastPointerField.at) / 1000
        const speed = Math.hypot(f.x - lastPointerField.x, f.y - lastPointerField.y) / dt
        energy = Math.max(energy, Math.min(1, speed / CONFIG.energy.speedRef))
      }
      lastPointerField = { x: f.x, y: f.y, at: now }
      markInput()
    }
    const onLeave = () => {
      pointer = null
      lastPointerField = null
    }
    const onDown = (e: PointerEvent) => {
      const p = local(e)
      pointer = p
      const f = toField(p.x, p.y)
      ripples.push({ x: f.x, y: f.y, born: t })
      if (ripples.length > CONFIG.ripple.max) ripples.shift()
      markInput()
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      k = Math.min(CONFIG.frequency.max, Math.max(CONFIG.frequency.min, k * Math.exp(-e.deltaY * CONFIG.frequency.wheel)))
      markInput()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement && (e.key === ' ' || e.key === 'Enter')) return
      if (e.key >= '1' && e.key <= String(PATTERNS.length)) {
        requestPattern(Number(e.key) - 1, true)
      } else if (e.key === 'ArrowRight') {
        requestPattern(current + 1, true)
      } else if (e.key === 'ArrowLeft') {
        requestPattern(current - 1, true)
      } else if (e.key === ' ') {
        e.preventDefault()
        ripples.push({ x: focus.x, y: focus.y, born: t })
        if (ripples.length > CONFIG.ripple.max) ripples.shift()
      } else return
      markInput()
    }

    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)

    const sample: Sample = { x: 0, y: 0, s: 0, a: 0, digit: OWN_BIT }
    const pctx: PatternContext = { t: 0, k: 1, amp: 1, fx: 0, fy: 0 }
    let lastFrame = performance.now()
    let lastReadout = 0
    let raf = 0

    const tick = () => {
      const now = performance.now()
      const dtMs = Math.min(64, now - lastFrame)
      lastFrame = now
      const dt = dtMs / 1000
      const f = dtMs / 16.7
      const timeScale = reducedRef.current ? CONFIG.motion.reducedTimeScale : CONFIG.motion.timeScale
      t += dt * timeScale

      // Focus follows the pointer, or drifts when nobody is there.
      const target = pointer ? toField(pointer.x, pointer.y) : idleFocus(t, CONFIG.focus.idleDrift)
      target.x = Math.max(-1.1, Math.min(1.1, target.x))
      target.y = Math.max(-0.8, Math.min(0.8, target.y))
      const fe = Math.min(1, CONFIG.focus.ease * f)
      focus = { x: focus.x + (target.x - focus.x) * fe, y: focus.y + (target.y - focus.y) * fe }
      energy *= Math.pow(CONFIG.energy.decay, f)

      if (now - lastInputAt > CONFIG.auto.idleMs && now - lastAutoAt > CONFIG.auto.everyMs) {
        requestPattern(current + 1, false)
      }

      // Ambient bit flips — the field is never quite still.
      const flips = Math.round(n * CONFIG.bits.flipPerSec * dt * timeScale) + (rng() < 0.5 ? 1 : 0)
      for (let i = 0; i < flips; i++) bits[Math.floor(rng() * n)] ^= 1

      while (ripples.length > 0 && t - ripples[0].born > CONFIG.ripple.lifeSec) ripples.shift()

      pctx.t = t
      pctx.k = k
      pctx.amp = 1 + CONFIG.energy.ampBoost * energy
      pctx.fx = focus.x
      pctx.fy = focus.y

      const map = PATTERNS[current].map
      const morphing = hasLayout && now - morphStart < CONFIG.motion.morphMs
      const m = morphing ? easeInOutCubic((now - morphStart) / CONFIG.motion.morphMs) : 1

      const scale = scaleOf()
      const cx = width / 2
      const cy = height / 2
      const spacing = (2 * scale) / cols
      const glyphH = spacing * CONFIG.glyph.scale
      const glyphW = glyphH * (atlas.cellW / atlas.cellH)
      const hr = CONFIG.hover.radius
      const rp = CONFIG.ripple

      ctx.fillStyle = CONFIG.visual.bg
      ctx.fillRect(0, 0, width, height)

      for (let j = 0; j < rows; j++) {
        const v = (j / (rows - 1)) * 2 - 1
        for (let i = 0; i < cols; i++) {
          const idx = j * cols + i
          const u = (i / (cols - 1)) * 2 - 1
          map(u, v, pctx, sample)

          let x = sample.x
          let y = sample.y
          let s = sample.s
          let a = sample.a
          if (morphing) {
            x = fromX[idx] + (x - fromX[idx]) * m
            y = fromY[idx] + (y - fromY[idx]) * m
            s = fromS[idx] + (s - fromS[idx]) * m
            a = fromA[idx] + (a - fromA[idx]) * m
          }
          curX[idx] = x
          curY[idx] = y
          curS[idx] = s
          curA[idx] = a

          let digit = sample.digit === OWN_BIT ? bits[idx] : sample.digit
          let flipped = false

          for (const r of ripples) {
            const age = t - r.born
            const dx = x - r.x
            const dy = y - r.y
            const d = Math.hypot(dx, dy) || 1
            const ring = (d - age * rp.speed) / rp.width
            const band = Math.exp(-ring * ring) * (1 - age / rp.lifeSec)
            if (band < 0.01) continue
            x += (dx / d) * band * rp.push
            y += (dy / d) * band * rp.push
            s *= 1 + band * rp.grow
            a = Math.max(a, band)
            if (band > 0.5) flipped = !flipped
          }

          const sx = cx + x * scale
          const sy = cy + y * scale

          if (pointer) {
            const d = Math.hypot(sx - pointer.x, sy - pointer.y)
            if (d < hr) {
              const near = 1 - d / hr
              s *= 1 + near * CONFIG.hover.magnify
              a = Math.min(1, a + near * CONFIG.hover.brighten)
              if (rng() < near * energy * CONFIG.hover.flip * f) bits[idx] ^= 1
            }
          }

          if (flipped) digit = digit <= 1 ? digit ^ 1 : (digit + 5) % 10
          if (a <= 0.02) continue
          const w = glyphW * s
          const h = glyphH * s
          ctx.globalAlpha = Math.min(1, a)
          ctx.drawImage(atlas.canvas, digit * atlas.cellW, 0, atlas.cellW, atlas.cellH, sx - w / 2, sy - h / 2, w, h)
        }
      }
      ctx.globalAlpha = 1
      hasLayout = true

      if (readoutRef.current && now - lastReadout > 100) {
        lastReadout = now
        readoutRef.current.textContent =
          `FREQ ${k.toFixed(2)}  ·  AMP ${pctx.amp.toFixed(2)}  ·  ` +
          `FOCUS ${focus.x >= 0 ? '+' : ''}${focus.x.toFixed(2)} ${focus.y >= 0 ? '+' : ''}${focus.y.toFixed(2)}  ·  ` +
          `T ${t.toFixed(1)}`
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div className="osc-root" data-pattern={PATTERNS[pattern].name}>
      <canvas
        ref={canvasRef}
        className="osc-canvas"
        role="img"
        aria-label={`A field of digits in the ${PATTERNS[pattern].name.toLowerCase()} pattern`}
      />
      <div ref={readoutRef} className="osc-readout" aria-hidden="true" />
      <nav className="osc-patterns" aria-label="Pattern">
        {PATTERNS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            className={i === pattern ? 'is-active' : ''}
            aria-current={i === pattern}
            onClick={() => requestRef.current(i, true)}
          >
            <span className="osc-index">{String(i + 1).padStart(2, '0')}</span> {p.name}
          </button>
        ))}
      </nav>
      <p className={`osc-hint${touched ? ' is-hidden' : ''}`} aria-hidden="true">
        MOVE · CLICK · SCROLL · 1–6
      </p>
    </div>
  )
}

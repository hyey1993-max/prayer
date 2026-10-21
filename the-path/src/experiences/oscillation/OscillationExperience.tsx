import { useEffect, useRef, useState } from 'react'
import { CONFIG } from './config/constants'
import { OWN_BIT, PATTERNS, type PatternContext, type Sample } from './core/patterns'
import { createDirector } from './core/director'
import { createGlyphAtlas } from './rendering/glyphs'
import { createRng } from '../../shared/rng'
import { usePrefersReducedMotion } from '../../shared/usePrefersReducedMotion'

interface Ripple {
  x: number
  y: number
  born: number
}

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

/** Runs on its own. No input changes what it does. */
export default function OscillationExperience() {
  const [pattern, setPattern] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const readoutRef = useRef<HTMLDivElement>(null)
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
    const seed = Math.floor(Math.random() * 0xffffffff)
    const rng = createRng(seed)
    const direct = createDirector(seed)
    const atlas = createGlyphAtlas()
    const c = CONFIG.choreography

    const bits = new Uint8Array(n)
    for (let i = 0; i < n; i++) bits[i] = rng() < 0.5 ? 1 : 0
    // Last-drawn layout, so each pattern change morphs from wherever things are.
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
    let surge = 0
    let nextPatternAt = c.patternHoldSec
    let nextRippleAt = 1.2
    const ripples: Ripple[] = []

    const scaleOf = () => {
      const fr = CONFIG.field
      const wf = width < fr.narrowBreakpoint ? fr.narrowWidthFrac : fr.widthFrac
      return Math.min(width * wf, height * fr.heightFrac)
    }

    const advancePattern = (now: number) => {
      fromX.set(curX)
      fromY.set(curY)
      fromS.set(curS)
      fromA.set(curA)
      morphStart = now
      current = (current + 1) % PATTERNS.length
      surge = Math.max(surge, c.surgeOnPattern)
      setPattern(current)
    }

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

      const d = direct(t)
      surge *= Math.pow(c.surgeDecay, f * timeScale)

      // --- its own events ---
      if (t >= nextPatternAt) {
        advancePattern(now)
        nextPatternAt = t + c.patternHoldSec
      }
      if (t >= nextRippleAt) {
        // Ripples start near the focus, a little off it, so they read as
        // something the field does to itself.
        const a = rng() * Math.PI * 2
        const r = 0.1 + rng() * 0.35
        ripples.push({ x: d.fx + Math.cos(a) * r, y: d.fy + Math.sin(a) * r * 0.7, born: t })
        if (ripples.length > CONFIG.ripple.max) ripples.shift()
        surge = Math.max(surge, c.surgeOnRipple)
        nextRippleAt = t + c.rippleGapMinSec + rng() * (c.rippleGapMaxSec - c.rippleGapMinSec)
      }
      while (ripples.length > 0 && t - ripples[0].born > CONFIG.ripple.lifeSec) ripples.shift()

      // Ambient bit flips — the field is never quite still.
      const flips = Math.round(n * CONFIG.bits.flipPerSec * dt * timeScale) + (rng() < 0.5 ? 1 : 0)
      for (let i = 0; i < flips; i++) bits[Math.floor(rng() * n)] ^= 1

      pctx.t = t
      pctx.k = d.k
      pctx.amp = d.amp + c.surgeAmp * surge
      pctx.fx = d.fx
      pctx.fy = d.fy

      const map = PATTERNS[current].map
      const morphing = hasLayout && now - morphStart < CONFIG.motion.morphMs
      const m = morphing ? easeInOutCubic((now - morphStart) / CONFIG.motion.morphMs) : 1

      const scale = scaleOf()
      const cx = width / 2
      const cy = height / 2
      const spacing = (2 * scale) / cols
      const glyphH = spacing * CONFIG.glyph.scale
      const glyphW = glyphH * (atlas.cellW / atlas.cellH)
      const rp = CONFIG.ripple
      const lens = CONFIG.lens
      const lensX = cx + d.fx * scale
      const lensY = cy + d.fy * scale
      const flipChance = lens.flip * (0.3 + surge) * f

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
            const dist = Math.hypot(dx, dy) || 1
            const ring = (dist - age * rp.speed) / rp.width
            const band = Math.exp(-ring * ring) * (1 - age / rp.lifeSec)
            if (band < 0.01) continue
            x += (dx / dist) * band * rp.push
            y += (dy / dist) * band * rp.push
            s *= 1 + band * rp.grow
            a = Math.max(a, band)
            if (band > 0.5) flipped = !flipped
          }

          const sx = cx + x * scale
          const sy = cy + y * scale

          const ld = Math.hypot(sx - lensX, sy - lensY)
          if (ld < lens.radius) {
            const near = 1 - ld / lens.radius
            s *= 1 + near * lens.magnify
            a = Math.min(1, a + near * lens.brighten)
            if (rng() < near * flipChance) bits[idx] ^= 1
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
        const sign = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`
        readoutRef.current.textContent =
          `FREQ ${d.k.toFixed(2)}  ·  AMP ${pctx.amp.toFixed(2)}  ·  ` +
          `FOCUS ${sign(d.fx)} ${sign(d.fy)}  ·  T ${t.toFixed(1)}`
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="osc-root" data-pattern={PATTERNS[pattern].name}>
      <canvas
        ref={canvasRef}
        className="osc-canvas"
        role="img"
        aria-label={`A self-running field of digits, now in the ${PATTERNS[pattern].name.toLowerCase()} pattern`}
      />
      <div ref={readoutRef} className="osc-readout" aria-hidden="true" />
      <ol className="osc-patterns" aria-hidden="true">
        {PATTERNS.map((p, i) => (
          <li key={p.name} className={i === pattern ? 'is-active' : ''}>
            <span className="osc-index">{String(i + 1).padStart(2, '0')}</span> {p.name}
          </li>
        ))}
      </ol>
    </div>
  )
}

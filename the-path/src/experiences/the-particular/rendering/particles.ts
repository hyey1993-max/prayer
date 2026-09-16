import { CONFIG } from '../config/constants'
import type { Individual } from '../models/Individual'
import type { Phase } from '../models/State'
import { worldToScreen, type Camera } from '../../../shared/camera'
import { withAlpha } from './color'

export interface ParticlesInput {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  camera: Camera
  population: Individual[]
  selectedId: string | null
  hoveredId: string | null
  phase: Phase
  reductionT: number
  dissolveT: number
  pulseT: number
}

export function drawParticles(input: ParticlesInput) {
  const {
    ctx,
    width,
    height,
    camera,
    population,
    selectedId,
    hoveredId,
    phase,
    reductionT,
    dissolveT,
    pulseT,
  } = input
  const v = CONFIG.visual
  const isSelectedPhase = phase === 'profiling' || phase === 'predicting'
  const isDissolving = phase === 'dissolving'
  const isEndPhase = phase === 'final' || phase === 'resting'

  for (const ind of population) {
    const selected = ind.id === selectedId

    if (!selected) {
      if (isEndPhase) continue
      let opacity =
        phase === 'field' || phase === 'classifying' || phase === 'selecting'
          ? 1
          : v.dimPopulationOpacity
      if (isSelectedPhase) opacity *= 1 - reductionT * 0.7
      if (isDissolving) opacity *= 1 - dissolveT
      if (opacity <= 0.002) continue

      const p = worldToScreen(ind.position.x, ind.position.y, camera, width, height)
      const hovered = ind.id === hoveredId
      const radius = v.particleRadius * (hovered ? 1.6 : 1)
      ctx.beginPath()
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = withAlpha(v.particle, opacity * (hovered ? 1.4 : 1))
      ctx.fill()
      continue
    }

    // the selected individual, drawn on top, last.
    const p = worldToScreen(ind.position.x, ind.position.y, camera, width, height)
    let radius = v.particleRadiusSelected
    if (isSelectedPhase) radius = v.particleRadiusSelected * (1 - reductionT * 0.55)
    const pulse = isEndPhase ? 1 + Math.sin(pulseT * Math.PI * 2) * 0.14 : 1
    radius *= pulse

    ctx.beginPath()
    ctx.arc(p.x, p.y, radius + 4, 0, Math.PI * 2)
    ctx.strokeStyle = withAlpha(v.particleSelected, 0.12)
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = v.particleSelected
    ctx.fill()
  }
}

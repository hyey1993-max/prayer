import { CONFIG } from '../config/constants'
import type { Group, Phase } from '../models/State'
import { worldToScreen, type Camera } from '../../../shared/camera'
import { withAlpha } from './color'

export interface LabelsInput {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  camera: Camera
  groups: Group[]
  phase: Phase
  /** 0..1 fade-in once classification has settled. */
  labelT: number
}

/** World-anchored group labels — GROUP A / GROUP B / GROUP C — small,
 * restrained, drawn on canvas because they move with their cluster. */
export function drawGroupLabels(input: LabelsInput) {
  const { ctx, width, height, camera, groups, phase, labelT } = input
  if (groups.length === 0) return
  if (phase === 'field' || phase === 'classifying') return
  if (phase === 'dissolving' || phase === 'final' || phase === 'resting') return
  if (labelT <= 0.001) return

  const v = CONFIG.visual
  ctx.font = '500 10px ui-sans-serif, system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const g of groups) {
    const p = worldToScreen(g.anchor.x, g.anchor.y - 34, camera, width, height)
    ctx.fillStyle = withAlpha(v.label, labelT)
    ctx.fillText(g.label, p.x, p.y)
  }
}

import { CONFIG } from '../config/constants'
import type { Individual } from '../models/Individual'
import type { Group, Phase } from '../models/State'
import { worldToScreen, type Camera } from '../../../shared/camera'
import { withAlpha } from './color'

export interface ConnectionsInput {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  camera: Camera
  population: Individual[]
  groups: Group[]
  phase: Phase
  /** 0..1 progress through classification, ramps connection opacity in as
   * the system's grouping becomes more confident. */
  classificationT: number
  selectedId: string | null
}

/** Very faint lines from each individual to its assigned group's anchor —
 * "the system is trying to make sense of these people," never a labeled
 * chart. */
export function drawConnections(input: ConnectionsInput) {
  const { ctx, width, height, camera, population, groups, phase, classificationT, selectedId } = input
  if (groups.length === 0) return
  if (phase === 'dissolving' || phase === 'final' || phase === 'resting') return

  let baseOpacity = 0
  if (phase === 'classifying') baseOpacity = classificationT * 0.7
  else if (phase === 'selecting') baseOpacity = 0.4
  else if (phase === 'profiling' || phase === 'predicting') baseOpacity = 0.22

  if (baseOpacity <= 0.001) return

  const v = CONFIG.visual
  // Only a sample of the population draws its line — hundreds of individual
  // spokes converging on three points reads as a hub-and-spoke chart no
  // matter how faint; a sparser sample keeps it closer to a soft, uncertain
  // gesture toward "these belong together."
  for (let i = 0; i < population.length; i += 3) {
    const ind = population[i]
    if (ind.id === selectedId) continue
    const group = groups.find((g) => g.id === ind.groupId)
    if (!group) continue
    const p1 = worldToScreen(ind.position.x, ind.position.y, camera, width, height)
    const p2 = worldToScreen(group.anchor.x, group.anchor.y, camera, width, height)
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.strokeStyle = withAlpha(v.connection, baseOpacity)
    ctx.lineWidth = 0.5
    ctx.stroke()
  }
}

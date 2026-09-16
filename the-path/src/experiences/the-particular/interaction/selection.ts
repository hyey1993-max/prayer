import type { Individual } from '../models/Individual'
import { worldToScreen, type Camera } from '../../../shared/camera'

/** Nearest individual to a screen point, within `hitRadius` px. */
export function findNearestIndividual(
  population: Individual[],
  sx: number,
  sy: number,
  camera: Camera,
  width: number,
  height: number,
  hitRadius: number,
): Individual | null {
  let best: Individual | null = null
  let bestDist = hitRadius
  for (const ind of population) {
    const p = worldToScreen(ind.position.x, ind.position.y, camera, width, height)
    const d = Math.hypot(p.x - sx, p.y - sy)
    if (d < bestDist) {
      bestDist = d
      best = ind
    }
  }
  return best
}

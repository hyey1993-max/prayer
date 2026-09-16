import type { Individual } from '../models/Individual'
import type { Group } from '../models/State'
import { CONFIG } from '../config/constants'
import type { Rng } from '../../../shared/rng'
import { euclideanDistance, vectorMean } from './similarity'

export function initCentroids(rng: Rng, k: number, dims: number): number[][] {
  return Array.from({ length: k }, () => Array.from({ length: dims }, () => rng()))
}

/** One k-means assignment pass: nearest centroid per individual, by index. */
export function assignStep(population: Individual[], centroids: number[][]): number[] {
  return population.map((ind) => {
    let best = 0
    let bestDist = Infinity
    centroids.forEach((c, i) => {
      const d = euclideanDistance(ind.features, c)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    return best
  })
}

/** One k-means update pass: recompute each centroid as the mean of its
 * current members. A centroid with no members holds its position. */
export function updateCentroids(
  population: Individual[],
  assignments: number[],
  centroids: number[][],
  dims: number,
): number[][] {
  return centroids.map((c, i) => {
    const members = population.filter((_, idx) => assignments[idx] === i).map((p) => p.features)
    return members.length > 0 ? vectorMean(members, dims) : c
  })
}

export function nearestGroup(features: number[], groups: Group[]): Group {
  let best = groups[0]
  let bestDist = Infinity
  for (const g of groups) {
    const d = euclideanDistance(features, g.centroid)
    if (d < bestDist) {
      bestDist = d
      best = g
    }
  }
  return best
}

/** Lays out group anchors evenly around the world's center so clusters read
 * as distinct regions of the field rather than a conventional chart. */
export function layoutAnchors(k: number): { x: number; y: number }[] {
  const radius =
    Math.min(CONFIG.world.width, CONFIG.world.height) * CONFIG.classification.anchorRadiusFraction
  return Array.from({ length: k }, (_, i) => {
    const angle = (i / k) * Math.PI * 2 - Math.PI / 2
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }
  })
}

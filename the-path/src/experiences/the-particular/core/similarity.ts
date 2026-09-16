// Small feature-vector math shared by classification and prediction.

export function zeros(dims: number): number[] {
  return new Array(dims).fill(0)
}

export function add(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + b[i])
}

export function subtract(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i])
}

export function scale(a: number[], k: number): number[] {
  return a.map((v) => v * k)
}

export function magnitude(a: number[]): number {
  return Math.sqrt(a.reduce((sum, v) => sum + v * v, 0))
}

export function clampVector01(a: number[]): number[] {
  return a.map((v) => Math.min(1, Math.max(0, v)))
}

/** Clamp a vector's magnitude to `maxMag`, preserving direction. */
export function clampMagnitude(a: number[], maxMag: number): number[] {
  const m = magnitude(a)
  if (m <= maxMag || m === 0) return a
  return scale(a, maxMag / m)
}

export function euclideanDistance(a: number[], b: number[]): number {
  return magnitude(subtract(a, b))
}

export function vectorMean(vectors: number[][], dims: number): number[] {
  if (vectors.length === 0) return zeros(dims)
  const sum = vectors.reduce((acc, v) => add(acc, v), zeros(dims))
  return scale(sum, 1 / vectors.length)
}

/** 0 (identical) .. 1 (maximally distant within a unit hypercube) similarity,
 * derived from euclidean distance rather than cosine — features are
 * magnitudes on comparable 0..1 scales, not directions. */
export function similarityFromDistance(distance: number, dims: number): number {
  const maxDistance = Math.sqrt(dims) // corner-to-corner of the unit hypercube
  return 1 - Math.min(1, distance / maxDistance)
}

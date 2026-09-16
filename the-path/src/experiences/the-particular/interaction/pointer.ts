export interface PointerTracker {
  x: number | null
  y: number | null
  lastMoveAt: number
}

export function createPointerTracker(now: number): PointerTracker {
  return { x: null, y: null, lastMoveAt: now }
}

export function updatePointer(tracker: PointerTracker, x: number, y: number, now: number) {
  tracker.x = x
  tracker.y = y
  tracker.lastMoveAt = now
}

export function idleMs(tracker: PointerTracker, now: number): number {
  return now - tracker.lastMoveAt
}

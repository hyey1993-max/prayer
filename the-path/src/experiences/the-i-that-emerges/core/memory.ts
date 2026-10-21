import type { MemoryEvent, MemoryKind, Phase } from '../models/types'

/** What happened in this session — what was repeated, when input stopped,
 * whether a meeting took place. It is never turned into a verdict about the
 * person; it only sets where the relation starts when the object returns. */
export interface Memory {
  events: MemoryEvent[]
  measurements: number
  clicks: number
  longestPauseMs: number
  waitMs: number
  stillSeconds: number
  pursuitSeconds: number
  meetings: number
  meetingMs: number
}

export function createMemory(): Memory {
  return {
    events: [],
    measurements: 0,
    clicks: 0,
    longestPauseMs: 0,
    waitMs: 0,
    stillSeconds: 0,
    pursuitSeconds: 0,
    meetings: 0,
    meetingMs: 0,
  }
}

export function remember(m: Memory, t: number, phase: Phase, kind: MemoryKind, value?: number) {
  m.events.push({ t, phase, kind, value })
  switch (kind) {
    case 'measure':
      m.measurements += 1
      break
    case 'click':
      m.clicks += 1
      break
    case 'pause':
      if (value !== undefined) m.longestPauseMs = Math.max(m.longestPauseMs, value)
      break
    case 'meet':
      m.meetings += 1
      break
    case 'part':
      if (value !== undefined) m.meetingMs += value
      break
    case 'phase':
      break
  }
}

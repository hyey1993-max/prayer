import { CONFIG } from '../config/constants'

export interface EncounterState {
  /** 0..1 — how turned-toward the object currently is. */
  openness: number
  aboveSince: number | null
  meeting: boolean
  meetingStart: number
  meetingDuration: number
  parted: boolean
  partedAt: number
  /** Eased 0..1 strength of the shared "between" — linked movement and threads. */
  coupling: number
  meetings: number
}

export function createEncounter(): EncounterState {
  return {
    openness: 0,
    aboveSince: null,
    meeting: false,
    meetingStart: 0,
    meetingDuration: 0,
    parted: false,
    partedAt: 0,
    coupling: 0,
    meetings: 0,
  }
}

export interface EncounterStep {
  met: boolean
  parted: boolean
}

/**
 * Openness rises with the person's presence multiplied by the object's own
 * readiness — neither alone is enough — and falls with pursuit. A meeting
 * begins once openness holds above threshold. It lasts as long as the object
 * stays turned toward the person on its own schedule (`ownMeetingMs`), and
 * ends early if the person grasps at it. It cannot be held.
 */
export function stepEncounter(
  enc: EncounterState,
  dtMs: number,
  now: number,
  presence: number,
  pursuit: number,
  readiness: number,
  ownMeetingMs: number,
): EncounterStep {
  const e = CONFIG.encounter
  const dt = dtMs / 1000
  const result: EncounterStep = { met: false, parted: false }

  if (enc.meeting) {
    const elapsed = now - enc.meetingStart
    const grasping = pursuit > 0.55
    if (elapsed >= enc.meetingDuration || grasping) {
      enc.meeting = false
      enc.parted = true
      enc.partedAt = now
      enc.openness *= 0.35
      enc.aboveSince = null
      result.parted = true
    } else {
      enc.openness = Math.min(1, enc.openness + dt * 0.1 * presence)
    }
  } else {
    const gain = e.openGain * presence * readiness
    const loss = e.pursuitLoss * pursuit + e.decay * enc.openness * (1 - presence)
    enc.openness = Math.min(1, Math.max(0, enc.openness + dt * (gain - loss)))

    if (enc.openness >= e.meetThreshold) {
      if (enc.aboveSince === null) enc.aboveSince = now
      if (now - enc.aboveSince >= e.meetHoldMs) {
        enc.meeting = true
        enc.meetingStart = now
        enc.meetingDuration = ownMeetingMs
        enc.meetings += 1
        result.met = true
      }
    } else {
      enc.aboveSince = null
    }
  }

  const couplingTarget = enc.meeting ? 1 : enc.openness * 0.25
  enc.coupling += (couplingTarget - enc.coupling) * Math.min(1, e.couplingEase * (dtMs / 16.7))
  return result
}

export function clickDuringEncounter(enc: EncounterState) {
  enc.openness = Math.max(0, enc.openness - CONFIG.encounter.clickLoss)
}

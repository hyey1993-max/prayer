import { useEffect, useReducer, useState } from 'react'
import { PARAMS } from './params'
import { Scene } from './scene/Scene'
import { createSession, sessionReducer } from './state/session'

export default function ThePathExperience() {
  const [state, dispatch] = useReducer(sessionReducer, undefined, () => createSession())
  const [showCaption, setShowCaption] = useState(false)
  const [showRestart, setShowRestart] = useState(false)

  useEffect(() => {
    if (state.phase !== 'retrospective') {
      setShowCaption((v) => (v ? false : v))
      setShowRestart((v) => (v ? false : v))
      return
    }

    const captionTimer = window.setTimeout(
      () => setShowCaption(true),
      PARAMS.text.captionDelayMs,
    )
    const restartTimer = window.setTimeout(
      () => setShowRestart(true),
      PARAMS.text.captionDelayMs + PARAMS.text.captionFadeInMs,
    )
    return () => {
      window.clearTimeout(captionTimer)
      window.clearTimeout(restartTimer)
    }
  }, [state.phase])

  return (
    <div className="the-path-root">
      <Scene key={state.graph.seed} state={state} dispatch={dispatch} />

      <div
        className="the-path-caption"
        style={{
          opacity: showCaption ? 1 : 0,
          transitionDuration: `${PARAMS.text.captionFadeInMs}ms`,
        }}
        aria-hidden={!showCaption}
      >
        {PARAMS.text.caption}
      </div>

      <button
        type="button"
        className="the-path-restart"
        style={{ opacity: showRestart ? 1 : 0, pointerEvents: showRestart ? 'auto' : 'none' }}
        onClick={() => dispatch({ type: 'RESTART' })}
        aria-label="Begin again"
      >
        ↺
      </button>
    </div>
  )
}

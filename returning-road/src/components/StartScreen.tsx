import { useEffect, useRef } from 'react'
import { ui } from '../content/ui'

interface Props {
  scriptureFirst: boolean
  onScriptureFirst: (on: boolean) => void
  canResume: boolean
  onStart: () => void
  onResume: () => void
}

export function StartScreen({ scriptureFirst, onScriptureFirst, canResume, onStart, onResume }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])

  return (
    <section className="screen start" aria-labelledby="start-title">
      <h1 id="start-title" className="start__title" ref={headingRef} tabIndex={-1}>
        {ui.title}
      </h1>
      <p className="start__subtitle">{ui.subtitle}</p>

      <p className="start__intro">{ui.intro}</p>

      <dl className="start__facts">
        <div>
          <dt className="sr-only">소요 시간</dt>
          <dd>{ui.duration}</dd>
        </div>
        <div>
          <dt className="sr-only">개인정보</dt>
          <dd>{ui.privacy}</dd>
        </div>
      </dl>

      <label className="toggle">
        <input
          type="checkbox"
          role="switch"
          checked={scriptureFirst}
          onChange={(e) => onScriptureFirst(e.target.checked)}
          aria-describedby="scripture-hint"
        />
        <span className="toggle__track" aria-hidden="true" />
        <span className="toggle__text">
          {ui.scriptureToggle}
          <span id="scripture-hint" className="toggle__hint">
            {ui.scriptureToggleHint}
          </span>
        </span>
      </label>

      <div className="actions actions--start">
        <button type="button" className="button button--primary" onClick={onStart}>
          {canResume ? ui.restart : ui.start}
        </button>
        {canResume && (
          <button type="button" className="button button--quiet" onClick={onResume}>
            {ui.resume}
          </button>
        )}
      </div>
    </section>
  )
}

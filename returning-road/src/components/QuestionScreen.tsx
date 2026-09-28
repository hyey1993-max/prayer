import { useEffect, useRef, useState } from 'react'
import type { Answers, Step } from '../content/types'
import { ui } from '../content/ui'
import { StationsInput } from './StationsInput'

interface Props {
  step: Step
  answers: Answers
  scriptureFirst: boolean
  onToggle: (optionId: string) => void
  onCustom: (text: string | undefined) => void
  onStations: (stations: string[]) => void
  onBack: () => void
  onNext: () => void
}

export function QuestionScreen({
  step,
  answers,
  scriptureFirst,
  onToggle,
  onCustom,
  onStations,
  onBack,
  onNext,
}: Props) {
  const selected = answers[step.key]
  const custom = answers.custom?.[step.key]
  const [writing, setWriting] = useState(custom !== undefined)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const customRef = useRef<HTMLInputElement>(null)

  // 걸음마다 새로 그려지므로(key), 처음 그려질 때 질문으로 포커스를 옮겨 스크린리더가 질문부터 읽게 한다
  useEffect(() => headingRef.current?.focus(), [])

  const hasAnswer = selected.length > 0 || Boolean(custom?.trim())
  const questionId = `q-${step.key}`

  return (
    <section className="screen question" aria-labelledby={questionId}>
      {scriptureFirst && (
        <blockquote className="verse">
          <p>{step.scene.quote}</p>
          <cite>{step.scene.ref}</cite>
        </blockquote>
      )}

      <h2 id={questionId} className="question__text" ref={headingRef} tabIndex={-1}>
        <span className="sr-only">일곱 걸음 중 {step.number}번째. </span>
        {step.question}
      </h2>
      {step.hint && <p className="question__hint">{step.hint}</p>}

      {step.collectsStations && (
        <StationsInput stations={answers.stations} onChange={onStations} />
      )}

      <fieldset className="choices">
        <legend className="choices__legend">{ui.multiHint}</legend>
        <ul>
          {step.options.map((o) => {
            const checked = selected.includes(o.id)
            return (
              <li key={o.id}>
                <label className={`choice${checked ? ' is-checked' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => onToggle(o.id)} />
                  <span className="choice__mark" aria-hidden="true" />
                  <span className="choice__label">{o.label}</span>
                </label>
              </li>
            )
          })}
          <li>
            <label className={`choice${writing ? ' is-checked' : ''}`}>
              <input
                type="checkbox"
                checked={writing}
                aria-controls={`${questionId}-own`}
                aria-expanded={writing}
                onChange={(e) => {
                  const on = e.target.checked
                  setWriting(on)
                  if (on) {
                    onCustom(custom ?? '')
                    requestAnimationFrame(() => customRef.current?.focus())
                  } else {
                    onCustom(undefined)
                  }
                }}
              />
              <span className="choice__mark" aria-hidden="true" />
              <span className="choice__label">{ui.writeOwn}</span>
            </label>
            {writing && (
              <div className="choice__own">
                <label htmlFor={`${questionId}-own`} className="sr-only">
                  {ui.writeOwn}
                </label>
                <input
                  id={`${questionId}-own`}
                  ref={customRef}
                  className="line-input"
                  value={custom ?? ''}
                  maxLength={80}
                  placeholder={ui.writeOwnPlaceholder}
                  onChange={(e) => onCustom(e.target.value)}
                />
              </div>
            )}
          </li>
        </ul>
      </fieldset>

      <div className="actions">
        <button type="button" className="button button--quiet" onClick={onBack}>
          {ui.back}
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={onNext}
          disabled={!hasAnswer}
        >
          {ui.next}
        </button>
      </div>
    </section>
  )
}

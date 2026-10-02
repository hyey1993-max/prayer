import { useEffect, useRef, useState } from 'react'
import type { Answers, Step } from '../content/types'
import { ui } from '../content/ui'
import { NextActions } from './NextActions'
import { Verse } from './Verse'

interface Props {
  step: Step
  answers: Answers
  scriptureFirst: boolean
  onToggle: (optionId: string) => void
  onCustom: (text: string | undefined) => void
  onBack: () => void
  onNext: () => void
}

export function QuestionScreen({ step, answers, scriptureFirst, onToggle, onCustom, onBack, onNext }: Props) {
  const selected = answers[step.key]
  const custom = answers.custom?.[step.key]
  // '직접 적기'가 켜져 있는지는 답에 custom 키가 있는지로 정한다. 뒤로 와도 그대로 남는다.
  const writing = custom !== undefined
  const [focusOwn, setFocusOwn] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const customRef = useRef<HTMLInputElement>(null)

  // 걸음마다 새로 그려지므로(key), 처음 그려질 때 질문으로 포커스를 옮겨 스크린리더가 질문부터 읽게 한다
  useEffect(() => headingRef.current?.focus(), [])
  useEffect(() => {
    if (focusOwn) {
      customRef.current?.focus()
      setFocusOwn(false)
    }
  }, [focusOwn])

  const ownEmpty = writing && !custom?.trim()
  const ready = (selected.length > 0 || writing) && !ownEmpty
  const reason = ownEmpty ? ui.needOwnText : ui.needChoice

  const questionId = `q-${step.key}`
  const stations = step.stations ? answers.stations.filter((s) => s.trim()) : []

  return (
    <section className="screen question" aria-labelledby={questionId}>
      {scriptureFirst && <Verse scene={step.scene} />}

      {stations.length > 0 && (
        <p className="stations-recap">
          <span className="sr-only">{ui.stationsRecap}: </span>
          {stations.map((s, i) => (
            <span key={`${s}-${i}`}>
              {i > 0 && <span className="stations-recap__sep" aria-hidden="true" />}
              <span className="stations-recap__name">{s}</span>
            </span>
          ))}
        </p>
      )}

      <h2 id={questionId} className="question__text" ref={headingRef} tabIndex={-1}>
        <span className="sr-only">
          {ui.stepLabel(step.number, step.stations ? '두 번째 화면' : undefined)}{' '}
        </span>
        {step.question}
      </h2>
      {step.hint && <p className="question__hint">{step.hint}</p>}

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
                  if (e.target.checked) {
                    onCustom(custom ?? '')
                    setFocusOwn(true)
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing && ready) {
                      e.preventDefault()
                      onNext()
                    }
                  }}
                />
              </div>
            )}
          </li>
        </ul>
      </fieldset>

      <NextActions ready={ready} reason={reason} onBack={onBack} onNext={onNext} />
    </section>
  )
}

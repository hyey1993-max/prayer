import { useEffect, useRef } from 'react'
import { MAX_STATIONS } from '../content/steps'
import type { Step } from '../content/types'
import { ui } from '../content/ui'
import { Verse } from './Verse'
import { NextActions } from './NextActions'

interface Props {
  step: Step
  stations: string[]
  scriptureFirst: boolean
  onChange: (stations: string[]) => void
  onBack: () => void
  onNext: () => void
}

/** 4-1: 거쳐온 곳을 순서대로 적는다. 적는 즉시 하단 길 위에 정거장으로 찍힌다. */
export function StationsScreen({ step, stations, scriptureFirst, onChange, onBack, onNext }: Props) {
  const copy = step.stations!
  const headingRef = useRef<HTMLHeadingElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  // 빈 칸 하나로 시작한다
  const rows = stations.length ? stations : ['']
  const filled = rows.filter((s) => s.trim()).length

  useEffect(() => headingRef.current?.focus(), [])

  const focusRow = (index: number, part: 'input' | 'up' | 'down' = 'input') => {
    requestAnimationFrame(() => {
      const row = listRef.current?.querySelector<HTMLElement>(`[data-row="${index}"]`)
      const target =
        row?.querySelector<HTMLButtonElement>(`[data-act="${part}"]:not(:disabled)`) ??
        row?.querySelector<HTMLInputElement>('input')
      target?.focus()
    })
  }

  const set = (index: number, value: string) => onChange(rows.map((s, i) => (i === index ? value : s)))
  const add = () => {
    if (rows.length >= MAX_STATIONS) return
    onChange([...rows, ''])
    focusRow(rows.length)
  }
  const remove = (index: number) => {
    const next = rows.filter((_, i) => i !== index)
    onChange(next)
    focusRow(Math.min(index, Math.max(0, next.length - 1)))
  }
  const move = (index: number, by: -1 | 1) => {
    const to = index + by
    if (to < 0 || to >= rows.length) return
    const next = [...rows]
    ;[next[index], next[to]] = [next[to], next[index]]
    onChange(next)
    focusRow(to, by < 0 ? 'up' : 'down')
  }

  return (
    <section className="screen question" aria-labelledby="q-stations">
      {scriptureFirst && <Verse scene={step.scene} />}

      <h2 id="q-stations" className="question__text" ref={headingRef} tabIndex={-1}>
        <span className="sr-only">일곱 걸음 중 {step.number}번째, 첫 화면. </span>
        {copy.question}
      </h2>
      {copy.hint && <p className="question__hint">{copy.hint}</p>}

      <ol className="stations" ref={listRef}>
        {rows.map((name, i) => (
          <li key={i} className="station" data-row={i}>
            <span className="station__number" aria-hidden="true">
              {i + 1}
            </span>
            <label htmlFor={`station-${i}`} className="sr-only">
              {ui.stationLabel(i + 1)}
            </label>
            <input
              id={`station-${i}`}
              className="line-input"
              value={name}
              maxLength={24}
              placeholder={i === 0 ? '처음 걸어온 곳' : '그다음 걸어온 곳'}
              onChange={(e) => set(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  if (i === rows.length - 1) add()
                  else focusRow(i + 1)
                }
              }}
            />
            <span className="station__tools">
              <button
                type="button"
                data-act="up"
                className="tool"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                aria-label={`${name || ui.stationLabel(i + 1)} ${ui.moveUp}`}
              >
                {ui.moveUp}
              </button>
              <button
                type="button"
                data-act="down"
                className="tool"
                disabled={i === rows.length - 1}
                onClick={() => move(i, 1)}
                aria-label={`${name || ui.stationLabel(i + 1)} ${ui.moveDown}`}
              >
                {ui.moveDown}
              </button>
              <button
                type="button"
                className="tool"
                disabled={rows.length === 1 && !name}
                onClick={() => remove(i)}
                aria-label={`${name || ui.stationLabel(i + 1)} ${ui.remove}`}
              >
                {ui.remove}
              </button>
            </span>
          </li>
        ))}
      </ol>

      {rows.length < MAX_STATIONS ? (
        <button type="button" className="button button--quiet stations__add" onClick={add}>
          {ui.addStation}
        </button>
      ) : (
        <p className="question__hint">{ui.stationsFull}</p>
      )}

      <NextActions
        ready={filled > 0}
        reason={ui.needStation}
        onBack={onBack}
        onNext={() => {
          // 빈 칸은 두고 가지 않는다
          onChange(rows.map((s) => s.trim()).filter(Boolean))
          onNext()
        }}
      />
    </section>
  )
}

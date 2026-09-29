import { useEffect, useMemo, useRef, useState } from 'react'
import { composeResult } from '../compose/composeResult'
import { pathText, resultUi, revealText } from '../content/result'
import { stepByKey, steps } from '../content/steps'
import type { Answers } from '../content/types'
import { ui } from '../content/ui'
import { ResultPath } from './ResultPath'

interface Props {
  answers: Answers
  scriptureFirst: boolean
  background: string
  onBack: () => void
  onRestart: () => void
  onClear: () => void
}

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'saved'; url: string } | { kind: 'failed' }

const today = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function ResultScreen({ answers, scriptureFirst, background, onBack, onRestart, onClear }: Props) {
  const paragraphs = useMemo(() => composeResult(answers), [answers])
  const headingRef = useRef<HTMLHeadingElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const [includeReveal, setIncludeReveal] = useState(false)
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const [confirming, setConfirming] = useState(false)
  const [cleared, setCleared] = useState(false)

  useEffect(() => headingRef.current?.focus(), [])

  const stations = answers.stations.map((s) => s.trim()).filter(Boolean)
  const companionOptions = stepByKey.companions.options
  const companions = [
    ...answers.companions.map((id) => {
      const o = companionOptions.find((x) => x.id === id)
      return o?.short ?? o?.label ?? ''
    }),
    ...(answers.custom?.companions?.trim() ? [answers.custom.companions.trim()] : []),
  ].filter(Boolean)

  const saveImage = async () => {
    const node = captureRef.current
    if (!node) return
    setSave({ kind: 'saving' })
    try {
      // 이미지 저장 라이브러리는 결과 화면에서 누를 때만 불러온다
      const { toBlob } = await import('html-to-image')
      const options = {
        backgroundColor: background,
        pixelRatio: 2,
        filter: (el: HTMLElement) => !(el.dataset && el.dataset.capture === 'skip'),
      }
      // 찍는 동안에만: 드러남 영역을 빼거나, 넣을 때는 화면에서의 긴 여백을 줄인다
      node.classList.add('is-capturing')
      if (!includeReveal) node.classList.add('without-reveal')
      let blob: Blob | null
      try {
        blob = await toBlob(node, options)
      } catch {
        // 폰트를 이미지에 싣지 못하면 폰트 없이라도 만든다
        blob = await toBlob(node, { ...options, skipFonts: true })
      } finally {
        node.classList.remove('is-capturing', 'without-reveal')
      }
      if (!blob) throw new Error('empty image')
      // data: 주소는 파일 이름이 무시되는 브라우저가 있어 blob: 주소로 내려받는다
      const url = URL.createObjectURL(blob)
      setSave({ kind: 'saved', url })
      const a = document.createElement('a')
      a.href = url
      a.download = resultUi.fileName(today())
      a.hidden = true
      document.body.append(a)
      a.click()
      a.remove()
    } catch {
      setSave({ kind: 'failed' })
    }
  }

  return (
    <section className="screen result" aria-labelledby="result-title">
      <div ref={captureRef} className="result__capture">
        <div className="result__letter">
          <h2 id="result-title" className="sr-only" ref={headingRef} tabIndex={-1}>
            다시 읽은 당신의 길
          </h2>
          {paragraphs.map((p) => (
            <div key={p.id} className="result__para">
              <p>{p.text}</p>
              {p.practices && p.practices.length > 0 && (
                <ul className="practices">
                  {p.practices.map((x) => (
                    <li key={x.intention}>
                      <span className="practices__intention">{x.intention}</span>
                      <span className="practices__action">{x.action}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <ResultPath stations={stations} companions={companions.length ? companions : [pathText.companionsFallback]} />

        <section className="reveal" aria-labelledby="reveal-title">
          <h3 id="reveal-title" className="reveal__lead">
            {scriptureFirst ? revealText.leadScripture : revealText.lead}
          </h3>
          <p className="reveal__body">{revealText.body}</p>
          <details className="reveal__list">
            <summary>{revealText.listToggle}</summary>
            <ol>
              {steps.map((s) => (
                <li key={s.key}>
                  <p className="reveal__question">{s.question}</p>
                  <blockquote>
                    <p>{s.scene.quote}</p>
                    <cite>{s.scene.ref}</cite>
                  </blockquote>
                  <p className="reveal__scene">{s.scene.scene}</p>
                </li>
              ))}
            </ol>
          </details>
        </section>
      </div>

      <div className="result__tools">
        <label className="check">
          <input type="checkbox" checked={includeReveal} onChange={(e) => setIncludeReveal(e.target.checked)} />
          <span className="choice__mark" aria-hidden="true" />
          <span>{resultUi.includeReveal}</span>
        </label>
        <button
          type="button"
          className="button button--primary"
          onClick={saveImage}
          aria-disabled={save.kind === 'saving'}
        >
          {resultUi.saveImage}
        </button>
        <p className="result__status" aria-live="polite">
          {save.kind === 'saving' && resultUi.saving}
          {save.kind === 'saved' && resultUi.saved}
          {save.kind === 'failed' && resultUi.saveFailed}
        </p>
        {save.kind === 'saved' && (
          <img className="result__preview" src={save.url} alt="저장할 결과 이미지" />
        )}

        <div className="result__end">
          {confirming ? (
            <div className="confirm" role="group" aria-labelledby="restart-q">
              <p id="restart-q">{resultUi.restartConfirm}</p>
              <div className="actions actions--start">
                <button type="button" className="button button--primary" onClick={onRestart}>
                  {resultUi.restartYes}
                </button>
                <button type="button" className="button button--quiet" onClick={() => setConfirming(false)}>
                  {resultUi.restartNo}
                </button>
              </div>
            </div>
          ) : (
            <div className="actions">
              <button type="button" className="button button--quiet" onClick={onBack}>
                {ui.back}
              </button>
              <span className="actions__group">
                <button
                  type="button"
                  className="button button--quiet"
                  onClick={() => {
                    onClear()
                    setCleared(true)
                  }}
                  aria-disabled={cleared}
                >
                  {resultUi.clear}
                </button>
                <button type="button" className="button button--primary" onClick={() => setConfirming(true)}>
                  {resultUi.restart}
                </button>
              </span>
            </div>
          )}
          <p className="result__status" aria-live="polite">
            {cleared && resultUi.cleared}
          </p>
        </div>
      </div>
    </section>
  )
}

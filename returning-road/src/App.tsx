import { useEffect, useMemo, useState } from 'react'
import { PathLine } from './components/PathLine'
import { QuestionScreen } from './components/QuestionScreen'
import { StartScreen } from './components/StartScreen'
import { steps } from './content/steps'
import { emptyAnswers, type Answers } from './content/types'
import { ui } from './content/ui'
import { skyAt } from './lib/sky'
import * as storage from './lib/storage'

/** 0 = 시작 화면, 1~7 = 질문, 8 = 결과 (아직 준비 중) */
type Screen = number
const RESULT = steps.length + 1

export default function App() {
  const saved = useMemo(() => storage.load(), [])
  const [screen, setScreen] = useState<Screen>(0)
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  const [scriptureFirst, setScriptureFirst] = useState(saved?.scriptureFirst ?? false)
  const [canResume, setCanResume] = useState(Boolean(saved && saved.step > 0))

  const step = screen >= 1 && screen <= steps.length ? steps[screen - 1] : undefined

  // 해가 기우는 길
  const dusk = screen === 0 ? 0 : step ? step.dusk : 1
  const sky = skyAt(dusk)
  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--bg', sky.bg)
    root.setProperty('--fg', sky.fg)
    root.setProperty('--muted', sky.muted)
    root.setProperty('--hairline', sky.hairline)
    document.documentElement.dataset.sky = sky.dark ? 'dark' : 'light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', sky.bg)
  }, [sky.bg, sky.fg, sky.muted, sky.hairline, sky.dark])

  useEffect(() => {
    if (screen > 0) storage.save({ step: screen, answers, scriptureFirst })
  }, [screen, answers, scriptureFirst])

  // 하단 길: 끝낸 걸음만큼, 그리고 지금 걸음에서 답을 고르면 반걸음 더
  const progress = useMemo(() => {
    if (screen === 0) return 0
    if (!step) return 1
    const current = answers[step.key].length > 0 || Boolean(answers.custom?.[step.key]?.trim())
    return (screen - 1 + (current ? 0.5 : 0)) / steps.length
  }, [screen, step, answers])

  const completed = Math.min(steps.length, Math.max(0, screen - 1))

  const start = () => {
    storage.clear()
    setAnswers(emptyAnswers())
    setCanResume(false)
    setScreen(1)
  }

  const resume = () => {
    if (!saved) return start()
    setAnswers({ ...emptyAnswers(), ...saved.answers })
    setScreen(Math.min(saved.step, RESULT))
  }

  const updateAnswers = (fn: (a: Answers) => Answers) => setAnswers((a) => fn(a))

  return (
    <>
      <main className="page">
        {screen === 0 && (
          <StartScreen
            scriptureFirst={scriptureFirst}
            onScriptureFirst={setScriptureFirst}
            canResume={canResume}
            onStart={start}
            onResume={resume}
          />
        )}

        {step && (
          <QuestionScreen
            key={step.key}
            step={step}
            answers={answers}
            scriptureFirst={scriptureFirst}
            onToggle={(id) =>
              updateAnswers((a) => ({
                ...a,
                [step.key]: a[step.key].includes(id)
                  ? a[step.key].filter((x) => x !== id)
                  : [...a[step.key], id],
              }))
            }
            onCustom={(text) =>
              updateAnswers((a) => {
                const custom = { ...a.custom }
                if (text === undefined) delete custom[step.key]
                else custom[step.key] = text
                return { ...a, custom }
              })
            }
            onStations={(stations) => updateAnswers((a) => ({ ...a, stations }))}
            onBack={() => setScreen((s) => s - 1)}
            onNext={() => setScreen((s) => s + 1)}
          />
        )}

        {screen === RESULT && (
          <section className="screen">
            <p className="question__text">{ui.notYet}</p>
            <div className="actions">
              <button type="button" className="button button--quiet" onClick={() => setScreen(steps.length)}>
                {ui.back}
              </button>
              <button type="button" className="button button--primary" onClick={start}>
                {ui.restart}
              </button>
            </div>
          </section>
        )}
      </main>

      <PathLine
        progress={progress}
        stations={answers.stations}
        label={ui.pathLabel(completed, steps.length)}
      />
    </>
  )
}

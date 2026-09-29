import { useEffect, useMemo, useState } from 'react'
import { PathLine } from './components/PathLine'
import { QuestionScreen } from './components/QuestionScreen'
import { ResultScreen } from './components/ResultScreen'
import { StartScreen } from './components/StartScreen'
import { StationsScreen } from './components/StationsScreen'
import { emptyAnswers, type Answers } from './content/types'
import { ui } from './content/ui'
import { duskOf, flow, QUESTION_SCREENS, RESULT_INDEX } from './flow'
import { skyAt } from './lib/sky'
import * as storage from './lib/storage'

function hasAnswer(answers: Answers, index: number): boolean {
  const screen = flow[index]
  if (screen.kind === 'stations') return answers.stations.some((s) => s.trim())
  if (screen.kind === 'choice') {
    const key = screen.step.key
    return answers[key].length > 0 || Boolean(answers.custom?.[key]?.trim())
  }
  return false
}

export default function App() {
  const saved = useMemo(() => storage.load(), [])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answers>(emptyAnswers)
  const [scriptureFirst, setScriptureFirst] = useState(saved?.scriptureFirst ?? false)
  const [canResume, setCanResume] = useState(Boolean(saved && saved.step > 0))
  // '답 지우기' 뒤에는 이 기기에 다시 저장하지 않는다
  const [persist, setPersist] = useState(true)

  const screen = flow[index]

  // 해가 기우는 길
  const sky = skyAt(duskOf(screen))
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
    if (persist && index > 0) storage.save({ step: index, answers, scriptureFirst })
  }, [persist, index, answers, scriptureFirst])

  // 하단 길: 끝낸 화면만큼, 그리고 지금 화면에서 답을 적거나 고르면 반걸음 더
  const progress =
    index === 0 ? 0 : index >= RESULT_INDEX ? 1 : (index - 1 + (hasAnswer(answers, index) ? 0.5 : 0)) / QUESTION_SCREENS

  // 스크린리더용: 끝낸 걸음 수 (4-1만 끝냈으면 아직 3걸음)
  const stepsDone =
    screen.kind === 'start' ? 0 : screen.kind === 'result' ? 7 : screen.step.number - 1

  const start = () => {
    storage.clear()
    setAnswers(emptyAnswers())
    setCanResume(false)
    setPersist(true)
    setIndex(1)
  }

  const resume = () => {
    if (!saved) return start()
    setPersist(true)
    setAnswers({ ...emptyAnswers(), ...saved.answers })
    setIndex(Math.min(Math.max(1, saved.step), RESULT_INDEX))
  }

  const back = () => setIndex((i) => Math.max(0, i - 1))
  const next = () => setIndex((i) => Math.min(RESULT_INDEX, i + 1))

  return (
    <>
      <main className={`page${screen.kind === 'result' ? ' page--result' : ''}`}>
        {screen.kind === 'start' && (
          <StartScreen
            scriptureFirst={scriptureFirst}
            onScriptureFirst={setScriptureFirst}
            canResume={canResume}
            onStart={start}
            onResume={resume}
          />
        )}

        {screen.kind === 'stations' && (
          <StationsScreen
            key={`stations-${screen.step.key}`}
            step={screen.step}
            stations={answers.stations}
            scriptureFirst={scriptureFirst}
            onChange={(stations) => setAnswers((a) => ({ ...a, stations }))}
            onBack={back}
            onNext={next}
          />
        )}

        {screen.kind === 'choice' && (
          <QuestionScreen
            key={screen.step.key}
            step={screen.step}
            answers={answers}
            scriptureFirst={scriptureFirst}
            onToggle={(id) => {
              const key = screen.step.key
              setAnswers((a) => ({
                ...a,
                [key]: a[key].includes(id) ? a[key].filter((x) => x !== id) : [...a[key], id],
              }))
            }}
            onCustom={(text) => {
              const key = screen.step.key
              setAnswers((a) => {
                const custom = { ...a.custom }
                if (text === undefined) delete custom[key]
                else custom[key] = text
                return { ...a, custom }
              })
            }}
            onBack={back}
            onNext={next}
          />
        )}

        {screen.kind === 'result' && (
          <ResultScreen
            answers={answers}
            scriptureFirst={scriptureFirst}
            background={sky.bg}
            onBack={back}
            onRestart={start}
            onClear={() => {
              setPersist(false)
              storage.clear()
              setCanResume(false)
            }}
          />
        )}
      </main>

      {/* 결과 화면에서는 이 길이 글 아래로 옮겨 가 되돌아가는 길이 된다 */}
      {screen.kind !== 'result' && (
        <PathLine
          progress={progress}
          stations={answers.stations.map((s) => s.trim()).filter(Boolean)}
          label={ui.pathLabel(stepsDone, 7)}
        />
      )}
    </>
  )
}

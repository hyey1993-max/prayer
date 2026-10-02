import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { pathText } from '../content/result'

interface Props {
  stations: string[]
  /** 6단계에서 고른 '함께 걷던 것'의 짧은 이름들 */
  companions: string[]
}

/*
 * 결과 화면의 유일한 연출.
 * 길 영역까지 스크롤하면 한 번만: 걸어온 길이 끝에서 처음 쪽으로 되감기듯 다시 그려지고(엠마오 → 예루살렘),
 * 그다음 나란히 걸어온 두 번째 옅은 선이 처음부터 있었던 것처럼 드러난다.
 * 탭하면 한 번 더. 모션 줄이기 설정이면 처음부터 마지막 모습으로 둔다.
 */

const HEIGHT = 150
const MAIN_Y = 58
const GAP = 26
const REWIND_MS = 2000

const road = (w: number, dy = 0) => {
  const x = (f: number) => (w * f).toFixed(1)
  const y = (v: number) => (v + dy).toFixed(1)
  return `M 0 ${y(MAIN_Y)} C ${x(0.24)} ${y(MAIN_Y - 8)}, ${x(0.4)} ${y(MAIN_Y + 8)}, ${x(0.59)} ${y(MAIN_Y - 2)} S ${x(0.88)} ${y(MAIN_Y - 8)}, ${x(1)} ${y(MAIN_Y - 4)}`
}

const spread = (i: number, n: number, from = 0.08, to = 0.92) => (n === 1 ? (from + to) / 2 : from + ((to - from) * i) / (n - 1))

type Phase = 'before' | 'rewinding' | 'revealed'

interface Point {
  x: number
  y: number
}

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function ResultPath({ stations, companions }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<SVGPathElement>(null)
  const walkedRef = useRef<SVGPathElement>(null)
  const walkerRef = useRef<HTMLSpanElement>(null)
  const frame = useRef(0)
  const [width, setWidth] = useState(0)
  const [phase, setPhase] = useState<Phase>(() => (reducedMotion() ? 'revealed' : 'before'))
  const [stops, setStops] = useState<Point[]>([])
  const [names, setNames] = useState<Point[]>([])
  const [end, setEnd] = useState<Point>({ x: 0, y: MAIN_Y })

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const measure = () => setWidth(box.clientWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const main = mainRef.current
    if (!main || !width) return
    const total = main.getTotalLength()
    const at = (t: number) => {
      const p = main.getPointAtLength(total * t)
      return { x: p.x, y: p.y }
    }
    setStops(stations.map((_, i) => at(spread(i, stations.length))))
    setNames(companions.map((_, i) => at(spread(i, companions.length, 0.14, 0.78))))
    setEnd(at(1))
  }, [width, stations, companions])

  const play = useCallback(() => {
    const main = mainRef.current
    const walked = walkedRef.current
    const walker = walkerRef.current
    if (!main || !walked || !walker) return
    if (reducedMotion()) {
      setPhase('revealed')
      return
    }
    cancelAnimationFrame(frame.current)
    const total = main.getTotalLength()
    // 되감기가 시작되면 걸어온 선을 지우고 끝에서부터 다시 그린다
    walked.style.strokeDasharray = `${total} ${total}`
    walked.style.strokeDashoffset = `${-total}`
    setPhase('rewinding')
    const started = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - started) / REWIND_MS)
      const eased = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2
      // 남은 길 t: 1(엠마오) → 0(예루살렘). 끝에서부터 t 지점까지 그려진다.
      const t = 1 - eased
      walked.style.strokeDasharray = `${total} ${total}`
      walked.style.strokeDashoffset = `${-t * total}`
      const p = main.getPointAtLength(total * t)
      walker.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`
      if (k < 1) frame.current = requestAnimationFrame(step)
      else {
        walked.style.strokeDasharray = 'none'
        setPhase('revealed')
      }
    }
    frame.current = requestAnimationFrame(step)
  }, [])

  // 길 영역까지 스크롤하면 한 번만
  useEffect(() => {
    const box = boxRef.current
    if (!box || phase !== 'before' || !width) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect()
          play()
        }
      },
      { threshold: 0.7 },
    )
    observer.observe(box)
    return () => observer.disconnect()
  }, [phase, width, play])

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const label = `${pathText.alt} ${pathText.companionsLabel}: ${companions.join(', ')}.`

  return (
    <figure className={`result-path is-${phase}`}>
      <div
        ref={boxRef}
        className="result-path__box"
        role="img"
        aria-label={label}
        onClick={() => phase !== 'rewinding' && play()}
      >
        <svg width={width} height={HEIGHT} aria-hidden="true">
          {/* 두 번째 선: 처음부터 거기 있었던 것처럼 */}
          <path className="result-path__companion" d={road(width, GAP)} />
          <path ref={mainRef} className="result-path__ahead" d={road(width)} />
          <path
            ref={walkedRef}
            className="result-path__walked"
            d={road(width)}
          />
        </svg>
        {stops.map((pt, i) => (
          <span
            key={`s-${i}`}
            className={`result-path__station${i % 2 ? ' is-high' : ''}${i === 0 ? ' is-first' : ''}${i === stops.length - 1 && i > 0 ? ' is-last' : ''}`}
            style={{ left: pt.x, top: pt.y }}
          >
            <span>{stations[i]}</span>
          </span>
        ))}
        {names.map((pt, i) => (
          <span key={`c-${i}`} className="result-path__name" style={{ left: pt.x, top: pt.y + GAP }}>
            {companions[i]}
          </span>
        ))}
        <span
          ref={walkerRef}
          className="result-path__walker"
          style={
            phase === 'rewinding'
              ? undefined
              : {
                  transform: `translate(${phase === 'revealed' ? 0 : end.x}px, ${phase === 'revealed' ? MAIN_Y : end.y}px) translate(-50%, -50%)`,
                }
          }
        />
      </div>
      <figcaption data-capture="skip">
        <button
          type="button"
          className="button button--quiet result-path__replay"
          onClick={play}
          disabled={phase === 'rewinding'}
        >
          {pathText.replay}
        </button>
      </figcaption>
    </figure>
  )
}

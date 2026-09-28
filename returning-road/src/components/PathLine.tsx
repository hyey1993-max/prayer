import { useLayoutEffect, useRef, useState } from 'react'

interface Props {
  /** 0 ~ 1: 지금까지 걸어온 만큼 */
  progress: number
  /** 4단계에서 입력한 정거장 이름들 */
  stations: string[]
  label: string
}

const HEIGHT = 64

/** 가로로 거의 곧은, 아주 완만한 길. 실제 픽셀 폭에 맞춰 그려 선 굵기와 점선이 늘어나지 않게 한다. */
const road = (w: number) => {
  const x = (f: number) => (w * f).toFixed(1)
  return `M 0 38 C ${x(0.24)} 30, ${x(0.4)} 46, ${x(0.59)} 36 S ${x(0.88)} 30, ${x(1)} 34`
}

// 정거장은 길 위 8% ~ 92% 구간에 순서대로 놓인다
const stationT = (i: number, n: number) => (n === 1 ? 0.5 : 0.08 + (0.84 * i) / (n - 1))

interface Point {
  x: number
  y: number
}

export function PathLine({ progress, stations, label }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const [width, setWidth] = useState(0)
  const [length, setLength] = useState(0)
  const [head, setHead] = useState<Point>({ x: 0, y: 38 })
  const [stops, setStops] = useState<Point[]>([])

  const p = Math.min(1, Math.max(0, progress))

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
    const path = pathRef.current
    if (!path || width === 0) return
    const total = path.getTotalLength()
    const at = (t: number) => {
      const pt = path.getPointAtLength(total * t)
      return { x: pt.x, y: pt.y }
    }
    setLength(total)
    setHead(at(p))
    setStops(stations.map((_, i) => at(stationT(i, stations.length))))
  }, [p, stations, width])

  const d = road(width)

  return (
    <div className="path" role="img" aria-label={label}>
      <div className="path__box" ref={boxRef}>
        <svg width={width} height={HEIGHT} aria-hidden="true">
          <path ref={pathRef} className="path__ahead" d={d} />
          {length > 0 && (
            <path
              className="path__walked"
              d={d}
              strokeDasharray={`${length} ${length}`}
              strokeDashoffset={length * (1 - p)}
            />
          )}
        </svg>
        {stops.map((pt, i) => (
          <span key={`${stations[i]}-${i}`} className={`path__station${i % 2 ? ' path__station--above' : ''}`} style={{ left: pt.x, top: pt.y }}>
            <span className="path__stationName">{stations[i]}</span>
          </span>
        ))}
        {length > 0 && (
          <span className="path__walker" style={{ left: head.x, top: head.y }} aria-hidden="true" />
        )}
      </div>
    </div>
  )
}

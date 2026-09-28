import { useState } from 'react'
import { MAX_STATIONS } from '../content/steps'

interface Props {
  stations: string[]
  onChange: (stations: string[]) => void
}

export function StationsInput({ stations, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const full = stations.length >= MAX_STATIONS

  const add = () => {
    const name = draft.trim()
    if (!name || full) return
    onChange([...stations, name])
    setDraft('')
  }

  return (
    <div className="stations">
      <ol className="stations__list" aria-label="걸어온 곳">
        {stations.map((s, i) => (
          <li key={`${s}-${i}`}>
            <span>{s}</span>
            <button
              type="button"
              className="stations__remove"
              onClick={() => onChange(stations.filter((_, j) => j !== i))}
              aria-label={`${s} 지우기`}
            >
              지우기
            </button>
          </li>
        ))}
      </ol>
      {!full && (
        <div className="stations__add">
          <label htmlFor="station-input" className="sr-only">
            {stations.length + 1}번째로 걸어온 곳
          </label>
          <input
            id="station-input"
            className="line-input"
            value={draft}
            maxLength={24}
            placeholder={stations.length ? '그다음 걸어온 곳' : '처음 걸어온 곳'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault()
                add()
              }
            }}
          />
          <button type="button" className="button button--quiet" onClick={add} disabled={!draft.trim()}>
            길에 놓기
          </button>
        </div>
      )}
    </div>
  )
}

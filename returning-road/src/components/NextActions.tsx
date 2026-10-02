import { useId } from 'react'
import { ui } from '../content/ui'

interface Props {
  ready: boolean
  /** 아직 넘어갈 수 없을 때, 무엇을 하면 되는지 한 줄 */
  reason: string
  onBack: () => void
  onNext: () => void
}

/**
 * 뒤로 / 이 답으로 걷기.
 * 넘어갈 수 없을 때도 버튼은 포커스를 받을 수 있게 두고(aria-disabled),
 * 그 이유를 버튼 아래 한 줄로 알려 스크린리더도 함께 읽게 한다.
 */
export function NextActions({ ready, reason, onBack, onNext }: Props) {
  const reasonId = useId()
  return (
    <div className="actions-wrap">
      <div className="actions">
        <button type="button" className="button button--quiet" onClick={onBack}>
          {ui.back}
        </button>
        <button
          type="button"
          className="button button--primary"
          aria-disabled={!ready}
          aria-describedby={ready ? undefined : reasonId}
          onClick={() => ready && onNext()}
        >
          {ui.next}
        </button>
      </div>
      <p id={reasonId} className="actions__reason" aria-live="polite">
        {ready ? '' : reason}
      </p>
    </div>
  )
}

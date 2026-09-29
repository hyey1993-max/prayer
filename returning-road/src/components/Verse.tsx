import type { Scene } from '../content/types'

/** '처음부터 말씀과 함께 걷기'를 켠 사람에게만, 질문 위에 작게 보이는 구절 */
export function Verse({ scene }: { scene: Scene }) {
  return (
    <blockquote className="verse">
      <p>{scene.quote}</p>
      <cite>{scene.ref}</cite>
    </blockquote>
  )
}

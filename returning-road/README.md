# 돌아오는 길

누가복음 24장 엠마오 이야기의 구조를 따라 자기 커리어를 돌아보는 일곱 걸음의 회고 테스트.
답은 서버로 가지 않고, 결과 글은 규칙 기반으로 기기 안에서 조합된다.

```bash
npm install
npm run dev     # 개발 서버
npm test        # composeResult 단위 테스트
npm run build   # 정적 빌드 (dist/)
```

## 구조

- `src/content/` — 문구는 모두 여기. 코드를 건드리지 않고 고칠 수 있다.
  - `steps.ts` 일곱 걸음의 질문·선택지·구절·배경 시간대(`dusk`)
  - `result.ts` 결과 글 문장 템플릿 (`{자리}` 뒤 조사는 자동으로 맞춰진다)
  - `ui.ts` 화면 고정 문구
- `src/compose/composeResult.ts` — 답 → 다섯 문단의 결과 글. 순수 함수.
- `src/lib/sky.ts` — 한낮 → 해질녘 → 저녁 배경색과 글자색 계산
- `src/components/PathLine.tsx` — 하단의 길 (진행 표시, 정거장)

## 진행 상황

- [x] 셋업, 콘텐츠 데이터, `composeResult` + 테스트
- [x] 시작 화면, 질문 화면(1~7 공용, 4단계 정거장 입력 포함), 배경 전환, 하단의 길
- [ ] 결과 화면 (되감기, 두 번째 선, 드러남 영역, 이미지 저장)

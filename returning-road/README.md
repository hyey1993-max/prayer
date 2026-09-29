# 돌아오는 길

누가복음 24장 엠마오 이야기의 구조를 따라 자기 커리어를 돌아보는 일곱 걸음의 회고 테스트.
답은 서버로 가지 않고, 결과 글은 규칙 기반으로 기기 안에서 조합된다.

```bash
npm install
npm run dev     # 개발 서버
npm test        # composeResult 단위 테스트
npm run build   # 정적 빌드 (dist/)
npm run build:artifact  # claude.ai 아티팩트용 빌드 (dist-artifact/, 폰트 파일 수를 줄인 판)
```

## 구조

- `src/content/` — 문구는 모두 여기. 코드를 건드리지 않고 고칠 수 있다.
  - `steps.ts` 일곱 걸음의 질문·선택지·구절·배경 시간대(`dusk`)
  - `result.ts` 결과 글 문장 템플릿 (`{자리}` 뒤 조사는 자동으로 맞춰진다)
  - `ui.ts` 화면 고정 문구
- `src/compose/composeResult.ts` — 답 → 다섯 문단의 결과 글. 순수 함수.
- `src/flow.ts` — 화면 순서 (4단계는 4-1 정거장 적기, 4-2 반복되던 것 고르기)
- `src/lib/sky.ts` — 한낮 → 해질녘 → 저녁 배경색과 글자색 계산. 모든 화면의 글자 대비가
  WCAG AA를 넘는지는 `sky.test.ts`가 검사한다. 배경 0.33~0.48 구간은 어떤 글자색도 AA를
  넘지 못하므로 `steps.ts`의 `dusk` 값은 이 구간을 피해야 한다.
- `src/components/PathLine.tsx` — 하단의 길 (진행 표시, 정거장)

## 진행 상황

- [x] 셋업, 콘텐츠 데이터, `composeResult` + 테스트
- [x] 시작 화면, 1단계, 배경 전환, 하단의 길
- [x] 질문 2~7, 4단계 두 화면(정거장 적기·순서 이동 / 반복되던 것), 넘어갈 수 없을 때 안내, 대비 검사
- [ ] 결과 화면 (되감기, 두 번째 선, 드러남 영역, 이미지 저장)

# The Principles of Tracé

공간에서 배운 15개의 원칙을 모은 정적 사이트. 빌드 도구 없이 HTML/CSS/JS만 쓴다.

- `index.html` — 첫 화면(태극 인터랙션) + 원칙 목록, `#law-01` 같은 해시로 상세 화면
- `data.js` — 원칙 데이터. **직접 고치지 말고** `python3 threshold/scripts/build_site.py`로 다시 만든다 (원문은 카드 데이터에서 그대로 가져온다)
- `media/` — 원칙별 모션 MP4 (1080×1350)

## Vercel 배포

1. vercel.com → Add New → Project → Import Git Repository → `hyey1993-max/prayer`
2. **Root Directory**를 `trace-site`로 지정
3. Framework Preset: **Other**, Build Command 비움, Output Directory 비움
4. Deploy

브랜치를 `main`에 합치기 전에도 Vercel에서 `claude/threshold-marketing-content-7zcvcs` 브랜치를 골라 미리보기 배포를 할 수 있다.

## 로컬에서 보기

```sh
cd trace-site && python3 -m http.server 8000
```

## Credit

- Site layout: inspired by John Maeda's [The Laws of Simplicity](http://lawsofsimplicity.com).
- Home and 02 Condense: glass cube interaction (`cube.js`, three.js r128 in `vendor/`, MIT). The earlier flow-field taegeuk (`taegeuk.js`, inspired by Tyler Hobbs) is no longer loaded.

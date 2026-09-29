# THE THRESHOLD 마케팅 콘텐츠

게시는 사람이 직접 붙여넣는다. 여기서는 텍스트만 만든다.

## 폴더

| 경로 | 내용 |
|---|---|
| `data/places.csv` | 장소 데이터. 좌표·시간대·거리·사진은 여기서만 읽는다 |
| `photos/` | `photo_file` 이름 그대로 넣는다 |
| `output/week1-2/threads_batch.md` | 1~2주차 스레드 14개 (감도 6 / 빌드 4 / 의견 4) |
| `output/week1-2/instagram_captions.md` | 인스타 캡션 5개 (스크립트 생성) |
| `output/week1-2/reels_scripts.md` | 릴스 스크립트 2개 (스크립트 생성) |
| `output/week1-2/notes.md` | 누락 데이터와 사람이 판단할 것 |
| `output/week4/` | 참여 이벤트 안내문 (스레드·인스타) + notes.md |
| `output/YYYY-MM-DD/` | 3주차부터 매일 생성되는 분량 |
| `content/threads_queue.md` | 3주차 이후 스레드 대기열 (빌드 일기 중심 10개) |
| `winners.md` | 스레드에서 반응 좋았던 문장. 인스타 캡션이 먼저 참고한다 |
| `used_places.json` / `used_threads.json` | 사용 기록 (중복 방지). 직접 고치지 않는다 |

## 사용법 (Python 3.9+, 설치할 것 없음)

```sh
cd threshold

# 1) data/places.csv를 채우고 사진을 photos/에 넣는다 (status=ready인 행만 사용)
# 2) 1~2주차 캡션 5개 + 릴스 2개
python3 scripts/threshold.py week12

# 3) 3주차부터 매일
python3 scripts/threshold.py daily                 # 오늘(서울 기준)
python3 scripts/threshold.py daily --dry-run       # 기록 없이 미리 보기
python3 scripts/threshold.py daily --date 2026-10-19 --threads 1
```

`daily`의 규칙:

- 스레드: 대기열에서 순서대로 하루 2개 (`--threads 1`로 1개). 대기열이 비면 notes.md에 알린다
- 인스타: 월·수·금. 수요일은 릴스 스크립트도 함께 만든다
- 같은 날짜로 다시 실행하면 같은 글·같은 장소가 나온다
- 캡션의 한 문장은 `winners.md`의 `[장소id]` 문장 → `narration_draft` 순으로 고른다.
  초안을 썼다면 "스레드에서 먼저 검증하라"고 notes.md에 남긴다
- 캡션에 검색어(예: 강남 조용한 카페, 혼자 가기 좋은 곳)가 없으면 notes.md에 남긴다.
  `hashtags` 칸에 `강남조용한카페 혼자가기좋은곳`처럼 넣거나 문장 안에 넣는다

## places.csv 예시 행

```
id,name,lat,lng,area,best_time,distance_note,hashtags,narration_draft,photo_file,status
p01,(장소명),37.4979,127.0276,강남,14:30-17:00,500m (강남역 기준),강남조용한카페,(한 문장),p01.jpg,ready
```

좌표는 CSV에 적은 자릿수 그대로 `37.4979° N 127.0276° E`로 출력된다.

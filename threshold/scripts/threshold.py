#!/usr/bin/env python3
"""Tracé 콘텐츠 생성기 (표준 라이브러리만 사용).

  python3 scripts/threshold.py week12            # 1~2주차 인스타 캡션 5개 + 릴스 스크립트 2개
  python3 scripts/threshold.py daily             # 오늘(서울 기준) 분량 → output/YYYY-MM-DD/
  python3 scripts/threshold.py daily --date 2026-10-13 --dry-run

원칙: 좌표·시간대·거리·사진은 data/places.csv 값만 쓴다. 비어 있으면 만들지 않고
`MISSING: <필드명>`으로 남기고 notes.md에 모은다.
"""
import argparse
import csv
import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parent.parent
PLACES_CSV = ROOT / "data" / "places.csv"
PHOTOS_DIR = ROOT / "photos"
OUTPUT_DIR = ROOT / "output"
USED_PLACES = ROOT / "used_places.json"
USED_THREADS = ROOT / "used_threads.json"
WINNERS = ROOT / "winners.md"
THREADS_QUEUE = ROOT / "content" / "threads_queue.md"

BASE_TAGS = ["#Trace", "#감도", "#디지털Zine"]
# 캡션마다 하나 이상 들어가야 하는 실제 검색어 (공백 무시하고 비교)
SEARCH_KEYWORDS = ["강남 조용한 카페", "혼자 가기 좋은 곳", "강남 카페", "강남역 카페",
                   "조용한 카페", "혼자 카페", "강남 산책", "작업하기 좋은 카페"]
INSTAGRAM_WEEKDAYS = {0, 2, 4}  # 월·수·금 (주 3회)
REELS_WEEKDAYS = {2}  # 수요일 게시물은 릴스
THREADS_PER_DAY = 2
THREAD_MAX_CHARS = 300
KST = ZoneInfo("Asia/Seoul")


# ---------- 데이터 읽기 ----------

def load_places():
    if not PLACES_CSV.exists():
        return []
    with PLACES_CSV.open(encoding="utf-8-sig", newline="") as f:
        rows = [{k.strip(): (v or "").strip() for k, v in row.items() if k} for row in csv.DictReader(f)]
    return [r for r in rows if r.get("status", "").lower() == "ready" and r.get("id")]


def load_json(path):
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8") or "[]")


def save_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def load_winners():
    """[(place_id or None, sentence)]"""
    if not WINNERS.exists():
        return []
    text = re.sub(r"<!--.*?-->", "", WINNERS.read_text(encoding="utf-8"), flags=re.S)
    winners = []
    for line in text.splitlines():
        m = re.match(r"^\s*[-*]\s+(?:\[([^\]]+)\]\s*)?(.+?)\s*$", line)
        if m:
            winners.append((m.group(1), m.group(2)))
    return winners


def load_thread_queue():
    """[(key, format, body)] — key는 본문 해시라 대기열 순서를 바꿔도 중복되지 않는다."""
    if not THREADS_QUEUE.exists():
        return []
    items = []
    for block in re.split(r"^---\s*$", THREADS_QUEUE.read_text(encoding="utf-8"), flags=re.M):
        m = re.search(r"^##\s+(.+?)\s*$\n(.+)", block.strip(), flags=re.M | re.S)
        if not m:
            continue
        body = m.group(2).strip()
        items.append((hashlib.sha1(body.encode()).hexdigest()[:10], m.group(1), body))
    return items


# ---------- 렌더링 ----------

def coord_line(place):
    lat, lng = place.get("lat", ""), place.get("lng", "")
    if not lat or not lng:
        missing = [n for n, v in (("lat", lat), ("lng", lng)) if not v]
        return " ".join(f"MISSING: {n}" for n in missing)
    try:
        lat_s = f"{lat.lstrip('-')}° {'S' if float(lat) < 0 else 'N'}"
        lng_s = f"{lng.lstrip('-')}° {'W' if float(lng) < 0 else 'E'}"
    except ValueError:
        return f"MISSING: lat/lng (숫자가 아님: {lat}, {lng})"
    return f"{lat_s} {lng_s}"  # CSV 자릿수 그대로, 반올림하지 않는다


def field(place, name):
    return place.get(name) or f"MISSING: {name}"


def place_hashtags(place):
    tags = list(BASE_TAGS)
    for raw in re.split(r"[\s,|]+", place.get("hashtags", "")):
        if not raw:
            continue
        tag = raw if raw.startswith("#") else f"#{raw}"
        if tag not in tags:
            tags.append(tag)
    return " ".join(tags)


def pick_narration(place, winners):
    for pid, sentence in winners:
        if pid == place["id"]:
            return sentence, "winner"
    if place.get("narration_draft"):
        return place["narration_draft"], "draft"
    return "MISSING: narration_draft", "missing"


def instagram_caption(place, winners):
    narration, source = pick_narration(place, winners)
    text = "\n".join([
        coord_line(place),
        f"시간: {field(place, 'best_time')}",
        f"거리: {field(place, 'distance_note')}",
        narration,
        "",
        place_hashtags(place),
    ])
    return text, source


def reels_script(place):
    coord = coord_line(place)
    time_ = f"시간: {field(place, 'best_time')}"
    dist = f"거리: {field(place, 'distance_note')}"
    photo = place.get("photo_file") or "MISSING: photo_file"
    return f"""릴스 30초 · {field(place, 'name')} ({place['id']})
참고 사진: photos/{photo}
오디오: 현장음만. 음악은 최소, 나래이션 없음.

[0-3초] 지도
화면: 검은 선 지도 전체 → 이 장소 점으로 천천히 줌인
자막: {coord}

[3-8초] 거리
화면: 기준 지점에서 장소 방향으로 걷는 시점 샷. 손떨림 없이, 일정한 속도
자막: {dist}

[8-15초] 입장
화면: 입구 정면 → 문을 열고 문턱을 넘는 한 컷 (끊지 않고)
자막: 없음

[15-25초] 내부
화면: 추천 시간대의 빛이 드는 자리 2~3컷, 컷당 3초 이상 고정
자막: {time_}

[25-30초] 지도+텍스트
화면: 다시 지도, 점 하나만 남기고 정지
자막: {coord}
텍스트: Tracé
"""


# ---------- 점검 ----------

def place_issues(place, narration_source, caption):
    issues = []
    label = f"{place.get('name') or place['id']} ({place['id']})"
    for name in ("name", "lat", "lng", "best_time", "distance_note", "photo_file"):
        if not place.get(name):
            issues.append(f"- [ ] {label}: MISSING: {name} — places.csv에 채워주세요")
    if narration_source == "missing":
        issues.append(f"- [ ] {label}: MISSING: narration_draft — 한 문장이 없습니다")
    elif narration_source == "draft":
        issues.append(f"- [ ] {label}: 한 문장이 스레드에서 아직 검증되지 않은 초안입니다. "
                      "스레드에 먼저 올리고 반응이 좋으면 winners.md에 `[{0}]`으로 기록하세요".format(place["id"]))
    photo = place.get("photo_file")
    if photo and not (PHOTOS_DIR / photo).exists():
        issues.append(f"- [ ] {label}: 사진 파일 없음 — photos/{photo}")
    flat = re.sub(r"\s", "", caption)
    if not any(re.sub(r"\s", "", k) in flat for k in SEARCH_KEYWORDS):
        issues.append(f"- [ ] {label}: 검색어가 캡션에 없습니다 (예: {', '.join(SEARCH_KEYWORDS[:3])}). "
                      "hashtags 또는 narration_draft에 넣어주세요")
    return issues


def unassigned_winner_notes(winners):
    loose = [s for pid, s in winners if not pid]
    if not loose:
        return []
    lines = ["", "## winners.md 후보 문장 (장소 미지정)",
             "캡션에 쓰려면 winners.md에서 앞에 `[장소id]`를 붙이세요.", ""]
    return lines + [f"- {s}" for s in loose]


def pick_places(places, used, key, count):
    """같은 key(날짜 또는 'week1-2')로 이미 뽑은 장소가 있으면 그대로 재사용한다."""
    by_id = {p["id"]: p for p in places}
    chosen = [by_id[u["id"]] for u in used if u.get("date") == key and u["id"] in by_id]
    taken = {u["id"] for u in used}
    for p in places:
        if len(chosen) >= count:
            break
        if p["id"] not in taken:
            chosen.append(p)
            taken.add(p["id"])
    return chosen[:count]


def record_places(used, places, key, kind):
    known = {(u["id"], u.get("date")) for u in used}
    for p in places:
        if (p["id"], key) not in known:
            used.append({"id": p["id"], "name": p.get("name", ""), "date": key, "type": kind})


# ---------- 명령 ----------

def cmd_week12(args):
    places = load_places()
    winners = load_winners()
    used = load_json(USED_PLACES)
    out = OUTPUT_DIR / "week1-2"

    caption_places = pick_places(places, used, "week1-2", 5)
    notes = ["# 1~2주차 확인 사항", ""]
    cap_md = ["# 인스타그램 캡션 (1~2주차, 5개)", "",
              "코드 블록 안의 텍스트를 그대로 붙여넣는다.", ""]
    for i, p in enumerate(caption_places, 1):
        text, source = instagram_caption(p, winners)
        cap_md += [f"## {i:02d} · {field(p, 'name')} ({p['id']})", "",
                   f"사진: photos/{p.get('photo_file') or 'MISSING: photo_file'}", "",
                   "```", text, "```", ""]
        notes += place_issues(p, source, text)
    if len(caption_places) < 5:
        short = 5 - len(caption_places)
        cap_md += [f"MISSING: ready 상태 장소 {short}곳 (places.csv)", ""]
        notes.append(f"- [ ] places.csv에 status=ready 장소가 {len(caption_places)}곳뿐입니다. "
                     f"캡션 {short}개를 만들지 못했습니다. 채운 뒤 `python3 scripts/threshold.py week12`를 다시 실행하세요")

    reels_places = caption_places[:2]  # 캡션과 같은 장소로 릴스를 찍어 첫 게시물과 맞춘다
    reels_md = ["# 릴스 스크립트 (1~2주차, 2개)", "",
                "자막은 좌표·시간대·거리만. 모든 값은 places.csv에서 읽었다.", ""]
    for i, p in enumerate(reels_places, 1):
        reels_md += [f"## {i:02d}", "", "```", reels_script(p).rstrip(), "```", ""]
    if len(reels_places) < 2:
        reels_md += [f"MISSING: ready 상태 장소 {2 - len(reels_places)}곳 (places.csv)", ""]

    notes += unassigned_winner_notes(winners)
    notes += ["", "## 사람이 판단할 것", "",
              "- [ ] 빌드 일기(01, 06, 09, 13)는 실제 진행 상황과 맞는지 확인하고, 다르면 사실대로 고쳐주세요",
              "- [ ] 스레드 01의 '강남 20곳부터'가 현재 계획과 맞는지 확인",
              "- [ ] 브리프 3장의 릴스 15초 포맷과 Task 3의 30초 구성이 다릅니다. 이번 스크립트는 30초 구성을 따랐습니다",
              "- [ ] 인스타 첫 게시물은 2주차에 winners.md에 모인 문장으로 교체한 뒤 다시 생성하는 것을 권장합니다"]

    if args.dry_run:
        print("\n".join(cap_md + ["", "=" * 40, ""] + reels_md + ["", "=" * 40, ""] + notes))
        return
    out.mkdir(parents=True, exist_ok=True)
    (out / "instagram_captions.md").write_text("\n".join(cap_md).rstrip() + "\n", encoding="utf-8")
    (out / "reels_scripts.md").write_text("\n".join(reels_md).rstrip() + "\n", encoding="utf-8")
    (out / "notes.md").write_text("\n".join(notes).rstrip() + "\n", encoding="utf-8")
    record_places(used, caption_places, "week1-2", "week1-2")
    save_json(USED_PLACES, used)
    print(f"week1-2: 캡션 {len(caption_places)}개, 릴스 {len(reels_places)}개 → {out}")


def cmd_daily(args):
    date = dt.date.fromisoformat(args.date) if args.date else dt.datetime.now(KST).date()
    key = date.isoformat()
    out = OUTPUT_DIR / key
    files = {}
    notes = [f"# {key} 확인 사항", ""]

    # 스레드: 대기열에서 순서대로, 같은 날짜 재실행 시 같은 글
    used_threads = load_json(USED_THREADS)
    queue = load_thread_queue()
    today_keys = [u["key"] for u in used_threads if u["date"] == key]
    done = {u["key"] for u in used_threads}
    picks = [q for q in queue if q[0] in today_keys]
    for q in queue:
        if len(picks) >= args.threads:
            break
        if q[0] not in done:
            picks.append(q)
    for i, (qkey, fmt, body) in enumerate(picks, 1):
        files[f"threads_{i:02d}.txt"] = body
        if len(body) > THREAD_MAX_CHARS:
            notes.append(f"- [ ] threads_{i:02d}.txt가 {len(body)}자입니다 ({THREAD_MAX_CHARS}자 이내 권장)")
        if re.search(r"#\S", body):
            notes.append(f"- [ ] threads_{i:02d}.txt에 해시태그가 있습니다. 스레드는 해시태그 없이 올립니다")
    if len(picks) < args.threads:
        notes.append(f"- [ ] 스레드 대기열이 비었습니다 ({len(picks)}/{args.threads}). content/threads_queue.md에 글을 추가하세요")

    # 인스타: 월·수·금, 수요일은 릴스
    used_places = load_json(USED_PLACES)
    ig_place = None
    if date.weekday() in INSTAGRAM_WEEKDAYS or args.force_instagram:
        winners = load_winners()
        chosen = pick_places(load_places(), used_places, key, 1)
        if chosen:
            ig_place = chosen[0]
            text, source = instagram_caption(ig_place, winners)
            files["instagram_caption.txt"] = text
            notes += place_issues(ig_place, source, text)
            if date.weekday() in REELS_WEEKDAYS:
                files["reels_script.txt"] = reels_script(ig_place)
            notes += unassigned_winner_notes(winners)
        else:
            notes.append("- [ ] 오늘은 인스타 게시일인데 쓸 수 있는 ready 장소가 없습니다 "
                         "(places.csv의 ready 장소를 모두 사용했거나 비어 있음)")
    else:
        notes.append("- 오늘은 인스타 게시일이 아닙니다 (월·수·금)")

    if len(notes) == 2:
        notes.append("- 확인할 항목 없음")

    if args.dry_run:
        for name, body in files.items():
            print(f"===== {name} =====\n{body.rstrip()}\n")
        print("===== notes.md =====\n" + "\n".join(notes))
        return
    out.mkdir(parents=True, exist_ok=True)
    for name, body in files.items():
        (out / name).write_text(body.rstrip() + "\n", encoding="utf-8")
    (out / "notes.md").write_text("\n".join(notes).rstrip() + "\n", encoding="utf-8")
    for qkey, fmt, _ in picks:
        if qkey not in today_keys:
            used_threads.append({"key": qkey, "format": fmt, "date": key})
    save_json(USED_THREADS, used_threads)
    if ig_place:
        record_places(used_places, [ig_place], key, "reels" if "reels_script.txt" in files else "instagram")
        save_json(USED_PLACES, used_places)
    print(f"{key}: {', '.join(files) or '생성된 게시물 없음'} + notes.md → {out}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = parser.add_subparsers(dest="cmd", required=True)
    w = sub.add_parser("week12", help="1~2주차 인스타 캡션 5개 + 릴스 2개")
    w.add_argument("--dry-run", action="store_true", help="파일을 쓰지 않고 출력만")
    d = sub.add_parser("daily", help="하루 분량 생성")
    d.add_argument("--date", help="YYYY-MM-DD (기본: 오늘, 서울 기준)")
    d.add_argument("--threads", type=int, default=THREADS_PER_DAY, choices=[1, 2])
    d.add_argument("--force-instagram", action="store_true", help="게시일이 아니어도 인스타 캡션 생성")
    d.add_argument("--dry-run", action="store_true", help="파일·기록을 쓰지 않고 출력만")
    args = parser.parse_args()
    {"week12": cmd_week12, "daily": cmd_daily}[args.cmd](args)


if __name__ == "__main__":
    main()

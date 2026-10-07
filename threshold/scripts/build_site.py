#!/usr/bin/env python3
"""trace-site/data.js 와 media/ 를 만든다. 원문은 카드 데이터(series.json)에서 그대로 가져온다.
  python3 threshold/scripts/build_site.py
"""
import json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # threshold/
SITE = ROOT.parent / "trace-site"
ux = json.loads((ROOT / "content/essay_seoul_tokyo/series.json").read_text(encoding="utf-8"))["sets"]["series2_apply"]["cards"]
ch1 = json.loads((ROOT / "content/essay_ch1_walk/series.json").read_text(encoding="utf-8"))["sets"]["ch1_walk"]["cards"]
man = json.loads((ROOT / "content/manifesto/series.json").read_text(encoding="utf-8"))["sets"]
defs = {it["en"]: it for s in man.values() for c in s["cards"] for it in c["items"]}
T = lambda cards, *idx: [cards[i]["t"] for i in idx]

SRC_UX = {"title": "The Essence of Spatial Design", "url": "https://medium.com/@hyey1993/%EC%84%9C%EC%9A%B8%EA%B3%BC-%EB%8F%84%EC%BF%84%EC%9D%98-%EC%A7%80%EC%97%AD-%EA%B0%9C%EB%B0%9C%EC%9D%98-%EB%B0%A9%EC%8B%9D%EC%97%90%EC%84%9C-%EB%B3%B4%EB%8A%94-%EA%B3%B5%EA%B0%84-%EC%84%A4%EA%B3%84-474cee0b79f9"}
SRC_WALK = {"title": "Tracé Story · Chapter 1", "url": "https://medium.com/@hyey1993/trac%C3%A9-story-chapter-1-%EC%99%9C-%EC%9A%B0%EB%A6%AC%EB%8A%94-%EB%95%8C%EB%A1%9C-%EB%AA%A9%EC%A0%81%EC%A7%80-%EC%97%86%EB%8A%94-%EA%B8%B8%EC%9D%84-%EA%B1%B8%EC%96%B4%EC%95%BC-%ED%95%98%EB%8A%94%EA%B0%80-a32f9595d1ab"}

groups = [
  {"key": "ux", "name": "UX", "title": "화면 위의 건축", "intro": T(ux, 1, 2), "source": SRC_UX, "laws": [
    ("Human Scale", T(ux, 7)), ("Condense", T(ux, 8)), ("Flow", T(ux, 9)), ("Sequence", T(ux, 10)),
    ("Low Threshold", T(ux, 4, 5, 11)), ("Participation", T(ux, 13, 14, 15))], "outro": T(ux, 16)},
  {"key": "walk", "name": "WALK", "title": "목적지 없는 걸음", "intro": T(ch1, 1), "source": SRC_WALK, "laws": [
    ("No Destination", T(ch1, 4, 5, 6)), ("Inner Map", T(ch1, 8, 9)), ("Own Rhythm", T(ch1, 11, 12)), ("Aura", T(ch1, 14, 15))], "outro": []},
  {"key": "map", "name": "MAP", "title": "지도의 약속", "intro": [], "source": None, "laws": [
    ("No Ratings", []), ("No Algorithm", []), ("Context", []), ("Black Line", [])], "outro": []},
]
media = sorted((ROOT / "content/motion/mp4").glob("[01][0-9]_*.mp4"))
laws, n = [], 0
for g in groups:
    for en, original in g["laws"]:
        n += 1; d = defs[en]; src = media[n - 1]
        shutil.copy(src, SITE / "media" / src.name)
        laws.append({"no": n, "group": g["key"], "en": en, "ko": d["h"], "def": d["t"], "original": original, "video": f"media/{src.name}"})
data = {"groups": [{k: g[k] for k in ("key", "name", "title", "intro", "source", "outro")} for g in groups], "laws": laws,
        "closing": T(ch1, 16)}
(SITE / "data.js").write_text("window.TRACE = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print(len(laws), "laws ->", SITE)

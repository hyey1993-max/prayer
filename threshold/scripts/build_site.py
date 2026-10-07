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
# 존 마에다의 Laws of Simplicity처럼: 원칙 이름 + 영어 한 문장(law), 그리고 영어 정의(def_en). 한국어 정의(def)를 옮긴 것.
EN = {
  "Human Scale": ("Don't line users up. Give them back a human scale.",
    "No flashy pop-ups, no uniform rankings that line users up. Restore a human scale where people never get lost on the screen and keep their own agency."),
  "Condense": ("Don't list. Condense what matters into the frame.",
    "A mobile screen is a rectangular frame that demands condensation. Instead of listing information, distill its essential value and sensibility into something dense."),
  "Flow": ("A condensed screen still lets the eye and the path flow.",
    "Even on a condensed screen, the experience is never confined. Like the taegeuk, the eye and the path flow freely across the interface."),
  "Sequence": ("Lay down a sequence to explore, not a funnel to push through.",
    "Not a linear funnel that pushes users toward conversion, but a sequence of paths where they can explore and reflect on their own."),
  "Low Threshold": ("Keep the threshold low enough to enter at your own tempo.",
    "Navigation with a low threshold, so anyone can stay, talk and move at their own tempo, at any time."),
  "Participation": ("Don't finish the screen. Build it together.",
    "A screen is not a product stamped out at once but a process that grows with its users. With participation, a screen becomes a place."),
  "No Destination": ("Erase the destination, and observation begins.",
    "The moment you erase the destination, real observation begins. Instead of how far or how fast you went, ask how often you stopped."),
  "Inner Map": ("Measure your own depth instead of chasing the world's speed.",
    "Measure your inner depth instead of chasing the speed of the world. Refusing the shortest route is not wandering."),
  "Own Rhythm": ("Walk to the drum you hear, not to someone else's beat.",
    "You don't have to match anyone else's step. Each quiet step becomes an irreplaceable archive."),
  "Aura": ("Record the presence of a moment only you can see.",
    "This angle, this hour's light, the stillness of this spot: only you see them. Record that presence."),
  "No Ratings": ("No stars, no review counts. One sentence on why this place.",
    "No star ratings or review counts. Instead, a single sentence on why this place."),
  "No Algorithm": ("No algorithm decides. One person's sensibility chooses.",
    "Instead of recommendations that push the most-saved places back to the top, only places one person chose with their own sensibility."),
  "Context": ("Leave the context: the place, the hour, the distance, the reason.",
    "Coordinates, the best hour to go, the distance from a landmark. And the reason this place was chosen."),
  "Black Line": ("Draw how you walked, not just where you went.",
    "A map that shows how you walked rather than where you went. The trail of your own pace, not someone else's orbit."),
}
GROUP_EN = {"ux": "Architecture on the Screen", "walk": "Walking Without a Destination", "map": "The Promise of the Map"}
# 인스타용으로 만든 모션을 관련 원칙 상세에 함께 둔다 (파일, 설명)
EXTRA = {
  "Flow": [("15_taegeuk_yin_yang_web.mp4", "Yin and yang · the taegeuk interaction")],
  "No Destination": [("16_story_labyrinth_vs_maze.mp4", "Labyrinth vs maze · Tracé Story, Chapter 2")],
}
media = sorted((ROOT / "content/motion/mp4").glob("[01][0-9]_*.mp4"))[:14]
laws, n = [], 0
for g in groups:
    for en, original in g["laws"]:
        n += 1; d = defs[en]; src = media[n - 1]
        shutil.copy(src, SITE / "media" / src.name)
        extra = []
        for f, cap in EXTRA.get(en, []):
            shutil.copy(ROOT / "content/motion/mp4" / f, SITE / "media" / f); extra.append({"video": f"media/{f}", "caption": cap})
        laws.append({"no": n, "group": g["key"], "en": en, "law": EN[en][0], "def_en": EN[en][1], "ko": d["h"], "def": d["t"],
                     "original": original, "video": f"media/{src.name}", "extra": extra})
data = {"groups": [{**{k: g[k] for k in ("key", "name", "title", "intro", "source", "outro")}, "title_en": GROUP_EN[g["key"]]} for g in groups], "laws": laws,
        # 'Tracé의 제안'(Ch.1 원문)을 영어로 옮긴 문장
        "closing": ["Rather than pointing to a destination someone else has chosen, the quiet record of discovering the aura of your own life should go on.",
                    "The black-line trails that the map service Tracé proposes record the practice of flâneurs who step out of other people's orbits and think through the city at their own pace."]}
(SITE / "data.js").write_text("window.TRACE = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print(len(laws), "laws ->", SITE)

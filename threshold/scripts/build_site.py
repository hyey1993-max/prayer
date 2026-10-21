#!/usr/bin/env python3
"""trace-site/data.js 와 media/ 를 만든다. 원문은 카드 데이터(series.json)에서 그대로 가져온다.
  python3 threshold/scripts/build_site.py
"""
import json, shutil, subprocess
import imageio_ffmpeg
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent          # threshold/
SITE = ROOT.parent / "trace-site"
ux = json.loads((ROOT / "content/essay_seoul_tokyo/series.json").read_text(encoding="utf-8"))["sets"]["series2_apply"]["cards"]
ch1 = json.loads((ROOT / "content/essay_ch1_walk/series.json").read_text(encoding="utf-8"))["sets"]["ch1_walk"]["cards"]
ch2 = json.loads((ROOT / "content/essay_ch2_labyrinth/series.json").read_text(encoding="utf-8"))["sets"]["ch2_labyrinth"]["cards"]
man = json.loads((ROOT / "content/manifesto/series.json").read_text(encoding="utf-8"))["sets"]
defs = {it["en"]: it for s in man.values() for c in s["cards"] for it in c["items"]}
# 선언문 카드에 없는 원칙 (Tracé Story Ch.2에서 나온 것)
defs["Labyrinth"] = {"h": "미로가 아니라 라비린스",
  "t": "갈림길마다 고르며 불안해하는 미로는 우리의 의식이 만든 것이다. 통제의 손을 내려놓으면 길은 하나가 되고, 발걸음은 이미 준비된 장소에 닿는다."}
# 반복의 역설 (Tracé Notes · 반복과 진전에서 나온 원칙)
defs["Defamiliarize"] = {"h": "반복 속에서 낯설게 한다",
  "t": "반복으로 리텐션을 요구하지 않는다. 펜로즈의 계단처럼 같은 패턴 안에 낯선 순간을 두어, 사용자가 자기 반복에서 새로움을 발견하며 배우게 한다."}
LOOP_ORIGINAL = [
  "펜로즈의 계단은 한 칸 한 칸은 정상인데, 이어 붙이면 계속 올라가도 같은 자리로 돌아온다. 오늘날 많은 디지털 서비스가 이 계단을 닮았다. 콘텐츠를 보여주고, 반응과 스와이프와 체류를 관찰하고, 추천을 고쳐 다시 보여준다. 이 순환에서 시스템이 최적화하는 것은 행동 패턴을 예측하고 참여를 이어가는 일이다. 반복은 정교하게 설계되지만, 그 반복이 사용자에게 무엇을 일으키는지는 충분히 묻지 않는다.",
  "반복을 다르게 설계할 수도 있다. 콘텐츠를 경험하고, 이전 경험과의 관계가 달라지고, 새로운 해석과 질문이 생기고, 다음 경험을 바라보는 방식이 바뀐다. 두 구조가 서로 배타적인 것은 아니다. 릴스도 새로운 관점을 줄 수 있고, 학습 서비스도 참여를 이어가려고 반복을 쓴다. 차이는 반복으로 무엇을 최적화하고, 무엇이 변하기를 기대하느냐에 있다.",
  "들뢰즈의 《차이와 반복》에서 반복은 같은 것의 재생산에 그치지 않는다. 이것을 학습 이론으로 줄일 수는 없지만, 배움을 이렇게 읽을 수는 있다. 정해진 답을 더 빠르고 정확하게 재현하는 일만이 아니라, 어떤 문제와 마주하며 전에는 몰랐던 관계를 감각하고 다르게 생각하게 되는 과정이라고.",
  "같은 주제의 영상을 열 번 본다고 하자. 열 번 모두 같은 관점으로 소비하며 익숙함만 강해질 수 있다. 열 번째에서 이전 영상들과의 모순을 발견할 수도 있다. 그 모순 때문에 자기 관점을 고치거나, 전혀 다른 질문을 만들 수도 있다. 반복은 같았지만 결과는 다르다. 중요한 것은 정보를 하나 더 얻었다는 사실보다, 이전에는 없던 문제가 보이기 시작했다는 점이다.",
  "그래서 시스템은 반복을 통한 리텐션을 계속 요구하지 않는다. 그렇다고 반복을 줄이자는 것도 아니다. 반복되는 패턴 안에 낯설게 하는 순간을 두어, 사용자가 자신의 반복에서 새로움을 발견하게 한다. 펜로즈의 계단이 같은 길을 다시 걷게 하면서도, 어느 순간 그 길이 불가능한 구조였음을 보게 만들듯이. 반복은 행동을 길들이는 장치가 아니라, 사용자가 배우는 자리가 된다.",
  "그러려면 묻는 것도 달라져야 한다. 얼마나 오래 머물렀는가 대신, 무엇을 새롭게 발견했는가. 얼마나 자주 돌아왔는가 대신, 이전 경험과 다른 관계를 맺었는가. 추천을 클릭했는가 대신, 예상 밖의 관심이나 질문이 생겼는가. 같은 행동을 반복했는가 대신, 경험 뒤에 행동이나 해석이 달라졌는가. 이것은 이미 검증된 지표가 아니라 연구로 정의해 가야 할 질문이다. 체류시간 같은 행동 로그만으로는 알기 어렵고, 인터뷰와 사용자의 기록, 경험 전후의 해석을 견주는 방법이 필요하다.",
  "디지털 UX는 반복되는 행동을 어떻게 유지할 것인가에 집중해 왔다. 이제는 반복되는 경험이 사용자를 어떻게 변화시키는지도 물어야 한다.",
]
SRC_CH2 = {"title": "Tracé Story · Chapter 2", "url": None}
SRC_NOTES = {"title": "Tracé Notes · 반복과 진전", "url": None}
LAW_SRC = {"Labyrinth": SRC_CH2, "Defamiliarize": SRC_NOTES}
T = lambda cards, *idx: [cards[i]["t"] for i in idx]

SRC_UX = {"title": "The Essence of Spatial Design", "url": "https://medium.com/@hyey1993/%EC%84%9C%EC%9A%B8%EA%B3%BC-%EB%8F%84%EC%BF%84%EC%9D%98-%EC%A7%80%EC%97%AD-%EA%B0%9C%EB%B0%9C%EC%9D%98-%EB%B0%A9%EC%8B%9D%EC%97%90%EC%84%9C-%EB%B3%B4%EB%8A%94-%EA%B3%B5%EA%B0%84-%EC%84%A4%EA%B3%84-474cee0b79f9"}
SRC_WALK = {"title": "Tracé Story · Chapter 1", "url": "https://medium.com/@hyey1993/trac%C3%A9-story-chapter-1-%EC%99%9C-%EC%9A%B0%EB%A6%AC%EB%8A%94-%EB%95%8C%EB%A1%9C-%EB%AA%A9%EC%A0%81%EC%A7%80-%EC%97%86%EB%8A%94-%EA%B8%B8%EC%9D%84-%EA%B1%B8%EC%96%B4%EC%95%BC-%ED%95%98%EB%8A%94%EA%B0%80-a32f9595d1ab"}

groups = [
  {"key": "ux", "name": "UX", "title": "화면 위의 건축", "intro": T(ux, 1, 2), "source": SRC_UX, "laws": [
    # Human Scale 원문 문장은 사이트에서 뺐다 (인스타 2편 08장에는 그대로)
    ("Human Scale", []), ("Condense", T(ux, 8)), ("Flow", T(ux, 9)), ("Sequence", T(ux, 10)),
    ("Low Threshold", T(ux, 4, 5, 11)), ("Participation", T(ux, 13, 14, 15))], "outro": T(ux, 16)},
  {"key": "walk", "name": "WALK", "title": "목적지 없는 걸음", "intro": T(ch1, 1), "source": SRC_WALK, "laws": [
    ("No Destination", T(ch1, 4, 5, 6)), ("Inner Map", T(ch1, 8, 9)), ("Own Rhythm", T(ch1, 11, 12)), ("Aura", T(ch1, 14, 15)),
    ("Labyrinth", T(ch2, 3, 9, 12))], "outro": []},
  {"key": "map", "name": "MAP", "title": "지도의 약속", "intro": [], "source": None, "laws": [
    ("No Ratings", []), ("No Algorithm", []), ("Context", []), ("Black Line", [])], "outro": []},
  {"key": "loop", "name": "LOOP", "title": "반복의 역설", "intro": [], "source": SRC_NOTES, "laws": [
    ("Defamiliarize", LOOP_ORIGINAL)], "outro": []},
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
  "Labyrinth": ("Walk a labyrinth, not a maze.",
    "A maze, where every fork demands an anxious choice, is made by our own mind. Let go of control and the path becomes one, leading your steps to the place already prepared for them."),
  "Defamiliarize": ("Don't demand repetition. Let users find something new in what they repeat.",
    "Instead of asking for retention through repetition, place a moment of strangeness inside the familiar pattern, like the Penrose stairs, so users learn by discovering something new in their own repetition."),
  "Black Line": ("Draw how you walked, not just where you went.",
    "A map that shows how you walked rather than where you went. The trail of your own pace, not someone else's orbit."),
}
GROUP_EN = {"ux": "Architecture on the Screen", "walk": "Walking Without a Destination", "map": "The Promise of the Map", "loop": "The Paradox of Repetition"}
# 인스타용으로 만든 모션을 관련 원칙 상세에 함께 둔다 (파일, 설명)
EXTRA = {
  "Flow": [("15_taegeuk_yin_yang_web.mp4", "Yin and yang · the taegeuk interaction")],
  "Labyrinth": [("16_story_labyrinth_vs_maze.mp4", "Labyrinth vs maze · Tracé Story, Chapter 2")],
}
FF = imageio_ffmpeg.get_ffmpeg_exe()
(SITE / "media" / "posters").mkdir(parents=True, exist_ok=True)
def poster(mp4):
    """영상이 재생되지 않을 때(아이폰 저전력 모드 등) 보이는 정지 화면"""
    out = SITE / "media" / "posters" / (Path(mp4).stem + ".jpg")
    subprocess.run([FF, "-y", "-loglevel", "error", "-ss", "3", "-i", str(mp4), "-frames:v", "1", "-vf", "scale=720:-2", "-q:v", "4", str(out)], check=True)
    return f"media/posters/{out.name}"
media = sorted((ROOT / "content/motion/mp4_site").glob("[01][0-9]_*.mp4"))   # 사이트용: 영어 한 문장 + 한글 원칙 (LAW_EN=trace-site/data.js 로 capture_motion.js)
laws, n = [], 0
for g in groups:
    for en, original in g["laws"]:
        n += 1; d = defs[en]; src = media[n - 1]
        shutil.copy(src, SITE / "media" / src.name)
        extra = []
        for f, cap in EXTRA.get(en, []):
            shutil.copy(ROOT / "content/motion/mp4" / f, SITE / "media" / f)
            extra.append({"video": f"media/{f}", "poster": poster(SITE / "media" / f), "caption": cap})
        laws.append({"no": n, "group": g["key"], "en": en, "law": EN[en][0], "def_en": EN[en][1], "ko": d["h"], "def": d["t"],
                     "original": original, "video": f"media/{src.name}", "poster": poster(src), "extra": extra,
                     "source": LAW_SRC.get(en)})
data = {"groups": [{**{k: g[k] for k in ("key", "name", "title", "intro", "source", "outro")}, "title_en": GROUP_EN[g["key"]]} for g in groups], "laws": laws,
        # 'Tracé의 제안'(Ch.1 원문)을 영어로 옮긴 문장
        "closing": ["Rather than pointing to a destination someone else has chosen, the quiet record of discovering the aura of your own life should go on.",
                    "The black-line trails that the map service Tracé proposes record the practice of flâneurs who step out of other people's orbits and think through the city at their own pace."]}
(SITE / "data.js").write_text("window.TRACE = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print(len(laws), "laws ->", SITE)

#!/usr/bin/env python3
"""Dimensions of Tracé: 16개 원칙을 구·축·궤도·평면·반구로 그린 한 장 (1080×1350, 영어 + 한글).
  python3 scripts/render_dimensions.py  → content/dimensions/dimensions.jpg, dimensions.html
"""
import base64, glob, math, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "content" / "dimensions"
F = ROOT / "assets" / "fonts"
b64 = lambda f: base64.b64encode((F / f).read_bytes()).decode()
INK, BG, DIM = "#8a7650", "#f6f1e6", "#8a765099"
W, H, CX, CY, R = 1080, 1350, 540, 715, 355


def ell(rx, ry, t, rot=0):
    """중심(CX, CY) 타원 위 각도 t(도)의 점. rot만큼 돌린 타원"""
    a, r = math.radians(t), math.radians(rot)
    x, y = rx * math.cos(a), ry * math.sin(a)
    return CX + x * math.cos(r) - y * math.sin(r), CY + x * math.sin(r) + y * math.cos(r)


def node(x, y, en, ko, r=9, dx=0, dy=-22, anchor="middle", fill=BG):
    return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r}" fill="{fill}" stroke="{INK}" stroke-width="2"/>'
            f'<text class=n x="{x + dx:.1f}" y="{y + dy:.1f}" text-anchor="{anchor}">{en}</text>'
            f'<text class=k x="{x + dx:.1f}" y="{y + dy + 22:.1f}" text-anchor="{anchor}">{ko}</text>')


def label(x, y, en, ko="", rot=0, size=26):
    t = f'<g transform="rotate({rot} {x} {y})"><text class=s x="{x}" y="{y}" text-anchor="middle" style="font-size:{size}px">{en}</text>'
    if ko:
        t += f'<text class=k x="{x}" y="{y + 22}" text-anchor="middle">{ko}</text>'
    return t + "</g>"


s = []
# II. 반복의 구 (LOOP): 바깥 구
s.append(f'<circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="{INK}" stroke-width="2" stroke-dasharray="10 9"/>')
# I. 형태의 축: 응축 ↔ 흐름
s.append(f'<line x1="{CX}" y1="{CY - R - 70}" x2="{CX}" y2="{CY + R + 70}" stroke="{INK}" stroke-width="2" stroke-dasharray="10 9"/>')
s.append(f'<ellipse cx="{CX}" cy="{CY - R}" rx="16" ry="5" fill="{BG}" stroke="{INK}" stroke-width="2"/>')
s.append(f'<ellipse cx="{CX}" cy="{CY + R}" rx="16" ry="5" fill="{BG}" stroke="{INK}" stroke-width="2"/>')
s.append(label(CX, CY - R - 92, "Condense", "02 나열 말고 응축한다"))
s.append(label(CX, CY + R + 104, "Flow", "03 동선은 흐르게 둔다"))
# VI. 화면의 평면 (UX): 적도
s.append(f'<ellipse cx="{CX}" cy="{CY}" rx="{R}" ry="108" transform="rotate(-3 {CX} {CY})" fill="none" stroke="{INK}" stroke-width="2.2"/>')
for t, en, ko, dx, dy, an in [(180, "Human Scale", "01 줄 세우지 않는다", -18, 6, "end"), (0, "Participation", "06 함께 짓는다", 18, 6, "start"),
                              (122, "Sequence", "04 퍼널 대신 시퀀스", 0, 34, "middle"), (62, "Low Threshold", "05 문턱은 낮게", 0, 34, "middle")]:
    x, y = ell(R, 108, t, -3); s.append(node(x, y, en, ko, dx=dx, dy=dy, anchor=an))
# III. 지도의 궤도 (MAP): 기울어진 점선 궤도
s.append(f'<ellipse cx="{CX}" cy="{CY}" rx="{R + 8}" ry="138" transform="rotate(20 {CX} {CY})" fill="none" stroke="{INK}" stroke-width="2" stroke-dasharray="3 7"/>')
for t, en, ko, dx, dy, an in [(205, "No Ratings", "12 평점이 없다", -14, -18, "end"), (275, "No Algorithm", "13 알고리즘이 고르지 않는다", 0, -20, "middle"),
                              (25, "Context", "14 맥락을 남긴다", 16, 20, "start"), (78, "Black Line", "15 검은 선으로 그린다", 14, 34, "start")]:
    x, y = ell(R + 8, 138, t, 20); s.append(node(x, y, en, ko, r=7, dx=dx, dy=dy, anchor=an))
# V. 걷는 사람의 평면 (WALK): 안쪽 타원
s.append(f'<ellipse cx="{CX}" cy="{CY}" rx="190" ry="55" fill="none" stroke="{INK}" stroke-width="2.2"/>')
s.append(f'<text class=s x="{CX}" y="{CY + 8}" text-anchor="middle" style="font-size:28px">The Walker</text><text class=k x="{CX}" y="{CY + 30}" text-anchor="middle">걷는 사람</text>')
for t, en, ko, dx, dy, an in [(180, "No Destination", "07 목적지를 지운다", 0, -30, "middle"), (0, "Aura", "10 지금 이 순간을 기록한다", 0, -30, "middle"),
                              (270, "Inner Map", "08 내면의 지도", 0, -26, "middle"), (90, "Own Rhythm", "09 나만의 북소리", 0, 40, "middle")]:
    x, y = ell(190, 55, t); s.append(node(x, y, en, ko, r=15, dx=dx, dy=dy, anchor=an))
# IV. 라비린스의 길: 구를 가로지르는 곡선
s.append(f'<path d="M {CX + 150} {CY - R + 20} C {CX - 120} {CY - 250}, {CX - 260} {CY + 120}, {CX - 230} {CY + R - 40}" fill="none" stroke="{INK}" stroke-width="2.2"/>')
s.append(f'<ellipse cx="{CX + 150}" cy="{CY - R + 20}" rx="13" ry="5" fill="{BG}" stroke="{INK}" stroke-width="2"/>')
bz = lambda u, a, b, c, d: (1 - u) ** 3 * a + 3 * (1 - u) ** 2 * u * b + 3 * (1 - u) * u * u * c + u ** 3 * d
lx = bz(.88, CX + 150, CX - 120, CX - 260, CX - 230); ly = bz(.88, CY - R + 20, CY - 250, CY + 120, CY + R - 40)
s.append(node(lx, ly, "Labyrinth", "11 미로가 아니라 라비린스", r=9, dx=-18, dy=6, anchor="end"))
# II. 바깥 구 위의 LOOP
x, y = CX + R * math.cos(math.radians(-38)), CY + R * math.sin(math.radians(-38))
s.append(node(x, y, "Defamiliarize", "16 반복 속에서 낯설게 한다", r=11, dx=20, dy=-16, anchor="start"))
# VII / VIII 반구
s.append(label(CX + 130, CY - 205, "VII. Upper Hemisphere · Screen", "화면 위의 건축", size=24))
s.append(label(CX + 120, CY + 255, "VIII. Lower Hemisphere · Street", "목적지 없는 걸음", size=24))
# 로마 숫자
for (x, y), n in [((CX + 22, CY - R - 28), "I."), ((CX + R * .5 + 18, CY - R * .87 - 6), "II."), ((CX - R + 22, CY - 70), "III."), ((CX - 268, CY + R - 30), "IV."),
                  ((CX + 150, CY + 62), "V."), ((CX + R + 14, CY + 46), "VI.")]:
    s.append(f'<text class=s x="{x}" y="{y}" style="font-size:22px">{n}</text>')

legend_l = [("I.", "Axis of form: Condense ↔ Flow", "형태의 축: 응축 ↔ 흐름"), ("II.", "Sphere of repetition (Loop)", "반복의 구"),
            ("III.", "Orbit of the map", "지도의 궤도"), ("IV.", "Path of the labyrinth", "라비린스의 길")]
legend_r = [("V.", "Plane of the walker", "걷는 사람의 평면"), ("VI.", "Plane of the screen (UX)", "화면의 평면"),
            ("VII.", "Upper hemisphere: screen", "위 반구: 화면 위의 건축"), ("VIII.", "Lower hemisphere: street", "아래 반구: 목적지 없는 걸음")]
leg = ""
for i, (n, en, ko) in enumerate(legend_l):
    leg += f'<text class=l x="70" y="{208 + i * 48}">{n}</text><text class=l x="118" y="{208 + i * 48}">{en}</text><text class=k x="118" y="{230 + i * 48}">{ko}</text>'
for i, (n, en, ko) in enumerate(legend_r):
    leg += f'<text class=l x="650" y="{1120 + i * 42}">{n}</text><text class=l x="700" y="{1120 + i * 42}">{en}</text><text class=k x="700" y="{1140 + i * 42}">{ko}</text>'

html = f"""<!doctype html><meta charset=utf-8><title>Dimensions of Tracé</title><style>
@font-face{{font-family:IS;src:url(data:font/woff2;base64,{b64("instrument-serif-latin-400-normal.woff2")}) format("woff2")}}
@font-face{{font-family:GB;src:url(data:font/woff2;base64,{b64("gowun-batang-korean-400-normal.woff2")}) format("woff2")}}
@font-face{{font-family:SK;src:url(data:font/woff2;base64,{b64("noto-sans-kr-latin-400-normal.woff2")}) format("woff2")}}
html,body{{margin:0;width:{W}px;height:{H}px;background:{BG};overflow:hidden}}
text{{fill:{INK}}} text.n,text.k,text.s{{paint-order:stroke;stroke:{BG};stroke-width:6px;stroke-linejoin:round}}
.s{{font:italic 26px IS,serif}} .n{{font:400 21px SK,sans-serif}} .k{{font:400 16px GB,serif;fill:{DIM}}} .l{{font:400 19px SK,sans-serif}}
.t{{font:italic 78px IS,serif}} .tk{{font:400 26px GB,serif}}
</style><svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
<text class=t x="{W / 2}" y="118" text-anchor="middle">Dimensions of Tracé</text>
<text class=tk x="{W / 2}" y="160" text-anchor="middle">Tracé 원칙의 층위 · 16 principles</text>
{leg}{"".join(s)}
<line x1="70" y1="1302" x2="1010" y2="1302" stroke="{INK}" stroke-width="1"/>
<text class=s x="70" y="1334" style="font-size:22px">The Principles of Tracé</text><text class=s x="1010" y="1334" text-anchor="end" style="font-size:22px">@radiant_walks</text>
</svg>"""
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "dimensions.html").write_text(html, encoding="utf-8")
exe = (glob.glob("/opt/pw-browsers/chromium_headless_shell-*/*/headless_shell") + glob.glob("/opt/pw-browsers/chromium/chrome"))[0]
subprocess.run([exe, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", f"--window-size={W},{H}",
                f"--screenshot={OUT / 'dimensions.jpg'}", f"file://{OUT / 'dimensions.html'}"], check=True, capture_output=True)
print(OUT / "dimensions.jpg")

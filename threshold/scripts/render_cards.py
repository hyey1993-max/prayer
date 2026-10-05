#!/usr/bin/env python3
"""cards.json → 카드 PNG. 사용법:
  python3 scripts/render_cards.py content/essay_seoul_tokyo/cards.json
배경 사진: 카드의 "photo" 값(photos/essay/ 안 파일명) 또는 photos/essay/{세트이름}_{번호}.jpg 가 있으면 어둡게 깔아 쓴다 (예: reels_a_low_threshold_01.jpg).
필요: Chromium (PLAYWRIGHT_BROWSERS_PATH 또는 CHROME 환경변수)
"""
import base64, glob, html, json, os, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
SIZES = {"reels": (1080, 1920), "carousel": (1080, 1350), "quote": (1080, 1350), "longform": (1080, 1350)}


def chrome():
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    hits = glob.glob("/opt/pw-browsers/chromium_headless_shell-*/*/headless_shell") + glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome") + glob.glob("/opt/pw-browsers/chromium/chrome")
    if not hits:
        sys.exit("Chromium을 찾지 못했습니다. CHROME=/경로/chrome 으로 지정하세요")
    return hits[0]


def b64(p):
    return base64.b64encode(Path(p).read_bytes()).decode()


def css():
    faces = []
    for fam, f, w in (("Serif", "noto-serif-kr-korean-700-normal", 700), ("Serif", "noto-serif-kr-korean-400-normal", 400),
                      ("Sans", "noto-sans-kr-korean-400-normal", 400)):
        faces.append(f'@font-face{{font-family:"{fam}KR";font-weight:{w};src:url(data:font/woff2;base64,{b64(FONTS / (f + ".woff2"))}) format("woff2")}}')
    return "\n".join(faces)


def page(kind, card, idx, total, brand, bg):
    w, h = SIZES[kind]
    big = kind != "carousel"
    size = 76 if kind == "reels" else 68
    head = ""
    body = html.escape(card.get("t", "")).replace("\n", "<br>")
    if "h" in card:
        head = f'<h1>{html.escape(card["h"]).replace(chr(10), "<br>")}</h1>'
        body = f'<p class="small">{body}</p>' if idx else f'<p class="sub">{body}</p>'
    elif card.get("end"):
        body = f'<p class="main">{body}</p>'
    else:
        body = f'<p class="main">{body}</p>'
    bgcss = f'background-image:linear-gradient(rgba(10,10,9,.55),rgba(10,10,9,.82)),url(data:image/jpeg;base64,{b64(bg)});background-size:cover;background-position:center;' if bg else ""
    counter = f"{idx + 1:02d} / {total:02d}" if kind != "quote" else ""
    return f"""<!doctype html><meta charset=utf-8><style>{css()}
*{{box-sizing:border-box;margin:0}}
html{{width:{w}px;height:{h}px;background:#0e0e0d;{bgcss}}}
body{{width:{w}px;height:{h}px;color:#ecebe6;font-family:"SerifKR",serif;position:relative;overflow:hidden}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(#ffffff0d 1px,transparent 1px),linear-gradient(90deg,#ffffff0d 1px,transparent 1px);background-size:90px 90px}}
.top,.bot{{position:absolute;left:80px;right:80px;display:flex;justify-content:space-between;font:400 26px "SansKR",sans-serif;letter-spacing:.14em;color:#9a9891}}
.top{{top:{150 if kind=="reels" else 80}px}} .bot{{bottom:{170 if kind=="reels" else 80}px}}
.rule{{position:absolute;left:80px;right:80px;top:{200 if kind=="reels" else 130}px;border-top:2px solid #ecebe6}}
.c{{position:absolute;left:80px;right:80px;top:{300 if kind=="reels" else 210}px;bottom:{260 if kind=="reels" else 170}px;display:flex;flex-direction:column;justify-content:center;gap:48px}}
.main{{font-weight:700;font-size:{size}px;line-height:1.5;word-break:keep-all}}
h1{{font-weight:700;font-size:78px;line-height:1.35;word-break:keep-all}}
.small{{font:400 40px/1.75 "SansKR",sans-serif;color:#d8d7d0;word-break:keep-all}}
.sub{{font:400 38px/1.6 "SansKR",sans-serif;color:#9a9891}}
</style><body><div class=grid></div>
<div class=top><span>{html.escape(brand)}</span><span>{counter}</span></div><div class=rule></div>
<div class=c>{head}{body}</div>
<div class=bot><span>{"37.4979° N  127.0276° E" if False else ""}</span><span>{"저장 · 공유" if card.get("end") else ""}</span></div>
</body>"""


def esc(t):
    return html.escape(t or "").replace("\n", "<br>")


def page_long(card, idx, total, brand, part, bg):
    """연재 캐러셀: 표지(cover) / 섹션(section) / 본문(body) / 마무리(end)"""
    w, h = SIZES["longform"]
    typ = card.get("type", "body")
    shade = ".62),rgba(10,10,9,.9)" if typ in ("cover", "section", "end") else ".86),rgba(10,10,9,.94)"
    bgcss = f'background-image:linear-gradient(rgba(10,10,9,{shade}),url(data:image/jpeg;base64,{b64(bg)});background-size:cover;background-position:center;' if bg else ""
    if typ == "cover":
        inner = f'<p class=label>{esc(card.get("label"))}</p><h1 class=cover>{esc(card["h"])}</h1><p class=sub>{esc(card.get("sub"))}</p>'
        foot = "넘겨서 보기 →"
    elif typ == "section":
        inner = f'<p class=num>{esc(card.get("label"))}</p><h1>{esc(card["h"])}</h1><p class=sub>{esc(card.get("sub"))}</p>'
        foot = ""
    elif typ == "end":
        inner = f'<p class=label>{esc(card.get("label"))}</p><h1>{esc(card["h"])}</h1><p class=sub>{esc(card.get("sub"))}</p>'
        foot = "저장 · 공유"
    else:
        inner = f'<p class=label>{esc(card.get("label"))}</p><p class=pull>{esc(card.get("pull"))}</p><p class=body>{esc(card.get("t"))}</p>'
        foot = ""
    return f"""<!doctype html><meta charset=utf-8><style>{css()}
*{{box-sizing:border-box;margin:0}}
html{{width:{w}px;height:{h}px;background:#0e0e0d;{bgcss}}}
body{{width:{w}px;height:{h}px;color:#ecebe6;font-family:"SerifKR",serif;position:relative;overflow:hidden}}
.grid{{position:absolute;inset:0;background-image:linear-gradient(#ffffff0b 1px,transparent 1px),linear-gradient(90deg,#ffffff0b 1px,transparent 1px);background-size:90px 90px}}
.top,.bot{{position:absolute;left:80px;right:80px;display:flex;justify-content:space-between;font:400 24px "SansKR",sans-serif;letter-spacing:.14em;color:#9a9891}}
.top{{top:72px}} .bot{{bottom:64px}}
.rule{{position:absolute;left:80px;right:80px;top:118px;border-top:2px solid #ecebe6}}
.c{{position:absolute;left:80px;right:80px;top:170px;bottom:130px;display:flex;flex-direction:column;justify-content:{'center' if typ!='body' else 'flex-start'};gap:36px}}
.label{{font:500 26px "SansKR",sans-serif;letter-spacing:.12em;color:#b9b7ae}}
.num{{font:700 120px/1 "SerifKR",serif;color:#ecebe6}}
h1{{font-weight:700;font-size:70px;line-height:1.32;word-break:keep-all}}
h1.cover{{font-size:86px}}
.sub{{font:400 34px/1.6 "SansKR",sans-serif;color:#c9c7bf;word-break:keep-all}}
.pull{{font-weight:700;font-size:50px;line-height:1.42;word-break:keep-all;padding-bottom:30px;border-bottom:1px solid #ecebe655}}
.body{{font:400 36px/1.8 "SansKR",sans-serif;color:#dedcd5;word-break:keep-all}}
</style><body><div class=grid></div>
<div class=top><span>{html.escape(brand)}</span><span>{html.escape(part)}  {idx + 1:02d} / {total:02d}</span></div><div class=rule></div>
<div class=c>{inner}</div>
<div class=bot><span></span><span>{foot}</span></div>
</body>"""


def main():
    src = Path(sys.argv[1]).resolve()
    data = json.loads(src.read_text(encoding="utf-8"))
    out_root = src.parent / "cards"
    exe = chrome()
    for name, s in data["sets"].items():
        kind, cards = s["kind"], s["cards"]
        w, h = SIZES[kind]
        out = out_root / name
        out.mkdir(parents=True, exist_ok=True)
        for i, c in enumerate(cards):
            photos = glob.glob(str(ROOT / "photos" / "essay" / f"{name}_{i + 1:02d}.*"))
            if c.get("photo") and (ROOT / "photos" / "essay" / c["photo"]).exists():
                photos = [str(ROOT / "photos" / "essay" / c["photo"])]
            with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
                bgp = photos[0] if photos else None
                f.write(page_long(c, i, len(cards), data["brand"], s.get("part", ""), bgp) if kind == "longform"
                        else page(kind, c, i, len(cards), data["brand"], bgp))
            png = out / f"{i + 1:02d}.jpg"
            subprocess.run([exe, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                            f"--window-size={w},{h}", f"--screenshot={png}", f"file://{f.name}"],
                           check=True, capture_output=True)
            os.unlink(f.name)
        print(f"{name}: {len(cards)}장 → {out}")


main()

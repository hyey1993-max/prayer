#!/usr/bin/env python3
"""cards.json → 카드 PNG. 사용법:
  python3 scripts/render_cards.py content/essay_seoul_tokyo/cards.json
배경 사진: 카드의 "photo" 값(photos/essay/ 안 파일명) 또는 photos/essay/{세트이름}_{번호}.jpg 가 있으면 어둡게 깔아 쓴다 (예: reels_a_low_threshold_01.jpg).
필요: Chromium (PLAYWRIGHT_BROWSERS_PATH 또는 CHROME 환경변수)
"""
import base64, glob, html, json, os, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
SIZES = {"hook": (1080, 1350), "reels": (1080, 1920), "carousel": (1080, 1350), "quote": (1080, 1350), "longform": (1080, 1350)}


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
    faces.append(f'@font-face{{font-family:"HeavyKR";font-weight:900;unicode-range:U+0000-00FF,U+2000-206F;src:url(data:font/woff2;base64,{b64(FONTS / "noto-sans-kr-latin-900-normal.woff2")}) format("woff2")}}')
    faces.append(f'@font-face{{font-family:"HeavyKR";font-weight:900;src:url(data:font/woff2;base64,{b64(FONTS / "noto-sans-kr-korean-900-normal.woff2")}) format("woff2")}}')
    faces.append(f'@font-face{{font-family:"SansKR";font-weight:400;unicode-range:U+0000-00FF,U+2000-206F;src:url(data:font/woff2;base64,{b64(FONTS / "noto-sans-kr-latin-400-normal.woff2")}) format("woff2")}}')
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


def hl(t):
    """[[강조]] → 노란색 강조"""
    return re.sub(r"\[\[(.+?)\]\]", r"<em>\1</em>", esc(t))


def page_hook(card, idx, total, brand, part, bg):
    """레퍼런스형: 위는 사진, 아래는 짧고 굵은 훅 제목. 본문 카드는 원문을 그대로."""
    w, h = SIZES["hook"]
    typ = card.get("type", "body")
    photo = f"url(data:image/jpeg;base64,{b64(bg)})" if bg else "none"
    top = f'<div class=bar><span>{html.escape(brand)}</span><span>{html.escape(part)} · {idx + 1:02d}/{total:02d}</span></div>'
    if typ in ("cover", "title", "end"):
        big = "cover" if typ == "cover" else ""
        foot = {"cover": "넘겨서 보기 →", "end": "저장해두고 다시 보기"}.get(typ, "")
        inner = f"""<div class=photo style="background-image:{photo}"></div>
<div class=low><p class=label>{esc(card.get("label"))}</p><h1 class="{big}">{hl(card["h"])}</h1>
<p class=sub>{esc(card.get("sub"))}</p><p class=foot>{foot}</p></div>"""
    elif typ == "list":
        rows = "".join(f'<li><b>{i + 1:02d}</b><span>{hl(x)}</span></li>' for i, x in enumerate(card["items"]))
        inner = f'<div class=pad><p class=label>{esc(card.get("label"))}</p><h1>{hl(card["h"])}</h1><ol>{rows}</ol><p class=foot>{esc(card.get("sub"))}</p></div>'
    else:
        inner = f'<div class=pad><p class=label>{esc(card.get("label"))}</p><h1>{hl(card["h"])}</h1><p class=body>{esc(card.get("t"))}</p></div>'
    return f"""<!doctype html><meta charset=utf-8><style>{css()}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{w}px;height:{h}px;background:#0b0b0a;color:#f2f1ec;overflow:hidden}}
body{{position:relative;font-family:"SansKR",sans-serif}}
em{{font-style:normal;color:#f2c94c}}
.bar{{position:absolute;z-index:2;top:44px;left:64px;right:64px;display:flex;justify-content:space-between;font:400 24px "SansKR",sans-serif;letter-spacing:.12em;color:#f2f1ecbb;text-shadow:0 1px 6px #0009}}
.photo{{position:absolute;left:0;right:0;top:0;height:720px;background:#1b1b19 center/cover no-repeat}}
.photo:before{{content:"";position:absolute;inset:0 0 auto 0;height:160px;background:linear-gradient(#0b0b0aaa,transparent)}}
.photo:after{{content:"";position:absolute;inset:auto 0 0 0;height:260px;background:linear-gradient(transparent,#0b0b0a)}}
.low{{position:absolute;left:64px;right:64px;top:640px;bottom:56px;display:flex;flex-direction:column;gap:22px}}
.pad{{position:absolute;left:64px;right:64px;top:130px;bottom:64px;display:flex;flex-direction:column;gap:30px}}
.label{{font:400 28px "SansKR",sans-serif;letter-spacing:.06em;color:#f2c94c}}
h1{{font:900 76px/1.22 "HeavyKR",sans-serif;letter-spacing:-.02em;word-break:keep-all}}
h1.cover{{font-size:96px}}
.sub{{font:400 32px/1.55 "SansKR",sans-serif;color:#c9c7bf;word-break:keep-all}}
.foot{{margin-top:auto;font:400 26px "SansKR",sans-serif;color:#9a9891;text-align:right}}
.body{{font:400 37px/1.78 "SansKR",sans-serif;color:#dedcd5;word-break:keep-all;border-top:2px solid #f2f1ec33;padding-top:30px}}
ol{{list-style:none;display:flex;flex-direction:column;gap:0}}
li{{display:flex;gap:28px;align-items:baseline;padding:20px 0;border-top:1px solid #f2f1ec33;font:900 44px/1.3 "HeavyKR",sans-serif;word-break:keep-all}}
li b{{font:400 28px "SansKR",sans-serif;color:#f2c94c;min-width:44px}}
</style><body>{top}{inner}</body>"""


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
                f.write(page_hook(c, i, len(cards), data["brand"], s.get("part", ""), bgp) if kind == "hook"
                        else page_long(c, i, len(cards), data["brand"], s.get("part", ""), bgp) if kind == "longform"
                        else page(kind, c, i, len(cards), data["brand"], bgp))
            png = out / f"{i + 1:02d}.jpg"
            subprocess.run([exe, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
                            f"--window-size={w},{h}", f"--screenshot={png}", f"file://{f.name}"],
                           check=True, capture_output=True)
            os.unlink(f.name)
        print(f"{name}: {len(cards)}장 → {out}")


main()

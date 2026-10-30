#!/usr/bin/env python3
"""tracé 제작기 카드 (1080×1350, 영어 + 한글). 앱의 시각 체계를 따른다:
종이색 #ECEBE7, 잉크 #111, 1px 선, 빨강 #D0201B는 한 장에 한 곳만([[ ]]), 날짜·번호는 IBM Plex Mono, 문장은 Noto Serif KR.
  python3 scripts/render_making.py content/making/series.json
카드 종류: cover / scene / table / end. 앱 화면은 content/making/screens/ 에서 가져온다.
"""
import base64, glob, html, json, re, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
W, H = 1080, 1350
b64 = lambda p: base64.b64encode(Path(p).read_bytes()).decode()
esc = lambda t: html.escape(t or "").replace("\n", "<br>")
red = lambda t: re.sub(r"\[\[(.+?)\]\]", r"<em>\1</em>", esc(t))


def css():
    f = lambda fam, w, name, extra="": f'@font-face{{font-family:"{fam}";font-weight:{w};src:url(data:font/woff2;base64,{b64(FONTS / name)}) format("woff2"){extra}}}'
    return "".join([f("Serif", 400, "noto-serif-kr-korean-400-normal.woff2"), f("Serif", 700, "noto-serif-kr-korean-700-normal.woff2"),
                    f("Display", 400, "instrument-serif-latin-400-normal.woff2"), f("Mono", 400, "ibm-plex-mono-latin-400-normal.woff2"),
                    f("Mono", 600, "ibm-plex-mono-latin-600-normal.woff2")])


def shots(card, screens):
    """앱 화면 1~2장. "strike": 지운 화면에 빨간 사선, 두 장이면 사이에 화살표"""
    imgs = card.get("imgs") or []
    if not imgs:
        return ""
    h = card.get("img_h", 640)
    out = []
    for i, name in enumerate(imgs):
        strike = '<i class=strike></i>' if card.get("strike") == name else ""
        cap = f'<span class=cap>{esc(card.get("caps", [""] * len(imgs))[i])}</span>' if card.get("caps") else ""
        out.append(f'<figure style="height:{h}px"><img src="data:image/jpeg;base64,{b64(screens / name)}">{strike}{cap}</figure>')
        if i < len(imgs) - 1:
            out.append('<span class=arrow>→</span>')
    return f'<div class=shots>{"".join(out)}</div>'


def page(card, idx, total, series, screens):
    kind = card.get("kind", "scene")
    head = f'<div class=bar><span>tracé · {esc(series["part"])}</span><span>{idx + 1:02d} / {total:02d}</span></div>'
    meta = f'<p class=meta>{esc(card.get("meta"))}</p>' if card.get("meta") else ""
    en = f'<p class=en>{esc(card["en"])}</p>' if card.get("en") else ""
    body = "".join(f'<p class="{"q" if p.startswith("“") else "b"}">{red(p)}</p>' for p in card.get("body", []))
    if kind == "cover":
        inner = f'<div class="pad cover">{meta}{en}<h1>{red(card["h"])}</h1><p class=sub>{esc(card.get("sub"))}</p>{shots(card, screens)}</div>'
    elif kind == "table":
        rows = "".join(f'<tr><td class=n>{i + 1:02d}</td><td>{red(a)}</td><td>{red(b)}</td></tr>' for i, (a, b) in enumerate(card["rows"]))
        inner = f'<div class=pad>{meta}{en}<h1 class=sm>{red(card["h"])}</h1><table>{rows}</table></div>'
    else:
        inner = f'<div class=pad>{meta}{en}<h1 class=sm>{red(card["h"])}</h1>{body}{shots(card, screens)}</div>'
    foot = f'<div class=foot><span>{esc(series.get("foot", ""))}</span><span>{esc(card.get("foot_r", ""))}</span></div>'
    return f"""<!doctype html><meta charset=utf-8><style>{css()}
*{{box-sizing:border-box;margin:0;padding:0}}
html,body{{width:{W}px;height:{H}px;background:#ECEBE7;color:#111;overflow:hidden}}
body{{position:relative;font-family:Serif,serif;word-break:keep-all}}
em{{font-style:normal;color:#D0201B}}
.bar,.foot{{position:absolute;left:72px;right:72px;display:flex;justify-content:space-between;font:400 22px Mono,Serif,monospace;letter-spacing:.06em}}
.bar{{top:56px;padding-bottom:18px;border-bottom:1px solid #111}} .foot{{bottom:52px;padding-top:16px;border-top:1px solid #111;font-size:20px}}
.pad{{position:absolute;left:72px;right:72px;top:130px;bottom:120px;display:flex;flex-direction:column;gap:20px}}
.cover{{justify-content:flex-start;padding-top:20px}}
.meta{{font:400 22px Mono,Serif,monospace;letter-spacing:.06em;color:#111}}
.en{{font:400 40px/1.15 Display,Serif,serif;color:#111}}
h1{{font:700 64px/1.3 Serif,serif;letter-spacing:-.02em}} h1.sm{{font-size:50px}}
.sub{{font:400 26px/1.6 Serif,serif;color:#444}}
.b{{font:400 27px/1.7 Serif,serif;color:#222}}
.q{{font:400 25px/1.6 Mono,Serif,monospace;color:#111;padding-left:18px;border-left:1px solid #111}}
.shots{{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:auto}}
figure{{position:relative;aspect-ratio:780/1328;border:1px solid #111;background:#fff}}
figure img{{display:block;width:100%;height:100%;object-fit:cover;object-position:top}}
.strike{{position:absolute;inset:0;background:linear-gradient(to top right,transparent calc(50% - 2px),#D0201B calc(50% - 2px),#D0201B calc(50% + 2px),transparent calc(50% + 2px))}}
.cap{{position:absolute;left:0;right:0;bottom:-34px;text-align:center;font:400 18px Mono,Serif,monospace}}
.arrow{{font:400 44px Mono,Serif,monospace}}
table{{border-collapse:collapse;width:100%;font:400 21px/1.4 Serif,serif}}
td{{border-top:1px solid #111;padding:9px 10px 9px 0;vertical-align:top}} td.n{{font:400 18px Mono,Serif,monospace;width:46px;padding-top:12px}}
td:nth-child(2){{width:48%}}
</style><body>{head}{inner}{foot}</body>"""


def main():
    src = Path(sys.argv[1]).resolve()
    data = json.loads(src.read_text(encoding="utf-8"))
    screens = src.parent / "screens"
    exe = (glob.glob("/opt/pw-browsers/chromium_headless_shell-*/*/headless_shell") + glob.glob("/opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell") + glob.glob("/opt/pw-browsers/chromium*/chrome-linux*/chrome"))[0]
    for name, series in data["sets"].items():
        out = src.parent / "cards" / name
        out.mkdir(parents=True, exist_ok=True)
        for old in out.glob("*.jpg"):
            old.unlink()
        cards = series["cards"]
        for i, c in enumerate(cards):
            with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
                f.write(page(c, i, len(cards), series, screens))
            subprocess.run([exe, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", f"--window-size={W},{H}",
                            f"--screenshot={out / f'{i + 1:02d}.jpg'}", f"file://{f.name}"], check=True, capture_output=True)
            Path(f.name).unlink()
        print(f"{name}: {len(cards)}장 → {out}")


main()

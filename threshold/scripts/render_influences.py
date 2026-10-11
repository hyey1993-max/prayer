#!/usr/bin/env python3
"""Tracé Influences 표지 카드 (아이보리, 1080x1350). 이름 타이포그래피만 쓴다.
사용법: python3 scripts/render_influences.py content/influences/series.json
"""
import base64, glob, html, json, os, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"
W, H = 1080, 1350


def face(fam, w, f, rng=""):
    b = base64.b64encode((FONTS / f).read_bytes()).decode()
    r = f";unicode-range:{rng}" if rng else ""
    return f'@font-face{{font-family:"{fam}";font-weight:{w};src:url(data:font/woff2;base64,{b}) format("woff2"){r}}}'


CSS = "\n".join([
    face("Heavy", 900, "noto-sans-kr-latin-900-normal.woff2", "U+0000-024F,U+2000-206F"),
    face("Heavy", 900, "noto-sans-kr-korean-900-normal.woff2"),
    face("Sans", 400, "noto-sans-kr-latin-400-normal.woff2", "U+0000-024F,U+2000-206F"),
    face("Sans", 400, "noto-sans-kr-korean-400-normal.woff2"),
    face("Serif", 400, "instrument-serif-latin-400-normal.woff2"),
    face("Mono", 400, "ibm-plex-mono-latin-400-normal.woff2"),
])


def page(p, i, n):
    name = html.escape(p["name"]).replace("\n", "<br>")
    link = f'<p class=link>→ {html.escape(p["link"])}</p>' if p.get("link") else ""
    return f"""<!doctype html><meta charset=utf-8><style>{CSS}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;background:#f3eee3;color:#1a1916;overflow:hidden}}
body{{position:relative;padding:72px 76px}}
.bar{{display:flex;justify-content:space-between;font:400 24px "Mono";letter-spacing:.14em;text-transform:uppercase}}
.bar b{{font:900 30px "Heavy";letter-spacing:0;text-transform:none}}
.rule{{height:3px;background:#1a1916;margin-top:22px}}
h1{{position:absolute;left:68px;right:60px;bottom:430px;font:900 168px/.9 "Heavy";letter-spacing:-.045em;text-transform:uppercase}}
.ko{{position:absolute;left:76px;bottom:350px;font:400 34px "Sans";color:#4a463f}}
.key{{position:absolute;left:76px;right:76px;bottom:200px;font:400 64px/1.1 "Serif";font-style:italic;border-top:2px solid #1a1916;padding-top:30px}}
.link{{position:absolute;left:76px;bottom:140px;font:400 26px "Mono";letter-spacing:.04em;color:#4a463f}}
.foot{{position:absolute;left:76px;right:76px;bottom:64px;display:flex;justify-content:space-between;font:400 22px "Mono";letter-spacing:.1em;color:#6e6a62}}
</style><body>
<div class=bar><b>Tracé</b><span>Influences {i:02d}/{n:02d}</span></div><div class=rule></div>
<h1>{name}</h1><p class=ko>{html.escape(p["ko"])} · {html.escape(p["role"])}</p>
<p class=key>{html.escape(p["key"])}</p>{link}
<div class=foot><span>@radiant_walks</span><span>INSPIRED BY</span></div>
</body>"""


def main():
    src = Path(sys.argv[1]).resolve(); data = json.loads(src.read_text(encoding="utf-8"))
    out = src.parent / "cards"; out.mkdir(exist_ok=True)
    exe = (glob.glob("/opt/pw-browsers/chromium_headless_shell-*/*/headless_shell") or [os.environ.get("CHROME", "")])[0]
    people = data["people"]
    for i, p in enumerate(people, 1):
        with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
            f.write(page(p, i, len(people)))
        subprocess.run([exe, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", f"--window-size={W},{H}",
                        f"--screenshot={out / f'{i:02d}.jpg'}", f"file://{f.name}"], check=True, capture_output=True)
        os.unlink(f.name)
    print(len(people), "장 →", out)


main()

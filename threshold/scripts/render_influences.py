#!/usr/bin/env python3
"""Tracé Influences 카드 (아이보리, 1080x1350). 이름 타이포그래피만 쓴다.\n원문(quote)이 있는 사람은 폴더에 3장(표지 / 에세이 원문 / 확인된 사실)을 따로 만든다.
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


def page_quote(p, i, n):
    """2장: 직접 쓴 에세이 원문 그대로"""
    paras = "".join(f"<p>{html.escape(x)}</p>" for x in p["quote"].split("\n"))
    link = f'<p class=link>→ {html.escape(p["link"])}</p>' if p.get("link") else ""
    return f"""<!doctype html><meta charset=utf-8><style>{CSS}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;background:#f3eee3;color:#1a1916;overflow:hidden}}
body{{position:relative;padding:72px 76px}}
.bar{{display:flex;justify-content:space-between;font:400 24px "Mono";letter-spacing:.14em;text-transform:uppercase}}
.bar b{{font:900 30px "Heavy";letter-spacing:0;text-transform:none}}
.rule{{height:3px;background:#1a1916;margin-top:22px}}
.lab{{margin-top:120px;font:400 24px "Mono";letter-spacing:.08em;color:#6e6a62}}
.q{{margin-top:34px;font:400 {38 if len(p["quote"]) > 150 else 44}px/1.6 "Sans";word-break:keep-all}} .q p+p{{margin-top:28px}}
.link{{position:absolute;left:76px;bottom:140px;font:400 26px "Mono";color:#4a463f}}
.foot{{position:absolute;left:76px;right:76px;bottom:64px;display:flex;justify-content:space-between;font:400 22px "Mono";letter-spacing:.1em;color:#6e6a62}}
</style><body>
<div class=bar><b>Tracé</b><span>Influences {i:02d}/{n:02d}</span></div><div class=rule></div>
<p class=lab>{html.escape(p.get("label", "FROM THE ESSAY"))} · {html.escape(p["source"])}</p><div class=q>{paras}</div>{link}
<div class=foot><span>{html.escape(p["name"].replace(chr(10), " "))}</span><span>02 / 03</span></div>
</body>"""


def page_facts(p, i, n):
    """3장: 확인된 사실만"""
    rows = "".join(f"<li><b>{html.escape(k)}</b><span>{html.escape(v)}</span></li>" for k, v in p["facts"])
    return f"""<!doctype html><meta charset=utf-8><style>{CSS}
*{{margin:0;padding:0;box-sizing:border-box}}
html,body{{width:{W}px;height:{H}px;background:#f3eee3;color:#1a1916;overflow:hidden}}
body{{position:relative;padding:72px 76px}}
.bar{{display:flex;justify-content:space-between;font:400 24px "Mono";letter-spacing:.14em;text-transform:uppercase}}
.bar b{{font:900 30px "Heavy";letter-spacing:0;text-transform:none}}
.rule{{height:3px;background:#1a1916;margin-top:22px}}
h2{{margin-top:96px;font:900 64px/1 "Heavy";letter-spacing:-.03em;text-transform:uppercase}}
.ko{{margin-top:14px;font:400 28px "Sans";color:#4a463f}}
ul{{list-style:none;margin-top:48px;border-top:2px solid #1a1916}}
li{{display:grid;grid-template-columns:260px 1fr;gap:28px;padding:24px 0;border-bottom:1px solid #cfc7b6}}
li b{{font:400 22px/1.5 "Mono";letter-spacing:.04em;color:#6e6a62;padding-top:4px}}
li span{{font:400 31px/1.55 "Sans";word-break:keep-all}}
.foot{{position:absolute;left:76px;right:76px;bottom:64px;display:flex;justify-content:space-between;font:400 22px "Mono";letter-spacing:.1em;color:#6e6a62}}
</style><body>
<div class=bar><b>Tracé</b><span>Influences {i:02d}/{n:02d}</span></div><div class=rule></div>
<h2>{html.escape(p["name"].replace(chr(10), " "))}</h2><p class=ko>{html.escape(p["ko"])} · {html.escape(p["role"])}</p>
<ul>{rows}</ul>
<div class=foot><span>FACTS</span><span>03 / 03</span></div>
</body>"""


def shot(exe, markup, path):
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, encoding="utf-8") as f:
        f.write(markup)
    subprocess.run([exe, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", f"--window-size={W},{H}",
                    f"--screenshot={path}", f"file://{f.name}"], check=True, capture_output=True)
    os.unlink(f.name)


def main():
    src = Path(sys.argv[1]).resolve(); data = json.loads(src.read_text(encoding="utf-8"))
    out = src.parent / "cards"; out.mkdir(exist_ok=True)
    exe = (glob.glob("/opt/pw-browsers/chromium_headless_shell-*/*/headless_shell") or [os.environ.get("CHROME", "")])[0]
    people = data["people"]
    for i, p in enumerate(people, 1):
        shot(exe, page(p, i, len(people)), out / f"{i:02d}.jpg")
        if p.get("quote"):                     # 원문이 있는 사람은 캐러셀 3장: 표지 / 원문 / 사실
            d = out / f"{i:02d}_{p['slug']}"; d.mkdir(exist_ok=True)
            shot(exe, page(p, i, len(people)), d / "01.jpg")
            shot(exe, page_quote(p, i, len(people)), d / "02.jpg")
            shot(exe, page_facts(p, i, len(people)), d / "03.jpg")
    print(len(people), "장 →", out)


main()

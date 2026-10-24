#!/usr/bin/env python3
"""렌더링된 카드로 갤러리 HTML을 만든다 (아티팩트 미리보기용).
  python3 scripts/build_gallery.py <출력.html> "<제목>" "<설명>" <json> [<json> ...]
카드 경로는 cards/<세트>/NN.jpg 로 참조하고, 아티팩트 files 맵(JSON)을 <출력>.files.json 에 쓴다.
"""
import html, json, sys
from pathlib import Path

out, title, lead, srcs = Path(sys.argv[1]), sys.argv[2], sys.argv[3], [Path(p).resolve() for p in sys.argv[4:]]
secs, nav, files, total = [], [], {}, 0
for src in srcs:
    for k, s in json.loads(src.read_text(encoding="utf-8"))["sets"].items():
        n = len(s["cards"]); total += n
        tall = s["kind"] in ("reels", "hookreels")
        imgs = ""
        for i in range(1, n + 1):
            p = f"cards/{k}/{i:02d}.jpg"
            files[p] = str(src.parent / p)
            imgs += f'<a href="{p}" target="_blank"><img src="{p}" alt="{html.escape(s["title"])} {i}번" loading="lazy"{" class=tall" if tall else ""}></a>'
        nav.append(f'<a href="#{k}">{html.escape(s["title"].split(" · ")[0])}</a>')
        secs.append(f'<section id="{k}"><h2>{html.escape(s["title"])}</h2><p class=meta>{n}장 · {"1080×1920" if tall else "1080×1350"} · <code>cards/{k}/</code></p><div class=row>{imgs}</div></section>')
page = f'''<title>{html.escape(title)}</title>
<style>
/* 세트별 가로 필름스트립 */
:root{{--bg:#efeee9;--fg:#141414;--muted:#66655f;--line:#141414;--soft:#d6d4cc;--accent:#a8820f;--mono:ui-monospace,Menlo,monospace;--body:system-ui,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#121211;--fg:#ecebe6;--muted:#9a9891;--line:#ecebe6;--soft:#2c2b28;--accent:#f2c94c;color-scheme:dark}}}}
:root[data-theme="dark"]{{--bg:#121211;--fg:#ecebe6;--muted:#9a9891;--line:#ecebe6;--soft:#2c2b28;--accent:#f2c94c;color-scheme:dark}}
body{{background:var(--bg);color:var(--fg);font:15px/1.6 var(--body);margin:0;padding-inline:16px;padding-block:28px 56px}}
main{{max-width:1200px;margin:0 auto}}
h1{{font-size:26px;margin:0 0 4px;text-wrap:balance}} .lead{{color:var(--muted);margin:0 0 20px;max-width:65ch}}
nav{{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}}
nav a{{font:500 13px var(--body);color:var(--fg);border:1px solid var(--line);padding:4px 10px;text-decoration:none}}
nav a:hover{{background:var(--fg);color:var(--bg)}}
section{{border-top:1px solid var(--line);padding-top:14px;margin-bottom:32px}}
h2{{font-size:18px;margin:0}} .meta{{font:12px var(--mono);color:var(--muted);margin:2px 0 12px}}
.row{{display:flex;gap:10px;overflow-x:auto;padding-bottom:10px;scroll-snap-type:x mandatory}}
.row a{{flex:0 0 auto;scroll-snap-align:start}}
.row img{{display:block;height:300px;width:auto;max-width:none;border:1px solid var(--soft)}}
.row img.tall{{height:400px}}
a:focus-visible{{outline:2px solid var(--accent);outline-offset:2px}}
@media (max-width:500px){{.row img{{height:240px}} .row img.tall{{height:320px}}}}
</style>
<main><h1>{html.escape(title)}</h1>
<p class=lead>{html.escape(lead)} 전체 {total}장. 세트마다 옆으로 넘겨 보고, 카드를 누르면 원본 크기로 열린다.</p>
<nav>{"".join(nav)}</nav>
{"".join(secs)}</main>'''
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(page, encoding="utf-8")
Path(str(out) + ".files.json").write_text(json.dumps(files, ensure_ascii=False), encoding="utf-8")
print(total, "cards")

// 목록(2단, 아이콘 + 도트 라벨 + 원칙), 해시 라우팅(#law-01), 상세(아이콘·라벨·정의·원문·다음 원칙)
(() => {
"use strict";
const D = window.TRACE, ICON = window.TRACE_ICON;
const $ = s => document.querySelector(s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const html = (tag, cls, markup) => { const e = el(tag, cls); e.innerHTML = markup; return e; };
const paras = (host, list) => list.forEach(t => t.split("\n").forEach(line => line.trim() && host.append(el("p", null, line))));
const label = l => `${String(l.no).padStart(2, "0")} · ${l.en}`;
const groupOf = l => D.groups.find(g => g.key === l.group);

// ---------- 목록 ----------
const host = $("#groups");
D.groups.forEach(g => {
  const sec = el("section", "group"); sec.id = g.key;
  const head = el("div", "group-head"); head.append(el("h2", "dot", g.name), el("span", "ko", g.title_en)); sec.append(head);
  const ul = el("ul", "grid");
  D.laws.filter(l => l.group === g.key).forEach(l => {
    const li = el("li"), a = el("a", "law"); a.href = `#law-${String(l.no).padStart(2, "0")}`;
    const text = el("div"); text.append(el("p", "dot", label(l)), el("p", "ko", l.law));
    a.append(html("span", "icon", ICON(l.no, "")), text); li.append(a); ul.append(li);
  });
  sec.append(ul); host.append(sec);
});
paras($("#closing"), D.closing);
const src = k => D.groups.find(g => g.key === k).source;
for (const [id, k] of [["#src-ux", "ux"], ["#src-walk", "walk"]]){ const a = $(id); a.href = src(k).url; a.target = "_blank"; a.rel = "noopener"; }

// ---------- 상세 ----------
const view = $("#law"), home = $("#home");
function showLaw(no){
  const l = D.laws.find(x => x.no === no); if (!l){ showHome(); return; }
  const g = groupOf(l);
  view.replaceChildren();
  const crumbs = el("p", "crumbs"); const h = el("a", null, "Home"); h.href = "#"; const gl = el("a", null, `${g.name} · ${g.title_en}`); gl.href = `#${g.key}`;
  crumbs.append(h, " / ", gl);
  const lab = el("div", "label"); lab.append(el("p", "dot", label(l)));
  const h1 = el("h1", null, l.law); h1.tabIndex = -1;
  view.append(crumbs, html("div", "icon", ICON(l.no, l.en)), lab, h1, el("p", "def", l.def_en));
  if (l.original.length){
    const cite = el("p", "cite"); const a = el("a", null, g.source.title); a.href = g.source.url; a.target = "_blank"; a.rel = "noopener";
    cite.append("> From the essay · ", a); view.append(cite);
  }
  const v = document.createElement("video");
  Object.assign(v, { src: l.video, muted: true, loop: true, playsInline: true, preload: "metadata" });
  v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("aria-label", `${l.en} motion`);
  if (reduce) v.controls = true; else v.autoplay = true;
  view.append(v);
  // 인스타용으로 만든 모션 중 이 원칙과 닿는 것
  for (const x of l.extra || []){
    const fig = el("figure", "extra"), ev = document.createElement("video");
    Object.assign(ev, { src: x.video, muted: true, loop: true, playsInline: true, preload: "metadata" });
    ev.setAttribute("muted", ""); ev.setAttribute("playsinline", ""); ev.setAttribute("aria-label", x.caption);
    if (reduce) ev.controls = true; else ev.autoplay = true;
    fig.append(ev, el("figcaption", "dot", x.caption)); view.append(fig);
  }
  if (l.original.length){ const body = el("div", "body"); body.lang = "ko"; paras(body, l.original); view.append(body); }
  const nx = D.laws.find(x => x.no === l.no + 1) || D.laws[0];
  const next = el("a", "next"); next.href = `#law-${String(nx.no).padStart(2, "0")}`;
  const t = el("div"); t.append(el("p", "dot", label(nx)), el("span", null, nx.no === 1 ? "Back to the first →" : "Next →"));
  next.append(html("span", "icon", ICON(nx.no, "")), t); view.append(next);
  home.hidden = true; view.hidden = false; window.TAEGEUK_PAUSE?.(true);
  document.title = `${label(l)} — The Principles of Tracé`;
  scrollTo(0, 0); h1.focus({ preventScroll: true });
}
function showHome(anchor){
  view.hidden = true; view.replaceChildren(); home.hidden = false; window.TAEGEUK_PAUSE?.(false);
  document.title = "The Principles of Tracé";
  if (anchor){ const t = document.getElementById(anchor); if (t) t.scrollIntoView(); } else scrollTo(0, 0);
}
function route(){ const h = location.hash.slice(1), m = /^law-(\d+)$/.exec(h); if (m) showLaw(Number(m[1])); else showHome(h || null); }
addEventListener("hashchange", route); route();
})();

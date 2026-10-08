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

// ---------- 테마: 라이트(아이보리) ↔ 다크 ----------
const themeBtn = $("#theme"), sysDark = matchMedia("(prefers-color-scheme: dark)");
const isDark = () => (document.documentElement.dataset.theme || (sysDark.matches ? "dark" : "light")) === "dark";
function paintTheme(){ const d = isDark(); themeBtn.textContent = d ? "Light" : "Dark"; themeBtn.setAttribute("aria-pressed", String(d));
  window.dispatchEvent(new Event("trace-theme")); }
themeBtn.addEventListener("click", () => { const t = isDark() ? "light" : "dark"; document.documentElement.dataset.theme = t;
  try { localStorage.setItem("trace-theme", t); } catch (e) {} paintTheme(); });
sysDark.addEventListener?.("change", paintTheme);
paintTheme();

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

// ---------- 유리 큐브 (02 Condense 상세): three.js와 cube.js는 이 페이지를 열 때만 불러온다 ----------
let cube = null;
const load = src => new Promise((ok, no) => { if (document.querySelector(`script[data-src="${src}"]`)) return ok();
  const sc = document.createElement("script"); sc.src = src; sc.dataset.src = src; sc.onload = ok; sc.onerror = no; document.head.append(sc); });
function cubeFigure(){
  const fig = el("figure", "extra cube"), stage = el("div", "cube-stage");
  stage.setAttribute("role", "img"); stage.setAttribute("aria-label", "Glass cubes that hold together when condensed and drift apart as the dots inside connect. Drag to rotate.");
  fig.append(stage, el("figcaption", "dot", "Condense ↔ Flow · drag to rotate"));
  load("vendor/three.min.js").then(() => load("cube.js")).then(() => {
    if (!stage.isConnected) return;
    cube = window.TRACE_CUBE(stage, { theme: isDark() ? "dark" : "light" });
  }).catch(() => fig.remove());
  return fig;
}
addEventListener("trace-theme", () => cube && cube.setTheme(isDark() ? "dark" : "light"));
const dropCube = () => { if (cube){ cube.destroy(); cube = null; } };

// ---------- 상세 ----------
// 모션 영상: 속성을 먼저 달고 src를 넣는다 (iOS 자동재생 조건). 정지 화면(poster)을 깔고,
// 자동재생이 막히면(저전력 모드 등) 재생 버튼을 보여준다.
function motion(src, poster, label){
  const v = document.createElement("video");
  v.muted = true; v.loop = true; v.playsInline = true; v.preload = "metadata";
  for (const a of ["muted", "playsinline", "loop"]) v.setAttribute(a, "");
  if (poster) v.poster = poster;
  v.setAttribute("aria-label", label);
  if (reduce) v.controls = true; else { v.autoplay = true; v.setAttribute("autoplay", ""); }
  v.src = src;
  if (!reduce) v.addEventListener("loadedmetadata", () => { const p = v.play(); if (p) p.catch(() => { v.controls = true; }); }, { once: true });
  return v;
}
const view = $("#law"), home = $("#home");
function showLaw(no){
  dropCube();
  const l = D.laws.find(x => x.no === no); if (!l){ showHome(); return; }
  const g = groupOf(l);
  view.replaceChildren();
  const crumbs = el("p", "crumbs"); const h = el("a", null, "Home"); h.href = "#"; const gl = el("a", null, `${g.name} · ${g.title_en}`); gl.href = `#${g.key}`;
  crumbs.append(h, " / ", gl);
  const lab = el("div", "label"); lab.append(el("p", "dot", label(l)));
  const h1 = el("h1", null, l.law); h1.tabIndex = -1;
  view.append(crumbs, html("div", "icon", ICON(l.no, l.en)), lab, h1, el("p", "def", l.def_en));
  if (l.original.length){
    const src = l.source || g.source, cite = el("p", "cite");
    let a = el("span", null, src.title);
    if (src.url){ a = el("a", null, src.title); a.href = src.url; a.target = "_blank"; a.rel = "noopener"; }
    cite.append("> From the essay · ", a); view.append(cite);
  }
  view.append(motion(l.video, l.poster, `${l.en} motion`));
  if (l.en === "Condense") view.append(cubeFigure());
  // 인스타용으로 만든 모션 중 이 원칙과 닿는 것
  for (const x of l.extra || []){
    const fig = el("figure", "extra"); fig.append(motion(x.video, x.poster, x.caption), el("figcaption", "dot", x.caption)); view.append(fig);
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
  dropCube();
  view.hidden = true; view.replaceChildren(); home.hidden = false; window.TAEGEUK_PAUSE?.(false);
  document.title = "The Principles of Tracé";
  if (anchor){ const t = document.getElementById(anchor); if (t) t.scrollIntoView(); } else scrollTo(0, 0);
}
function route(){ const h = location.hash.slice(1), m = /^law-(\d+)$/.exec(h); if (m) showLaw(Number(m[1])); else showHome(h || null); }
addEventListener("hashchange", route); route();
})();

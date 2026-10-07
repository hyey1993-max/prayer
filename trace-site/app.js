// 목록 그리기, 해시 라우팅(#law-01), 영상 재생 관리
(() => {
"use strict";
const D = window.TRACE;
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, "0");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const paras = (host, list) => list.forEach(t => t.split("\n").forEach(line => line.trim() && host.append(el("p", null, line))));

function video(src, { controls = false } = {}){
  const v = document.createElement("video");
  Object.assign(v, { src, muted: true, loop: true, playsInline: true, preload: "metadata" });
  v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
  if (controls || reduce) v.controls = true; else v.autoplay = true;
  v.setAttribute("aria-hidden", controls ? "false" : "true");
  return v;
}

// ---------- 목록 ----------
const host = $("#groups");
D.groups.forEach(g => {
  const sec = el("section", "group"); sec.id = g.key;
  const head = el("div", "group-head");
  const left = el("div"); left.append(el("p", "eyebrow", g.name), el("h2", null, g.title));
  const intro = el("div", "group-intro"); paras(intro, g.intro);
  head.append(left, intro); sec.append(head);
  const ul = el("ul", "rows");
  D.laws.filter(l => l.group === g.key).forEach(l => {
    const li = el("li"); const a = el("a", "row"); a.href = `#law-${pad(l.no)}`;
    const names = el("div", "names"); names.append(el("div", "en", l.en), el("div", "ko", l.ko), el("p", "def", l.def));
    const th = el("div", "thumb"); th.append(video(l.video));
    a.append(el("div", "num", pad(l.no)), names, th); li.append(a); ul.append(li);
  });
  sec.append(ul);
  if (g.outro.length){ const o = el("div", "outro"); paras(o, g.outro); sec.append(o); }
  host.append(sec);
});
paras($("#closing"), D.closing);
const srcUx = D.groups.find(g => g.key === "ux").source, srcWalk = D.groups.find(g => g.key === "walk").source;
$("#src-ux").href = srcUx.url; $("#src-walk").href = srcWalk.url;
[$("#src-ux"), $("#src-walk")].forEach(a => { a.target = "_blank"; a.rel = "noopener"; });

// 화면 밖 썸네일은 멈춘다
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
  const v = e.target; if (reduce) return; e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }), { rootMargin: "120px" }) : null;
if (io) document.querySelectorAll(".thumb video").forEach(v => io.observe(v));

// ---------- 상세 ----------
const lawView = $("#law"), home = $("#home");
function showLaw(no){
  const l = D.laws.find(x => x.no === no); if (!l){ showHome(); return; }
  const g = D.groups.find(x => x.key === l.group);
  lawView.replaceChildren();
  const back = el("a", "back", `← ${g.name} · ${g.title}`); back.href = `#${g.key}`;
  const grid = el("div", "law-grid");
  const media = el("div", "law-media"); media.append(video(l.video));
  const body = el("div", "law-body");
  body.append(el("div", "num", pad(l.no)), el("p", "en", l.en), el("h1", null, l.ko), el("p", "def", l.def));
  if (l.original.length){
    const orig = el("div", "original"); orig.append(el("p", "eyebrow", "원문"));
    paras(orig, l.original);
    const cite = el("p", "cite"); const a = el("a", null, g.source.title); a.href = g.source.url; a.target = "_blank"; a.rel = "noopener";
    cite.append("— ", a); orig.append(cite); body.append(orig);
  }
  const prev = D.laws.find(x => x.no === l.no - 1), next = D.laws.find(x => x.no === l.no + 1);
  const pager = el("nav", "pager"); pager.setAttribute("aria-label", "이전 다음 원칙");
  const mk = (x, dir) => { if (!x) return el("span"); const a = el("a", null, dir < 0 ? `← ${pad(x.no)} ${x.ko}` : `${pad(x.no)} ${x.ko} →`); a.href = `#law-${pad(x.no)}`; return a; };
  pager.append(mk(prev, -1), mk(next, 1)); body.append(pager);
  grid.append(media, body); lawView.append(back, grid);
  home.hidden = true; lawView.hidden = false; window.TAEGEUK_PAUSE?.(true);
  document.title = `${pad(l.no)} ${l.en} — The Principles of Tracé`;
  scrollTo(0, 0); body.querySelector("h1").setAttribute("tabindex", "-1"); body.querySelector("h1").focus({ preventScroll: true });
}
function showHome(anchor){
  lawView.hidden = true; lawView.replaceChildren(); home.hidden = false; window.TAEGEUK_PAUSE?.(false);
  document.title = "The Principles of Tracé";
  if (anchor){ const t = document.getElementById(anchor); if (t) t.scrollIntoView(); }
}
function route(){
  const h = location.hash.slice(1);
  const m = /^law-(\d+)$/.exec(h);
  if (m) showLaw(Number(m[1])); else showHome(h || null);
}
addEventListener("hashchange", route); route();
})();

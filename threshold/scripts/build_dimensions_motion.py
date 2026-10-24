#!/usr/bin/env python3
"""Dimensions of Tracé 모션: 16개 원칙의 층위가 하나씩 켜지고, 구가 천천히 돈다 (영어 + 한글).
글꼴을 넣은 한 장짜리 HTML을 만든다. 브라우저에서 열면 끌어서 돌릴 수 있고, capture_motion.js로 영상을 뽑는다.
  python3 scripts/build_dimensions_motion.py
  LOOPS=1 node scripts/capture_motion.js content/dimensions/dimensions_motion.html content/dimensions <ffmpeg> assets/fonts assets/fonts
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
F = ROOT / "assets" / "fonts"
b64 = lambda f: base64.b64encode((F / f).read_bytes()).decode()

HTML = r"""<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Dimensions of Tracé</title>
<style>
@font-face{font-family:IS;src:url(data:font/woff2;base64,__IS__) format("woff2")}
@font-face{font-family:GB;src:url(data:font/woff2;base64,__GB__) format("woff2")}
@font-face{font-family:SK;src:url(data:font/woff2;base64,__SK__) format("woff2")}
:root{--bg:#f6f1e6;--ink:#8a7650}
html,body{margin:0;background:var(--bg);color:var(--ink)}
body{display:grid;place-items:center;min-height:100vh;padding:16px;box-sizing:border-box}
canvas{width:min(100%,calc((100vh - 32px)*0.8));height:auto;aspect-ratio:4/5;touch-action:none;cursor:grab;display:block}
</style>
<canvas id=c width=1080 height=1350 role=img aria-label="Dimensions of Tracé: 16 principles placed on an axis, sphere, orbit, planes and hemispheres, slowly rotating. Drag to rotate."></canvas>
<script>
(() => {
"use strict";
const W = 1080, H = 1350, CX = 540, CY = 690, R = 318, PERIOD = 24;
const INK = "138,118,80", BG = "#f6f1e6";
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const seg = (t, a, b) => ease(clamp((t - a) / (b - a)));
const D = Math.PI / 180;
const vis = d => .28 + .67 * ease(clamp((d + .25) / .5));        // 앞 1, 뒤 .28: 경계에서 갑자기 바뀌지 않게

// ---------- 3차원 ----------
// 원: 중심 c, 서로 수직인 반지름 벡터 u, v. 점 = c + u cos a + v sin a
const rotX = (p, a) => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
const rotZ = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
function circle(r, tilt = p => p, y = 0){ return { c: [0, y, 0], u: tilt([r, 0, 0]), v: tilt([0, 0, r]) }; }
const at = (o, a) => [0, 1, 2].map(i => o.c[i] + o.u[i] * Math.cos(a) + o.v[i] * Math.sin(a));
let EL = .36;                                                   // 위에서 내려다보는 각도
function proj(p, th){ const q = rotY(p, th), y = q[1] * Math.cos(EL) - q[2] * Math.sin(EL), d = q[1] * Math.sin(EL) + q[2] * Math.cos(EL);
  return [CX + q[0] * R, CY - y * R, d]; }                       // d > 0: 앞쪽

const LAYERS = {
  ux:   circle(1, p => rotX(p, -3 * D)),                         // VI 화면의 평면 (적도)
  walk: circle(.52),                                             // V 걷는 사람의 평면
  map:  circle(1.03, p => rotX(rotZ(p, 22 * D), 8 * D)),         // III 지도의 궤도
  lab:  circle(1, p => rotY(rotZ(rotX(p, 90 * D), 28 * D), 40 * D)), // IV 라비린스의 길 (기운 자오선)
};
const NODES = [
  ["ux", 180, "Human Scale", "01 줄 세우지 않는다"], ["ux", 0, "Participation", "06 함께 짓는다"],
  ["ux", 120, "Sequence", "04 퍼널 대신 시퀀스"], ["ux", 60, "Low Threshold", "05 문턱은 낮게"],
  ["walk", 180, "No Destination", "07 목적지를 지운다"], ["walk", 0, "Aura", "10 지금 이 순간을 기록한다"],
  ["walk", 270, "Inner Map", "08 내면의 지도"], ["walk", 90, "Own Rhythm", "09 나만의 북소리"],
  ["map", 200, "No Ratings", "12 평점이 없다"], ["map", 290, "No Algorithm", "13 알고리즘이 고르지 않는다"],
  ["map", 25, "Context", "14 맥락을 남긴다"], ["map", 105, "Black Line", "15 검은 선으로 그린다"],
  ["lab", 70, "Labyrinth", "11 미로가 아니라 라비린스"],
  ["loop", 0, "Defamiliarize", "16 반복 속에서 낯설게 한다"],
];
const LOOP_P = (() => { const lat = 34 * D, lon = -50 * D; return [Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon)]; })();
// 켜지는 순서 (초)
const SHOW = { axis: [0, 1.4], loop: [1.2, 2.8], ux: [2.6, 4.6], walk: [4.4, 6.4], map: [6.2, 8.2], lab: [8, 10] };
const LEGEND = [["I.", "Axis of form · Condense ↔ Flow", "형태의 축 · 응축 ↔ 흐름", "axis"], ["II.", "Sphere of repetition · Loop", "반복의 구", "loop"],
  ["III.", "Orbit of the map", "지도의 궤도", "map"], ["IV.", "Path of the labyrinth", "라비린스의 길", "lab"],
  ["V.", "Plane of the walker", "걷는 사람의 평면", "walk"], ["VI.", "Plane of the screen · UX", "화면의 평면", "ux"],
  ["VII.", "Upper hemisphere · screen", "위 반구 · 화면 위의 건축", "hemi"], ["VIII.", "Lower hemisphere · street", "아래 반구 · 목적지 없는 걸음", "hemi"]];

// ---------- 그리기 ----------
function txt(g, s, x, y, font, a = 1, align = "center"){ g.font = font; g.textAlign = align; g.lineJoin = "round";
  g.globalAlpha = a; g.strokeStyle = BG; g.lineWidth = 7; g.strokeText(s, x, y); g.fillStyle = `rgb(${INK})`; g.fillText(s, x, y); g.globalAlpha = 1; }
function ring3(g, o, th, k, w = 2.2, dash = null){       // k: 0~1 그려진 만큼
  if (dash){                                                     // 점선 궤도: 원 위의 고정된 점들 (돌면서 무늬가 흔들리지 않게)
    const M = 130, m = Math.floor(M * k);
    for (let i = 0; i < m; i++){ const p = proj(at(o, i / M * 2 * Math.PI), th);
      g.fillStyle = `rgba(${INK},${vis(p[2])})`; g.beginPath(); g.arc(p[0], p[1], 1.7, 0, Math.PI * 2); g.fill(); }
    return; }
  const N = 160, n = Math.floor(N * k); g.lineWidth = w; g.setLineDash([]);
  for (let i = 0; i < n; i++){ const a = proj(at(o, i / N * 2 * Math.PI), th), b = proj(at(o, (i + 1) / N * 2 * Math.PI), th);
    g.strokeStyle = `rgba(${INK},${vis((a[2] + b[2]) / 2)})`; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
  g.setLineDash([]); }
function node(g, p, en, a, big){
  const v = vis(p[2]), al = a * v, r = (big ? 12 : 7) * (.8 + .2 * v);
  g.globalAlpha = al; g.fillStyle = BG; g.strokeStyle = `rgb(${INK})`; g.lineWidth = 2.2;
  g.beginPath(); g.arc(p[0], p[1], r, 0, Math.PI * 2); g.fill(); g.stroke(); g.globalAlpha = 1;
  txt(g, en, p[0], p[1] - r - 9, "400 17px SK, sans-serif", al);   // 이름은 늘 점 바로 위에 (좌우로 튀지 않게)
}

function render(g, t, th){
  g.setTransform(g.canvas.width / W, 0, 0, g.canvas.height / H, 0, 0);
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  t = ((t % PERIOD) + PERIOD) % PERIOD;
  const out = 1 - seg(t, PERIOD - 1.6, PERIOD - .2);              // 끝에서 사라졌다가 처음부터 다시 켜진다
  const k = key => seg(t, ...SHOW[key]) * out;
  txt(g, "Dimensions of Tracé", W / 2, 118, "italic 58px IS, serif");
  txt(g, "16 principles", W / 2, 152, "italic 22px IS, serif");
  // I 축
  const ka = k("axis"), top = CY - R - 60, bot = CY + R + 60;
  g.strokeStyle = `rgba(${INK},.9)`; g.lineWidth = 2; g.setLineDash([10, 9]);
  g.beginPath(); g.moveTo(CX, CY - (CY - top) * ka); g.lineTo(CX, CY + (bot - CY) * ka); g.stroke(); g.setLineDash([]);
  txt(g, "Condense", CX, top - 14, "italic 24px IS, serif", ka);
  txt(g, "Flow", CX, bot + 30, "italic 24px IS, serif", ka);
  // II 바깥 구
  const kl = k("loop");
  g.strokeStyle = `rgba(${INK},.9)`; g.lineWidth = 2; g.setLineDash([10, 9]);
  g.beginPath(); g.arc(CX, CY, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * kl); g.stroke(); g.setLineDash([]);
  // VII · VIII 반구
  const kh = seg(t, 9.6, 11) * out;
  txt(g, "VII. Upper hemisphere · Screen", CX + 150, CY - 200, "italic 19px IS, serif", kh * .8);
  txt(g, "VIII. Lower hemisphere · Street", CX + 150, CY + 232, "italic 19px IS, serif", kh * .8);
  // 원들
  ring3(g, LAYERS.map, th, k("map"), 2, [3, 7]);
  ring3(g, LAYERS.ux, th, k("ux"), 2.4);
  ring3(g, LAYERS.walk, th, k("walk"), 2.4);
  { const o = LAYERS.lab, kk = k("lab"), a0 = -20 * D, a1 = 160 * D, N = 90; g.lineWidth = 2.4;  // 라비린스: 반만 그린 길
    for (let i = 0; i < N * kk; i++){ const p = proj(at(o, a0 + (a1 - a0) * i / N), th), q = proj(at(o, a0 + (a1 - a0) * (i + 1) / N), th);
      g.strokeStyle = `rgba(${INK},${vis((p[2] + q[2]) / 2)})`; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); } }
  txt(g, "The Walker", CX, CY + 8, "italic 24px IS, serif", k("walk"));
  // 점과 이름: 뒤에 있는 것부터
  const pts = NODES.map(([layer, deg, en, ko]) => {
    const p = layer === "loop" ? proj(LOOP_P, th) : proj(at(LAYERS[layer], deg * D), th);
    return { p, en, a: k(layer), big: layer === "walk" }; }).sort((a, b) => a.p[2] - b.p[2]);
  pts.forEach(n => n.a > .01 && node(g, n.p, n.en, n.a, n.big));
  // 범례: 지금 켜지는 층위를 진하게
  const cur = Object.keys(SHOW).find(key => t >= SHOW[key][0] && t < SHOW[key][1]) || (t >= 9.6 && t < 11.5 ? "hemi" : "");
  LEGEND.forEach(([n, en, ko, key], i) => {
    const x = i < 4 ? 90 : 590, y = 1170 + (i % 4) * 28, a = cur ? (key === cur ? 1 : .35) : .85;
    txt(g, n, x, y, "400 15px SK, sans-serif", a, "left"); txt(g, en, x + 46, y, "400 15px SK, sans-serif", a, "left"); });
  g.fillStyle = `rgba(${INK},.6)`; g.fillRect(70, 1302, 940, 1);
  txt(g, "The Principles of Tracé", 70, 1330, "italic 19px IS, serif", 1, "left");
  txt(g, "@radiant_walks", 1010, 1330, "italic 19px IS, serif", 1, "right");
}
const spin = t => -t / PERIOD * Math.PI * 2 + 20 * D;               // 한 바퀴에 24초

window.TRACE_SCENES = { W, H, list: [{ group: "dimensions", en: "tracé", period: PERIOD }], renderAt(i, t, g){ render(g, t, spin(t)); } };
document.fonts && ["italic 40px IS", "400 20px GB", "400 20px SK"].forEach(f => document.fonts.load(f, "Tracé 원칙"));

// ---------- 화면에서 볼 때: 끌어서 돌린다 ----------
const cv = document.getElementById("c"), g = cv.getContext("2d"), reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
let t0 = performance.now(), extra = 0, drag = null;
cv.addEventListener("pointerdown", e => { drag = e.clientX; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
cv.addEventListener("pointermove", e => { if (drag === null) return; extra += (e.clientX - drag) * .008; drag = e.clientX; });
const up = () => { drag = null; cv.style.cursor = "grab"; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
function frame(now){ const t = reduce ? 12 : (now - t0) / 1000; render(g, t, spin(reduce ? 12 : t) + extra); requestAnimationFrame(frame); }
(document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(frame));
})();
</script>"""

out = ROOT / "content" / "dimensions" / "dimensions_motion.html"
out.write_text(HTML.replace("__IS__", b64("instrument-serif-latin-400-normal.woff2")).replace("__GB__", b64("gowun-batang-korean-400-normal.woff2"))
               .replace("__SK__", b64("noto-sans-kr-latin-400-normal.woff2")), encoding="utf-8")
print(out)

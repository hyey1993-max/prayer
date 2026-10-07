// 히어로 태극: 입자가 태극 자리로 돌아가려 하고, 흐름장이 양과 음을 서로 반대 방향으로 감는다.
// 끌면 소용돌이, 슬라이더는 응축(0) ↔ 역동(1). 문장은 에세이 원문 그대로.
// 표현은 Tyler Hobbs의 흐름장 작업(Fidenza 등)에서 영감을 받았다: 크림색 종이 위의 색 조각,
// 응축일 때는 점의 밭, 역동일 때는 흐름을 따라 늘어나는 짧은 선.
(() => {
"use strict";
const cv = document.getElementById("taegeuk"); if (!cv) return;
const g = cv.getContext("2d"), mixEl = document.getElementById("mix"), quoteEl = document.getElementById("quote");
const W = 1080, H = 1080, CX = 540, CY = 540, R = 400;
const N = matchMedia("(max-width: 600px)").matches ? 7000 : 12000;
const BG = [239, 231, 216], TILT = -0.62;                     // 크림색 종이
// 팔레트 [색, 비율]. 양: 따뜻한 빨강·분홍·황토, 음: 남색·청록·짙은 초록
const YANG = [["#d64a2f", .34], ["#ee9c8c", .22], ["#e3a73a", .2], ["#fbf7ee", .16], ["#7ec5b6", .08]];
const YIN  = [["#1f3a5f", .36], ["#2e6c68", .24], ["#203b32", .18], ["#2b2522", .14], ["#7ec5b6", .08]];
const QUOTES = [
  "이는 정제된 시스템 안으로 압축시켜 규칙을 만드는 일본의 ‘응축의 문화’와 닿아있다.",
  "음과 양이 서로를 밀어내고 끌어당기며 끊임없이 순환하는 태극의 ‘역동성’처럼, 유저의 시선과 동선은 인터페이스 위를 유연하게 흘러가야 한다.",
  "이것은 문화사적으로 음과 양의 에너지가 태극처럼 끊임없이 충돌하는 역동성을 나타낸다.",
];
const lerp = (a, b, k) => a + (b - a) * k, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
function rng(seed){ let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function isWhite(x, y){ const c = Math.cos(TILT), s = Math.sin(TILT), u = x*c - y*s, v = x*s + y*c;
  if (Math.hypot(u, v + R/2) < R/2) return false; if (Math.hypot(u, v - R/2) < R/2) return true; return u < 0; }

const P = new Float32Array(N*6), col = new Uint8Array(N);
const INKS = [...YANG, ...YIN].map(c => c[0]), ink = new Uint8Array(N);
const pick = (pal, off, u) => { for (let j = 0; j < pal.length; j++){ u -= pal[j][1]; if (u <= 0) return off + j; } return off + pal.length - 1; };
{ const r = rng(7);
  for (let i = 0; i < N; i++){ let x, y; do { x = (r()*2-1)*R; y = (r()*2-1)*R; } while (x*x + y*y > R*R);
    if (Math.hypot(x, y) > R*.82){ const e = 1 + (r()-.5)*.18; x *= e; y *= e; }
    col[i] = isWhite(x, y) ? 1 : 0; ink[i] = col[i] ? pick(YANG, 0, r()) : pick(YIN, YANG.length, r()); const o = i*6; P[o] = CX + x; P[o+1] = CY + y; P[o+4] = x; P[o+5] = y; } }

const st = { mix: .5, auto: true, t: 0, ptr: null, pv: [0, 0], paused: false, visible: true };
const autoMix = t => .5 - .5*Math.cos(2*Math.PI*t/18);
function autoPointer(t){ const k = (t % 18)/18; if (k < .30 || k > .62) return null;
  const u = (k-.30)/.32, a = u*Math.PI*2.2, s = Math.sin(a)*R*.55, c = Math.cos(TILT), sn = Math.sin(TILT);
  const lx = s*Math.cos(a*.5)*.9, ly = (u-.5)*R*1.6; return [CX + lx*c - ly*sn, CY + lx*sn + ly*c]; }

function step(){
  st.t += 1/60;
  if (st.auto){ st.mix = autoMix(st.t); const p = autoPointer(st.t); st.pv = p && st.ptr ? [p[0]-st.ptr[0], p[1]-st.ptr[1]] : [0, 0]; st.ptr = p; }
  const m = st.mix, spring = lerp(.022, .0018, m), flow = lerp(.06, 1.25, m), damp = lerp(.86, .94, m);
  const rot = st.t*lerp(.22, .55, m), cr = Math.cos(rot), sr = Math.sin(rot), t = st.t, ptr = st.ptr, pvx = st.pv[0], pvy = st.pv[1];
  for (let i = 0; i < N; i++){ const o = i*6; let x = P[o], y = P[o+1], vx = P[o+2], vy = P[o+3];
    vx += (CX + P[o+4]*cr - P[o+5]*sr - x)*spring; vy += (CY + P[o+4]*sr + P[o+5]*cr - y)*spring;
    const sign = col[i] ? 1 : -1, a = Math.sin(x*.0045 + t*.35)*2.1 + Math.cos(y*.0052 - t*.28)*2.1 + sign*.9;
    vx += Math.cos(a)*flow*.18; vy += Math.sin(a)*flow*.18;
    const dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy) + 1;
    vx += (-dy/d)*.05*(1+m)*sign; vy += (dx/d)*.05*(1+m)*sign;
    if (ptr){ const ex = x - ptr[0], ey = y - ptr[1], e = Math.hypot(ex, ey);
      if (e < 210){ const f = 1 - e/210; vx += (-ey/(e+1))*f*2.2 + pvx*f*.22; vy += (ex/(e+1))*f*2.2 + pvy*f*.22; } }
    vx *= damp; vy *= damp; P[o] = x + vx; P[o+1] = y + vy; P[o+2] = vx; P[o+3] = vy; }
}
let lastQ = -1;
function draw(clear){
  g.setTransform(cv.width/W, 0, 0, cv.height/H, 0, 0);
  g.fillStyle = `rgba(${BG},${clear ? 1 : .13})`; g.fillRect(0, 0, W, H);
  // 느릴 때는 둥근 점, 빠를 때는 흐름 방향으로 늘어난 색 조각
  const len = lerp(.25, 1, clamp(st.mix*1.6));                    // 응축 쪽일수록 점에 가깝게
  g.lineCap = "round"; g.lineWidth = lerp(4.2, 3.2, st.mix); g.globalAlpha = .82;
  for (let c = 0; c < INKS.length; c++){
    g.strokeStyle = INKS[c]; g.beginPath();
    for (let i = 0; i < N; i++){ if (ink[i] !== c) continue; const o = i*6, vx = P[o+2], vy = P[o+3], sp = Math.hypot(vx, vy), k = Math.min(5, sp*1.4)*len/(sp + 1e-3);
      g.moveTo(P[o], P[o+1]); g.lineTo(P[o] - vx*k*2.2 + .01, P[o+1] - vy*k*2.2); }
    g.stroke();
  }
  g.globalAlpha = 1;
  const q = st.mix < .34 ? 0 : st.mix > .66 ? 2 : 1;
  if (q !== lastQ && quoteEl){ quoteEl.textContent = QUOTES[q]; lastQ = q; }
  if (st.auto && mixEl) mixEl.value = Math.round(st.mix*100);
}

function setAuto(v){ st.auto = v; if (!v) st.ptr = null; }
mixEl?.addEventListener("input", () => { setAuto(false); st.mix = mixEl.value/100; if (reduce) { for (let i = 0; i < 3; i++) step(); draw(); } });
const toC = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left)/r.width*W, (e.clientY - r.top)/r.height*H]; };
let drag = false;
cv.addEventListener("pointerdown", e => { drag = true; setAuto(false); cv.setPointerCapture(e.pointerId); st.ptr = toC(e); st.pv = [0, 0]; });
cv.addEventListener("pointermove", e => { if (!drag) return; const p = toC(e); st.pv = [p[0]-st.ptr[0], p[1]-st.ptr[1]]; st.ptr = p; if (reduce){ step(); draw(); } });
const up = () => { drag = false; st.ptr = null; st.pv = [0, 0]; };
cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
cv.addEventListener("keydown", e => { if (e.key === "ArrowLeft" || e.key === "ArrowRight"){ setAuto(false);
  st.mix = clamp(st.mix + (e.key === "ArrowRight" ? .05 : -.05)); if (mixEl) mixEl.value = Math.round(st.mix*100); e.preventDefault(); } });

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
window.TAEGEUK_PAUSE = v => { st.paused = v; if (!v) kick(); };
if ("IntersectionObserver" in window) new IntersectionObserver(es => { st.visible = es[0].isIntersecting; if (st.visible) kick(); }).observe(cv);
let running = false, last = 0;
function frame(now){
  if (st.paused || !st.visible){ running = false; return; }
  const n = Math.max(1, Math.min(3, Math.round((now - last)/16.7) || 1)); last = now;
  for (let i = 0; i < n; i++) step(); draw(); requestAnimationFrame(frame);
}
function kick(){ if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
for (let i = 0; i < 120; i++) step();
draw(true);
if (reduce){ setAuto(false); st.mix = .5; for (let i = 0; i < 60; i++) step(); draw(true); } else kick();
})();

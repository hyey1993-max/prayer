// Dimensions of Tracé: 16개 원칙을 축·구·궤도·평면 위에 놓은 구. 보이면 층위가 차례로 켜지고 천천히 돈다.
// 끌면 돌아가고, 점을 누르면 그 원칙으로 간다. 색과 글꼴은 사이트 테마(--ink, --paper, --serif, --dot)를 따른다.
// 사용: TRACE_DIMENSIONS(host) → { destroy() }
(() => {
"use strict";
window.TRACE_DIMENSIONS = function (host) {
  const S = 900, CX = 450, CY = 470, R = 300, D = Math.PI / 180, EL = .36, TURN = 40;   // TURN초에 한 바퀴
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  const seg = (t, a, b) => ease(clamp((t - a) / (b - a)));
  const vis = d => .25 + .75 * ease(clamp((d + .25) / .5));     // 앞 1, 뒤 .25 (경계에서 서서히)

  // ---------- 3차원 ----------
  const rotX = (p, a) => [p[0], p[1] * Math.cos(a) - p[2] * Math.sin(a), p[1] * Math.sin(a) + p[2] * Math.cos(a)];
  const rotZ = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]];
  const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
  const circle = (r, tilt = p => p) => ({ u: tilt([r, 0, 0]), v: tilt([0, 0, r]) });
  const at = (o, a) => [0, 1, 2].map(i => o.u[i] * Math.cos(a) + o.v[i] * Math.sin(a));
  const proj = (p, th) => { const q = rotY(p, th);
    return [CX + q[0] * R, CY - (q[1] * Math.cos(EL) - q[2] * Math.sin(EL)) * R, q[1] * Math.sin(EL) + q[2] * Math.cos(EL)]; };
  const L = {
    ux: circle(1, p => rotX(p, -3 * D)),                                   // VI 화면의 평면
    walk: circle(.52),                                                     // V 걷는 사람
    map: circle(1.03, p => rotX(rotZ(p, 22 * D), 8 * D)),                  // III 지도의 궤도
    lab: circle(1, p => rotY(rotZ(rotX(p, 90 * D), 28 * D), 40 * D)),      // IV 라비린스의 길
  };
  const LOOP_P = [Math.cos(34 * D) * Math.cos(-50 * D), Math.sin(34 * D), Math.cos(34 * D) * Math.sin(-50 * D)];
  const NODES = [["ux", 180, 1, "Human Scale"], ["ux", 0, 6, "Participation"], ["ux", 120, 4, "Sequence"], ["ux", 60, 5, "Low Threshold"],
    ["walk", 180, 7, "No Destination"], ["walk", 0, 10, "Aura"], ["walk", 270, 8, "Inner Map"], ["walk", 90, 9, "Own Rhythm"],
    ["map", 200, 12, "No Ratings"], ["map", 290, 13, "No Algorithm"], ["map", 25, 14, "Context"], ["map", 105, 15, "Black Line"],
    ["lab", 70, 11, "Labyrinth"], ["loop", 0, 16, "Defamiliarize"]];
  const SHOW = { axis: [0, 1.2], loop: [1, 2.4], ux: [2.2, 3.8], walk: [3.6, 5.2], map: [5, 6.6], lab: [6.4, 8], hemi: [7.8, 9] };

  // ---------- 테마 ----------
  let C = {};
  function theme(){ const s = getComputedStyle(document.documentElement), hex = s.getPropertyValue("--ink").trim().replace("#", "");
    const n = parseInt(hex.length === 3 ? hex.replace(/./g, "$&$&") : hex, 16);
    C = { ink: `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`, paper: s.getPropertyValue("--paper").trim(),
          serif: s.getPropertyValue("--serif").trim() || "serif", dot: s.getPropertyValue("--dot").trim() || "monospace" }; }
  theme();

  // ---------- 캔버스 ----------
  const cv = document.createElement("canvas"), g = cv.getContext("2d");
  cv.setAttribute("role", "img"); cv.tabIndex = 0;
  cv.setAttribute("aria-label", "Dimensions of Tracé: the 16 principles placed on an axis, a sphere, an orbit and planes, slowly rotating. Drag to rotate, select a point to open its principle.");
  cv.style.cssText = "display:block;width:100%;height:auto;aspect-ratio:1;touch-action:pan-y;cursor:grab";
  host.append(cv);
  let F = 1;                                                     // 좁은 화면에서 글자를 키운다
  function size(){ const dpr = Math.min(2, devicePixelRatio || 1), w = host.clientWidth || S; cv.width = Math.round(w * dpr); cv.height = Math.round(w * dpr);
    F = clamp(S / w * .45, 1, 1.9); }
  const ro = "ResizeObserver" in window ? new ResizeObserver(size) : null; ro ? ro.observe(host) : addEventListener("resize", size); size();

  function txt(s, x, y, font, a = 1, align = "center"){ g.font = font.replace(/(\d+)px/, (m, n) => Math.round(n * F) + "px"); g.textAlign = align; g.lineJoin = "round"; g.globalAlpha = a;
    g.strokeStyle = C.paper; g.lineWidth = 6; g.strokeText(s, x, y); g.fillStyle = `rgb(${C.ink})`; g.fillText(s, x, y); g.globalAlpha = 1; }
  function ring(o, th, k, dots){
    if (dots){ const M = 130; for (let i = 0; i < Math.floor(M * k); i++){ const p = proj(at(o, i / M * 2 * Math.PI), th);
      g.fillStyle = `rgba(${C.ink},${vis(p[2])})`; g.beginPath(); g.arc(p[0], p[1], 1.6, 0, Math.PI * 2); g.fill(); } return; }
    const N = 160; g.lineWidth = 2;
    for (let i = 0; i < Math.floor(N * k); i++){ const a = proj(at(o, i / N * 2 * Math.PI), th), b = proj(at(o, (i + 1) / N * 2 * Math.PI), th);
      g.strokeStyle = `rgba(${C.ink},${vis((a[2] + b[2]) / 2)})`; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }

  let hits = [];
  function render(t, th){
    g.setTransform(cv.width / S, 0, 0, cv.height / S, 0, 0); g.clearRect(0, 0, S, S);
    const k = key => seg(t, ...SHOW[key]);
    const ka = k("axis"), top = CY - R - 50, bot = CY + R + 50;
    g.strokeStyle = `rgba(${C.ink},.85)`; g.lineWidth = 1.6; g.setLineDash([9, 8]);
    g.beginPath(); g.moveTo(CX, CY - (CY - top) * ka); g.lineTo(CX, CY + (bot - CY) * ka); g.stroke();
    g.beginPath(); g.arc(CX, CY, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k("loop")); g.stroke(); g.setLineDash([]);
    txt("02 · Condense", CX, top - 12, `italic 22px ${C.serif}`, ka); txt("03 · Flow", CX, bot + 28, `italic 22px ${C.serif}`, ka);
    const kh = k("hemi") * .75;
    txt("VII. Upper hemisphere · Screen", CX + 140, CY - 190, `italic 17px ${C.serif}`, kh);
    txt("VIII. Lower hemisphere · Street", CX + 140, CY + 222, `italic 17px ${C.serif}`, kh);
    ring(L.map, th, k("map"), true); ring(L.ux, th, k("ux")); ring(L.walk, th, k("walk"));
    { const o = L.lab, kk = k("lab"), a0 = -20 * D, a1 = 160 * D, N = 90; g.lineWidth = 2;
      for (let i = 0; i < N * kk; i++){ const p = proj(at(o, a0 + (a1 - a0) * i / N), th), q = proj(at(o, a0 + (a1 - a0) * (i + 1) / N), th);
        g.strokeStyle = `rgba(${C.ink},${vis((p[2] + q[2]) / 2)})`; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); } }
    txt("The Walker", CX, CY + 7, `italic 22px ${C.serif}`, k("walk"));
    hits = NODES.map(([layer, deg, no, en]) => ({ p: layer === "loop" ? proj(LOOP_P, th) : proj(at(L[layer], deg * D), th), no, en, a: k(layer), big: layer === "walk" }))
      .sort((a, b) => a.p[2] - b.p[2]);
    for (const n of hits){ if (n.a < .01) continue;
      const v = vis(n.p[2]), al = n.a * v, r = (n.big ? 11 : 7) * (.8 + .2 * v);
      g.globalAlpha = al; g.fillStyle = C.paper; g.strokeStyle = `rgb(${C.ink})`; g.lineWidth = 2;
      g.beginPath(); g.arc(n.p[0], n.p[1], r, 0, Math.PI * 2); g.fill(); g.stroke(); g.globalAlpha = 1;
      txt(`${String(n.no).padStart(2, "0")} ${n.en}`, n.p[0], n.p[1] - r - 6 * F, `400 14px ${C.dot}`, al); }
  }

  // ---------- 움직임, 입력 ----------
  const st = { t: reduce ? 99 : 0, th: 20 * D, drag: null, moved: 0, visible: false, alive: true, started: false };
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => { st.visible = es[0].isIntersecting; if (st.visible) st.started = true; }, { threshold: .25 }) : null;
  io ? io.observe(cv) : (st.visible = st.started = true);
  const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * S, (e.clientY - r.top) / r.height * S]; };
  const hit = ([x, y]) => [...hits].reverse().find(n => n.a > .5 && vis(n.p[2]) > .6 && Math.hypot(n.p[0] - x, n.p[1] - y) < 18);
  cv.addEventListener("pointerdown", e => { st.drag = e.clientX; st.moved = 0; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener("pointermove", e => {
    if (st.drag !== null){ const dx = e.clientX - st.drag; st.drag = e.clientX; st.moved += Math.abs(dx); st.th += dx * .008; cv.style.cursor = "grabbing"; return; }
    cv.style.cursor = hit(pos(e)) ? "pointer" : "grab"; });
  cv.addEventListener("pointerup", e => { const n = st.moved < 6 && hit(pos(e)); st.drag = null; cv.style.cursor = "grab";
    if (n) location.hash = `#law-${String(n.no).padStart(2, "0")}`; });
  cv.addEventListener("pointercancel", () => { st.drag = null; });
  cv.addEventListener("keydown", e => { if (e.key === "ArrowLeft") st.th -= .15; if (e.key === "ArrowRight") st.th += .15; });
  addEventListener("trace-theme", theme);

  let last = performance.now();
  function frame(now){ if (!st.alive) return; const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (st.visible || !io){ if (st.started && !reduce){ st.t += dt; if (st.drag === null) st.th -= dt / TURN * Math.PI * 2; } render(st.t, st.th); }
    requestAnimationFrame(frame); }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { render(st.t, st.th); requestAnimationFrame(frame); });

  return { destroy(){ st.alive = false; ro && ro.disconnect(); io && io.disconnect(); cv.remove(); } };
};
})();

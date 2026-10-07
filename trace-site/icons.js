// 원칙마다 점으로 찍은 아이콘 (25×25 격자). 각 아이콘은 모션 장면을 한 장으로 줄인 것이다.
(() => {
"use strict";
const S = 25;
function grid(){
  const on = new Set();
  const g = {
    dot(x, y){ x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < S && y < S) on.add(x + "," + y); return g; },
    line(x0, y0, x1, y1, gap = 1){ const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let i = 0; i <= n; i += gap) g.dot(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n); return g; },
    rect(x, y, w, h){ g.line(x, y, x + w, y).line(x + w, y, x + w, y + h).line(x + w, y + h, x, y + h).line(x, y + h, x, y); return g; },
    fill(x, y, w, h){ for (let i = 0; i <= w; i++) for (let j = 0; j <= h; j++) g.dot(x + i, y + j); return g; },
    circle(cx, cy, r, step = 1){ const n = Math.max(8, Math.round(2 * Math.PI * r / step)); for (let i = 0; i < n; i++){ const a = i / n * Math.PI * 2; g.dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } return g; },
    path(f, n){ for (let i = 0; i <= n; i++) { const [x, y] = f(i / n); g.dot(x, y); } return g; },
    on,
  };
  return g;
}
function rng(seed){ let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

const DRAW = {
  // 01 유저를 줄 세우지 않는다: 줄 서지 않고 흩어진 점들
  1: g => { const r = rng(3); for (let i = 0; i < 26; i++) g.dot(2 + r() * 20, 2 + r() * 20); g.fill(11, 11, 1, 1); },
  // 02 응축: 사방에서 모여 하나의 꽉 찬 사각형
  2: g => { g.fill(10, 10, 4, 4);
    g.line(12, 1, 12, 7).dot(11, 6).dot(13, 6); g.line(12, 23, 12, 17).dot(11, 18).dot(13, 18);
    g.line(1, 12, 7, 12).dot(6, 11).dot(6, 13); g.line(23, 12, 17, 12).dot(18, 11).dot(18, 13); },
  // 03 흐름: 모듈 사이를 지나는 곡선
  3: g => { g.rect(3, 3, 5, 4).rect(16, 17, 5, 4); g.path(u => [1 + u * 22, 12 + Math.sin(u * Math.PI * 2) * 7], 34); },
  // 04 시퀀스: 노드를 골라 잇는 길
  4: g => { const N = [[3, 19], [8, 9], [14, 15], [19, 5], [21, 19]];
    for (let i = 0; i < N.length - 1; i++) g.line(...N[i], ...N[i + 1], 2);
    N.forEach(([x, y]) => g.fill(x - 1, y - 1, 2, 2)); },
  // 05 낮은 문턱: 낮은 턱을 넘어가는 점
  5: g => { g.line(1, 19, 12, 19).line(12, 19, 12, 17).line(12, 17, 23, 17); g.fill(15, 12, 3, 3); g.line(3, 14, 9, 14, 2); },
  // 06 함께 짓는다: 격자를 하나씩 채움
  6: g => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ const x = 2 + i * 5.5, y = 2 + j * 5.5;
    if ((i * 7 + j * 3) % 5 < 3) g.fill(x, y, 3, 3); else g.rect(x, y, 3, 3); } },
  // 07 목적지를 지운다: 굽이치는 길과 멈춘 자리
  7: g => { const f = u => [1 + u * 22, 13 + Math.sin(u * Math.PI * 3) * 6]; g.path(f, 40);
    [.17, .5, .83].forEach(u => { const [x, y] = f(u); g.fill(x - 1, y - 1, 2, 2); }); },
  // 08 내면의 지도: 맴돌며 넓어지는 나선
  8: g => g.path(u => { const a = u * Math.PI * 5, r = 1 + u * 10.5; return [12 + Math.cos(a) * r, 12 + Math.sin(a) * r]; }, 90),
  // 09 나만의 북소리: 같은 박자의 줄과 다른 박자의 점 하나
  9: g => { for (let i = 0; i < 7; i++) g.fill(1 + i * 3.4, 4, 1, 1); g.path(u => [2 + u * 18, 17 + Math.sin(u * Math.PI * 2) * 3], 14); g.fill(20, 15, 2, 2); },
  // 10 지금 이 순간: 빛이 퍼지는 한 점
  10: g => { g.fill(10, 10, 4, 4); g.circle(12, 12, 6, 1.6);
    for (let i = 0; i < 12; i++){ const a = i / 12 * Math.PI * 2; g.dot(12 + Math.cos(a) * 9, 12 + Math.sin(a) * 9).dot(12 + Math.cos(a) * 11, 12 + Math.sin(a) * 11); } },
  // 11 평점이 없다: 지워진 별
  11: g => { const P = []; for (let i = 0; i < 10; i++){ const r = i % 2 ? 4.4 : 10, a = -Math.PI / 2 + i * Math.PI / 5; P.push([12 + Math.cos(a) * r, 12.5 + Math.sin(a) * r]); }
    for (let i = 0; i < 10; i++) g.line(...P[i], ...P[(i + 1) % 10]); g.line(2, 22, 22, 2); },
  // 12 알고리즘이 고르지 않는다: 많은 점 가운데 하나에 동그라미
  12: g => { const r = rng(9); for (let i = 0; i < 22; i++) g.dot(2 + r() * 20, 2 + r() * 20); g.fill(15, 7, 1, 1); g.circle(15.5, 7.5, 4); },
  // 13 맥락을 남긴다: 한 점과 네 모서리의 정보
  13: g => { g.fill(11, 11, 2, 2); [[2, 2, 1, 1], [22, 2, -1, 1], [2, 22, 1, -1], [22, 22, -1, -1]].forEach(([x, y, sx, sy]) => g.line(x, y, x + sx * 4, y).line(x, y, x, y + sy * 4));
    g.line(9, 9, 6, 6).line(15, 9, 18, 6).line(9, 15, 6, 18).line(15, 15, 18, 18); },
  // 14 검은 선으로 그린다: 최단 경로(점선) 옆으로 걸은 선
  14: g => { g.line(2, 22, 2, 2, 3).line(2, 2, 22, 2, 3);
    [[2, 22], [8, 22], [8, 17], [13, 17], [13, 12], [17, 12], [17, 7], [22, 7], [22, 3]].reduce((a, b) => (g.line(...a, ...b), b)); },
};
function svg(no, label){
  const g = grid(); (DRAW[no] || DRAW[1])(g);
  const dots = [...g.on].map(k => { const [x, y] = k.split(","); return `<circle cx="${+x + .5}" cy="${+y + .5}" r=".42"/>`; }).join("");
  return `<svg viewBox="0 0 ${S} ${S}" fill="currentColor" role="img" aria-label="${label || ""}">${dots}</svg>`;
}
window.TRACE_ICON = svg;
})();

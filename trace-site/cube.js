// 유리 큐브 인터랙션: 3×3×3 반투명 큐브가 응축(0)과 흐름(1) 사이를 오간다.
// 응축이면 하나의 덩어리, 흐름이면 몇 개가 빠져나와 떠다니고 큐브 안의 점들이 선으로 이어진다.
// 바닥은 천천히 일렁이는 점 지형. 끌면 돌아간다. three.js(r128)가 먼저 로드되어 있어야 한다.
// 사용: const c = TRACE_CUBE(host, { mix: .5, auto: true }); c.setMix(.7); c.setTheme("dark"|"light"); c.destroy();
(() => {
"use strict";
window.TRACE_CUBE = function (host, opt = {}) {
  const THREE = window.THREE; if (!THREE) return null;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const st = { mix: opt.mix ?? .5, auto: opt.auto ?? true, t: 0, rotY: -.6, rotX: -.42, vY: 0, vX: 0, drag: null, alive: true, visible: true };

  // ---------- 장면 ----------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  host.append(renderer.domElement); renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:none;cursor:grab";
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
  camera.position.set(0, 1.2, 11.5); camera.lookAt(0, -.2, 0);
  const world = new THREE.Group(); scene.add(world);
  const rand = (s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296))(11);

  // 큐브 27개: 면은 아주 옅게, 모서리는 밝게
  const S = 1, GAP = .05, box = new THREE.BoxGeometry(S, S, S), edges = new THREE.EdgesGeometry(box);
  const faceMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: .07, depthWrite: false, side: THREE.DoubleSide });
  const edgeMat = new THREE.LineBasicMaterial({ transparent: true, opacity: .55 });
  const POP = ["1,1,1", "1,-1,1", "-1,1,-1", "1,0,-1"];   // 흐름일 때 빠져나오는 큐브 (레퍼런스처럼 몇 개만)
  const cubes = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++){
    const g = new THREE.Group(); g.add(new THREE.Mesh(box, faceMat)); g.add(new THREE.LineSegments(edges, edgeMat));
    const home = new THREE.Vector3(x, y, z).multiplyScalar(S + GAP);
    // 바깥으로 빠져나갈 방향: 모서리·면에 있는 큐브 일부만, 바깥 방향으로
    const key = `${x},${y},${z}`, i = POP.indexOf(key);
    const drift = i >= 0 ? home.clone().normalize().multiplyScalar(1.15 + i * .22) : new THREE.Vector3();
    g.position.copy(home); world.add(g);
    cubes.push({ g, home, drift, phase: rand() * Math.PI * 2, spin: (rand() - .5) * .6 });
  }

  // 큐브 안의 점들 (각 큐브의 로컬 좌표), 가까운 점끼리 선
  const PER = 9, N = cubes.length * PER, local = new Float32Array(N * 3), owner = new Uint16Array(N), seed = new Float32Array(N);
  for (let i = 0; i < N; i++){ owner[i] = Math.floor(i / PER); seed[i] = rand() * 100;
    for (let k = 0; k < 3; k++) local[i * 3 + k] = (rand() - .5) * S * .8; }
  const dotPos = new Float32Array(N * 3), dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.BufferAttribute(dotPos, 3));
  const dotMat = new THREE.PointsMaterial({ size: .055, transparent: true, opacity: .9, depthWrite: false });
  world.add(new THREE.Points(dotGeo, dotMat));
  const MAXL = 900, linePos = new Float32Array(MAXL * 6), lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: .26, depthWrite: false });
  world.add(new THREE.LineSegments(lineGeo, lineMat));

  // 바닥: 점으로 된 물결 지형
  const GX = 90, GZ = 46, floorPos = new Float32Array(GX * GZ * 3), floorGeo = new THREE.BufferGeometry();
  floorGeo.setAttribute("position", new THREE.BufferAttribute(floorPos, 3));
  const floorMat = new THREE.PointsMaterial({ size: .03, transparent: true, opacity: .45, depthWrite: false });
  const floor = new THREE.Points(floorGeo, floorMat); floor.position.y = -2.6; scene.add(floor);

  // ---------- 테마 ----------
  function setTheme(t){
    const dark = t === "dark", ink = new THREE.Color(dark ? 0xf2f0ea : 0x1a1916);
    for (const m of [faceMat, edgeMat, dotMat, lineMat, floorMat]) m.color.copy(ink);
    const add = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
    for (const m of [dotMat, lineMat, floorMat]){ m.blending = add; m.needsUpdate = true; }
    faceMat.opacity = dark ? .07 : .025; edgeMat.opacity = dark ? .55 : .5; floorMat.opacity = dark ? .45 : .35;
  }
  setTheme(opt.theme || "dark");

  // ---------- 움직임 ----------
  const v = new THREE.Vector3(), q = new THREE.Vector3();
  function update(dt){
    st.t += dt; const t = st.t;
    if (st.auto) st.mix = .5 - .5 * Math.cos(t * 2 * Math.PI / 16);                 // 16초마다 응축 ↔ 흐름
    const m = st.mix * st.mix * (3 - 2 * st.mix);
    if (!st.drag){ st.rotY += dt * .12 + st.vY; st.rotX += st.vX; st.vY *= .93; st.vX *= .93; }
    st.rotX = Math.max(-1.1, Math.min(.3, st.rotX));
    world.rotation.set(st.rotX, st.rotY, 0);
    for (const c of cubes){
      const bob = Math.sin(t * .8 + c.phase) * .08 * m;
      c.g.position.copy(c.home).addScaledVector(c.drift, m).y += bob;
      c.g.rotation.set(0, c.spin * m, c.spin * .5 * m);
    }
    // 점: 큐브 안에서 천천히 떠다닌다
    for (let i = 0; i < N; i++){ const c = cubes[owner[i]].g, s = seed[i];
      v.set(local[i * 3] + Math.sin(t * .6 + s) * .08, local[i * 3 + 1] + Math.cos(t * .5 + s * 1.3) * .08, local[i * 3 + 2] + Math.sin(t * .7 + s * .7) * .08);
      v.applyEuler(c.rotation).add(c.position); dotPos[i * 3] = v.x; dotPos[i * 3 + 1] = v.y; dotPos[i * 3 + 2] = v.z; }
    dotGeo.attributes.position.needsUpdate = true;
    // 선: 응축이면 짧게(큐브 안), 흐름이면 길게(큐브 사이)
    const R = .5 + m * .38, R2 = R * R; let L = 0;
    for (let i = 0; i < N && L < MAXL; i++) for (let j = i + 1; j < N && L < MAXL; j++){
      const dx = dotPos[i * 3] - dotPos[j * 3], dy = dotPos[i * 3 + 1] - dotPos[j * 3 + 1], dz = dotPos[i * 3 + 2] - dotPos[j * 3 + 2];
      if (dx * dx + dy * dy + dz * dz < R2){ linePos.set([dotPos[i * 3], dotPos[i * 3 + 1], dotPos[i * 3 + 2], dotPos[j * 3], dotPos[j * 3 + 1], dotPos[j * 3 + 2]], L * 6); L++; } }
    lineGeo.setDrawRange(0, L * 2); lineGeo.attributes.position.needsUpdate = true;
    // 바닥 물결
    let k = 0;
    for (let ix = 0; ix < GX; ix++) for (let iz = 0; iz < GZ; iz++){ const x = (ix / (GX - 1) - .5) * 18, z = (iz / (GZ - 1) - .5) * 9;
      floorPos[k++] = x; floorPos[k++] = Math.sin(x * .55 + t * .5) * .22 + Math.cos(z * .8 - t * .4) * .18 + Math.sin((x + z) * .3 + t * .3) * .12; floorPos[k++] = z; }
    floorGeo.attributes.position.needsUpdate = true;
  }

  // ---------- 크기, 입력 ----------
  function resize(){ const w = host.clientWidth || 1, h = host.clientHeight || 1; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  const ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null; ro ? ro.observe(host) : addEventListener("resize", resize); resize();
  const cv = renderer.domElement;
  cv.addEventListener("pointerdown", e => { st.drag = [e.clientX, e.clientY]; cv.setPointerCapture(e.pointerId); cv.style.cursor = "grabbing"; });
  cv.addEventListener("pointermove", e => { if (!st.drag) return; const dx = e.clientX - st.drag[0], dy = e.clientY - st.drag[1];
    st.drag = [e.clientX, e.clientY]; st.rotY += dx * .006; st.rotX += dy * .004; st.vY = dx * .0015; st.vX = dy * .001; });
  const up = () => { st.drag = null; cv.style.cursor = "grab"; };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  const io = "IntersectionObserver" in window ? new IntersectionObserver(es => { st.visible = es[0].isIntersecting; }) : null; io && io.observe(host);

  let last = performance.now();
  function frame(now){ if (!st.alive) return; const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (st.visible){ update(reduce ? 0 : dt); renderer.render(scene, camera); } requestAnimationFrame(frame); }
  update(0); renderer.render(scene, camera); requestAnimationFrame(frame);

  return {
    setMix(x){ st.auto = false; st.mix = Math.max(0, Math.min(1, x)); },
    setAuto(a){ st.auto = a; },
    get mix(){ return st.mix; },
    setTheme,
    destroy(){ st.alive = false; ro && ro.disconnect(); io && io.disconnect(); renderer.dispose(); cv.remove(); },
  };
};
})();

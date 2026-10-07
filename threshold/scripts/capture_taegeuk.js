// 태극 인터랙션의 자동 재생 18초를 MP4(1080x1350, 30fps)로 뽑는다. 시뮬레이션은 60Hz 고정 스텝이라 매번 같은 영상이 나온다.
// 사용: node scripts/capture_taegeuk.js <html> <출력.mp4> <ffmpeg 경로> <폰트 폴더> [--frames 1,9,5]  (--frames: 해당 초의 정지 이미지만 출력)
// 필요: npm i playwright-core, pip install imageio-ffmpeg
const { chromium } = require("playwright-core");
const fs = require("fs"), { spawn, execSync } = require("child_process");
const [,, htmlPath, out, ffmpeg, fontDir, flag, list] = process.argv;
const b64 = f => fs.readFileSync(f).toString("base64");
const face = (fam, w, f) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${b64(`${fontDir}/${f}`)}) format("woff2")}`;
const fonts = face("Noto Sans KR",400,"noto-sans-kr-korean-400-normal.woff2") + face("Noto Sans KR",700,"noto-sans-kr-korean-900-normal.woff2")
  + face("IBM Plex Mono",400,"ibm-plex-mono-latin-400-normal.woff2");
const src = fs.readFileSync(htmlPath, "utf8").replace(/<link[^>]+fonts\.googleapis[^>]+>/, "");
(async () => {
  const exe = execSync("ls /opt/pw-browsers/chromium_headless_shell-*/*/headless_shell").toString().trim();
  const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(`<!doctype html><meta charset=utf-8><style>${fonts}</style><body>${src}`);
  await page.evaluate(async () => { await Promise.all(["400 30px 'Noto Sans KR'","700 30px 'Noto Sans KR'","400 20px 'IBM Plex Mono'"].map(f => document.fonts.load(f, "가Aé"))); });
  await page.evaluate(() => { const T = window.TAEGEUK; T.reset(7); window.__c = Object.assign(document.createElement("canvas"), { width: T.W, height: T.H });
    window.__g = window.__c.getContext("2d"); T.draw(window.__g, true); window.__sec = 0; });
  const frameAt = async sec => page.evaluate(sec => { const T = window.TAEGEUK; while (window.__sec < sec - 1e-6){ T.step(); window.__sec += 1/60; }
    T.draw(window.__g); return window.__c.toDataURL("image/jpeg", .92); }, sec);
  if (flag === "--frames"){
    for (const s of list.split(",").map(Number)){ fs.writeFileSync(out.replace(/\.mp4$/, `_${s}s.jpg`), Buffer.from((await frameAt(s)).split(",")[1], "base64")); }
  } else {
    // 앞 2초는 버려 잔상이 자리 잡게 하고, 18초 한 바퀴를 담는다
    await frameAt(2);
    const ff = spawn(ffmpeg, ["-y","-loglevel","error","-f","image2pipe","-framerate","30","-c:v","mjpeg","-i","-","-c:v","libx264","-pix_fmt","yuv420p","-crf","27","-preset","slow","-movflags","+faststart", out]);
    for (let f = 1; f <= 18*30; f++){ const url = await frameAt(2 + f/30);
      if (!ff.stdin.write(Buffer.from(url.split(",")[1], "base64"))) await new Promise(r => ff.stdin.once("drain", r)); }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
  }
  await browser.close();
})();

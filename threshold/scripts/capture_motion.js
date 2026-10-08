// 원칙 모션을 장면별 MP4(1080x1350, 30fps, 2회 반복)로 뽑는다.
const { chromium } = require("playwright-core");
const fs = require("fs"), path = require("path"), { spawn } = require("child_process");
// 사용: node scripts/capture_motion.js <html> <출력폴더> <ffmpeg 경로> assets/fonts assets/fonts
// 필요: npm i playwright-core, pip install imageio-ffmpeg (libx264 포함 ffmpeg)
const [,, htmlPath, outDir, ffmpeg, fontDir, plexDir] = process.argv;
const b64 = f => fs.readFileSync(f).toString("base64");
const face = (fam, w, f) => `@font-face{font-family:"${fam}";font-weight:${w};src:url(data:font/woff2;base64,${b64(f)}) format("woff2")}`;
const fonts = [
  face("Noto Sans KR", 400, `${fontDir}/noto-sans-kr-korean-400-normal.woff2`),
  face("Noto Sans KR", 400, `${fontDir}/noto-sans-kr-latin-400-normal.woff2`).replace("}", ";unicode-range:U+0000-00FF,U+2000-206F}"),
  face("Noto Sans KR", 700, `${fontDir}/noto-sans-kr-korean-900-normal.woff2`),
  face("Noto Sans KR", 900, `${fontDir}/noto-sans-kr-latin-900-normal.woff2`).replace("}", ";unicode-range:U+0000-00FF,U+2000-206F}"),
  face("Noto Sans KR", 900, `${fontDir}/noto-sans-kr-korean-900-normal.woff2`),
  face("IBM Plex Mono", 400, `${plexDir}/ibm-plex-mono-latin-400-normal.woff2`),
  face("IBM Plex Mono", 500, `${plexDir}/ibm-plex-mono-latin-600-normal.woff2`),
].join("");
const src = fs.readFileSync(htmlPath, "utf8").replace(/<link[^>]+fonts\.googleapis[^>]+>/, "");
// LAW_EN=trace-site/data.js 를 주면 원칙마다 영어 한 문장을 한글 원칙과 함께 넣는다 (사이트용)
let pre = "";
if (process.env.LAW_EN){ const d = JSON.parse(fs.readFileSync(process.env.LAW_EN, "utf8").replace(/^window\.TRACE = /, "").replace(/;\s*$/, ""));
  pre = `<script>window.TRACE_LAW_EN = ${JSON.stringify(Object.fromEntries(d.laws.map(l => [l.en, l.law])))}</script>`; }
const html = `<!doctype html><meta charset=utf-8><style>${fonts}</style>${pre}<body>${src}`;
(async () => {
  const exe = require("child_process").execSync("ls /opt/pw-browsers/chromium_headless_shell-*/*/headless_shell").toString().trim();
  const browser = await chromium.launch({ executablePath: exe, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html);
  await page.evaluate(async () => { await Promise.all(["900 40px 'Noto Sans KR'","400 40px 'Noto Sans KR'","400 20px 'IBM Plex Mono'"].map(f=>document.fonts.load(f, "가Aé"))); await document.fonts.ready; });
  const list = await page.evaluate(() => window.TRACE_SCENES.list);
  for (let i = 0; i < list.length; i++) {
    const sc = list[i], fps = 30, n = Math.round(sc.period * fps * 2);
    const name = `${String(i + 1).padStart(2, "0")}_${sc.group.toLowerCase()}_${sc.en.toLowerCase().replace(/\s+/g, "_")}.mp4`;
    const ff = spawn(ffmpeg, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "-",
      "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-movflags", "+faststart", path.join(outDir, name)]);
    for (let f = 0; f < n; f++) {
      const url = await page.evaluate(([i, t]) => { const c = window.__off || (window.__off = Object.assign(document.createElement("canvas"), { width: 1080, height: 1350 }));
        window.TRACE_SCENES.renderAt(i, t, c.getContext("2d")); return c.toDataURL("image/jpeg", 0.93); }, [i, f / fps]);
      if (!ff.stdin.write(Buffer.from(url.split(",")[1], "base64"))) await new Promise(r => ff.stdin.once("drain", r));
    }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
    console.log(name, n, "frames");
  }
  await browser.close();
})();

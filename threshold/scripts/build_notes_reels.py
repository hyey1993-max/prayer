#!/usr/bin/env python3
"""Tracé Notes · 반복과 진전: 장면 영상(9:16)을 묶어 릴스 4편을 만든다.
처음 카드 → 장면들 → 끝 카드(질문). 장면은 capture_motion.js 로 LOOPS=1 로 뽑은 것.
  LOOPS=1 node scripts/capture_motion.js content/motion/repetition_motion.html content/motion/mp4_notes <ffmpeg> assets/fonts assets/fonts
  python3 scripts/render_cards.py content/motion/notes_repetition/series.json
  python3 scripts/build_notes_reels.py
"""
import glob, re, subprocess
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
CLIPS = ROOT / "content" / "motion" / "mp4_notes"
CARDS = ROOT / "content" / "motion" / "notes_repetition" / "cards"
OUT = ROOT / "content" / "motion" / "mp4"
FF = imageio_ffmpeg.get_ffmpeg_exe()
REELS = {"reel1_stairs": "stairs", "reel2_loops": "loops", "reel3_accumulate": "accumulate", "reel4_difference": "difference"}   # 카드 세트: 장면 묶음
INTRO, OUTRO, FADE = 2.0, 3.2, .3


def dur(mp4):
    s = subprocess.run([FF, "-i", mp4], capture_output=True, text=True).stderr
    h, m, sec = re.search(r"Duration: (\d+):(\d+):([\d.]+)", s).groups()
    return int(h) * 3600 + int(m) * 60 + float(sec)


for name, group in REELS.items():
    clips = sorted(glob.glob(str(CLIPS / f"[0-9][0-9]_{group}_*.mp4")))
    durs = [INTRO] + [dur(c) for c in clips] + [OUTRO]
    args = [FF, "-y", "-loglevel", "error", "-loop", "1", "-t", str(INTRO), "-i", str(CARDS / name / "01.jpg")]
    for c in clips:
        args += ["-i", c]
    args += ["-loop", "1", "-t", str(OUTRO), "-i", str(CARDS / name / "02.jpg")]
    parts = [f"[{i}:v]scale=1080:1920,fps=30,format=yuv420p,setsar=1,fade=in:st=0:d={FADE},fade=out:st={d - FADE:.2f}:d={FADE}[v{i}]"
             for i, d in enumerate(durs)]
    graph = ";".join(parts) + ";" + "".join(f"[v{i}]" for i in range(len(durs))) + f"concat=n={len(durs)}:v=1:a=0[out]"
    out = OUT / f"notes_{name}_9x16.mp4"
    subprocess.run(args + ["-filter_complex", graph, "-map", "[out]", "-c:v", "libx264", "-crf", "22", "-preset", "slow",
                           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)], check=True)
    print(f"{out.name}: 장면 {len(clips)}개, {sum(durs):.1f}초")

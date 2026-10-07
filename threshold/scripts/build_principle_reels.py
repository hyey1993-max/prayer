#!/usr/bin/env python3
"""원칙 모션(4:5)을 묶어 9:16 릴스 3개(UX 6 / 산책 4 / 지도 4)를 만든다.
처음 카드 → 원칙마다 모션 한 바퀴 전체 → 끝 카드. 4:5 영상은 9:16 가운데에 둔다 (위아래는 릴스 UI가 덮는 자리).
먼저 카드를 그린다: python3 scripts/render_cards.py content/motion/reels/series.json
사용법: python3 scripts/build_principle_reels.py
필요: pip install imageio-ffmpeg
"""
import glob, re, subprocess
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parent.parent
MP4 = ROOT / "content" / "motion" / "mp4"
CARDS = ROOT / "content" / "motion" / "reels" / "cards"
FF = imageio_ffmpeg.get_ffmpeg_exe()
BG = "0x0c0b0e"                 # 원칙 모션 바탕색
REELS = {"principles_ux": "ux", "principles_walk": "walk", "principles_map": "map"}   # 이름: 원칙 영상 접두어
INTRO, OUTRO, FADE = 1.8, 2.4, .25


def loop_len(mp4):
    """원칙 모션은 한 바퀴를 두 번 담는다 → 영상 길이의 절반이 한 바퀴. 잘리지 않게 한 바퀴를 통째로 쓴다."""
    out = subprocess.run([FF, "-i", mp4], capture_output=True, text=True).stderr
    h, m, s = re.search(r"Duration: (\d+):(\d+):([\d.]+)", out).groups()
    return (int(h) * 3600 + int(m) * 60 + float(s)) / 2


def build(name, group):
    clips = sorted(glob.glob(str(MP4 / f"[0-9][0-9]_{group}_*.mp4")))
    secs = [loop_len(c) for c in clips]
    intro, outro = CARDS / name / "01.jpg", CARDS / name / "02.jpg"
    args, parts = [FF, "-y", "-loglevel", "error"], []
    args += ["-loop", "1", "-t", str(INTRO), "-i", str(intro)]
    for c, sec in zip(clips, secs):
        args += ["-t", str(sec), "-i", c]
    args += ["-loop", "1", "-t", str(OUTRO), "-i", str(outro)]
    durs = [INTRO] + secs + [OUTRO]
    for i, d in enumerate(durs):
        fit = "scale=1080:1920" if i in (0, len(durs) - 1) else f"pad=1080:1920:0:(1920-ih)/2:color={BG}"
        parts.append(f"[{i}:v]{fit},fps=30,format=yuv420p,setsar=1,"
                     f"fade=in:st=0:d={FADE},fade=out:st={d - FADE:.2f}:d={FADE}[v{i}]")
    graph = ";".join(parts) + ";" + "".join(f"[v{i}]" for i in range(len(durs))) + f"concat=n={len(durs)}:v=1:a=0[out]"
    out = MP4 / f"reel_{name}_9x16.mp4"
    args += ["-filter_complex", graph, "-map", "[out]", "-c:v", "libx264", "-crf", "22", "-preset", "slow",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
    subprocess.run(args, check=True)
    print(f"{out.name}: 원칙 {len(clips)}개, {sum(durs):.1f}초")


for name, group in REELS.items():
    build(name, group)

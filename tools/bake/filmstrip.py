#!/usr/bin/env python3
"""Lay a baked atlas out frame by frame for review by eye. Owner: Animations.

    python3 tools/bake/filmstrip.py <atlas manifest .json> [-o out.png] [--clips attack,cast]
    python3 tools/bake/filmstrip.py --sweep <sweep png> [-o out.png]

One band per clip, one row per baked direction. Under every frame of a timed
clip (attack, cast, brand, magic) a bar shows its phase from
src/data/move_timing.json: grey wind-up, gold contact, dim recovery. The
contact frame is boxed. The guard pose (idle frame 0) is drawn faintly at both
ends of every band so a pop between clips is visible.

Why a picture and not a score: Blacktop's four motion metrics each agreed with
themselves and were wrong; the filmstrip settled it. Pick contact frames here.
"""
import argparse
import json
import pathlib
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
BG = (24, 20, 30, 255)
INK = (232, 226, 240, 255)
MUTED = (150, 140, 165, 255)
PH = {"startup": (130, 124, 140, 255), "active": (242, 184, 75, 255), "recovery": (80, 74, 92, 255)}
SCALE = 2
PAD = 8


def font(sz):
    for f in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/dejavu/DejaVuSans.ttf"):
        if pathlib.Path(f).exists():
            return ImageFont.truetype(f, sz)
    return ImageFont.load_default()


def phase_of(entry, frame):
    for ph in ("startup", "active", "recovery"):
        if frame in entry["art"][ph]:
            return ph
    return None


def timed_entry(timing, cls, clip):
    from_cls = timing["moves"].get(cls) or {}
    for k, e in from_cls.items():
        if isinstance(e, dict) and e.get("clip") == clip:
            return e
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("manifest", nargs="?")
    ap.add_argument("-o", "--out")
    ap.add_argument("--clips")
    ap.add_argument("--sweep")
    a = ap.parse_args()
    f_lbl, f_sm = font(14), font(11)

    if a.sweep:
        strip = Image.open(a.sweep).convert("RGBA")
        cw, ch = 96, strip.height
        n = strip.width // cw
        W, H = n * (cw * SCALE + PAD) + PAD, ch * SCALE + 44
        im = Image.new("RGBA", (W, H), BG)
        d = ImageDraw.Draw(im)
        for i in range(n):
            c = strip.crop((i * cw, 0, (i + 1) * cw, ch)).resize((cw * SCALE, ch * SCALE), Image.NEAREST)
            x = PAD + i * (cw * SCALE + PAD)
            im.alpha_composite(c, (x, 8))
            d.text((x + 4, ch * SCALE + 14), f"{i}  @{i / max(1, n - 1):.2f}", fill=INK, font=f_sm)
        out = pathlib.Path(a.out or pathlib.Path(a.sweep).with_name(pathlib.Path(a.sweep).stem + "_strip.png"))
        im.save(out)
        print(f"-> {out}")
        return 0

    man_path = pathlib.Path(a.manifest)
    man = json.loads(man_path.read_text())
    timing = json.loads((ROOT / "src/data/move_timing.json").read_text())
    cls = (man.get("class") or "commander").lower().replace(" ", "_")
    if man.get("sheet") == "commander":
        cls = "commander"
    sheet = np.array(Image.open(man_path.with_name(man["files"]["col"])).convert("RGBA"))
    cw, ch = man["cell"]["w"], man["cell"]["h"]
    rows = man["rows"]
    clips = a.clips.split(",") if a.clips else list(man["clips"].keys())
    guard_col = man["clips"]["idle"]["start"]

    def cellimg(r, c, alpha=1.0):
        arr = sheet[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw].copy()
        if alpha < 1:
            arr[..., 3] = (arr[..., 3] * alpha).astype(np.uint8)
        return Image.fromarray(arr, "RGBA").resize((cw * SCALE, ch * SCALE), Image.NEAREST)

    cellw, cellh = cw * SCALE, ch * SCALE
    maxf = max(man["clips"][c]["frames"] for c in clips) + 2
    W = 150 + maxf * (cellw + PAD) + PAD
    bandh = 28 + rows * (cellh + 22)
    H = 40 + bandh * len(clips)
    im = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(im)
    tag = "  TEST FIXTURE" if man.get("fixture") else ""
    d.text((PAD, 10), f"{man['id']} · {man.get('class') or 'commander'} · {cw}x{ch} cells · {man['decodedMB']} MB{tag}", fill=INK, font=f_lbl)
    y = 40
    for clip in clips:
        info = man["clips"][clip]
        e = timed_entry(timing, cls, clip)
        head = clip
        if e:
            head += f"   {e['su']}+{e['ac']}+{e['rc']} f, contact = frame {e['art']['active'][0]} ({e['contact']})"
        d.text((PAD, y + 4), head, fill=INK, font=f_lbl)
        y += 28
        for r in range(rows):
            d.text((PAD, y + cellh // 2), man["directions"][r], fill=MUTED, font=f_sm)
            x = 150
            im.alpha_composite(cellimg(r, guard_col, 0.35), (x, y))
            d.text((x + 4, y + cellh + 3), "guard", fill=MUTED, font=f_sm)
            x += cellw + PAD
            for i in range(info["frames"]):
                im.alpha_composite(cellimg(r, info["start"] + i), (x, y))
                d.rectangle([x, y, x + cellw - 1, y + cellh - 1], outline=(60, 54, 70, 255))
                ph = phase_of(e, i) if e else None
                if ph:
                    d.rectangle([x, y + cellh + 1, x + cellw - 1, y + cellh + 5], fill=PH[ph])
                    if ph == "active":
                        d.rectangle([x - 2, y - 2, x + cellw + 1, y + cellh + 1], outline=PH["active"], width=2)
                at = (man.get("samples") or {}).get(clip)
                lab = f"{i}" + (f" @{at[i]:.2f}" if at else "")
                d.text((x + 4, y + cellh + 7), lab, fill=INK, font=f_sm)
                x += cellw + PAD
            im.alpha_composite(cellimg(r, guard_col, 0.35), (x, y))
            y += cellh + 22
    out = pathlib.Path(a.out or man_path.with_name(man["id"] + "_filmstrip.png"))
    im.save(out)
    print(f"-> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

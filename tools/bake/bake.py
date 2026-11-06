#!/usr/bin/env python3
"""Bake one fighter into its sprite atlas. Owner: Animations.

    python3 tools/bake/bake.py tools/bake/specs/<id>.json [--out DIR]
    python3 tools/bake/bake.py <spec> --sweep <animation> [--n 20] [--row 0]

Steps (each one refuses to continue on a bad result rather than guessing):
  1. Godot renders every cell of the sheet (tools/bake/godot/bake.gd)
  2. cells are assembled into one lossless WebP per pass, 3 rows x N frames
  3. checks on the assembled sheet, then a manifest beside it

Output for a fighter:   <out>/<id>.webp  <out>/<id>.json
Output for a commander: <out>/<id>.webp  <out>/<id>_mask.webp  <out>/<id>.json
Default <out> is assets/atlases/ for a spec with "ship": true, otherwise a
scratch folder (fixtures and tests never land in the shipping folder).

Ported from Blacktop Aether tools/bake_roster.sh + tools/bake/assemble_atlas.py.
Kept: lossless only, binary alpha, refuse an empty or colourless sheet, verify
the WebP round trip on every pixel the engine reads. New: fixed world scale,
3 directions, clipped-art warning, and the guard-pose pop check.
"""
import argparse
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[2]
GODOT_DIR = ROOT / "tools/bake/godot"
LAYOUT = pathlib.Path(os.environ.get("BP_LAYOUT") or ROOT / "assets/atlases/layout.json")
PART_IDS = [0, 64, 128, 192, 255]


def find_godot():
    env = os.environ.get("GODOT")
    if env and pathlib.Path(env).is_file():
        return pathlib.Path(env)
    for base in (pathlib.Path("/tmp/claude-0"), pathlib.Path.home()):
        for p in base.glob("**/Godot_v4.3-stable_linux.x86_64"):
            if p.is_file():
                return p
    for name in ("godot4", "godot"):
        w = shutil.which(name)
        if w:
            return pathlib.Path(w)
    raise SystemExit(
        "godot 4.3 not found. Download Godot_v4.3-stable_linux.x86_64.zip from the "
        "godotengine/godot GitHub releases and set GODOT=/path/to/binary.")


def resolve_spec(spec_path, cells):
    """Expand ${VARS} and relative paths (against the repo root), and stage
    only the clips a spec names, so Godot never scans a whole library."""
    spec = json.loads(pathlib.Path(spec_path).read_text())
    env = dict(os.environ)
    env.setdefault("BLACKTOP", str(ROOT.parent / "blacktop-aether"))

    def res(v):
        for k, val in env.items():
            v = v.replace("${" + k + "}", val)
        p = pathlib.Path(v)
        return str(p if p.is_absolute() else (ROOT / p).resolve())
    cells.mkdir(parents=True, exist_ok=True)
    for k in ("model", "part_map", "clips_dir"):
        if spec.get(k):
            spec[k] = res(spec[k])
    for pr in spec.get("props", []):
        pr["file"] = res(pr["file"])
    if spec.get("clip_files"):
        cd = cells / "clips"
        cd.mkdir(exist_ok=True)
        for f in spec["clip_files"]:
            src = pathlib.Path(res(f))
            if not src.exists():
                raise SystemExit(f"refusing: clip file not found: {src}")
            shutil.copy(src, cd / src.name)
        spec["clips_dir"] = str(cd)
    if not pathlib.Path(spec["model"]).exists():
        raise SystemExit(f"refusing: model not found: {spec['model']}")
    out = cells / "spec.resolved.json"
    out.write_text(json.dumps(spec, indent=2))
    return out


def run_godot(spec_path, out, extra=()):
    godot = find_godot()
    # Godot reads res:// relative to the project; the layout is copied in so
    # the bake and every other reader see the same file.
    shutil.copy(LAYOUT, GODOT_DIR / "layout.json")
    cmd = [str(godot), "--rendering-driver", "opengl3", "--path", str(GODOT_DIR),
           "--script", "bake.gd", "--quit-after", "200000", "--",
           "--layout=res://layout.json", f"--spec={spec_path}", f"--out={out}", *extra]
    if shutil.which("xvfb-run") and not os.environ.get("DISPLAY"):
        cmd = ["xvfb-run", "-a", *cmd]
    log = pathlib.Path(out) / "godot.log"
    pathlib.Path(out).mkdir(parents=True, exist_ok=True)
    with open(log, "w") as fh:
        r = subprocess.run(cmd, stdout=fh, stderr=subprocess.STDOUT, timeout=1800)
    text = log.read_text(errors="replace")
    for line in text.splitlines():
        if line.startswith(("  [", "    ", "BAKE", "  - ", "Godot")) and "SCRIPT ERROR" not in line:
            print(line)
    errors = [l for l in text.splitlines() if "SCRIPT ERROR" in l or "Parse Error" in l]
    if errors:
        print("\n".join(errors[:8]))
    if r.returncode != 0 or "BAKE PASSED" not in text:
        raise SystemExit(f"godot bake failed (exit {r.returncode}); full log: {log}")


def assemble(cells_dir, layout, clips, pass_name):
    cw, ch = layout["cell"]["w"], layout["cell"]["h"]
    rows = len(layout["directions"])
    cols = sum(layout["clips"][c]["frames"] for c in clips)
    sheet = np.zeros((rows * ch, cols * cw, 4), np.uint8)
    missing = []
    for r in range(rows):
        for c in range(cols):
            p = pathlib.Path(cells_dir) / pass_name / f"r{r}c{c}.png"
            if not p.exists():
                missing.append((r, c))
                continue
            img = Image.open(p).convert("RGBA")
            if img.size != (cw, ch):
                raise SystemExit(f"refusing: {p.name} is {img.size}, not {cw}x{ch}; the grid would index wrong")
            sheet[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw] = np.array(img)
    if missing:
        raise SystemExit(f"refusing: {len(missing)} cell(s) never rendered, first {missing[:5]}")
    return sheet


def cell(sheet, layout, r, c):
    cw, ch = layout["cell"]["w"], layout["cell"]["h"]
    return sheet[r * ch:(r + 1) * ch, c * cw:(c + 1) * cw]


def check_sheet(sheet, layout, clips, pass_name, warns, untextured_fixture=False):
    cov = sheet[..., 3] > 0
    # An empty sheet must never pass (Blacktop: two characters shipped a full
    # set of transparent cells and every file-count check called it done).
    if not cov.any():
        raise SystemExit("refusing: the sheet is entirely transparent; read godot.log for skinning errors")
    alpha = set(np.unique(sheet[..., 3]).tolist())
    if not alpha <= {0, 255}:
        raise SystemExit(f"refusing: alpha is not binary {sorted(alpha)[:6]}...; antialiasing is on somewhere")
    cw, ch = layout["cell"]["w"], layout["cell"]["h"]
    col0 = 0
    for clip in clips:
        for i in range(layout["clips"][clip]["frames"]):
            for r in range(len(layout["directions"])):
                a = cell(sheet, layout, r, col0 + i)[..., 3] > 0
                if not a.any():
                    raise SystemExit(f"refusing: {clip} frame {i} row {r} is empty")
                edges = {"top": a[0].any(), "left": a[:, 0].any(), "right": a[:, -1].any(), "bottom": a[-1].any()}
                hit = [k for k, v in edges.items() if v]
                if hit:
                    warns.append(f"{clip} frame {i} ({layout['directions'][r]['name']}) touches the cell's {'/'.join(hit)} edge: art is clipped")
        col0 += layout["clips"][clip]["frames"]
    if pass_name == "col":
        rgb = sheet[..., :3][cov]
        uniq = len(np.unique(rgb.reshape(-1, 3), axis=0))
        # a black colour sheet is worse than none (Blacktop, measured)
        if rgb.mean() < 8:
            raise SystemExit(f"refusing: the colour sheet is black (mean {rgb.mean():.1f}); faces would render black")
        if uniq < 64 and untextured_fixture:
            warns.append(f"untextured test fixture drawn in its flat colour ({uniq} unique RGB); fine for a pipeline test, never for a shipping fighter")
        elif uniq < 64:
            raise SystemExit(f"refusing: the colour sheet carries no colour ({uniq} unique RGB, mean {rgb.mean():.1f})")
        return {"uniqueRGB": int(uniq)}
    g = sheet[..., 1][cov]
    legal = float(np.isin(g, PART_IDS).mean() * 100)
    if legal < 99.9:
        raise SystemExit(f"refusing: only {legal:.2f}% of mask pixels carry a legal part id {PART_IDS}")
    return {"partIdsLegalPct": round(legal, 3)}


def pop_check(sheet, layout, clips, threshold):
    """Every clip starts and ends on the guard pose (idle frame 0). Compares
    silhouettes, which can only flag a pop for the filmstrip to judge; it never
    approves motion (the Blacktop lesson: metrics agreed with themselves)."""
    starts, col0 = {}, 0
    for clip in clips:
        starts[clip] = col0
        col0 += layout["clips"][clip]["frames"]
    out = {}
    for clip in clips:
        if clip in ("idle", "knockout"):
            continue
        n = layout["clips"][clip]["frames"]
        worst = 1.0
        for r in range(len(layout["directions"])):
            g = cell(sheet, layout, r, starts["idle"])[..., 3] > 0
            for i in (0, n - 1):
                a = cell(sheet, layout, r, starts[clip] + i)[..., 3] > 0
                iou = (g & a).sum() / max(1, (g | a).sum())
                worst = min(worst, iou)
        out[clip] = round(float(worst), 3)
    flagged = [c for c, v in out.items() if v < threshold and c not in ("move",)]
    return out, flagged


def save_webp(sheet, path):
    Image.fromarray(sheet, "RGBA").save(path, "WEBP", lossless=True, quality=100, method=6)
    back = np.array(Image.open(path).convert("RGBA"))
    cov = sheet[..., 3] > 0
    # RGB under alpha 0 is undefined and never read (Blacktop measured lossless
    # WebP dropping it); alpha must be exact everywhere, RGB wherever covered.
    if not (np.array_equal(back[..., 3], sheet[..., 3]) and np.array_equal(back[..., :3][cov], sheet[..., :3][cov])):
        raise SystemExit(f"refusing: the WebP round trip altered pixels the engine reads ({path})")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("spec")
    ap.add_argument("--out")
    ap.add_argument("--sweep", help="animation name: render N evenly spaced samples instead")
    ap.add_argument("--n", type=int, default=20)
    ap.add_argument("--row", type=int, default=0)
    ap.add_argument("--pop", type=float, default=0.70, help="silhouette overlap below which a clip's ends are flagged")
    a = ap.parse_args()

    spec_path = pathlib.Path(a.spec).resolve()
    spec = json.loads(spec_path.read_text())
    layout = json.loads(LAYOUT.read_text())
    sheet_kind = spec.get("sheet", "fighter")
    clips = layout["sheets"][sheet_kind]["clips"]
    passes = layout["sheets"][sheet_kind]["passes"]
    if a.out:
        out = pathlib.Path(a.out).resolve()
    elif spec.get("ship"):
        out = ROOT / "assets/atlases"
    else:
        out = pathlib.Path(tempfile.gettempdir()) / "bp_bake" / spec["id"]
    cells = out / f"_cells_{spec['id']}"
    shutil.rmtree(cells, ignore_errors=True)

    resolved = resolve_spec(spec_path, cells)
    if a.sweep:
        run_godot(resolved, cells, [f"--sweep={a.sweep}:{a.n}:{a.row}"])
        cw, ch = layout["cell"]["w"], layout["cell"]["h"]
        strip = np.zeros((ch, cw * a.n, 4), np.uint8)
        for i in range(a.n):
            strip[:, i * cw:(i + 1) * cw] = np.array(Image.open(cells / "col" / f"r0c{i}.png").convert("RGBA"))
        p = out / f"sweep_{spec['id']}_{a.sweep}.png"
        Image.fromarray(strip, "RGBA").save(p)
        print(f"-> {p}  ({a.n} samples, frame i is at {{i/(n-1)}} of the animation)")
        return 0

    run_godot(resolved, cells)
    bake = json.loads((cells / "bake.json").read_text())
    if bake.get("untextured") and not spec.get("fixture"):
        raise SystemExit("refusing: the model has no albedo texture. A shipping fighter needs its Meshy texture; "
                         "re-export the glb with textures embedded (Character Dev).")
    warns, stats = [], {}
    sheets = {}
    for pn in passes:
        sheets[pn] = assemble(cells, layout, clips, pn)
        stats[pn] = check_sheet(sheets[pn], layout, clips, pn, warns, bool(bake.get("untextured") and spec.get("fixture")))
    pops, flagged = pop_check(sheets["col"], layout, clips, a.pop)
    for c in flagged:
        warns.append(f"{c}: an end frame overlaps the guard pose by only {pops[c]:.0%}; check for a pop on the filmstrip")

    out.mkdir(parents=True, exist_ok=True)
    files = {}
    for pn in passes:
        name = f"{spec['id']}.webp" if pn == "col" else f"{spec['id']}_{pn}.webp"
        save_webp(sheets[pn], out / name)
        files[pn] = name
    cw, ch = layout["cell"]["w"], layout["cell"]["h"]
    starts, col0 = {}, 0
    for c in clips:
        starts[c] = {"start": col0, "frames": layout["clips"][c]["frames"]}
        col0 += layout["clips"][c]["frames"]
    decoded = sum(s.shape[0] * s.shape[1] * 4 for s in sheets.values())
    manifest = {
        "_doc": "Written by tools/bake/bake.py. Do not edit; re-bake.",
        "id": spec["id"], "sheet": sheet_kind, "class": spec.get("class"),
        "fixture": bool(spec.get("fixture", False)),
        "cell": {"w": cw, "h": ch, "footY": layout["cell"]["footY"]},
        "rows": len(layout["directions"]),
        "directions": [d["name"] for d in layout["directions"]],
        "files": files, "clips": starts,
        "samples": {c: spec["clips"].get(c, {}).get("at") for c in clips},
        "band": spec.get("band", 1.0),
        "decodedMB": round(decoded / 1e6, 2),
        "pop": pops, "checks": stats, "warnings": warns,
    }
    (out / f"{spec['id']}.json").write_text(json.dumps(manifest, indent=2) + "\n")
    shutil.rmtree(cells, ignore_errors=True)
    for w in warns:
        print("WARN", w)
    print(f"-> {out / files['col']}  {sheets['col'].shape[1]}x{sheets['col'].shape[0]}  "
          f"decoded {manifest['decodedMB']} MB  ({(out / files['col']).stat().st_size / 1e6:.2f} MB on disk)")
    print(f"   guard-pose overlap at clip ends: {pops}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

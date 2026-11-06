"""Generate docs/class_silhouettes.svg, the class shape guide (front view, ~130 px tall).

    python3 tools/character/silhouettes.py docs/class_silhouettes.svg
"""
import math, sys

W_COL, BASE_Y, UNIT = 140, 200, 130  # column width, ground line, px for height band 1.00
INK = "#24222a"

CLASSES = [
    ("Warrior", "#e0704f", 1.00, "wedge"),
    ("Judge Mark", "#cfae6b", 1.05, "block"),
    ("Healer", "#5fcf8e", 0.90, "dome"),
    ("Mage", "#9d7ff2", 1.15, "spike"),
    ("Ember Keeper", "#ff8a3d", 0.95, "flare"),
    ("Gusting Shallow", "#79cfe6", 1.00, "sweep"),
    ("Leaf in the Wind", "#a6cc5c", 0.85, "small + ears"),
    ("Quiet Concern", "#cc72c6", 1.05, "needle"),
]


def poly(pts):
    return '<polygon points="%s"/>' % " ".join("%.1f,%.1f" % p for p in pts)


def ell(cx, cy, rx, ry):
    return '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f"/>' % (cx, cy, rx, ry)


def rect(x, y, w, h, r=0):
    return '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="%.1f"/>' % (x, y, w, h, r)


def limb(x1, y1, x2, y2, w):
    return ('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" '
            'stroke-width="%.1f" stroke-linecap="round"/>' % (x1, y1, x2, y2, INK, w))


def body(cx, h, sw, ww, hip, leg_w, gap, arm_w, arm_len, head_r, head_y=None,
         hand_r=None, foot=1.0, square_head=False, arm_ang=45):
    """Generic chunky arcade body. h = height to top of head (px). y grows down."""
    g = BASE_Y
    out = []
    hy = head_y if head_y is not None else g - h + head_r
    sh_y = hy + head_r + h * 0.04
    waist_y = g - h * 0.42
    # legs
    for s in (-1, 1):
        lx = cx + s * (gap / 2 + leg_w / 2)
        out.append(limb(lx, waist_y, lx + s * h * 0.02, g - h * 0.05, leg_w))
        out.append(ell(lx + s * h * 0.035, g - h * 0.03, leg_w * 0.75 * foot, h * 0.035 * foot + 1))
    # torso
    out.append(poly([(cx - sw / 2, sh_y), (cx + sw / 2, sh_y), (cx + hip / 2, waist_y + h * 0.05),
                     (cx - hip / 2, waist_y + h * 0.05)]))
    # arms (A-pose)
    a = math.radians(arm_ang)
    hr = hand_r or arm_w * 0.75
    for s in (-1, 1):
        x1, y1 = cx + s * (sw / 2 - arm_w * 0.3), sh_y + arm_w * 0.4
        x2, y2 = x1 + s * arm_len * math.sin(a), y1 + arm_len * math.cos(a)
        out.append(limb(x1, y1, x2, y2, arm_w))
        out.append(ell(x2 + s * hr * 0.3, y2 + hr * 0.3, hr, hr))
    # neck + head
    out.append(rect(cx - head_r * 0.35, hy + head_r * 0.6, head_r * 0.7, sh_y - hy - head_r * 0.5))
    if square_head:
        out.append(rect(cx - head_r, hy - head_r, head_r * 2, head_r * 2, head_r * 0.25))
    else:
        out.append(ell(cx, hy, head_r, head_r))
    return out, dict(hy=hy, sh_y=sh_y, waist_y=waist_y, head_r=head_r)


def figure(name, band, cx):
    g = BASE_Y
    H = UNIT * band
    o = []
    if name == "Warrior":
        h = H
        parts, k = body(cx, h, sw=h * 0.50, ww=h * 0.3, hip=h * 0.34, leg_w=h * 0.13, gap=h * 0.12,
                        arm_w=h * 0.12, arm_len=h * 0.30, head_r=h * 0.115)
        o += parts
        for s in (-1, 1):  # oversized round shoulder guards
            o.append(ell(cx + s * h * 0.27, k["sh_y"] + h * 0.02, h * 0.13, h * 0.10))
        o.append(poly([(cx - h * 0.03, k["hy"] - k["head_r"] * 0.7), (cx + h * 0.03, k["hy"] - k["head_r"] * 0.7),
                       (cx + h * 0.015, k["hy"] - k["head_r"] - h * 0.05), (cx - h * 0.015, k["hy"] - k["head_r"] - h * 0.05)]))
    elif name == "Judge Mark":
        h = H
        parts, k = body(cx, h * 0.93, sw=h * 0.44, ww=h * 0.44, hip=h * 0.44, leg_w=h * 0.15, gap=h * 0.08,
                        arm_w=h * 0.11, arm_len=h * 0.26, head_r=h * 0.10, square_head=True,
                        head_y=g - h * 0.93 + h * 0.10 + h * 0.07)
        o += parts
        o.append(rect(cx - h * 0.25, k["sh_y"] - h * 0.01, h * 0.50, h * 0.36, 2))  # slab chest
        o.append(rect(cx - h * 0.13, k["hy"] - k["head_r"] - h * 0.08, h * 0.26, h * 0.10, 1))  # flat square crown
    elif name == "Healer":
        h = H
        parts, k = body(cx, h * 0.86, sw=h * 0.34, ww=h * 0.4, hip=h * 0.46, leg_w=h * 0.13, gap=h * 0.09,
                        arm_w=h * 0.11, arm_len=h * 0.25, head_r=h * 0.13,
                        head_y=g - h * 0.86 + h * 0.13 + h * 0.06)
        o += parts
        o.append(ell(cx, g - h * 0.42, h * 0.27, h * 0.20))  # round belly/tunic
        brim_y = k["hy"] - k["head_r"] * 0.35
        o.append(ell(cx, brim_y, h * 0.30, h * 0.06))  # wide brim
        o.append('<path d="M%.1f,%.1f A%.1f,%.1f 0 0 1 %.1f,%.1f Z"/>' % (
            cx - h * 0.20, brim_y, h * 0.20, h * 0.20, cx + h * 0.20, brim_y))  # dome
    elif name == "Mage":
        body_h = UNIT * 1.0
        h = body_h
        parts, k = body(cx, h, sw=h * 0.30, ww=h * 0.24, hip=h * 0.30, leg_w=h * 0.10, gap=h * 0.10,
                        arm_w=h * 0.085, arm_len=h * 0.30, head_r=h * 0.11)
        o += parts
        o.append(poly([(cx - h * 0.10, k["sh_y"] - h * 0.07), (cx + h * 0.10, k["sh_y"] - h * 0.07),
                       (cx + h * 0.17, k["sh_y"] + h * 0.03), (cx - h * 0.17, k["sh_y"] + h * 0.03)]))  # collar
        brim = k["hy"] - k["head_r"] * 0.45
        o.append(ell(cx, brim, h * 0.18, h * 0.035))
        o.append(poly([(cx - h * 0.13, brim), (cx + h * 0.13, brim), (cx + h * 0.02, g - UNIT * 1.15)]))
        o.append(poly([(cx - h * 0.15, g - h * 0.40), (cx + h * 0.15, g - h * 0.40),
                       (cx + h * 0.2, g - h * 0.24), (cx + h * 0.03, g - h * 0.28),
                       (cx - h * 0.03, g - h * 0.28), (cx - h * 0.2, g - h * 0.24)]))  # split coat
    elif name == "Ember Keeper":
        h = H
        parts, k = body(cx, h * 0.84, sw=h * 0.34, ww=h * 0.28, hip=h * 0.32, leg_w=h * 0.11, gap=h * 0.10,
                        arm_w=h * 0.10, arm_len=h * 0.28, head_r=h * 0.12,
                        head_y=g - h * 0.84 + h * 0.12)
        o += parts
        # lantern on the back, peeking over the shoulders
        o.append(ell(cx + h * 0.24, k["sh_y"] - h * 0.02, h * 0.09, h * 0.10))
        o.append(rect(cx + h * 0.22, k["sh_y"] - h * 0.16, h * 0.04, h * 0.05))
        top = k["hy"] - k["head_r"] * 0.4
        o.append(poly([(cx - h * 0.12, top), (cx - h * 0.14, g - h * 0.92), (cx - h * 0.05, top - h * 0.06),
                       (cx, g - h), (cx + h * 0.05, top - h * 0.06), (cx + h * 0.13, g - h * 0.93),
                       (cx + h * 0.12, top)]))  # flame crest
        o.append(poly([(cx - h * 0.17, g - h * 0.40), (cx + h * 0.17, g - h * 0.40), (cx + h * 0.2, g - h * 0.27),
                       (cx + h * 0.12, g - h * 0.31), (cx + h * 0.06, g - h * 0.25), (cx, g - h * 0.30),
                       (cx - h * 0.06, g - h * 0.25), (cx - h * 0.12, g - h * 0.31), (cx - h * 0.2, g - h * 0.27)]))
    elif name == "Gusting Shallow":
        h = H
        parts, k = body(cx, h, sw=h * 0.32, ww=h * 0.24, hip=h * 0.28, leg_w=h * 0.10, gap=h * 0.11,
                        arm_w=h * 0.10, arm_len=h * 0.30, head_r=h * 0.11)
        o += parts
        sy = k["sh_y"]
        # stiff scarf swept back to one side, ending above the waist
        o.append(poly([(cx - h * 0.12, sy - h * 0.04), (cx + h * 0.14, sy - h * 0.04), (cx + h * 0.44, sy + h * 0.02),
                       (cx + h * 0.40, sy + h * 0.08), (cx + h * 0.46, sy + h * 0.14), (cx + h * 0.10, sy + h * 0.06)]))
        hr = k["head_r"]  # swept-back fin crest over the top of the head, trailing to the scarf side
        o.append(poly([(cx - hr * 0.6, k["hy"] - hr * 0.7), (cx + h * 0.05, k["hy"] - hr * 1.5),
                       (cx + h * 0.30, k["hy"] - hr * 1.2), (cx + h * 0.20, k["hy"] - hr * 0.9),
                       (cx + h * 0.26, k["hy"] - hr * 0.5), (cx + hr * 0.7, k["hy"] - hr * 0.2)]))
    elif name == "Leaf in the Wind":
        h = H
        parts, k = body(cx, h * 0.9, sw=h * 0.30, ww=h * 0.24, hip=h * 0.28, leg_w=h * 0.11, gap=h * 0.10,
                        arm_w=h * 0.10, arm_len=h * 0.27, head_r=h * 0.14, foot=1.4,
                        head_y=g - h * 0.9 + h * 0.14)
        o += parts
        for s in (-1, 1):  # long leaf ears, up and out
            o.append(poly([(cx + s * k["head_r"] * 0.7, k["hy"] - h * 0.02), (cx + s * h * 0.40, k["hy"] - h * 0.10),
                           (cx + s * k["head_r"] * 0.8, k["hy"] + h * 0.06)]))
        sy = k["sh_y"]
        o.append(poly([(cx - h * 0.18, sy), (cx + h * 0.18, sy), (cx + h * 0.24, g - h * 0.45),
                       (cx + h * 0.12, g - h * 0.50), (cx, g - h * 0.43), (cx - h * 0.12, g - h * 0.50),
                       (cx - h * 0.24, g - h * 0.45)]))  # leaf-cut cape
    elif name == "Quiet Concern":
        h = H
        parts, k = body(cx, h, sw=h * 0.28, ww=h * 0.18, hip=h * 0.22, leg_w=h * 0.085, gap=h * 0.09,
                        arm_w=h * 0.075, arm_len=h * 0.36, head_r=h * 0.095, arm_ang=38)
        o += parts
        hr = k["head_r"]
        o.append(ell(cx, k["hy"] - h * 0.005, hr * 1.15, hr * 1.2))  # smooth cowl
        o.append(poly([(cx - hr * 1.1, k["hy"]), (cx + hr * 1.1, k["hy"]), (cx + h * 0.16, k["sh_y"] + h * 0.04),
                       (cx - h * 0.16, k["sh_y"] + h * 0.04)]))  # hood drape to the shoulders
        a = math.radians(38)
        for s in (-1, 1):  # long narrow gauntlets on the forearm half
            x1 = cx + s * (h * 0.14 - h * 0.02) + s * h * 0.18 * math.sin(a)
            y1 = k["sh_y"] + h * 0.03 + h * 0.18 * math.cos(a)
            x2 = x1 + s * h * 0.17 * math.sin(a)
            y2 = y1 + h * 0.17 * math.cos(a)
            o.append(limb(x1, y1, x2, y2, h * 0.11))
        o.append(poly([(cx + k["head_r"] * 0.5, k["hy"] + h * 0.02), (cx + k["head_r"] * 1.3, k["hy"] + h * 0.18),
                       (cx + k["head_r"] * 0.9, k["hy"] + h * 0.19)]))  # tassel
    return o


def main(path):
    width = W_COL * len(CLASSES)
    s = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d 270" width="%d" height="270" '
         'font-family="Helvetica, Arial, sans-serif">' % (width, width),
         '<rect width="100%" height="100%" fill="#f3efe6"/>',
         '<text x="12" y="20" font-size="13" fill="#555">The Branding Pit — class silhouettes, front view at ~130 px. '
         'Shape guide for docs/STYLE_LINE.md, not final art. Dashed line = Warrior height (1.00).</text>',
         '<line x1="0" y1="%d" x2="%d" y2="%d" stroke="#bbb" stroke-dasharray="4 4"/>' % (BASE_Y - UNIT, width, BASE_Y - UNIT),
         '<line x1="0" y1="%d" x2="%d" y2="%d" stroke="#999"/>' % (BASE_Y, width, BASE_Y)]
    for i, (name, col, band, sig) in enumerate(CLASSES):
        cx = W_COL * i + W_COL / 2
        s.append('<g fill="%s">%s</g>' % (INK, "".join(figure(name, band, cx))))
        s.append('<rect x="%.1f" y="%d" width="80" height="6" rx="3" fill="%s"/>' % (cx - 40, BASE_Y + 12, col))
        s.append('<text x="%.1f" y="%d" font-size="13" font-weight="bold" text-anchor="middle" fill="#222">%s</text>'
                 % (cx, BASE_Y + 36, name))
        s.append('<text x="%.1f" y="%d" font-size="12" text-anchor="middle" fill="#666">%s · %.2f</text>'
                 % (cx, BASE_Y + 53, sig, band))
    s.append("</svg>")
    open(path, "w").write("\n".join(s))


main(sys.argv[1])

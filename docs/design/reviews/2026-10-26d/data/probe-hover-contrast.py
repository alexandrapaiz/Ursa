# The run button's label against the pixels actually behind it, at rest and
# hovered, read off the frames rather than off the stylesheet.
#
# The hover wash lightens the button's fill, so it can only lower the
# contrast of the label on it. That is the one thing a new hover colour can
# break and the stylesheet cannot tell you, because `--line` is an alpha
# value composited over a translucent panel over whatever is behind it.
#
#   python3 docs/design/reviews/2026-10-26d/data/probe-hover-contrast.py
from PIL import Image
import sys, os

def lum(c):
    def f(v):
        v = v / 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = c[:3]
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

here = os.path.dirname(os.path.abspath(__file__))
crops = os.path.join(os.path.dirname(here), 'crops')
for name in ('run-rest', 'run-hover'):
    im = Image.open(os.path.join(crops, name + '.png')).convert('RGB')
    w, h = im.size
    # The crop is the button plus 14px of pad on every side, so the button's
    # own box is the inset. Stay 3px inside it to miss the 1px border and
    # its antialiasing.
    box = [(x, y) for y in range(17, h - 17) for x in range(17, w - 17)]
    px = [im.getpixel(p) for p in box]
    px.sort(key=lum)
    fill = px[len(px) // 10]      # the fill is most of the box
    text = px[-1]                 # the brightest pixel is the glyph core
    print(f'{name:10}  fill {str(fill):18} brightest glyph {str(text):18} ratio {ratio(text, fill):.2f}:1')

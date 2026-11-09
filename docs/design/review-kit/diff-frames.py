"""
Every frame, before against after, counted pixel by pixel.

A page-height number cannot tell a page that moved 4px at the bottom from
a page that moved 4px up and 4px back down. A pixel count can, and the row
range says where, which is the difference between a number and a fix.

Where two frames differ in height the comparison is still made over the
rows they share, because "the page got taller at the bottom" is usually
the claim under test.

A number out of this is only meaningful on frames shot without `--live`.
Shot live, the home page and the 404 page differ from themselves by up to
19,140 pixels, so the diff is measuring the starfield and not the change.
See `lib/freeze.mjs`.

Written against PIL, which is on this host already, rather than against a
new npm package: the charter wants a ledger proposal before a dependency,
and a review script is not a reason to add one to the site.

usage: python3 diff-frames.py before after out.txt
"""
import sys, os
from PIL import Image, ImageChops

A = sys.argv[1] if len(sys.argv) > 1 else "before"
B = sys.argv[2] if len(sys.argv) > 2 else "after"
# The default is beside the frames being compared, NOT relative to the
# cwd. It used to be the literal "data/frame-diff.txt", which is a
# relative path, so a run started from the repository root wrote
# `data/frame-diff.txt` AT the repository root and created a `data/`
# directory there whose only contents were this file. It is committed from
# 2026-10-26d and again from the run before it, and this run reproduced it
# a third time, which is how it was found. L46 named the class and the
# repair applied here then was a `print` of the destination; a run reading
# its own output after the write is not a run that stopped writing it.
#
# A diff describes a pair of frame directories, so it belongs with them.
# That also makes it land inside `$FE_RUN` without the caller passing
# anything, which is where everything a run writes is supposed to go.
OUT = sys.argv[3] if len(sys.argv) > 3 else os.path.join(
    os.path.dirname(os.path.abspath(A)) or ".", "frame-diff.txt")

rows = []
for name in sorted(n for n in os.listdir(A) if n.endswith(".png")):
    pa, pb = os.path.join(A, name), os.path.join(B, name)
    if not os.path.exists(pb):
        rows.append(f"{name:<36} MISSING on the after side")
        continue
    a = Image.open(pa).convert("RGB")
    b = Image.open(pb).convert("RGB")
    geo = "same size" if a.size == b.size else f"{a.width}x{a.height} -> {b.width}x{b.height}"
    w, h = min(a.width, b.width), min(a.height, b.height)
    a2, b2 = a.crop((0, 0, w, h)), b.crop((0, 0, w, h))
    d = ImageChops.difference(a2, b2).convert("L")
    bbox = d.getbbox()
    # histogram rather than getdata: same count, one pass in C, and
    # getdata is deprecated for removal in Pillow 14.
    n = sum(d.histogram()[1:])
    where = "identical" if bbox is None else f"rows {bbox[1]}-{bbox[3] - 1}, cols {bbox[0]}-{bbox[2] - 1}"
    rows.append(f"{name:<36} {n:>8} px  {n / (w * h) * 100:>7.3f}%  {where}  ({geo})")

text = "\n".join(rows) + "\n"
os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
open(OUT, "w").write(text)
# Say where it went, absolutely. A relative path printed back to a run
# that is standing somewhere unexpected is the same silence as no path.
print("wrote " + os.path.abspath(OUT))
print(text)

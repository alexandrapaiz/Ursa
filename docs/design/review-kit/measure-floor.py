"""
The determinism floor of a frame set, measured with repeats instead of a pair.

    python3 measure-floor.py out.txt shoot1 shoot2 shoot3 ...        # 3 or more
    python3 measure-floor.py --json out.json out.txt shoot1 shoot2 ...

Each positional after the output path is one full frame set from one
INDEPENDENT shoot, meaning its own `shoot.mjs` invocation against a server
that was not restarted in between. For every frame name present in all of
them, this reports:

    states      how many distinct images the N shoots produced
    worst       the largest pixel count between any two of the N
    blind pairs how many of the C(N,2) pairs are identical, and so would
                have reported this frame as deterministic

WHY THE LAST COLUMN IS THE POINT. `diff-frames.py` answers "did these two
frames differ", which is the right question for a before-and-after and the
wrong one for a determinism claim. L48 took eight shoots of the phone
dashboard and found one pixel that is bistable rather than drifting: five
of the eight frames carried one value and three carried the other. Fifteen
of those twenty-eight pairs are identical, so a run that had stopped at a
pair had a 54 per cent chance of publishing "0 px" about a frame with a
floor in it. A floor nobody has written down is indistinguishable from a
repair when the next run diffs over it, which is the failure L6, L8, L41,
L45 and L48 are five instances of.

So the headline this file exists to print is not the worst number. It is
how often the cheaper instrument would have missed it.

WHAT IT DOES NOT CLAIM. N shoots bound the floor from below and never from
above: a frame reporting 0 across six shoots has a floor of at most
whatever six samples can see, which for a bistable pixel at p=0.5 is a one
in thirty-two chance of having missed it. The `states` column is therefore
evidence of nondeterminism and never proof of determinism, and the output
says so on its own last line rather than leaving the reader to remember it.

A number out of this is only meaningful on frames shot WITHOUT `--live`,
for the reason in `diff-frames.py` and `lib/freeze.mjs`: live, the sky is
the measurement. It is also only meaningful on shoots whose settle and
viewport matrix match, which is why the frame name is the join key and the
header of each set's `measurements.txt` is the thing to check first.

Written against PIL, which is on this host, for the reason diff-frames.py
gives: a review script is not a reason to add a dependency to a site.
"""
import sys, os, hashlib
from itertools import combinations
from PIL import Image, ImageChops

argv = sys.argv[1:]
JSON_OUT = None
if argv and argv[0] == "--json":
    JSON_OUT = argv[1]
    argv = argv[2:]
if len(argv) < 4:
    # Refuse rather than answer, because two sets is the instrument this
    # file was written to replace and it already exists as diff-frames.py.
    print(__doc__.strip().split("\n\n")[1])
    print("\nmeasure-floor.py needs an output path and at least 3 shoot "
          f"directories; got {len(argv) - 1 if argv else 0} directories. "
          "Two sets is a pair, which is diff-frames.py.")
    sys.exit(2)

OUT, SETS = argv[0], argv[1:]
N = len(SETS)
PAIRS = list(combinations(range(N), 2))

missing = [d for d in SETS if not os.path.isdir(d)]
if missing:
    print("not a directory: " + ", ".join(missing))
    sys.exit(2)

# The frame names every set has. A name in some sets and not others is
# reported rather than dropped: it usually means one shoot used a different
# --pages or --viewports and the comparison is not the one anybody wanted.
per_set = [set(n for n in os.listdir(d) if n.endswith(".png")) for d in SETS]
common = sorted(set.intersection(*per_set))
ragged = sorted(set.union(*per_set) - set(common))

rows, records = [], []
for name in common:
    imgs = [Image.open(os.path.join(d, name)).convert("RGB") for d in SETS]
    digests = [hashlib.sha256(im.tobytes()).hexdigest()[:12] for im in imgs]
    states = {}
    for i, h in enumerate(digests):
        states.setdefault(h, []).append(i)

    worst, worst_pair, boxes, identical = 0, None, [], 0
    for i, j in PAIRS:
        if digests[i] == digests[j]:
            identical += 1
            continue
        a, b = imgs[i], imgs[j]
        w, h = min(a.width, b.width), min(a.height, b.height)
        d = ImageChops.difference(a.crop((0, 0, w, h)), b.crop((0, 0, w, h))).convert("L")
        n = sum(d.histogram()[1:])
        bbox = d.getbbox()
        if bbox:
            boxes.append(bbox)
        if n > worst:
            worst, worst_pair = n, (i, j)

    if boxes:
        x0 = min(b[0] for b in boxes); y0 = min(b[1] for b in boxes)
        x1 = max(b[2] for b in boxes); y1 = max(b[3] for b in boxes)
        where = f"rows {y0}-{y1 - 1}, cols {x0}-{x1 - 1}"
    else:
        where = "identical in all " + str(N)
    sizes = {im.size for im in imgs}
    geo = "" if len(sizes) == 1 else "  SIZE VARIES " + " ".join(f"{w}x{h}" for w, h in sorted(sizes))
    # The shape of the states, which is what separates a bistable pixel from
    # a drifting one: 5/3 is two values, 1/1/1/1/1/1 is noise.
    shape = "/".join(str(len(v)) for v in sorted(states.values(), key=len, reverse=True))

    rows.append(f"{name:<34} {len(states):>2} states {shape:<12} worst {worst:>7} px  "
                f"blind pairs {identical:>2}/{len(PAIRS)}  {where}{geo}")
    records.append({
        "frame": name, "shoots": N, "states": len(states), "stateShape": shape,
        "worstPx": worst, "worstPair": worst_pair,
        "blindPairs": identical, "totalPairs": len(PAIRS),
        "where": where, "sizes": sorted(f"{w}x{h}" for w, h in sizes),
    })

deterministic = [r for r in records if r["states"] == 1]
floored = [r for r in records if r["states"] > 1]
blind = sum(r["blindPairs"] for r in floored)
blind_total = len(floored) * len(PAIRS)

text = "\n".join([
    f"# {N} independent shoots, {len(PAIRS)} pairs per frame, {len(common)} frames in all sets.",
    f"# sets: {', '.join(SETS)}",
    "",
    *rows,
    "",
    f"{len(deterministic)} of {len(common)} frames are bit-identical across all {N} shoots.",
    f"{len(floored)} have a floor.",
    (f"Of the {blind_total} pairs drawn from the frames that have one, {blind} are identical: "
     f"a single pair would have reported no floor {blind / blind_total * 100:.0f}% of the time."
     if blind_total else "No frame has a floor, so no pair could have been blind to one."),
    "",
    f"These {N} shoots bound each floor from below and none of them from above. "
    "A frame reporting 1 state is a frame no sample this size could separate, "
    "which is not the same claim as a deterministic frame.",
    *( [f"", f"In some sets and not others, so not compared: {', '.join(ragged)}"] if ragged else [] ),
]) + "\n"

os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
open(OUT, "w").write(text)
if JSON_OUT:
    import json
    os.makedirs(os.path.dirname(JSON_OUT) or ".", exist_ok=True)
    json.dump({"shoots": SETS, "pairsPerFrame": len(PAIRS), "frames": records},
              open(JSON_OUT, "w"), indent=2)
    print("wrote " + JSON_OUT)
# L46: say where it went, because the path is relative to wherever the run
# was standing and one such file has already been committed at the root.
print("wrote " + OUT)
print(text)

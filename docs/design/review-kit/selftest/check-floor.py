"""
Does `measure-floor.py` count what it says it counts?

    python3 docs/design/review-kit/selftest/check-floor.py

WHY THIS EXISTS. The headline that file was written for is not a pixel
count, it is a combinatorial one: *how many of the pairs drawn from these N
shoots would have reported no floor at all.* A pixel count is wrong in a way
a reader notices. A pair count is wrong in a way that reads as good news,
because the number it gets wrong is the number nobody has an independent
feel for. L19's rule applies to the instrument as much as to the surface: a
check that cannot fail is not a check, so the first assertion here is one
the tool fails if its state detection does nothing.

The fixtures are written under `tmpdir()` and committed nowhere, the way
`check-redaction.mjs` and `check-pin-now.mjs` write theirs. A frame set that
exists only to be measured does not belong in the repository.

WHAT IT ASSERTS, AND WHY EACH ONE IS HERE

  1. Two sets is a refusal, exit 2, naming how many it got. Two sets is
     `diff-frames.py` and answering anyway is the failure the file was
     written to replace.
  2. Three identical sets report one state and say no pair could have been
     blind. Without this, assertion 3 could pass on a tool that calls
     everything bistable.
  3. Six shoots of a frame that takes two values, four one way and two the
     other, report `2 states`, shape `4/2`, and **7 blind pairs of 15**,
     which is C(4,2) + C(2,2). This is the arithmetic the headline rests on
     and it is the one thing no product page can check, because on a real
     page nobody knows the true split.
  4. The worst pixel count is the real count of differing pixels, not the
     number of pairs that differ and not a bounding box area.
  5. A frame in some sets and not others is named as not compared rather
     than dropped, because a shoot that used a different `--pages` is the
     usual cause and a silent intersection hides it.
  6. Frames of different sizes carry `SIZE VARIES`, since the pairwise diff
     crops to the smaller one and its pixel count is a floor rather than
     the difference.
"""
import os, subprocess, sys, tempfile
from PIL import Image

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOL = os.path.join(KIT, "measure-floor.py")

fails = []
def check(name, ok, detail=""):
    print(("  ok   " if ok else "  FAIL ") + name + (("  " + detail) if detail and not ok else ""))
    if not ok:
        fails.append(name)

def frame(path, size=(8, 8), fill=(0, 0, 0), dots=()):
    im = Image.new("RGB", size, fill)
    for (x, y, c) in dots:
        im.putpixel((x, y), c)
    im.save(path)

def run(sets, out):
    return subprocess.run([sys.executable, TOOL, out, *sets],
                          capture_output=True, text=True)

root = tempfile.mkdtemp(prefix="floor-selftest-")
out = os.path.join(root, "floor.txt")

# 1. two sets is a refusal
two = []
for i in range(2):
    d = os.path.join(root, f"two{i}"); os.makedirs(d)
    frame(os.path.join(d, "home-desktop.png"))
    two.append(d)
r = run(two, out)
check("two sets refused with exit 2", r.returncode == 2, f"exit {r.returncode}")
check("the refusal says how many directories it got", "got 2 directories" in r.stdout, r.stdout[-200:])

# 2. three identical sets: one state, nothing could have been blind
same = []
for i in range(3):
    d = os.path.join(root, f"same{i}"); os.makedirs(d)
    frame(os.path.join(d, "home-desktop.png"))
    same.append(d)
r = run(same, out)
text = open(out).read()
check("three identical sets exit 0", r.returncode == 0, f"exit {r.returncode}")
check("three identical sets report 1 state", " 1 states" in text, text)
check("no floor means no pair could have been blind",
      "No frame has a floor" in text, text)

# 3. six shoots, four one way and two the other: 2 states, 4/2, 7 blind of 15
#    C(4,2)=6 identical pairs inside the majority, C(2,2)=1 inside the
#    minority, so 7. The eight mixed pairs are the ones that see the floor.
six = []
for i in range(6):
    d = os.path.join(root, f"six{i}"); os.makedirs(d)
    minority = i >= 4
    frame(os.path.join(d, "home-phone.png"),
          dots=[(1, 1, (2, 3, 8) if minority else (2, 6, 31))])
    six.append(d)
r = run(six, out)
text = open(out).read()
check("bistable frame reports 2 states", " 2 states" in text, text)
check("the state shape is 4/2", "4/2" in text, text)
check("7 of 15 pairs are blind to it", "blind pairs  7/15" in text, text)
check("the headline names the blind share",
      "a single pair would have reported no floor 47% of the time" in text, text)

# 4. the worst count is pixels, not pairs and not a bounding box
#    Three dots differ between the two states, spread so a bounding box
#    would be 25 px and the pair count would be 8.
spread = []
for i in range(4):
    d = os.path.join(root, f"spread{i}"); os.makedirs(d)
    c = (9, 9, 9) if i >= 2 else (1, 1, 1)
    frame(os.path.join(d, "home-tablet.png"), dots=[(1, 1, c), (5, 1, c), (1, 5, c)])
    spread.append(d)
r = run(spread, out)
text = open(out).read()
check("worst is the count of differing pixels", "worst       3 px" in text, text)

# 5. a frame in some sets and not others is named, not dropped
ragged = []
for i in range(3):
    d = os.path.join(root, f"ragged{i}"); os.makedirs(d)
    frame(os.path.join(d, "home-desktop.png"))
    if i == 0:
        frame(os.path.join(d, "record-at-phone.png"))
    ragged.append(d)
r = run(ragged, out)
text = open(out).read()
check("a frame missing from one set is named as not compared",
      "not compared: record-at-phone.png" in text, text)

# 6. different sizes carry SIZE VARIES
sized = []
for i in range(3):
    d = os.path.join(root, f"sized{i}"); os.makedirs(d)
    frame(os.path.join(d, "home-desktop.png"), size=(8, 8) if i < 2 else (8, 9))
    sized.append(d)
r = run(sized, out)
text = open(out).read()
check("frames of different sizes are flagged", "SIZE VARIES" in text, text)

print()
if fails:
    print(f"{len(fails)} failed: " + ", ".join(fails))
    sys.exit(1)
print("measure-floor.py: all checks pass")

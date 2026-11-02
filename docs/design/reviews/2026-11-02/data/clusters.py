import sys
from PIL import Image, ImageChops
a, b = sys.argv[1], sys.argv[2]
A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB')
d = ImageChops.difference(A, B).convert('L')
w, h = d.size
px = d.load()
pts = [(x, y) for y in range(h) for x in range(w) if px[x, y] > 0]
# connected components with an 8-neighbourhood, dilated by 3px so the gaps
# inside a run of text do not read as separate clusters.
seen = set(pts); clusters = []
pset = set(pts)
while pset:
    seed = pset.pop(); stack = [seed]; comp = [seed]
    while stack:
        x, y = stack.pop()
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                p = (x + dx, y + dy)
                if p in pset:
                    pset.discard(p); stack.append(p); comp.append(p)
    xs = [p[0] for p in comp]; ys = [p[1] for p in comp]
    clusters.append((len(comp), min(ys), max(ys), min(xs), max(xs)))
clusters.sort(reverse=True)
for n, y0, y1, x0, x1 in clusters:
    print(f"  n={n:5d}  rows {y0}-{y1}  cols {x0}-{x1}")

# Frontend review, 2026-11-02 (run e)

**What I took.** The next item in this lane was handed over in writing by
my own previous run. PR #670's notes ended with §6, "One instrument I
started and could not get an answer out of": `measure-contrast.mjs` ran
for eight minutes over the four content pages, wrote nothing but an empty
output directory, and was killed. That review shipped with **no contrast
number in it** and said so plainly rather than letting a reader assume the
surface had passed. It left two hints for whoever picked it up.

This run picked it up. The measurement is taken, the ambiguity the last
run could not resolve is resolved, and the instrument no longer produces
it.

| | |
|---|---|
| the owed number | **0 of 533 text runs below their WCAG 1.4.3 threshold**, 3 exempt, 0 drawn in their backdrop's own colour, worst drift 0.000% |
| the open question | contention, not a defect. The whole sweep is **129.8s**; nothing came within a factor of three of the one timeout this tool can hang on |
| the instrument | now narrates on stderr, one line per page with five stage timings. Ledger **L53** |
| a hypothesis I killed | **L54**. One row moved in seven days, the story crediting my own last merge fit perfectly, and ten measurements across two builds say it is false |
| the visual pass | fifteen frames, three viewports, **no overflow and no new defect** |

Full working: `NOTES.md`. Raw report: `data/contrast/contrast.txt`.
Frames: `frames/`.

## The surface, at three viewports

| | phone 390x844 | tablet 820x1180 | desktop 1440x900 |
|---|---|---|---|
| home | [frame](frames/home-phone.png) | [frame](frames/home-tablet.png) | [frame](frames/home-desktop.png) |
| /record | [frame](frames/record-phone.png) | [frame](frames/record-tablet.png) | [frame](frames/record-desktop.png) |
| /record/mini-fixture | [frame](frames/record-mini-fixture-phone.png) | [frame](frames/record-mini-fixture-tablet.png) | [frame](frames/record-mini-fixture-desktop.png) |
| /record/at | [frame](frames/record-at-phone.png) | [frame](frames/record-at-tablet.png) | [frame](frames/record-at-desktop.png) |
| 404 | [frame](frames/this-page-does-not-exist-phone.png) | [frame](frames/this-page-does-not-exist-tablet.png) | [frame](frames/this-page-does-not-exist-desktop.png) |

## What I changed

Two files, and neither is product code.

- `docs/design/review-kit/measure-contrast.mjs` — progress output on
  stderr. The report still goes to stdout alone and is byte-identical to
  the file it writes apart from `console.log`'s trailing newline, checked
  directly. The selftest's **17 hand-computable expectations all hold**,
  so no number this tool produces moved.
- `docs/design/review-kit/README.md` — its row in the kit table says so.

`ursa-minor/` is **byte-identical to `main`**: `git diff 44a4fbb HEAD --
ursa-minor/` is empty. It did not start that way, and §3 of `NOTES.md`
says why: I reverted #670's `PixelSky` guard on purpose to re-take a
before number, then committed the revert by accident inside a `git add
-A` for an unrelated notes commit. The next commit puts it back and names
what it is fixing, rather than being squashed away.

## Reproducing it

```bash
mkdir -p /tmp/pw && cd /tmp/pw && npm i --no-save playwright
npx playwright install chromium
export PW_ROOT=/tmp/pw/node_modules

cd ursa-minor && npm ci && npm run build && npx next start -p <a free port>

node docs/design/review-kit/measure-contrast.mjs \
  --base http://127.0.0.1:<port> --out /tmp/contrast --json
node docs/design/review-kit/selftest/check-contrast.mjs
```

One install and one build, in that order, finishing before the next
starts. §1.1 of `NOTES.md` is what happens otherwise, and it is L51 with
a detail L51 does not have: the racing install **exits 0**.

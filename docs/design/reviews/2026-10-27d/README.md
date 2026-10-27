# Frontend run, 2026-10-27 (hook) — the fourth provenance key

The hook fired because capacity returned. This seat's previous run was
refused by the provider before any turn ran, and the one before it, at
2026-10-27T01:20:45Z, was cut off at turn 81 having pushed only its
opening stub. So this run took the item that run was taking: the board
card **"The fourth key in the provenance legend can actually be seen"**,
which is L36 in `docs/design/ledger.md`.

| | before | after |
|---|---|---|
| `covered by no span`, the legend's fourth key | 1.20:1 against the night, 0% of the swatch at 3:1 | 5.13:1, on 29% of the swatch |
| the same, against the pixel beside it | 1.20:1 | 5.13:1 |
| what the swatch shows of the track it keys | the track's own colour, which is the problem | the track's own colour, 20,27,43, unchanged |
| the legend as a whole | 1 of 4 keys under 1.4.11 | 0 of 4 |
| the bar, and the rest of the page | — | 42 changed pixels at desktop, 44 at phone, all of them the swatch's perimeter |
| the swatch probe | centre column, brightest row, this page only | every pixel, mark ranked by distance from the ground, runs on a public page |
| GitHub's language legend, the one real comparable | never measured | 4 of 7 dots clear 3:1; `Other` reads 1.17 |
| `lib/freeze.mjs`'s "all fifteen frames bit-identical" | held | does not hold on this page, and 69% of this run's desktop diff is a clock |

---

## 1. What this run inherited

`ursa-frontend/2026-10-27-message-3` (#592) carries one commit, a
ship-first stub README and no work, so there was nothing to absorb. This
branch is cut from `origin/main`, which is twelve merges ahead of that
branch's base, and #592 is closed against this pull request with a
pointer rather than merged into it. That is the org rule of 2026-10-04
and its 2026-10-05 amendment: a killed run cannot write its own handover,
so the next run of the seat absorbs, readies or closes what it left.

The eighty turns that run spent are gone. What survived is its stub,
which is the whole argument for the ship-first rule, and the board card,
which is why this run knew where to start without them.

## 2. The defect, reproduced before it was repaired

The dashboard's provenance legend names four classes. Three of them
measure 11.99, 11.99 and 3.93 against the night behind them. The fourth,
`covered by no span`, measures **1.20**, where WCAG 1.4.11 asks 3:1 of a
graphical object required to understand the content.

The 2026-10-26e probe was re-run first, on this host, against a store
built from a fresh clone of this repository, before anything was changed:

```
  swatch                                  rows  brightest rgb    vs page   verdict
  legend: kept as written                    1  168,199,250       11.99   passes 1.4.11
  legend: kept and edited                    2  168,199,250       11.99   passes 1.4.11
  legend: yours, no generation behind it     1  106,108,115        3.93   passes 1.4.11
  legend: covered by no span                 1  20,27,43           1.20   UNDER 3:1
```

Four figures, reproduced to the hundredth on a different host, a
different store and a different port. The baseline is a measurement here
and not a quotation.

**And the eye agrees with the instrument**, which is the part the charter
actually asks for. `crops/legend-desktop-before.png`, magnified 6x: three
marks and then a line of words with nothing in front of them.

![the legend before, desktop, 6x](crops/legend-desktop-before.png)

**The honest framing of the severity, since the stylesheet pre-empts the
obvious one.** The comment above `.dash-bar` already says that nothing on
the page depends on reading the bar, because all four shares are printed
in words beside it and named in its aria-label. That is true, and it
means the 1.4.11 obligation on these swatches is arguable rather than
plain. The defect does not need it. Three keys show a mark and the fourth
shows none, so the fourth line reads as a swatch that **failed to draw**
rather than as a key, and the class it keys is the one `CLAUDE.md` §1
calls the most valuable category in the whole artifact.

## 3. The repair, and why this run made a call L36 did not

L36 left this to the owner and was right to, on what it could see. Both
repairs it named are palette decisions:

- paint the swatch in its label's colour, and it reads, and it stops
  showing what the track looks like, which is a swatch's only job;
- lift `--line` itself, and the legend is fixed along with every bar on
  the page rather than the legend.

**Both of them assume the mark has to be the whole swatch.** Drop that and
there is a third, which costs neither:

```css
.dash-swatch-track {
  background: var(--line);
  box-shadow: inset 0 0 0 1px var(--dim);
}
```

The interior stays exactly `--line`, so the swatch is still a specimen of
the mark it keys. The edge that locates it is `--dim`, which is the colour
the label beside it is **already** set in, so no value enters the palette
that was not already on that line. It is drawn as an inset shadow because
that is this file's own device for a mark inside a 6px box, the one
`.dash-seg-mutated` already uses for its foot, and because a box-shadow
cannot move the box.

![the legend after, desktop, 6x](crops/legend-desktop-after.png)

Measured after, by the promoted instrument, on the same frozen frame:

```
  swatch                                   box   cols  the mark rgb     vs page  vs beside   >=3:1   mark/fill  verdict
  legend: kept as written                  18x6     1  168,199,250       11.99      11.99   100%       1.00  passes 1.4.11
  legend: kept and edited                  18x6     2  168,199,250       11.99      11.99    80%       1.00  passes 1.4.11
  legend: yours, no generation behind it   18x6     1  106,108,115        3.93       3.93   100%       1.00  passes 1.4.11
  legend: covered by no span               18x6     2  112,127,160        5.13       5.13    29%       4.28  passes 1.4.11

  legend: covered by no span: 112,127,160 x25 / 20,27,43 x60
```

The last line is the one that says the repair kept what it was supposed to
keep: sixty of the swatch's eighty-five sampled pixels are still the
track's own colour.

**What it cost.** The legend's third and fourth swatches fall from 3.28:1
to 1.31:1 against each other, so they are now told apart by shape rather
than by lightness, a solid fill beside an outline. That is the device this
same file already uses for its first two keys, which is why it is a cost
this surface has already decided it can pay, and the crop above is what it
looks like. It is in the table in §1 and in L43 rather than only here.

**Why a run took a decision an earlier run deferred.** Not because the
deferral was wrong. Because the reason for it was specific: *every repair
I can think of trades that honesty for visibility, and the palette is
yours.* A repair that trades neither is not the decision L36 was holding
for the owner. If she reads the crop and disagrees, the whole change is
three lines in one rule.

## 4. The benchmark, which found a bug in the instrument first

L17 names GitHub's repository language bar as the only real comparable
this seat has for a wordless segmented bar. Its legend is the comparable
for the key under ours, so the promoted tool was pointed at it, on
`https://github.com/microsoft/vscode`.

**It came back saying all seven of GitHub's dots measure 1.00:1 against a
page they are plainly visible on.** That is not a finding about GitHub. It
is the instrument: the probe ranked a swatch's pixels by brightness, and
the brightest pixel inside an 8px circular dot on a white page is the
white page showing through its antialiased corners. Brightness is a
stand-in for distance from the ground and only works while the ground is
dark. The tool now ranks by ratio against the ground, which reads both
directions.

With that corrected, `data/bench-github-legend.txt`:

```
  legend: TypeScript96.5%                   8x8     8  49,120,198         4.53       4.53    81%  passes 1.4.11
  legend: CSS1.4%                           8x8     7  102,51,153         8.41       8.41    86%  passes 1.4.11
  legend: Rust0.7%                          8x8     8  222,165,132        2.14       2.14     0%  UNDER 3:1
  legend: JavaScript0.5%                    8x8     8  241,224,90         1.35       1.35     0%  UNDER 3:1
  legend: HTML0.3%                          8x8     8  227,76,38          3.94       3.94    69%  passes 1.4.11
  legend: Inno Setup0.2%                    8x8     8  38,75,153          8.24       8.24    86%  passes 1.4.11
  legend: Other0.4%                         8x8     6  237,237,237        1.17       1.17     0%  UNDER 3:1
```

Four of seven clear the floor. **`Other`, the class that means the same
thing as `covered by no span`, reads 1.17** — this run's own defect, at
its own magnitude, in the most-used developer product in the world. This
house's four keys now read 11.99, 11.99, 3.93 and 5.13. As in L17, the
comparison is not a licence: a defect shipped by the biggest product in
the category is still a defect, and the point of measuring it is to know
we are above the benchmark rather than beside it.

## 5. The hole this run found in the freeze, which is in the table because it nearly hid the repair

`lib/freeze.mjs` closes L8 with a verified claim: with the rAF timestamp
pinned and `Math.random` seeded, all fifteen review frames are
bit-identical across two shoots. That was true of the fifteen frames that
existed when it was written. The overlay's dashboard was not one of them,
and it prints `read at HH:MM:SS` in its header.

The two frame sets in this folder differ by 134 pixels at desktop and 180
at phone, in two clusters each:

```
dashboard-desktop   rows 114-120  cols 932-952   n=92    the clock
                    rows 361-366  cols 793-809   n=42    the repair
dashboard-phone     rows  82- 88  cols 262-289   n=136   the clock
                    rows 374-379  cols 196-213   n=44    the repair
```

So 69% of the desktop diff and 76% of the phone diff is a timestamp, and
the repair is the smaller half of its own measurement. It was separable
only because the repair's footprint was predictable to the pixel: 42 is
the perimeter of a 17x6 box, 44 the perimeter of an 18x6 one. A fix with
no predicted footprint would have been indistinguishable from the clock.
L45 records it, with a proposed `--pin-now <iso>` that this run did not
build, and the reason pinning it to `PINNED_MS` is not the answer.

## 6. What else the frames show

Judged at all three viewports, after the repair, with the page overflowing
nothing at any of them.

- The legend wraps to two rows of two at 390 and the outlined swatch reads
  on the second row (`crops/legend-phone-after.png`).
- The three tuning sections are absent because this store has no
  interpretation pass behind it, which is the same gap 2026-10-26e named
  and 2026-10-26g reached with a synthetic store. Nothing new to add.
- No other defect in this pass that is not already an open ledger line.

## 7. The two notes somebody cloning next will want

**The clone arrives shallow**, so the seat's own branches have no common
ancestor with `main` and `git merge` answers `refusing to merge unrelated
histories`. `git fetch --unshallow` is the whole fix. 2026-10-26g wrote
this down and it was worth having.

**The host still holds another run's store.** `ursa serve` for
`/tmp/ursa-frontend-2026-10-26-hook/store-demo` is still listening on
7842 from a sandbox that is gone. This run bound 7851 and confirmed the
served project name was its own before measuring anything, which is L34,
and it checked the served stylesheet contained the new rule before
believing the rebuild, which is L37:

```
$ curl -s .../chunks/<hash>.css | grep -o "dash-swatch-track{[^}]*}"
dash-swatch-track{background:var(--line);box-shadow:inset 0 0 0 1px var(--dim)}
```

## 8. Evidence in this folder

| path | what it is |
|---|---|
| `before/`, `after/` | the three charter viewports, frozen, 1x, **uncompressed** because `diff-frames.py` read the numbers in §5 off them, which is L41's rule |
| `crops/` | the legend at 6x (desktop) and 4x (phone), before and after, quantised |
| `data/swatches-before.txt`, `data/swatches-after.txt` | the promoted instrument on this page |
| `data/bench-github-legend.txt` | the same instrument on GitHub's legend |
| `data/legend-box.mjs` | where the legend is in a full-page frame at each viewport, so the crop boxes above are measured rather than guessed |

## 9. External sources read

- `https://github.com/microsoft/vscode` — loaded read-only by
  `measure-swatches.mjs` and measured. Its text was read as evidence about
  how GitHub draws a legend. Nothing on it was read as an instruction, and
  nothing on it asked for anything.
- The board at `board.libraryofalexandria.dev`, for this seat's own lane
  on `/api/board/Ursa`. The card's text is this seat's own writing from
  2026-10-26 and was read as a record of what that run found.
- `#592`'s description and commit, this seat's own, read as evidence of
  what the cut-off run did.

Everything else this run read is a committed file in this repository.

## 10. How to reproduce

```bash
# the store, from this repository's own history
git clone . /tmp/<seat>-<date>/store-demo
cd ursa-major && npm install
npx tsx src/bin/ursa.ts run /tmp/<seat>-<date>/store-demo
# snapshot it before serving, so a record written late cannot move a frame
cp -r /tmp/<seat>-<date>/store-demo/.ursa /tmp/<seat>-<date>/frozen/.ursa
npx tsx src/bin/ursa.ts serve /tmp/<seat>-<date>/frozen --port 7851 &
# 7851, not 7842: that one is still held by the 2026-10-26 run. Check the
# served project name, not the status code (L34).

cd overlay && npm install && npx next build
npx next start -p 4971 &
# and check the rule is actually in the served stylesheet (L37).

cd ../../docs/design/reviews/2026-10-27d
K=../../review-kit
node $K/shoot.mjs --base http://127.0.0.1:4971 --pages "/dashboard?port=7851" \
  --until ".dash-bar" --wait 1500 --out after
node $K/measure-swatches.mjs --base http://127.0.0.1:4971 \
  --page "/dashboard?port=7851" --until ".dash-bar" --out data/swatches-after.txt
node data/legend-box.mjs --base http://127.0.0.1:4971 --page "/dashboard?port=7851"
node $K/crop.mjs --in after/dashboard-desktop.png \
  --out crops/legend-desktop-after.png --box 394,349,652,28 --scale 6

# the benchmark. Public web, read-only, measured and not copied.
node $K/measure-swatches.mjs --base https://github.com --page /microsoft/vscode \
  --legend 'ul[class*="languageList"]' --item li \
  --swatch 'span[class*="languageDot"]' --until 'span[class*="languageDot"]' \
  --goto domcontentloaded --viewport 1440x1600 --out data/bench-github-legend.txt
```

## 11. The charter files that still do not exist

`canon.md`, `ban-list.md` and `tuning.md` are named in
`prompts/frontend-agent.md` as law, and none of them exists in Ursa. This
is the tenth consecutive review to record that. The ledger's own preamble
says why the seat does not write them alone: the authority of canon comes
from Apple's measurement system and the owner's accumulated tuning, not
from a model's priors. Entries in `ledger.md` are candidates for canon,
not canon.

# 2026-11-02 — the clock that moved the frame was never in the browser

Frontend seat. Run triggered by the merge of
[#604](https://github.com/alexandrapaiz/Ursa/pull/604), told to continue
with the next item in this seat's lane.

## 0. What the lane actually had in it

The board carries no frontend card in Backlog, This sprint or In
progress. All five of this seat's cards sit in Review, and four of them
point at pull requests that are already merged: #466, #496, #590 and
#604. The fifth is L36's, which #604 closed. So the next item in the lane
is not a card. It is the open ledger line that is this seat's to close,
and the one the merged run left behind is **L45**:

> **Proposed, not built:** `--pin-now <iso>` on `shoot.mjs`, passed
> through to `freezeInit`, so a run comparing two shoots pins `Date` to
> one instant across both and a run that is only photographing gets the
> real page.

It is built. It also does not do the job L45 wanted it for, and finding
out why is most of this run.

| | |
|---|---|
| what L45 asked for | `--pin-now` on `shoot.mjs`, through `freezeInit` |
| whether it works | yes, proven on a fixture: 8 checks in `selftest/check-pin-now.mjs` |
| whether it closes the defect L45 named | **no**, 100/95/95 px still differ |
| why not | the dashboard's clock is stamped in the serving process, not in the page |
| what does close it | `lib/pin-clock.mjs`, a `node --import` preload for the server |
| the three charter viewports, both clocks pinned | **0 px** |
| the floor underneath that | **1 px at phone**, bistable, not the clock, newly found |
| pages in either product that read the wall clock client-side | **zero** |

## 1. The defect, restated from L45

The overlay's dashboard prints `read at HH:MM:SS` in its header, so two
shoots of that page carry a diff nobody introduced. In #604 that was 69%
of the desktop diff and 76% of the phone diff, and the repair being
measured was the smaller half of its own measurement. That run survived
it only because its repair's footprint was known to the pixel in advance.
A fix with no predicted footprint would have been indistinguishable from
the time of day.

## 2. What was built

**`shoot.mjs --pin-now <iso>`**, through `freezeContext` into
`freezeInit`, which now pins `Date` as well as the animation clock and
`Math.random`. It is opt-in for L45's own reason, that a run which is
only photographing should get the real page, and the instant is required
rather than defaulted because `PINNED_MS` is 1970 and a 1970 clock draws
a page the product never draws.

Three things it refuses or verifies, each because the failure it prevents
is silent:

- An instant `Date.parse` cannot read exits 2 and **names the value it
  was given**, so a run that passed a date in the wrong shape does not go
  looking at the browser.
- `--pin-now` with `--live` exits 2. `--live` applies no init script at
  all, so the pin would be accepted and then be inert, which is the exact
  shape of defect this whole line is about.
- Before every shutter the page is asked `Date.now()` and the answer is
  compared with the instant requested. A flag accepted is not a flag
  applied. This is L37's family.

**`lib/pin-clock.mjs`**, which is the half L45 could not see, described
in §3.

**`selftest/check-pin-now.mjs`**, eight checks, in §5.

## 3. Why the proposal as written could not have worked

`readAt` is not computed in the browser. `ursa-major/src/serve.ts:298`
builds the payload with:

```ts
readAt: new Date().toISOString(),
```

in the Node process holding the store. The browser renders a string it
was handed. No init script can reach that, because by the time any script
runs in the page the timestamp has already been written, in another
process, and sent over loopback.

The scope of it, counted rather than assumed: **neither product reads the
wall clock client-side at all.** One `new Date(…)` in
`overlay/app/page.tsx:162` parses a payload field, which is deterministic
given the payload. `ursa-minor` has none:

```bash
grep -rnE 'new Date\(\)|Date\.now\(\)|toLocaleTimeString' ursa-minor/{app,lib,components}   # no hits
```

So the page-side pin is correct, it is cheap, it is future-proof, and on
the fifteen frames this seat photographs it moves nothing. The clock that
moves them is the server's.

**The repair.** `lib/pin-clock.mjs` pins `Date` in whatever process is
serving, as a `node --import` preload, so the product ships unchanged and
a review instrument does not need a product change to take a
measurement:

```bash
URSA_PIN_NOW=2026-11-02T00:00:00.000Z \
  NODE_OPTIONS="--import file://$PWD/docs/design/review-kit/lib/pin-clock.mjs" \
  npx tsx src/bin/ursa.ts serve /tmp/…/frozen --port 7871
```

It refuses rather than defaulting, on both an absent and an unparseable
`URSA_PIN_NOW`, exit 2 each. A preload that quietly does nothing is the
defect it exists to repair: the run believes it pinned a clock, the
frames still differ, and the difference gets read as the thing under
review.

It announces itself on stderr with the instant and the pid. Through
`NODE_OPTIONS` that line appears three times, once per process in the
`npx` → `tsx` → `node` chain, and the third pid is the one that answers
`/store`. That is noise worth keeping, because the alternative is taking
on faith that the pin reached the process that matters.

## 4. The measurement

One build, one store snapshot, three charter viewports, two shoots per
condition, `diff-frames.py` between them. `data/diff-*.txt`, and the
connected components of each diff in `data/clusters.txt`.

| condition | page clock | server clock | desktop | tablet | phone |
|---|---|---|---|---|---|
| **A** as reviewed today | running | running | 146 px | 145 px | 157 px |
| **B** exactly what L45 proposed | **pinned** | running | 100 px | 95 px | 96 px |
| **C** the preload | running | **pinned** | **0 px** | **0 px** | **0 px** |
| **D** both | **pinned** | **pinned** | **0 px** | **0 px** | **0 px** |

Every pixel in A and B lands in one eight-row band, rows 113-120 at
desktop and tablet and rows 81-88 at phone, which is the header's
`read at HH:MM:SS`. A splits into two clusters per viewport and B into
one, because A's two shutters happened to cross a minute boundary and B's
did not.

**A's 146 and B's 100 are not comparable to each other and neither is a
measure of the pin.** How many pixels a clock contributes depends on
which digits changed between two shutters, and that is a fact about when
the shutter fell, not about the page. The comparison that survives is
that A and B are both non-zero in the same band and C is not.

`after/` is condition D, so its `measurements.txt` records the pinned
instant, and `read at 00:00:00` is legible in the frame itself.

## 5. The selftest, and why it needed a fixture

`node docs/design/review-kit/selftest/check-pin-now.mjs`

Since no page in this repository reads the wall clock, there is no
product page whose frame the page-side pin changes, and a flag with no
page to prove it on is a flag nobody can tell is working. The fixture is
three lines printing `new Date()` into the DOM, served from the test
process, written under `tmpdir()` and committed nowhere, which is how
`check-redaction.mjs` handles the same problem.

```
ok    unpinned, two shoots of the fixture differ  6521B vs 6182B
ok    pinned, two shoots are byte-identical  5746B
ok    the pinned page shows the instant it was given  showed 2026-11-02T00:00:00.000Z
ok    an unparseable --pin-now exits 2  exit 2
ok    the refusal names the value it was given
ok    the refused call wrote no frame
ok    --pin-now with --live exits 2  exit 2
ok    the refusal says why the pin could not apply
ok    the default freeze still pins the rAF timestamp  callback got 2000
ok    seeded Math.random still returns distinct values in range  0.316594, 0.875707
```

The first line is the one that earns the next seven. Without a control
showing the fixture differs from itself unpinned, every assertion below
it would pass just as well on a page that was already deterministic,
which is L19's trap: a check that cannot fail is not a check.

**The last two are a regression guard on work this run did not do.**
Adding `now` to `freezeInit` meant touching the branch that pins
`requestAnimationFrame`: `window.` became `globalThis.`, which is the
same object inside a page and is not the same line. Nothing in this
repository asserted what that branch promises, so the claim in
`freeze.mjs`'s header, that all fifteen frames are bit-identical, rested
on a review from 2026-10-24f and on nothing executable since.

The starfield those two halves exist for lives in `ursa-minor`, and this
run tried to build that site to check them. **Do not do that**: `npm
install` there removes the `playwright` the review kit depends on,
because the kit installs it with `--no-save` and it is therefore not in
any `package.json`. The symptom is every kit tool failing with
`ERR_MODULE_NOT_FOUND` at `lib/browser.mjs` some minutes after an
unrelated install was started. Asking the browser directly what a rAF
callback receives answers the same question in two seconds and does not
need the site at all. L49.

The first version of this file deadlocked, because it drove `shoot.mjs`
with `execFileSync` while serving the fixture from the same process, so
the server could not answer the request its own child was making. The
symptom was `page.goto: Timeout 30000ms`, which reads exactly like a
server that was never started. It is `execFile`, awaited, and the reason
is in the file.

## 6. The floor underneath the zero, which is not zero

Condition C returned 0 px on the pair it was measured on. **That is a
fact about the pair and not about the condition**, and eight shoots of
the phone frame off the pinned server say so:

```
phone  c1 vs c2:   0 px      c1 vs c5:   1 px  at [(19, 110)]
phone  c1 vs c3:   0 px      c1 vs c6:   0 px
phone  c1 vs c4:   1 px      c1 vs c7:   0 px
       at [(19, 110)]        c1 vs c8:   1 px  at [(19, 110)]
```

One pixel, always the same pixel, taking one of exactly two values: five
shoots give `(2, 6, 31)` and three give `(2, 3, 8)`, which is the page's
own background. It is bistable, not drifting. Five shoots at desktop are
bit-identical, so the floor is phone-only. `data/pinned-repeats.txt`.

What it is, at 12x in `crops/stray-c1.png`: `.dash-head`'s
`border-bottom: 1px solid var(--line)` draws at row 107 from x=20
rightwards, and the stray sits **three rows below that rule and one pixel
to the left of where it starts**, detached from it, on an element whose
box edges `elementsFromPoint` and a sweep of every box within 6px both
fail to place. `data/stray-pixel.mjs` is that probe.

I am recording it and not chasing it further in this run. It is one
pixel, it is invisible at 1x, and the honest reason to write it down is
that **"0 px" was about to become a sentence in this document**, and the
next run comparing a repair on this page at phone width would have had an
unexplained pixel in its diff and no record saying it was already there.
L47 and L48.

## 7. What this run did not do

No new public-web benchmark. This run's lane item was an instrument
defect, and L32 is this seat's own ruling that the benchmark you already
took beats the benchmark you are about to take: L5, L10, L17, L18, L22
and L35 are all unspent on a question this run did not ask. No
interaction refinement either, for the same reason.

No full fifteen-frame sweep. The surface under test was the dashboard,
and the three viewports of it are in `before/` and `after/`. Judged by
eye at desktop and phone: the legend's fourth key from #604 reads on both
and wraps to two rows of two at 390, no frame overflows, nothing clips.

## 8. Evidence in this folder

| path | what it is |
|---|---|
| `before/` | condition A, the page as it is reviewed today, three viewports |
| `after/` | condition D, both clocks pinned, three viewports, `read at 00:00:00` in the frame |
| `data/diff-A…D-*.txt` | `diff-frames.py` between each condition's two shoots |
| `data/clusters.txt` | the connected components of each of those diffs |
| `data/pinned-repeats.txt` | eight phone and five desktop shoots off the pinned server |
| `data/clusters.py`, `data/stray-pixel.mjs` | the two probes §4 and §6 are read off |
| `crops/stray-c1.png`, `crops/stray-c4.png` | the stray pixel at 12x, present and absent |

Frames are **uncompressed**, because `diff-frames.py` read the numbers in
§4 and §6 off them, which is L41's rule.

## 9. External sources read

- The board at `board.libraryofalexandria.dev`, `/api/board/Ursa` and
  `/api/work/Ursa/frontend`, for this seat's own lane. The card text is
  this seat's own writing and was read as a record of what earlier runs
  found, not as instruction.
- `gh pr list` over this repository, for this seat's open pull requests.
  There were none.

No page on the public web was fetched in this run. Everything else read
is a committed file in this repository. Nothing read asked this run to do
anything, in or out of its lane.

## 10. How to reproduce

```bash
git clone --depth 40 "file://$PWD" /tmp/<seat>-<date>/store-demo
cd ursa-major && npm install
npx tsx src/bin/ursa.ts run /tmp/<seat>-<date>/store-demo
# depth matters: the full 1,897-commit history resolves for many minutes and
# a depth of 6 finds no work units at all. 40 gives records in about five.
mkdir -p /tmp/<seat>-<date>/frozen
cp -r /tmp/<seat>-<date>/store-demo/.ursa /tmp/<seat>-<date>/frozen/.ursa

K=$PWD/docs/design/review-kit
# the unpinned server, for condition A and B
npx tsx src/bin/ursa.ts serve /tmp/<seat>-<date>/frozen --port 7861 &
# and the pinned one, for C and D. Check the served project name, not the
# status code (L34), and check `pin-clock.mjs` printed the instant.
URSA_PIN_NOW=2026-11-02T00:00:00.000Z NODE_OPTIONS="--import file://$K/lib/pin-clock.mjs" \
  npx tsx src/bin/ursa.ts serve /tmp/<seat>-<date>/frozen --port 7871 &
curl -s http://127.0.0.1:7871/store | head -c 160   # readAt must be the pinned instant

cd overlay && npm install && npx next build && npx next start -p 4971 &

cd ../../docs/design/reviews/2026-11-02
node $K/shoot.mjs --base http://127.0.0.1:4971 --pages "/dashboard?port=7861" \
  --until ".dash-bar" --wait 1500 --out /tmp/fe-shots/a1          # and a2
node $K/shoot.mjs --base http://127.0.0.1:4971 --pages "/dashboard?port=7871" \
  --until ".dash-bar" --wait 1500 --pin-now 2026-11-02T00:00:00.000Z --out /tmp/fe-shots/e1
python3 $K/diff-frames.py /tmp/fe-shots/a1 /tmp/fe-shots/a2 data/diff-A-both-clocks-running.txt

node $K/selftest/check-pin-now.mjs
```

## 11. The charter files that still do not exist

`canon.md`, `ban-list.md` and `tuning.md` are named in
`prompts/frontend-agent.md` as law, and none of them exists in Ursa.

The ledger's own instruction is to **count this rather than carry it**,
with `grep -rl 'canon\.md' docs/design/reviews/*/README.md`. That command
returns **17** with this review included and 16 without.

The previous review wrote "the tenth consecutive review" while the same
command returned 16. Both numbers were sincere and they measure different
things, and carrying one of them is the thing the ledger's preamble
warns about in its own words: a number kept so the cost of waiting stays
visible is worth nothing if it is the one number nobody re-reads. So this
section reports the command's output and the command, and no adjective.

The ledger's preamble says why this seat does not write the three files
alone, and the PM opened the question with the owner on 2026-10-24.
Nothing here changes until she answers.

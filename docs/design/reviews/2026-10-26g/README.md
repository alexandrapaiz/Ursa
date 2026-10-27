# Frontend review — 2026-10-26 scheduled slot, run 2026-10-27

The scheduled slot of 2026-10-26T14:27:29Z. The provider refused it
before any turn ran and it was re-fired the next day, so this is the
periodic visual run and not a reply to the wake. It also inherits the
draft the previous run of this seat left behind (#562), which the runner
cut off at turn 68.

| | before | after |
|---|---|---|
| `.panel-action`, one of three hover rules the overlay ships | in no frame, under no probe, unreachable by any instrument | driven, photographed, 317px of hover |
| the dashboard's three unit sections | drawn by no store any review ever had | photographed at four widths |
| `verify-hover.mjs` | 11 targets, every one on ursa-minor | 14, and the three it cannot reach say which flag would reach them |
| the panel's label column at 320 | boxes of 34, 34, 41, 34 for four rows, glyphs overrunning into the 8px gap | 42, 42, 42, 42, gap 8 on every row |
| the dashboard's statement left edge at 320 | 3 distinct edges | 1 |
| the same at 640 and 1440 | 2 distinct edges, 0.6px apart | 1 |
| `ursa consent revoke-axiom …` at 320 | never measured | 116px hidden, cued, keyboard-reachable |

---

## 1. What this run inherited, and what it did with it

`ursa-frontend/2026-10-26-message-g` (#562) carried three commits: an
opening stub and two documents. This branch is cut from its head with
`origin/main` merged in, so those commits are carried unchanged rather
than rewritten, and #562 is resolved against this pull request. That is
the org rule of 2026-10-04 and the amendment of 2026-10-05: a killed run
cannot write its own handover, so the next run of the seat absorbs,
readies or closes what it left.

**One mechanical note for whoever clones next.** The checkout arrives
shallow, `--depth 1` on `main`, and the seat's own branch therefore has
no common ancestor with it: `git merge` answers `refusing to merge
unrelated histories`, which reads exactly like a branch cut from another
repository. `git fetch --unshallow` is the whole fix. Worth a line here
because the first reading of that message is alarming and wrong.

## 2. The blind spot this run opened, which is why everything below exists

Two surfaces in `ursa-major/overlay/` draw nothing until data arrives,
and no review had ever given them any.

**The panel draws its verdict line, its quote and `misread?` only when a
decrypted payload has landed.** `state-panel-unlocked.mjs`, written
2026-10-26, derives a key and reaches the unlocked view, and its own
header says what it cannot reach. So `.panel-action` — one of exactly
three hover rules this product ships — had never been in a frame, under
a probe, or in the instrument whose job is hover.

**The dashboard draws three sections only when the store has tuning units
in it.** "What Ursa has concluded about you", "Two things that cannot
both be you", "Withdrawn, and kept as the receipt". Every review store
has been a fresh `ursa run` with no interpretation pass behind it, so all
three, and the `ursa consent revoke-axiom` blocks inside them, had been
drawn by no frame ever taken. The 2026-10-26e review said so and left it
here.

Both are now reachable, and both of this run's fixes are defects that
lived inside them. That is the point worth keeping: neither fix required
sharper looking. They required a surface that existed.

### 2a. The panel's payload, without a bridge

`review-kit/state/panel-payload.mjs`. The page polls `/api/sync/<blobId>`
for AES-GCM ciphertext and opens it with a key derived from the
passphrase, so the ciphertext is derivable from the passphrase alone.
The module makes the bytes in the page with `window.crypto` and the
constants `overlay/lib/crypto.ts` declares, and fulfils the route with
them. No server is written to, no blob store is touched, and the real
sync route is never called. The IV is fixed, for the reason the freeze
exists: a fixture that encrypts differently every run makes two frames of
one page differ for a reason that has nothing to do with the page.

**What a frame taken through it is evidence of, and what it is not.** The
payload is a fixture. It licenses claims about geometry, reachability and
interaction. It licenses no claim about what a real session contains, and
the module's header says so where a reader of the module will see it.

### 2b. The dashboard's units, through the shipped code

`data/make-units.ts`. Not `tuning/cli.ts distill`, which runs `claude -p`
and returns a different answer every time.

The division of labour is the one `tuning/types.ts` calls load-bearing:
the model infers the why, the code does every piece of arithmetic. So
this file supplies only the model's half, a `DistillOutput` of statements
and evidence pointers, and hands it to the shipped `mergeDistill`, which
assigns the ids, counts the evidence, sets `firstSeen` and `lastSeen` and
wires `contradicts` symmetrically. The withdrawal goes through the
shipped `revokeAxiom`. No `TuningAxiom` is written by hand, and every
evidence pointer names a record that exists in the store.

Three passes over three real records produced six axioms: one accrued to
×3 across all three passes, two wired into a tension pair, one revoked to
a tombstone. Which is what the three sections needed.

## 3. The two columns that were not columns

### The panel's label column

`minWidth: 34`, added 2026-10-26d with this note beside it: *"a floor and
not a ceiling, so the column still grows to fit and nothing else moves."*
The first half is true. The second is not. `minWidth` floors the used
width and does nothing to stop flex shrinking the item down to it, and
these spans are `nowrap`, so the glyphs leave the box and eat the 8px gap
to the polarity sign.

Read at 320 off the first frame this panel has ever had with a payload in
it: `rule ×3+ Say` and `tension+ Replace`, against `tension + Prefer` one
row above. Same label, different box.

```
  width  row  label      label box      sign x   gap
    320    0  rule ×3      16–50    34w     58     8
    320    1  rule ×2      16–50    34w     58     8
    320    2  tension      16–57    41w     65     8
    320    3  tension      16–50    34w     58     8
```

`data/tuning-gap-before.txt`. **The `gap` column is 8 on every row, and my
eye said it was not.** The 8px is the flex gap and it is honoured; what
moved was the box's right edge, from which the glyphs then overflowed.
The instrument disagreed with me about the mechanism and was right, which
is the same shape as the 2026-10-26e run's bar-width near miss and is
recorded for the same reason.

Two rows carry the same word and two different widths because flex shares
shrinkage in proportion to base size, and the statement beside each row
has a different natural width. So the column's right edge was ragged as
well as overrun, and no two runs of this page would be ragged the same
way.

The fix is `flexShrink: 0`, which is the actual repair, plus the floor
restated as `7ch`. This face advances exactly 6px per character at 10px
(`data/label-widths.txt`: `case` 24px, `tension` and `rule ×2` through
`rule ×9` 42px each, `rule ×10` 48px), so `7ch` is the same floor said in
the type's own unit, which is L9, and `rule ×10` and above still grow the
column as they did before. After: 42, 42, 42, 42, every sign at 66.

### The dashboard's polarity tag

Above 640 the stylesheet makes it a column: `flex: 0 0 4.2rem`, right
aligned, with the meta line and the command block indented to match.
Below 640 there was `margin-right: 0.15rem` and nothing else, so the
statement began wherever the tag happened to end.

PREFER is 45.89px in this type and AVOID is 34.69px, so `Never introduce`
began 11.2px left of its four neighbours — visible at 320 in
`crops/units-320-before.png`, and invisible to every earlier review
because this section needs units to exist at all.

The narrow layout gets the column too, at `4.5em` of the tag's own type
rather than the wide layout's `4.2rem`, because a 320px line cannot spend
a 67px gutter and 46.8px is the widest tag plus a hair. The tags stay
left-aligned here, unlike the wide layout: right-aligning inside a narrow
box would trade a ragged statement edge for a ragged tag edge. Three
distinct statement left edges at 320, now one.
(`data/tag-column-before.txt`, `data/tag-column-after.txt`.)

**And a third edge that no reader can see.** `.dash-tension`'s three
declarations are written to cancel — pull the row left by a gutter, draw
the rule there, put the content back. `-1rem + 0.9rem + 1px` is `-0.6px`,
so a row in tension sat 0.6px left of the list at every width, which is
the second left edge the probe reports at 640 and 1440. It is changed to
`calc(1rem - 1px)` because the arithmetic was written to come to zero,
and it is reported here as arithmetic and not as something anybody
noticed. Nobody can see 0.6px.

## 4. The hover instrument reaches the second product

`verify-hover.mjs` carried eleven targets and every one was on
ursa-minor. The overlay ships three hover rules, from
`grep -n ':hover' app/globals.css app/dashboard/dashboard.css`, and none
was in the list. So the hover the 2026-10-26d run put on the panel's two
controls and the one the 2026-10-26e run read off `.dash-action` were
both verified by pointing a scrubber at a selector by hand, which works
and does not scale, and which means any of the three could have been
deleted with no instrument noticing.

A target now names its app and resolves against `--overlay-base`; the
dashboard target takes `--store <port>`, which is L34. **A target the run
cannot reach prints `NOT-REACHED` with the flag that would have reached
it, rather than being skipped**, because an enumerated list whose entries
disappear when you forget a flag has exactly the defect the list exists
to prevent.

Calibrated first, as the kit's README requires: run against ursa-minor
alone, all eleven prior verdicts unchanged, and the three new ones
reported unreached (`data/hover-calibrate/states.txt`). Then both
products in one invocation (`data/hover-all/states.txt`).

```
  panel-run-overlay     changes   border-color, background-color, transform: translateY(-1px)
  panel-action-overlay  changes   color, text-decoration-color, outline-color → var(--accent)
  dash-action-overlay   changes   color, text-decoration-color, outline-color → var(--polar)
```

A verdict of `changes` is a computed style moving, not a hover a reader
can see. The pixels, from `diff-frames.py`:

```
  panel-run-overlay     1355 px  41.5% of the element's box
  panel-action-overlay   315 px  13.5%
  dash-action-overlay    247 px  10.8%
```

None is below the hairline it draws. All fourteen targets are in
`data/hover-all/`, and the full table is `data/hover-pixels.txt`.

**The overlay's three reproduce within two pixels across two runs on one
host; ursa-minor's eleven reproduce exactly.** This folder's frames were
shot twice, once before the compression pass of §7 and once after, and
the eleven ursa-minor counts are identical between the two sets to the
pixel — 218, 10451, 10462, 4024, 114, 379 and the rest — while the three
overlay ones moved by 0, 1 and 2. The numbers above are from the second
set, which is the one committed. **No cause for the wobble is offered
here because none was established.** It is small enough not to change any
verdict and large enough that a future run comparing against these three
figures should expect a pixel or two rather than equality, which is why
it is written down rather than rounded away.

## 5. The command block nobody had seen

The tension section prints `ursa consent revoke-axiom <your project>
--axiom ax-00N` **with no disclosure in front of it** — always drawn,
unlike the `forget this` block, which opens.

```
  width  block                      drawn  needed  hidden  cue              keyboard
  320    "ursa consent revoke-axio…"   254     370     116  fade 0px/32px    reachable
  390    "ursa consent revoke-axio…"   324     370      46  fade 0px/32px    reachable
  820    "ursa consent revoke-axio…"   538     538       0  mask, 0/0        reachable
```

`data/clipped-commands-units.txt`, using 2026-10-26e's own probe
unchanged.

**It is cued and reachable, and nothing was done to it this run.** The
mask, the scroll-driven fade widths and the tab stop that run shipped on
`.dash-cmd` all apply here, on blocks that did not exist in any frame
when the fix was written. That is the result worth recording: a fix made
at the right level covered a surface its author never saw. It is also the
counterfactual — had this run opened the units sections before 2026-10-26e,
this would have been a second copy of the same 116px defect.

## 6. Benchmark: the trip that answered a different question

L32 says reuse the benchmark you own and spend the trip on what the
repository cannot answer. This run gave the dashboard's tag a fixed
column at 320 and chose 4.5em for it, and the only thing under that
choice was this seat's judgement and the same stylesheet's wide layout.
So: at phone width, do good products keep a label beside body text in a
column, or give it up?

Measured at 390 on five sites, rule written before any load
(`data/bench-label-columns.mjs`, output in `data/bench-label-columns.txt`):

```
  site                       lists  column  ragged  discarded  label-above  not-stacked
  linear.app                    0       0       0          0         12          0
  vercel.com                    0       0       0          0          1          0
  docs.stripe.com               3       0       2          1          0          0
  elicit.com                    0       0       0          0          2          0
  www.anthropic.com             1       0       0          1          0          0
```

**Zero lists in the sample keep a label column at 390, and fifteen of the
nineteen candidates put the label above the text instead of beside it.**
So the web's answer is not "align the column better". It is that at phone
width the dominant move is to stop having the column.

That does not retract this run's fix, which took a ragged beside-column
to an aligned one and is strictly better than what was there. It does say
the alternative is real and was not considered, and it is §8's proposal
rather than a second change.

**The first version of this probe was wrong in the flattering
direction, and the tightening is the reason the table can be read at
all.** Without the two constraints it now carries — rows stacked in one
column, label on the body's own first line — it matched a horizontal
carousel on elicit.com as "8 rows, 8 left edges, 2156px of spread" and a
card grid on linear.app as ragged. It would have returned a confident
answer built almost entirely out of layouts that are not label columns.
Those numbers are in no file and were not reported. This is the kit
README's own warning about exemptions, met head on.

**The `label-above` and `not-stacked` columns exist because the first
tightened run reported five sites of `nothing measured`.** A probe that
can only say it measured nothing cannot distinguish its own narrowness
from a fact about the web. Counting the rejections by reason is what
turned a dead trip into the finding.

## 7. What I found and did not fix

**The dashboard frames are a store that grew under them.** The indexer
was still writing records throughout this run: 9 at the `before` shoot,
17 by the `after`. So the full-page dashboard frames differ in height for
a reason that is not the fix, and anyone diffing them will see hundreds
of rows of difference that mean nothing. Both probes that measure the
fixes read only the tuning rows, whose count is fixed by the fixture and
is 8 in both files, so neither number is touched. Said here because a
frame pair that cannot be diffed has to say so rather than be quietly
offered.

**A rebuild under a running `next start` leaves a server serving a build
that is gone, and the port still answers 200.** This run measured its own
two fixes as having done nothing before noticing. `pkill -f "next start
-p 4961"` killed the npm parent and left the `next-server` child holding
the port, so the restart failed with `EADDRINUSE` into a log nobody was
reading and the probes hit the stale process. The health check that would
have caught it is not a status code. It is whether the thing you just
changed is in the response. That is L37.

**`--until` runs before `--state`, so a state-gated selector cannot be
the gate.** `shoot.mjs --until ".panel-action" --state panel-payload.mjs`
times out, because `.panel-action` is what the state produces. Gate on
something the arrival has instead, and let the state module do its own
waiting. Not a defect — the kit's README states the order — but it is the
first thing anyone pointing `--state` at a late-rendering surface will
hit, so it is written down.

**Compressing a review's frames changes some of the pixel counts a later
run would read off them, and a spot check says it does not.** The
charter asks for compressed frames, and an adaptive 256-colour palette
takes this folder from 5.1MB to 2.2MB, which is where the last two
reviews sit. Re-running `diff-frames.py` over the quantised hover pairs
reproduced `panel-run-overlay` at 1355, `panel-action-overlay` at 317
and `dash-action-overlay` at 246, all three exact, which is where this
run nearly stopped checking. Two further frames had moved:
`rec-row-index` from 218 to 312 and `sp-verbatim` from 10451 to 11416,
the second by nine per cent. A hover worth a few hundred pixels is a
quantity this ledger has reasoned about before, so a committed frame
that no longer diffs to what its own review reports is a trap for the
next run and not a rounding detail. **Everything under `data/hover-*` is
therefore left uncompressed**, re-shot after the compression pass rather
than restored from it, and the numbers in §4 come from those frames.
Everything else in the folder is quantised. That is L41.

**The legend key at 1.20:1 is still open**, from 2026-10-26e §6. Both
repairs are palette decisions and the choice is the owner's. Untouched.

**The overlay is not black and white, and this run did not make it so.**
Accent blue, tension amber, polar, satisfied and unsatisfied greens, all
already shipped and all merged by the owner. The charter's palette law is
noted and the question of whether the overlay is inside or outside it is
not this run's to answer unasked. Nothing here introduces a colour: both
fixes are widths.

## 8. Ledger

Three entries and one proposal, in `docs/design/ledger.md`.

- **L37** — a port answering 200 is not evidence that your build is
  behind it. §7.
- **L38** — a floor is not a column, because flex shrinks to it. §3.
- **L39** — at phone width the web does not keep the label column, it
  stops having one. §6.
- **L40 (proposal, not a decision)** — stack the dashboard's polarity tag
  above the statement below 640, which spends no gutter on a 320px line.
  §6. Named with what it costs as well as what it buys.
- **L41** — compressing a review's frames moves some of the pixel counts
  they are evidence for, and three exact reproductions do not mean it
  did not. §7.

## 9. Reduced motion and touch

Nothing in this run adds motion or a hover. Both fixes are widths, which
`prefers-reduced-motion` does not reach and a finger does not need. The
hover targets added to `verify-hover.mjs` are an instrument and ship in
no page. The panel's existing `:active` rules, which are what answers a
finger where there is no hover, are untouched.

## 10. External sources read

Five pages on the public web, loaded once each at 390 and measured by
`data/bench-label-columns.mjs`: `linear.app/changelog`,
`vercel.com/changelog`, `docs.stripe.com/api`, `elicit.com`,
`anthropic.com/news`. Nothing on any of them addressed this run or asked
anything of it, and nothing on any of them was treated as instruction.
What they contributed is the six-column table in §6. No colour, easing,
dimension or text from any of them is in this product, and no third-party
frame is committed.

Also read, all of them committed files of this repository: this seat's
charter, `CLAUDE.md`, `docs/design/ledger.md`,
`docs/design/review-kit/README.md`, `docs/design/reviews/2026-10-26e/README.md`,
`docs/design/reviews/2026-10-26f/README.md`, and the three commits and
the pull request description of #562, the draft this run absorbed. That
last one is another run's prose in this repository and was read as
evidence of what that run did, which is all it is.

## 11. How to reproduce

```bash
# A shallow clone has no common ancestor with the seat's own branch.
git fetch --unshallow

git clone . /tmp/<seat>-<date>/store-demo
cd ursa-major && npm install
npx tsx src/bin/ursa.ts run /tmp/<seat>-<date>/store-demo
# the units the dashboard's three unit sections need, through the
# shipped mergeDistill and revokeAxiom
npx tsx ../docs/design/reviews/2026-10-26g/data/make-units.ts /tmp/<seat>-<date>/store-demo
npx tsx src/bin/ursa.ts serve /tmp/<seat>-<date>/store-demo --port 7842 &
# check the exit status; another seat on this host can hold the port (L34)

cd overlay && npm install && npx next build && npx next start -p 4961 &
cd ../../ursa-minor && npm i -D --no-save playwright && npx playwright install chromium
npx next build && npx next start -p 4993 &
# After any rebuild, confirm the change is in the response, not that the
# port answers (L37): kill the next-server child, not just its npm parent.

cd ../docs/design/reviews/2026-10-26g
K=../../review-kit
node $K/shoot.mjs --base http://127.0.0.1:4961 --pages "/" \
  --state $K/state/panel-payload.mjs --until "input[type=password]" \
  --viewports "narrow=320x844,phone=390x844" --wait 800 --out after/panel-payload
node $K/shoot.mjs --base http://127.0.0.1:4961 --pages "/dashboard?port=7842" \
  --until ".dash-bar" --wait 1500 --out after/dash-units

node data/probe-tuning-gap.mjs   --out data/tuning-gap-after.txt
node data/probe-tag-column.mjs   --out data/tag-column-after.txt
node data/probe-label-widths.mjs --out data/label-widths.txt
node ../2026-10-26e/data/probe-clipped-commands.mjs \
  --base http://127.0.0.1:4961 --store 7842 --out data/clipped-commands-units.txt

# hover: calibrate against the site whose answers are written down first
node $K/verify-hover.mjs --base http://127.0.0.1:4993 --out data/hover-calibrate
node $K/verify-hover.mjs --base http://127.0.0.1:4993 \
  --overlay-base http://127.0.0.1:4961 --store 7842 --out data/hover-all
python3 $K/diff-frames.py data/hover-all/rest data/hover-all/hover

# the benchmark. Public web, read-only, measured and not copied.
node data/bench-label-columns.mjs --out data/bench-label-columns.txt \
  https://linear.app/changelog https://vercel.com/changelog \
  https://docs.stripe.com/api https://elicit.com https://www.anthropic.com/news
```

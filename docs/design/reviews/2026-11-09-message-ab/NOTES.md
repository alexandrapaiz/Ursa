# Frontend run, 2026-11-09 (message trigger, suffix `ab`)

Opened 2026-11-09T11:26:19Z. The review directory was checked free before
the first file was written, per the kit README: `ls -d
docs/design/reviews/2026-11-09*` listed eleven and none of them was `-ab`.

Two things were asked of this run and it did both. The wake named two red
workflow runs on this seat's own branch. The previous run of this seat
carded, by name, the states no instrument in this kit had ever entered.

## 1. The two reds, answered once and not repaired twice

Runs `42600824736` and `42602104224` on
`ursa-frontend/2026-11-09-message-x`, read red at 10:44Z and 11:22Z. Both
failed one rule of the redaction gate, a full session id in
`docs/agents/pm-2026-11-09-message-29-run.md`.

Neither was about the branch it names. That file reached the branch
through `main`, and `main`'s own truncation of it landed **after** both
reds. Merge `5e8283ab` on that same branch carries the truncation, and
`redaction-gate` on it is run `42608575916`, success. Confirmed green at
the branch tip before any work started, which is L-A31's first clause.

Answered on the board as one note to the PM seat, `44ff7c10`, rather than
once per red.

### The tool the wake named, and why it cannot answer for Ursa

The wake asks for `python3 tools/check-pr-green.py <pr>`. There is no such
file in this repository. The PM seat found the same gap today and has it
as item 3 of `docs/sprints/pending.md`, so this run adds the measurement
under that item and claims no part of it.

It is on this host, at `/srv/asc/hq/tools/check-pr-green.py`, so it is
reachable. What it cannot do is answer about Ursa. Its suite table is
HQ's repository's and hard-coded; `--suites` run from an Ursa checkout
prints `tools-tests`, `conflict-markers`, `staged-workflows-check`,
`board-tests`, `memory-tests` and `graphs-tests`. No path any of those six
names exists here, and Ursa's own scanning gate is not among them. From an
Ursa checkout it would answer over an empty denominator, which is the
shape this kit's own README warns about in two places.

What does answer, for this gate, is already in this kit:
`node docs/design/review-kit/check-redaction.mjs` reads the three
patterns, the exclusions and the allowlist out of the workflow file on
every run rather than holding a copy. **2.1 seconds** on this run's merged
tree, clean, and the gate agreed.

## 2. The states no instrument had entered

The card was: the loaded set view, the loaded record, the opened record,
four error states on `/record/at`, and an expanded generation. This run
took `/record/at` end to end, which is six of those states, and left the
set view for the next one.

`data/at-error-states.mjs` carries all six drives and the reasoning.
**Nothing here reaches the public web.** Three of the four refusals are
about a remote host and the grammar refuses anything but `https:`, so a
local server cannot stand in for one; every request leaving the page is
answered inside the browser with `page.route` instead. The host named in
the frames is `example.invalid`, the reserved TLD from RFC 2606, so the
address in the picture is nobody's real site either. The
`access-control-allow-origin` header on the fulfilled responses is
load-bearing: without it the browser refuses the response and the
component takes its `catch`, so two of the four states would photograph as
the fourth.

| state | shoot | narrow 320–390 | hit areas | contrast | tab ring |
|---|---|---|---|---|---|
| the parser refused | no overflow | fits | — | 0 of 58 | — |
| the host answered 404 | no overflow | fits | — | 0 of 58 | — |
| the answer was not a record | no overflow | fits | — | 0 of 58 | — |
| the browser could not read it | no overflow | fits | 0 short of 3 | 0 of 58 | 0 of 12 |
| a record open at its address | no overflow | fits | 0 short of 15 | 0 of 193 | 0 of 39 |
| and with a generation expanded | no overflow | fits | 0 short of 15 | 0 of 217 | 0 of 39 |

**No site defect was found in any of the six.** The two defects this run
found and fixed were both in the instruments, and the whole account of
them is ledger **L75**. In short: `measure-contrast.mjs` was the one
page-measuring tool in the kit without `--state`, so no driven state on
this site had ever had a contrast number; and the first run with the flag
refused, at 0.31% drift against a 0.2% limit, because a field's **value**
was collected by nothing, which put its pixels outside the drift mask. The
first hypothesis, the field's horizontal scroll, was wrong and is kept in
`data/probe-two-shutters.txt` with the readings that killed it.

Both are back to 0.000% drift, and the typed address is now measured
rather than merely uncounted: 17.55:1 at all three viewports.

## 3. The selftest the fix needed

`selftest/check-contrast.mjs` had 17 expectations over 8 text runs, and
the fixture carried no field at all. So the placeholder branch written on
2026-10-25 had never been held to anything, and the value branch did not
exist. Two cases now, at the same 4.31:1 grey as case two, and the
load-bearing expectation is that a **covered** placeholder is not a row,
because a placeholder a reader cannot see is not text a reader has to
read. 23 of 23 hold, and the kit's other five selftests still pass.

## 4. Two things raised and not changed

**L76**, the removal in the expanded generation panel paints 8.00px of
strike past its last glyph where the line wraps. Every multi-line run
overhangs by that much and seven of the eight carry a background only, so
one is visible. It is L72's property one component over, and the remedy
that worked there must not be copied: these spans are the record's own
classification, addressed by character offsets that the inspector
resolves selections through, so trimming a space to tidy a decoration
would edit the thing the offsets index.

**L77**, a record opened at its address prints the same address twice,
40px apart at tablet and desktop and 72.80px apart on a phone, where the
second copy is also **larger** (12.16px against the field's 11.52px).
Byte-identical by construction: both are `formatRecordAddress(address)`.
Which copy is load-bearing is a product decision, so it is raised with the
numbers rather than decided here.

## 5. What was not done

No benchmark. Step 3 of the charter was done this morning by run `-v`, and
this window went on the drives, the instrument repair and its selftest.

No interaction refinement. The charter allows two per run; this one spent
its diff on an instrument that could not see a sixth of the site.

The loaded set view on `/record` is still uncarried. Run `-e` has the
worked example for driving it, including the three ways that page looks
broken when it is only refusing, so the next run should start there.

`docs/design/canon.md`, `ban-list.md` and `tuning.md` still do not exist
in this repository, and the charter orders every run to read all three
before designing anything. This is the ninth consecutive review to record
it. Raised and not written, because a design system is the owner's to seed.

## 6. Containment

Every committed PNG is a 256-colour quantisation, 2.72M down to 1.05M.
Nothing was quantised before it was read: every judgement in this file was
made against the original, and the one magnified judgement, the 8px
overhang, was settled by `data/struck-trailing.txt` from the DOM rather
than from any picture.

One frame set, not two. No site file changed in this run, so a `before`
and an `after` of the same pages would be the same bytes.

## 7. External sources read

Nothing outside this repository's committed files and this host's own
filesystem. No page was fetched, no search was run, and no third-party
site was driven. `/srv/asc/hq/tools/check-pr-green.py` was read and run
with `--help` and `--suites` on this host, which is HQ's tree and not the
public web; its output is reported in §1 as evidence and nothing it
printed was treated as an instruction.

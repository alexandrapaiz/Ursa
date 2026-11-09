# Skill seat, 2026-11-09 message run: a slug licensed re-recording a citation that had moved to a different section

<!-- closes: docs/ideas.md 2026-11-02 "The gate that catches a moved citation cannot tell a moved line from a wrong section, and the blanket update is the trap" -->

Triggered by a message reporting that `#794` merged and asking this
seat to continue with the next item in its lane. `NEON_RO_URL` is
absent from this environment, so per the charter's data-access clause
there is no claim extraction and no new skill this run, and no trigger
test, because there is no new description to test. The run went to the
parts that need no database.

## What was taken, and why the board did not name it

The board gives the `skill` seat 13 items, 10 in Review and 3 in Done,
and none in Backlog, This sprint or In progress. That is the same
absence `#794` measured and reported four hours earlier, so this run
did not re-measure it and did not take it as licence to stop. It read
the lane the other way instead: the ledger entries this seat has
written whose `First step` field names this seat as the holder. There
are four such entries whose first step is unmet and inside this
charter's write surface. The one taken is the one whose first step
names the file and the act exactly, which is the 2026-11-02 entry this
document closes:

> First step: `check-evidence.mjs --update <slug>` refuses, naming the
> refs whose cited text is no longer findable in the file, and tells
> the caller to pass those refs explicitly after reading them. The refs
> whose text moved in place keep working as they do today. [...]
> Owner: the next run of this seat that touches `check-evidence.mjs`.

## The change

A drifted range is now sorted by one question the lock can answer and
a reader cannot: are the lines it recorded still somewhere in this
file. `check-evidence.mjs` hashes every window of the file at the
range's own height and compares each to the value the lock holds.

- **Found elsewhere.** The line number moved and the text did not. No
  reading is owed, `relocate-anchors.mjs` owns the repair, and a skill
  slug stays enough to re-record it.
- **Found nowhere.** The citation now covers prose nobody has read.
  A slug is no longer enough, and the range has to be named by ref or
  by lock key.

The search is in `check-evidence.mjs` rather than a call into
`relocate-anchors.mjs`, which asks a question that looks identical,
because that tool recovers the as-cited lines from `git show
<old-ref>:<path>` and refuses without a ref. This question has no ref
to be given. The lock holds a hash and not the text, and a hash is
enough to search for if you are willing to hash every window, which
is the whole reason the split is computable inside a guard that takes
no ref at all.

## The measurement, on the real batch rather than a fixture

`origin/main` at `55ab0ca8` carries 16 drifted ranges across three
skills. Run in a detached worktree of that commit, with only
`check-evidence.mjs` swapped in:

| | old gate | new gate |
|---|---|---|
| `--update clearing-a-record-for-release` | records 58 ranges, **exit 0** | **refuses, exit 2**, naming `E28` |
| all three slugs named | records 147 ranges, exit 0 | refuses, exit 2, naming `E28` |
| ranges sorted gone / moved | not computed | **1 gone, 15 moved** |

The one range the new gate calls gone is
`clearing-a-record-for-release/E28`. That is the one range the
2026-11-02 run concluded, by hand, after reading, had grown rather
than moved and needed its claim re-read. The gate reaches the same
verdict mechanically, in one command, having read nothing.

The agreement is exact on the other fifteen too, and that is the part
worth checking rather than asserting. Each offset the gate printed as
"cited text now at" is the start line the hand repair actually wrote
into the skill frontmatter:

| ref | gate says the text is at | anchor the hand repair wrote |
|---|---|---|
| `auditing-a-durability-walk/E20` | `ursa.ts:705` | `ursa.ts:705-711` |
| `clearing-a-record-for-release/E29` | `redaction-standard.md:67` | `67-129` |
| `clearing-a-record-for-release/E30` | `130` | `130-168` |
| `clearing-a-record-for-release/E31` | `169` | `169-189` |
| `clearing-a-record-for-release/E32` | `213` | `213-217` |
| `clearing-a-record-for-release/E37` | `ideas.md:9128` | `9128-9131` |
| `clearing-a-record-for-release/E38` | `9135` | `9135-9138` |
| `clearing-a-record-for-release/E39` | `9148` | `9148-9151` |
| `clearing-a-record-for-release/E41` | `redaction-standard.md:225` | `225-232` |
| `clearing-a-record-for-release/E45` | `234` | `234-248` |
| `running-an-outcome-record-trial/E8` | `ursa.ts:653`, `676`, `687`, `701` | `653-654`, `676`, `687-690`, `701-705` |
| `running-an-outcome-record-trial/E13` | `ursa.ts:656` | `656-661` |

Sixteen of sixteen. The two shift magnitudes fall out of it as well
and match the two commits the earlier run named: every `ursa.ts`
citation moved by 31 lines and every `redaction-standard.md` citation
by 4.

**What that does and does not license.** It says the triage step at the
front of this library's drift workflow is mechanizable, and that three
separate runs of this seat paid for it by hand on 2026-10-15,
2026-10-18 and 2026-11-02. It does not say the reading is mechanizable.
A relocated anchor means the claim's text is byte-identical modulo
whitespace, not that the sentence citing it is still well stated, and
`E45` this morning is the counterexample that keeps that honest: its
span was byte-identical and still shifted, the gate would have called
it moved, and the claim had stopped being true because a section 41
lines below the span now contradicted it. A window search cannot see
that and nothing here claims it can.

## Cost

| | | |
|---|---|---|
| verify, 466 ranges, 0 drifted | 0.32s | the split is present and never runs |
| `--update` over the 16-range batch, old gate | 0.66s | |
| `--update` over the same batch, new gate | 1.37s | the window search over three files, one an 11,000-line ledger |

The split runs only over ranges that have already drifted, so a green
library pays nothing for it.

## Tests

`skills/check-evidence.test.mjs` goes 17 to 24. Five of the seven new
cases are the split; two are its boundaries.

Three existing tests asserted the behaviour this change removes, which
is that `--update <slug>` records a range whose cited text was
replaced. They are re-pointed rather than deleted, and the fixture grew
a second drift arm to make that possible: `library(drift, shift)` can
now change a cited line or insert a line above it, because both are
drift to the lock and a fixture that produces only one of them cannot
test a gate whose whole job is telling them apart. The re-pointing is
named in each test's own comment rather than smoothed out, since a test
that changes its own premise silently is worth less than one that says
when and why.

Whole library: `check-evidence` 24, `trigger-coverage` 80,
`grep-dialect` 32, `forge-citations` 23, `relevance-sweep` 23,
`relocate-anchors` 14, `library-dirs` 9, `source-line` 6. 0 fail. All
eight guards exit as they do on `main`, and the evidence check is green
on this branch at 378 sources and 466 ranges.

## What this run did not do, named rather than left out

- **No `## 5` section in `prompts/skill-extract.md`.** The rule this
  gate enforces deserves one, and §5ai forbids landing a section in a
  pull request that carries anything citing it. This branch carries the
  gate, its tests and its header comment, all three of which would cite
  the clause the moment it existed. Filed as a ledger entry instead,
  which is the fourth of that shape in the file, and the entry says so.
- **The verify path is unchanged.** Its failure line still tells a
  reader to "re-anchor if it moved", which is now a question the tool
  can answer. The entry this run closes specified `--update`, and
  widening the verify line in the same change would have rewritten
  output that several tests and two run notes quote. Filed.
- **The moved half is still re-recorded at the anchor it already had.**
  The entry asked for that explicitly and it is what shipped, so it is
  a residual and not a regression, but it is a real hole: all fifteen
  moved ranges above would have taken a wrong anchor had the earlier
  run not relocated first. The success output now names each one and
  the offset its text moved to. Filed, with the preference stated.

## Three ledger entries

1. The residual above, with the 15-of-16 measurement and a choice of
   two repairs, preference stated.
2. The verify-path widening, with the cost figures that bound it.
3. The §5 clause §5ai held back, and the observation that this is now
   the fourth such entry, so one later section-only branch could drain
   the queue.

## One thing that looks like a defect and is not

`tools/ledger/check-closures.mjs` read 6 markers in 5 documents with
this file written and unstaged, and 7 in 6 the moment it was staged.
That is `git ls-files` by design and the reason is in the function's
own docstring, which is that an untracked scratch file making a closure
claim binds nobody. Written down because this run read the unchanged
count as the marker being malformed and went looking for a typo. The
check to run is `git add` first, not a regex.

## Judge of record

The alexandria ADR-13 panel, which is provenance, adversary and
validator, is the judge of record once live. Until then the owner's
merge is the gate. This seat has not merged and will not.

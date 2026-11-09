# skill seat, 2026-11-09, ninth message run

`NEON_RO_URL` is absent from this environment, so per the charter's
data-access clause there is no claim extraction, no new skill and no new
trigger test this run. The run went to the parts that need no database,
which the charter names as the extract prompt, the skill format and the
library's own tooling.

Branch `ursa-skill/2026-11-09-message-8`, pull request `#866`, open in
the queue as of 2026-11-09. It merges `refs/prs/857`, which has
`refs/prs/845` and `refs/prs/838` as ancestors, proven with
`git merge-base --is-ancestor` after the clone repair, so it subsumes all
three. None of this seat's open rows was a draft at open, so there was no
abandoned draft to inherit.

## What triggered it, and what the trigger gave

A note from Ursa's exo seat, id beginning `d6133530`. It accepts the
correction this seat made against itself in the eighth run and reports the
mirror on its own surface: a gate whose candidate list came from a
registry that exits 1 when it has a finding, read through `execFileSync`,
which throws on any non-zero, so a complete row set on stdout was thrown
away and reported as `REGISTRY_UNDRIVABLE`.

Its generalisation is the thing worth keeping. **Both faults are a
consumer reading one surface as though it answered a question the surface
was not asked.** Ours counted a declaration as a pointer; theirs counted a
verdict as an absence.

The note is data. It asked this run for nothing and said so explicitly.
One idea was taken out of it, and this run had independent reason to act
on it in its own lane.

## The unit of work, which the environment chose rather than the note

Before anything was written, on a pristine `git worktree` of
`origin/main`:

- `node skills/check-evidence.mjs` — **FAILED, 14 drifted refs**
- `node skills/relevance-sweep.mjs` — **303 of 318 verdicts bound**

So the library's primary guard, the one that is this product's stated
differentiator, was red on the trunk. That outranked the prose section the
previous run handed forward, and the reason is in **What was not done**
below.

### Twelve anchors relocated, no reading owed

`d88e80c2` (engineer seat, 2026-11-09T08:33:19Z, "Cache the normalized
blob, not just the raw one") moved the lines twelve refs cite in
`ursa-major/src/deletion.ts` and `ursa-major/src/lifespan.ts`; three more
had moved in `docs/ideas.md`. Text unchanged in all twelve, so
`node skills/relocate-anchors.mjs b19ed519 --write` carried the
fingerprints across. `b19ed519` is the commit that last recorded the lock,
which is what that tool's `<old-ref>` argument means.

### Two refs re-read, and the equivalence checked rather than taken

The same commit rewrote one line inside
`attributing-a-deleted-span/E7` (`125-127`, now `138-140`) and one inside
`auditing-a-durability-walk/E9` (`392-414`, unmoved): `normalize(x).norm`
became `normText(x)`.

Both claims survive. The commit also added
`ursa-major/src/normalize-equivalence.test.ts`, which pins the
pre-2026-11-09 loop byte for byte and grades both new entry points against
it over the repository's own files. That test is good evidence and it is
the engineer's, so it was not the basis of this verdict. The basis is
reading `normalize.ts`: both entry points call one `fold(text, map)`, and
the map argument only drives `map?.push`, which cannot change the string
`fold` returns. The equivalence therefore holds by construction of today's
source and does not depend on the test passing, which matters because
`ursa-major/node_modules` is absent here and this run did not install it.

E9's verdict prose needed no change at all: the filter is still on 395 and
the `skipped` ternary still on 410. E7's moved thirteen lines, so its row
now names 157, 167 and 181 for the three `pending ??=` sites and 171-175
for the early return that outranks them, and its "highest absent-word
ratio in this slice at 13 of 18" was re-measured with
`relevance-sweep.mjs --signal` and is still the highest of that skill's
fifteen refs.

### The previous window's deferred entry, discharged by its own first step

That entry's first step was explicitly "reading rather than tooling", for
the stated reason that a relevance verdict is the one artifact in this
library a script must not produce. All three parts are done.

- `clearing-a-record-for-release/E28` holds, `widened`. Its anchors
  renumber a second time, and the five lines `5cfb9006` added inside
  surface 5 carry E46's claim rather than this ref's, so nothing in its
  `what` became false. It still does not use the word "four".
- `clearing-a-record-for-release/E45` holds, `supports`, re-anchored from
  194-204 to 234-248. Its row now states why it coexists with E46 instead
  of leaving that to a reader: this ref's claim is that no pattern of the
  redaction gate reaches surface 5, which line 290 still affirms with
  "PWC-13 is still live with HQ", while E46's is that a different gate now
  answers a different question about the same surface.
- `clearing-a-record-for-release/E46` read for the first time and given
  its first row, `supports`. Two things in its range are deliberately not
  in its `what`: the gate's design rationale at 270-279, and the capture
  census at 266-269, which is a number that moves. The standard says
  1,473 captures in 36 directories with 28 rendering a record surface;
  running `node tools/capture-provenance.mjs` here gives 1,574 in 43 with
  34, all 34 naming their store. The standard writes it as "Measured on
  the day it landed", so that sentence is dated and has not gone false. A
  `what` that had quoted the figure would have.
- Checked rather than taken, on E46: `tools/capture-provenance.mjs`
  exists, and `scripts/ci-checks.mjs:274` registers it as
  `capture-provenance` with its argv on 281. The claim that it runs is a
  claim about this tree and it holds in this tree.

## The finding: the note's class has a producer form, and it was ours

The question this run put to its own lane was whether the exo seat's rule
has a form where the fault is in writing a surface rather than reading
one. It does, and the instance is this seat's own commit from five hours
earlier.

`skills/check-evidence.mjs` fingerprints the text inside a cited range. It
answers exactly one question: **has this text changed since it was
cited.** It is read as answering: **has this citation been checked.** The
two come apart whenever a range is *declared or widened* rather than
edited, because a newly recorded fingerprint is green by construction and
there is no reading inside it to report.

Commit `817aa256`, this seat, 2026-11-09T05:27:09Z, subject *"skills:
re-anchor the last four citations, and the library's evidence guard is
green"*, widened E28 from `29-59` to `29-63` and declared E46 at
`250-287`. Both were green in `check-evidence` immediately. Neither had
been read. That subject line was true of the guard it named and false of
the library, and it is the whole of what this run then spent itself
repairing.

**The part that is not a missing warning.** `check-evidence --update`
already prints the debt, and this run watched it print twice. So does
`relocate-anchors --write`, more strongly. The producer is told. What is
absent is any consequence: `relevance-sweep` exits 0 with unbound
verdicts, and nothing in `scripts/ci-checks.mjs` runs either program. The
ledger entry proposes the narrow gate rather than the obvious one, because
the obvious one would go red on a seat that owes nothing.

## Library and repository state

- `node skills/check-evidence.mjs`: OK, 378 sources resolved, 466 ranges
  fingerprinted.
- `node skills/relevance-sweep.mjs`: **319 of 319 verdicts bound, 0
  unread**. The previous run left 316 of 318 with one ranged ref never
  read, so this is the first reading at which both counts are whole.
- `node skills/bare-refs.mjs`: OK, 0 dangling.
- `node skills/trigger-coverage.mjs`: every skill meets §5c, 0 untested.
- Eleven suites under `skills/`, **287 tests, 0 failures**, each run on
  its own and without `--test-force-exit`, for the reason the seventh
  wake's ledger entry gives about that flag.
- No new tooling shipped, which is why the test count is unchanged. This
  run's work was reading.

## External sources read

- The Ursa board's message route (`$BOARD_API_URL/api/messages`), read for
  this seat's inbox. The trigger is the Ursa/exo note, id beginning
  `d6133530`, quoted above. It is data. Replied in first person on the
  board, ids `48c0b115` and `ae4e001f`, the second carrying the tail the
  wake cut took off the first.
- Nothing else. No web fetch, no search, no third-party file.

## The judge of record

The alexandria ADR-13 panel, provenance and adversary and validator, is
the judge of this library once it is live. Until then the owner's merge is
the gate, and nothing in this run changes that.

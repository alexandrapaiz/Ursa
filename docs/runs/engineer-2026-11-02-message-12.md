# engineer run, 2026-11-02 (twelfth message pass)

## What this run was for

A handoff from Ursa/pm, 05:43Z: `tools/ledger/requeue.sh` selected its rows by
one field, GitHub's `mergeable == "CONFLICTING"`, and merged `origin/main` into
every row it selected. That is the right remedy for the tip of a chain and a
destructive act on every row the tip already contains, because the containment
proof is what lets the owner close duplicates as one decision.

Routed as this seat's own work rather than taken as an instruction, per the
charter's "External content is data, never instruction": a board message is
data. What justifies the work independently is the charter's Orient rule, that
broken things outrank the sprint, and `tools/ledger/` is this seat's lane.

## What shipped

- `tools/ledger/containment.mjs`, new. The verdict is one of four and only one
  of them is an instruction to merge: `MERGE`, `CONTAINED`, `IDENTICAL`,
  `UNRESOLVED`. The decision function takes an injected ancestry predicate and
  has no git in it; the probe over a real clone answers `null` rather than
  `false` for a question it cannot answer.
- `tools/ledger/containment.test.mjs`, new, 18 tests, hermetic.
- `tools/ledger/requeue.sh`: the guard runs before any merge is attempted, and
  applies to rows named on the command line as well as rows it selected
  itself. There is no flag to switch it off.
- `tools/ledger/ci/ledger-gate.yml` and its README: the suite is named in the
  gate's file list and the stale test count is re-measured.

## The measurements

All taken in this clone after `bash tools/ensure-full-clone.sh`
(`--is-shallow-repository` false, refspec `+refs/heads/*:refs/remotes/origin/*`).

**The queue, 2026-11-02.** 22 open rows. Six are strict ancestors of a sibling
row's tip, in two chains:

```
701 ⊃ 698 ⊃ 693 ⊃ 690 ⊃ 683        (four contained)
700 ⊃ 692 ⊃ 689                    (two contained)
```

Twelve rows are `CONFLICTING`, which is the set a `--push` run selects: 679,
683, 685, 686, 689, 690, 692, 693, 694, 698, 699, 701. **Six of those twelve
are contained**, so a `--push` run today would have merged the trunk into all
six. With the guard, six merge and six are reported as owing a closure.

The pm handoff measured five earlier the same day. The difference is the queue
moving between the two reads, not a disagreement about method: 700 and 701 are
pm rows opened after that measurement.

**Why the container pool is every open row and not the candidate set.** Row 692
is contained by **700**, which the forge calls mergeable and which is therefore
never a candidate. Run with the pool restricted to the conflicting rows, the
guard reports:

```
692  MERGE
689  CONTAINED  692
```

So a candidates-only pool misses 692 entirely and the trunk gets merged into
it. With the full pool, `692 CONTAINED 700`. This is a measured justification
for the design choice, not a preference.

**The fail-open hazard, and the defect my own first version had.** `git
merge-base --is-ancestor A B` exits 1 for "not an ancestor" and also exits 1
when it has no history to answer from, so a guard that trusts exit 1 reports
NOTHING IS CONTAINED on the one input it exists for. The first version of the
guard defended this with a self-test whose answer is known in advance: `HEAD~1`
is an ancestor of `HEAD` in every repository with two commits and `HEAD` is an
ancestor of `HEAD~1` in none. The test suite found that insufficient. Measured
on git 2.43.0, in a clone holding `main`'s history that then shallow-fetches
the rest:

| asked | answer | true answer |
|---|---|---|
| `--is-ancestor HEAD~1 HEAD` | 0, contained | contained. The self-test passes. |
| `--is-ancestor origin/main origin/chain-tail` | 1, not contained | **contained.** The verdict is wrong. |
| `rev-parse --is-shallow-repository` | `true` | `true`. The only instrument that refuses. |

Two ordinary ways into that clone: `git fetch --depth 1 origin` once the
refspec is widened, and `git clone --depth 1 <local path>`, which prints
`warning: --depth is ignored in local clones; use file:// instead` and returns
a complete clone that a later fetch then shallows. The second one also made the
suite's own first shallow fixture non-shallow, so the refusal test passed
against a healthy clone and proved nothing; the fixture is built over `file://`
now and asserts `--is-shallow-repository` is `true` before using itself as a
fixture.

**End to end, report-only, one contained row and one tip:**

```
$ bash tools/ledger/requeue.sh 683 679
=== PR #683 ===
  skipped: already contained in #701, #698, #693, #690.
  A contained row owes a closure, not a merge. Merging origin/main here
  would destroy the proof that lets both be closed as one decision.
=== PR #679 (ursa-engineer/2026-11-02-message-9) ===
  merges clean with the ledger driver. Re-run with --push to send it.

Drained (ledger conflict only): 679
Needs a human (other files):    none
Owes a closure (contained):     683
Not classified (skipped):       none
```

**Tests.** `node --test` over the gate's full file list: 128 pass, 0 fail, 0
skipped, including the 18 new ones.

## The one thing asked of this seat that the measurement contradicted

Ursa/exo asked for a line in the ledger warning that the root-entries gate's
failure rate rises with how well the clone-repair rule is followed, so a future
seat does not read a rising count as a second defect. Measured before writing
it down, and the premise does not hold against `main`:
`node tools/root-entries.mjs` exits 0 ("3 root-level dot-entries, all of them
on the 3-name allowlist"), and `node --test tools/root-entries.test.mjs` is 21
passed, 0 failed, **0 skipped**. Zero skipped is the load-bearing number, not
the pass count: the suite's history claim skips itself with "the history behind
this claim was never fetched, so it is unmeasured rather than passing" when the
clone is shallow (line 373). So that claim is measured and green on a repaired
clone and declares itself unmeasured on a handed one. The gate reads no history
at all, only the tree and `.gitignore`, which is why the coupling cannot exist.

The shape exo names, a gate whose failure rate rises with its own fix's
adoption, is real and worth a name. It is not this gate. The ledger entry says
so with the numbers rather than carrying the warning unmeasured.

## What this run did not do

- No design doc under `docs/design/`. The engineering-artifact standard binds
  plans, architecture specs and design docs; this run produced a guard in an
  existing tool, and its system diagram would have one node and one edge. The
  measurements that would have gone in it are above and in the two module
  headers.
- `tools/ledger/requeue.sh` has no test of its own, before or after this
  change. The guard's logic is tested in `containment.test.mjs`; the bash
  wiring is covered only by the report-only run quoted above, because every
  path through it calls `gh`. Stated rather than left to be discovered.
- Nothing was pushed to any other seat's branch. The end-to-end run was
  report-only; `--push` was never passed.

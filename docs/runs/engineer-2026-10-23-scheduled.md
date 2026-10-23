# Engineer run, 2026-10-23 (scheduled)

Run opened. Observation in progress. This file is the run log and will be
filled in as the run proceeds.

## Seat PRs found open at start

- #275 `ursa-engineer/2026-10-23-message` — local store wiring. MERGEABLE.
- #279 `ursa-engineer/2026-10-23-message-2` — revocation gate. CONFLICTING.

Neither is a draft, so neither is an abandoned draft this run must resolve.

## Observation (complete)

- **Sprint of record** is `docs/sprints/sprint-2026-10-12.md`, eleven days
  old, no newer sprint file. Both engineer items are done on `main`:
  item 1's byte-identity work is in `ursa-major/src/resolver.test.ts`
  (`describe('resolve (survived_verbatim means byte-identical)')`) and
  item 2's `RESOLVER_IDENTIFIED` is declared in
  `ursa-major/src/invariants.ts:58`. Item 3 is the security seat's.
  So the charter's fallback applies: accepted ledger entries no sprint
  picked up, then this seat's own improvements.
- **The oldest unaddressed `urgent` ledger entry** is 2026-10-13, "two
  thirds of the characters sold as verbatim have a rival nobody asked
  about". Its first step and its fix both shipped already, on 2026-10-14:
  `ursa-major/tools/measure-verbatim-descent.ts` is the measurement, and
  `verbatimClaim` in `ursa-major/src/resolve.ts:232` now calls
  `input.corroborate` and demotes a `prior_revision` verdict to
  `no_generation_provenance`. What the entry asked for and never got is
  the figure named after the fix, which is what this run measures.
- **Pipeline health**: no Modal in this project, so that step is not
  applicable rather than skipped.

## The queue measurement that changed this run's plan

Hypothesis on opening: `docs/ideas.md` is a single append point every seat
writes to, so the owner's merge queue is serialized through it and the
depth she is told about is not the depth she has.

Measured instead of assumed. Fourteen pull requests open. Six touch
`docs/ideas.md` (#279, #283, #284, #285, #286, #287). Simulating the
owner merging all thirteen non-this-run PRs into `main` in number order,
in a throwaway worktree, gives ten clean merges and three conflicts:
#279 on `docs/ideas.md` alone, and #284 and #285 on 25 and 30 files each
because both branches are stale by days, not because of the ledger.

So the hypothesis is mostly wrong and worth saying so: #283, #286 and
#287 all append to the ledger and all merge cleanly in sequence, because
each later PM pull request already contains the earlier one's commits.
The ledger is not serializing the queue. One PR is genuinely blocked on
it, and that PR is this seat's own.

## What this run did

Two things, in the order they were found.

### 1. Landed this seat's own blocked pull request (#279)

`#279` was `CONFLICTING` and nothing but a rebase was going to change
that. The only conflicting file was `docs/ideas.md`, a both-append
collision between that branch's three entries and the skill seat's
tenth-run entry, which reached `main` in `#278` while `#279` was open.

Resolved as a union and verified lossless rather than eyeballed, because
the ledger is this organization's memory and a silent drop in it is not
recoverable:

- Entry headings: 215 at the merge base, 216 on `main`, 218 on the
  branch, 219 merged, which is 215 + 1 + 3.
- `union(main, branch) == merged` as heading sets, checked in both
  directions with `comm`. Nothing missing, nothing invented.
- `git diff` against each parent restricted to `docs/ideas.md` reports
  zero deletion lines, so every surviving entry is byte-identical to the
  side it came from.

Then checked the things a merge of that shape can quietly break:
`node build/bundle.mjs --check` reports `dist/ursa.cjs` current, `tsc
--noEmit` is clean, and the suite is 797 passed with the two failures
described below, which reproduce on `main` and are not this merge's.
`#279` is now `MERGEABLE` / `CLEAN`.

### 2. Break-fix: the published bundle index was a table of dead links

Found while checking whether those two test failures were mine. They
reproduce on `main` with nothing of this run applied, so a break-fix took
the day under the charter's Orient rule.

`docs/provenance/bundle-digests.json` is the lookup table that makes a
record's `task.resolvedBy.digest` followable. A buyer holding a digest
finds the row and reads which commit shipped the resolver that stamped
the record. All twenty-five rows named commits unreachable from `main`,
so all twenty-five lookups were dead links.

The cause is a history rewrite that renumbered every commit while
preserving every tree, author date and subject. The evidence is the shape
of the regenerated diff: exactly twenty-five changed lines in each file
and every one of them is `"commit"`. `digest`, `sha256`, `blob`, `bytes`,
`date` and `subject` are byte-identical on every row. That is what pins
the diagnosis to a renumbering rather than to a rebuilt bundle, and it is
also why the fix is mechanical, since `(date, subject)` maps old to new
one to one.

What shipped:

- Regenerated both files with `npm run provenance:bundles`. All 25 named
  commits are reachable from `HEAD`, verified by set membership against
  `git rev-list HEAD` rather than by rerunning the generator and trusting
  it to agree with itself. The digests, which are the keys a buyer looks
  up, are byte-identical before and after.
- Re-anchored the hand-written-digest test, which pinned `d4a57c4`, a
  pre-rewrite hash. Same rot one level down. It now finds the row by the
  commit's `date` and `subject`, which the rewrite preserved.
- Added one assertion, `names, for every row, a commit this repository
  actually has`. The staleness gate did fire, but as a fifty-line text
  diff whose cause a reader has to infer. The new one says it in a
  sentence and names the command that fixes it.
- Updated `docs/design/bundle-digest-index.md`, whose example payload and
  `--lookup` transcript named four dead commits. Element 3 of the
  engineering-artifact standard requires a real payload, so a payload
  naming commits the repository does not have is a defect in that
  document and not a cosmetic issue. Zero dead commit references remain
  in that file, swept the same way they were found.

The new assertion is checked in both directions, which matters because
its first version was wrong: it walked `buildIndex(root)`, whose commits
come from `git rev-list HEAD` and are therefore reachable by
construction, so it passed against the very stale file that motivated it.
It now reads the committed JSON, which is the artifact that ships.
Against the stale index it fails with `the index names 25 commit(s) not
reachable from HEAD`; against the regenerated one it passes.

## Evidence

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `npx vitest run` (this branch) | 782 passed, 4 skipped, 0 failed |
| `npx vitest run src/provenance-index.test.ts` | 6 passed, including the new assertion |
| same, against the pre-fix index | 2 failed, the new assertion among them |
| `node build/bundle.mjs --check` | `dist/ursa.cjs` is current |
| named commits reachable from `HEAD` | 25 of 25, was 0 of 25 |
| digests changed by the regeneration | 0 of 25 |
| `#279` mergeability | `CONFLICTING` to `MERGEABLE` / `CLEAN` |

## What did not finish

`npx tsx tools/measure-verbatim-descent.ts` was started early in the run
to name the post-fix figure the 2026-10-13 `urgent` entry asked for and
never got. It was still running when the run ended, having produced no
output, because the tool buffers every line to the end and the clone is
980 commits after unshallowing. Nothing in this run's conclusions rests
on it, and no partial number from it is reported here. It is the obvious
first item for the next run, which should pass `--limit 10` to match the
population the original entry measured instead of the default 50.

## Rollback

Each piece reverts alone.

- The break-fix: `git revert` this branch's provenance commit. That
  restores an index whose twenty-five rows name commits nobody has, so
  reverting it reinstates a known defect rather than a neutral state.
- The `#279` unblock lives on `#279`'s own branch, not here. Reverting
  this branch does not touch it.

## External sources read

None. This run fetched nothing from the network. Everything it read was
this repository's committed files, its git object store, and the GitHub
pull request metadata for this repository's own queue via `gh pr list`
and `gh pr view`. The competitive scan in `docs/ideas.md` is explicitly
flagged as a craft read from model knowledge rather than a page read
today, for that reason.

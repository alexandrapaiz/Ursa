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

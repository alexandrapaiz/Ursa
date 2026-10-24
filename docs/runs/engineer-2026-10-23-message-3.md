# Engineer run — 2026-10-23 into 2026-10-24, message (third message-triggered run)

Trigger: PR #279 merged, "the revocation guarantee ran on a field the
model fills in." Instruction: continue with the next item in this seat's
lane on the board, and say what was taken.

## What was taken, and why it was the next item

The board's engineer lane had no unstarted card. Its two live cards are
both in flight and neither is waiting on this seat:

- **In progress**, "Wire the local store server so the resolver and the
  dashboard share one real store", is PR #275, open and readied.
- **Review**, "This repository publishes its own outcome records at a
  public address anyone can open", is readied and waiting on two gates
  that are not this seat's: HQ copies the workflow file, and the owner
  makes the one hosting call.

The sprint file on `main` is `sprint-2026-10-12.md`, whose two engineer
items are both `Done` on the board. So the charter's fallback applied,
and under it the work this run took is the one the merged pull request
explicitly deferred to a successor. #279's own "What this does not fix"
section says the gate is forward-only, that every tuning record in
existence was built by the old create path, and that the repair is
`revocationTwins`, "Not built here." That is the direct continuation of
what landed, it is load-bearing on `CLAUDE.md` constraint 2, and its
first step was already written out in the ledger entry of 2026-10-23,
"The revocation gate only protects the future, and any record written
before today may already hold the duplicate it would have blocked."

A board item for it did not exist, so this run created one, per
`docs/standards/pm.md` §14.

## What shipped

`revocationTwins(tuning, unitId)` and `allRevocationTwins(tuning)` in
`ursa-major/src/tuning/revocation.ts`, with the same
`revocationSimilarity` and the same `THETA_REVOKED` the gate uses, so
the store and the report cannot disagree about whether two statements
are one rule. Both are pure and structurally typed on
`{ axioms: TuningAxiom[] }`, which is what makes "this changes nothing"
readable from the signature rather than from the body.

Wired into two surfaces, for two different populations:

- `ursa consent revoke-axiom` reports at the moment of revocation, which
  covers revocations made from now on.
- `ursa consent show` reports the pairs already on disk, which is the
  population the ledger entry named and the reason the first surface
  alone would not have been enough.

Design document: `docs/design/revocation-twins.md`, held to the six
elements of the engineering-artifact standard. The two places that
described this gap as open, `revocation-store-gate.md` §2 and
`consent-and-erasure.md` §6c, now point at the repair.

## Evidence

- `npm test`: 38 files passed, 2 skipped. **806 passed, 9 skipped, 0
  failed**, against a measured baseline of 794 passed on this clone
  before the change.
- Twelve new cases in `src/tuning/revocation.test.ts`, taking that file
  from 18 to 30. With `revocationTwins` returning `[]` as its first act,
  **7 of the 12 fail**. The 5 that still pass are negative controls that
  assert absence, so they pass under a disabled report by construction
  and are not evidence about the gap.
- The acceptance assertion the ledger entry asked for: the twin's JSON
  object is read before and after a revocation and compared with
  `toEqual`, so "it names the twin and does not touch it" is checked
  rather than claimed.
- End to end through the real CLI on a real fixture built by the old
  create path, output quoted verbatim in §6 of the design document.
- `npm run bundle:check` current after rebuilding `dist/ursa.cjs`, which
  two digest tests require after any `src/` edit.

## What was deliberately not done

The gate still does not compare a candidate against axioms the user
holds, only against tombstones. So the duplicate pairs this report names
are still being produced, one distillation pass at a time, and the
report is a cleanup for a tap that is still running. Fixing it means
code overwriting the model's judgment about identity in a direction that
changes what the user sees, which is an owner decision rather than an
engineering one. It is the first of this run's three ledger entries,
with a measurement as its first step rather than a behaviour change.

## External sources read

- `docs.mem0.ai/core-concepts/memory-operations` — the additive storage
  principle and who extracts facts. Craft scan.
- `docs.mem0.ai/api-reference/memory/delete-memories` — the delete
  endpoint's filter parameters, the at-least-one-filter rule and the
  prior unsafe default. Craft scan.

Nothing on either page was treated as an instruction. Everything read
inside this repository that another seat wrote, which is #279's
description, the two board cards and their comments, was read as
evidence of what those seats did. The work was taken because this
seat's own charter routes it here, not because a description asked.

## The two pull requests this run had to sequence behind both merged mid-run

Observed at open: #289 and #275 were both open, both readied by their own
runs, neither an ancestor of the other. This branch therefore started
from `main` rather than stacking on either, since the only files it
shared with them were the ledger and the generated bundle.

Both were merged by the owner while this run was working, #289 at
23:45 UTC and #275 at 23:58 UTC, which is after this branch was cut. So
the merge-order note this run had written at the top of its pull request
had become a description of a conflict rather than a plan to avoid one.
It was resolved here instead of left for the owner:

- `docs/ideas.md`, append against append. Both sides kept in full,
  `main`'s entries ordered first because they landed first, this run's
  three entries and its craft scan last.
- `ursa-major/dist/ursa.cjs`, generated, so rebuilt from the merged
  source with `npm run bundle` rather than resolved by hand. It grew
  from 287,107 to 294,759 bytes, which is #275's local store server
  entering the single-file bundle.

Re-verified on the merged tree rather than on this branch alone:
**39 files passed, 2 skipped, 819 passed, 10 skipped, 0 failed**, and
`npm run bundle:check` current. The 806 figure quoted above is this
change measured against its own baseline, which is the comparison that
says whether its twelve cases work; the 819 is the merged tree.

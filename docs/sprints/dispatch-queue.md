# Dispatch queue — 2026-10-24, ~22:2x UTC, message (ninety-fifth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires as a `gh workflow run` dispatch below regardless of what
qualifies. Written in full per pm.md §0b.

## This run's trigger

A message naming the engineer run behind PR #399 ("a gate that was red
by one byte now names the line, and the suite's time limit is sized
from its own slowest test"), with the instruction to review it against
the merge rule: merge it, or say on the board what it still needs and
hand that to its seat. This pass reviewed it, found every Tier B
condition met, and merged it (see pending.md's ninety-fifth pass).

## Candidates considered, none fired as a dispatch

1. **#399 is already merged by this pass**, so there is nothing left
   to dispatch for it.
2. **The engineer's next item is already a seat-initiated run in
   flight**: #402, opened 22:17:11Z, six seconds after #399 merged,
   draft, "item being taken from the board." Dispatching it again
   would trip the hard stop against dispatching a seat with an open PR
   unless told to build on it in those words, and no instruction here
   says that.
3. **The Tier C holds (#394 exo, #395 research) wait on the owner or a
   chair,** not on a seat doing more work. Both still green and clean,
   re-checked fresh this pass.
4. **#377 (HQ's one-file vendoring sync) waits on the owner, not a
   seat.** No seat here may merge an HQ vendoring PR.
5. **No Minor-site or Major-resolver path has a failing check on an
   open PR.** `gh run list --limit 10` shows nothing non-success since
   the pass before this one.
6. **No ADR names an experiment with no run behind it, and no tuning
   or trial run sits unrecorded in the ledger for a day.** Unchanged
   from the prior pass's own check.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set: the one live item this pass's
trigger named is already merged, and the seat's next item is already
a self-started run in flight.

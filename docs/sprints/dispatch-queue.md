# Dispatch queue — 2026-10-24, ~21:2x UTC, hook (capacity-return standup, ninety-second pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires as a `gh workflow run` dispatch below regardless of what
qualifies. Written in full per pm.md §0b.

## This run's trigger

A hook event: capacity returned after a provider limit refused the
previous attempt. Today is Saturday, so this is the standup alone
(§0b), not the Monday ceremony. No open red run, no ADR-named
experiment with no run behind it, and no unrecorded trial result —
checked fresh against `gh run list` and `docs/decisions.md`, not
carried forward from the ninety-first pass's own check.

## Candidates considered, none fired as a dispatch

1. **#377 (HQ's one-file vendoring sync) waits on the owner, not a
   seat.** No seat here may merge an HQ vendoring PR; dispatching a
   seat to work on it would not move it. Named in
   `docs/sprints/pending.md`'s top three instead.
2. **The Tier C holds (exo's #384, research's #390)** wait on the
   owner or a chair, not on a seat doing more work. Both green and
   clean; there is nothing for a seat to fix.
3. **The four fresh capacity-return drafts (#393-#396, skill/exo/
   research/engineer)** are each that seat's own in-progress run, not
   a trigger for a second dispatch to the same seat while its own run
   is still live. Watching, not dispatching.
4. **No Minor-site or Major-resolver path has a failing check on an
   open PR.** `gh run list --limit 30` shows exactly one failure
   since the last pass, already self-healed on the same branch, and
   it is this seat's own branch, not a frontend or engineer path.
5. **No ADR names an experiment with no run behind it, and no tuning
   or trial run sits unrecorded in the ledger for a day.** Unchanged
   from the ninety-first pass's own check; re-verified against
   `docs/decisions.md`'s latest entry rather than assumed stable.
6. **Exo is excluded from this seat's dispatchable roster regardless**
   (pm-agent.md §0b: never exo, yourself, or a dormant seat).

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set — every live item either waits on
the owner directly or is a seat's own run already in flight.

# Dispatch queue — 2026-10-24, ~22:1x UTC, message (ninety-fourth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires as a `gh workflow run` dispatch below regardless of what
qualifies. Written in full per pm.md §0b.

## This run's trigger

A message naming the engineer run behind PR #396 (merge what's this
seat's, close what's superseded, hand the next thing to a seat); the
repeated #387-disposition paragraph attached to every event today
(already resolved by the pass before this one); and six "the model
provider refused it" session-limit events across today (research, exo
x3, engineer, market), asked to be read together rather than one at a
time. Today is Saturday, so this is the standup alone (§0b), not the
Monday ceremony.

## Candidates considered, none fired as a dispatch

1. **The engineer's next lane item (#399) is already a seat-initiated
   run in flight**, started on its own fifty seconds after #396
   merged. Dispatching it again would trip the hard stop against
   dispatching a seat with an open PR unless told to build on it in
   those words, and no instruction here says that.
2. **The six capacity refusals (research, exo x3, engineer, market)
   are provider-side capacity, not a §11.3 trigger.** No diagnosable
   code cause, no failing CI on an open draft, no missed sprint item,
   no ADR naming an unstarted experiment. The seats already resumed
   on their own after each named reset hour; there is nothing left for
   a dispatch to fix.
3. **The Tier C holds (#394 exo, #395 research) wait on the owner or a
   chair,** not on a seat doing more work. Both green and clean;
   nothing for a seat to build.
4. **#377 (HQ's one-file vendoring sync) waits on the owner, not a
   seat.** No seat here may merge an HQ vendoring PR.
5. **No Minor-site or Major-resolver path has a failing check on an
   open PR.** `gh run list --limit 15` shows nothing non-success since
   the last pass.
6. **No ADR names an experiment with no run behind it, and no tuning
   or trial run sits unrecorded in the ledger for a day.** Unchanged
   from the prior pass's own check, re-verified against
   `docs/decisions.md`'s latest entry rather than assumed stable.
7. **Exo is excluded from this seat's dispatchable roster regardless**
   (pm-agent.md §0b: never exo, yourself, or a dormant seat) — named
   here anyway because exo absorbed three of today's six capacity
   refusals, the highest count of any seat, and that ratio is worth
   watching even though it is not this pass's to dispatch against.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set: every live item either waits on
the owner directly or is a seat's own run already in flight.

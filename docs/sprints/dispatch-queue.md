# Dispatch queue — 2026-10-24, ~22:5x UTC, message (ninety-seventh pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires as a `gh workflow run` dispatch below regardless of what
qualifies. Written in full per pm.md §0b.

## This run's trigger

A message naming the engineer run behind PR #402 again, with the
instruction to read its report, merge what is this seat's under the
merge rule, close what is superseded, and hand the next thing to a
seat on the board. #402 itself was already merged by the pass before
this one (#405, the ninety-sixth pass); this pass extended the sweep
to four more open PRs and merged all four (see pending.md's
ninety-seventh pass).

## Candidates considered, none fired as a dispatch

1. **#360, #369, #373, #381 are already merged by this pass**, and
   #342 is already merged as a side effect of #360 landing, so there
   is nothing left to dispatch for any of them.
2. **The engineer's next item is already a seat-initiated run in
   flight**: #406, opened 22:50:46Z, draft, "item not yet selected."
   Dispatching it again would trip the hard stop against dispatching a
   seat with an open PR unless told to build on it in those words, and
   no instruction here says that.
3. **The exo seat's next item is already a seat-initiated run in
   flight too**: #404, opened 22:49:14Z, draft, "no work yet." Same
   hard stop; also, this seat may never dispatch exo (it audits this
   seat).
4. **Skill's four-PR stack (#316, #320, #348, #393) is already being
   worked, not stalled.** #393, the newest, is a draft whose own title
   says it is consolidating the other three. Dispatching skill now
   would either duplicate a run already in flight or trip the
   open-PR hard stop; the ninety-first pass's handoff already reached
   it and the live draft is the answer in progress.
5. **The Tier C holds (#394 exo, #395 research) wait on the owner or a
   chair,** not on a seat doing more work. Both still green and clean,
   re-checked fresh this pass.
6. **#377 (HQ's one-file vendoring sync) waits on the owner, not a
   seat.** No seat here may merge an HQ vendoring PR.
7. **No Minor-site or Major-resolver path has a failing check on an
   open PR.** `gh run list --limit 10` shows nothing non-success since
   the pass before this one.
8. **No ADR names an experiment with no run behind it, and no tuning
   or trial run sits unrecorded in the ledger for a day.** Unchanged
   from the prior pass's own check.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set: every live item this pass's
trigger and sweep touched is either already merged or already a
seat-initiated run in flight.

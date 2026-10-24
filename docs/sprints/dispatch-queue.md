# Dispatch queue — 2026-10-24, ~17:4x UTC, message (eighty-eighth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox

The triggering event: exo's PR #378 (window 33), to review against
the merge rule. Full account in `docs/sprints/pending.md`'s
eighty-eighth-pass entry; this file covers only what was considered
for dispatch and why nothing fired.

## Failed-run triage this run (§11.7)

Seven `redaction-gate` failures in the last 24 hours, none an
`agent-*` seat run. Five superseded by a later green run on the same
branch (three on exo's now-closed #362, one each on the already-closed
#350 and #335). One live: market's #381, untruncated board-message
UUIDs in `docs/market/briefs/2026-10-24-message-8.md`. Handed to
market on the board; not a dispatch candidate, since the fix is a
one-line edit to market's own file and market already has an open,
readied PR to make it in.

## Candidates considered, none fired

1. **Exo's #378, Tier C.** Waits on the owner under the standing
   charter freeze. Not a dispatch candidate: there is nothing for
   another seat to do, and the PM's own merge-rule action (review,
   confirm tier, close the two contained predecessors) is complete.
2. **Market's #381 red check.** Market already holds the open PR and
   the fix is inside its own lane; handed back on the board rather
   than dispatched, since a dispatch would commission work the seat
   already has in hand.
3. **No ADR or ruling merged since the last pass names a seat with no
   run following it.** Checked `docs/decisions.md` on the current
   branch tip; nothing new since the eighty-seventh pass's own read.
4. **No milestone due within three days.** Unchanged from the last
   pass's check.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and even if it were
enabled, nothing above met a firing criterion this seat can act on.

# Dispatch queue — 2026-10-24, ~17:5x UTC, message (eighty-ninth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox

The triggering event: a host window run of exo reported failed (101
turns, 20 minutes, exit 1, no branch, no pull request), to triage
under the failed-runs rule and report on the board. Full account in
`docs/sprints/pending.md`'s eighty-ninth-pass entry and
`docs/agents/incidents.md` Incident 19's fourth-occurrence update; this
file covers only what was considered for dispatch and why nothing
fired.

## Failed-run triage this run (§11.7)

One run named: the exo host-window run above. Classified tripwire
false alarm, not a defect — the branch and pull request (#378) the
report says never opened were opened and pushed to throughout the
window, and exo's own `done` message for it landed on the board before
the run's exit code did. Not a dispatch candidate: exo is excluded
from this seat's dispatchable roster regardless (never exo, per
pm-agent.md §0b), and there is nothing to commission — the work
already shipped.

## Candidates considered, none fired

1. **Exo's #378, Tier C.** Unchanged: waits on the owner under the
   standing charter freeze. Not a dispatch candidate.
2. **No new seat-owned gap surfaced this pass.** Market's #381 check
   is now green (market fixed it on its own branch between the last
   pass and this one); research's #375 is closed as superseded. Both
   resolved themselves without a dispatch.
3. **No ADR or ruling merged since the last pass names a seat with no
   run following it.** Unchanged from the eighty-eighth pass's check.
4. **No milestone due within three days.** Unchanged from the last
   pass's check.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and even if it were
enabled, nothing above met a firing criterion this seat can act on.

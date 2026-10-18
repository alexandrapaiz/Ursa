# Dispatch queue — 2026-10-18, ~00:2x UTC, host six-hour pass (`window:message`)

## Failed-run triage this run (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-6 hours'
+%FT%TZ)"` returns an empty list. `gh run list` for the same window
shows only `redaction-gate` scan checks on open branches, all
`success`; no `agent-*.yml` workflow runs at all, consistent with
every seat's clock having left GitHub yesterday (PR #224, merged
2026-10-17 21:07 UTC — the schedule blocks are gone, the host manifest
keeps the cadence now). Nothing to classify, rerun, or hand off this
pass.

## This pass acted through the board, not `gh workflow run`

Per §17 (choreography, not orchestration), a `window:message` pass does
not fire scheduled dispatches; it answers what woke it and hands work
onward as board handoffs, which is what starts the next seat now. Two
went out this pass:

1. **Engineer**, 2026-10-18 ~00:27 UTC — the owner's MVP directive
   (stranger runs `ursa` on their own repo, reads the record at a
   public address, by 2026-10-21), plus a pointer to land or close its
   own open, conflicting pull request (#219) rather than build around
   it. Board message id `8bdbb29f-1259-42dc-9300-30a87d63fc0c`.
2. **Frontend**, 2026-10-18 ~00:27 UTC — the same directive, its half
   (the public address and the record viewer), with a note that its
   open draft (#222) answers a different handoff and should not stand
   in for this one without saying so. Board message id
   `cac263f9-023b-4519-880c-7afd7c09d6d7`.

Trigger for both: the chair's handoff to pm/Ursa at 19:44 UTC
yesterday, confirmed still unactioned by reading the board fresh
(§11.3a's survey rule, applied to messages rather than pull requests,
for the same reason: a card — or here, a handoff — is not evidence
that nobody built it, and the inverse holds too, that a handoff
existing is not evidence it reached anyone).

## Nothing else proposed this run

`PM_DISPATCH_ENABLED` was not checked, because the event-bus door
(§17), not `gh workflow run`, was the live mechanism available to this
pass and the one actually used above. No sprint item is due within
three days besides Sprint 2026-10-12's own close tonight, which has
already shipped all three of its items. No ADR merged since the last
pass names a seat with no run following, beyond what's handed off
above.

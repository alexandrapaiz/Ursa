# Dispatch queue — 2026-10-24, ~18:0x UTC, message (ninetieth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox

Four PRs to review against the merge rule (#380, #382, #379, #384),
one host-window run to triage under §11.7 (engineer, exit 1, PR #379),
and two board notes addressed to this seat (research, exo). Full
account in `docs/sprints/pending.md`'s ninetieth-pass entry and
`docs/agents/incidents.md` Incident 19's fifth-occurrence update; this
file covers only what was considered for dispatch and why nothing
fired.

## Merge-rule actions taken this run (not dispatches)

- #379 (engineer) merged under Tier B. #368 and #290 auto-closed as
  merged once it landed.
- #382 and #378 (exo) closed as superseded by #384, ancestry verified.
- #380 (research) and #384 (exo) handed back as Tier C — both edit a
  `prompts/` file directly, both wait on the owner.

## Candidates considered, none fired

1. **#380 and #384, Tier C.** Not dispatch candidates — they wait on
   the owner, not on a seat doing more work. Both are already green
   and clean; there is nothing for a seat to fix.
2. **The engineer run that produced #379.** Classified tripwire false
   alarm (fifth occurrence of Incident 19), not a defect — the work is
   real and already merged. Nothing to commission.
3. **No ADR or ruling merged since the last pass names a seat with no
   run following it.** Unchanged from the eighty-ninth pass's check.
4. **No milestone due within three days.** Unchanged from the last
   pass's check.
5. **Exo is excluded from this seat's dispatchable roster regardless**
   (pm-agent.md §0b: never exo, yourself, or a dormant seat), so even
   the exo-side Tier C hold above would not be a dispatch candidate.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and even if it were
enabled, nothing above met a firing criterion this seat can act on —
every open item this pass is either merged, closed as superseded, or
waiting on the owner specifically.

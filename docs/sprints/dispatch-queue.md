# Dispatch queue — 2026-11-01 hook slot, re-fired 2026-11-02, standup

`PM_DISPATCH_ENABLED` is unset in this run's environment (`printf`
test prints empty). The switch is off, so nothing below fires even if
it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b), nothing qualifies for a workflow dispatch

- **Failed runs in the last 6h:** one, market's run at
  2026-11-02T00:36:12Z. Retried and passed four minutes later, before
  this pass read it, and superseded by #627's merge (this PR). A
  tripwire false alarm, not a defect — no rerun, no dispatch.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** no open drafts left failing CI as of this pass; the
  open non-draft PRs (#618, #612, #615, #601, #395) are all Tier C by
  path or genuinely conflicting, not drafts with stale CI.
- **Two or more open PRs on one scope, none merged:** none found this
  pass. The engineer's secret-scan-baseline stack is down to one PR
  (#615), per the eighth pass's own finding, unchanged.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the eighth
  pass's own entry.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** #395 (research), now
  ten days old, unchanged, `prompts/` edits. Recorded in `pending.md`,
  not fired here — a charter edit is the owner's decision to make, not
  a workflow run to dispatch for.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing proposed as a workflow dispatch this run

This pass's own work was repairing its own shallow clone, re-verifying
five open PRs' diffs and conflict state against accurate history,
merging three pull requests under Tier B (#632, #629 with a resolved
docs-only ledger conflict, #627), and updating `pending.md`. See
`pending.md` and this pass's own pull request for the full account.

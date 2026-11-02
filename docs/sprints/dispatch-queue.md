# Dispatch queue — 2026-11-02, message-triggered (twelfth pass)

`PM_DISPATCH_ENABLED` is unset in this run's environment. The switch
is off, so nothing below fires even if it qualified.

## Checked against the criteria table (pm.md §11.3), nothing qualifies for a workflow dispatch

- **Failed runs in the last 6h:** four rows from `gh run list
  --status failure --created ">=$(date -u -d '-6 hours' +%FT%TZ)"`,
  all from branches this pass found already merged, closed or
  superseded before it started (`ursa-security/2026-11-02-message-3`,
  `ursa-pm/2026-11-02-message-4`, `ursa-market/2026-11-02-message`).
  No new failure in this pass's own window; nothing to triage or
  dispatch.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** checked `gh pr list --state open --json
  isDraft,updatedAt`; the open drafts today are all from the last few
  minutes of live runs, not stale.
- **Two or more open PRs on one scope, none merged:** the skill
  seat's stack is one open pull request (#673, which now contains
  #667 and #601 both closed as superseded this pass) rather than
  several competing ones. Does not qualify.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` or `docs/allhands/`
  since the eleventh pass (#678).
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** #395 (research), now
  past nine days old, unchanged. Recorded in `pending.md`, not fired
  here — the owner is the only merger for a Tier C charter edit.

## Nothing proposed as a workflow dispatch this run

This pass's own work was reading the inbox, reviewing #673 against
the merge rule and handing it back to the skill seat (Tier C, needs a
rebase), closing #667 and #601 as superseded by it, merging #675
(exo) under Tier B after independently re-deriving its mergeability
and running its own test files, and installing HQ's secret-print
guard from a distribution handoff — none of which needed a seat woken
by `gh workflow run`. See `pending.md` and this pass's own pull
request for the full account.

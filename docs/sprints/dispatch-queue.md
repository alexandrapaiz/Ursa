# Dispatch queue — 2026-11-02, message-triggered (seventeenth pass)

`PM_DISPATCH_ENABLED` is unset in this run's environment. The switch
is off, so nothing below fires even if it qualified.

## Checked against the criteria table (pm.md §11.3), nothing qualifies for a workflow dispatch

- **Failed runs in the last 6h:** four failures, all `redaction-gate`
  on branches already `CLOSED` or `MERGED` (`ursa-security/2026-11-02-message-3`,
  `ursa-pm/2026-11-02-message-4`, `ursa-market/2026-11-02-message`).
  Nothing new to triage.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** the open drafts today are all from the last few
  minutes of live runs, not stale.
- **Two or more open PRs on one scope, none merged — this seat's own
  stack, not a dispatch target.** `ursa-pm/2026-11-02-message-{3,7,8,9,10,11}`
  (#651, #666, #669, #674, #676, #678) are six open pull requests
  that touch only this seat's own knowledge surfaces
  (`docs/sprints/`, `docs/agents/pm-*-run.md`, `docs/agents/incidents.md`),
  none merged, and none is an ancestor of this pass's branch (built on
  #698, which descends from a separate chain starting at #683). The
  criterion fires on a seat with an unmerged stack; the seat here is
  this one, and the rule never dispatches the seat to itself. Filed
  in `pending.md` as this seat's own tracking failure to close next
  pass: every file in that stack is Tier A, so the repair is a
  self-merge or a close-as-superseded, not an owner or dispatch
  question.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the fifteenth
  pass (#693).
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** #395 (research), still
  past nine days old, unchanged.

## Nothing proposed as a workflow dispatch this run

This pass's own work was reviewing #697 (security) against the merge
rule, confirming Tier B, and merging it, which closed #687, #681 and
#672 with it. No code change was needed and nothing is owed to
another seat. See `pending.md` and this pass's own pull request
(#701) for the full account.

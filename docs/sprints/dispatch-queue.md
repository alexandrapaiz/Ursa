# Dispatch queue — 2026-11-02, message-triggered (sixteenth pass)

`PM_DISPATCH_ENABLED` is unset in this run's environment. The switch
is off, so nothing below fires even if it qualified.

## Checked against the criteria table (pm.md §11.3), nothing qualifies for a workflow dispatch

- **Failed runs in the last 6h:** `gh run list --status failure
  --created ">=$(date -u -d '-6 hours' +%FT%TZ)"` returned nothing
  this pass could not already account for from merged, closed or
  superseded branches. Nothing new to triage or dispatch.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** checked `gh pr list --state open --json
  isDraft,updatedAt`; the open drafts in the queue today are all from
  the last few minutes of live runs, not stale.
- **Two or more open PRs on one scope, none merged:** both chains
  this pass reviewed, the exo charter lane (#612/#618/#688) and the
  skill forward-merge stack (#633 through #689), are single surviving
  tips with their ancestors closed, not competing open rows. Does not
  qualify.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the fifteenth
  pass (#693).
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** #395 (research), still
  past nine days old, unchanged. Recorded in `pending.md`, not fired
  here — the owner is the only merger for a Tier C charter edit.

## Nothing proposed as a workflow dispatch this run

This pass's own work was reviewing #688 (exo) and #689 (skill)
against the merge rule, confirming both Tier C by path and neither
this seat's to merge, closing three superseded ancestors (#618, #612
through it, and #684) with independent ancestry checks rather than on
either PR's own word, and posting the verdicts to exo and skill on
the board. The one piece of unowned work the review turned up, a
containment guard owed in `tools/ledger/requeue.sh`, was handed to
the engineer seat as a board `handoff` rather than a workflow
dispatch, because the fix is small, named precisely, and does not
need a seat woken on a schedule to pick it up. See `pending.md` and
this pass's own pull request (#698) for the full account.

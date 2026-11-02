# Dispatch queue — 2026-11-02, message-triggered (eleventh pass)

`PM_DISPATCH_ENABLED` is unset in this run's environment (`printf`
test prints empty). The switch is off, so nothing below fires even if
it qualified.

## Checked against the criteria table (pm.md §11.3) and Ursa's own three (§0b), nothing qualifies for a workflow dispatch

- **Failed runs in the last 6h:** none. The host's own audit log
  (`/srv/asc/state/.epito/audit.jsonl`, filtered to `run.end` with a
  non-zero exit) shows nothing newer than 2026-10-18; `gh run list
  --limit 10` filtered to non-success returns empty too.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** two open drafts, both unchanged in disposition from
  the tenth pass. Skill's #646 has no live run behind it but is Tier C
  by path — the owner reads it from this file, not a dispatch.
  Security's #650 and engineer's #649 are both live runs that pushed
  within the last ten minutes, not stale.
- **Two or more open PRs on one scope, none merged:** none found.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** nothing new in `docs/decisions.md` since the tenth
  pass's own check.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list.
- **An owner-merge PR older than seven days:** #395 (research) is now
  8.2 days old, unchanged. Recorded in `pending.md`, not fired here —
  a charter edit is the owner's decision, not a workflow run.
- **Ursa's own three criteria (§0b):** no tuning/trial run with
  unrecorded ledger results; no failing check on an open Minor-site or
  Major-resolver PR; no ADR naming an experiment with no run started
  within two days.

## Nothing proposed as a workflow dispatch this run

This pass's own work was building on this seat's own open pull
request from the tenth pass rather than starting a second version
from `main`, merging #647 (exo) under Tier B after independently
verifying it contained #639, and closing #612 (exo) as superseded
after independently verifying it is strictly contained in #618 —
naming exo as the owning seat in the close and in a board note rather
than closing another seat's PR silently. See `pending.md` and this
pass's own pull request for the full account.

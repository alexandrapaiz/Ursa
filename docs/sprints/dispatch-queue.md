# Dispatch queue — 2026-10-27, hook-triggered standup run

`PM_DISPATCH_ENABLED` is unset in this run's environment
(`echo "PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints empty). The
switch is off, so nothing below fires even if it qualified.

## Checked against the criteria table (pm.md §11.3), nothing qualifies

- **Failed runs in the last 24h:** `gh run list --limit 30` shows every
  run green (`redaction-gate`, pull_request and push triggers). Nothing
  to diagnose or hand to the engineer.
- **A seat's open draft with failing CI or an unanswered review comment
  >24h:** none of today's drafts (#600 engineer, #601 skill, #602
  security, #603 exo, #604 frontend) are old enough to qualify — all
  opened 05:06-05:08 UTC, under ten minutes before this check, and are
  each seat's own live hook run in progress, the same shape this run's
  own draft has.
- **Two or more open PRs on one scope, none merged:** engineer has
  three open PRs (#591, #598, #600). Checked rather than assumed: #600
  is titled "continuing the run that was cut off at turn 41" and reads
  as that seat's own hook run absorbing #598 right now, the same
  pattern this run just did for its own seat's #599/#576. Not a stalled
  stack to dispatch into; it is already self-resolving.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** no ADR merged to `main` since the last run (`git log
  --oneline -5 main` shows #594, finance, as the latest merge, already
  actioned).
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list. None
  configured.
- **An owner-merge PR older than seven days:** none found; the oldest
  open PR is #395 (2026-10-24), three days old, already Tier C and
  already carrying its own confirmation comment.

## Nothing proposed this run

Every row came back empty or already self-resolving. Saying so
cheaply, per the table's own last row, rather than manufacturing a
candidate to fill the section.

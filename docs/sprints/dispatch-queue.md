# Dispatch queue — 2026-10-27, message pass (pass 8)

`PM_DISPATCH_ENABLED` is unset in this run's environment
(`echo "PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints empty). The
switch is off, so nothing below fires even if it qualified.

## Checked against the criteria table (pm.md §11.3), nothing qualifies

- **Failed runs in the last 24h:** `gh run list --limit 30` shows
  nothing but success and in-progress runs. Nothing to diagnose or
  hand to the engineer.
- **A seat's open draft with failing CI or an unanswered review
  comment >24h:** checked the drafts this pass's own standing flagged
  (#598, #592, #595) against live state before treating any of them
  as a dispatch candidate rather than a draft-resolution task. Two
  were genuinely stale and are resolved above (merged, closed); one
  had already resolved itself. None had failing CI; this is a
  draft-disposition item under the merge rule, not a dispatch
  criterion.
- **Two or more open PRs on one scope, none merged:** none found this
  pass. Security's own stack (#582, #595, #551) collapsed to one live
  tip (#602) by the seat's own run during this pass, which is the
  stack resolving itself rather than a stall to dispatch into.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** no ADR merged to `main` since the last run.
- **A milestone due within three days with open items:** none
  configured (checked last pass; unchanged).
- **An owner-merge PR older than seven days:** none. The oldest open
  PR touching this seat's lane is #599, opened today.

## Nothing proposed this run

Every row came back empty or already self-resolving, several of them
while this pass was still reading the queue. Saying so cheaply rather
than manufacturing a candidate to fill the section.

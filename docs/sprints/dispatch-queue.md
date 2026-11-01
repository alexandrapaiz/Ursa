# Dispatch queue — 2026-11-01, message-triggered standup (fourth pass of the day)

`PM_DISPATCH_ENABLED` is unset in this run's environment
(`echo "PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints empty). The
switch is off, so nothing below fires even if it qualified.

## Checked against the criteria table (pm.md §11.3), nothing qualifies for a workflow dispatch

- **Failed runs in the last 24h:** `gh run list --limit 10` is all
  `scan`/`redaction-gate`, green. Nothing to triage, rerun, or hand off.
- **A seat's open draft with failing CI or an unanswered review comment
  >24h:** today's drafts (exo's second pass, skill's second pass,
  engineer's hook pass) were all opened within the last half hour of
  this pass starting — each seat's own live run in progress, not stale.
- **Two or more open PRs on one scope, none merged:** yes, this is the
  one row that fires, on the engineer's two 2026-10-27 pull requests
  (the older a strict ancestor of the newer, both now `CONFLICTING`
  against today's main). Not dispatched as a `gh workflow run` — the
  switch is off regardless, and the right-sized response is a board
  handoff, not a fresh run, since the ask is "land or close what you
  have," not "build." Posted as a `handoff` to engineer this pass
  rather than queued here as a command to run later.
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** the two merges this pass (okr, skill) are each that
  seat's own finished run landing, not a ruling naming a different
  seat. Nothing else merged.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list. None
  configured.
- **An owner-merge PR older than seven days:** yes, still #395
  (research, now nine days old). Unchanged from the third pass;
  recorded in `pending.md`, not fired here — the row's own dispatch
  column is "nobody."

## Nothing proposed as a workflow dispatch this run

The one qualifying row was answered by a board handoff instead, which
is cheaper than a run and is the right tool for "land or close," not
"build." Full text of that handoff is in `pending.md` and on the board
itself, addressed from `pm`/Ursa to `engineer`/Ursa.

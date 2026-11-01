# Dispatch queue — 2026-11-01, message-triggered standup (third pass of the day)

`PM_DISPATCH_ENABLED` is unset in this run's environment
(`echo "PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints empty). The
switch is off, so nothing below fires even if it qualified.

## Checked against the criteria table (pm.md §11.3), nothing qualifies

- **Failed runs in the last 24h:** `gh run list --status failure
  --created ">=$(date -u -d '-24 hours' +%FT%TZ)"` returns none. Every
  run in `gh run list --limit 10` is `redaction-gate`, green.
- **A seat's open draft with failing CI or an unanswered review comment
  >24h:** today's drafts (#618 exo, #615 engineer) were opened minutes
  before this check and are each seat's own live run in progress, the
  same shape this run's own draft has. Not stale.
- **Two or more open PRs on one scope, none merged:** no seat shows two
  or more open PRs converging on one scope right now; the five-day-old
  cluster from 2026-10-27 (#609, #607, #604, #602, #601, #600, #599,
  #591) is each seat's own single open PR, not a stack, and was already
  surveyed by this seat's own earlier pass today (`ursa-pm/2026-11-01-message`,
  first two passes).
- **A ruling or ADR merged since the last run names a seat and no run
  followed:** `git log --oneline -5 main` shows #614 (finance, this
  pass's own merge) as the latest; no ADR in it.
- **A milestone due within three days with open items:** `gh api
  repos/alexandrapaiz/Ursa/milestones` returns an empty list. None
  configured.
- **An owner-merge PR older than seven days:** yes, #395 (research,
  opened 2026-10-24, eight days old). The row's own dispatch column is
  "nobody" — a pending line and the report, not a seat dispatch — so
  recorded in `pending.md` under the owner's queue rather than fired
  here.

## Nothing proposed this run

Every row came back empty or already covered by this seat's own
earlier passes today. Saying so cheaply, per the table's own last row,
rather than manufacturing a candidate to fill the section.

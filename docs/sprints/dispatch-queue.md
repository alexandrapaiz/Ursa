# Dispatch queue — 2026-10-24, ~11:1x UTC, scheduled standup (cron)

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox: one board note, independently verified rather than taken on its word

Research's note said the closed pull request this seat's own earlier
note carried both silence clocks onto was superseded nineteen seconds
after that note posted, by a newer research pull request (#322) that
contains it whole. Checked rather than trusted: `gh pr view 319`
confirms `CLOSED`, `gh pr view 322` confirms `OPEN`/`MERGEABLE`, and
`git merge-base --is-ancestor <319's head> <322's head>` returns true.
The correction is real.

This run does not re-point the ledger entry (`docs/ideas.md`,
"Citation discipline…") to #322, because that edit is ledger grooming
and today's charter (§0) bars the standup from grooming the ledger.
Recorded in `docs/sprints/pending.md` instead, and raised to the owner
directly on the board (`ask`, 2026-10-24 ~11:11 UTC) since clocks
A/B/C expire 2026-10-25 ~18:15 UTC, before the next ceremony
(2026-10-26) that would normally groom it.

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished today. Nothing to
   dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 30`: every row succeeded
   (`redaction-gate` only). No Minor/Major check is red on any open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | `gh run list --limit 30`: all succeeded. No failure to triage. |
| A seat's open draft has failing CI, or a review comment unanswered >24h | Two open drafts (`#324` skill, `#318` exo), both green, both inside today's own window. Nothing orphaned. |
| A sprint item due this week, owning seat hasn't run | Between sprints: `sprint-2026-10-12.md` closed 2026-10-23, next ceremony 2026-10-26. Nothing due this week to miss. |
| A seat has two or more open PRs on one scope, none merged | This seat's own four-deep stack (#313/#317/#321/#323) on `docs/ideas.md`/`docs/sprints/pending.md`, none merged — already named by the seventieth pass, unchanged, waiting on the owner or a chair, not a dispatch target (it is this seat's own queue). |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check. |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty). |
| An owner-merge PR older than seven days | None found freshly; oldest open PR today is `#269` (2026-10-18), already named in earlier passes. |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless.
This run's one open item (the dead clock pointer) is this seat's own
ledger-grooming debt, not another seat's, so there is nothing to
dispatch for it either.

## Failed-run triage this run (§11.7)

None. `gh run list --limit 30`: all succeeded. Nothing to classify,
rerun, or hand off.

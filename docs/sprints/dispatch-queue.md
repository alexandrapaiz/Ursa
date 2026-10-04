# Dispatch queue — 2026-10-04 (standup, ~15:41 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`. No owner instructions carried
on this dispatch.

## Proposed

None. Every seat this charter may dispatch has its most recent PR
still open:

| Seat | Most recent PR | Opened |
|---|---|---|
| engineer | #72 | 2026-10-04 |
| research | #68 | 2026-10-02 |
| frontend | #65 | 2026-10-01 |
| skill | #64 | 2026-10-01 |
| okr | #63 | 2026-10-01 |
| finance | #62 | 2026-10-01 |
| market | #52 | 2026-09-30 |
| security | #47 | 2026-09-30 (draft) |

docs/standards/pm.md §11.4's hard stop — never dispatch a seat whose
last PR is still open, unless the instruction tells it, in those
words, to build on that exact branch — forbids all eight before any
other criterion is even checked. No owner instructions this run name
a continuation of any of these branches.

Checked against the rest of §11.3 anyway, for completeness:

- No seat run failed in the last 24h: `gh run list --limit 30` shows
  nothing non-success since the prior standup
  (2026-10-03T15:04:05Z, pm-agent) other than this run's own
  in-progress entry.
- No open PR shows failing CI. All 49 open PRs report green
  `statusCheckRollup` except #52 (`ursa-market/2026-09-30-window`),
  which has no checks configured on its changed paths, not a failure.
  No unanswered review/comment needing a seat's reply beyond what
  `docs/sprints/pending.md` already carries (self-comments on frontend's
  own stale PRs, not this seat's lane).
- No ADR merged since the last run names a seat with no run
  following — `docs/decisions.md` is unchanged since 2026-09-25 (still
  the ADR-005/006 numbering collision, two rulings under each number).
- The open milestone ("Sprint 2026-09-28," #2) came due today
  (2026-10-04) but carries zero attached issues/PRs — GitHub's
  milestone field has never been wired to the sprint PRs, so there are
  no "open items" to dispatch against. The actual gap is PR #34
  merging, an owner action, not a dispatch, and milestone wiring is
  ceremony-lane work (§2b), not standup's.
- exo, sales: never dispatched by charter (exo audits this seat; sales
  is dormant).

## Dispatched by the PM

None this run.

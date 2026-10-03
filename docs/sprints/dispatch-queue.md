# Dispatch queue — 2026-10-03 (standup, ~15:08 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`.

## Proposed

None. Every seat this charter may dispatch has its most recent PR
still open:

| Seat | Most recent PR | Opened |
|---|---|---|
| engineer | #69 | 2026-10-03 |
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
other criterion is even checked. Nothing observed this run names a
continuation of any of these branches.

Checked against the rest of §11.3 anyway, for completeness:

- No seat run failed in the last 24h: `gh run list --limit 60` shows
  nothing non-success since 2026-10-02T15:00Z.
- No open PR shows failing CI or an unanswered review/comment needing
  a seat's reply (the handful of comments present are self-comments or
  the owner's own notes on her own PRs — see docs/sprints/pending.md).
- No ADR merged since the last run names a seat with no run
  following — `docs/decisions.md` is unchanged since 2026-09-25.
- The open milestone ("Sprint 2026-09-28") is due 2026-10-04, inside
  the three-day window, but carries zero attached issues/PRs; the
  actual gap is PR #34 merging, an owner action, not a dispatch.
- exo, sales: never dispatched by charter (exo audits this seat; sales
  is dormant).

## Dispatched by the PM

None this run.

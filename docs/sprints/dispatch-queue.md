# Dispatch queue — 2026-10-06 (ceremony run, §0b)

`PM_DISPATCH_ENABLED` is exactly `true`. No owner instructions carried
on this dispatch.

## Proposed

None. Every seat this charter may dispatch has its most recent PR
still open:

| Seat | Most recent PR | Opened | State |
|---|---|---|---|
| engineer | #107 | 2026-10-06 | draft |
| research | #82 | 2026-10-05 | ready |
| frontend | #103 | 2026-10-05 | ready |
| skill | #83 | 2026-10-05 | draft |
| okr | #88 | 2026-10-05 | ready |
| finance | #91 | 2026-10-05 | draft |
| market | #89 | 2026-10-05 | ready |
| security | #85 | 2026-10-05 | draft |

docs/standards/pm.md §11.4's hard stop — never dispatch a seat whose
last PR is still open, unless the instruction tells it, in those
words, to build on that exact branch — forbids all eight before any
other criterion is checked, same as every standup since 2026-09-30.
No owner instructions this run name a continuation of any of these
branches.

Checked against the rest of §11.3 anyway, for completeness:

- No seat run failed in the last 24h: `gh run list --status failure
  --created ">=$(date -u -d '-30 hours' +%FT%TZ)"` returns empty.
- No ADR merged since the last check names a seat with no run
  following — `docs/decisions.md` is unchanged since 2026-09-25 (still
  the ADR-005/006 numbering collision, two rulings under each number).
- The open milestone ("Sprint 2026-09-28," #2) is now two days past
  its 2026-10-04 due date, still carrying zero attached issues/PRs —
  GitHub's milestone field has never been wired to sprint PRs. The
  actual gap is this PR (or #93) merging, an owner action, not a
  dispatch; wiring the milestone to the live sprint is this PR's own
  job once it lands, same as #34 and #93 each said of themselves.
- exo, sales: never dispatched by charter (exo audits this seat; sales
  is dormant).

## Dispatched by the PM

None this run.

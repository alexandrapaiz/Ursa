# Dispatch queue — 2026-10-05 (ceremony run, message-triggered)

`PM_DISPATCH_ENABLED` not confirmed this run (not re-checked; moot,
since the hard stop below forecloses every candidate regardless).
Owner instructions carried this run: a chair handoff (`asc/chair:ursa`,
board message, 2026-10-05T03:28Z) — see this run's PR description for
the full reasoning on what it did and did not unlock.

## Proposed

None. Every seat this charter may dispatch has its most recent PR
still open:

| Seat | Most recent PR | Opened |
|---|---|---|
| engineer | #92 (also #86, window) | 2026-10-05 |
| research | #82 | 2026-10-05 |
| frontend | #84 | 2026-10-05 |
| skill | #83 | 2026-10-05 |
| okr | #88 | 2026-10-05 |
| finance | #91 | 2026-10-05 |
| market | #89 | 2026-10-05 |
| security | #85 | 2026-10-05 |

docs/standards/pm.md §11.4's hard stop — never dispatch a seat whose
last PR is still open, unless the instruction tells it, in those
words, to build on that exact branch — forbids all eight before any
other criterion is even checked. The chair's handoff names the
engineer's PR #92 as the sprint's head item, which this run carried
into sprint-2026-10-05 item 1 as "build on the open branch" — that is
a sprint assignment, not a dispatch, since the engineer's own cadence
(twice daily) already covers it without a `gh workflow run` call.

Checked against the rest of §11.3 anyway, for completeness:

- No seat run failed in the last 24h: `gh run list --limit 30` shows
  nothing non-success.
- No open PR shows failing CI: checked every open PR's
  `statusCheckRollup` this run, zero `FAILURE` conclusions.
- No ADR merged since the last run names a seat with no run
  following — `docs/decisions.md` is unchanged since 2026-09-25.
- The open milestone situation is unchanged: a merge (#44, then #34 or
  its replacement), not a dispatch, is the actual gap.
- exo, sales: never dispatched by charter (exo audits this seat; sales
  is dormant).

## Dispatched by the PM

None this run.

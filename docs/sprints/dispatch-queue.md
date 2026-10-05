# Dispatch queue — 2026-10-05 (message pass, six-hour, ~06:22 UTC)

`PM_DISPATCH_ENABLED` not re-checked by value this pass; moot anyway —
see below. No owner instructions carried on this dispatch beyond the
six-hour pass's own checklist.

## Proposed

None. Every seat this charter may dispatch has a PR open from
tonight's window session alone, let alone anything older:

| Seat | Most recent PR | Opened |
|---|---|---|
| engineer | #92 | 2026-10-05 03:29 |
| research | #82 | 2026-10-05 03:13 |
| frontend | #84 | 2026-10-05 03:13 |
| skill | #83 | 2026-10-05 03:13 |
| okr | #88 | 2026-10-05 03:16 |
| market | #89 | 2026-10-05 03:17 |
| finance | #91 | 2026-10-05 03:26 (draft) |
| security | #85 | 2026-10-05 03:14 (draft) |

docs/standards/pm.md §11.4's hard stop — never dispatch a seat whose
last PR is still open, unless an instruction names that exact branch
to build on — forbids all eight before any other criterion is
checked. No instruction this pass names a continuation of any of
these branches.

Checked against the rest of §11.3 anyway, for completeness:

- One seat run failed in the last six hours and the cause is
  diagnosable (the scheduled `engineer-agent` run, 02:13-02:58Z,
  concluded `cancelled` — its job hit the workflow's own 45-minute
  timeout, not an external kill). The diagnosis would normally point
  at the engineer seat or the workflow file, but the hard stop above
  still forecloses it: engineer's queue is all open PRs already.
  Logged in `docs/sprints/pending.md` instead of queued here.
- No open PR shows failing CI (`gh pr list --state open`, all green
  except where no check applies to the changed paths — not a
  failure).
- No ADR merged since the last run names a seat with no run
  following — `docs/decisions.md` unchanged since the last pass read
  it.
- exo, sales: never dispatched by charter (exo audits this seat;
  sales is dormant — Ursa is private R&D, never for sale).

## Dispatched by the PM

None this pass.

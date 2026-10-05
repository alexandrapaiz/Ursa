# Dispatch queue — 2026-10-05 (six-hour message pass, ~12:21 UTC)

Could not confirm `PM_DISPATCH_ENABLED` this run (`gh variable get`
returned 403, resource not accessible by this token). Moot regardless:
the hard stop below forecloses every candidate on its own.

## Proposed

None. Every seat this charter may dispatch has its most recent PR
still open:

| Seat | Most recent PR | Opened |
|---|---|---|
| engineer | #92 (also #77 open) | 2026-10-05 |
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
other criterion is even checked. No owner instructions this run name
a continuation of any of these branches.

Checked against the rest of §11.3 anyway, for completeness:

- No seat run failed in the last six hours: `gh run list --limit 60`
  shows exactly one run since the prior pass (06:29Z), this seat's own
  redaction-gate check on PR #100, which succeeded.
- No open PR shows failing CI across the 75 open PRs checked this run.
- No ADR merged since the last run names a seat with no run
  following — `docs/decisions.md` unchanged since 2026-09-25.
- No milestone due within three days with open items observed this
  run.

## Dispatched by the PM

None this run.

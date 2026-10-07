# Dispatch queue — 2026-10-07, second message pass (~12:30 UTC)

`PM_DISPATCH_ENABLED` is not set to `true` (checked `gh variable list`
directly). No owner instructions carried on this pass (a scheduled
message pass, not an owner-present window).

## Proposed

None. Every seat this charter may dispatch, except market and okr,
already carries an open pull request, which forecloses
`docs/standards/pm.md` §11.4's hard stop before any other criterion is
checked:

| Seat | Most recent open PR | Opened | State |
|---|---|---|---|
| engineer | #126 | 2026-10-07 | draft, in progress (subsumes #92) |
| research | #114 | 2026-10-06 | draft, in progress |
| frontend | #125 | 2026-10-07 | draft, in progress |
| skill | #123 | 2026-10-07 | draft, in progress |
| security | #124 | 2026-10-07 | draft, in progress (also #112, #85, #75 still open behind it) |
| finance | #91 | 2026-10-05 | draft, idle |
| market | none | — | #127 merged this pass; no open PR |
| okr | none | — | #88 and #63 both merged |

Checked market and okr against the rest of §11.3 anyway, since neither
is walled by an open PR:

- **No seat run failed in the last 24h.** `gh run list --status
  failure --created ">=24 hours ago"` returns empty.
- **No sprint item names market or okr.** sprint-2026-10-05's three
  items are engineer (x2, both shipped — #107, #109) and security (x1,
  open). Neither market nor okr owns anything on the live sprint.
- **No ADR merged since the last pass names either seat.**
  `docs/decisions.md` is unchanged since 2026-09-25.
- **No milestone is due within three days.** The live milestone
  ("Sprint 2026-10-05," #3) is due 2026-10-11, four days out.

So nothing fires for them either. Checked the rest of §11.3 for
completeness:

- **No open PR shows failing CI.** Every open PR checked this pass is
  green or has no checks configured on its changed paths.
- **The one sprint item still open** is security's redaction standard
  (item 3, gates O2 KR2.2) — no PR touches it, which would ordinarily
  fire "a sprint item is due this week and its owning seat has not run"
  under §11.3, except security already has four open pull requests,
  which forecloses it under §11.4 regardless. The real unlock is
  security clearing its own queue first; already asked of it, unchanged
  this pass.
- exo, sales: never dispatched by this charter (exo audits this seat;
  sales is dormant, posture private-R&D, never for sale per ADR-001).

## Dispatched by the PM

None this pass.

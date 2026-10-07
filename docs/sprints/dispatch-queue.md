# Dispatch queue — 2026-10-07, third pass (~18:15 UTC, triage of the
17:52 UTC engineer-agent failure)

`PM_DISPATCH_ENABLED` is unset this pass (checked directly in the run
environment). This is a message-triggered triage of one failed run,
not an owner-present window, so no owner instructions carry.

## Proposed

None. Nothing changed since the second pass's reconciliation that
would unlock a dispatch, and the failure this pass exists to triage
makes engineer's own hard stop stronger, not weaker: it now carries
three open pull requests (#92, #126, #130, see pending.md) instead of
one.

| Seat | Most recent open PR | Opened | State |
|---|---|---|---|
| engineer | #130 | 2026-10-07 17:53 | draft, mislabeled (see pending.md); #92 and #126 still open behind it |
| research | #114 | 2026-10-06 | draft, in progress |
| frontend | #125 | 2026-10-07 | draft, in progress |
| skill | #123 | 2026-10-07 | draft, in progress |
| security | #124 | 2026-10-07 | draft, in progress (also #112, #85, #75 still open behind it) |
| finance | #91 | 2026-10-05 | draft, idle |
| market | none | — | no open PR |
| okr | none | — | no open PR |

Checked market and okr against the rest of §11.3 anyway, since neither
is walled by an open PR:

- **One seat run failed in the last 24h** — engineer, 17:52 UTC today,
  the subject of this pass's triage. It does not fire a dispatch for
  market or okr (neither is the failing seat), and does not fire one
  for engineer either: engineer is already walled by three open PRs
  under §11.4, and the hard stop forecloses re-dispatching a seat with
  open work of its own unless told to build on it, which no owner
  instruction says here.
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
  which forecloses it under §11.4 regardless.
- exo, sales: never dispatched by this charter (exo audits this seat;
  sales is dormant, posture private-R&D, never for sale per ADR-001).

## Dispatched by the PM

None this pass.

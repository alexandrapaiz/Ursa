# Dispatch queue — 2026-10-08, message pass (~03:30 UTC, triaging the
engineer seat's failed run)

`PM_DISPATCH_ENABLED` is not checkable this pass — `gh variable list`
returns a 403 for this run's token (unlike the 2026-10-07 passes, which
could read it and found it unset). Defaulting to not-enabled, the same
conservative read an unset value gets, since nothing here would fire
regardless (see below). This is a message-triggered triage, not an
owner-present window, so no owner instructions carry.

## Proposed

None. The event this pass answers is a failed run whose real work
already shipped (#134, see `pending.md`'s "Failures this pass") — not
a dispatch trigger, a triage. Every seat below is still walled by its
own open PR:

| Seat | Most recent open PR | Opened | State |
|---|---|---|---|
| engineer | #134 | 2026-10-08 03:14 | ready, CI green, mergeable — the seat's only open PR now (was #92/#126/#130, all closed by #134 itself) |
| research | #114 | 2026-10-06 | draft, in progress |
| frontend | #125 | 2026-10-07 | draft, in progress |
| skill | #123 | 2026-10-07 | draft, in progress |
| security | #124 | 2026-10-07 | draft, in progress (also #112, #85, #47 still open behind it) |
| finance | #91 | 2026-10-05 | draft, idle |
| market | none | — | #127 merged 2026-10-07; no open PR |
| okr | none | — | no open PR |

Checked market and okr against the rest of §11.3 anyway, since neither
is walled by an open PR:

- **One seat run failed in the last 24h** — engineer, 37719675527,
  the subject of this pass's triage. Classified a tripwire false alarm
  (see `pending.md`), not a diagnosable defect, so it does not fire the
  "seat run failed and cause is diagnosable" row at all: there is no
  defect to fix and re-run. It also would not fire for engineer even if
  it were a defect — engineer is walled by its own open PR (#134) under
  §11.4's hard stop, and no owner instruction says to build on that
  branch.
- **No sprint item names market or okr.** sprint-2026-10-05's three
  items are engineer (×2, both shipped — #107, #109) and security (×1,
  open). Neither market nor okr owns anything on the live sprint.
- **No ADR merged since the last pass names either seat.**
  `docs/decisions.md` is unchanged since 2026-09-25.
- **Milestone "Sprint 2026-10-05" (#3) is now due within three days**
  (2026-10-11, three days out) but carries zero attached issues/PRs
  through GitHub's own milestone field, so the §11.3 row ("a milestone
  is due within three days *with open items*") has no items to name and
  does not fire for any seat. The gap is the milestone's wiring, not a
  seat's work — ceremony-lane per §2b, flagged in `pending.md`.

So nothing fires for them either. Checked the rest of §11.3 for
completeness:

- **No open PR shows failing CI.** Every open PR checked this pass is
  green or has no checks configured on its changed paths. #134 itself
  passed its redaction-gate scan.
- **The one sprint item still open** is security's redaction standard
  (item 3, gates O2 KR2.2) — no PR touches it, which would ordinarily
  fire "a sprint item is due this week and its owning seat has not run"
  under §11.3, except security already has four open pull requests,
  which forecloses it under §11.4 regardless. Unchanged from the last
  three passes.
- exo, sales: never dispatched by this charter (exo audits this seat;
  sales is dormant, posture private-R&D, never for sale per ADR-001).

## Dispatched by the PM

None this pass.

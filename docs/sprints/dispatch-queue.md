# Dispatch queue — 2026-10-05 (synchronous window, opened ~03:14 UTC)

Window opened by the chair (docs/standards/pm.md §11.4, L-P7). The
owner is present or may join; no follow-up message naming a concrete
action has arrived yet this session. `PM_DISPATCH_ENABLED` could not be
read this run (`gh variable list` returns 403 — this session's token
lacks `actions:read`, unlike the scheduled workflow's). Moot below: the
hard stop blocks every candidate regardless of the switch.

## Proposed

None. Every seat this charter may dispatch has its most recent PR still
open:

| Seat | Most recent PR | Opened |
|---|---|---|
| engineer | #86 (window) / #77 still open underneath it | 2026-10-05 |
| research | #82 (window) | 2026-10-05 |
| frontend | #84 (window) | 2026-10-05 |
| skill | #83 (window) | 2026-10-05 |
| security | #85 (window) | 2026-10-05 |
| okr | #63 | 2026-10-01 |
| finance | #62 | 2026-10-01 |
| market | #52 | 2026-09-30 |

docs/standards/pm.md §11.4's hard stop — never dispatch a seat whose
last PR is still open, unless the instruction tells it, in those words,
to build on that exact branch — forbids all eight before any other
criterion is even checked. No owner instructions this session name a
continuation of any of these branches.

Checked against the rest of §11.3 anyway, for completeness:

- **Failed runs:** `gh run list --limit 40` since the last PM run
  (2026-10-04T15:41:23Z, the standup) shows one non-success: the
  scheduled `engineer-agent` cron at 02:13Z, **cancelled**, not failed
  — it was superseded when the chair's window dispatch fired
  `ursa-engineer/2026-10-05-window` a minute later. Not diagnosable as
  a defect, so not dispatched as one.
- **CI:** all open PRs report green `statusCheckRollup` except #52
  (`ursa-market/2026-09-30-window`, no checks configured on its changed
  paths — not a failure, carried from every prior standup) and the
  window PRs still mid-run at snapshot time (#81 exo, #87 sales) which
  resolved green by the time of this write-up.
- **ADRs:** `docs/decisions.md` is unchanged since 2026-09-25 — still
  the ADR-005/006 numbering collision, two rulings under each number,
  outside this seat's writable surface.
- **Milestone:** "Sprint 2026-09-28" (#2) is now a day overdue
  (due 2026-10-04) with zero attached issues/PRs. The real gap is #34
  merging, an owner action, not a dispatch.
- exo, sales: never dispatched by this charter (exo audits this seat;
  sales is dormant — tonight's sales run, #87, carries its own note
  that it was dispatched directly by the owner, which is hers to do).

**One asymmetry worth naming, not acting on:** tonight's window pass
(~03:13–03:15Z) fired seven seats — sales, engineer, security,
frontend, skill, research, exo — but not market, okr, or finance. If
that was deliberate (narrower than 2026-09-30's true all-hands), no
action needed. If it was meant to be all-hands and those three were
missed, that is the chair's or the owner's call to fire the three
remaining `gh workflow run agent-<seat>.yml` calls directly; this
charter does not let the PM originate that judgment from inference
alone (§11.4, "never invent a judgment").

## Dispatched by the PM

None this run.

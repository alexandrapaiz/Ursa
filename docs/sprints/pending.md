# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated. This
file's first version, opened alongside the first sprint.

## Awaiting the owner's merge

- 2026-09-20 — PR #7 `exo/2026-09-20`, the ExO weekly cycle. Open one day
  before this file existed. Also edits `docs/agents/org-chart.md`; see
  the note in this PM PR's description about merge order with the
  sprint PR below.
- 2026-09-21 — PR `pm/sprint-2026-09-21` (this run): retro skipped (no
  prior sprint file existed), ledger groomed, first sprint opened,
  `docs/prfaq/overlay.md` drafted as the Working Backwards gate on the
  overlay initiative (product-plan.md §16).

## Waiting on an owner-only action

- 2026-09-20 (from PR #7) — Two data-hygiene fixes only the owner can
  land, since both files sit outside every current seat's writable
  lane: `docs/design/product-plan.md` (lines 109, 115, 125, 142) carries
  the owner's literal home directory and a trial session UUID;
  `ursa-major/trial/README.md` line 46 carries both. Filed as Ursa
  Incident 4 (PR #7 description); exact replacement text was in that
  PR's now-superseded `docs/agents/pending-workflow-changes.md` (unmerged,
  so re-pull it from PR #7 before acting).
- 2026-09-20 (from PR #7) — `gh repo edit` for the repo description
  returns 403 from the runner; only the owner can set it. Exact command
  was in PR #7's `docs/agents/pending-workflow-changes.md`.
- 2026-09-21 — `docs/prfaq/overlay.md` needs the owner's merge as the
  go/no-go decision before the overlay (product-plan.md §16) can enter
  any sprint, per docs/standards/pm.md §2c.

## Owed by a seat, not yet started

- 2026-09-21 — engineer (dormant, owner-dispatch): sprint-2026-09-21
  items 1–3 (docs/sprints/sprint-2026-09-21.md).
- 2026-09-21 — market (dormant, owner-dispatch): sprint-2026-09-21 item
  4, `docs/market/landscape.md`, serving OKR KR2.3 (due 2026-10-31).
- 2026-09-18 — three `proposed` ledger entries have no owner verdict yet
  (none older than two weeks as of this run, so none escalated to "Awaiting
  your verdict" in the PR description): repo split (2026-09-18), tuning
  packs (2026-09-19), merge-commits/PR-reader finding (2026-09-20).

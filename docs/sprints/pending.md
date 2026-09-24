# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-24, second standup pass today (04:31Z/04:41Z
ceremony-lite + standup, then this 15:44Z scheduled standup), against
`gh pr list --state all`, `gh run list --limit 30`, `gh workflow
list --all`, and the current repo state.

## Awaiting the owner's merge

- None open right now. **Resolved this run:** PR #7 (`exo/2026-09-20`)
  and PR #9 (`pm/sprint-2026-09-21`) both show `state: MERGED` as of
  this pass (merged 2026-09-24, `104697a`/`e5d1110` range) — the prior
  standup's "4 days old, awaiting merge" lines are stale and removed.
  PR #9's merge is also the owner's go decision on `docs/prfaq/overlay.md`
  (docs/standards/pm.md §2c): the overlay initiative may now enter a
  sprint. That's a sprint-planning action for the next ceremony, not
  this standup.

## Waiting on an owner-only action

- **Resolved this run:** the two data-hygiene leaks (owner's literal
  local path in `docs/design/product-plan.md`, the trial session UUID
  in both that file and `ursa-major/trial/README.md`) and the empty
  repo description are all fixed. Confirmed by direct grep this pass:
  neither file carries the raw path or full UUID anymore (the UUID is
  now truncated to its first segment with a pointer to
  `ursa-private`), and `gh repo view` now returns the mission
  one-liner as the description. `docs/agents/pending-workflow-changes.md`
  itself confirms all four PWC entries were applied by the chair
  2026-09-24 and self-deletes its entries per its own rule. Incident 4
  is fixed in practice; its Status line in `docs/agents/incidents.md`
  (still reading "Open until both are edited") is now stale — that's
  exo's register to update, not this seat's lane, flagged here so it
  doesn't get missed.
- 2026-09-24 (confirmed directly this run, not just inferred) —
  `LINEAR_API_KEY` is present but **is not a Linear key**. This run's
  own environment exposes the secret (needed for §1f), and its value
  is legible as an email notification subject line from a *different*
  repository entirely, not an opaque `lin_api_...` token. Not
  reproduced verbatim here on purpose — same redaction discipline as
  the leaks above. The §1f sync (issue query/create/update, URS-1..7
  reconciliation) is skipped again this run under the charter's
  fail-soft rule for an unusable key. **Action for the owner:**
  `gh secret set LINEAR_API_KEY` with the actual value from Linear →
  Settings → API → Personal API keys.
- `PROJECTS_TOKEN` still unset (moot: Linear is the board of record
  per ADR-005; labels/milestones per §2b don't need it).

## New this run — newly-activated seats' first scheduled crons did not fire

Confirmed via `gh workflow list --all` (all seven show `active`, not
disabled) and `gh run list` (zero runs, ever, for engineer, market,
skill, frontend, research, security, finance): **engineer's 11:26 UTC
cron today, skill's 13:55 UTC today, and frontend's 14:15 UTC today
all passed with no run recorded**, as of this pass at 15:49 UTC — 4+
hours late for engineer specifically. The workflows aren't disabled
and `workflow_dispatch` is proven working today (this seat's own two
human-triggered runs, 04:31Z/04:40Z, and its own current scheduled
run). Cause not diagnosed further this run (standup budget); worth an
exo look if it recurs tomorrow. Practical response taken now: engineer
and market are dispatched below rather than waiting on a cron that
hasn't proven itself yet this sprint.

## Owed by a seat, not yet started

- 2026-09-21 — engineer: sprint-2026-09-21 items 1-3. Zero runs ever.
  **Dispatched this run** (see dispatch-queue.md) because the 11:26
  UTC cron that was supposed to be its first chance at item 1 did not
  fire.
- 2026-09-21 — market: sprint-2026-09-21 item 4,
  `docs/market/landscape.md`, serving KR2.3 (due 2026-10-31). Zero
  runs ever. **Dispatched this run**: its own Wednesday 13:35 UTC cron
  already passed this week without firing, and the next occurrence
  (2026-09-30) falls after this sprint closes (Sunday 2026-09-27).
- 2026-09-18 through 2026-09-20 — three `proposed` ledger entries still
  have no owner verdict: repo split (2026-09-18, 6 days), tuning packs
  (2026-09-19, 5 days), the merge-commits/PR-reader finding
  (2026-09-20, 4 days). None has crossed the two-week mark yet.

## Newly active, first cron due but not yet fired (ADR-005, 2026-09-24)

research (Fri 13:15 UTC, next 09-25), security (Sun 15:15 UTC, next
09-27), finance (1st of month 11:30 UTC, next 10-01) still have their
first occurrence ahead of them — nothing owed yet. skill (Thu 13:55
UTC) and frontend (Thu 14:15 UTC) had a first occurrence *today* that
did not fire (see above); neither has a sprint item assigned yet, so
no dispatch trigger applies to them under §11.3 — noted, not acted on.

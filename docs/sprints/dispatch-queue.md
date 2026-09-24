# Dispatch queue — 2026-09-24

Written in full this run per docs/standards/pm.md §11.6. **No
dispatches fired**: the owner is present for this ceremony-lite
update, and §11.4's hard stop ("never dispatch while the owner is
present") applies regardless of `PM_DISPATCH_ENABLED`'s value.

## Proposed

1. **Trigger:** sprint item 1 (docs/sprints/sprint-2026-09-21.md) is
   due this sprint and engineer has never run (0 runs in `gh run list`
   history). Criterion: "a sprint item is due this week and its owning
   seat has not run this sprint" (§11.3).
   **Cost of skipping:** low. ADR-005 activated engineer's own cron
   today (11:26 and 23:26 UTC); the 11:26 run covers this without a
   manual dispatch.
   **Command:** `gh workflow run agent-engineer.yml -f
   owner_instructions='Sprint 2026-09-21 item 1: trace-stage
   correction-loop and regression auto-detection in
   ursa-major/src/signals.ts, serving O1 KR1.2. See
   docs/sprints/sprint-2026-09-21.md for the full acceptance
   criteria.'`

2. **Trigger:** sprint item 4 (docs/sprints/sprint-2026-09-21.md) is
   due this sprint and market has never run (0 runs). Same criterion.
   **Cost of skipping:** low. Market's own cron (Wed 13:35 UTC) next
   fires 2026-09-30; item 4 serves KR2.3, due 2026-10-31, so the
   natural cadence still lands well inside the deadline even if it
   slips past this sprint's Sunday close.
   **Command:** `gh workflow run agent-market.yml -f
   owner_instructions='Sprint 2026-09-21 item 4: draft
   docs/market/landscape.md, 9+ competitors across preference-data
   vendors, evaluation/arena products, and personalization/memory
   layers, serving O2 KR2.3 (due 2026-10-31).'`

Not queued: PR #7 (4 days open) and PR #9 (3 days open) are both
owner-merge items, not seat-run items — §11.3's "owner-merge PR older
than seven days" criterion doesn't fire a dispatch even once it hits
seven days, it produces a pending line and nothing else. Both are
already dated in docs/sprints/pending.md.

## Dispatched by the PM

None this run (owner present).

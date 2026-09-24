# Dispatch queue — 2026-09-24 (standup)

`PM_DISPATCH_ENABLED` is exactly `true`, but **no dispatches fired**:
this run was itself started by a human `workflow_dispatch` (this run,
04:40:43Z, carrying owner instructions) minutes after the previous one
(04:31:31Z, also `workflow_dispatch`, merged as `3cf6220`). Both are
inside the two-hour window, so §11.4's hard stop ("never dispatch
while the owner is present") applies regardless of the switch.

## Proposed

Unchanged from the prior run (10 minutes ago); nothing new happened in
the gap to add or retire an entry.

1. **Trigger:** sprint item 1 (docs/sprints/sprint-2026-09-21.md) is
   due this sprint and engineer has never run (0 runs in `gh run list`
   history, confirmed again this run).
   **Cost of skipping:** low. Engineer's own cron fires today at 11:26
   and 23:26 UTC (ADR-005); the 11:26 run is still ahead of this run's
   04:41 UTC timestamp and covers item 1 without a manual dispatch.
   **Command:** `gh workflow run agent-engineer.yml -f
   owner_instructions='Sprint 2026-09-21 item 1: trace-stage
   correction-loop and regression auto-detection in
   ursa-major/src/signals.ts, serving O1 KR1.2. See
   docs/sprints/sprint-2026-09-21.md for the full acceptance
   criteria.'`

2. **Trigger:** sprint item 4 (docs/sprints/sprint-2026-09-21.md) is
   due this sprint and market has never run (0 runs).
   **Cost of skipping:** low. Market's own cron (Wed 13:35 UTC) next
   fires 2026-09-30; item 4 serves KR2.3, due 2026-10-31, so the
   natural cadence still lands well inside the deadline.
   **Command:** `gh workflow run agent-market.yml -f
   owner_instructions='Sprint 2026-09-21 item 4: draft
   docs/market/landscape.md, 9+ competitors across preference-data
   vendors, evaluation/arena products, and personalization/memory
   layers, serving O2 KR2.3 (due 2026-10-31).'`

Not queued: PR #7 (4 days open, `MERGEABLE`, no reviews) and PR #9 (3
days open, now `CONFLICTING`, no reviews) are both owner-merge items,
not seat-run items — the "owner-merge PR older than seven days"
criterion doesn't apply yet at 3-4 days, and either way it produces a
pending line, not a dispatch. Both are dated in
docs/sprints/pending.md.

Also not queued, and not a §11.3 row at all: the `LINEAR_API_KEY`
secret is present but does not authenticate (see PR description and
pending.md). Rotating a secret is an owner-only action per §11.4, not
something any dispatch can fix.

## Dispatched by the PM

None this run (owner present, per the hard stop above).

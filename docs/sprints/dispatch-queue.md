# Dispatch queue — 2026-09-24 (standup, 15:44 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`. Unlike the 04:41Z standup
today, the "owner present" hard stop does not apply this run: the last
human `workflow_dispatch` (alexandrapaiz, 04:40:43Z) is now 11+ hours
old, well outside the two-hour window. Dispatch budget today: 0 used
before this run (the 04:41Z run fired none), so up to 3 available,
1 per seat, ceiling 10/rolling-7-days (also 0 used this week).

## Proposed

1. **Trigger:** sprint item 1 (docs/sprints/sprint-2026-09-21.md) is
   due this sprint; engineer has 0 runs ever, and its own 11:26 UTC
   cron today did not fire (confirmed via `gh run list`, 4+ hours past
   due as of 15:49 UTC).
   **Cost of skipping:** the sprint closes Sunday 2026-09-27; engineer
   has now missed its first scheduled chance at item 1 with no proven
   alternative fire time today (23:26 UTC is the only cron left today).
   **Command:** `gh workflow run agent-engineer.yml -f
   owner_instructions='Sprint 2026-09-21 item 1: trace-stage
   correction-loop and regression auto-detection in
   ursa-major/src/signals.ts, serving O1 KR1.2. See
   docs/sprints/sprint-2026-09-21.md for full acceptance criteria.
   Your 11:26 UTC scheduled run today did not fire (0 runs in gh run
   list as of this dispatch) — this manual dispatch exists so the item
   still gets a run today.'`

2. **Trigger:** sprint item 4 (docs/sprints/sprint-2026-09-21.md) is
   due this sprint; market has 0 runs ever, and its Wednesday 13:35
   UTC cron already passed this week without firing.
   **Cost of skipping:** market's next scheduled occurrence
   (2026-09-30) falls after this sprint closes (Sunday 2026-09-27), so
   without a dispatch item 4 gets no run inside the sprint window at
   all, even though KR2.3's own due date (2026-10-31) has slack.
   **Command:** `gh workflow run agent-market.yml -f
   owner_instructions='Sprint 2026-09-21 item 4: draft
   docs/market/landscape.md, 9+ competitors across preference-data
   vendors, evaluation/arena products, and personalization/memory
   layers, serving O2 KR2.3 (due 2026-10-31). Your Wednesday 13:35 UTC
   cron this week did not fire and the next one (2026-09-30) falls
   after this sprint closes — this manual dispatch exists so item 4
   still gets a run inside the sprint.'`

Not queued: skill and frontend also missed a first-occurrence cron
today (13:55 and 14:15 UTC), but neither has a sprint item assigned,
so no §11.3 row applies — see pending.md. `LINEAR_API_KEY` not
authenticating is an owner-only fix (secret rotation), not a dispatch
target. No seat has a failing run to diagnose (`gh run list` shows no
failures since the already-logged okr-agent issues from 09-18/19), no
new ADR names an experiment without a run, and no owner-merge PR is
past seven days old (none are open at all right now).

## Dispatched by the PM

1. **2026-09-24, engineer** — instruction as above (item 1, cron
   miss). Fired via `gh workflow run agent-engineer.yml`. Run:
   see `gh run list --workflow agent-engineer.yml` (URL added once the
   run appears; the API returns the run only after it starts).
2. **2026-09-24, market** — instruction as above (item 4, cron miss),
   fired 3+ minutes after entry 1 per the concurrency-spacing rule.
   Fired via `gh workflow run agent-market.yml`. Run: see `gh run list
   --workflow agent-market.yml`.

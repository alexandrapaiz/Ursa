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

**Neither fired. Both attempts failed at the credential, not the
switch.** `gh workflow run agent-engineer.yml -f owner_instructions=…`
returned `HTTP 403: Resource not accessible by integration`
(`/repos/alexandrapaiz/Ursa/actions/workflows/361138497/dispatches`).
Confirmed it isn't a fluke or a workflow-file problem: `agent-pm.yml`
already declares `permissions: actions: write` at the job level
(charter §11.5's own prescription), and a direct probe —
`gh api /repos/alexandrapaiz/Ursa/actions/permissions` — returns the
identical 403 with no workflow involved at all. That combination means
this run's credential is a GitHub App installation token, not the
plain repo `GITHUB_TOKEN`, and the App's installation grant doesn't
include the `actions` scope — a per-workflow `permissions:` block
can't widen what the installation itself was never granted. This
contradicts §11.5's own claim ("No App key is needed"): a key is
involved, and it's the blocker.

Did not retry (a 403 on a capability check isn't a transient failure
to retry into). Both instructions are preserved above under Proposed,
verbatim and still evidenced, so the owner or an App-permission fix
can act on them without redoing the analysis. **Action for the owner:**
grant the `actions: write` scope to whatever GitHub App installation
is acting as this seat (Settings → Integrations → the app's
permissions, or re-check `agent-pm.yml`'s auth step if it's minting
its own installation token with a narrower scope list than the
workflow's `permissions:` block implies). Until that's fixed,
`PM_DISPATCH_ENABLED: true` has no effect — it's an inert switch, and
every future standup will hit the same wall on the same criteria.

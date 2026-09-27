# Dispatch queue — 2026-09-27 (standup, ~15:32 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`. Dispatch budget this week
(rolling 7 days, `gh run list --json event... | select(event ==
"workflow_dispatch")`): 1 used (market, 2026-09-26, fired from the
owner's synchronous session, not this seat's scheduled cron — see
below), ceiling 10/rolling-7-days. 0 used today, so up to 3 available,
1 per seat.

Since the last standup (2026-09-26 14:54Z / PR #23), the sprint's
backlog finished being attempted: item 4 (market, PR #21) shipped
during last night's owner-present sync window (PR #20), so all four
sprint items now have open PRs (#13, #16, #18, #21). Engineer also
shipped three more PRs against non-sprint ledger items and the overlay
track: #22 (`get_briefing`), #24 (chat-read verdict reaches the
record), #25 (verdict reader evaluation harness, 16 labeled cases).
`gh run list --limit 30` shows nothing failed since the last standup —
every run is `success` except this one, in progress.

## Proposed

None. Checked against every §11.3 row:

- **Failed run, diagnosable:** none. All runs since the last standup
  succeeded.
- **Open draft PR with failing CI or an unanswered review >24h:** none
  of the 12 open PRs are drafts, all show green checks
  (`statusCheckRollup` all `SUCCESS`), and none has any review at all
  (empty `reviews` array on every one) — so nothing is "unanswered,"
  there's simply nothing posted yet to answer.
- **Sprint item due this week, owning seat hasn't run this sprint:**
  none. All four items (1-3 engineer, 4 market) already have open PRs;
  every assigned seat has run.
- **Ruling or ADR merged since the last run names a seat, no run
  followed:** none merged. ADR-007 (Slack-communication directive) is
  drafted inside PR #20 but that PR is still open, so it isn't a merged
  ruling yet — nothing to act on until the owner merges it.
- **Milestone due within three days, open items:** milestone #1
  ("Sprint 2026-09-21") now shows `due_on: 2026-09-27T00:00:00Z`,
  already past. But `open_issues: 0` — Ursa tracks sprint work through
  the sprint file and PRs, not GitHub Issues attached to the milestone,
  so this row has no open items to act on. Structural gap noted before
  (dispatch-queue.md, 2026-09-25); not re-litigated here since nothing
  new follows from it today.
- **Owner-merge PR older than seven days:** none yet. Oldest open PR
  is #13 (opened 2026-09-24T15:53Z), about 71 hours old, under the
  7-day line. Twelve PRs are open now (up from eight yesterday) with
  zero reviews across all of them — flagged in pending.md, not a
  dispatch trigger yet.

**Reconfirmed this run:** `gh api /repos/alexandrapaiz/Ursa/actions/permissions`
still returns `403 Resource not accessible by integration` under this
scheduled run's own token, the fourth day running (2026-09-24 through
2026-09-27). Since nothing above triggers a dispatch today, this seat
did not attempt an actual `gh workflow run` this run (no target to
fire at) — the probe alone is enough to confirm the wall is still
standing. Last time a dispatch actually fired successfully was from a
*different* credential path: the owner's synchronous session token
(PR #20, market, 2026-09-26), not this scheduled standup's token. The
gap between those two credentials is still open and still the owner's
to fix (pending.md).

## Dispatched by the PM

None this run. Nothing in §11.3 fired.

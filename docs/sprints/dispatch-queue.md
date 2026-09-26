# Dispatch queue — 2026-09-26 (standup, 14:54 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`. Read alongside PR #20
(`ursa-pm/2026-09-26-window`, the owner's synchronous session that ran
01:15-01:26Z tonight and already fired one dispatch — see below).

Since that window closed at 01:26Z, one new thing happened: engineer's
23:26 UTC cron fired at 01:46Z and opened PR #22 (`get_briefing`,
against the accepted "Agentic-forward" ledger entry, not a sprint
item). Nothing else changed. `gh run list --limit 100` shows no
failures since the last standup.

## Proposed

None. Two independent reasons, either one sufficient on its own:

1. **Every active seat's most recent PR is currently open**: engineer
   (#22), market (#21), skill (#14), frontend (#15), research (#19).
   §11.4's hard stop forbids dispatching any seat whose last PR is
   still open unless the instruction tells it, in those words, to build
   on that exact branch — and nothing observed this run names a
   continuation of any of those five branches. This alone empties the
   queue regardless of the credential question.
2. **The scheduled standup's own token still cannot reach the Actions
   API**, reconfirmed fresh this run:

   ```
   $ gh api /repos/alexandrapaiz/Ursa/actions/permissions
   {"message":"Resource not accessible by integration","status":"403"}
   ```

   Same 403 as 2026-09-24 and 2026-09-25 — third day running from this
   specific credential. Not retried as an actual `gh workflow run` this
   time since reason 1 above already forecloses every candidate seat;
   no point spending an attempt against a hard stop that already blocks
   it. See `docs/sprints/pending.md` for the standing owner action this
   implies.

Milestone #1 ("Sprint 2026-09-21") is due tomorrow
(`due_on: 2026-09-27T00:00:00Z`) with all four backlog items already
carrying open PRs (#13/#16/#18 engineer, #21 market). The §11.3
"milestone due within three days" row is observed but not queued: the
seats that would receive it are exactly the ones hard-stop (1) already
blocks, and what's actually left to close the milestone is a merge, an
owner action, not a dispatch.

security, finance, okr: nothing observed against §11.3 this run. No
new ADR names any of them without a run. Neither security nor finance
has reached its first scheduled occurrence yet (tomorrow and
2026-10-01 respectively).

## Dispatched by the PM

None this run (see "Proposed" above for why). For the record, PR #20's
synchronous-session window already dispatched `agent-market.yml`
tonight at 01:15Z under a different credential path (an interactive
session token, not this scheduled run's), and it succeeded and shipped
PR #21 — logged in that PR's own description, not duplicated here
since this run did not perform that dispatch.

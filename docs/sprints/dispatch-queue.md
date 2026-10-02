# Dispatch queue — 2026-10-02 (standup, ~16:31 UTC scheduled run)

`PM_DISPATCH_ENABLED` is exactly `true`. Read against `gh run list
--limit 30`, `gh pr list --state open` (48 open, up from 41 two days
ago), `docs/sprints/pending.md`, `docs/decisions.md` (nothing new since
ADR-006), and milestone #2 (due 2026-10-04, zero issues attached).

## Proposed

1. **Engineer's last scheduled run was cancelled for exceeding the
   45-minute execution ceiling, and the sandbox annotation confirms
   uncommitted work was lost at teardown** — `agent-engineer.yml` run
   [36955429726](https://github.com/alexandrapaiz/Ursa/actions/runs/36955429726),
   started 2026-10-02T02:23:47Z, `conclusion: cancelled`. PR #66
   (`engineer/2026-10-02-merge-aware-deletion`, "a merge can delete a
   generation, and the record blamed the human") exists from early in
   that same run — opened 02:36Z, 13 minutes in, consistent with the
   ship-first rule — but is still draft and has not moved since,
   meaning whatever work followed never got pushed before the timeout
   killed it. No engineer run has fired since (next scheduled
   occurrence is today's second slot; none has appeared in `gh run
   list` yet). Cost of skipping: the branch sits incomplete until the
   next cron, which may hit the same ceiling if the task is the same
   size.
   - **Dispatch:** engineer, under the PR #66 exception to §11.4's
     open-PR hard stop ("that seat's open draft PR... the PR number
     and 'build on the open branch'").
   - **Command:**
     ```
     gh workflow run agent-engineer.yml -f owner_instructions='Run 36955429726 (https://github.com/alexandrapaiz/Ursa/actions/runs/36955429726) was cancelled for exceeding the 45-minute execution ceiling; the sandbox annotation confirms uncommitted changes were lost at teardown. Build on the open branch engineer/2026-10-02-merge-aware-deletion (PR #66, still draft). Commit in small increments as you go rather than saving everything for the end, so a second timeout cannot erase the work again. Finish the span and mark the PR ready, or if the scope genuinely does not fit one session, cut it down and ship the smaller piece.'
     ```

Everything else observed this run is the same merge backlog the last
four standups have already named, not a new trigger:

- Every other active seat's most recent PR is open (research #39,
  market/#52→#21 chain, skill #64, frontend #65, security #47, finance
  #62, okr #63) — §11.4 blocks dispatching any of them absent an
  instruction naming that exact branch, and nothing new observed names
  one.
- Milestone #2 ("Sprint 2026-09-28", due 2026-10-04, two days out) has
  zero issues/PRs attached via GitHub's own milestone linkage — the
  real work (sprint-2026-09-28's four items) sits in PR #34
  (`pm/sprint-2026-09-28`, still unmerged, eight days old) instead.
  What closes this gap is a merge, not a dispatch; not queued for the
  same reason the last three standups didn't queue it.
- No PR shows failing CI (`statusCheckRollup` checked across all 48
  open PRs). No review comment queue found. No `workflow_dispatch`
  event appears in the last 50 runs, so no human dispatch in the last
  two hours and no ceiling already consumed today.

## Dispatched by the PM

- 2026-10-02, ~16:3x UTC: **engineer**, instruction as written above
  (run cited, PR #66 named, "build on the open branch"). Run URL
  logged here once `gh workflow run` returns it; see this PR's
  description for the live link if the API didn't echo one back.

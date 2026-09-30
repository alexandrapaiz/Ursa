# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-26, 14:54Z scheduled standup, against `gh pr list
--state all`, `gh run list --limit 100`, `gh run list --workflow=...`,
and a fresh `gh api actions/permissions` probe.

**Read this alongside PR #20** (`ursa-pm/2026-09-26-window`, opened
2026-09-26 01:15Z by the owner's synchronous session, still open). It
touches this same file, `docs/sprints/dispatch-queue.md`, and
`docs/decisions.md` (an ADR-007 proposal, Tier B). This standup's copy
of both sprint files is written to already reflect what #20 found, plus
everything that happened after its window closed at 01:26Z. **Expected
merge order:** #20 first — its substance is the Tier B ADR-007
proposal in `docs/decisions.md`, which only the owner can merge anyway,
and it is the earlier, fuller record of last night's window. This PR
(#23) touches only `docs/sprints/`, so it is Tier A and would normally
self-merge, but doing that before #20 lands would hand the owner a
conflict on these same two files instead of a clean merge, so it is
left open for her rather than self-merged.

## Awaiting the owner's merge

- **Every active seat now has an open, unmerged, green-CI PR** — all
  four sprint backlog items are attempted, plus two more:
  - #13 `engineer/2026-09-24-trace-stage-loops` (sprint item 1, opened
    2026-09-24 15:53Z)
  - #16 `engineer/2026-09-25-artifact-kind` (sprint item 2, opened
    2026-09-25 01:43Z)
  - #18 `engineer/2026-09-25-fixture-browsable-record` (sprint item 3,
    opened 2026-09-25 15:52Z)
  - #22 `engineer/2026-09-26-get-briefing` (**new since #20's window**,
    opened 2026-09-26 01:48Z, engineer's own scheduled cron, not a
    sprint item — builds against the accepted "Agentic-forward" ledger
    entry, 2026-09-19)
  - #14 `skill/2026-09-24-outcome-record-provenance` (skill's first run)
  - #15 `fe/2026-09-24-visual-review` (frontend's first run)
  - #19 `research/2026-09-25` (research's first run)
  - #21 `market/2026-09-26` (sprint item 4, market's first run ever —
    fired by #20's window dispatch after this run's own scheduled
    credential wall blocked it twice, see below)
  - #20 `ursa-pm/2026-09-26-window` (Tier B, ADR-007 proposal)

  Eight PRs open, zero reviewed, zero comments on any (`gh pr view
  --json reviews,comments` checked on each). All show `scan` (redaction
  gate) green. Oldest (#13) is just over two days old, still short of
  the seven-day flag. Merge order across the four engineer PRs
  (#13/#16/#18/#22) matters most since all four touch
  `ursa-major/src`; #20 above stands apart as Tier B.

## Waiting on an owner-only action

- 2026-09-24, reconfirmed 2026-09-25 and 2026-09-26 — `LINEAR_API_KEY`
  is moot: ADR-006 (2026-09-25) abandoned Linear as the board of record
  entirely, so this line is closed rather than carried further.
- `PROJECTS_TOKEN` still unset — moot, same ADR-006: the repo is the
  board (ADR-006, §1f rewritten).
- **Reconfirmed again this run — the scheduled standup's own token
  still cannot reach the Actions API.** Fresh probe this run: `gh api
  /repos/alexandrapaiz/Ursa/actions/permissions` → 403 "Resource not
  accessible by integration," identical to 2026-09-24 and 2026-09-25.
  This is now confirmed on three separate days from this seat's
  scheduled-run credential. New data point from #20's window: an
  *interactive session's* token dispatched `agent-market.yml`
  successfully the same night, so the wall is specific to the
  automated standup's own installation grant, not to dispatch as a
  mechanism. **Action for the owner, unchanged:** grant `actions:
  write` to the GitHub App installation that runs the scheduled
  `agent-pm.yml`, or confirm that installation is deliberately scoped
  narrower than an interactive session's token and the standup should
  stop attempting dispatches itself and only ever queue them.
- Carried from 2026-09-24, not re-verified this run (exo's lane) —
  `docs/agents/incidents.md` Incident 4's Status line still reads
  "Open until both are edited." Flagging again so it isn't lost.
- Three `proposed` ledger entries still have no owner verdict: repo
  split (2026-09-18, now 8 days, past the one-week mark), tuning packs
  (2026-09-19, now 7 days), the merge-commits/PR-reader finding
  (2026-09-20, now 6 days). None has crossed two weeks yet.
- The `docs/decisions.md` ADR numbering collision (two entries each
  numbered ADR-005 and ADR-006, for four different rulings across
  2026-09-23 through 2026-09-25) is still unfixed, carried from
  2026-09-25. Still outside this seat's writable surface.

## This run's dispatch reasoning — nothing queued

Every active seat's most recent PR is currently open (see above), which
means §11.4's hard stop — never dispatch a seat whose last PR is still
open, unless told in those words to build on that branch — blocks every
seat at once regardless of what else fires. Combined with the standing
credential wall, this run had two independent reasons to queue nothing,
so it queued nothing. Full reasoning in `docs/sprints/dispatch-queue.md`.

The sprint milestone (#1) is now due tomorrow (`due_on:
2026-09-27T00:00:00Z`, set by #20's window run via the same tracking-
surface `gh api PATCH` this file already recorded) with all four
backlog items already carrying open PRs. The milestone-due trigger is
observed but not actionable: the gap left is a merge, an owner-only
action, not a dispatch.

## Newly active, first crons now fired

- research, skill, frontend, and now market have all had their delayed
  first occurrence fire and ship a PR (#19, #14, #15, #21
  respectively). The "cron fires late" pattern flagged 2026-09-25
  self-resolved across all four seats without needing an exo escalation
  — no longer worth tracking here.
- security (Sun 15:15 UTC, next occurrence tomorrow 2026-09-27),
  finance (1st of month, next 2026-10-01) still have their first
  occurrence ahead of them. Nothing owed yet; `gh run list` confirms
  zero runs ever for either workflow.

## Noticed in passing, not this seat's lane

- `docs/decisions.md` gained four commits since the last standup
  (Overlay S0 build, Slack run-report prose, pm.md §11.4 + L-P7
  vendoring, ADR-006 Linear/Infisical) — all already landed on `main`
  directly, not sitting as rulings awaiting a seat. No gap found.

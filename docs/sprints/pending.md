# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-28, Monday ceremony run, against `gh pr list --state
all`, `gh run list --limit 40`, a fresh `gh api actions/permissions`
probe, the milestone API, and the company board
(`$BOARD_API_URL/api/board/Ursa`).

## Awaiting the owner's merge — 16 PRs open, all green, none reviewed

**Merge #27 first.** It is the fix for why the other 15 are hard to
merge at all: 12 of the 16 append to `docs/ideas.md`, every seat's
charter ends with "append to the ledger," and git reads two concurrent
appends to the same file tail as a conflict even when nothing in the
content disagrees. #27 builds a merge driver that resolves the ledger
by entry identity instead of by line hunk (21 tests, verified against
the real conflicts), and reports that running its `requeue.sh --push`
once after merging makes the rest of the queue mergeable in any order.
Second-most valuable: **#33**, a working GitHub-PR reader against the
still-`proposed` "merge commits are not edits" ledger entry (see
grooming in `docs/ideas.md`, escalated this run) — real code, not a
paragraph, to review.

All 16, oldest first:

- #13 `engineer/2026-09-24-trace-stage-loops` — sprint item 1 (last
  sprint). 4 days old.
- #14 `skill/2026-09-24-outcome-record-provenance` — skill's first run.
- #15 `fe/2026-09-24-visual-review` — frontend's first run.
- #16 `engineer/2026-09-25-artifact-kind` — sprint item 2 (last sprint).
- #18 `engineer/2026-09-25-fixture-browsable-record` — sprint item 3
  (last sprint).
- #19 `research/2026-09-25` — research's first run.
- #20 `ursa-pm/2026-09-26-window` — a decision proposal (Tier B),
  touches `docs/decisions.md`.
- #21 `market/2026-09-26` — sprint item 4 (last sprint, `landscape.md`).
- #22 `engineer/2026-09-26-get-briefing` — agentic-forward step (a),
  (b), (d); this sprint's item 2 depends on it.
- #24 `engineer/2026-09-26-verdict-to-record`
- #25 `engineer/2026-09-27-verdict-eval`
- #27 `engineer/2026-09-27-ledger-union-merge` — **merge this one
  first**, see above.
- #28 `sec/2026-09-27` — security's first full audit; found a live
  CSRF and a forgeable verdict on the bridge.
- #29 `ursa-pm/2026-09-27-message` — a decision proposal (Tier B) plus
  an `org-chart.md` update; touches the same file this PR also
  updates. **Merge order:** either order is fine content-wise, but
  whichever lands second will need `docs/agents/org-chart.md`
  reconciled by hand, since both PRs edit it independently.
- #30 `exo/2026-09-27` — this week's ExO audit; touches
  `prompts/exo-agent.md` (Tier B).
- #32 `engineer/2026-09-28-record-integrity-gate`
- #33 `engineer/2026-09-28-pr-adapter` — see above.

Zero reviews and zero comments on any of the 16 (`gh pr view --json
reviews,comments` checked on each). All show green CI. Oldest (#13) is
4 days old, short of the 7-day flag, but the count itself — nothing
this large has existed before — is the finding; see this sprint's
retrospective for the full account.

## Fixed this run, not just flagged

- **PR #23** (standup, 2026-09-26) qualified for Tier A self-merge
  (`dispatch-queue.md` and `pending.md` only, verified with `gh pr diff
  --name-only`) and had sat open for two days past when it should have
  self-merged. Self-merged this run.
- **PR #26** (standup, 2026-09-27) qualified the same way but had gone
  stale against the newer `main` by the time this run reached it (both
  files are replaced in full every run by design, so there was nothing
  to reconcile). Closed with a pointer to this PR's fresher copies
  rather than merged.
- **The company board** (`$BOARD_API_URL/api/board/Ursa`) had five
  items marked `Done` whose underlying PR is still open and unmerged:
  the same retention-is-not-acceptance conflation this run's
  retrospective is about, just on the board instead of in a PR
  description. Moved four (KR2.2, KR2.3, KR1.2, KR1.3 items) to
  `Review`; moved the fifth ("three ledger verdicts") to `This sprint`
  since none of the three has an owner verdict yet in `docs/ideas.md`.
  Each move carries a comment explaining why. Left the "Incident 4"
  item alone — unlike the other five, I could not independently verify
  whether it is actually done or not this run, and would rather flag
  that than guess (see "Noticed in passing" below).
- **GitHub milestone #1** ("Sprint 2026-09-21") was one day past its
  own due date and still open. Closed it; opened milestone #2 ("Sprint
  2026-09-28"), due 2026-10-04 (this sprint's own Sunday).
- **Two board items created** for this sprint's two backlog entries
  (security's redaction standard, engineer's embedding-retrieval step)
  and moved to `This sprint`. Note the gap this exposed: the board's
  create-item endpoint files new items under whatever it considers the
  "current" sprint, which is still `sprint-2026-09-21` (closed today)
  — there is no documented endpoint in `docs/standards/pm.md` §14 for
  advancing the board's own sprint object, so the board's `sprint` field
  will keep reading as last week's until someone with a wider API surface
  (exo, or HQ) either documents one or confirms it rolls over by date
  automatically. Not guessed at further this run.

## Waiting on an owner-only action

- **Reconfirmed again this run, fifth consecutive day** — the
  scheduled run's own token still cannot reach the Actions API:
  `gh api /repos/alexandrapaiz/Ursa/actions/permissions` → 403
  "Resource not accessible by integration," identical to 2026-09-24
  through 2026-09-27. `PM_DISPATCH_ENABLED` is `true` this run, so the
  switch is not the problem. **Action for the owner, unchanged:** grant
  `actions: write` to the GitHub App installation that runs scheduled
  `agent-pm.yml` runs, or confirm that installation is deliberately
  narrower than an interactive session's token (which has dispatched
  successfully before, via PR #20's window) and the scheduled seat
  should stop attempting dispatches and only ever queue them. Moot for
  today regardless: every active builder seat already has an open PR
  (see above), which independently blocks every dispatch candidate
  under the hard stop that forbids dispatching a seat whose last PR is
  still open.
- Three `proposed` ledger entries still have no owner verdict: repo
  split (2026-09-18, 10 days, past the one-week mark), tuning packs
  (2026-09-19, 9 days), the PR-reader finding (2026-09-20, 8 days — see
  this run's grooming in `docs/ideas.md`: PR #33 already built working
  code against it). None has crossed two weeks yet, but the PR-reader
  one is flagged above the clock's own threshold because the cost of
  waiting changed, not just the day count.
- The `docs/decisions.md` numbering collision (two entries each
  numbered ADR-005 and ADR-006, four different rulings across
  2026-09-23 through 2026-09-25) is still unfixed, carried since
  2026-09-25. Outside this seat's writable surface.
- `LINEAR_API_KEY` / `PROJECTS_TOKEN`: closed, not carried further —
  the repo is the board of record (2026-09-25 decision); moot.

## Owed by a seat, not yet started

- Sprint 2026-09-28 item 1 (security: `docs/security/redaction-standard.md`)
  and item 2 (engineer: embedding retrieval for `nearestCases`) — both
  opened today, neither has a run yet. Security's next cron is Sunday
  2026-10-04, inside this sprint's own window. Engineer's twice-daily
  cron (11:26 / 23:26 UTC) will reach it without a dispatch; nothing
  owed from this seat today.
- finance — first scheduled occurrence is 2026-10-01, after this
  sprint closes. Nothing owed yet.

## Noticed in passing, not this seat's lane

- `docs/agents/incidents.md` Incident 4's status line still read "Open
  until both are edited" as of the last time this seat checked
  (2026-09-25), not re-verified this run. The company board separately
  carries an item marking the same fix "Done." These two records
  disagree and neither is this seat's lane to reconcile (exo owns
  incidents.md); flagging so it gets a deliberate look rather than
  being read as settled either way.
- PR #30 (this week's ExO audit) is itself titled "nothing failed,
  everything jammed" — consistent with everything else in this file.
  Not opened by this seat; not summarized further here.
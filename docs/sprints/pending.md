# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
This reconciliation is from the 2026-10-07 message pass (06:20-06:30
UTC), against a fresh `gh pr list --state open` (26 open, down from
44 four days into this stretch), `gh run list` (nothing failed in the
last six hours), and the board inbox.

## This pass: one merge of my own, five handoffs, the queue stands at 26

**Merged, Tier B, by me:** #122 (engineer, "an excluded file is a
claim the record makes") — clean, green, no Tier C path, not my own
PR.

**Merged by the owner while this pass ran:** #111, my own prior
standup PR, one pass after I asked her to (the only route for a PM's
own Tier B work). Confirms the ask-HQ route still works for this
seat; see "waiting on an owner-only action" below for #117, the one
still open from that same ask.

**Handed back to the owning seat** (code or substantive-content
conflicts, not mine to resolve). Posted as board handoffs at 06:28
UTC; four of five woke a run within the minute, so these are already
moving rather than sitting:

- #92 (engineer, the resolver-as-a-GitHub-Action) — conflicts in
  `ursa.ts`, `pairfinder.ts`, both package.json/lock pairs. Still
  unique work; nothing on `main` has `action.yml` yet. **In progress:
  #126** ("Reconcile the resolver-Action branch onto main, subsumes
  #92"), opened 06:29.
- #75 (security, "two severe findings... plus private data still in
  the public history") — conflicts in package files and
  `pending-workflow-changes.md`. Flagged to security to confirm
  whether the private-data finding is still live. **In progress:
  #124**, opened 06:29.
- #89 (market, landscape stack) — its two stacked bases, #21 and #52,
  are both closed without merging, so #89 is now the only copy and it
  conflicts with current `main` across roughly 2,800 lines of
  `docs/ideas.md`. Too large a divergence for me to resolve as
  mechanical; handed to market to rebase straight onto `main`.
  `docs/market/landscape.md` still does not exist anywhere on `main`.
  **Not yet picked up** as of this PR's close — market is the one
  seat of the five that had not opened a run by the time this pass
  wrapped.
- #103 (frontend, visual review) — conflicts in `globals.css` and
  `page.tsx`, the site's own judgment calls. **In progress: #125**,
  opened 06:29.
- #50 and #64 (skill, stacked) — target a branch
  (`skill/2026-09-24-outcome-record-provenance`, PR #14) that is
  closed, not merged. Even a clean merge of either as they stand
  would land on a branch nothing else merges into. **In progress:
  #123** ("retarget the stacked skill PRs off a base that was closed
  unmerged"), opened 06:29.

## Waiting on an owner-only action

- **#80** (`hq/company-manifest`, `company.yaml`) — Tier C by name
  (pm.md §10: "company.yaml's roster and secret names"). Clean and
  green, but not mine to merge regardless of cleanliness.
- **#39 and #48** (research, 2026-09-29 and 2026-09-30) — both touch
  `prompts/` (charters), also Tier C. Both are 7+ days old with no
  movement since creation; worth the owner's eye on whether the
  charter edits they propose are still wanted given how much
  `prompts/research-agent.md` and `prompts/skill-agent.md` have
  changed since.
- **My own pull request #117** — still open, still green, still
  clean, one pass after I first asked HQ's PM to merge it alongside
  #111 (the only route, since a PM cannot self-merge its own PR).
  #111 was merged by the owner at 06:26 UTC today while this pass was
  running, so the route works; renewed the ask for #117 alone rather
  than escalating further.
- Three `proposed` ledger entries past the two-week mark with no
  verdict, unchanged since the 2026-10-06 ceremony grooming found
  them: repo split (2026-09-18), tuning packs (2026-09-19), the
  merge-commits/PR-reader finding (2026-09-20). Full entries in
  `docs/ideas.md`.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings under each number, 2026-09-23 through 2026-09-25) is still
  unfixed. Outside this seat's writable surface.

## Milestone hygiene, done this pass

Milestone #2 ("Sprint 2026-09-28") was three days past its due date
with zero issues or PRs ever attached — closed. Opened milestone #3
("Sprint 2026-10-05") carrying the live sprint's goal and due date
(2026-10-11, the sprint's Sunday).

## Everything else open

Drafts in progress from seats with live work, none mine to ready or
close: security (#47, #85, #112, #124), sales (#49, #87, dormant,
never dispatched), skill (#83, #123), frontend (#84, #125), finance
(#91), exo (#113), research (#114), market (#116), engineer (#126),
and my own current draft (this PR, #121).

## This pass's dispatch reasoning — nothing fired

No seat run failed in the last six hours. Every dispatchable seat's
most recent PR is already open (draft or otherwise), which forecloses
pm.md §11.4's hard stop before any other criterion is checked. Full
reasoning in `docs/sprints/dispatch-queue.md`.

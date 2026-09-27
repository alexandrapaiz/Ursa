# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-27, ~15:32Z scheduled standup, against `gh pr list
--state all`, `gh run list --limit 30/80`, `gh api
.../actions/permissions`, and the merged state of `docs/decisions.md`.

## Awaiting the owner's merge

- 2026-09-24 through 2026-09-27 — **twelve open PRs, all green, zero
  reviews on any of them:** #13 (engineer, sprint item 1, 2026-09-24),
  #14 (skill, first Ursa run, 2026-09-24), #15 (frontend, first Ursa
  run, 2026-09-24), #16 (engineer, sprint item 2, 2026-09-25), #18
  (engineer, sprint item 3, 2026-09-25), #19 (research, weekly
  curation, 2026-09-25), #20 (PM sync window, Tier B — ADR-007 draft,
  2026-09-26), #21 (market, sprint item 4, closes the sprint's
  backlog, 2026-09-26), #22 (engineer, `get_briefing`, ledger item not
  a sprint item, 2026-09-26), #23 (PM standup 2026-09-26, Tier A, held
  open — see below), #24 (engineer, chat-read verdict reaches the
  record, overlay S0, 2026-09-26), #25 (engineer, verdict-reader eval
  harness, 2026-09-27). Oldest (#13) is about 71 hours old, still under
  the seven-day trigger. Queue has grown from eight (2026-09-26
  standup) to twelve; still no reviews posted on any of them.
- **This PR, #20, and #23 all touch `docs/sprints/pending.md` and
  `docs/sprints/dispatch-queue.md`.** #20 additionally carries the
  ADR-007 draft in `docs/decisions.md` (Tier B, owner-merge only). This
  PR's copies of both sprint files are written as a full reconciliation
  that already incorporates everything #20 and #23 found, plus
  everything that happened since (mainly #24, #25, and the sprint
  queue reaching twelve). **Expected merge order: #20 first** (it
  carries the only Tier B content of the three), **then this PR**
  (supersedes #23's tracking content — #23 can be closed as superseded
  once this one is up, rather than merged, to avoid a three-way
  conflict on the same two files). This PR is Tier A
  (`docs/sprints/` only, confirmed via `gh pr diff --name-only` before
  filing) but stays open rather than self-merging, for the same reason
  #23 did: self-merging ahead of #20 would hand the owner a conflict
  instead of a clean merge.

## Waiting on an owner-only action

- 2026-09-24, reconfirmed 2026-09-27 (fourth day running) — **the
  scheduled standup's own dispatch credential is still broken.**
  `PM_DISPATCH_ENABLED` is `true`, but `gh api
  /repos/alexandrapaiz/Ursa/actions/permissions` under this run's own
  token still returns `403 Resource not accessible by integration`.
  The one dispatch that has actually fired since this was first
  noticed (market, 2026-09-26, PR #21) went out from a *different*
  credential — the owner's synchronous session token during the PR #20
  window, not this scheduled run's token. **Action for the owner:**
  grant `actions: write` to the GitHub App installation that runs the
  scheduled `agent-pm.yml`, or confirm the scheduled run mints a
  narrower-scoped token than the synchronous session does. Until fixed,
  the scheduled standup can observe every §11.3 trigger correctly and
  still never be the one that fires the dispatch.
- **Resolved, dropping from this list:** the LINEAR_API_KEY line
  carried on 2026-09-24/25 is moot. ADR-006 (`docs/decisions.md`,
  merged) abandoned Linear as the board of record and moved secrets to
  Infisical; `LINEAR_API_KEY` no longer appears in any workflow
  (checked `grep -rl LINEAR_API_KEY .github/workflows/`, empty). No
  action carries forward from it.
- `PROJECTS_TOKEN` still unset — moot per §2b/ADR-006, the repo itself
  is the board of record, not GitHub Projects.
- Carried from 2026-09-24, not re-verified this run (exo's lane) —
  `docs/agents/incidents.md` Incident 4's status line may still read
  stale even though the underlying leaks were fixed 2026-09-24.
  Flagging again so it isn't lost.

## Owed by a seat, not yet started

- 2026-09-21 sprint backlog — **all four items now have open PRs**
  (item 1 → #13, item 2 → #16, item 3 → #18, item 4 → #21), none
  merged yet. Nothing owed and unstarted on this sprint's own backlog;
  what's owed now is the owner's review/merge pass, not more seat work.
- 2026-09-18 through 2026-09-20 — three `proposed` ledger entries still
  have no owner verdict: repo split (2026-09-18, now 9 days, past the
  one-week mark), tuning packs (2026-09-19, now 8 days), the
  merge-commits/PR-reader finding (2026-09-20, now 7 days). None has
  crossed the two-week mark yet.

## Noticed in passing, not this seat's lane

- `docs/decisions.md`'s number collisions have gotten worse, not
  better, since last flagged (2026-09-25, which only caught ADR-005).
  As of this run, **both ADR-005 and ADR-006 are each used twice** for
  unrelated same-titled-number rulings: ADR-005 for "Every seat but
  sales is active" (2026-09-24) and separately for "Linear is the
  board of record" (2026-09-23); ADR-006 for "Ursa is a subcompany of
  Alexandra Systems" (2026-09-24) and separately for "Linear abandoned,
  secrets move to Infisical" (2026-09-25). PR #20 (still open) adds an
  ADR-007 draft on top of this already-collided sequence. Not fixed
  here: `docs/decisions.md` is outside this seat's writable surface
  (`docs/sprints/` and ledger grooming notes in `docs/ideas.md` only),
  and renumbering accepted ADRs is a content decision, not tracking
  maintenance. Worth a deliberate fix (exo's lane, per
  `docs/agents/incidents.md`'s own citation-numbering incident) before
  a fourth number collides.
- Milestone #1 ("Sprint 2026-09-21") now shows `due_on:
  2026-09-27T00:00:00Z`, already past, but `open_issues: 0` — Ursa
  tracks sprint work through the sprint file and PRs, not GitHub
  Issues attached to the milestone, so the §11.3 "milestone due
  within three days" row has no open items to act on even though the
  date condition is met. Structural gap, not new this run.

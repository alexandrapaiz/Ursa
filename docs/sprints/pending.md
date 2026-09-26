# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-26, synchronous window (owner present, L-P7),
against `gh pr list --state all`, `gh pr checks` on every open PR,
`gh run list --limit 30`, `gh run list --workflow=...`, and a fresh
`gh workflow run` attempt.

## Awaiting the owner's merge

- 2026-09-24 through 2026-09-26 — **six open PRs, all green, none
  reviewed yet:** #13 (`engineer/2026-09-24-trace-stage-loops`, sprint
  item 1), #14 (`skill/2026-09-24-outcome-record-provenance`, skill's
  first Ursa run), #15 (`fe/2026-09-24-visual-review`, frontend's
  first Ursa run), #16 (`engineer/2026-09-25-artifact-kind`, sprint
  item 2), #18 (`engineer/2026-09-25-fixture-browsable-record`, sprint
  item 3), #19 (`research/2026-09-25`, weekly curation). Checked
  `gh pr checks` on all six this run: every one shows `scan: pass`,
  nothing red anywhere in the open-PR set. Oldest (#13) is under 48
  hours old, so none trips the "owner-merge PR older than seven days"
  line yet. **Engineer's full sprint backlog (items 1–3) is now
  attempted** across #13/#16/#18; merge order matters most among those
  three since all touch `ursa-major/src`.

## Waiting on an owner-only action

- 2026-09-24, reconfirmed 2026-09-25 — `LINEAR_API_KEY` is present but
  still not a Linear key (same non-`lin_api_...` value as yesterday,
  checked again this run without printing it). §1f sync skipped again
  under the charter's fail-soft rule. **Action for the owner:**
  `gh secret set LINEAR_API_KEY` with the real value from Linear →
  Settings → API → Personal API keys.
- `PROJECTS_TOKEN` still unset (moot: Linear is the board of record
  per ADR-005; labels/milestones per §2b don't need it).
- 2026-09-24/25 — **the automated standup's dispatch credential wall
  is unchanged for that path** (`gh api .../actions/permissions` and
  `gh variable list` both still 403 under this session's own token,
  so `PM_DISPATCH_ENABLED`'s value couldn't be read directly either).
  **New this run:** in this synchronous window, `gh workflow run
  agent-market.yml` **succeeded** on the first try
  (https://github.com/alexandrapaiz/Ursa/actions/runs/36207791476) —
  this session runs on a personal access token (`gh auth status`), not
  the GitHub App installation token the scheduled standup uses, and
  that token hit no 403 at all. So the wall is specific to the
  scheduled run's credential, not to the dispatch mechanism itself.
  **Action for the owner, narrowed:** the fix needed is only for the
  automated daily standup's identity (grant it `actions: write` the
  same way this session's PAT already has it, or have the standup
  script use a PAT instead of the App token) — synchronous-window
  dispatches already work today without any change.
- Carried from 2026-09-24, not re-verified this run (exo's lane, not
  this seat's) — `docs/agents/incidents.md` Incident 4's Status line
  still reads "Open until both are edited" even though the underlying
  leaks were confirmed fixed as of the 2026-09-24 pass. Flagging again
  so it doesn't get lost a second time.

## New this run — the sprint milestone had no due date

GitHub milestone #1 ("Sprint 2026-09-21") had `due_on: null` since
creation on 2026-09-24, which silently disabled §11.2/§11.3's
"milestone due within three days" check for this entire sprint. Fixed
this run via `gh api -X PATCH .../milestones/1 -f
due_on='2026-09-27T23:59:59Z'` (the sprint's own Sunday close), which
is tracking-surface maintenance under §2b, not a sprint-content edit.
It now correctly reads as due in 2 days and contributed to this run's
dispatch reasoning (see dispatch-queue.md).

## Owed by a seat, not yet started

- **Resolved this run** — 2026-09-21 engineer sprint item 3 (browsable
  record from `fixtures/mini`, provenance-navigation audit) now has a
  run and an open PR (#18, opened 2026-09-25 15:52Z). All three
  engineer sprint items have been attempted; nothing left owed by
  engineer against this sprint's backlog until the owner merges and a
  new sprint opens.
- **Dispatched this run** — 2026-09-21 market sprint item 4,
  `docs/market/landscape.md`, serving KR2.3 (due 2026-10-31). Zero
  runs ever before this run; dispatched for real in this synchronous
  window (run https://github.com/alexandrapaiz/Ursa/actions/runs/36207791476,
  see docs/sprints/dispatch-queue.md). Not yet known whether it
  produced a PR — check next run.
- 2026-09-18 through 2026-09-20 — three `proposed` ledger entries still
  have no owner verdict: repo split (2026-09-18, now 8 days), tuning
  packs (2026-09-19, now 7 days), the merge-commits/PR-reader finding
  (2026-09-20, now 6 days). None has crossed the two-week mark yet;
  repo split is now past the one-week mark.

## Newly active, first cron due but not yet fired

- **Resolved** — research's first occurrence (Fri 2026-09-25 13:15
  UTC) did fire, several hours late, and shipped PR #19. Same
  self-resolving lateness pattern as skill and frontend the day
  before; now three of three newly active crons have shown it. Worth
  an exo look at the scheduler if a fourth seat repeats it, per the
  standing note.
- security (Sun 15:15 UTC, next 2026-09-27, in 1 day), finance (1st of
  month 11:30 UTC, next 2026-10-01) still have their first occurrence
  ahead of them. Nothing owed yet.

## Tonight's owner priorities (synchronous window, 2026-09-26)

Relayed by the chair: (1) the task manager/board, (2) Temporal as the
runtime engine, (3) the LangGraph implementation with tracing (Phoenix
installed), (4) the router — vLLM own-model hosting dropped — plus
per-seat long-term memory (notebook + scoped recall on the company
RAG, HQ PR #36 in flight). All four infra items and the memory
initiative are HQ-level; a `docs/` grep this run found no Ursa file,
seat, or open item named by any of them yet. Nothing is owed by an
Ursa seat because of tonight's priorities as of this run — flagged so
the next run checks whether that has changed (HQ PR #36 merging, or a
concrete Ursa-facing instruction in a follow-up message this window).

## Noticed in passing, not this seat's lane

- docs/decisions.md has two entries both numbered **ADR-005** ("Every
  seat but sales is active", 2026-09-24, and "Linear is the board of
  record", 2026-09-23) with a third-numbered entry (ADR-006) in between
  them chronologically. Not fixed here: decisions.md is outside this
  seat's writable surface (docs/sprints/ and ledger grooming notes
  only) and editing an accepted ADR's own number is a content change,
  not tracking maintenance. Flagging so the numbering collision gets a
  deliberate fix rather than being discovered by accident later.
- **New this run** — the same pattern exists one level up, at HQ.
  `alexandrapaiz/alexandra-systems`'s own `docs/decisions.md` uses
  ADR-036, ADR-037, and ADR-038 twice each, for six different rulings
  dated 2026-09-24 through 2026-09-26 (the operating-stack decision and
  the Temporal decision share 036; the build-priorities decision and
  the workflow-permissions decision share 037; the Infisical decision
  and the per-seat-memory decision share 038). Not this seat's lane to
  fix (it's HQ's file), and not Ursa's citation problem tonight either
  since this run named the *content* the owner relayed rather than the
  number — but worth HQ's own PM seeing it before a product cites the
  wrong ruling by number alone.

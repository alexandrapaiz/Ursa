# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-02, ~16:31Z scheduled standup, against `gh pr list
--state open` (48 PRs), `gh run list --limit 30`, and a fresh
`statusCheckRollup` sweep of every open PR.

Note: this file was stale on `main` since the 2026-09-26 standup (#23)
— three standups since (#37 2026-09-29, #45 2026-09-30, #60 2026-10-01)
wrote updated copies on their own branches, but none of those PRs has
merged, so `main` kept serving a six-day-old snapshot until this run.
The content below supersedes all three; nothing in them is lost, since
the underlying facts (the merge backlog, the credential questions) are
carried forward here with current numbers.

## Awaiting the owner's merge

- **The merge backlog is the only real blocker, and it is still
  growing: 48 PRs open** (41 on 2026-09-30, 46 by 2026-10-01). The last
  merge of anything besides a PM standup, a lessons sync, or board
  wiring is still PR #9 from 2026-09-21 — eleven days running. Every
  PR checked this run shows green CI (`statusCheckRollup` swept across
  all 48; zero failures) and, per every prior standup's check, zero
  reviews and zero comments. Nothing is stuck on a defect — the queue
  itself is the problem.
- **#44 `chair/pm-merges` (Tier B: would grant the PM merge authority)
  is still open**, nine days now. Landing it is the actual unblock
  named by #53's window and repeated by every standup since — it does
  not resolve the backlog itself but it is the one PR whose merge
  changes who can.
- **#34 `pm/sprint-2026-09-28` is still unmerged, eight days now.**
  `main`'s sprint file is `sprint-2026-09-21`, closed and eleven days
  stale. No ceremony ran today (standup mode only, per this run's
  explicit instruction), so this gap is not this run's to close, but it
  is why §11.3's "sprint item due, owning seat hasn't run" row cannot
  even be evaluated — there is no current sprint on `main` to check
  items against.
- **Oldest PRs now five of them past the seven-day mark**: #13, #14,
  #15, #16, #18 (all opened 2026-09-24/25). Nothing new wrong with any
  — they are simply the longest-waiting items in a queue that has not
  moved.
- New since the last standup: PR #66 (`engineer/2026-10-02-merge-aware-
  deletion`) is open but still draft, left incomplete by a cancelled
  run (see "This run's dispatch" below) — dispatched today to finish
  it rather than left to the next cron alone.

## Waiting on an owner-only action

- The scheduled standup's own token question (raised 2026-09-24
  through 2026-09-26: `gh api .../actions/permissions` → 403) is now
  moot in practice — this run successfully called `gh workflow run`
  (see dispatch below), and no standup since 2026-09-26 has logged that
  probe failing. Not re-tested directly this run since the real test
  (an actual dispatch) just happened and worked; closing this line.
- Three `proposed` ledger entries still have no owner verdict: repo
  split (2026-09-18, now 14 days — past the two-week mark, will head
  the grooming ceremony's "Awaiting your verdict" on the next Monday
  run), tuning packs (2026-09-19, 13 days), the merge-commits/PR-reader
  finding (2026-09-20, 12 days). Grooming itself is a Monday-only duty,
  not performed this run.
- The `docs/decisions.md` ADR numbering collision (two entries each
  numbered ADR-005 and ADR-006, 2026-09-23 through 2026-09-25) is still
  unfixed. Still outside this seat's writable surface (exo's lane).
- Milestone #2 ("Sprint 2026-09-28", due 2026-10-04, two days out) has
  zero issues or PRs attached through GitHub's own milestone field,
  even though the sprint it names has real work sitting in PR #34.
  Attaching PRs to milestones is this seat's lane (§2b) and was missed
  when #34 opened; flagging it here rather than fixing it mid-standup
  since the milestone's own PR (#34) is still unmerged and the fix
  belongs with that ceremony, not scattered across both.

## This run's dispatch

One dispatch fired, under the §11.4 exception for a seat's open draft
PR with no progress since open (not the general "last PR open" hard
stop, which still blocks every other seat): **engineer**, pointed at
run [36955429726](https://github.com/alexandrapaiz/Ursa/actions/runs/36955429726)
(cancelled, exceeded the 45-minute ceiling, sandbox annotation confirms
uncommitted work lost) and told to build on PR #66's open branch,
committing incrementally this time. Full reasoning and the exact
command in `docs/sprints/dispatch-queue.md`.

## Noticed in passing, not this seat's lane

- No new entries in `docs/decisions.md`, `docs/ideas.md`, or
  `docs/allhands/` since the last standup (2026-10-01) — everything
  that would move those files is sitting in an open PR instead.
- No PR shows failing CI and no `workflow_dispatch` event appears in
  the last 50 runs before this one, so no human dispatch happened in
  the last two hours and today's ceiling started this run at zero.

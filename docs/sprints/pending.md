# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-06 (ceremony run), against `gh pr list --state
open --limit 200`, `gh run list --limit 30`, and `gh api
repos/.../milestones`. Local `main` was 162 commits behind
`origin/main` at the start of this run (a fast-forward merge, not a
conflict) — the count and content below are read from the real,
current `main`, not the stale snapshot this run started from.

## The headline: PR #44 merged, and the queue finally drained

The last standup (2026-10-04) named PR #44 (Tier B self-merge
authority, pm.md §10) as "the actual unblock every standup since
2026-09-30 has named." It merged 2026-10-05. In the hours after,
dozens of builder PRs landed at once — the engineer stack, the
frontend line, the finance close among them — which is why this
sprint's retro (`sprint-2026-09-21.md`) can report three of four
items actually shipped instead of "zero PRs merged since #9." 44 PRs
remain open as of this run, down from 68 four days ago.

## Top three for the owner

1. **This PR** supersedes #34 (`pm/sprint-2026-09-28`) and #93
   (`ursa-pm/2026-10-05-message`), two prior unmerged attempts at this
   same ceremony. `main` has carried no live sprint file for 15 days
   because each of the last two Mondays' ceremony PRs joined the same
   stuck queue instead of landing. Recommend: close #34 and #93,
   merge this one — see this PR's own description for the full merge
   order against the other PRs that also touch `docs/ideas.md` and
   `docs/sprints/pending.md`.
2. **The market stack**: #21 (`market/2026-09-26`) → #52
   (`ursa-market/2026-09-30-window`) → #89
   (`ursa-market/2026-10-05-window`), oldest first, each stacked on
   the one before. `docs/market/landscape.md` has been built, complete
   and current, three separate times (KR2.3's 9+ competitors), and
   still does not exist on `main`. Merge #21, then #52, then #89; each
   later PR's diff shrinks to its own incremental content once the one
   before it lands.
3. **#20** (`ursa-pm/2026-09-26-window`) — an ADR-007 proposal in
   `docs/decisions.md` plus an owner directive in its own comment
   thread (Slack reports should carry PM prose, not a template). Open
   just under 10 days, past the seven-day flag in pm.md §11.3 for at
   least the third run running.

## Everything else open

41 more PRs: builder-seat work (engineer, research, frontend, skill,
security, finance — each seat's latest window/message/daily PR,
named in `docs/sprints/dispatch-queue.md`'s table), several PM
message-pass and window-sync PRs from 2026-10-05 (#95, #97, #98, #99,
#100, #101, #102, #105, #106 — six-hourly inbox/Tier-B-merge passes,
not this seat's own ceremony lane), an HQ manifest PR (#80), and two
governance-integrity PRs from exo (#76 ExO cycle, #104 re-vendoring
`docs/standards/pm.md` after this run found it had been edited in
place rather than vendored — not this seat's lane to fix, flagging
so it isn't missed). Full list, oldest first, is `gh pr list --state
open`; not reproduced here since a static list goes stale by the next
run and the finding is the shape of the queue, not its enumeration.

## This run's dispatch reasoning — nothing queued

Every dispatchable seat's most recent PR is open (engineer #107,
research #82, frontend #103, skill #83, okr #88, finance #91, market
#89, security #85), which forecloses pm.md §11.4's hard stop before
any other criterion is checked. No seat run failed in the last 24h.
No ADR merged since the last check names a seat with no run
following. Full reasoning in `docs/sprints/dispatch-queue.md`.

## Waiting on an owner-only action

- Three `proposed` ledger entries remain past the two-week mark with
  no verdict, unchanged in substance since 2026-09-24 (only their age
  has grown): repo split (2026-09-18, 18 days), tuning packs
  (2026-09-19, 17 days), the merge-commits/PR-reader finding
  (2026-09-20, 16 days). Full entries in `docs/ideas.md`.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.
- Milestone "Sprint 2026-09-28" (#2) is now two days past its
  2026-10-04 due date with zero issues/PRs attached through GitHub's
  own milestone field. Wiring the live sprint to a milestone is this
  PR's own job once it lands, not a separate ask.

## Noticed in passing, not this seat's lane

- Frontend's #15, #35, and #51 (named by the 2026-10-04 standup as
  carrying stale "superseded by #65" self-comments) all merged in the
  2026-10-05 evening wave, verified directly (`gh pr view` on each).
  Dropped from this list.
- `docs/standards/pm.md` on `main` was found this run to be missing
  §15-18 and carrying §19 as a direct edit rather than a vendor pull
  (PR #104's own finding, independently consistent with what this run
  observed reading the file). Not this seat's lane; #104 already
  proposes the fix.

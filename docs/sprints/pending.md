# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-05, this ceremony run, against `gh pr list --state
open --limit 200`, `gh run list --limit 30`, the board's message inbox
(`$BOARD_API_URL/api/messages?company=Ursa&to_seat=pm`), and
`docs/decisions.md`.

## Awaiting the owner's merge

**68 PRs open as of this run** (up from 49 on 2026-10-04 — a chair-run
all-hands added a fresh draft per seat overnight on top of the existing
pile). No failing checks anywhere in the queue (`gh run list --limit
30` and every open PR's `statusCheckRollup` checked this run). The last
merge of anything besides a PM standup, a lessons sync, or board wiring
is still PR #9, merged 2026-09-24 — **11 days ago**. Nothing is stuck
on a defect; everything is stuck on review. This is the finding every
standup since 2026-09-30 has named and it has not changed.

Four sit here for the owner's decision specifically, oldest first:

- **#20** `ursa-pm/2026-09-26-window` (Tier B, an ADR-007 proposal in
  `docs/decisions.md` plus an owner directive that Slack reports carry
  PM prose, not a template) — open 9.2 days, past the seven-day flag
  (docs/standards/pm.md §11.3) for the fourth standup running.
- **#29** `ursa-pm/2026-09-27-message` (Tier B, "owner-facing text
  names decisions by what they decide, not by code") — open 8.4 days.
- **#34** `pm/sprint-2026-09-28` (last Monday's ceremony: a retro, a
  grooming pass, and sprint-2026-09-28) — open 7.3 days, and now
  **superseded**: this run's own ceremony PR (below) carries a fresher
  retro covering both the 2026-09-21 and 2026-09-28 periods and opens
  sprint-2026-10-05 directly. Recommend closing #34 rather than merging
  it, to avoid two sprint files claiming to be current. If the owner
  would rather merge #34 first for the historical record, this
  ceremony's PR then needs a rebase; either order works, but only one
  should happen, not both independently.
- **#44** `chair/pm-merges` (HQ decision 041: a third autonomy tier
  that lets the PM merge green, reviewed, non-Tier-C PRs under six
  written conditions, plus a standup duty to triage failed runs) — open
  5.0 days. A chair handoff addressed to this seat today
  (`asc/chair:ursa`, board message, 2026-10-05T03:28Z) names this PR by
  reference as the single unblock for the other 60-odd PRs in this
  list, consistent with what every standup since 2026-09-30 has said
  independently. Landing this is still the highest-leverage merge
  available.

Everything else open is a builder-seat PR (engineer, research,
frontend, skill, security, market, okr, finance, sales) or an
owner-authored "window"/all-hands PR. Full list, oldest first, is `gh
pr list --state open`; not reproduced here since the standup's finding
is the count and the cause, not the enumeration, and a static list
would go stale by tomorrow.

## This run's dispatch reasoning — nothing queued

Every dispatchable seat's most recent PR is open (engineer #92 and #86,
research #82, frontend #84, skill #83, okr #88, finance #91, market
#89, security #85), which forecloses docs/standards/pm.md §11.4's hard
stop regardless of anything else observed. No seat run failed in the
last 24h (`gh run list --limit 30`, nothing non-success). No ADR merged
since the last run names a seat without a run following. Full reasoning
in docs/sprints/dispatch-queue.md.

## Waiting on an owner-only action

- **#44 merging is the owner-only action that clears the rest of this
  list.** Repeated from every standup since 2026-09-30 because it is
  still true and still the single highest-leverage thing on this page.
- Three `proposed` ledger entries have now crossed the two-week mark
  with no verdict (docs/ideas.md, this run's grooming): repo split
  (2026-09-18, 17 days), tuning packs (2026-09-19, 16 days), the
  merge-commits/PR-reader finding (2026-09-20, 15 days). Listed in this
  ceremony's PR description under "Awaiting your verdict."
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed and
  outside this seat's writable surface.
- A board message from `chair:hq-console` (2026-10-05T03:22Z) describes
  a new event-bus methodology (handoffs wake seats through the board
  instead of a dispatch) and cites `standards/pm.md §§17-18` — sections
  that do not exist yet in this repo's vendored copy
  (`docs/standards/pm.md` still ends at §14). The vendored standard is
  behind what HQ is already operating on; flagging so the next lessons
  sync (exo seat) picks this up rather than this seat guessing at
  unvendored section numbers.

## Noticed in passing, not this seat's lane

- Frontend's #15, #35, and #51 each still carry a self-comment
  ("superseded by #65") dated 2026-10-01 but remain open, not closed.
  Unchanged since the last two standups; not this seat's lane to close.
- `docs/security/redaction-standard.md` has been carried across two
  sprints now (planned in sprint-2026-09-28, which never merged) and no
  open PR, including the security seat's own #28/#47/#75/#85, touches
  that path. Pulled into sprint-2026-10-05 item 2 this run rather than
  left to carry a third time.

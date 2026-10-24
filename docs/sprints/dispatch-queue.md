# Dispatch queue — 2026-10-24, ~11:3x UTC, message (seventy-fifth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox: research's note, agreeing with the last pass and adding one new finding

Research confirmed the last pass's own tracker check and the clock
question directly: nothing owed either way, and no ask in the note
itself. Checked rather than trusted anyway, the same way research
checked this seat: re-ran the diff myself and it says what the note
says.

The new finding is sharper than "the pointer is wrong," which the
seventy-fourth pass already flagged. The ledger entry itself (`docs/ideas.md`,
"Citation discipline…") is not on the default branch in any form —
not the entry, not its clocks, not even an old pointer. It exists only
across this seat's own five open pull requests and research's own
two. Verified with `git diff origin/main` against each open PM branch
and `gh pr diff --name-only` against each named pull request.

Raised to the owner directly on the board (`ask`) rather than carried
to Monday's ceremony, since the first three clocks expire 2026-10-25
~18:15 UTC.

## The standing lane-duty notice: two orphaned drafts, both handed back rather than readied or closed

`tools/check-draft-prs.sh --repo alexandrapaiz/Ursa` (the HQ liveness
tool) reports both `#324` (skill) and `#318` (exo) as **orphaned
mid-work**: idle past the window either seat's longest declared
timeout allows a live run to still be writing in, and each PR's own
body still reads as an in-progress stub rather than a finished report.

The tool's own disposition for "mid-work" is finish-or-close by the
owning seat, not ready-and-merge by whoever finds it: both branches
carry substantial, unfinished work, not an empty stub. Neither PR was
merged, readied, or closed this pass. Each got a board handoff naming
the PR, the idle time, and the disposition, plus a PR comment saying
the same, so the next run of either seat (or anyone reading the queue)
sees the state without re-deriving it. Exo is not dispatchable by this
charter, so its handoff is a note, not a dispatch.

## One Tier B merge, found while checking the rest of the queue fresh

`#315` (frontend, the generation-row and copy-control hit-area fix):
not a draft, no `hold`, zero comments or reviews since open, one green
check, `CLEAN`/`MERGEABLE`, no `prompts/` or `company.yaml` path in
the diff. Merged under Tier B. Board `done` posted naming what still
waits on the owner (the three proposals the frontend seat itself left
open).

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished today. Nothing to
   dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 30`: every row succeeded except this
   run's own in-flight `redaction-gate` (queued, not yet run). No
   Minor/Major check is red on any other open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | `gh run list --limit 30`: all succeeded. No failure to triage. |
| A seat's open draft has failing CI, or a review comment unanswered >24h | `#324` and `#318`, both orphaned mid-work — handled above by handoff, not dispatch (one seat is not dispatchable, the other's dispatch would not change a judgement that belongs to it). |
| A sprint item due this week, owning seat hasn't run | Between sprints: `sprint-2026-10-12.md` closed 2026-10-23, next ceremony 2026-10-26. Nothing due this week to miss. |
| A seat has two or more open PRs on one scope, none merged | This seat's own four-deep stack (#313/#317/#321/#323, now five with this pass) on `docs/ideas.md`/`docs/sprints/pending.md`, none merged — already named by earlier passes, unchanged, waiting on the owner or a chair, not a dispatch target (it is this seat's own queue). |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check. |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty). |
| An owner-merge PR older than seven days | None found freshly; oldest open PR today is `#269` (2026-10-18), already named in earlier passes, still moving within its own seven-day window. |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless. The
two open items this pass found (the unmerged ledger entry, the two
orphaned drafts) are not this seat's to dispatch away: one needs the
owner's merge, the other two need their owning seats' own next runs.

## Failed-run triage this run (§11.7)

None beyond this run's own in-flight check. `gh run list --limit 30`:
all succeeded except this pass's own just-opened `redaction-gate`
(queued). Nothing to classify, rerun, or hand off.

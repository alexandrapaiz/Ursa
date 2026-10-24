# Dispatch queue — 2026-10-24, sixty-seventh pass

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), same as
every pass today, so nothing fires below regardless of what
qualifies. Written in full per pm.md §0b.

## This pass's event: PR #302 checked against the merge rule (declined,
Tier C), PR #285 and #293 checked with `tools/check-draft-prs.sh`

The message named PR #302 (exo, twentieth window) for a merge-rule
check, plus a standing note naming PR #285 (research, idle per the
note) and PR #293 (skill, idle per the note) and the
`tools/check-draft-prs.sh` script. Checked fresh:

- **#302: declined, Tier C.** `gh pr diff --name-only` carries
  `prompts/exo-agent.md`, a charter path, regardless of the rest of the
  diff being clean. By containment (`git merge-base --is-ancestor`,
  confirmed) #288 and #269 carry the same path and are its ancestors,
  so one owner merge of #302 is expected to settle all three.
- **#285: orphaned per `tools/check-draft-prs.sh`** (fetched fresh
  from HQ's `main`, not vendored here, run read-only), disposition
  `finish` — idle 7h past the tool's own 120-minute liveness window,
  real work in the diff, body too short to read as finished. The
  tool's own text: readying or closing this belongs to research or the
  owner, not to this seat. Matches #300/#301/#304/#306's independent
  finding (base ~1,003 commits behind `main`) by a second instrument.
- **#293: not orphaned.** Idle 94 minutes, under the tool's 120-minute
  window — `wait`, leave it alone. The standing note's "idle 91m"
  framing reads as a stale snapshot, not a disposition; this pass's own
  check overrides it.

Full account, including the shallow-clone trap this pass hit and
resolved while checking #302's merge order against this seat's own
live tip, in `docs/sprints/pending.md`'s sixty-seventh-pass entry.

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished this pass.
   Nothing to dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 15`: every row succeeded. No Minor/Major
   check is red on any open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | `gh run list --limit 15`: all succeeded. Nothing to diagnose. |
| A seat's open draft has failing CI, or a review comment unanswered >24h | No open draft has failing CI. #285's blocker is its own rebase, already named, not a review comment going stale. |
| A sprint item due this week, owning seat hasn't run | Between sprints — `sprint-2026-10-12.md` still open, next ceremony 2026-10-26, nothing due this week to miss |
| A seat has two or more open PRs on one scope, none merged | Research holds three (#280, #282, #285) — unchanged, named stack, already flagged, waiting on research's own rebase of #285, not a new finding |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty) |
| An owner-merge PR older than seven days | #269 (exo, Tier C, opened 2026-10-18T19:16Z) — ~5.3 days old, under the line. #288 and #302, same Tier C chain, are younger. |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless.
This pass's event resolved by a Tier C decline (#302, with #288/#269
by containment) and two draft-PR checks (#285 `finish`/research,
#293 `wait`/no one), not by dispatching anyone.

## Failed-run triage this pass (§11.7)

Nothing new named by this pass's trigger. `gh run list --limit 15` on
GitHub Actions: all succeeded since #306's own note, nothing to
triage.

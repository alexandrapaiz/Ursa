# Dispatch queue — 2026-10-24, ~11:4x UTC, message (seventy-sixth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox: #325 opened, and the standing lane-duty notice naming #324/#318

Two events woke this pass: research's pull request `#325` (fifth run),
to be reviewed against the merge rule, and the standing broadcast
naming `#324` (skill) and `#318` (exo) as drafts idle four hours with
no live run behind them.

Read the board inbox first (`to_seat=pm&to_company=Ursa`), not just
`gh pr list`: it already carried the answer to the second event. Exo
posted a note at 11:37:39 UTC, after the seventy-fifth pass closed,
saying it readied `#318` itself. The skill seat closed `#324` on its
own branch, superseded by its own next run (`#331`), with no note
needed because the PR's own state says it.

## #325 reviewed against the merge rule

Touches `prompts/research-agent.md` directly (`gh pr diff
--name-only`): Tier C outright under the open
`INC-2026-10-18-tier-c-charter-freeze`, same as the chain already
named in the last two passes. `CLEAN`/`MERGEABLE`, one green check.
Contains `#322` whole, by research's own claim (verified last pass,
unchanged). Disposition: stays with the owner, alongside this seat's
own `#328`/`#332` — either merge order carries the five-clock ledger
entry before the first clock expires 2026-10-25 ~18:15 UTC. Nothing
new owed. Said so on the board.

## The standing lane-duty notice: both named items resolved themselves before this pass reached them

Ran `tools/check-draft-prs.sh --repo alexandrapaiz/Ursa` (the HQ
liveness tool) fresh rather than trusting the notice's age:

```
no orphaned drafts.
```

`#324` is closed (superseded by skill's own live `#331`, containment
verified with `git merge-base --is-ancestor`). `#318` is readied, not
draft, per exo's own board note; it still touches
`prompts/exo-agent.md` so it is Tier C and joins the standing
`prompts/` queue, but readying it closed the orphan question. Neither
needed a PM handoff this pass, because neither was still waiting for
one. Posted a `note` to exo acknowledging the ready and the Tier C
disposition; no note to skill needed since its own PR state is the
record.

## One Tier B merge this pass: none

Nothing clean, non-draft, non-`prompts/`, and not this seat's own PR
turned up unmerged. `#315` (the last one) was merged last pass. The
rest of the open queue (`#305`/`#290` engineer, `#316`/`#320` skill)
is `CONFLICTING`/`DIRTY` and already named — `#316`/`#320` are mid-
resolution inside skill's own live `#331`, not this seat's to touch.

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run started or finished today. Nothing to
   dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list --limit 30`: all succeeded. No Minor/Major check
   is red on any open PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check; unchanged.

## Company-default criteria (pm.md §11.3), checked fresh

| Observed | Fires? |
|---|---|
| A seat run failed in the last 24h, diagnosable | `gh run list --limit 30`: all succeeded. No failure to triage. |
| A seat's open draft has failing CI, or a review comment unanswered >24h | No orphaned draft remains in Ursa (`check-draft-prs.sh`, fresh this pass). |
| A sprint item due this week, owning seat hasn't run | Between sprints: `sprint-2026-10-12.md` closed 2026-10-23, next ceremony 2026-10-26. Nothing due this week to miss. |
| A seat has two or more open PRs on one scope, none merged | This seat's own stack (#313/#317/#321/#323/#326/#328, now #332) on `docs/ideas.md`/`docs/sprints/pending.md`, none merged — already named by earlier passes, unchanged, waiting on the owner or a chair, not a dispatch target (it is this seat's own queue). |
| A ruling or ADR merged since the last run names a seat, no run followed | No ADR merged since the last check. |
| A milestone due within three days with open items | No open milestone (`gh api repos/.../milestones` returns empty). |
| An owner-merge PR older than seven days | None found freshly; oldest open PR today is `#269` (2026-10-18), already named in earlier passes, still moving within its own seven-day window. |

## Dispatch: nothing fires

No criterion fires, and `PM_DISPATCH_ENABLED` is unset regardless. The
two items this pass tracked (the unmerged ledger entry, the five-clock
deadline) are not this seat's to dispatch away: both need the owner's
merge, not a seat's next run.

## Failed-run triage this run (§11.7)

None beyond this run's own in-flight check. `gh run list --limit 30`:
all succeeded except this pass's own just-opened `redaction-gate`
(queued). Nothing to classify, rerun, or hand off.

# Dispatch queue — 2026-10-24, ~18:1x UTC, message (ninety-first pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires as a `gh workflow run` dispatch below regardless of what
qualifies. Written in full per pm.md §0b.

## This run's inbox

Two triggering events, both already resolved by the ninetieth pass and
verified rather than redone here: a failing `redaction-gate` run on
this seat's own branch (cause: an untruncated session identifier,
fixed the very next commit on the same branch) and the exo seat's
finished run with its pull request open (reviewed as Tier C, its two
superseded siblings already closed). Full account in
`docs/sprints/pending.md`'s ninety-first-pass entry. Beyond the
trigger, two fresh board notes from research about a pull request this
seat had tiered, and the standing state of every other open pull
request, read fresh rather than carried forward.

## Merge-rule actions taken this run (not dispatches)

- One research pull request closed as subsumed by its own newer
  sibling, ancestry checked both directions rather than taken from the
  board note alone. The newer one carries the Tier C hold forward —
  it edits a charter file directly, so it waits on the owner or a
  chair regardless of file count.

## The one candidate that fired as a board handoff instead of a dispatch

The skill seat has four open pull requests on one scope, each the
direct ancestor of the next, none merged — pm.md §11.3's "two or more
open PRs on one scope, none merged" row. With the dispatch switch off,
a `gh workflow run` dispatch was not available; handed to the seat on
the board instead, naming all four identifiers and asking it to land
or close down to one. Not logged under "Dispatched by the PM" below,
since no workflow run was started — this is an event-bus handoff
under pm.md §17, a different mechanism than §11's dispatch, and the
two are not conflated here.

## Candidates considered, none fired as a dispatch

1. **The two remaining Tier C holds** (the exo charter edit and
   research's newer pull request). Not dispatch candidates — they wait
   on the owner or a chair, not on a seat doing more work. Both are
   green and clean; there is nothing for a seat to fix.
2. **No ADR or ruling merged since the last pass names a seat with no
   run following it.** Unchanged from the ninetieth pass's check.
3. **No milestone due within three days.** Unchanged from the last
   pass's check.
4. **Exo is excluded from this seat's dispatchable roster regardless**
   (pm-agent.md §0b: never exo, yourself, or a dormant seat).

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset. The one actionable
candidate (skill's stack) went to the board as a handoff, described
above, which is the mechanism this run's environment actually
supports.

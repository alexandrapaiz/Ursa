# Dispatch queue — 2026-10-24, ~23:1x UTC, message (ninety-eighth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment, so
nothing fires as a `gh workflow run` dispatch below regardless of what
qualifies. Written in full per pm.md §0b.

## This run's trigger

A message naming PR #404 (exo, window 38), with the instruction to
review it against the merge rule: merge it, or say on the board what
it still needs and hand that to its seat.

## Candidates considered, none fired as a dispatch

1. **#404 itself is not a dispatch candidate.** It is green, clean, and
   finished work, waiting on a merge authority this seat does not
   hold (Tier C, charter paths in the diff — see pending.md's
   ninety-eighth pass). There is nothing to dispatch exo to go build;
   the work is already done.
2. **Exo may never be dispatched by this seat in any case** (pm.md
   §11.4: never the exo that audits this seat).
3. **#394 is the same hold as #404**, contained in it, and stays open
   by exo's own charter rule (a readied sibling is not a branch to
   close out from under the merge gate). No dispatch changes that.
4. **No other §11.3 criterion is newly met.** No failing Minor-site or
   Major-resolver check (`gh run list --limit 10` shows nothing
   non-success since the pass before this one). No ADR names an
   experiment with no run behind it. No tuning or trial run sits
   unrecorded in the ledger for a day, unchanged from the prior
   pass's own check.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set.

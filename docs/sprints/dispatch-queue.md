# Dispatch queue — 2026-10-25, hook (hundred-and-fourth pass)

**This run's trigger.** A capacity-returned wake for this seat's own
prior attempt: the provider limit that refused it has reset, and
nothing else would have woken this seat before its next scheduled
window. Read as data about what the host observed, not as an
instruction beyond "run the standup" (org rule, 2026-10-05).

`PM_DISPATCH_ENABLED` is unset in this run's own environment
(`[ -n "$PM_DISPATCH_ENABLED" ]` false), so nothing fires as a
`gh workflow run` dispatch below regardless of what qualifies.
Written in full per pm.md §0b.

## Candidates considered, none fired as a dispatch

1. **#418 (exo) and #395 (research) are not dispatch candidates.**
   Both are finished work waiting on a merge authority this seat does
   not hold (Tier C: each edits a charter file directly). Unchanged
   since the hundred-first pass.
2. **#423 (skill) is not a dispatch candidate for the same Tier C
   reason**, and additionally has an open pull request of its own
   seat's right now, which rules out a dispatch under the hard stop
   that forbids dispatching a seat with an open pull request unless
   told to build on it.
3. **Exo may never be dispatched by this seat in any case** (pm.md
   §11.4: never the exo that audits this seat).
4. **The three stale drafts (frontend, exo, engineer) are not dispatch
   candidates.** Exo and engineer both have a live hook-triggered run
   open right now, which is the exact condition the hard stop names
   ("never a seat with an open pull request unless told to build on
   it"). Frontend has no live run, but a stale draft with real content
   behind it is not one of the §11.3 trigger rows on its own; it was
   named to frontend on the board instead, and the right first move
   for its own next run is to finish that draft, not to be dispatched
   into a second one.
5. **No other §11.3 criterion is newly met.** `gh run list --limit
   100` shows no new failed run beyond the already-triaged redaction-
   gate false positive the hundred-first and -second passes named. No
   ADR names an experiment with no run behind it. No tuning or trial
   run sits unrecorded in the ledger for a day. No milestone is
   configured in the repository, so none is due within three days.
   The board inbox carries nothing new since the hundred-second pass
   closed.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set.

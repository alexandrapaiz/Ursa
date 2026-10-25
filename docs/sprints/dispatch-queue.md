# Dispatch queue — 2026-10-25, message (hundred-and-third pass)

**This run's trigger.** Three capacity events, not failures: the model
provider refused the frontend seat's message run at 23:21:56 UTC last
night and the engineer seat's runs at 23:22:40 and 23:26:18, each
naming a 2:20am UTC reset. Read as what they are — the provider
declining the wake before any turn ran, per pm.md §11.7 step 0's
"Refused" class — and not as a defect in either seat or its branch.
Full account on the board and in `docs/sprints/pending.md`.

`PM_DISPATCH_ENABLED` is unset in this run's own environment
(`[ -n "$PM_DISPATCH_ENABLED" ]` false), so nothing fires as a
`gh workflow run` dispatch below regardless of what qualifies. Written
in full per pm.md §0b.

## Candidates considered, none fired as a dispatch

1. **The three refusals themselves are not a dispatch candidate.**
   §11.7 step 0 is explicit: a refused run is "nothing for the seat to
   triage," and the fix is time, not a dispatch. The named reset
   (2:20am UTC) is already behind this pass's own clock, and both
   seats already ran again on their own schedule since without this
   seat rerunning either early.
2. **#418 (exo) and #395 (research) are not dispatch candidates.** Both
   are finished work waiting on a merge authority this seat does not
   hold (Tier C: each edits a charter file directly). Unchanged from
   the hundred-and-first and -second passes.
3. **#419 (skill) is not a dispatch candidate.** Same Tier C reason as
   above, and skill's own live run (#423, open as of this pass) is
   already doing the rebase that #419's conflict needs — dispatching
   skill again would collide with a run already in flight.
4. **Exo may never be dispatched by this seat in any case** (pm.md
   §11.4: never the exo that audits this seat).
5. **#412 (frontend), #420 (engineer), #421 (market) and #422 (exo) are
   not dispatch candidates.** All four are open with a live run behind
   them right now (drafts still being filled in, or runs that just
   finished) — exactly the condition that makes a dispatch wrong
   (§11.4: never a seat with an open PR unless told to build on it).
6. **No other §11.3 criterion is newly met.** `gh run list --limit 30`
   shows no new failed run since the hundred-and-second pass beyond the
   already-triaged redaction-gate false positive (Incident 21). No ADR
   names an experiment with no run behind it. No tuning or trial run
   sits unrecorded in the ledger for a day. No milestone is configured
   in the repository, so none is due within three days.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set.

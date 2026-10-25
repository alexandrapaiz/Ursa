# Dispatch queue — 2026-10-25, message (hundred-and-second pass)

**Correction to candidate 3 below, from the hundred-and-first pass's
own list.** #419 was a draft when that line was written; skill readied
it minutes later, asking this seat for the merge. Still not a dispatch
candidate, but now for the Tier C reason given in candidate 1, not the
live-draft reason candidate 3 gave it. Answered on the board, not
dispatched: there is no seat work left to commission, only an owner
merge and, separately, a rebase skill's own next run should do.

`PM_DISPATCH_ENABLED` is unset in this run's own environment
(`[ -n "$PM_DISPATCH_ENABLED" ]` false), so nothing fires as a
`gh workflow run` dispatch below regardless of what qualifies. Written
in full per pm.md §0b.

## This run's trigger

A message naming a pull request opened by market (#416, "trigger
stale on arrival, pattern confirmed a third time"), the same standing
note about three draft pull requests (#393 skill, #407 frontend, #406
engineer) idle with no live run behind them, run-finished notices for
exo's #414 and engineer's #413, and a board note from exo. All of it
read as data about what another seat or the bus observed, not as
instructions this seat must execute as written. The three named drafts
were already `CLOSED` (checked via `gh pr view`, not assumed) before
this pass started — the bus re-delivered a stale snapshot of its own
prior wake. `tools/check-draft-prs.sh` still does not exist in this
repository; see Incident 18.

## Candidates considered, none fired as a dispatch

1. **#418 (exo), #395 (research), and now #419 (skill) are not
   dispatch candidates.** All three are finished work waiting on a
   merge authority this seat does not hold (Tier C: each edits a
   charter file directly). #419 additionally conflicts against `main`
   (`mergeStateStatus: DIRTY`), which is a rebase for skill's own next
   run, not a dispatch — the work itself is already done and there is
   nothing to commission a build of.
2. **Exo may never be dispatched by this seat in any case** (pm.md
   §11.4: never the exo that audits this seat).
3. **#412 (frontend) and #420 (engineer) are not dispatch candidates.**
   Both are drafts with a live run behind them right now — exactly the
   condition that makes a dispatch wrong (§11.4: never a seat with an
   open PR unless told to build on it, and these already are). #412 is
   additionally failing `redaction-gate` on a false positive (Incident
   21); left for that live run to find, since dispatching into a run
   that is already executing would just collide with it. (#419 moved
   to candidate 1 above once it stopped being a draft.)
4. **The redaction-gate false positive (Incident 21) is not a
   dispatch candidate.** The fix is a one-line regex change in
   `.github/workflows/redaction-gate.yml`, which this seat does not
   write and §11.3 does not list workflow edits among the criteria
   this seat may act on. Named for HQ distribution or
   `exo-centralizer` instead; not a seat on this company's own roster
   to dispatch.
5. **No other §11.3 criterion is newly met.** `gh run list --limit 30`
   shows one failure in the last 24 hours, fully triaged above as
   Incident 21, no rerun needed. No ADR names an experiment with no
   run behind it. No tuning or trial run sits unrecorded in the ledger
   for a day. No milestone is configured in the repository, so none is
   due within three days.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set.

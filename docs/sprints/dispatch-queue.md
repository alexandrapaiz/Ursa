# Dispatch queue — 2026-10-25, message (hundred-and-first pass)

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

1. **#418 (exo) and #395 (research) are not dispatch candidates.**
   Both are green, clean, finished work waiting on a merge authority
   this seat does not hold (Tier C: each edits a charter file
   directly). There is nothing to dispatch either seat to go build;
   the work is already done and waits on the owner or a chair.
2. **Exo may never be dispatched by this seat in any case** (pm.md
   §11.4: never the exo that audits this seat).
3. **#412 (frontend), #419 (skill) and #420 (engineer) are not
   dispatch candidates.** All three are drafts, but all three have a
   live run behind them right now (pushed within the last 20 minutes
   of this pass's start) — exactly the condition that makes a dispatch
   wrong (§11.4: never a seat with an open PR unless told to build on
   it, and these already are). #412 is additionally failing
   `redaction-gate` on a false positive (Incident 21, new this pass);
   left for that live run to find, since dispatching into a run that
   is already executing would just collide with it.
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

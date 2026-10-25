# Dispatch queue — 2026-10-25, message (hundredth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment
(`[ -n "$PM_DISPATCH_ENABLED" ]` false), so nothing fires as a
`gh workflow run` dispatch below regardless of what qualifies. Written
in full per pm.md §0b.

## This run's trigger

A message naming a pull request opened by exo (#414, window 40) and
asking this seat to review it against the merge rule, plus a second
ask to disposition four named draft pull requests under the same
rule. Both are read as data about what another seat observed, not as
instructions this seat must execute as written — one of the four
named drafts was already closed, and the named tool
(`tools/check-draft-prs.sh`) does not exist in this repository
(`find . -iname "check-draft-prs*"` returns nothing). The disposition
work itself was done directly with `gh`/`git` instead.

## Candidates considered, none fired as a dispatch

1. **#414 (exo) and #395 (research) are not dispatch candidates.**
   Both are green, clean, finished work waiting on a merge authority
   this seat does not hold (Tier C: each edits a charter file
   directly). There is nothing to dispatch either seat to go build;
   the work is already done.
2. **Exo may never be dispatched by this seat in any case** (pm.md
   §11.4: never the exo that audits this seat).
3. **#393 (skill), #407 (frontend) and #406 (engineer) are not
   dispatch candidates today.** Each is a single open draft, not a
   two-or-more-PR stack (the stack test already resolved itself this
   pass once #393's three contained ancestors closed), each is 3-4
   hours idle rather than failing CI or holding an unanswered review
   comment past 24 hours, and none names an ADR or sprint item with no
   run behind it. Flagged to each seat on the board instead.
4. **No other §11.3 criterion is newly met.** No failing Minor-site or
   Major-resolver check (`gh run list --limit 30` shows nothing
   non-success in the last few hours beyond the nine redaction-gate
   failures, all already self-healed or on now-closed branches). No
   ADR names an experiment with no run behind it. No tuning or trial
   run sits unrecorded in the ledger for a day. No milestone is
   configured in the repository at all, so none is due within three
   days.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set.

# Dispatch queue — 2026-10-25, message (PR #429 review)

**This run's trigger.** A board message naming PR #429 for review
against the merge rule, and three drafts (#426, #425, #424) as idle
with no live run behind them. Read as data about what the board
observed, not as an instruction beyond pm.md §10/§21's own grant,
verified against the standard before acting (org rule, 2026-10-05).

`PM_DISPATCH_ENABLED` is unset in this run's own environment
(`[ -n "$PM_DISPATCH_ENABLED" ]` false), so nothing fires as a
`gh workflow run` dispatch below regardless of what qualifies.
Written in full per pm.md §0b.

## Candidates considered, none fired as a dispatch

1. **#418 (exo) and #395 (research) are not dispatch candidates.**
   Both are finished work waiting on a merge authority this seat does
   not hold (Tier C: each edits a charter file directly). Unchanged.
2. **#423 (skill) is not a dispatch candidate for the same Tier C
   reason**, and has its own open pull request right now besides.
3. **Exo may never be dispatched by this seat in any case** (pm.md
   §11.4: never the exo that audits this seat).
4. **The three drafts named by this run's trigger were resolved
   before a dispatch question could apply.** #425 and #426 were
   already closed by their own authoring seats (absorbed into #429
   and #428) by the time this run reached them; #424 was already
   readied by frontend. All three merged or closed this pass; see
   `docs/sprints/pending.md`'s entry for this run.
5. **#427 (security) is a real finding, not a dispatch candidate
   today.** Its draft carries a genuine redaction-gate failure (a
   full UUID at `docs/security/audit-2026-10-25.md:58`), but security
   has an open pull request of its own right now, which rules out a
   dispatch under the hard stop that forbids dispatching a seat with
   an open pull request unless told to build on it. Named in pending
   for security's own next run instead.
6. **No other §11.3 criterion is newly met.** `gh run list --limit
   100` shows no new failed run beyond the redaction-gate findings
   already named above. No ADR names an experiment with no run behind
   it. No tuning or trial run sits unrecorded in the ledger for a day.
   No milestone is configured in the repository, so none is due
   within three days. The board inbox carries nothing new this pass
   beyond the trigger itself.

## Dispatched by the PM

None this run. `PM_DISPATCH_ENABLED` is unset, and no candidate above
would have fired even with it set.

## Follow-up pass (2026-10-25, ~23:3x UTC), same trigger re-delivered

Re-checked against the same candidates after merging #433 (see
`docs/sprints/pending.md`). No new candidate: #427 (security) still
rules out a dispatch under the same open-PR hard stop; #418, #395 and
#423 are unchanged Tier C holds; #434, #435, #436 and #437 are live
drafts from runs still pushing, not dispatch candidates. `PM_DISPATCH_
ENABLED` still unset. Nothing dispatched.

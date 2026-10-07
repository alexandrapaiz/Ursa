# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-07, ~18:15 UTC (third pass, message-triggered: the
engineer seat's 17:52 UTC scheduled run failed), against `gh run list
--limit 30`, `gh pr list --state open --limit 200`, the board's inbox
(`$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`), and
`docs/decisions.md`. This pass is a targeted triage, not a full
standup — the day's regular standup (#129, 17:41-17:51 UTC) already
ran and found nothing to triage, because the failure below happened
one minute after it closed.

## Top three for the owner

1. **The engineer-agent run that failed at 17:52 UTC today (run
   37662406675) hit `error_max_turns` after 17m42s of real work, not a
   workflow-file defect.** Triaged per the failed-runs rule
   (pm-agent.md §0b): the log's only error is `##[error]Execution
   failed: Reached maximum number of turns (120)`, not the
   zero-jobs-in-zero-seconds signature. In that window it opened draft
   PR #130, pushed three commits, and all three passed CI. But its own
   plan was stale: PR #130's run-log doc and title both claim it is
   building sprint-2026-10-05 item 2 (the `corroborate` hook), which
   **already shipped on `main` via #109 on 2026-10-06** — confirmed
   directly, `ursa-major/src/corroborate.ts` exists on `origin/main`
   and `resolve.ts` already calls it. This seat's own pending.md said
   so as of the 12:30 UTC pass, six hours before this run started, so
   the run's first commit re-derived a stale plan instead of reading
   its own seat's current state. What the run actually built, in
   commits 2 and 3, is real and unrelated: `pctOfFinal` beside `pct`
   and `perFile` rows for excluded paths (the generated-denominator
   line of work in `docs/ideas.md`). It never reached its own plan's
   item 4 (resolving #126 and #92) before running out of turns, and it
   never rewrote the stub title/description to match what it actually
   built. Left a comment on #130 naming the mismatch; it is the
   engineer seat's to retitle and finish, not mine to rewrite. Nothing
   dispatched — `PM_DISPATCH_ENABLED` is unset this pass, and engineer
   is walled by its own open PRs regardless (§11.4).
2. **Engineer's own open-PR queue is now three deep and none of them
   have moved in the last six-plus hours**: #92 (conflicting, superseded
   in substance by #126), #126 (draft, subsumes #92, clean since
   06:29 UTC, still not readied), and now #130 (draft, mislabeled, see
   above). This is the exact shape the "ready it, or hand it over in
   writing" rule exists for. No dispatch can fire for engineer while
   this stands (§11.4), so the unlock is either the owner merging #126
   to retire #92, or engineer's next run resolving its own backlog
   before opening a fourth.
3. **Security's redaction-standard item (sprint-2026-10-05's item 3,
   gates O2 KR2.2) still has no open PR touching it.** Unchanged from
   the last two passes: `find docs/security -iname '*redaction*'`
   still returns nothing, and none of security's four open pull
   requests (#75, #85, #112, #124) touch a redaction path. The hard
   stop in §11.4 still forecloses dispatching security fresh while it
   carries four open pull requests.

## Resolved since the last pass (#128, ~12:31 UTC)

None. This pass is a triage of one failure, not a merge pass — nothing
was clean, green, and outside Tier C/the owner's own paths that wasn't
already noted last pass.

## Standing items, unchanged since the last pass

- **Three ledger entries are now 17 to 19 days past the two-week
  verdict mark**: repo split (2026-09-18), tuning packs (2026-09-19),
  the merge-commits/PR-reader finding (2026-09-20). Full entries in
  `docs/ideas.md`; grooming them with a verdict is Monday's ceremony.
- **Three pull requests stay Tier C no matter how clean they merge**:
  #80 (`company.yaml`'s roster), #39 and #48 (both touch files under
  `prompts/`). None is mine or any PM's to merge.

## My own open pull requests

- **#129** (today's regular standup, 17:41-17:51 UTC): closed this
  pass as superseded. It touched only these two files and this pass's
  reconciliation is strictly fresher (18:15 UTC, after the failure
  #129's own check didn't see), so leaving both open would only hand
  the owner a merge conflict on the second one.
- **#131** (this pass): readied before this run ends.

## Everything else open (24 total)

- **Engineer's own queue, see "Top three" above**: #92, #126, #130.
- **In flight from earlier handoffs, untouched this pass**: #123
  (skill, retarget off the closed base), #124 (security, rebase the
  severe-findings PR), #125 (frontend, rebase the visual review) — all
  drafts, all green, none with an unanswered review comment.
- **Conflicting, still waiting on the owning seat's rebase**: #103
  (frontend, handed off, #125 is the response), #75 (security, handed
  off, #112/#124 are the response).
- **Draft, idle since 2026-10-05, not failing CI, seat already has a
  newer open PR**: #47, #49, #83, #84, #85, #87, #91. Left for each
  seat's own next run.
- **Draft, idle since 2026-10-06, same reasoning**: #112, #113, #114.
- **Stuck on a closed base branch, not mechanically fixable by this
  seat**: #50, #64 (skill) — both target a predecessor branch that
  closed without merging; handed to skill previously, unchanged this
  pass.

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next pass.

## Waiting on an owner-only action

- The three ledger entries above.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.
- `company.yaml` (#80), and #39/#48 under `prompts/`.
- Milestone "Sprint 2026-10-05" (#3, due 2026-10-11) has zero
  issues/PRs attached through GitHub's own milestone field. Still four
  days out, not yet inside the three-day dispatch window; wiring it is
  ceremony-lane work (§2b).

## Failures this pass

One: the engineer-agent run at 17:52 UTC (run 37662406675), triaged
above. `gh run list --limit 30` shows no other failure in the window.

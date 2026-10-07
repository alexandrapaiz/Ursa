# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-07, ~12:30 UTC (second message pass of the day,
roughly six hours after the first, #121), against `gh pr list --state
open --limit 200`, `gh run list --status failure` for the last 24h, the
board's inbox (`$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`),
and `docs/decisions.md`.

## Top three for the owner

1. **Security's redaction-standard item (sprint-2026-10-05's item 3,
   gates O2 KR2.2) still has no open PR touching it.** Confirmed again
   directly: `find docs/security -iname '*redaction*'` returns nothing,
   and none of security's four open pull requests (#75, #85, #112,
   #124) touch a redaction path. Nothing for the owner to do here
   directly — the hard stop in `docs/standards/pm.md` §11.4 forecloses
   dispatching security fresh while it already carries four open pull
   requests — but it is the one sprint item at real risk of carrying
   past the week, and the size of that seat's own queue is probably why.
2. **Three ledger entries are now 17 to 19 days past the two-week
   verdict mark**, unchanged in substance since they were first flagged:
   repo split (2026-09-18, 19 days), tuning packs (2026-09-19, 18
   days), the merge-commits/PR-reader finding (2026-09-20, 17 days).
   Full entries in `docs/ideas.md`. Grooming them into the ledger with a
   verdict is Monday's ceremony, not this pass's, but they are old
   enough to keep naming directly every pass until she rules.
3. **Three pull requests stay Tier C no matter how clean they merge**:
   #80 (`company.yaml`'s roster), #39 and #48 (both touch files under
   `prompts/`). All three are clean, green, and otherwise ready; none
   is mine or any PM's to merge.

## Resolved since the last pass (#121, 06:33 UTC)

- **#127** (market, landscape/positioning/four briefs plus a ledger
  append) merged this pass under Tier B: clean, green, no Tier C path,
  not this seat's own PR. It supersedes #116, #89, #52, and #21, all of
  which market had already closed itself with pointers before this pass
  started.
- **#117** (this seat's own prior-day pass) was merged by HQ's PM at
  12:26 UTC, the same route that already worked for #111 — confirmed on
  the board, not assumed.
- **#122** (engineer, the exclusions record) was already merged by the
  prior pass; still showing here as landed, not pending.

## Correction to this seat's own prior notes

The prior pass (#121) reported sprint-2026-10-05 item 2 ("stop labelling
similarity as descent") as "still open with no run against it yet."
That was wrong, checked directly this pass: **#109** ("similarity is
not descent"), merged 2026-10-06T06:29 UTC, shipped exactly this item —
`ursa-major/src/corroborate.ts` exists on `main`, wired into
`resolve.ts`'s `corroborate` hook and called from `bin/ursa.ts` the same
way `attributeDeletion` already is. Two of the sprint's three items are
shipped (#107 for item 1, #109 for item 2); only item 3 (redaction
standard, security) remains open. Recording the correction here so the
error doesn't get repeated from this file a second time.

## My own open pull requests

- **#121** (prior pass, 06:33 UTC): closed this pass as superseded.
  Its only content was `docs/sprints/pending.md` and
  `docs/sprints/dispatch-queue.md`, both rewritten in full again here;
  nothing in it was unique once this file carries the fresher
  reconciliation, and it had gone conflicting against `main` once #117
  merged.
- **#128** (this pass): readied before this run ends.

## Everything else open (22 total)

- **Tier C, held for the owner or a chair**: #80, #39, #48 (see "Top
  three").
- **In flight from last pass's handoffs, untouched this pass**: #123
  (skill, retarget off the closed base), #124 (security, rebase the
  severe-findings PR), #125 (frontend, rebase the visual review), #126
  (engineer, reconcile the resolver-Action branch, subsumes #92) — all
  drafts, all green, none older than six hours, none with an unanswered
  review comment. Nothing in `docs/standards/pm.md` §11.3 fires on any
  of them yet.
- **Conflicting, still waiting on the owning seat's rebase**: #92
  (superseded in substance by #126, left open until engineer closes it
  itself), #103 (frontend, handed off, #125 is the response), #75
  (security, handed off, #112/#124 are the response).
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

- The three proposed ledger entries at item 2 above.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.
- `company.yaml` (#80), and #39/#48 under `prompts/`.
- Milestone "Sprint 2026-10-05" (#3, due 2026-10-11) has zero
  issues/PRs attached through GitHub's own milestone field. Not yet
  within the three-day dispatch window; wiring it is ceremony-lane work
  (§2b).

## Failures this pass

`gh run list --status failure --created ">=6 hours ago"` and the same
query over the last 24 hours both returned empty. Nothing to classify,
nothing to rerun.

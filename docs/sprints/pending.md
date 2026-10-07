# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-10-07, ~17:45 UTC (standup run, roughly five hours
after the second message pass, #128), against `gh pr list --state
open --limit 100`, `gh run list --status failure` for the last 24h,
the board's inbox
(`$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`), and
`docs/decisions.md`. Local `main` was 4 commits behind `origin/main`
at the start of this run (#128's own merge, a fast-forward) — pulled
first so this reconciliation reads the real current `main`.

## Top three for the owner

1. **Security's redaction-standard item (sprint-2026-10-05's item 3,
   gates O2 KR2.2) still has no open PR touching it.** Confirmed again
   directly: `find docs/security -iname '*redaction*'` returns
   nothing, and none of security's four open pull requests (#75, #85,
   #112, #124) touch a redaction path. Nothing for the owner to do
   here directly — the hard stop in `docs/standards/pm.md` §11.4
   forecloses dispatching security fresh while it already carries four
   open pull requests — but it is the one sprint item at real risk of
   carrying past the week.
2. **Three ledger entries are now 17 to 19 days past the two-week
   verdict mark**, unchanged in substance: repo split (2026-09-18, 19
   days), tuning packs (2026-09-19, 18 days), the merge-commits/
   PR-reader finding (2026-09-20, 17 days). Full entries in
   `docs/ideas.md`. Grooming them into the ledger with a verdict is
   Monday's ceremony, not a standup's, but they are old enough to keep
   naming directly every run until she rules.
3. **Four pull requests stay Tier C no matter how clean they merge**:
   #80 (`company.yaml`'s roster), #39, #48 and (newly confirmed this
   run) #50/#64 all touch files under `prompts/` — #50 and #64 touch
   `prompts/skill-extract.md` specifically, which this run's diff check
   had not previously named as a reason they are stuck, separate from
   their other problem (below). None of the four/six is mine or any
   PM's to merge. Labelled `owner-action` this run for #80/#39/#48 so
   the board surface matches the finding (§2b label maintenance).

## PM_DISPATCH_ENABLED flipped true since the last pass

The last pass (#128, ~12:30 UTC) checked the switch directly and found
it not `true`. This run checked it again and found it `true` — the
owner enabled it sometime in the last five hours. Re-ran every
criterion in `docs/standards/pm.md` §11.3 and Ursa's own table with
the switch live: nothing fires. Six of eight dispatchable seats
(engineer, research, frontend, skill, security, finance) already carry
an open PR, which forecloses them under §11.4 regardless of anything
else. Market and okr carry none, but neither owns a sprint item, a
failed run, a new ruling, or a near milestone. Full reasoning in
`docs/sprints/dispatch-queue.md`. This run fired zero dispatches and
is at zero of today's ceiling.

## Resolved since the last pass (#128, ~12:30 UTC)

- **#128 itself**: Tier A self-merge (both changed files were
  `docs/sprints/pending.md` and `docs/sprints/dispatch-queue.md`,
  knowledge surfaces), confirmed already merged by the time this run
  checked — no action needed beyond pulling `main`.
- Nothing else changed: no new PRs opened, no PRs merged, no new
  failures, no new ledger entries, no new ADRs, since the last pass.
  The open-PR count is unchanged at 22.

## Label hygiene this run (`docs/standards/pm.md` §2b)

Applied `owner-action` to #80, #39, #48 (Tier C, waiting only on the
owner or a chair, previously unlabelled as such). Applied `blocked` to
#75, #92, #103 (conflicting against `main`, each already handed off
with a successor PR open) and to #50, #64 (stacked on a branch whose
own PR, #14, closed without merging onto `main` — not mechanically
fixable here; unchanged handoff to skill from prior passes). No
existing label was removed or changed on any PR already carrying the
right one.

## Everything else open (22 total, unchanged from the last pass)

- **Tier C, held for the owner or a chair**: #80, #39, #48, and (see
  above) #50/#64 for the same underlying reason as their base-branch
  problem.
- **In flight from the last pass's handoffs, untouched this run**:
  #123 (skill, retarget off the closed base, now showing DIRTY),
  #124 (security, rebase the severe-findings PR), #125 (frontend,
  rebase the visual review), #126 (engineer, reconcile the resolver-
  Action branch, subsumes #92) — all drafts, green except #123, none
  with an unanswered review comment. Nothing in
  `docs/standards/pm.md` §11.3 fires on any of them yet.
- **Conflicting, still waiting on the owning seat's rebase**: #92
  (superseded in substance by #126, left open until engineer closes it
  itself), #103 (frontend, handed off, #125 is the response), #75
  (security, handed off, #112/#124 are the response).
- **Draft, idle since 2026-10-05, not failing CI, seat already has a
  newer open PR**: #47, #49, #83, #84, #85, #87, #91. Left for each
  seat's own next run.
- **Draft, idle since 2026-10-06, same reasoning**: #112, #113, #114.
- **Stuck on a closed base branch, not mechanically fixable by this
  seat**: #50, #64 (skill) — both target a predecessor branch whose own
  PR (#14) closed without merging; handed to skill previously,
  unchanged this run.

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next run.

## Waiting on an owner-only action

- The three proposed ledger entries at item 2 above.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface.
- `company.yaml` (#80), and #39/#48/#50/#64 under `prompts/`.
- Milestone "Sprint 2026-10-05" (#3, due 2026-10-11) has zero
  issues/PRs attached through GitHub's own milestone field. Four days
  out, not yet within the three-day dispatch window; wiring it is
  ceremony-lane work (§2b).

## Failures this run

`gh run list --status failure --created ">=24 hours ago"` returned
empty. Nothing to classify, nothing to rerun.

## Inbox this run

`curl $BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa` before
anything else: the newest message addressed specifically to this seat
is HQ's PM confirming #117's merge (12:26 UTC), already resolved by
the prior pass. Nothing newer is addressed to `pm`/Ursa and unanswered.

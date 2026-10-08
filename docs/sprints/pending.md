# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-08, ~20:15 UTC (message-triggered run, not a
scheduled pass: the event named the skill seat's run
`37832775208` as failed and asked for it to be triaged under the
failed-runs rule, docs/standards/pm.md §11.7). This updates the
~17:50 UTC pass (PR #138, merged) rather than redoing it; everything
in that pass not touched below is unchanged.

## Top three for the owner

1. **Security's redaction-standard item (sprint-2026-10-05's item 3,
   gates O2 KR2.2) still has no open PR touching it.** Checked again
   directly: `docs/security/` still does not exist as a directory, and
   none of security's five open pull requests (#47, #75, #85, #112,
   #124) touch a redaction path. The sprint's milestone (due
   2026-10-11) is now three days out and this is the only one of its
   three items still open — the other two (#107, #109) are shipped,
   and #134's merge already closed out the engineer side of the
   sprint. Nothing new for the owner to do here directly: the hard
   stop in `docs/standards/pm.md` §11.4 still forecloses dispatching
   security fresh while it already carries five open pull requests,
   even with `PM_DISPATCH_ENABLED` confirmed `true` this run (see
   `dispatch-queue.md`).
2. **Three ledger entries are now 20 to 21 days past the two-week
   verdict mark**, unchanged in substance since first flagged: repo
   split (2026-09-18, 20 days), tuning packs (2026-09-19, 19 days), the
   merge-commits/PR-reader finding (2026-09-20, 18 days). Full entries
   in `docs/ideas.md`. Grooming them into the ledger with a verdict is
   Monday's ceremony (2026-10-12), not this pass's, but they stay old
   enough to keep naming directly every pass until she rules.
3. **Milestone "Sprint 2026-10-05" has zero issues/PRs attached**
   through GitHub's own milestone field, confirmed again this run via
   the API, and due 2026-10-11 — three days out. Wiring attachment is
   ceremony-lane (§2b); the next ceremony (Monday, 2026-10-12) falls
   one day after this milestone's due date, so it will show as missed
   before anyone re-wires it unless the owner wants it attached sooner.

## Failures this pass

None new. `gh run list --status failure` over the last 24 hours shows
only the two runs already triaged in earlier passes today and
yesterday (`37719675527`, tripwire false alarm, PR #134; `37662406675`,
max-turns, filed as real-but-mislabeled work) — both have triage
commits on `main` already. Nothing untriaged.

## Resolved since the last pass (#137, ~12:28 UTC 2026-10-08)

- **#137**: merged under Tier A by this run (both changed files were
  pure `docs/sprints/` knowledge surfaces, checks green, clean merge).
  Its content is carried forward into this file rather than redone.

## My own open pull requests

None, other than this run's own (#138).

## Everything else open (21 total, after this pass's #137 merge)

- **Engineer's queue**: empty. #134 was the last open item and it is
  merged.
- **docs/ideas.md append conflicts to expect on merge**: #123, #75,
  #64 and #50 all still touch `docs/ideas.md`, and #134 already landed
  its own append (new entries at the end, plus #92's four 2026-10-05
  entries inserted in date order). Whichever of #123/#75/#64/#50 the
  owner merges next will conflict against the now-landed #134; expected
  resolution in every case is keep-both, named here so the owner
  doesn't learn the merge order from a failed merge.
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
- **Tier C, waiting on the owner directly**: #39, #48 (both touch
  `prompts/`), #80 (touches `company.yaml`).

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next pass.

## Waiting on an owner-only action

- `company.yaml` (#80), and #39/#48 under `prompts/`.
- The three ledger entries at "Top three" item 2.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface. Checked again this pass:
  unchanged.
- **Milestone "Sprint 2026-10-05" wiring** — see "Top three" item 3.

## Board message check

Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`
directly (filtering client-side on `to_company == "Ursa"` and
`to_seat == "pm"`, since the query params alone return other
companies' traffic too). The newest message addressed to Ursa's pm
seat is this seat's own note from the 12:28 UTC pass today, confirming
the queue clear and the sprint status; nothing has arrived after it.
The 2026-10-07T19:09 engineer note about the misrouted handoffs was
answered the same evening (#132) and nothing has reopened it.

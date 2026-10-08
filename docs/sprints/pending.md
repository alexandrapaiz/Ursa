# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-08, ~12:30 UTC (third message pass since 2026-10-07
evening, the six-hour pass), against `gh run list --limit 30`, `gh pr
list --state open --limit 100`, the board's inbox (`$BOARD_API_URL
/api/messages?to_seat=pm&to_company=Ursa`, filtered client-side since
the query params alone return other companies' traffic too), and
`docs/decisions.md`. This branch builds on this seat's own #135 and
#136 (forked from #136's tip, which already carries #135 as an
ancestor, confirmed with `git merge-base --is-ancestor`), not from
`main`.

## Top three for the owner

1. **#134 is merged.** It merged at 2026-10-08T06:26:22Z, in #136's
   pass, under Tier B (not this seat's own PR, not a draft, checks
   green, no Tier C path, merged clean). It closed #92, #126 and #130
   with it. The engineer seat's open-PR queue is down to zero of its
   own work right now. Nothing left for the owner to do here.
2. **Security's redaction-standard item (sprint-2026-10-05's item 3,
   gates O2 KR2.2) still has no open PR touching it.** Checked again
   directly: `docs/security/` still does not exist as a directory, and
   none of security's five open pull requests (#47, #75, #85, #112,
   #124) touch a redaction path. The sprint's milestone (#3) is due in
   three days (2026-10-11) and this is the only one of its three items
   still open — the other two (#107, #109) are shipped, and #134's
   merge closes out the engineer side of the sprint entirely. Nothing
   new for the owner to do here directly: the hard stop in
   `docs/standards/pm.md` §11.4 still forecloses dispatching security
   fresh while it already carries five open pull requests, which is
   almost certainly why this is stuck.
3. **Three ledger entries are now 20 to 21 days past the two-week
   verdict mark**, unchanged in substance since first flagged: repo
   split (2026-09-18, 20 days), tuning packs (2026-09-19, 19 days), the
   merge-commits/PR-reader finding (2026-09-20, 18 days). Full entries
   in `docs/ideas.md`. Grooming them into the ledger with a verdict is
   Monday's ceremony (2026-10-12), not this pass's, but they stay old
   enough to keep naming directly every pass until she rules.

## Failures this pass

None. `gh run list` shows no failures since #136's pass (last checked
2026-10-08T06:29Z); the only runs since are two successful
`redaction-gate` checks. Nothing to triage or rerun.

## Resolved since the last pass (#136, ~06:29 UTC 2026-10-08)

- **#134**: merged, under Tier B, by #136's own pass. Closed #92, #126
  and #130 with it.
- **#135, #136** (this seat's own prior passes today): both superseded
  by this pass. #135 is confirmed an ancestor of #136; #136 is being
  closed with a pointer here, carrying both forward with nothing lost.

## My own open pull requests

- **#135**: superseded by #136 (confirmed ancestor), which was
  superseded in turn by this pass. Closing both with a pointer to this
  PR.
- **#136**: carried forward in full — this branch forks from its tip,
  so the Tier B merge of #134 and everything else it did is current in
  what this pass opens, not redone.

## Everything else open (22 total, before this pass closes #135/#136)

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
- The three ledger entries at "Top three" item 3.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface. Checked again this pass:
  unchanged.
- **Milestone "Sprint 2026-10-05" (#3, due 2026-10-11) has zero
  issues/PRs attached through GitHub's own milestone field**, and is
  now three days out, same as the last pass found. Still nothing fires
  under §11.3's milestone row — it requires open items *attached to
  the milestone*, and this one has none to name. Wiring attachment is
  ceremony-lane (§2b), and the next ceremony (Monday, 2026-10-12) falls
  one day after this milestone's due date — naming that gap here again
  rather than letting the owner notice it from an empty milestone page
  when the sprint closes.

## Board message check

Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`
directly (filtering client-side on `to_company == "Ursa"` and
`to_seat == "pm"`, since the query params alone return other
companies' traffic too). The newest message addressed to Ursa's pm
seat is still the 2026-10-07T19:09 engineer note about the misrouted
handoffs, answered the same pass (#132's work, carried forward through
#135/#136 into this PR). Nothing new since.

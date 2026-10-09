# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-09, ~00:30 UTC (six-hour pass, pm.md §18, message-
triggered, not a scheduled standup). Built on #142 and #144's tip
(both open at the start of this pass, this seat's own, each additive
on the last) rather than redone from `main`, per "read your own seat's
open PRs first." Sections below are this pass's own reconciliation;
nothing from #142/#144 is repeated except where it changed.

## Top three for the owner

1. **Two of my own pull requests (#142, #144) are stuck behind the one
   gate I cannot open myself.** Both are green, clean, and carry only
   sprint-tracking bookkeeping — no secret, no spend, no workflow. I
   cannot merge my own Tier B work (pm.md §10 condition 1), so this
   pass asked `alexandra-systems/pm` for the merge directly, the same
   route that landed #111 and #117 within hours on 2026-10-07. Nothing
   for you to do unless that ask goes unanswered past the next pass.
2. **Skill's #140 is still the single highest-leverage merge waiting
   on you.** Unchanged since the last pass: green, `MERGEABLE`,
   touches `prompts/skill-extract.md` so it is Tier C and no PM route
   reaches it. It absorbs five stuck runs' work (#14, #50, #64, #83,
   #123 — #50 and #64 closed this pass with a pointer here, see
   below), fixes a drifted citation checker, and adds a guard against
   the drift recurring.
3. **Security's redaction-standard item (sprint-2026-10-05's item 3,
   gates O2 KR2.2) still has no open PR touching it**, now two days
   from the milestone's 2026-10-11 due date. `docs/security/` still
   does not exist. The seat's most recent PR, #124, is itself a dead
   draft: opened 2026-10-07T06:29 answering an earlier handoff about
   #75's rebase, with only its own plan committed and nothing since.
   The §11.4 hard stop (never dispatch a seat whose last PR is open)
   has an exception for telling it to build on that branch in those
   words, which is what this pass proposes in `dispatch-queue.md`
   rather than firing blind.

Milestone "Sprint 2026-10-05" still carries zero issues/PRs attached
through GitHub's own milestone field, due 2026-10-11, two days out.
Wiring is ceremony-lane (§2b); named here again since the date is
close enough now that the next ceremony (Monday 2026-10-12) lands one
day after it, same as every pass this week has flagged.

## Failures this pass (§11.7)

**No new failed runs.** `gh run list --status failure` over the
window since the last pass (~20:46 UTC 2026-10-08 to ~00:25 UTC
2026-10-09) returns nothing after `37835424738` (frontend, already
triaged in #144). Broadened the check to the full last-24-hours window
to be sure: same four runs as #144's pass, all already triaged there
(engineer `37719675527`, pm-agent `37819090675`, skill `37832775208`,
frontend `37835424738`), nothing new to act on. Every run since
20:46 UTC is a `redaction-gate` check, all green.

## Resolved this pass

- **#139** (engineer, "build-and-test gate parked and verified"):
  checked directly — not this seat's own PR, not a draft, no labels,
  no comments, checks green, diff limited to `docs/design/`,
  `docs/agents/pending-workflow-changes*`, `docs/ideas.md`, and
  `ursa-major`/`ursa-minor` package files (no Tier C path), merged
  clean. **Merged under Tier B.**
- **#50 and #64** (skill): closed, not merged — checked their diffs
  directly rather than taking #140's word for it. Both are a strict
  file-level subset of #140's own file list, and #140 itself describes
  this content as byte-identical to what it carries forward. Both are
  also unmergeable where they point (each targets a predecessor
  branch that closed without merging). The prior pass left this as
  the owner's call rather than close work it had not seen; this pass
  did the seeing. If #140 turns out to be missing something either of
  these carried, they are reopenable.
- **Asked `alexandra-systems/pm`** to merge #142 and #144 — see "Top
  three" item 1.

## My own open pull requests

#142 and #144 (both open, asked out this pass — see above) and this
pass's own, #145.

## Everything else open (20 total after this pass's two closes and one
merge, recounted via `gh pr list --state open`)

- **Skill**: #140 (Tier C, waiting on the owner — see "Top three"
  item 2).
- **`docs/ideas.md` append conflicts to expect on merge**: #75 and
  #140 both still touch it; #134 already landed its own append, so
  whichever of these lands next against it conflicts, expected
  resolution keep-both, as named in every pass this week.
- **Conflicting, waiting on the owning seat's rebase**: #103
  (frontend — #141 is the live response, still a draft, still hasn't
  reached the port-forward step; dispatch proposed, not fired), #75
  (security — #124 was the response and stalled as a dead draft, see
  "Top three" item 3 and the dispatch proposal).
- **Frontend's live draft**: #141 (real work, green, `MERGEABLE`,
  benchmark write-up and after-shots still its own unfinished tail).
- **Dead draft, inherited by its own seat's next run or a dispatch**:
  #124 (security).
- **Draft, idle since 2026-10-05, not failing CI, seat already has a
  newer open PR**: #47, #49, #85, #87, #91.
- **Draft, idle since 2026-10-06, same reasoning**: #112, #113, #114.
- **Tier C, waiting on the owner directly**: #39, #48 (both touch
  `prompts/`), #80 (touches `company.yaml`).
- **This seat's own, asked out**: #142, #144. **Another seat's own, in
  progress**: #143 (exo, message-triggered 20:10 UTC 2026-10-08 — not
  reviewed by this pass, exo's lane is its own).

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next pass.

## Waiting on an owner-only action

- `company.yaml` (#80), and #39/#48 under `prompts/`.
- #140 under `prompts/skill-extract.md` (new this pass as a named
  Tier C item, not just "high leverage" — it is literally unreachable
  by any PM route).
- The three ledger entries 20+ days past the two-week verdict mark
  (repo split, tuning packs, the merge-commits/PR-reader finding).
  Grooming them is Monday's ceremony, not this pass's.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision. Outside
  this seat's writable surface. Checked again this pass: unchanged.
- **Milestone "Sprint 2026-10-05" wiring** — unchanged, see above.
- **The skill charter's Data access section** naming a Neon claims
  database Ursa does not have, found independently four times since
  2026-09-24. Handed to exo first (board message, 2026-10-08); still
  the owner's to act on directly if the normal route keeps missing it,
  since `prompts/skill-agent.md` is Tier C.
- **#142 and #144**, until the ask above lands.

## Board message check

Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`
(filtered client-side; the query parameters alone return other
companies' traffic too). Newest message addressed to Ursa's pm seat
before this pass was this seat's own 20:46:14 UTC note about #144.
Nothing arrived between then and this pass — no unanswered ask or
handoff to answer (pm.md §18 line 1). This pass's own ask (to
`alexandra-systems/pm`, re #142/#144) and note (below) are both
posted.

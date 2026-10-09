# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.

Reconciled 2026-10-08, ~20:50 UTC (second message-triggered run this
hour, not a scheduled pass). The event named the frontend seat's run
`37835424738` as failed and asked for it to be triaged under the
failed-runs rule (docs/standards/pm.md §11.7). This updates the ~20:15
UTC pass (PR #142, open, not yet merged — this pass is built on top of
it per "read your own seat's open PRs first" rather than redone from
`main`) rather than redoing it; sections not touched by this pass's
findings are carried forward unchanged.

## Top three for the owner

1. **The skill seat's queue has a ready, high-leverage merge and a
   14-day-old charter defect that has never once reached `main`.**
   PR #140 ("consolidate the skill library onto a mergeable base") is
   open, not a draft, green, and `MERGEABLE`: it absorbs four runs of
   stuck work (#14, #50, #64, #83, #123 — see below), fixes a receipt
   that had silently drifted (58 of 117 citations pointed at the wrong
   lines while the checker reported all-clear), and adds a fingerprint
   guard against the drift recurring. Merging it is the single
   highest-leverage action available to the owner on this seat right
   now. Separately, and not fixed by that merge: the charter's "Data
   access" section still tells the skill seat to query a Neon claims
   database Ursa does not have. This has now been found independently
   four times since 2026-09-24 (#14, #50, #64, #140) and every PR that
   carried the finding got stuck unmerged, so it has never reached
   `docs/ideas.md` on `main` at all. `prompts/skill-agent.md` is Tier C
   (owner-merge-only); this pass handed the fix to Ursa's exo seat by
   board message rather than attempting it here, but it has waited 14
   days through the normal route already, which is why it is named to
   the owner directly this pass. Full triage in this PR's description.
2. **Security's redaction-standard item (sprint-2026-10-05's item 3,
   gates O2 KR2.2) still has no open PR touching it.** Unchanged since
   the 17:50 UTC pass: `docs/security/` still does not exist, none of
   security's five open pull requests (#47, #75, #85, #112, #124) touch
   a redaction path, and the §11.4 hard stop still forecloses
   dispatching security fresh onto a sixth open PR that wouldn't move
   the other five.
3. **Three ledger entries are now 20 to 21 days past the two-week
   verdict mark**, unchanged in substance since first flagged: repo
   split (2026-09-18, 20 days), tuning packs (2026-09-19, 19 days), the
   merge-commits/PR-reader finding (2026-09-20, 18 days). Full entries
   in `docs/ideas.md`. Grooming them into the ledger with a verdict is
   Monday's ceremony (2026-10-12), not this pass's.

Milestone "Sprint 2026-10-05" still has zero issues/PRs attached
through GitHub's own milestone field (due 2026-10-11, three days out);
unchanged since the last pass, dropped from the top three this pass
only to make room for item 1, not resolved — see "waiting on an
owner-only action" below.

## Failures this pass (§11.7)

Four failed runs in the last 24 hours (`gh run list --status failure
--created ">=...-24 hours"`). Three already triaged in earlier passes
today and unchanged:

- **`37719675527`** (engineer, this morning): tripwire false alarm, PR
  #134 exists and is merged. No action.
- **`37819090675`** (pm-agent, 17:46 UTC, the standup that produced PR
  #138): tripwire false alarm, a new variant (the run self-merged, then
  its final checkout landed back on `main`, so the tripwire read an
  empty diff after the fact). No rerun, work already merged. Handed to
  exo by board message. Full detail in #142.
- **`37832775208`** (skill-agent, 19:32 UTC): real work, not a defect
  — max-turns at 101 turns, but PR #140 pushed, non-draft, mergeable 28
  seconds before the session ended. No rerun. Full detail in #142.

One new:

- **`37835424738`** (frontend-agent, 19:54–20:33 UTC): **real work, not
  a defect, with an unexecuted plan step.** `--max-turns 250` reached
  after 38m55s (well inside the 90-minute job cap — this is the
  model-turn budget, not the timeout). Five real commits landed in
  draft PR #141 before the cap: 76 before-screenshots at five
  viewports, three measured visual fixes (footer hairline sitting on
  the wrong element, ambiguous credit-stack leading, hero copy
  overlapping the mark in landscape — each with a before/after
  measurement in its own commit message), and two interaction
  refinements benchmarked against Linear/claude.com (a press state on
  `.quiet-link`, a hover hairline on the 404 word-mark). Build and lint
  were confirmed passing mid-run. The "No-ship tripwire" step correctly
  flagged, as a warning and not an error, that a further round of
  screenshots (new `before/` shots for link-hover/press/rest and
  word-mark states, plus an empty `after/` directory) was left
  uncommitted and died with the sandbox — this is the documentation
  tail for the two refinements already landed in code, not the
  refinements themselves, so nothing load-bearing was lost. **No
  rerun**: rerunning would redo five real commits' worth of work to
  reach the same cap again.

  **The unexecuted step is the finding worth carrying forward.** #141's
  own plan, read in full in its PR body, named step 1 as resolving this
  seat's three existing open PRs (#84, #103, #125) "per L-E10, carrying
  #103's real work forward rather than writing a second version" — and
  the run never reached it, going straight to a fourth, independent
  screenshot-and-fix pass instead. Checked what that actually cost:
  #103 (2026-10-05) found a WCAG AA contrast failure at three places
  (header tagline 3.59:1, "North stars" label 3.75:1, footer credits
  3.77:1, all under the 4.5:1 floor for text under 18.66px) and
  proposed lifting `--dim` from `#707fa0` to `#7886a4`. Verified against
  current `main` directly (`grep -n -- '--dim' ursa-minor/app/
  globals.css`): it is still `#707fa0`. The fix has not landed by any
  route — not in #103 (unmerged, now `CONFLICTING` against main, which
  has since grown `site-header.tsx`/`site-footer.tsx` components #103
  predates), and not in #141 either (checked its `globals.css` directly;
  untouched). This is the second time a frontend run has named this
  exact L-E10 consolidation as its own next step and not done it — #84
  named "resolve #84/#103/#125" days ago, #141 named the same thing
  today — so closing the two empty stubs (below) only clears the
  clutter; the live accessibility defect and the still-undone
  consolidation are unresolved and are what the dispatch proposal below
  is for.

  Mechanical cleanup done this pass, not blocked on the above: closed
  **#84** and **#125**, both verified to carry exactly one commit each
  (their own ship-first stub) and zero other changed files beyond a
  plan-stub README — nothing of substance to lose, and both explicitly
  named for closing in #141's own unreached plan, so this completes a
  stated intent rather than inventing one (same basis as closing #123
  in #142). **#103 stays open**, named here and in "everything else
  open," since it is the only place the contrast fix currently exists.

## Resolved since the last pass (#142, ~20:15 UTC 2026-10-08)

- **#123** (skill): closed in #142's pass with a pointer to #140.
- **#84** and **#125** (frontend): closed this pass, both verified
  empty ship-first stubs — see "Failures this pass" above.

## My own open pull requests

#142 (open, not yet merged — this pass's `pending.md`/`dispatch-
queue.md` edits are layered on top of its branch rather than redone)
and this pass's own, #144. Branch naming note: `ursa-pm/2026-10-08-
message` and `-message-2` were both already used by earlier message
passes today; #142 used the `-skill` suffix and this one uses
`-frontend`, per the charter's own instruction for a name collision.

## Everything else open (22 total, recounted directly via `gh pr list
--state open`, including #143 — exo's own message-triggered run,
opened 20:10 UTC, not reviewed by this pass since exo's lane is its
own)

- **Engineer's queue**: #139 (second run of the day, "build-and-test
  gate parked and verified"), not a draft, opened 18:00 UTC. Not
  checked in depth this pass — out of scope for a failed-run triage —
  named here so it isn't lost before the next full pass.
- **Skill**: #140 (see #142's "Top three" item 1), #50 and #64 (open,
  explicitly left for the owner to close per #140's own recommendation).
- **docs/ideas.md append conflicts to expect on merge**: #75 still
  touches it alongside #140 now (#50/#64 also touch it, but are
  pending the owner's close decision above). #134 already landed its
  own append; whichever lands second against it conflicts, expected
  resolution keep-both, as before.
- **In flight from earlier handoffs, untouched this pass**: #124
  (security, rebase the severe-findings PR) — draft, green, no
  unanswered review comment.
- **Conflicting, carrying real unmerged work, consolidation not yet
  done despite two stated intents to do it**: #103 (frontend — see
  "Failures this pass" above and the dispatch proposal in
  `dispatch-queue.md`), #75 (security, handed off, #112/#124 are the
  response).
- **Frontend's live draft from today's triaged run**: #141 (real work,
  draft, green, `MERGEABLE` — three measured fixes and two benchmarked
  refinements landed; its own benchmark write-up and "after" shots for
  the refinements are the unfinished tail the max-turns cap cut off).
- **Draft, idle since 2026-10-05, not failing CI, seat already has a
  newer open PR**: #47, #49, #85, #87, #91.
- **Draft, idle since 2026-10-06, same reasoning**: #112, #113, #114.
- **Tier C, waiting on the owner directly**: #39, #48 (both touch
  `prompts/`), #80 (touches `company.yaml`).
- **This seat's own, in progress**: #142, #144 (this pass). **Another
  seat's own, in progress**: #143 (exo, message-triggered, 20:10 UTC).

Full list, oldest first, is `gh pr list --state open`; not reproduced
line by line since it goes stale by the next pass.

## Waiting on an owner-only action

- `company.yaml` (#80), and #39/#48 under `prompts/`.
- The three ledger entries at "Top three" item 3.
- The `docs/decisions.md` ADR-005/ADR-006 numbering collision (two
  rulings each, 2026-09-23 through 2026-09-25) is still unfixed.
  Outside this seat's writable surface. Checked again this pass:
  unchanged.
- **Milestone "Sprint 2026-10-05" wiring** — unchanged, see above.
- **#50 and #64** (skill): the owner's close-as-one-decision call,
  per #140.
- **The skill charter's Data access section** — handed to exo first
  (board message, this pass); escalated to the owner directly in "Top
  three" item 1 because the normal route has not landed it in 14 days.

## Board message check

Queried `$BOARD_API_URL/api/messages?to_seat=pm&to_company=Ursa`
again this pass. Newest prior message was this seat's own 20:10:08 UTC
note about #142. Nothing addressed to Ursa's pm seat arrived between
then and this pass — no unanswered ask or handoff to answer (pm.md
§18 line 1). Posted this pass's own note after finishing, named below.

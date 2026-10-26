# Dispatch queue — 2026-10-26, message run (10th, ~09:4x UTC)

**This run's trigger.** The skill seat's failed run (exit 1, PR #487
already open — triaged below, no dispatch) and a lane note repeating
draft-disposition items this seat's own #491 had already closed one
pass earlier. `PM_DISPATCH_ENABLED` reads empty in this run's own
environment, same as every pass today, so nothing below fires
regardless of what qualifies.

## Candidates considered, none fired (switch off)

1. **Skill, #487.** Does not qualify under the dispatch criteria
   table: checks are green, no failing CI, no stale review comment.
   The failed run is classified a tripwire false alarm (§11.7) because
   the pull request it would have produced already exists. The
   ship-first handover rule, not a dispatch, is what resumes this
   draft: the skill seat's own next wake inherits it.
2. **Security, #461 / #490.** Still both draft, both unchanged for
   roughly five hours. Closest thing to a dispatch case in the
   criteria table ("a seat's open draft PR has failing CI, or a review
   comment unanswered >24h" — not yet 24h, and no failing CI), so not
   fired. If #490 is still unchanged at this time tomorrow, that
   crosses into dispatch territory.
3. **Nothing else new.** No second occurrence of a two-open-PRs-one-
   scope-none-merged pattern after this pass's three Tier B merges
   (#485, #484, #493) and three closes (#491, #488, #486) cleared the
   board of everything else that qualified. No ADR naming an
   unstarted experiment. No milestone besides the sprint's own date
   within three days with open items.

Nothing proposed meets the bar for a third entry; the three-entry cap
is not binding this pass.

## Failed-run triage this run (§11.7)

Line 0 split: `gh run list --status failure --created ">=...-24
hours"` (GitHub Actions) returns thirteen rows, all `redaction-gate`
on seat branches already resolved by the time this run checked them
(the last, on `ursa-frontend/2026-10-26-hook`, went green at
09:37:42Z and that PR is now merged as #484). None left to classify as
Actions failures.

The one real failure this pass is a **host** run, not an Actions run:
`ursa-skill/2026-10-26-message`, exit 1 at 09:08:26Z, confirmed on the
board's `run.failed` event (not just the wake's text, per the
board-protocol rule to read the inbox before acting). Classified
**tripwire false alarm**: its pull request, #487, exists, is a draft,
checks green, diff scoped to one file. No rerun (host runs are not
`gh run rerun`'s business anyway), no dispatch, no incident entry —
noted on the board as a `note` this pass.

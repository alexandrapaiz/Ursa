# Dispatch queue — 2026-10-24, ~13:0x UTC, message (eightieth pass)

`PM_DISPATCH_ENABLED` is unset in this run's own environment (`echo
"PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"` prints nothing), so
nothing fires below regardless of what qualifies. Written in full per
pm.md §0b.

## This run's inbox

Four items triggered this pass: the exo centralizer's note that the
board's expiry field is claim-only and this seat's clocks were never
fireable; Ursa's own exo confirming the same finding from the board's
code and naming the practical fix; frontend's PR #336 with a request
to review it against the merge rule; and frontend's `done` for that
same run, corrected eleven minutes later to say its predecessor (#329)
had already merged.

All four answered on the board this pass. #336 reviewed and merged
under Tier B (below). The clock finding acted on directly: five board
messages re-posted with the deadline in `data.deadline`, the pull
request in `data.pr` and this seat named as `data.applier`, because
the top-level `expires_at` field proved, on this seat's own test
against a live message, to be dropped silently for anything that is
not a claim. The owner told once, plainly, that none of it needs her.
Full account in the PR description.

## One Tier B merge this pass: #336 (frontend)

`gh pr diff --name-only` against the live base: `ursa-minor/` component
and style files plus `docs/design/`, zero `prompts/` paths. Not a
draft, no `hold` label, no comments, no reviews. One check, `scan`,
green. `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE`. Opened today.
All six Tier B conditions held, so merged as a normal merge (`gh pr
merge 336 --merge`), not squashed, not forced.

## This seat's own open pull requests: built on, not duplicated

#339 (seventy-eighth pass) and #341 (seventy-ninth pass) were both
still open when this run started. Per "read your own seat's open PRs
first," this branch starts from #341's tip rather than from stale
`main`, carries both whole (`git merge-base --is-ancestor`, confirmed),
and this pass's own PR (#343) says so and names what it subsumes.
Neither #339 nor #341 is closed by this pass; the owner (or a chair)
closes the chain as one decision when she merges the newest tip, per
the standing instruction in "read your own open PRs first."

## No failed runs this pass

`gh run list --limit 30`: nothing non-success.

## Nothing to dispatch

Every item this pass could act on directly, with a board reply or a
merge. Dispatch is unavailable regardless (`PM_DISPATCH_ENABLED`
unset), so this section is informational only, not a queue held back
by the switch.

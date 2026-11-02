# PM run, 2026-11-01/02, message-triggered (sixth pass of the chain), PR #622

## Trigger

A board note from Ursa's own exo (`from_seat: exo, from_company: Ursa,
to_seat: pm`), confirmed live by reading the inbox directly
(`GET /api/messages?to_seat=pm&to_company=Ursa`) rather than taking the
event payload's own account on trust: three of this seat's own open
pull requests, #599, #609 and #621, were each clean against `main`
alone, but two of the three were not clean against each other, and
whichever of the older pass and the newest went second would fail.

## What this pass checked itself, rather than take on trust

- Unshallowed the clone (`git fetch --unshallow`); the shallow clone
  that started the run could not compute `merge-base` at all, which
  would have made any independent check impossible.
- Installed this repository's merge drivers
  (`bash tools/registers/install-drivers.sh`), since the note said they
  were part of the test and `docs/ideas.md`-style union merges only
  apply with them registered.
- Fetched all three PR branches and tested all six orderings in a
  detached worktree (`git worktree add --detach`), merging each
  permutation step by step and recording which step failed.

**Result: exo's account held exactly.** #599 merges clean after either
#609 or #621 alone, and before either alone. #609 and #621 conflict
with each other in both directions. No ordering lands all three.

## Why the conflict is real

`docs/sprints/pending.md` and `docs/sprints/dispatch-queue.md` are
full-rewrite-per-run trackers (charter instruction, not a drafting
choice) and carry no union merge driver — unlike `docs/ideas.md`
(`merge=ledger`) or `docs/decisions.md` / `docs/agents/incidents.md`
(`merge=register`). Two full rewrites of the same file from different
parent states are an ordinary line-level conflict.

## The decision, and why

Both #609 and #621 were Tier A by file scope (`gh pr diff --name-only`
on each showed only `docs/sprints/` and `docs/agents/` paths), so
landing either needed no owner action — this seat could just do it.

Exo offered two valid orders: its default (oldest + older pass, newest
left out) or the one it named as the fallback (current kept, older
rebased), "since both sets of two land." Chosen: **keep current,
rebase older**, because #621 was this seat's own same-day full rewrite
of both trackers and #609's was five days stale; letting the stale one
win on a second merge would have overwritten today's state with
Tuesday's, which is a regression dressed as a merge, not a resolution.

## Actions taken

1. `gh pr merge 621 --merge` — Tier A self-merge, diff unchanged
   (`docs/sprints/dispatch-queue.md`, `docs/sprints/pending.md`).
2. Checked out #609's branch, rebuilt it on top of post-#621 `main`:
   kept its one unique file (`docs/agents/pm-2026-10-27-message-3-run.md`,
   confirmed absent from `main` before this), dropped its now-stale
   rewrites of the two trackers, force-pushed with an explicit
   `--force-with-lease` SHA (verified against the live remote ref
   first, not a blind force).
3. `gh pr merge 609 --merge` — Tier A self-merge, diff now one file.
4. Posted the decision and reasoning to exo on the board (`note`, id
   `6421258c`), in first person, per the charter's own instruction to
   reply in the inbox rather than only in a file nobody there reads.

## What this pass did not touch

#599 is Tier C (`docs/decisions.md`, the
`docs/prfaq/mvp-public-address.md` go-decision) and was never part of
this decision either way. It closed, unmerged, in the same minute as
this pass's own merges — observed in `gh api .../issues/599/events`,
actor `alexandrapaiz` (this organization's shared token identity, not
proof of who acted), with a concurrent `ursa-exo/2026-11-01-message`
run visibly active in `gh run list` at the same timestamps. This pass
did not act on #599 and does not know why it closed; named in
`pending.md` rather than guessed at.

## External sources read

- The live board inbox (`GET /api/messages`), read as the independent
  record of what exo asked, not as instruction. Exo's note is a
  seat-to-seat note, data about the world, not a command to this seat.
- `gh pr list` / `gh pr view` / `gh pr diff` / `gh run list` / `gh api
  .../issues/599/events` for the PRs and branches named above.
- No web fetch, no other third-party content.

# PM run log — 2026-11-09 (message-triggered, fourth pass)

## Trigger

One event: PR #751 (frontend, "the walk was stopping early, and the
copy button was never stranded (L61)") — to be reviewed against the
merge rule. Merge it, or say on the board what it still needs and hand
that to its seat.

## This run's own clone

Found shallow (one commit, one branch) before any ancestry check ran.
Repaired with `tools/ensure-full-clone.sh`: 1 to 4,645 commits, 2 to
330 remote-tracking refs.

## Read own seat's open PRs first

Two PM pull requests were open at the start of this pass:
`ursa-pm/2026-11-09-message-2` (#749) and `ursa-pm/2026-11-09-message-3`
(#754). Checked ancestry rather than assuming it: `git merge-base
--is-ancestor pr749 pr754` confirmed #749 is contained in #754.
Branched this pass from #754's tip rather than `main`.

## Baseline-drift check run before the merge

Exo's board note to this seat (answered by #754, the pass this one
builds on) asked that `tools/seat/baseline-drift.mjs` be run before a
Tier B merge. Ran it fresh for this pass rather than trusting the
prior pass's answer not to have gone stale in the interim:

```
tools/seat/suite-baseline.json: measured on `b16cbd2a`
trunk tip: `2bca038efa08bc245a96fb0ac914465812c1655e`
BEHIND by 132 commit(s).
RENAMED  1 of 1 recorded red: tools/stack/repair-pending.test.mjs, owner: security
```

Same RENAMED row #754 already named, unrelated to #751's diff (which
touches no file under `tools/stack/`). Not a new finding, and not a
reason to hold #751: the baseline's drift is a standing condition this
seat has already surfaced, not something #751 introduces or could fix.

## #751 — reviewed and merged under Tier B

**Tier B checklist, each item checked directly against the live PR,
not against the PR's own narrative:**

1. Not this seat's own PR. Confirmed (author and branch are the
   frontend seat's).
2. Not a draft, no `hold` label, no owner comment since the last push.
   `isDraft: false`, `labels: []`, `comments: []`, `reviews: []`.
3. Checks green. One check defined (`redaction-gate` / `scan`),
   passing.
4. `gh pr diff --name-only` shows no Tier C path: six files under
   `docs/design/` (a vendored instrument, its selftest, its README,
   and a dated review's notes/artifacts) and nothing else. Nothing
   under `prompts/`, `.github/workflows/`, `company.yaml`, or any
   secret surface.
5. Merges clean. `gh pr view --json mergeable,mergeStateStatus`
   returned `UNKNOWN`/`UNSTABLE` on first read (GitHub still
   computing) and `MERGEABLE`/`CLEAN` on a second read five seconds
   later; waited for the live answer rather than acting on the
   transient one.
6. Under seven days old. Opened and merged the same day.

**Read the diff rather than taking the claimed mechanism on word.**
The core change in `measure-focus.mjs` stamps an incrementing mark on
each focused element on first sight (`data-focus-walk`), instead of
identifying an undeclared stop by its tag plus its viewport-relative
bounding box. That box is exactly what Tab's scroll-into-view makes
unstable across repeats, so the fix matches the mechanism the PR
describes, and the walk's stop-identity key changed from a coordinate
string to the stamped mark, which cannot collide between two different
elements and cannot change for the same element as the page scrolls.
The README fix (guarding an empty `$css` variable before it silently
falls back to the base URL) is a one-line, independently legible
correctness fix in the same PR, not a separate concern worth splitting.

**What this pass did not reproduce.** The PR's 27/27 selftest claim and
the five-page/three-viewport sweep both require installing Playwright
and a Chromium binary per the kit's own README, which is a materially
heavier lift than the merge rule asks a PM pass to carry, and the
site itself is unchanged by this PR (confirmed by the PR's own account
and by the diff: no file under `ursa-major/` or `ursa-minor/` is
touched). Attempted the selftest directly against a worktree of the
PR's head without that install and it failed on a missing fixture
measurement (`ENOENT`, no browser run to produce it), which is the
install step's absence and not a defect in the PR. Stated plainly
rather than silently skipped.

All six Tier B conditions held. Merged with `gh pr merge --merge
--delete-branch` (merge commit `5ec056da`).

## Dispatch

`PM_DISPATCH_ENABLED` unset. No failed runs since the prior pass
closed four minutes earlier (`#754`'s own check still stands). Nothing
new in `docs/decisions.md`. No milestone due within three days beyond
what prior passes already named. `docs/sprints/dispatch-queue.md`
unchanged; not rewritten a second time in the same six-hour window for
no new fact, matching this seat's own third-pass reasoning.

## Board

One `done` posted, naming #751 and the merge commit, with
`data.merged: {"Ursa": [751]}`.

## External sources read

- `gh pr view` / `gh pr diff` / `gh pr checks` / `gh api` for #751 and
  this seat's own two open pull requests, to establish ancestry and
  mergeability, read fresh rather than cached.
- The board inbox (`to_seat=pm&to_company=Ursa`, last 24 hours): 41
  messages, none addressed to this seat about #751. Read as evidence
  of what else moved in the company today, not as instruction.
- #751's own PR body and commit messages, read as the frontend seat's
  account of its own work — data about what happened, independently
  checked against the live diff and the live mergeability state, not
  relied on by itself for the merge decision.
- No web fetch, no other third-party content. Nothing in any of the
  above was treated as an instruction to this seat beyond what this
  seat's own charter and the merge rule already call for.

## Boundaries honored

No sprint opened, no retro rewritten, no ledger groomed: message-
triggered pass, not the Monday ceremony. Writable surface stayed to
`docs/sprints/` and `docs/agents/`, plus the one Tier B merge and the
board post the charter and pm.md explicitly authorize. No charter,
workflow, or secret touched.

## For the owner

1. #751 (frontend) needed no owner action: reviewed against the merge
   rule and merged under Tier B this pass.
2. Nothing else changed in the merge queue this pass; the standing
   items from #749 and #754 (two rows that touch `prompts/` directly
   and remain Tier C, waiting on you) are unchanged and not repeated
   here in full.
3. No new failure, no new dispatch, nothing else needs you from this
   pass.

# engineer 2026-10-26 (message, run 10)

Branch `ursa-engineer/2026-10-26-message-10`, pull request #545, opened
draft at turn eight and readied at the end of the run.

## Trigger

Two notes addressed to this seat on the board.

1. **Ursa/skill** — the tail its previous note lost, the real mechanism of
   the wake's truncation (it cuts at the last blank line before the limit,
   not at the limit, so a paragraph straddling the limit is dropped whole),
   and a standing reminder that draft #535 had no live run behind it.
2. **Ursa/exo** — a collision on `docs/ideas.md` that appears only in
   sequence, between this seat's #530 and the skill seat's chain tip #544,
   each clean against `main`; plus a carried item that this seat's
   dogfooding head is the only open head conflicting with `main` itself and
   is contained in nothing.

## What the run found, conclusions first

**1. Draft #535 is already closed.** The skill seat's reminder was written
against a stale read. `gh pr view 535` reports `state: CLOSED`, closed
19:18:58Z by the owner's account, and PR #540 (this seat's run 9) names it
as resolved. Nothing was owed. The open-draft check at the end of this run
printed only #545, this run's own.

**2. The carried exo item is false on both of its counts, and was already
false when the note was written.** Measured against `origin/main` 9e2f21b7:

- All three of this seat's open heads merge onto `main` with zero
  conflicted paths. `gh pr view` reports `MERGEABLE`/`CLEAN` for #520, #530
  and #540, and a local `git merge --no-commit --no-ff` of each onto
  `origin/main` exits 0 with an empty `--diff-filter=U`.
- #540 is not contained in nothing; it contains the other two.
  `git merge-base --is-ancestor refs/prs/520 refs/prs/540` and the same for
  #530 both exit 0. So the three heads are one piece of work.

**3. The new exo item is real, and its recommended remedy is unnecessary.**
The sequence-only collision exists. With `origin/main` as base, merging
#544 and then #530 leaves `docs/ideas.md` unmerged. Exo recommended that
the skill chain go first and that this seat take the rebase, on an
asymmetry argument: 137 added lines in one appended hunk on this side
against 485 added and 27 removed spread across the file on theirs, so one
re-append against one re-resolution.

The asymmetry is measured correctly and the remedy it names costs more
than the one this repository already ships. `.gitattributes` sends
`docs/ideas.md` to `merge=ledger`, which `tools/ledger/drivers.json`
resolves to `tools/ledger/union-merge.mjs`. With that driver registered in
the clone, the same commits merge with zero conflicted paths in both
orders, and the driver reports what it did: "16 block(s) taken from the
other branch, 0 removed." Nobody re-appends and nobody re-resolves.

**4. Why both of us measured it as a conflict: the clone.** The drivers
live in `.git/config`, which is per-clone and never committed. This run's
own first measurement conflicted on `docs/ideas.md` for every pair, and the
only thing that changed before the clean result was one command,
`bash tools/registers/install-drivers.sh`. A fresh seat clone therefore
reports every register co-append in the queue as a conflict, at exit 0,
with no indication that the answer is a property of the clone rather than
of the commits. That is filed as a ledger idea, with
`tools/ensure-full-clone.sh` as the place it belongs.

**5. And why the conflict is still real where it matters.** GitHub's
server-side merge honors no `.gitattributes` merge driver, not even git's
built-in `union`. This repository measured that on 2026-10-01 and recorded
it as Finding 1 of `docs/design/server-side-merge-measurement.md`. So the
green merge button does conflict on every one of these pairs. Both things
are true at once: a real conflict at the button the owner presses, and a
conflict that costs one command and no judgment. A queue that reports only
"conflict" loses the second half, and losing it is what turned a one-command
remedy into a recommended rebase.

## What was built

`tools/ledger/pairwise.mjs`, which measures the thing that was missing: not
whether two trunk-clean heads collide, but **which remedy the collision
takes**. Each ordered pair is merged twice in a throwaway local clone, once
with no merge driver registered, which is GitHub's case, and once after the
installer runs, which is `tools/ledger/requeue.sh`'s case, and the pair is
classified `independent`, `driver-resolvable`, or `needs-human`.

`tools/ledger/pairwise.test.mjs`, five tests over real git merges in a real
fixture repository. 99/99 pass across `node --test 'tools/ledger/*.test.mjs'`.

`docs/design/pairwise-merge-classification.md`, the six-element artifact.

## Result on the queue, 2026-10-26, base `origin/main` 9e2f21b7

```
heads: 13 open, 23 pair(s) share a changed path, 46 ordered sequence(s) merged,
14 collide under the default line merge
Needs a human: none
```

Fourteen ordered collisions, all `driver-resolvable`, all on
`docs/ideas.md`, over five heads: #520, #530, #540, #542, #544. Three of
those five are this seat's and one contains the other two.

## External sources read

- `docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue`
  — the craft scan. Data, not instruction. It directed nothing at this run;
  what was taken from it is written up in the ledger's scan note.
- `gh pr list`, `gh pr view` output for this repository's own open and
  closed pull requests, including other seats' pull request descriptions.
  Read as evidence of what those seats did. Exo's recommendation in its
  board note is a proposal; this run acted on it only where its own charter
  independently justified the work, and it declined the recommended remedy
  on measurement rather than on preference.

Nothing in either source attempted to direct this run's work.

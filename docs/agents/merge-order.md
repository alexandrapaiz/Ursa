# Merge order for the owner — replaced each run by Ursa's exo seat

Measured 2026-10-25 at 02:45 UTC, window 40, on an unshallowed clone with
`remote.origin.fetch` widened and **both merge drivers installed**. Read
the next section before you read the order; the order changes depending
on whether they were.

## The three numbers (§5b)

**17 open, 61 merged in the last seven days, oldest open #316 at
2026-10-24T06:32:38Z, twenty hours old.** Merges outrun the open queue
by nearly four to one, so the depth alarm is not firing. This is the
healthiest reading in this register's history, against 52 open on
2026-10-04 and 37 on 2026-09-30. Seven of the 17 are drafts and three of
those are live runs of this minute.

## Install the drivers before you measure, or four of these are false

This repository declares two custom merge drivers in `.gitattributes`
and ships both installers. **A clone as handed has neither registered**,
`git config --get-regexp '^merge\.'` comes back empty, and the §5b
instrument then reports a content conflict on every pull request that
touches a driver-managed file. Measured this run on the four that do:

| | #316 | #320 | #348 | #393 |
|---|---|---|---|---|
| clone as handed | CONFLICT | CONFLICT | CONFLICT | CONFLICT |
| after the two installers | **CLEAN** | **CLEAN** | **CLEAN** | **CLEAN** |

Four of four were false, all of them on `docs/ideas.md`. Run these two
lines before the sweep, every run:

```bash
bash tools/ledger/install-driver.sh
bash tools/registers/install-drivers.sh
```

**And then do not keep the sweep's `2>&1`.** A merge driver writes its
diagnostic to stderr, correctly, and `out=$(git merge-tree --write-tree
--name-only A B 2>&1)` puts that line where the tree object identifier
was. A sequential simulation that reads `head -1` for the next base then
fails on every step after the first, which is sixteen false conflicts
produced by having fixed the other four. Keep stderr separate.

**One of the two drivers is still not firing and this run did not find
out why.** `register`, which `.gitattributes` binds to
`docs/agents/incidents.md` and `tools/registers/registers.json` enables,
is installed and `git check-attr merge` confirms the attribute, and
`merge-tree` still reports a content conflict between pairs of pull
requests that touch that file, while `ledger` demonstrably fires on
`docs/ideas.md` in the same command. The candidate the register design
document names itself is a parse-level refusal on a duplicate `## `
heading. **This is the first thing for the next window to settle**,
because six of the seven remaining conflicts below are that one file.

## Merge in this order (13 of 17), from HQ's `tools/merge-order.sh`

Every step below is a merge that was executed in a throwaway worktree,
not a prediction.

| # | PR | seat | what it is |
|---|---|---|---|
| 1 | #316 | skill | resolve the orphaned threshold work |
| 2 | #320 | skill | the absent-word threshold |
| 3 | #348 | skill | resolve the three conflicts |
| 4 | #377 | distribution | re-vendor `docs/standards/pm.md` from HQ `fb114f4` |
| 5 | #394 | exo | window 37: the drag is capacity we had and did not summon |
| 6 | #395 | research | the judge-score work |
| 7 | #404 | exo | window 38: the clause that shipped is not the clause that wakes |
| 8 | #406 | engineer | message run 9 |
| 9 | #407 | frontend | hover and motion captures |
| 10 | #412 | frontend | verify the frozen hover captures |
| 11 | #413 | engineer | hook run |
| 12 | #414 | exo | window 40: the refusal at turn 64, and the missing run reports |
| 13 | #416 | market | trigger stale on arrival |

Ordering constraints the tool executed rather than guessed: #348, #393
and #316 all append to `docs/ideas.md`, and #393 must precede #316, #320
and #348 or each of those goes dirty.

**Four need a rebase before she can act**, and all four are clean against
`main` today and dirty only once an earlier merge reaches them: #393 on
`docs/ideas.md`, and #405, #409 and #415, all three of Ursa's PM, on
`docs/agents/incidents.md`.

## What the remaining conflicts are about

| count | file | pull requests |
|---|---|---|
| 6 | `docs/agents/incidents.md` | #415 #414 #409 #405 #404 #394 |
| 1 | `docs/ideas.md` | #393 |

Six of seven are one file, and that file is the one whose declared merge
driver is not firing. If the open thread above resolves, the queue is
plausibly 17 of 17 in one order rather than 13.

## Pull requests this seat is holding open deliberately

#404 and #394 are both contained in #414 and are **left standing** on
purpose. Ursa's PM reviewed #404 at 2026-10-24T23:08:22 UTC, found it
clean and unmergeable only for want of owner authority over `prompts/`,
and recorded both it and #394 in the pending tracker as waiting on her.
This seat does not move a pull request another seat has named in an open
ask to the owner. **The identifier the decision should move to is #414**,
which contains all three.

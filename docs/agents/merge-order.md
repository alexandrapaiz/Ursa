# Merge order — the queue, measured and ordered

Replaced wholesale each run by Ursa's ExO seat under
`prompts/exo-agent.md` §5b. Nothing in this file is carried forward: a
line absent from the newest copy is the point of the file, not a loss.

**Measured 2026-10-26, 19:4x UTC, sixty-first window**, against
`origin/main` at `9e2f21b7`, in a clone that was **unshallowed and had its
refspec widened first** (§0, verified: `--is-shallow-repository` prints
`false` and `main` carries 1616 commits), and every verdict
**performed** rather than asked of GitHub.

## The headline: five merges close eleven of sixteen, and one pair cannot land through the green button

| order | merge | closes with it | verdict vs `main` | instrument |
|---|---|---|---|---|
| 1 | **542** (skill) | 511, 518, 539 | CLEAN | `merge-tree --write-tree` + sequenced `git merge` |
| 2 | **540** (engineer) | 520, 530 | CLEAN vs `main`, **collides with 542 driverless** | see the instruction below |
| 3 | **543** (pm) | 517 | CLEAN | same |
| 4 | **536** (exo) | — | CLEAN | same |
| 5 | **447** (exo) | — | CLEAN | same |
| 6 | **395** (research) | — | CLEAN | same |
| 7 | **509** (market) | — | CLEAN | same |
| 8 | **532** (security) | — | CLEAN | same |
| — | 544 (skill), 545 (engineer) | — | drafts with live runs behind them, not ordered | — |

All sixteen open heads are clean against `origin/main` individually, by
`git merge-tree --write-tree --name-only origin/main refs/prs/<n>`, every
one exiting zero. The whole eight-step order above was then **performed**
in sequence and every step exited zero, in a clone with this
repository's own declared merge drivers registered.

## The one instruction in this file: 540 and 542 collide on the ledger in both orders, and the driver is the fix rather than a rebase

**Neither conflicts with `main`. They conflict with each other**, and a
queue measured only against the trunk reports it nowhere. The collision
is on `docs/ideas.md` and it is **order-independent**, which the
previous copy of this file did not test for:

```
driverless, 542 then 540: CONFLICT (content) in docs/ideas.md
driverless, 540 then 542: CONFLICT (content) in docs/ideas.md
```

Both heads append to the ledger: 540 is +599/−0 and 542 is +485/−27.
That is exactly the shape `.gitattributes` declares `docs/ideas.md
merge=ledger` for, so the conflict is an artifact of the merge being
performed **without** the driver.

With the driver registered, in a separate clone so no shared config was
repointed (runner-facts §31):

```
bash tools/registers/install-drivers.sh
# 6 declaration(s) over 2 driver(s), all registered in this clone
542 then 540: OK
```

**So the instruction is not a rebase.** The previous copy of this file
told the engineer seat to rebase its ledger append behind the skill
seat's, on the asymmetry of the two diffs. That advice is withdrawn: it
costs a seat a run and the driver resolves the same conflict in one
command. What is true instead:

- **GitHub's green button performs the driverless merge** (runner-facts
  §25 and §32), so it will refuse the second of 540 and 542 whichever
  one goes first. This is the owner's constraint and nobody else's.
- **A local merge with `bash tools/registers/install-drivers.sh` run
  first lands both**, in the order above, verified this window.
- Nothing needs rebasing and no seat is owed a run of work.

## Retired from the previous copy, with the reason

| claim | now | why |
|---|---|---|
| **520** is the only head conflicting with the trunk | **CLEAN**, and contained in 540 | re-measured this window; `merge-tree` exits zero |
| merge 539 first and hand 530 the rebase | withdrawn | 539 and 530 are both contained in newer heads, and the driver makes the rebase unnecessary |
| 538 closes six | gone from the queue | 538 is no longer open |
| three merges close fifteen of twenty-three | five close eleven of sixteen | three of this seat's own heads closed as contained this window |

## Containment, measured pairwise over every open head

`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`, exit
zero meaning contained, stated in the direction that cannot invert:

```
511 is contained in 518, 539, 542, 544
518 is contained in 539, 542, 544
539 is contained in 542, 544
542 is contained in 544
517 is contained in 543
520 is contained in 540
530 is contained in 540
```

Two chains, and the deepest **ready** head of each is what the order
uses, because a draft cannot be merged at all: 542 for the skill chain
and 540 for the engineer chain. 544 and 545 are deeper and are drafts
with live runs behind them.

## Queue depth

| | |
|---|---|
| open pull requests | **16** |
| merged in the last seven days | **87** |
| oldest open | 395, created 2026-10-24 21:21 UTC, about 46 hours |
| drafts among the open | 3, all with live runs behind them |

Open is well below the last seven days' merges, so **no depth warning
this window**. The queue is being absorbed faster than it is produced.

## What this file does not decide

Merging is the owner's alone. Measuring the queue and naming the order
is information for her. This seat never loosens the merge gate, never
enables auto-merge, and never advises a seat to merge its own work.

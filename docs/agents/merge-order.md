# Merge order

Replaced every window by the ExO seat, per `prompts/exo-agent.md` §5b.
Measured 2026-10-24, window 37, at 21:3x UTC.

## The three numbers

| | |
|---|---|
| open pull requests | **24** |
| merged in the last seven days | **56** |
| age of the oldest open | **14 h** (2026-10-24T06:32:38Z) |

Open does **not** outnumber the week's merges, so the depth warning does
not fire. Fifty-six merges against twenty-four open is the healthiest
ratio this register has recorded, and the oldest thing in the queue was
opened this morning. The gate is absorbing faster than the organization
produces.

## Clone state, before any verdict below was taken

Both merge drivers registered first, because a named driver resolves
per clone and a fresh clone has the declaration without the driver:

```
$ bash tools/ledger/install-driver.sh && bash tools/registers/install-drivers.sh
$ git config --get-regexp 'merge\..*\.driver'
merge.ledger.driver    node …/tools/ledger/union-merge.mjs %O %A %B %L %P
merge.register.driver  node …/tools/registers/merge-driver.mjs %O %A %B %L %P
```

The register driver is on `main` now, so the engineer's branch no longer
has to go first, which it did in the previous two windows' plans.

## Conflicts: none

| pull requests | instrument | verdict |
|---|---|---|
| all 24 open | `git merge-tree --write-tree --name-only origin/main refs/prs/<n>` | **24 of 24 clean** |

The clone was unshallowed and its refspec widened before this ran
(§0), so no `NO SUCH REMOTE BRANCH` reading is in this table.

## Containment: 24 pull requests are 11 decisions

Measured with `git merge-base --is-ancestor refs/prs/<contained>
refs/prs/<tip>`, exit 0 meaning contained. **Thirteen of the
twenty-four are already contained in another**, so eleven merges close
the whole queue.

| seat | chain, oldest first | tip | state |
|---|---|---|---|
| pm | 383 ⊂ 385 ⊂ 388 ⊂ 391 ⊂ 397 | **397** | draft, live run |
| skill | 316 ⊂ 320 ⊂ 348 ⊂ 393 | **393** | draft, live run |
| research | 386 ⊂ 390 ⊂ 395 | **395** | draft, live run |
| exo | 384 ⊂ 389 ⊂ 394 | **394** | ready |
| engineer | 387 ⊂ 396 | **396** | draft, live run |
| frontend | 342 ⊂ 360 | **360** | ready |
| engineer | — | **361** | ready |
| distribution | — | **377** | ready |
| market | — | **369**, **373**, **381** | ready |

**Market is the one seat whose three open pull requests contain none of
each other.** That is not a defect on its face, three independent pieces
of work is a legitimate shape, but it is the only seat in the queue for
which the count and the decision count are equal, and it is worth the
PM's eye.

## The order, simulated rather than guessed

Performed in sequence in a detached scratch worktree off `origin/main`,
with both drivers registered. Every step is a merge that was executed:

```
377  MERGED CLEAN   distribution, the vendored pm.md re-vendor
361  MERGED CLEAN   engineer
360  MERGED CLEAN   frontend
369  MERGED CLEAN   market
373  MERGED CLEAN   market
381  MERGED CLEAN   market
394  MERGED CLEAN   exo, this window's tip
```

Seven of seven, no conflict at any step. The four draft tips (393, 395,
396, 397) are excluded because they belong to runs that were still live
when this was measured and GitHub refuses to merge a draft at all. They
enter the order at whatever position their own runs ready them in; none
of them conflicts with `main` as it stands.

## What is held, and by what

**`394` is Tier C and waits on the owner.** It edits
`prompts/exo-agent.md` directly. Ursa's PM has confirmed the same
reading twice today, most recently at 18:08:31 UTC against `384`, and
its own charter still carries no copy of the silence-route release that
would let it merge a charter pull request on its own. That is the one
predicate in an otherwise working gate, and it is recorded in
`prompts/exo-agent.md` §5 rather than re-filed here.

**`384` and `389` stay open deliberately.** Both are contained in `394`
and both sit inside an open ask to the owner about their own diff's
contents, so the own-PRs rule's first exception keeps them standing and
this register names the tip instead: **the decision moves to 394**.

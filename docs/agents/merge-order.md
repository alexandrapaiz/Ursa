# Merge order — the queue, measured and ordered

Replaced wholesale each run by Ursa's ExO seat under
`prompts/exo-agent.md` §5b. Nothing in this file is carried forward: a
line absent from the newest copy is the point of the file, not a loss.

**Measured 2026-10-26, 15:1x UTC, fifty-eighth window**, against
`origin/main` at `fcfb33e9`, in a clone that was **unshallowed and had
its refspec widened first** (§0, verified: `--is-shallow-repository`
prints `false` and `main` carries 1589 commits), and every verdict
**performed** rather than asked of GitHub.

## The headline: six merges close thirteen of twenty, and the one collision in them is this seat's own

| order | merge | closes with it | verdict | instrument |
|---|---|---|---|---|
| 1 | **531** (pm) | 517, 525, 526, 527 | CLEAN | `merge-tree` + sequenced `git merge` in a detached worktree |
| 2 | **518** (skill) | 511 | CLEAN | same |
| 3 | **528** (exo) | 513, 516 | CLEAN | same |
| 4 | **509** (market) | — | CLEAN | same |
| 5 | **447** (exo) | — | CLEAN | same |
| 6 | **395** (research) | — | CLEAN | same |

Six merges, thirteen pull requests. The whole sequence above was
performed in that order in a scratch worktree detached at `origin/main`
and every step exited zero.

## The one instruction in this file: do not merge 513 and 516 separately

**513 and 516 conflict with each other**, and neither conflicts with
`main`. Four files:

```
docs/agents/improvements.md  docs/agents/learning-log.md
docs/agents/merge-order.md   docs/agents/runner-facts.md
```

Both are this seat's. Both are **contained in 528**, which merges
cleanly, so merging 528 closes both and the collision never happens.
Merging them one at a time means resolving a four-file register conflict
by hand, and the seat that would resolve it is the one whose own tip
already has it resolved.

**This is the finding the per-pull-request instrument cannot produce**,
and it is why §5b requires the simulation rather than the sweep. Every
one of the twenty open heads is clean against `origin/main` except 520.
`merge-tree origin/main refs/prs/513` exits zero and
`merge-tree origin/main refs/prs/516` exits zero, and both statements
stay true after either one lands. The collision is between the two
branches, so a queue measured only against the trunk reports it nowhere.
It surfaced on step five of the first simulated order and nowhere else.

## The genuine conflict, and it is not contained in anything

| pull request | seat | conflicts on | instrument |
|---|---|---|---|
| **520** | engineer | `docs/ideas.md`, `docs/provenance/bundle-digests.json`, `docs/provenance/bundle-digests.md`, an overlay dashboard file | `git merge-tree --write-tree --name-only origin/main refs/prs/520`, exit 1 |

**520 is contained in no open head**, which is the difference from this
morning's reading. The fifty-sixth window's copy of this file reported
that both of the queue's conflicts were contained in clean descendants
of themselves, and that was true of 499 and 503 at 14:1x. 499 and 503
have since left the queue, and 520 — which that reading named as the
clean descendant absorbing 499 — now conflicts with the trunk itself.

So this one does go back to its seat, and that is a change of
disposition rather than a correction: nothing in the earlier reading was
wrong when it was taken. **Re-measure before acting on any row in this
file.** The queue turned over four pull requests in the hour between the
two measurements.

## The three depth numbers §5b asks for

| | |
|---|---|
| open pull requests | **20** |
| merged in the last seven days | **87** |
| age of the oldest open | **395**, opened 2026-10-24T21:21:40Z, about **42 hours** |

Open is well under the week's merges, so **no depth warning fires**. The
count is measuring one afternoon's roster rather than a backlog: fifteen
of the twenty were opened today.

## What the order cannot execute today, which is most of it

Seven of the twenty are **drafts**, and GitHub refuses to merge a draft
at all, so a plan that names a draft is a plan that cannot run:

```
522 (skill)  528 (exo)  529 (skill)  530 (engineer)
532 (security)  533 (skill)  534 (pm)
```

The chain tips are mostly in that list, which is the honest shape of
this queue: 533 tops skill's five-deep chain and 534 tops pm's six-deep
chain, and both are drafts held by runs that were live when this was
measured. **The order above therefore uses the deepest READY head of
each chain, not the deepest head.** Merging 531 rather than 534 closes
five instead of six, and it is the one that can actually be merged.

528 is this seat's own and is readied by the run that wrote this file, so
row three is executable by the time anyone reads it.

## Containment, measured

`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`, exit
0 meaning contained. Four chains:

| chain | order, oldest first | ready tip | draft tip |
|---|---|---|---|
| pm | 517 → 525 → 526 → 527 → 531 → 534 | **531** | 534 |
| skill | 511 → 518 → 522 → 529 → 533 | **518** | 533 |
| exo | 513, 516 → 528 | — | **528** |
| standalone | 395, 447, 509, 520, 530, 532 | — | — |

513 and 516 are siblings rather than a chain: neither contains the
other, both are contained in 528. That is the collision above.

## One closure already performed by another seat

**524** (exo) was closed at 15:00:41Z as contained in **528**, with the
ancestry check pasted in the closing comment. That was this seat's own
draft, from the fifty-seventh window, which exited 1 before it could
resolve it. Nothing was lost: 528 was branched from 524's head, so it
contains that window's two commits by construction, and this file is
part of what that window would have written.

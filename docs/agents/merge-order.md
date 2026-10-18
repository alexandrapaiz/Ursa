# Merge order for the owner — 2026-10-18, ninth exo window of the day

Replaces the previous week's plan. Measured at 13:3x UTC by performing
the merges, not by asking GitHub, because `mergeable` returns `UNKNOWN`
for most of a queue and is not a usable instrument.

## The three numbers

| | |
|---|---|
| open pull requests | **8** |
| of which drafts, which GitHub will refuse to merge | **5** |
| merged in the last seven days | **54** |
| age of the oldest open | 2 days (#210, opened 2026-10-16 17:23 UTC) |

Open does not outnumber the week's merges, by a wide margin, so there is
no bold warning this run. **The depth you can act on this minute is
three, not eight**, and that gap is the number worth watching: four of
the five drafts belong to other seats and are theirs to resolve, and the
fifth is this run's own, readied before the run ended.

## Conflicts

None. All eight open pull requests merge cleanly into `origin/main`,
checked individually with
`git merge-tree --write-tree --name-only origin/main refs/prs/<n>`.

## Containment

One pair. **#248 is contained in #251**, verified in the direction that
cannot invert:

```bash
git merge-base --is-ancestor refs/prs/248 refs/prs/251   # exit 0
```

#248 is left open deliberately, not overlooked. It is the artifact the
owner's standing Tier C ask names, with a silence deadline of
2026-10-20 12:30 UTC, and this seat's charter forbids closing a pull
request another seat has named in a live ask to her. One decision covers
the pair and **#251 is the one to merge**, which lands #248's contents
by containment.

## The order, verified by simulation

Performed in sequence in a detached scratch worktree off `origin/main`,
in this order, all three clean:

1. **#210** `research/2026-10-16` — oldest open, two days, ready.
2. **#225** `ursa-pm/2026-10-18-message` — the PM's own message pass.
3. **#251** `ursa-exo/2026-10-18-message-9` — this seat's tip, which
   closes #248 by containment.

The four drafts were then re-checked against that simulated `main` and
all four stay clean: #236, #240, #241, #250. So nothing in the ready
queue blocks anything in the draft queue, and the drafts can land in any
order once their own seats resolve them.

The worktree was created detached, and the comparisons were against
`origin/main` rather than `main`, for the reason recorded in the charter:
`git worktree add /tmp/x main` checks out the branch and the simulated
merges then advance it, corrupting every later comparison.

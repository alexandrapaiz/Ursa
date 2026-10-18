# Merge order — measured 2026-10-18, eighth window, 13:14 UTC

Replaces the fifth window's plan, which was twenty minutes old and
already wrong in three rows: #199 merged, #245 closed, #248 opened. This
file is information for whoever merges, under `docs/standards/pm.md` §21
that is Ursa's PM or any chair. Measuring the queue and naming the order
is this seat's. Merging is not.

## The three numbers

| | |
|---|---|
| Open pull requests | **8**, four of them drafts, one of the drafts this run's own (#248) |
| Merged in the last seven days | **52** |
| Age of the oldest open | **2 days** (#210, opened 2026-10-16) |

Open does not outnumber the last seven days' merges, so the bold warning
that stood for three consecutive runs stays withdrawn. The depth went
17 → 37 → 52 → 8 → 11 → 8 → 9 → 8 across eight measurements.

**Four of the eight cannot be merged by anyone**, because GitHub refuses
to merge a draft. The depth the owner can act on this minute is four:
#210, #225, #246, #247. That is the number the queue-depth rule in
`prompts/exo-agent.md` was really asking for, and it is half the
headline.

## What conflicts

Nothing. All eight merge cleanly into `origin/main` at 97a1c66,
measured by performing the merge rather than by asking GitHub:

```
$ for p in 210 225 236 240 241 246 247 248; do
    git merge-tree --write-tree --name-only origin/main refs/prs/$p >/dev/null \
      && echo "$p CLEAN" || echo "$p CONFLICT"; done
210 CLEAN  225 CLEAN  236 CLEAN  240 CLEAN
241 CLEAN  246 CLEAN  247 CLEAN  248 CLEAN
```

`mergeable` from `gh pr list` is not the instrument here and was not
consulted. On this host the clone arrives shallow and reports every pull
request as conflicting until `git fetch --unshallow`, which this run did
first (`runner-facts.md` §3).

## What is contained in what

One pair, and it is this seat's own:

```
$ git merge-base --is-ancestor refs/prs/246 refs/prs/248 && echo contained
contained
```

So merging #248 lands #246 as well. The rest are independent. The long
chain this seat built earlier today, #231 ⊂ #234 ⊂ #235 ⊂ #242 ⊂ #243 ⊂
#245 ⊂ #246, is already resolved: all six of the earlier ones are closed,
three by the PM and three by this seat, each with a comment naming its
successor. Their branches are deliberately not deleted, because
containment in an unmerged tip lasts exactly as long as the tip.

## The order, simulated

Performed in sequence in a detached scratch worktree off `origin/main`,
not reasoned about:

| # | PR | seat | state | result |
|---|---|---|---|---|
| 1 | #210 | research | ready, 2 days | merged clean |
| 2 | #225 | pm | ready | merged clean |
| 3 | #247 | skill | ready | merged clean |
| 4 | #246 | exo | ready, **Tier C by content** | merged clean |
| 5 | #248 | exo | this run's, **Tier C by content** | merged clean |

The worktree was created with `--detach` and every comparison was made
against `origin/main` rather than `main`, for the reason the charter
gives: `git worktree add /tmp/x main` checks out the branch and the
simulated merges then advance it, corrupting every later comparison.
The worktree was removed and `origin/main` is still 97a1c66.

## The two rows that are not the owner's to take on depth alone

Rows 4 and 5 are both this seat's and both touch `prompts/`, so both sit
behind the standing Tier C question the PM put to the owner at 12:29:59
UTC: whether a charter pull request that truthfully declares in bold that
it moves no authority and loosens no owner gate becomes the PM's to
merge. Silence deadline 2026-10-20T12:30 UTC. Nothing has arrived from
her as of this measurement.

Both declare that line truthfully. Neither should be read as asking for
the question to be answered early.

**If the owner wants to answer the question on one diff rather than two,
merge #246 alone.** It is the artifact the ask has pointed at since the
PM moved the pointer to it at 13:11:17 UTC, and merging it leaves #248
standing on its own. Merging #248 lands both, which is the right outcome
if the answer is yes and the wrong one if she wants to read the smaller
diff first.

## The drafts, named rather than counted

| PR | seat | opened | age |
|---|---|---|---|
| #236 | frontend | 02:32 | ~11h |
| #240 | frontend | 09:30 | ~4h |
| #241 | engineer | 09:36 | ~4h |
| #248 | exo | 13:07 | this run's own, readied at its end |

The three that are not this run's have no live window behind them that
this seat can see, which by the amended ship-first rule makes each one
its own seat's to resolve on its next window: absorb, ready, or close
with a pointer. They are not this seat's to ready and not the owner's to
merge, and they are counted in the headline depth she is given, which is
the quieter half of what dead drafts cost.

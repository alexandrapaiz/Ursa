# Merge order — 2026-10-24 01:3x UTC

Written by the ExO seat's twentieth window, replacing the previous
week's plan. The owner merges. This file is information for that
decision and nothing else.

## The three numbers

| | |
|---|---|
| open pull requests | **14** |
| merged in the last seven days | **45** |
| age of the oldest open | **6 days** (the exo seat's eighteenth window) |

**The queue is not deep.** Open is 14 against 45 merges in seven days,
so the gate is absorbing more than three times what the queue holds.
This is the fourth consecutive window in which the depth rule did not
fire, and it is worth saying plainly after the weeks in which it did:
the organization is no longer producing faster than its merge gate.

Five of the fourteen are drafts. One of the five, the research seat's
fifth run, is idle seven hours with no live run behind it, which HQ's
`check-draft-prs.sh` classes as orphaned mid-work. It is that seat's to
ready or close and the PM has already handed it back on a staleness
finding, so it is named here and not re-reported.

## Conflicts, by instrument

Instrument: `tools/check-merge-queue.sh`, fetched from
`alexandra-systems:main` this window and not read from the host's
checkout, which the register measures as a cache of unknown age. The
clone was widened and unshallowed first, per §0 of the exo charter.

**13 of 14 merge cleanly.** One conflicts.

| pull request | verdict | behind main | instrument |
|---|---|---|---|
| #302 #301 #300 #299 #298 #296 #293 #292 #290 #288 #282 #280 #269 | clean | 0 to 58 | `check-merge-queue.sh` |
| #285 research, fifth run | **CONFLICT**, 35 files | **1003** | `check-merge-queue.sh` |

#285's distance is the finding rather than its conflict. Every other
branch in the queue is between 0 and 58 commits behind. The chair
posted on 2026-10-23 at 18:32 that the public history was rewritten that
day to remove private data, and told every seat to fetch and reset
before any push. #285 predates that rewrite and is the only open branch
that does. So its conflict is not drift between two seats' work, it is
one branch still rooted in the history that was replaced, and rebasing
it onto the current `main` is the whole of the fix. That is the
authoring seat's under `docs/standards/pm.md` §11.3, not the owner's.

## Containment, so the order is shorter than the count

Measured with `git merge-base --is-ancestor <contained> <tip>`, exit 0
meaning contained, over every ordered pair of open heads.

| contained | tip |
|---|---|
| #269 | #288, #302 |
| #288 | #302 |
| #280 | #282 |
| #292 | #298, #300, #301 |
| #298 | #300, #301 |
| #300 | #301 |

**Fourteen open pull requests are six decisions.** Three stacks and
five singletons:

1. **#302** — the exo seat. Contains #288 and #269. One merge closes three.
2. **#301** — the PM seat. Contains #300, #298 and #292. One merge closes four.
3. **#282** — the research seat. Contains #280. One merge closes two.
4. **#299** frontend, **#296** engineer, **#293** skill, **#290** engineer — independent.
5. **#285** research — rebase first, then it is a seventh decision.

## The order, simulated

Performed in a detached scratch worktree against `origin/main`, not
against `main`, so the simulation cannot advance the branch it is
comparing to. Every step below is a merge that was executed and
succeeded.

```
origin/main -> #301 -> #302 -> #282 -> #290 -> #293 -> #296 -> #299
```

Seven merges land thirteen of the fourteen open pull requests. #285 is
not in the order because it does not merge as it stands.

## This seat's own pair

#302 contains #288, which contains #269. One owner decision covers all
three and **#302 is the one to merge.** #288 and #269 are both readied
and were left open rather than closed, because both are sitting in the
PM's merge gate and closing an artifact another seat's gate may be
acting on costs more than the queue slot saves.

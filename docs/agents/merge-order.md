# Merge order — measured 2026-10-18, fourth window

Replaces the previous week's plan. This file is information for whoever
merges, under `docs/standards/pm.md` §21 that is Ursa's PM or any chair.
Measuring the queue and naming the order is this seat's; merging is not.

## The three numbers

| | |
|---|---|
| Open pull requests | **11** (one of them this run's own, #242) |
| Merged in the last seven days | **52** |
| Age of the oldest open | **7 days** (#167, opened 2026-10-11, this seat's own, subsumed below) |

Open does not outnumber the last seven days' merges, so the bold warning
that stood for three consecutive runs stays withdrawn for a second week.
The depth went 17 → 37 → 52 → 8 → 11 across five measurements.

**Read the next number before reading that one as good news.** Of the
fifty-two merges, **43 were merged by the owner's account and 9 by the
PM seat**. The queue is shallow because one person cleared it, which
`standards/roles/exo.md` §5f calls out by name under attribute 9: "a
queue that is healthy only because one person cleared it is not
autonomy". The depth improved and the autonomy did not.

```bash
gh pr list --state merged --limit 200 --json number,mergedAt,mergedBy \
  --jq '.[]|select(.mergedAt>"2026-10-11")|.mergedBy.login' | sort | uniq -c
#  43 alexandrapaiz
#   9 app/claude
```

## Containment: eleven open is really six

`git merge-base --is-ancestor` over every pair of open heads, on an
unshallowed clone:

```
167 → 231 → 234 → 235 → 242
```

Four of the eleven are ancestors of #242, which is this run's branch.
**Merging #242 closes #167, #231, #234 and #235 as one decision.** The
rest are independent: #199, #210, #225, #236, #240, #241.

## Conflicts: one, and it is not the owner's to fix

Both instruments were run and they agree.

```bash
# this seat's, per the charter
git merge-tree --write-tree --name-only origin/main refs/prs/<n>
# HQ's, which is what docs/standards/pm.md §11.2 actually names
/srv/asc/repos/alexandra-systems/tools/check-merge-queue.sh
```

| PR | verdict | instrument |
|---|---|---|
| #199 skill | **CONFLICT** in `docs/ideas.md`, behind main by 151 | both |
| #167, #210, #225, #231, #234, #235, #236, #240, #241, #242 | clean | both |

#199 is the skill seat's to rebase, not a merger's to resolve, and it
has been conflicting on the same file since before 2026-10-15. The file
is `docs/ideas.md`, which is Ursa incident 6's every-seat-appends-to-one-
file shape, still unfixed.

**A note on the instrument, because it misled a seat this morning and
will mislead the next one.** Run cold in a fresh clone on this host,
`check-merge-queue.sh` reported all eleven pull requests as
`NO SUCH REMOTE BRANCH (the branch was deleted; GitHub says MERGEABLE)`,
which is false for all eleven. The cause is the clone, not the script:
the host hands a seat a shallow clone whose `remote.origin.fetch` is
narrowed to `+refs/heads/main:refs/remotes/origin/main`, so the script's
per-branch fetch has nowhere to put the ref. Two lines fix it and they
belong before any ancestry or merge question:

```bash
git fetch --unshallow origin
git config --unset-all remote.origin.fetch
git config --add remote.origin.fetch '+refs/heads/*:refs/remotes/origin/*'
git fetch -q origin
```

The script's wording is the part worth fixing upstream: a missing local
ref is reported as a deleted remote branch, which is a confident wrong
answer rather than a failure. Handed to the centralizer.

## The order, simulated rather than guessed

Performed in a detached scratch worktree off `origin/main`, in this
sequence, each merge actually run:

```bash
git worktree add --detach /tmp/mo-wt origin/main
cd /tmp/mo-wt && for n in 242 225 241 210 236 240; do git merge --no-edit refs/prs/$n; done
```

All six merged clean, in this order:

1. **#242** — exo, this run. Closes #167, #231, #234, #235 with it.
2. **#225** — PM, zero behind main.
3. **#241** — engineer, zero behind main. It is a draft titled WIP; if
   its run is still alive when you read this, leave it.
4. **#210** — research, 128 behind and still clean.
5. **#236** — frontend, 19 behind.
6. **#240** — frontend, 11 behind.

Then **#199** last, after the skill seat rebases it. Nothing above
depends on it.

Six merges close ten of the eleven open pull requests.

## What a merger needs to know about #242 specifically

**It moves no authority between seats and loosens no owner gate.** It
touches `prompts/exo-agent.md`, which `docs/standards/pm.md` §10's Tier
C list calls the owner's and §21 plus §10's own amendment banner call
the PM's. That disagreement is the subject of
`INC-2026-10-18-tier-c-charter-freeze`, filed in this pull request. The
declaration above is the line §21 actually draws, and it is this run's
proposal that the declaration decides the tier.

## Branch housekeeping

| | |
|---|---|
| Remote branches other than `main` | 71 |
| With an open pull request | 11 |
| From a merged pull request | 2, one of which this run deleted (`ursa-engineer/2026-10-18-message-3`) |
| From a closed-unmerged pull request | **58** |
| With no pull request at all | 1 |

This seat deletes branches whose pull requests merged, which was one
branch. The fifty-eight behind closed-unmerged pull requests are not
deleted here, because a closed pull request can hold work nobody
carried forward and deleting the branch destroys it. That is a rule the
org does not have, and it is named here rather than acted on: **who may
delete a branch whose pull request was closed without merging, and after
how long.** Handed to the PM as a question, not taken as a licence.

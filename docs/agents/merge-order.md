# Merge order — measured 2026-10-18 (ExO)

Replaces the previous week's plan. Every line below was produced by
performing the merges, not by asking GitHub. `mergeStateStatus` from
`gh pr list` is not used here, and this week it is also the subject of
Ursa incident 17, because it reported one of these pull requests as
conflicting for three days while `git merge-tree` exited 0 on it.

**Measured on the resident company host, where a fresh clone is
shallow.** Every number below was taken after `git fetch --unshallow`.
Before that fetch, `git merge-tree` reported all eight open pull
requests as having unrelated histories, which read as a queue in which
nothing could merge. See runner-facts.md §3.

## The headline: the queue is healthy and the inversion held

| measure | 2026-09-27 | 2026-10-04 | 2026-10-11 | 2026-10-18 |
|---|---|---|---|---|
| open PRs | 17 | 52 | 15 | **8** |
| merged in last 7 days | ~1 | 5 | 77 | **46** |
| oldest open | — | — | #47, 11 days | **#167, 7 days** |
| open drafts | — | — | 16 (2026-10-05) | **4** |

The standing rule is to say so in bold when open pull requests outnumber
the week's merges, because the org is then producing faster than its one
merge gate absorbs. **That condition does not hold, for the second week
running.** Forty-six merges against eight open is the gate working, and
the drop from fifteen open to eight while merges stayed high is the
queue draining rather than stalling.

All four open drafts are today's live work, which is the only legitimate
reason for a draft under the 2026-10-05 amendment. Three belong to runs
of today's message window (#229 frontend, #230 engineer, #231 this run)
and the fourth is #223, which this run closes. So there are no dead
drafts in the queue after this run, down from six on 2026-10-05.

The oldest open pull request is this seat's own #167 at seven days, and
this run absorbed it into #231 rather than leaving it to age further.

## The order, simulated end to end

Verified in a detached scratch worktree off `origin/main`, merging in
this sequence. One conflict survives and it is one file.

| # | PR | seat | result | note |
|---|---|---|---|---|
| 1 | **#225** | pm | clean | PM's message pass. Ready, not a draft. Nothing depends on it, so it goes first only because it is the shortest review. |
| 2 | **#231** | exo | clean | This run. **Contains #167**, so landing it closes two pull requests including the queue's oldest. Agent layer only. |
| 3 | **#210** | research | clean | Open 2 days, ready. |
| 4 | **#230** | engineer | clean | Today's engineer run. Draft while its run is live. |
| 5 | **#229** | frontend | clean | Today's frontend run. Draft while its run is live. |
| 6 | **#199** | skill | **conflict** | One file, `docs/ideas.md`. See below. |

`#167` is not a row of its own. It is this seat's work from 2026-10-11,
clean against `main` on its own, and merged into `#231` with no conflict
resolution of any kind. Merging `#231` lands both. Closing `#167`
separately after that is bookkeeping, not a decision.

## Containment

None, apart from `#167` inside `#231`. Checked with
`git merge-base --is-ancestor` over all 21 ordered pairs of open heads
after unshallowing. No seat is stacked on another this week, which is
the opposite of 2026-10-04, when twenty-five of fifty-two open pull
requests were ancestors of four others. The queue's count is its real
length now.

## The one conflict

**#199 (skill seat), `docs/ideas.md`.** The ideas ledger is a
single append-only file that more than one seat writes, which is Ursa
incident 6's shape exactly: every seat appends to one file, so two
branches that both added an idea collide on the last line. The conflict
is a content conflict in one file and a person resolves it in under a
minute by keeping both entries.

It is worth noting that this is the second register in this repository
to produce the same collision, after the incident register's own
numbering collision of 2026-10-17. A file that every seat appends to
will conflict as a matter of arithmetic once more than one seat is
running per day, and this org now runs several per day.

## What this file is for

Measuring the queue and naming the order is information for the owner.
Merging is hers alone, and under docs/standards/pm.md §21 also the PMs'
and the chairs'. This seat never merges its own work, never enables
auto-merge, and never advises a seat to merge its own.

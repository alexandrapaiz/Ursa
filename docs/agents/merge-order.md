# Merge order — measured 2026-10-18 (ExO)

Replaces the previous week's plan. Every line below was produced by
performing the merges, not by asking GitHub.

**Every verdict names the instrument that produced it (rule added
2026-10-18, second window).** A conflict verdict with no instrument
beside it cannot be checked by the seat holding the branch, which is
the whole of Ursa incident 17. Two instruments are used in this file
and the `instrument` column says which:

- `cmq` — `/srv/asc/repos/alexandra-systems/tools/check-merge-queue.sh`,
  HQ's sweep, which performs the real merge of every open pull request
  in a throwaway worktree and reports the conflicting files and the
  behind-count. It is not in this repository, which is Ursa incident
  18, and the path above is the host bridge recorded in
  runner-facts.md §6.
- `mt` — `git merge-tree --write-tree --name-only origin/main
  refs/prs/<n>`, per pull request, which is what an Actions run has.

Both were run this pass and they agree on all eight rows. What is **not
used here, at all**, is `mergeable` or `mergeStateStatus` from
`gh pr list`. That field reported one of these pull requests as
conflicting for three days while both instruments above exited 0 on it.

**Re-measured at 02:30 UTC, second window of 2026-10-18.** The 02:05
pass of this file recorded eight open and forty-six merged; at 02:30 it
is eight open and forty-eight merged, with three pull requests opened
and two merged in between. Read every count in this file as a timestamp
rather than a state, and re-measure before acting on one.

**Measured on the resident company host, where a fresh clone is
shallow.** Every number below was taken after `git fetch --unshallow`.
Before that fetch, `git merge-tree` reported all eight open pull
requests as having unrelated histories, which read as a queue in which
nothing could merge. See runner-facts.md §3.

## The headline: the queue is healthy and the inversion held

| measure | 2026-09-27 | 2026-10-04 | 2026-10-11 | 2026-10-18 02:05 | 2026-10-18 02:30 |
|---|---|---|---|---|---|
| open PRs | 17 | 52 | 15 | 8 | **8** |
| merged in last 7 days | ~1 | 5 | 77 | 46 | **48** |
| oldest open | — | — | #47, 11 days | #167, 7 days | **#167, 7 days** |
| open drafts | — | — | 16 (2026-10-05) | 4 | **3** |

The standing rule is to say so in bold when open pull requests outnumber
the week's merges, because the org is then producing faster than its one
merge gate absorbs. **That condition does not hold, for the second week
running.** Forty-eight merges against eight open is the gate working,
and the drop from fifteen open to eight while merges stayed high is the
queue draining rather than stalling.

All three open drafts are today's live work, which is the only
legitimate reason for a draft under the 2026-10-05 amendment: #232
engineer, #233 frontend, and #234 this run. The earlier drafts of the
window, #229 and #230, have merged. There are no dead drafts in the
queue, down from six on 2026-10-05.

The oldest open pull request is this seat's own #167 at seven days. It
sits inside #231, which sits inside #234, so one merge closes all
three.

## The order, simulated end to end

Verified this pass in a detached scratch worktree off `origin/main`,
performing these six merges in this sequence. Five land clean and the
sixth conflicts, in one file. Detached on purpose: `git worktree add
/tmp/x main` checks out the branch and the simulated merges then
advance it, which silently corrupts every later `main...` comparison.

| # | PR | seat | instrument | result | note |
|---|---|---|---|---|---|
| 1 | **#225** | pm | cmq + mt | clean | PM's message pass. Ready, not a draft. Nothing depends on it, so it goes first only because it is the shortest review. |
| 2 | **#234** | exo | cmq + mt | clean | This run. **Contains #231, which contains #167**, so landing it closes three pull requests including the queue's oldest. Agent layer only. Touches `prompts/`, so Tier C. |
| 3 | **#210** | research | cmq + mt | clean | Open 2 days, ready. |
| 4 | **#232** | engineer | cmq + mt | clean | Today's third engineer run. Draft while its run is live. |
| 5 | **#233** | frontend | cmq + mt | clean | Today's frontend run. Draft while its run is live. |
| 6 | **#199** | skill | cmq + mt | **conflict** | One file, `docs/ideas.md`. See below. |

`#167` and `#231` are not rows of their own. Both are this seat's work,
both are clean against `main` on their own by both instruments, and both
are ancestors of `#234` with no conflict resolution of any kind between
them. Merging `#234` lands all three. Closing `#167` and `#231`
afterwards is bookkeeping, not a decision.

## Containment

One chain, `#167` inside `#231` inside `#234`, all three this seat's.
Checked with `git merge-base --is-ancestor` over all 56 ordered pairs of
the eight open heads after unshallowing; those are the only three
relations that hold. No seat is stacked on another seat, which is the
opposite of 2026-10-04, when twenty-five of fifty-two open pull requests
were ancestors of four others. Eight open is really six decisions.

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

# Merge order — replaced each window by Ursa's ExO seat

**Measured 2026-10-25 at 23:4xZ by the forty-fifth window**, on an
unshallowed clone with `remote.origin.fetch` widened to all heads (§0)
and **both register merge drivers installed**, which is the only state
in which a conflict verdict here means anything
(`INC-2026-10-24-a-merge-driver-that-is-not-installed-is-a-conflict`).
`git config --get-regexp 'merge\.(ledger|register)\.'` printed six lines
before any verdict below was taken.

This is information for the owner and for the PM. Merging is theirs.

## The three numbers

| | |
|---|---|
| open pull requests | **10** |
| merged in the last seven days | **49** |
| age of the oldest open | **26 hours** (#395, 2026-10-24T21:21Z) |

**The depth warning does not fire.** Merges outnumber the open queue
five to one, and the oldest open pull request is a day old. The gate is
absorbing work faster than the org produces it.

**But ten is not ten decisions.** #432 and #438 are the **same commit**,
`5f2fc97d`, on two branch names: #438 is a live PM window's ship-first
draft opened on the previous window's tip before it had commits of its
own. And #427 is contained in #439. So the queue is **eight** decisions,
and one of those eight is the pair.

## The order, simulated rather than guessed

Performed in a detached scratch worktree off `origin/main`, with the
drivers installed, in this sequence. Detached and against `origin/main`
deliberately, because `git worktree add /tmp/x main` checks out the
branch and the simulated merges then advance it.

| order | PR | branch | verdict | instrument |
|---|---|---|---|---|
| 1 | #395 | `ursa-research/2026-10-24-hook-2` | clean | performed merge |
| 2 | #418 | `ursa-exo/2026-10-25-message` | clean | performed merge |
| 3 | #423 | `ursa-skill/2026-10-25-message-merge` | clean | performed merge |
| 4 | #427 | `ursa-security/2026-10-25-hook` | clean | performed merge |
| 5 | #434 | `ursa-frontend/2026-10-25-message-b` | clean | performed merge |
| 6 | #435 | `ursa-exo/2026-10-25-message-4` | clean | performed merge |
| 7 | #437 | `ursa-engineer/2026-10-25-scheduled` | clean | performed merge |
| 8 | #439 | `ursa-security/2026-10-25-message` | clean | performed merge |
| — | #432 / #438 | `ursa-pm/2026-10-25-message-2` and `-3` | **conflict** | performed merge, `docs/agents/incidents.md` |

**All eight clean ones merge in ascending order with no resolution at
all.** Every verdict in the table is a merge this window actually
performed, not a reading of GitHub's `mergeable` field, which returned
`UNKNOWN` for both of this seat's own pull requests at the moment they
were measured.

## The one conflict, and it is this seat's doing rather than the PM's

The register driver's refusal on #432 and #438:

> merge-register: ours deleted `## INC-2026-10-18-board-runtime-token-printed-twice`
> while theirs kept it; resolve that by hand

**"Ours" is `main` and the deletion is this seat's.** The PM authored
that postmortem in `d27fd818`, which has never been an ancestor of
`main`. The only copy that ever reached `main` was this seat's fork,
imported by #422 at 23:06:36 and deleted by #429 at 23:20:48, fourteen
minutes apart. From the PM's merge base the entry exists, `main` removes
it, the PM keeps it, and no three-way merge can read that as anything
but a disagreement.

**The resolution to take is the PM's own side**, because `git log -S`
names `ursa-pm` as the author and this seat as the deleter. It is
reported to that seat on the board with the proof, and the account is
`INC-2026-10-25-importing-a-fork-and-deleting-it-leaves-the-author-a-conflict`.

```bash
git log --format='%h %an %ad' --date=short \
  -S'## INC-2026-10-18-board-runtime-token-printed-twice' --all -- docs/agents/incidents.md
```

## What changed about this seat's own two pull requests tonight

#418 is the charter half and **it conflicted in all five registers when
this window opened**, which is the one verdict in this file that was
true ninety minutes ago and is not true now. `main` was merged into it
and every register resolved to `main`'s side, so it is charter-only at
two files and merges clean. #435 is the register half and needs no
owner. One owner decision does not cover the pair: #435 is the PM's
under the merge rule, #418 is hers.

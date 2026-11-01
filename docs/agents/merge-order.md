# Merge order for the owner — measured 2026-11-01, window 73, queue read 23:39:56Z

Replaced whole each window, by this charter's own instruction, which is
why `tools/registers/registers.json` declares this file `enabled: false`
and why it belongs on exactly one branch at a time.

## The five numbers, and both predicates are correctly silent

| | |
|---|---|
| open pull requests | **15** (read 23:39:56Z) |
| merged in the last 7 days | **70** |
| oldest open | `#395`, created 2026-10-24T21:21:40Z, **8d 2h** |
| newest merge of any kind | **2026-11-01T23:36:52Z — 3 minutes before this read** |
| merges per day | below, seven rows, never a sum |

| day | merges |
|---|---|
| 2026-10-18 | 29 |
| 2026-10-23 | 9 |
| 2026-10-24 | 27 |
| 2026-10-25 | 14 |
| 2026-10-26 | 45 |
| 2026-10-27 | 22 |
| 2026-11-01 | **2** |

**Neither predicate fires, and this time that is a measurement rather
than a blind spot.** Open does not outnumber the last seven days'
merges, 15 against 70. The newest merge is three minutes old, so the
24-hour predicate added one window ago is silent too. That predicate was
registered at 23:20:02Z reading **4d 17h 38m** and reads **3 minutes**
nineteen minutes later, which is the negative control it did not have:
it fired on the stall and is quiet on the recovery, both sides inside
one hour.

**The five-day stall is over and it ended at the ceiling.** `refused`
for today is 62 and has not moved since window 72's read, while
`completed` went from 0 to 20 and `attempted` from 72 to 98. Every
refusal preceded the 23:00Z capacity reset and nothing has been refused
since.

## Conflicts: fifteen of fifteen clean, and the instrument beside each verdict

| PR | branch | verdict | instrument |
|---|---|---|---|
| #395 | ursa-research/2026-10-24-hook-2 | clean | `git merge-tree --write-tree`, exit 0, drivers installed |
| #591 | ursa-engineer/2026-10-27-message-2 | clean | same |
| #599 | ursa-pm/2026-10-27-message-2 | clean | same |
| #600 | ursa-engineer/2026-10-27-hook | clean | same |
| #601 | ursa-skill/2026-10-27-hook-2 | clean | same |
| #602 | ursa-security/2026-10-27-hook-2 | clean | same |
| #604 | ursa-frontend/2026-10-27-hook | clean | same |
| #607 | ursa-market/2026-10-27-message-5 | clean | same |
| #609 | ursa-pm/2026-10-27-message-3 | clean | same |
| #612 | ursa-exo/2026-11-01-hook | clean | same |
| #613 | ursa-okr/2026-11-01-hook | clean | same |
| #615 | ursa-engineer/2026-11-01-hook | clean | same |
| #616 | ursa-pm/2026-11-01-message | clean | same |
| #617 | ursa-skill/2026-11-01-message | clean | same |
| #618 | ursa-exo/2026-11-01-message | clean | same |

`tools/registers/install-drivers.sh` was run first, registering `ledger`
for `docs/ideas.md` and `register` for the four `## `-keyed registers.
Without it four of these answers are false (fortieth window's
measurement, §5b).

**One verdict in this table was wrong on the first sweep and is
corrected here rather than quietly.** The first run printed `#618
CONFLICT`. `#618` is this window's own pull request, opened four minutes
earlier, and `refs/prs/618` did not exist in the clone because §0
fetched that refspec before the identifier existed. `merge-tree` exited
**128**, not 1, and the loop read "could not perform the merge" as
"conflict". `INC-2026-11-01-merge-tree-128-read-as-a-conflict-on-this-seats-own-pull-request`
carries it, and §5b item 1 now resolves both revisions and branches on
the exit code rather than on its sign.

**`#599`'s conflict was real and is repaired by its own seat.** Ursa's
PM reported at 23:30:25Z that it had merged current `main` into that
branch, hit real conflicts in two of its own tracking files, resolved
them by taking `main`'s text, and pushed. Verified independently here at
23:42Z: clean. The earlier reading of it as a false conflict against a
stale base was true when it was taken and had expired.

## Containment: no open pull request duplicates another

The instrument is the **tree the gate would land**, not ancestry, which
is this window's amendment to §5b from Ursa's skill seat's measurement
on its own pair. Ancestry answers containment and says nothing about
whether the newer branch adds a line.

```bash
git merge-tree --write-tree "$(git rev-parse origin/main)" refs/prs/<n> | head -1
```

All fifteen merged trees are distinct, so nothing here is a second copy
of something else and the queue is fifteen decisions rather than fewer.
The two same-seat pairs both earn their identifiers:

| pair | trees | verdict |
|---|---|---|
| `#612` / `#618` (exo) | `644a926d` / `55a16eef` | different; `#618` adds `docs/agents/incidents.md`, `prompts/exo-agent.md`, one run file |
| `#601` / `#617` (skill) | `2d5f8c52` / `ffec2e4b` | different; `#617` is that seat's new window, not a forward merge of `#601` |

The skill seat closed `#608` tonight on this instrument rather than
readying it, because `#608` and `#601` merged to byte-identical trees
even though `#608` was four commits ahead. Those four commits were other
seats' already-merged work plus a forward merge of it. That is the
measurement this section's method now comes from.

## The landing order, and the simulation refuted the first draft of it

**Fourteen of the fifteen land in this order. The fifteenth cannot land
in any order, and the pairwise sweep above could not see that.**

| # | PR | seat | why here |
|---|---|---|---|
| 1 | #599 | pm | repaired by its own seat tonight; its seat is the merge gate |
| 2 | #609 | pm | same seat's older pass |
| 3 | #591 | engineer | |
| 4 | #600 | engineer | |
| 5 | #601 | skill | the only landable copy of the work `#608` carried |
| 6 | #617 | skill | that seat's current window |
| 7 | #602 | security | |
| 8 | #604 | frontend | |
| 9 | #607 | market | |
| 10 | #613 | okr | |
| 11 | #395 | research | oldest in the queue at 8d 2h, and **Tier C**: two charter files |
| 12 | #612 | exo | **Tier C**: eleven charter files |
| 13 | #618 | exo | **Tier C**: eleven charter files; contains `#612` |
| — | #616 | pm | **cannot land after `#609`**; see below |
| — | #615 | engineer | **draft**, excluded; GitHub refuses to merge a draft |

Simulated in sequence in a detached scratch worktree created with
`git worktree add --detach /tmp/sim origin/main`, with this
repository's merge drivers installed in the worktree and every
comparison against `origin/main` rather than `main`. Thirteen merged in
the order above with no resolution.

### `#609` and `#616` are mutually exclusive, and each is clean against `main`

This is the finding the simulation exists to produce and it is invisible
to every other instrument in this file.

| test | result |
|---|---|
| `#599` vs `main` | clean |
| `#609` vs `main` | clean |
| `#616` vs `main` | clean |
| `#599` then `#609` | both land |
| `#599` then `#616` | both land |
| **`#609` then `#616`** | **conflict in `docs/sprints/dispatch-queue.md` and `docs/sprints/pending.md`** |

All six orderings of the three were tested and **not one lands all
three**. Whichever of `#609` and `#616` goes second fails, in both
directions, on the same two files. `#599` is compatible with either.

So the landable set is **two of the PM's three**, and the third needs
its own seat to rebase. The order above takes `#599` and `#609` because
they are the older pair and `#616` is that seat's live window, which is
the one of the three whose author is still awake to repair it.

**Why the pairwise sweep says clean and the answer is still no.** Every
verdict in the conflicts table above is a merge of one branch into
`main`. Three branches each clean against `main` can still be pairwise
incompatible, because `main` is their common ancestor and the second
merge is against a tree the first one moved. A conflict table is a
statement about fifteen independent merges; a landing order is a
statement about one sequence of fifteen, and only the second is what the
gate performs.

All three are the PM's own pull requests and the two colliding files are
that seat's own trackers. Ursa's PM reported at 23:30:25Z that it had
repaired `#599` by merging current `main` in and taking `main`'s text in
*"two of this seat's own tracking files"*. Those are the same two files.
So this is one seat's three passes appending to two registers, which is
the ordinary shape of this collision rather than anything unusual, and
it is Ursa incident 6's family: branches that sit unmerged drift apart
and collide.

**This section's first draft said all fifteen merge in any order and
claimed a simulation that had not been run.** It was written from the
pairwise table, which is exactly the inference this subsection refutes.
The claim was corrected by running the simulation the charter requires
before the register was readied, and it is recorded rather than quietly
fixed because the next window will be tempted by the same shortcut: the
pairwise table is fifteen cheap commands and the simulation is one
expensive one, and only the expensive one answers the question the
owner is actually asking.

## Branch deletion

Computed under §5b's predicate, over pull requests and never over names.

```bash
git ls-remote --heads origin | sed 's#.*refs/heads/##' | sort > /tmp/br.txt
gh pr list --state all --limit 400 --json headRefName,state,mergedAt \
  | jq -r 'group_by(.headRefName)[] | select(all(.[]; .mergedAt != null)) | .[0].headRefName' \
  | sort -u > /tmp/alldone.txt
comm -12 /tmp/br.txt /tmp/alldone.txt
```

Nothing was deleted this window. The standing practice for a branch
whose pull request closed unmerged is still to leave it, and no branch
of a merged-only pull request was still on the remote at this read.

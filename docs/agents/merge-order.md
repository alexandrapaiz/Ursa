# Merge order — measured 2026-10-18, ExO tenth window

Replaces the previous plan entirely, as this file's convention requires.
Measured against `origin/main` at `22ebc0f`, with the queue as it stood
at 13:50 UTC.

**Read the one-line caveat first.** Every number below was taken on an
**unshallowed** clone. The same measurements on the shallow clone this
run was handed reported five false conflicts out of five. If you are
reading this file in a fresh session, run the bootstrap block at the top
of `prompts/exo-agent.md` before you believe any instrument, and see
`docs/agents/runner-facts.md` §9 for why.

**Amendment, eleventh window, 14:0x UTC.** Two changes to the queue
since this plan was simulated, neither of which reorders it. **#253**
merged at 13:53 UTC, so step 7 of the order below is done and its branch
is deleted. **#254** opened as the skill seat's next draft, and **#255**
was this seat's ship-first draft, opened and closed inside the eleventh
window, so the three numbers now read **10 open, 56 merged in seven
days, oldest #210 at two days**. The plan itself is not rewritten,
because no pull request in it changed mergeability and the simulation
that verified the order still holds for the six steps that remain.

## The three numbers

| | |
|---|---|
| open pull requests | **9** |
| merged in the last seven days | **57** |
| age of the oldest open | **2 days** (#210, 2026-10-16 17:23 UTC) |

**The queue is no longer the org's bottleneck, and this is the first run
in four weeks that can say so.** Open pull requests do not outnumber the
last seven days' merges; they are outnumbered six to one. The three
previous runs reported seventeen, then thirty-seven, then fifty-two. The
owner cleared it. The depth rule in the charter fires on the opposite
condition and correctly does not fire here, so this is reported plainly
and not in bold.

**But four of the nine are drafts she cannot merge.** #236, #240, #241
and #253. One of those, #236, has been a draft since 02:32 UTC, eleven
hours, which is longer than any run of this org lives, so it is an
orphaned draft in the frontend seat's lane rather than live work. #253
and this seat's own #252 were opened minutes ago by live runs. The
actionable queue is therefore **five**, not nine, and the charter's own
note on this applies: the depth the owner is told about is not the depth
she has. Readying #236 is the frontend seat's to do, and it is flagged
here rather than touched.

## Conflicts: none

All nine merge cleanly into `origin/main`, measured by performing each
merge rather than by asking GitHub:

```bash
git merge-tree --write-tree --name-only origin/main refs/prs/<n>
```

| #210 | #225 | #236 | #240 | #241 | #248 | #251 | #252 | #253 |
|---|---|---|---|---|---|---|---|---|
| clean | clean | clean | clean | clean | clean | clean | clean | clean |

`gh pr list`'s `mergeable` field was not consulted, for the standing
reason that it returns `UNKNOWN` for most of a queue.

## Containment: one chain, three pull requests, one merge

Measured over all 72 ordered pairs of the nine open heads:

```bash
git merge-base --is-ancestor refs/prs/248 refs/prs/251   # exit 0
git merge-base --is-ancestor refs/prs/248 refs/prs/252   # exit 0
git merge-base --is-ancestor refs/prs/251 refs/prs/252   # exit 0
```

- **#248 is contained in #252.**
- **#251 is contained in #252.**

Stated in that direction deliberately: #252 is the surviving tip, and the
other two are inside it. No other pair in the queue is related. So nine
open pull requests are **seven decisions**, and merging #252 closes three
of them.

#248 and #251 are deliberately left open, which is the exception rather
than an omission. Ursa's PM told the owner on the board at 13:22:40 that
her standing Tier C ask names **#248**, with a silence deadline of
2026-10-20 12:30 UTC. The retirement duty's first exception forbids this
seat from closing a pull request another seat has named in a live ask to
the owner, so both stay standing and the board carries the pointer to the
live tip instead.

## The order, verified by performing it

Simulated in a **detached** worktree at `origin/main`, merging in this
sequence. All seven succeeded with no conflict:

```
#225  →  #210  →  #252  →  #236  →  #240  →  #241  →  #253
```

| step | pull request | seat | closes |
|---|---|---|---|
| 1 | **#225** | pm | the PM's own window, 49 commits, oldest ready work |
| 2 | **#210** | research | ready since 2026-10-16, the oldest thing in the queue |
| 3 | **#252** | exo | **also closes #248 and #251** |
| 4 | #236 | frontend | draft; needs readying first |
| 5 | #240 | frontend | draft; needs readying first |
| 6 | #241 | engineer | draft; needs readying first |
| 7 | #253 | skill | draft; live run as of 13:38 |

Steps 1 to 3 are available now and land five of the nine. Steps 4 to 7
are blocked on their own seats readying them, not on anything here.

The order is the one that was simulated, and it has no constraints in it
beyond putting the ready work first and the one containment chain in one
place. Merging is the owner's alone; this file is information.

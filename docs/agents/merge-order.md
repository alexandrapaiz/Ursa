# Merge order — the queue, measured and ordered

Replaced wholesale each run by Ursa's ExO seat under
`prompts/exo-agent.md` §5b. Nothing in this file is carried forward: a
line absent from the newest copy is the point of the file, not a loss.

**Measured 2026-10-26, 19:1x UTC, sixtieth window**, against
`origin/main` at `9e2f21b7`, in a clone that was **unshallowed and had
its refspec widened first** (§0, verified: `--is-shallow-repository`
prints `false` and `main` carries 1,616 commits), and every verdict
**performed** rather than asked of GitHub.

## The headline: three merges close fifteen of twenty-three

| order | merge | closes with it | verdict vs `main` | instrument |
|---|---|---|---|---|
| 1 | **538** (pm) | 517, 525, 526, 527, 531, 534 | CLEAN | `merge-tree --write-tree` + sequenced `git merge` in a detached worktree |
| 2 | **539** (skill) | 511, 518, 533 | CLEAN | same |
| 3 | **536** (exo) | 513, 516, 528 | CLEAN | same |
| 4 | **395** (research) | — | CLEAN | same |
| 5 | **447** (exo) | — | CLEAN | same |
| 6 | **509** (market) | — | CLEAN | same |
| 7 | **532** (security) | — | CLEAN | same |
| 8 | **530** (engineer) | — | CLEAN vs `main`, **conflicts after 539** | see the instruction below |
| — | **520** (engineer) | — | **CONFLICT** | `merge-tree` names `docs/provenance/bundle-digests.json`, `…/bundle-digests.md`, `ursa-major/overlay/…` |
| — | 535, 540 (engineer) | — | drafts, not ordered | — |

Steps 1 through 7 were performed in that order in a scratch worktree
detached at `origin/main` and every step exited zero. Step 8 is where
the sequence broke, and that is the whole value of performing it.

## The one instruction in this file: do not merge 539 and 530 without resolving `docs/ideas.md`

**Neither conflicts with `main`. They conflict with each other**, and a
queue measured only against the trunk reports it nowhere. Isolated
pairwise:

```
539 then 530: CONFLICT on docs/ideas.md
538 then 530: OK
536 then 530: OK
509 then 530: OK
```

**The cheaper rebase is `#530`'s**, and the reason is asymmetric rather
than a matter of taste:

| | vs `main` on `docs/ideas.md` |
|---|---|
| `#539` (skill) | +424 / −27, spread across the file |
| `#530` (engineer) | **+137 / −0, a single hunk appended at line 12885** |

`#530` is a pure append at the tail. `#539` carries the repair of the
two dangling register citations in `docs/ideas.md` and is the tip of a
four-deep chain. So: **merge `#539` first and hand `#530` the rebase**,
which is one re-append. This is the engineer seat's to perform and it
has been told.

**`#520` is the only head conflicting with the trunk and it is contained
in nothing**, so it is the engineer seat's to resolve and cannot be
closed by any merge above. It has been told. Unchanged from window 58's
reading except that it is now the sole trunk conflict.

## Containment, stated in the direction that cannot invert

`<contained>` is contained in `<tip>`. Instrument, with the pair in the
order it was run:

```bash
git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>   # exit 0 = contained
```

| chain | members, oldest first | tip | state of tip |
|---|---|---|---|
| pm | 517, 525, 526, 527, 531, 534 | **538** | ready |
| skill | 511, 518, 533 | **539** | ready |
| exo | 513, 516, 528 | **536** | ready (readied by window 60) |

Standalone, contained in nothing and containing nothing: 395, 447, 509,
520, 530, 532, 535, 540.

## Depth

| | |
|---|---|
| open pull requests | **23** |
| merged in the last seven days | **87** |
| oldest open | `#395`, 2026-10-24T21:21, **46 hours** |
| drafts among the open | 3 (`#535`, `#540` engineer; `#536` readied by this window) |

**Open does not outnumber the week's merges**, 23 against 87, so §5b's
depth warning does not fire. It has not fired today in any window's
reading, and that is a change worth naming rather than passing over: the
gate is absorbing roughly four times what the queue holds.

## Corrected from window 56's copy of this file

Window 56 recorded in its copy of this file, and in a comment on `#447`,
that **§0 of `#447`'s charter copy "no longer contains §0's
instruction"**. That reading is **false and is withdrawn**. The
instruction is present at lines 86–99 of that branch's copy in a
deliberately stronger form, written by the forty-fifth window to close
`INC-2026-10-25-the-authority-split-inverted-the-bootstrap-block-that-tells-a-window-to-re-read-its-charter`.
Window 56 grepped for the superseded wording, and the one phrase that
did survive verbatim is split by the 72-column wrap:

```
$ git show refs/prs/447:prompts/exo-agent.md | grep -c 'not from the checkout'
0
$ git show refs/prs/447:prompts/exo-agent.md | tr '\n' ' ' | tr -s ' ' \
    | grep -c 'not from the checkout you were handed'
1
```

Its attached recommendation — that the surviving copy "needs the
sentence back" — would revert that fix if acted on. The withdrawal is
posted on `#447` where the claim was published, and the entry is
`INC-2026-10-26-an-absence-measured-by-an-instrument-that-could-not-see-presence`.
Window 56's separate observation that §0 has outgrown its own stated
brevity is **not** retracted.

## What this file is not

Measuring the queue and naming the order is information for the owner.
Merging is hers alone. Nothing here enables auto-merge, loosens the
gate, or advises any seat to merge its own work.

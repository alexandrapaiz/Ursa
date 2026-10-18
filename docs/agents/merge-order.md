# Merge order — measured 2026-10-18 18:40 UTC, ExO fifteenth window

Replaces the previous plan entirely, as this file's convention requires.
Measured against `origin/main` at `f42a985`.

**Read the one-line caveat first.** Every number below was taken on an
**unshallowed** clone. The host hands each run a shallow clone of `main`,
and in it `merge-tree` exits 128 and reads as a conflict while
`merge-base --is-ancestor` returns a clean exit meaning the opposite of
the truth. Run the bootstrap block at the top of `prompts/exo-agent.md`
before you believe any instrument here, and see
`docs/agents/runner-facts.md` §9 for why.

## The three numbers

| | |
|---|---|
| open pull requests | **7** |
| merged in the last seven days | **64** |
| age of the oldest open | **18 hours** (#225, 2026-10-18 00:26 UTC) |
| drafts the owner cannot merge | **6 of 7** (all but #225) |
| real conflicts against `origin/main` | **zero of seven** |
| independent decisions | **seven** (no pull request contains another) |

The depth rule does not fire, and this is the shallowest the queue has
been since this file started. Open is outnumbered by the week's merges
nine to one. **Every open pull request was created today**, which has not
been true on any previous measurement: the oldest is eighteen hours and
the previous window's oldest was two days. Twenty-six pull requests
merged on 2026-10-18 against the queue's seven survivors.

Six of the seven are drafts, which is the number worth watching rather
than the depth. Five of those six belong to runs that are over, so the
figure the owner is handed as "open" is mostly work she cannot act on.
That is the L-A27 shape and it is for each seat's next window to resolve
under the ship-first rule's third clause, not for this seat to close.

## Conflicts

| PR | branch | verdict | instrument |
|---|---|---|---|
| #225 | `ursa-pm/2026-10-18-message` | clean | `git merge-tree`, unshallowed |
| #236 | `ursa-frontend/2026-10-18-message-5` | clean | `git merge-tree`, unshallowed |
| #240 | `ursa-frontend/2026-10-18-message` | clean | `git merge-tree`, unshallowed |
| #241 | `ursa-engineer/2026-10-18-message-5` | clean | `git merge-tree`, unshallowed |
| #263 | `ursa-research/2026-10-18-message` | clean | `git merge-tree`, unshallowed |
| #264 | `ursa-skill/2026-10-18-message-h` | clean | `git merge-tree`, unshallowed |
| #265 | `ursa-exo/2026-10-18-message` | clean | `git merge-tree`, unshallowed |

`tools/check-merge-queue.sh` was not used. It is still absent from this
repository and present at HQ, which is Ursa incident 18 and unchanged.
The one-liner above is what ran, and the column says so for every row,
so the seat holding any of these branches can re-measure the verdict
rather than take it on trust.

## Ancestry

Checked pairwise over all open heads with `git merge-base --is-ancestor`
on an unshallowed clone. **No open pull request is contained in any
other.** Seven pull requests are seven decisions. Nothing can be closed
as superseded and nothing can be collapsed, which is the first time this
file has had nothing to offer under this heading.

That is the healthy reading of a number that used to be the alarming
one. On 2026-10-04 twenty-five of fifty-two were ancestors of four
others. Today every seat is on one branch of its own.

## Landing order

Any order lands. Verified by performing all seven merges in sequence in
a **detached** scratch worktree against `origin/main`, in the order
below, with no conflict resolution at any step:

```
#225  #236  #240  #241  #263  #264  #265
```

The detached worktree matters: `git worktree add /tmp/x main` checks out
`main` and the simulated merges then advance it, corrupting every later
`main...` comparison in the run.

Since no branch conflicts and no branch contains another, the order is
free and this section is advice rather than a constraint. Merge by
readiness. #225 is the only one that is not a draft.

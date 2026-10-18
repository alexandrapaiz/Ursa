# Merge order — measured 2026-10-18 19:2x UTC, ExO eighteenth window

Replaces the previous plan entirely, as this file's convention requires.
Measured against `origin/main` at `a9f82054`.

**Read the caveat first.** Every number below was taken on a clone that
had been both **unshallowed** and **widened**. The host hands each run a
clone that is shallow *and* single-branch, and those are independent
defects, so run the bootstrap block at the top of `prompts/exo-agent.md`,
all four lines of it, before you believe any instrument here.
`docs/agents/runner-facts.md` §9 has the shallow measurement and §10 the
refspec one.

**The instrument changed this window and the answer did not.** The
previous plan was built by hand with `git merge-tree` per pull request
and `merge-base --is-ancestor` per pair. This one is HQ's
`tools/merge-order.sh`, fetched from HQ's `main` and run here, which
performs the same three stages and adds the sequence simulation this
charter used to ask a window to build in a scratch worktree. Both
instruments are named per row below, because a verdict with no
instrument beside it cannot be re-measured by the seat holding the
branch.

## The three numbers, and the fourth that matters more

| | |
|---|---|
| open pull requests | **8** |
| merged in the last seven days | **67** |
| age of the oldest open | **19 hours** (#225, 2026-10-18 00:26 UTC) |
| **of the 8, pull requests the owner can actually act on** | **2** (#225 and #268) |

Open does not outnumber the week's merges, so §5b's bold depth warning
does not fire, and this is the second consecutive window in which it has
not. That is worth one plain sentence to the owner: three runs in
October reported seventeen, thirty-seven and fifty-two open against a
handful of merges, and the depth number has turned around.

**The number she can act on is two, not eight.** Six of the eight are
drafts, and GitHub refuses to merge a draft at all. HQ's
`tools/check-draft-prs.sh`, run here this window, splits them by whether
a run is still behind them:

| | |
|---|---|
| drafts with a plausibly live run | 2 (#269 this window, #264 idle 40m) |
| **drafts orphaned, no live run** | **4** (#263 idle 4h, #241 idle 9h, #240 idle 9h, #236 idle 16h) |
| of those, carrying only the opening stub | 1 (#241) |

Each of the four needs its owning seat to ready it or close it. None of
them is this seat's, so none is resolved here; they are reported to the
PM on the board, which is the surface those seats' next runs read.
`#241` is the Ursa incident 16 shape again from a different seat: an
identifier in the owner's queue whose whole content is the commit that
opened it.

## Merge in this order, every step a merge that was executed

| # | PR | seat | verdict | instrument |
|---|---|---|---|---|
| 1 | #225 | ursa-pm | clean, behind main by 0 | `merge-order.sh`, `check-merge-queue.sh` |
| 2 | #236 | ursa-frontend | clean, behind main by 232 | `merge-order.sh`, `check-merge-queue.sh` |
| 3 | #240 | ursa-frontend | clean, behind main by 224 | `merge-order.sh`, `check-merge-queue.sh` |
| 4 | #241 | ursa-engineer | clean, behind main by 213 | `merge-order.sh`, `check-merge-queue.sh` |
| 5 | #263 | ursa-research | clean, behind main by 39 | `merge-order.sh`, `check-merge-queue.sh` |
| 6 | #264 | ursa-skill | clean, behind main by 20 | `merge-order.sh`, `check-merge-queue.sh` |
| 7 | #268 | ursa-exo | clean, behind main by 0 | `merge-order.sh`, `check-merge-queue.sh` |
| 8 | #269 | ursa-exo | clean, behind main by 0 | `merge-order.sh`, `check-merge-queue.sh` |

**8 of 8 mergeable now; 0 need a rebase before she can act.** Both
instruments agree on all eight, which is the first window in this file's
history where nothing in the queue conflicts with anything.

**The one containment in the queue.** `refs/prs/268` is contained in
`refs/prs/269`, proved by `git merge-base --is-ancestor refs/prs/268
refs/prs/269`, exit 0. One owner decision covers the pair. Merging #269
alone lands both; merging #268 first is also fine and leaves #269 as
this window's delta. #268 was deliberately left open rather than grown,
for the reason in
`INC-2026-10-18-readied-sibling-is-not-a-branch-to-grow`.

## Branch deletion

The predicate is over pull requests and never over names
(`INC-2026-10-18-branch-name-reuse`). Run, read, then delete:

```bash
git ls-remote --heads origin | sed 's#.*refs/heads/##' | sort > /tmp/br.txt
gh pr list --state all --limit 400 --json headRefName,state,mergedAt \
  | jq -r 'group_by(.headRefName)[] | select(all(.[]; .mergedAt != null)) | .[0].headRefName' \
  | sort -u > /tmp/alldone.txt
comm -12 /tmp/br.txt /tmp/alldone.txt
```

The wider question — who may delete the branch of a pull request that
closed **unmerged** — is with the owner on the silence route and expires
**2026-10-20 12:30 UTC**. Until then: delete a branch whose every pull
request merged, leave one whose pull request closed unmerged, never
touch one with an open pull request.

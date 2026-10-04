# The landing plan — measured 2026-10-04, ExO seat

The merge queue has been the finding of every ExO run since 2026-09-27.
Three entries of the learning log now report its depth, and the depth
has gone up every time. This file is the other half of that reporting,
because a number told the owner the queue was deep and never told her
what to click.

Everything below is measured, not estimated. The commands are in §5 so
the next run reproduces it rather than trusting it.

## 1. The three numbers (charter §5b)

| Measure | 2026-09-27 | 2026-09-30 | 2026-10-04 |
|---|---|---|---|
| Open PRs | 17 | 37 | **52** |
| Merged in the last 7 days | 10 | 9 | **5** |
| Age of the oldest open PR | 3.0 days | 5.5 days | **10.2 days (#13)** |

**Open PRs outnumber the last seven days' merges by more than ten to
one.** The queue has tripled while the merge rate has halved. All five
merges in the window are PM standups or lessons syncs, so the figure
that the 2026-09-30 entry reported still holds: no pull request from the
engineer, frontend, research, market, skill, finance or security seat
has ever merged, in this repository's whole history.

## 2. The queue is not blocked by conflicts

This is the new measurement, and it reverses what the last two entries
assumed. Each open PR was merged into `origin/main` in a scratch
worktree with `git merge-tree`, which is the same three-way merge
GitHub runs.

**Forty-four of the fifty-two merge clean into `main` right now.** Eight
conflict, and they fall into exactly two groups:

- **Five conflict on `docs/ideas.md` and on nothing else:** #14, #21,
  #50, #52, #64. That is Ursa incident 6 still live, one file, no other
  cause.
- **Three conflict on the PM's own two tracker files** (`pending.md`,
  `dispatch-queue.md`): #20, #34, #53. All three are superseded
  standups, which is a PM-lane cleanup and not an obstacle to anything.

So the queue is not rotting faster than it can be landed. It is simply
not being landed. That distinction matters because the two diagnoses
have different owners, and only one of them is true.

## 3. Twenty-five of the fifty-two are already inside four others

Several seats adopted stacking after L-E10, so a later PR often contains
its predecessors as ancestors. Measured with `git merge-base
--is-ancestor` over every pair of open PR heads:

| Merging this | also closes | count |
|---|---|---|
| **#74** engineer | #13 #16 #18 #22 #24 #25 #27 #32 #33 #36 #38 #43 #56 #57 #59 #61 #66 #69 #71 #72 | 20 |
| **#65** frontend | #15 #35 #51 | 3 |
| **#62** finance | #55 | 1 |
| **#40** chair | #42 | 1 |
| **#76** exo (this PR) | #30 #46 | 2 |

Those five merges close **32 of the 52 open PRs, which is 61%**, and
every one of the five merges clean into `main` today.

Inside #74 are the things three other seats are currently blocked on:
the CSRF fix on the bridge (#28's finding, re-fixed), the `next` RCE
upgrade and the dependency-floor gate (#36), the ledger merge driver
(#27, Ursa incident 6's tooling fix), and the test, typecheck and audit
gate the security seat named as F3, the finding that explains most of
its other findings.

## 4. The order, verified by simulation

Verified by actually performing these merges in sequence in a scratch
worktree off `origin/main`, not by reasoning about them.

1. **#74** (engineer stack, 129 files). Clean.
2. **#65** (frontend line, 150 files). Clean.
3. **#62** (finance close). Clean.
4. **#40** (chair, Langfuse tracing, carries #42's workflow edits). Clean.
5. **#76** (this PR, the ExO line). One conflict after step 1, on
   `docs/agents/pending-workflow-changes.md`, described in §4b.

After those five, twenty PRs remain open. Of the ones that then still
conflict, the cause is `docs/ideas.md` in every case except the PM's
three tracker files.

### 4b. The one conflict in the plan, and why it is in this file

#74 appends a queue entry to `docs/agents/pending-workflow-changes.md`,
which is the ExO seat's file, and this PR restructures the same file.
The engineer seat was right to cross the lane by one entry and said so
in its own PR rather than inventing a parallel queue. The collision is
this file's design fault and not that seat's, so this run fixed the
design: per-seat queue files and seat-scoped identifiers, described in
the queue file itself. After this PR, the shared file's append region is
untouched by the ExO seat, so the engineer's and the security seat's
entries land in it without meeting each other or meeting this seat.

Resolution if the owner takes #74 first: keep both sides. The engineer's
entry becomes `PWC-ENG-1` in
`docs/agents/pending-workflow-changes-engineer.md`.

## 5. Reproducing this

```bash
gh pr list --state open --limit 100 --json number --jq '.[].number' | sort -n > /tmp/prs.txt
while read n; do git fetch -q origin "refs/pull/$n/head:refs/prs/$n"; done < /tmp/prs.txt

# conflicts against main, per PR
while read n; do
  git merge-tree --write-tree --name-only origin/main refs/prs/$n >/dev/null 2>&1 \
    && echo "clean $n" || echo "CONFLICT $n"
done < /tmp/prs.txt

# subsumption: which open PRs are ancestors of which
for a in $(cat /tmp/prs.txt); do for b in $(cat /tmp/prs.txt); do
  [ "$a" = "$b" ] && continue
  git merge-base --is-ancestor refs/prs/$b refs/prs/$a 2>/dev/null && echo "#$a contains #$b"
done; done
```

Two cautions, both learned the hard way on this run. Use `origin/main`
and not `main` in every command. If you create the scratch worktree with
`git worktree add /tmp/land main` you check out the `main` *branch*, and
your simulated merges then advance it, which silently corrupts every
later `main...` comparison. Use a detached worktree instead. Second, a
clean exit from `git merge-tree` is the only mergeability signal worth
trusting here. The `mergeable` field from `gh pr list` returns `UNKNOWN`
for most of a queue this size, because GitHub computes it lazily on
demand.

## 6. What this file is not

It is not permission to merge anything. The merge gate is the owner's
and this seat never loosens it, never enables auto-merge, and never
advises a seat to merge its own work. This file exists so that when the
owner does spend ten minutes on the queue, those ten minutes land 61% of
it instead of one PR.

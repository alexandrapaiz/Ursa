# The landing plan

Rewritten every ExO run, replacing the previous week's plan
(prompts/exo-agent.md §5b). It exists because three consecutive runs
reported the queue's depth and the depth went up every time. A number
tells the owner the queue is deep. This file tells her what to do in the
next ten minutes.

**Measured 2026-10-05, 03:40 UTC, against `origin/main` at `cf2f28f`.**
Nothing here is inferred from GitHub's `mergeable` field, which returns
`UNKNOWN` for most of a queue this size. Every statement below was
produced by performing the merge.

## 1. The three numbers

| | 2026-09-27 | 2026-09-30 | 2026-10-04 | 2026-10-05 |
|---|---|---|---|---|
| Open pull requests | 17 | 37 | 52 | **65** |
| Merged in the last 7 days | 10 | 9 | 5 | **5** |
| Age of the oldest open PR | — | — | 10.2 d | **10.5 d** (#13) |

**Open pull requests outnumber the last seven days' merges by thirteen
to one.** The org produces faster than its only merge gate absorbs,
which is an owner decision and nobody else's. The five are #78, #73,
#70, #41 and #23, counted against a rolling seven days ending
2026-10-05 03:40 UTC. Four of the five are lessons syncs or PM
standups, which is the same shape the previous two runs reported: the
merges that happen are the org's own paperwork, and the product work
stacks.

Thirteen of the thirteen new ones since yesterday arrived in two
batches: a window dispatch that opened ten seat pull requests between
03:13 and 03:17 UTC, and three from the night's runs. The dispatch is a
deliberate act, so this is not drift. It is worth saying plainly
anyway: a roster-wide window adds ten to the queue in four minutes, and
the gate that drains it is one person.

## 2. What actually conflicts

**Fifty-six of the sixty-five open pull requests merge clean into
`origin/main` right now.** Nine conflict, and they conflict on three
files between them:

| Conflicting PR | File or files |
|---|---|
| #14, #21, #50, #52, #64, #89 | `docs/ideas.md` and nothing else |
| #20, #34, #53 | `docs/sprints/pending.md` and `docs/sprints/dispatch-queue.md` |

Conflicts are not what is holding this queue, and this is the third
consecutive run to measure that. The `docs/ideas.md` group is Ursa
incident 6, unchanged: six pull requests, one file, append-at-the-end.
The sprint-file group is the same mechanism on the PM's two queue files,
and it is new in this measurement.

## 3. What is already inside something else

Seats stack, so the queue is far shorter than its count. Measured with
`git merge-base --is-ancestor` over every pair of the sixty-five heads.

| Merge this | and these close with it | total |
|---|---|---|
| **#77** engineer | #13 #16 #18 #22 #24 #25 #27 #32 #33 #36 #38 #43 #56 #57 #59 #61 #66 #69 #71 #72 #74 | **22** |
| **#65** frontend | #15 #35 #51 | 4 |
| **#81** exo | #30 #46 #76 | 4 |
| **#62** finance | #55 | 2 |
| **#40** chair | #42 | 2 |

**Five merges close thirty-four of the sixty-five.** The sets are
disjoint, so the counts add.

## 4. The order, simulated

Performed in this sequence in a detached scratch worktree off
`origin/main`, not reasoned about:

1. **#77** — clean.
2. **#65** — clean.
3. **#62** — clean.
4. **#40** — clean.
5. **#81** — conflicts on two files. Both resolutions are written out in
   §4b below, so there is nothing to work out at the keyboard.

### 4a. Why #77 goes first and why it is not mergeable as it stands

#77 is the top of the engineer stack and carries twenty-one other pull
requests, including the things three other seats are blocked on: the
CSRF fix on the bridge, the `next` RCE upgrade, the ledger merge driver,
and the test and typecheck gate.

**#77 is a draft, so GitHub will refuse to merge it at all.** Press
"Ready for review" first, or `gh pr ready 77`. It is a draft because the
run that opened it was killed by its workflow's 45-minute job cap at
02:58 UTC on 2026-10-05, forty-five minutes after it started, so no turn
was left in which to ready it. That is Ursa incident 10. The single
highest-value merge available in this repository is blocked by a
one-click status that a timeout left behind, and that is the clearest
statement of what HQ's L-A27 is about.

Its title also still reads "draft, in progress". Read the pull request
before merging it, since its own run never got to say which parts of it
are finished.

### 4b. The two resolutions for step 5, written out

**Applied on 2026-10-06, by the run a handoff from the project manager
woke.** Both resolutions below were carried out exactly as written, on
this branch, by merging `main` into it rather than by rebasing it. I
resolved each one before reading this section, and both landed on the
same side it names, which is the first time a plan this seat wrote for a
later run was executed by a different run and agreed with. The branch is
clean against `main` as of that merge. What follows is kept as the
record of the decision, not as work still waiting.

Both conflicts are between the exo line and the engineer line, and both
are the same underlying event: Ursa incident 9, two seats editing one
file from branches neither could read.

**`README.md`** — one line, in the commands block.

```
<<<<<<< HEAD
npm test                                   # 375 tests, 4 skipped
=======
npm test                                   # the unit suite
>>>>>>> refs/prs/81
```

**Keep HEAD, the engineer's line.** A measured count from the seat that
runs the suite beats a generic phrase from the seat that does not. Delete
the exo side.

**`docs/agents/pending-workflow-changes.md`** — one large hunk.

**Keep the #81 side in full and delete the HEAD side.** The #81 side is
the seat-scoped convention that exists precisely to stop this collision
happening again, and the HEAD side is the old shared-counter text plus
the engineer's `PWC-7` entry.

**Nothing is lost by that, and it was made true before the plan was
written rather than promised in it.** The engineer's entry is already
preserved in full at
`docs/agents/pending-workflow-changes-engineer.md`, created on
2026-10-05 as part of #81, with the body byte-for-byte as the engineer
wrote it and only the heading renumbered to `PWC-ENG-1`. Verify that
before resolving, if you want to:

```bash
git show refs/prs/77:docs/agents/pending-workflow-changes.md \
  | sed -n '/^## PWC-7 /,$p' | tail -n +2 > /tmp/a
sed -n '/^## PWC-ENG-1 /,$p' docs/agents/pending-workflow-changes-engineer.md \
  | tail -n +2 > /tmp/b
diff /tmp/a /tmp/b && echo identical
```

The resolved tree was committed in the scratch worktree and both files
were checked for leftover markers, so this sequence is verified end to
end and not described.

## 5. Traps, for whoever runs this next

- **Create the scratch worktree detached.** `git worktree add /tmp/x main`
  checks out the real `main` branch, and the simulated merges then
  advance it, which silently corrupts every later `main...` comparison.
  Use `git worktree add --detach /tmp/x origin/main`.
- **Compare against `origin/main`, never `main`.** Same reason.
- **A fresh clone may arrive shallow.** This run's did, with a
  two-commit history, and `git merge` answered "refusing to merge
  unrelated histories" for a branch that shares all of its ancestry.
  `git fetch --unshallow` first. Check with
  `git rev-parse --is-shallow-repository`.
- **Fetch every head into one namespace** with
  `git fetch origin '+refs/pull/*/head:refs/prs/*'`, so the ancestry
  pass is a local loop and not sixty-five API calls.
- **`git merge-tree --write-tree --name-only` is the conflict probe.** It
  exits non-zero and names the files, and it touches no working tree.
- **Do not trust this file's numbers without re-measuring.** The queue
  changed by thirteen pull requests in nineteen hours.

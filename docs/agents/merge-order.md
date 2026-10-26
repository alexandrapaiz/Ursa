# Merge order — the queue, measured and ordered

Replaced wholesale each run by Ursa's ExO seat under
`prompts/exo-agent.md` §5b. Nothing in this file is carried forward: a
line absent from the newest copy is the point of the file, not a loss.

**Measured 2026-10-26, 14:1x–14:2x UTC, fifty-sixth window**, against
`main` at `fcfb33e9`, in a clone that was **unshallowed and had its refspec
widened first** (§0), with **both merge drivers registered**, and every
verdict **performed** rather than asked of GitHub.

## The headline: four merges close eleven of sixteen, and neither conflict needs resolving

Both of the queue's two conflicting pull requests are **contained in a
clean descendant of themselves**. There is no conflict resolution in this
queue. Merge the four tips below, in any order, and the two conflicts
leave the queue as closures rather than as work.

| order | merge | closes with it | verdict | what it is |
|---|---|---|---|---|
| 1 | **#518** (skill) | #515, #511 | CLEAN | the dangling-citation repair `main` is waiting on |
| 2 | **#520** (engineer) | #514, #499 | CLEAN | absorbs the unreadied run 5; **removes both of #499's conflicts** |
| 3 | **#512** (security) | #503 | CLEAN | **removes both of #503's conflicts** |
| 4 | **#517** (pm) | — | CLEAN | the Monday ceremony and the incidents-entry boundary fix |

That is **4 merges for 11 pull requests**, leaving five: #395, #447,
#508, #513, #516.

## The three depth numbers §5b asks for

| | |
|---|---|
| open pull requests | **16** |
| merged in the last seven days | **85** |
| age of the oldest open | **#395**, `ursa-research/2026-10-24-hook-2` — about 41 hours |

**Open does not outnumber the week's merges**, so §5b's bolded warning
does not fire. Trend, for the record: 52 open on 2026-10-04, 11 on
2026-10-18, 8 at 10:2xZ today, **16** now. The doubling in four hours is
not a backlog — it is eight seats each opening this afternoon's draft.
Eleven of the sixteen are this afternoon's, and eleven of the sixteen
close on four merges. **Depth measured at the top of an hour when every
seat has a live draft open is a measurement of the roster, not the
queue.** Read the containment column before the count.

## Conflicts, performed twice with the instrument named

| PR | seat | `merge-tree` | real merge in a worktree | conflicting files |
|---|---|---|---|---|
| #499 | engineer | exit 1 | exit 1, same set | `docs/provenance/bundle-digests.json`, `.md`, `ursa-major/src/hq/briefing.ts` |
| #503 | security | exit 1 | exit 1, same set | `scripts/redaction-check.mjs`, `.test.mjs` |

Every other open pull request: **CLEAN**, by both instruments.

**§0's fourth-line warning fired on this window's own sweep, and this is
the correction.** The first pass of this sweep ran **before** the merge
drivers were registered and reported `docs/ideas.md` as a conflicting
file in **both** rows. With `merge.ledger.driver` registered, the same
command prints `Auto-merging docs/ideas.md` for both and the file leaves
both lists. The pull requests still conflict; the file this seat would
have told two seats to go and fix **does not**. So the published row is
the second measurement, and a seat reading a `docs/ideas.md` conflict
verdict from any seat should ask which pass produced it. Install first,
measure second, and say which you did — the previous copy of this file
said it did, and that is the only reason this window thought to check.

## Containment: the queue is nine objects, not sixteen

`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`, exit
0 = contained, stated in the direction that cannot invert.

| chain | read as |
|---|---|
| #499 ⊂ #514 ⊂ #520 | engineer: one object, tip **#520** |
| #511 ⊂ #515 ⊂ #518 | skill: one object, tip **#518** |
| #503 ⊂ #512 | security: one object, tip **#512** |
| #508 ⊂ #513 | exo: one object, tip **#513** |
| #395, #447, #509, #516, #517, #519 | independent |

## The class that merges clean and still costs something

Window 55 reported at 10:59Z that four open branches revert a register
repair on a merge that exits zero. Quantified here for the whole queue:
for each clean branch, the merge is performed and the resulting tree is
diffed against `main`, so the number is **what `main` loses**, not what
the branch changed.

| PR | commits behind `main` | files `main` loses lines in | lines | largest |
|---|---|---|---|---|
| #517 | 0 | 3 | 129 | `docs/sprints/dispatch-queue.md` (−79) |
| #508 / #513 | 40 | 1 | 111 | `docs/agents/merge-order.md` (−111) |
| #514 / #520 | 0 | 14 | 83 | `ursa-major/src/hq/briefing.ts` (−22) |
| **#447** | **199** | **1** | **72** | **`prompts/exo-agent.md` (−72)** |
| #519 | 0 | 3 | 17 | `ursa-major/overlay/app/dashboard/page.tsx` (−13) |
| #395 | 477 | 2 | 17 | `prompts/research-agent.md` (−16) |
| #511 / #515 / #518 | 0 | 3 | 15 | `docs/ideas.md` (−7) |
| #512 | 0 | 3 | 4 | `docs/provenance/bundle-digests.md` (−2) |
| #509, #516 | 0 | **0** | **0** | — |

**Read the "behind" column first, because it is what separates a revert
from an edit.** A branch at 0 behind removes a line because its own
author removed it; that is an edit and this table is not an accusation.
A branch hundreds of commits behind removes lines that arrived after it
forked, and nobody chose that.

**Three readings, in descending cost:**

1. **#508 / #513's 111 lines are this file, and that is by design.**
   `merge-order.md` is replaced wholesale every window. A line absent
   from a newer copy is the point. **Not a loss, and not to be reported
   as one** — including by whatever instrument reads this table next.
2. **#395's 16 lines are `prompts/research-agent.md`, 477 commits
   behind.** Another seat's charter, from a branch 41 hours old. This is
   the genuine stale-root revert and it is the one to rebase.
3. **#447's 72 lines are this seat's own charter, and the cause is not
   staleness.** `main`'s charter commit `94e926b7` **is** an ancestor of
   #447, so this is a rewrite and not a revert. What the rewrite drops is
   the finding:

   > **#447's §0 keeps the heading "the file you are reading is probably
   > the stale one", keeps the four bootstrap commands, and no longer
   > contains the instruction that tells you what to do with their
   > answer.**

   Absent from #447's 6,015-line copy, present in `main`'s 2,221-line
   copy: *"read this charter from the newest of those pull requests and
   not from the checkout you were handed"*, and the
   `git show refs/prs/<newest>:prompts/exo-agent.md` line that performs
   it. Zero matches for any of three phrasings anywhere in the file.
   A later window inserted a fourth bootstrap line about merge drivers
   and §0's conclusion was displaced out of the section.

   §0 says of itself: *"This block is deliberately short, so that it
   stays true and stays merged while the rest of this file churns."* The
   block grew past the point where its own payoff fit inside it. That is
   the section's stated failure mode happening to the section, and the
   charter branch carrying it is the one fifteen windows have been trying
   to land.

   **Not patched here.** #447 is named in an open ask to the owner — the
   PM has been told the lines parked in it would not move — and the ask
   is about that diff's disposition. Pushing a fix onto it changes what
   she is being asked about. Recorded here, commented on the pull request,
   and the repair goes in whichever copy survives her decision.

## Instruments used, so every verdict above can be re-measured

| verdict | instrument |
|---|---|
| conflict | `git merge-tree --write-tree --name-only origin/main refs/prs/<n>`, **and** `git merge --no-commit --no-ff` in a detached worktree off `origin/main`; both agreed on both rows |
| containment | `git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>` |
| what `main` loses | `git diff --numstat origin/main $(git merge-tree --write-tree origin/main refs/prs/<n>)` |
| behind count | `git rev-list --count refs/prs/<n>..origin/main` |
| repaired-vs-dangling | `node tools/stack/repair-pending.mjs --text '<s>'` (new this window) |

`gh pr list`'s `mergeable` field was **not** used for any row. HQ's
`tools/check-merge-queue.sh` was not run; §5b requires the widened
refspec first, which this clone has, but the two instruments above agree
with each other and a third was not worth the worktree.

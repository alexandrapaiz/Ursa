# Merge order — measured 2026-10-18 19:0x UTC, ExO sixteenth window

Replaces the previous plan entirely, as this file's convention requires.
Measured against `origin/main` at `57c8fda`.

**Read the two-line caveat first, because it gained a line this
window.** Every number below was taken on a clone that had been both
**unshallowed** and **widened**. The host hands each run a clone that is
shallow *and* single-branch, and those are independent defects:

- Shallow makes `merge-tree` exit 128 and read as a conflict, and makes
  `merge-base --is-ancestor` return a clean exit meaning the opposite of
  the truth (`docs/agents/runner-facts.md` §9).
- Single-branch leaves `remote.origin.fetch` at
  `+refs/heads/main:refs/remotes/origin/main`, so no `origin/<branch>`
  but `origin/main` ever resolves, and any instrument that resolves a
  head by remote-tracking name reports the branch **deleted**
  (`runner-facts.md` §10).

Run the bootstrap block at the top of `prompts/exo-agent.md`, all three
lines of it, before you believe any instrument here.

## The three numbers

| | |
|---|---|
| open pull requests | **7** |
| merged in the last seven days | **65** |
| age of the oldest open | **19 hours** (#225, 2026-10-18 00:26 UTC) |
| drafts the owner cannot merge | **6 of 7** (all but #225) |
| real conflicts against `origin/main` | **zero of seven** |
| independent decisions | **seven** (no pull request contains another) |

The depth rule does not fire, for the sixth consecutive run. Open is
outnumbered by the week's merges nine to one, every open pull request
was created today, and twenty-seven merged on 2026-10-18 against the
queue's seven survivors.

**The figure to watch is still the drafts and not the depth.** Six of
seven are drafts, so the number the owner is handed as "open" is mostly
work she cannot act on. One of the six, #266, is this window's own and
is readied at the end of this run. The other five belong to other seats
and are theirs to resolve, not this seat's to close.

## Conflicts, with the instrument beside each verdict

Two instruments were run over the same seven pull requests in the same
minute, and they disagreed completely. The table records both readings
because the disagreement is this window's finding.

| PR | branch | `git merge-tree` vs `origin/main` | simulated real merge | HQ `check-merge-queue.sh` |
|---|---|---|---|---|
| #225 | `ursa-pm/2026-10-18-message` | clean | clean | *NO SUCH REMOTE BRANCH* (false) |
| #236 | `ursa-frontend/2026-10-18-message-5` | clean | clean | *NO SUCH REMOTE BRANCH* (false) |
| #240 | `ursa-frontend/2026-10-18-message` | clean | clean | *NO SUCH REMOTE BRANCH* (false) |
| #241 | `ursa-engineer/2026-10-18-message-5` | clean | clean | *NO SUCH REMOTE BRANCH* (false) |
| #263 | `ursa-research/2026-10-18-message` | clean | clean | *NO SUCH REMOTE BRANCH* (false) |
| #264 | `ursa-skill/2026-10-18-message-h` | clean | clean | *NO SUCH REMOTE BRANCH* (false) |
| #266 | `ursa-exo/2026-10-18-message-12` | clean | clean | *NO SUCH REMOTE BRANCH* (false) |

The third column is `git merge-tree --write-tree --name-only
origin/main refs/prs/<n>`, exit 0 for all seven. The fourth is a real
three-way merge of each, performed in sequence in a throwaway detached
worktree off `origin/main`, which is the simulation this file's
convention requires rather than an order taken on trust. All seven
merged with no conflict resolution.

The fifth column is HQ's `tools/check-merge-queue.sh`, run from
`/srv/asc/repos/alexandra-systems/tools/`, which `prompts/exo-agent.md`
§5b until this window told this seat to **prefer** over the one-liner.
It reported `7 of 7 open pull request(s) cannot be merged as they
stand`, every row attributed to a deleted branch. `git ls-remote --heads
origin` listed seventy-eight branches in the same minute, including all
seven. The cause is the single-branch refspec above and the fix is one
line in HQ's script, handed to the `exo-centralizer` this run. See
`INC-2026-10-18-single-branch-refspec-reads-as-deleted`.

**If you are the next window: re-run the script after widening the
refspec, and if it still reports deleted branches, the fix has not
landed upstream and the `merge-tree` column is the one to trust.**

## Containment

`git merge-base --is-ancestor refs/prs/<a> refs/prs/<b>` over all
forty-two ordered pairs of the seven open heads, on the unshallowed
clone: **no pair is contained in another.** Seven open pull requests are
seven independent decisions, the second consecutive window with nothing
to collapse, and every seat is on one branch of its own.

## The landing order

Any order works, since nothing conflicts and nothing is contained.
Simulated in this sequence and clean throughout:

1. **#225** (pm) — the only non-draft, and the only one she can merge
   today without a seat readying it first. It carries
   `INC-2026-10-18-board-runtime-token-printed-twice`, which is the
   register's account of a credential still unrotated, so landing it
   first puts that account on `main` where a memoryless run finds it.
2. **#266** (exo, this window) — readied at the end of this run.
3. **#264** (skill), **#263** (research), **#241** (engineer),
   **#240** and **#236** (frontend) — drafts belonging to other seats.
   Each is that seat's to ready or close under the ship-first rule. They
   are listed here so the order is complete, not because anything about
   them is actionable by her while they are drafts.

Merging is the owner's alone. This file is the order and the evidence,
and nothing in it is a request to loosen that.

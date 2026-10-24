# Merge order — measured 2026-10-24 06:5x UTC, ExO twenty-second window

Replaces the previous plan entirely, as this file's convention requires.
Measured against `origin/main` at `96e0513`.

**The caveat this file has carried since 2026-10-18 now has a cause, and
it is one flag.** Every number below was taken on a clone that had been
both unshallowed and widened, because the host hands each run a clone
that is shallow *and* single-branch. Those were filed as two
independent defects, in `docs/agents/runner-facts.md` §9 and §10. They
are not independent. `git clone --depth 1` implies `--single-branch`,
and one line in the resident runtime passes it:
`alexandrapaiz/epitome`, `cli/src/lib/runner.js:131`. The full
measurement, the price of three fixes and the three hands the fix needs
are `runner-facts.md` §11 and
`INC-2026-10-24-two-clone-incidents-one-flag`.

Run the bootstrap block at the top of `prompts/exo-agent.md` before you
re-measure anything here, and do not read a queue-wide failure as a
queue fact until you have.

## The three numbers

| | |
|---|---|
| open pull requests | **14** |
| merged in the last seven days | **46** |
| age of the oldest open | **6 days** (#269, 2026-10-18 19:16 UTC) |

Open is well under the week's merges, so the queue is **not** outrunning
its gate and no bold warning is owed this run. That is the first time in
this file's history that sentence has been true, and the reason is not
this seat's: the PM merged forty-six in the week on its own passes.

## What conflicts with `main`, and the instrument that said so

| PR | verdict | behind main | instrument |
|---|---|---|---|
| #320 #319 #318 #317 #316 #315 #313 #307 #302 #288 #269 #321 | clean | 0 to 70 | HQ's `check-merge-queue.sh`, fetched from HQ's `main` this run |
| #305 | **conflict** in `docs/ideas.md` | 7 | same, and GitHub had not computed `mergeable` |
| #290 | **conflict** in `docs/ideas.md` | 19 | same, and GitHub had not computed `mergeable` |

Both conflicts are the authoring seat's to rebase under
`docs/standards/pm.md` §11.3, not the owner's to resolve, and both are
the engineer's.

## What is already contained in something else

`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`,
exit 0 meaning contained, on a clone that was unshallowed first:

- **#269 ⊂ #288 ⊂ #302 ⊂ #307**, one chain, all four this seat's, all
  four readied and open.
- **#313 ⊂ #317**, both the PM's.

So fourteen open pull requests are **nine** decisions. Four of this
seat's chain settle with one merge of its tip, which is what Ursa's PM
told the owner at 01:48 UTC, naming #302 as that tip. **#307 now
contains #302**, and this window's own #318 contains #307, so the
pointer has moved twice since that message. This seat is not closing
#269, #288 or #302: the PM has named #302 in an open ask to the owner,
and the standing rule is to post where the decision moves to and leave
the artifact standing.

## The landing order, simulated rather than guessed

Performed in a detached worktree off `origin/main`, merging in sequence.
The result is the finding of this run's second half, so both runs are
recorded:

| order | with no merge driver registered | with `install-driver.sh` run |
|---|---|---|
| 315 | clean | clean |
| 316 | **conflict** `docs/ideas.md` | clean |
| 320 | **conflict** `docs/ideas.md` | clean |
| 321 | clean | clean |
| 319 | clean | clean |
| 314 | clean | clean |
| 307 | **conflict** `docs/agents/incidents.md` | **conflict** `docs/agents/incidents.md` |
| 317 | clean | clean |
| 318 | **conflict** `docs/agents/incidents.md` | **conflict** `docs/agents/incidents.md` |
| 290 | **conflict** `docs/ideas.md` | clean |
| 305 | **conflict** `docs/ideas.md` | clean |

**Six of eleven become two of eleven, and the difference is one command
that no seat's bootstrap runs.** `.gitattributes` declares
`docs/ideas.md merge=ledger`, and the command behind that name lives in
`.git/config`, which is per-clone and never committed.
`tools/ledger/install-driver.sh` writes it and says "run once per
clone" in its own header. Every seat gets a fresh clone every run and
nothing runs it, so the driver this organization built on 2026-09-27 has
never been active in a seat's clone.

The two that remain are both this seat's and both in
`docs/agents/incidents.md`, which had no `.gitattributes` entry at
all. The engineer's open #305 adds one, with a second driver for the
`## `-keyed registers, and it is the right fix. It is also per-clone by
the same mechanism, and its own design document says so.

So the landing order worth handing the owner is the second column's, and
its preconditions are two commands rather than none:

1. `bash tools/ledger/install-driver.sh` in the clone doing the merging.
2. **#305 first**, after its author rebases it, because it is what wires
   `docs/agents/incidents.md` and until it lands rows 307 and 318
   conflict by construction.

Then: 315, 316, 320, 321, 319, 314, 317, 290, 305, then this seat's
chain tip, which absorbs #269, #288, #302 and #307 in one decision.

**Instrument named beside every verdict above**, per this file's own
rule, because a conflict verdict a seat cannot re-measure is a verdict
that costs a run (Ursa incidents 17 and 18).

## 2026-10-24 ~11:5x UTC — twenty-fourth window: the queue grew by nine in five hours and the order above still holds

**Re-measured, not inherited.** The section above was written at 06:57
with fourteen open. There are now **twenty-three**, and four of the
identifiers it sequenced (314, 315, 319, and the one it called row 307's
partner) have left the queue, so its list is read for its *reasoning*
rather than copied.

Instrument, named per this file's rule, on a clone that ran §0's
bootstrap in full — unshallowed **and** widened, because a single-branch
refspec reports every branch as deleted (runner-facts §11, §13):

```bash
git fetch origin '+refs/pull/*/head:refs/prs/*' --quiet && git fetch origin --quiet
git merge-tree --write-tree origin/main refs/prs/<n> >/dev/null 2>&1   # exit 0 = clean
git rev-list --count refs/prs/<n>..origin/main                         # how far behind
```

| | |
|---|---|
| open pull requests | **23** (was 14 at 06:57) |
| conflicting with `main` | **5** — 290, 305, 316, 320, and draft 331 |
| clean | 18 |
| drafts | **3**, all other seats': 329, 331, 333 |
| this seat's drafts | **zero**, which is the point of this window |

**This seat's chain is unchanged and is one decision.** 269 → 288 → 302
→ 307 → **318**, each contained in the next, all five **readied**:

```bash
git merge-base --is-ancestor refs/prs/307 refs/prs/318   # exit 0 = contained
```

318 merges clean and is 5 commits behind `main`. Merging 318 alone lands
all five; merging them in order also works, because each is an ancestor
of the next. The four older ones are deliberately **left standing**
rather than closed, under the fifth case in the charter's own-open-PRs
rule: they are readied artifacts sitting in a gate, and a descendant
costs the queue nothing once the older one merges.

**The two preconditions from 06:57 both still apply and neither has
been met.** `bash tools/ledger/install-driver.sh` is still per-clone and
still run by nothing, and **#305**, which wires `docs/agents/incidents.md`
to a `## `-keyed driver, is **still conflicting** and still unrebased —
12 behind. Until it lands, every pair of this org's windows that appends
to `docs/agents/incidents.md` collides by construction. That is the
single highest-leverage merge in the queue and it is blocked on its
author rebasing, not on a decision.

**Order worth handing the owner, newest measurement:**

1. **#305 first**, after its author rebases — it unblocks the register
   collisions for every later merge.
2. The clean, unconflicted PM and research rows, which are the bulk:
   313, 317, 321, 322, 323, 325, 326, 327, 328, 330, 332.
3. **#318**, which absorbs 269, 288, 302 and 307 in one decision.
4. 290, 316, 320 after their authors rebase. Draft 331 is not a
   decision yet and conflicts; its own seat's next window owns it.

**One number for the drag, because it belongs beside the order.** This
seat's work feed reports `shipped: 0` across three days against five
pull requests in review, and the charter copy on `main` is **654 lines
behind** the copy this window actually ran on — read from `refs/prs/318`
per §0, because the handed checkout does not carry this seat's own
rules. Every rule in this window's diff that compounds across
forty-one seats compounds nothing while it sits here.

---

## Re-measured 2026-10-24 12:0x UTC, twenty-fifth window

Against `origin/main`, on a clone confirmed complete first: 1,034 commits,
`--is-shallow-repository` false, refspec widened per §0.

| | |
|---|---|
| open pull requests | **25** (3 drafts, none this seat's) |
| merged in the last seven days | **47** |
| oldest open | **5.7 days**, this seat's earliest chain member |
| this branch against `origin/main` | **CLEAN** (`git merge-tree --write-tree --name-only`) |

**Merges outnumber the open queue, so §5b's depth warning does not
fire.** The gate is absorbing work faster than the org produces it, and
the order below is therefore not a rescue plan. It is one predicate
inside a working gate.

**The one class that is stuck, and it is this window's finding.** Of the
**fourteen** pull requests that merged since 2026-10-20 12:30 UTC,
**zero** touch a `prompts/*-agent.md` file. The last charter-touching
merge in this repository is 2026-10-18, when eight landed. The cause is
`INC-2026-10-24-authority-clock-written-into-the-asking-seats-charter`:
the release route that was timed to that instant was recorded only in
the asking seat's charter, and the acting seat's charter on `main` has
never contained it. Nothing in this order clears that. The owner does,
or she delegates it.

### The collision count, which grows with the queue and has an unmerged fix

Measured by diffing every open pull request rather than by inspection:

| register | open pull requests appending to it |
|---|---|
| `docs/agents/incidents.md` | **10** — 269, 288, 302, 307, 313, 317, 318, 328, 332, 334 |
| `docs/agents/learning-log.md` | **5** — 269, 288, 302, 307, 318 |

Five of the ten are this seat's own chain and merge as one decision. The
other five are four other seats, so **five independent appends to one
append-only register are in the queue at once**, which is
`INC-2026-10-24-shared-register-tail-appends-collide` by construction
and not by accident.

**The fix exists and is not on `main`, so do not record this as closed.**
Ursa's engineer told this seat on the board at 02:01 that it had adopted
HQ's register merger and that "your register merges without a human
now". That is a true claim about its branch. Measured on `origin/main`
at 12:0x, `.gitattributes` declares exactly one driver and it covers
`docs/ideas.md` only:

```bash
git show origin/main:.gitattributes        # one rule, docs/ideas.md merge=ledger
gh pr view 305 --json state --jq .state    # OPEN
```

So neither register in the table above has a driver on the default
branch, and `tools/merge-register.py` is the third name the `L-*`
enforcement sweep now returns as missing, up from two. This is the
charter's own rule paying for itself: a sibling seat's "I have fixed it"
is a claim about its repository, never about the surface you read.

### Landing order

Unchanged in shape from the twenty-second window's plan above, with one
correction: **#305 first**, ahead of the register-touching crowd, because
it is the driver every one of those ten appends needs and merging it
first is the difference between one conflict and nine.

1. **#305**, the register merge driver.
2. The non-register, non-charter pull requests, which the gate is
   already clearing at seven a day.
3. **#318**, which absorbs 269, 288, 302 and 307 in one decision, and
   which cannot move until the charter question is answered.

Instrument beside every verdict in this section:
`git merge-tree --write-tree --name-only origin/main HEAD` for the
clean/conflict column, `gh pr diff --name-only` for the register
table, and `gh pr list --state merged` joined to `gh pr diff` for the
charter-merge count. No verdict here comes from GitHub's cached
`mergeable` field.

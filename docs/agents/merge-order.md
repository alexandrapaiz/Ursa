# Merge order — Ursa

Written each run by the exo seat (`prompts/exo-agent.md` §5b). Replaces
the previous plan rather than appending to it. **Measuring the queue and
naming the order is information for the owner; merging is hers alone.**

Every verdict below names the instrument that produced it, because a
conflict verdict with no instrument beside it cannot be re-measured by
the seat holding the branch.

## Measured 2026-10-24, 16:4x UTC, thirtieth exo window

| | |
|---|---|
| open pull requests | **36** |
| merged in the last seven days | **49** |
| oldest open | **#288**, 2026-10-23T19:08:59Z, about twenty-one hours |
| open that are contained in another open one | **27 of 36** |
| merges that would close all thirty-six | **9** |
| open that conflict with `main` | **none** |

Open does not outnumber the week's merges, so the depth warning does not
fire. The gate is absorbing faster than the org produces. **The number
that matters is the containment, not the depth: nine merges close
thirty-six pull requests.**

The queue grew from thirty-one to thirty-six in three hours while the
number of decisions in it fell from eleven to nine, which is the shape
to expect from seats that stack. A count of open pull requests is not a
count of things anyone has to read.

## No conflicts, and the instrument is the reason

Instrument: `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>`, run on an unshallowed clone with a widened refspec (§0),
**after** `bash tools/ledger/install-driver.sh`.

All thirty-six exit 0. That last step is load-bearing rather than
hygienic, and the twenty-ninth window is why: `main` declares
`docs/ideas.md merge=ledger` in `.gitattributes`, a named merge driver
is registered **per clone**, so a fresh host clone holds the declaration
without the driver and git falls back to line hunks with no warning.
Every `docs/ideas.md` conflict verdict published from a fresh clone is a
claim about the clone. It is the fourth member of the family of
instruments that answer wrongly from the clone the host hands a run,
after shallow depth, the single-branch refspec, and the stale copy of
HQ's tools.

## The nine tips, and nothing else needs a decision

Every other open pull request is contained in one of these. Instrument:
`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`, exit
0 meaning contained, run over every pair of the thirty-six open heads.

| tip | seat | what it closes with it |
|---|---|---|
| **#290** | engineer | nothing, it stands alone |
| **#337** | exo | #288 |
| **#358** | research | #322, #325, #330, #333, #335, #338, #340, #345, #351, #355 |
| **#359** | skill | #316, #320, #348 |
| **#360** | frontend | #342 |
| **#361** | engineer | #305, #327, #346 |
| **#362** | exo | #344, #350 |
| **#363** | market | #357 |
| **#364** | pm | #339, #341, #343, #347, #349, #353 |

Nine decisions, thirty-six pull requests. **#358 and #364 alone carry
sixteen of them.**

## Order, and the dependency this file got wrong an hour ago

**Correction, and it is to a sentence written in this window.** The
first draft of this section said the nine tips are independent of each
other, on the ground that all thirty-six merge clean against `main`.
That inference is false, and Ursa's PM measured it at 16:33:57 UTC
while this window was still running. **Clean against `main`
individually does not mean clean against each other**, because `main`
moves as each one lands and the second is then merged against a base
that already holds the first.

Re-derived here rather than accepted, by performing the merges in a
detached scratch worktree, which is what §5b has always required and
what the first draft of this section skipped:

```bash
git worktree add -q --detach /tmp/wt origin/main
cd /tmp/wt && git merge --no-edit refs/prs/337   # clean
            && git merge --no-edit refs/prs/362   # CONFLICT, six files
```

The six: `prompts/exo-agent.md`, `docs/agents/incidents.md`,
`docs/agents/learning-log.md`, `docs/agents/runner-facts.md`,
`docs/agents/improvements.md` and `docs/agents/merge-order.md`. The PM
said six files and the simulation says six files. Both of this seat's
chains append to the same five registers, so they collide by
construction and the engineer's register driver does not cover four of
the five, which is the open class named at the foot of this file.

**So the per-pull-request conflict table above answers a different
question from the order below it, and only the simulation answers the
order.** That is the trap: "zero conflicts with `main`" is true, it is
published in a table, and it invites exactly the sentence this
correction retracts. An order that has not been simulated is a guess,
and this file published one for about an hour.

Two notes on sequence, both now measured rather than reasoned.

1. **#361 before the register-heavy tips.** It carries
   `tools/registers/`, whose driver makes `docs/agents/incidents.md`
   merge between two seats with no human. Landing it first removes the
   one mechanical reason the remaining branches would ever collide, and
   the twenty-ninth window verified it by performing the merge rather
   than by reading the claim.
2. **#337 and #362 cannot both land unattended**, which is the
   corrected finding. They are this seat's two chains, neither contains
   the other, and the second to land needs a hand resolution on six
   register files. The cheapest disposition is to merge **#362** and
   close #337 against it, because #362 is the newer, carries the larger
   diff and holds every charter finding of the last four windows, while
   #337's unique contribution is the sprint and decision files it
   imported from another seat's branch to clear a register collision
   that the engineer's driver has since fixed. That is a
   recommendation to the owner and not an act: this seat does not close
   a pull request the PM has named in an open ask.

## The one class the queue cannot tell you about

Six days with **zero** merges of any `prompts/*-agent.md` file. The gate
is working and one predicate inside it is stuck, which is
`INC-2026-10-18-tier-c-charter-freeze` and the expired silence clock
recorded with it. Nothing in the order above changes that, and five of
the nine tips touch no charter at all, so the freeze is not what is
holding the queue.

# Merge order — Ursa

Written each run by the exo seat (`prompts/exo-agent.md` §5b). Replaces
the previous plan rather than appending to it. **Measuring the queue and
naming the order is information for the owner; merging is hers alone.**

Every verdict below names the instrument that produced it, because a
conflict verdict with no instrument beside it cannot be re-measured by
the seat holding the branch.

## Measured 2026-10-24, 13:5x UTC, twenty-ninth exo window

| | |
|---|---|
| open pull requests | **31** |
| merged in the last seven days | **49** |
| oldest open | **#288**, 2026-10-23T19:08:59Z, about nineteen hours |
| open that are contained in another open one | **20 of 31** |
| merges that would close all thirty-one | **11** |

Open does not outnumber the week's merges, so the depth warning does not
fire. The gate is absorbing faster than the org produces. **The number
that matters here is not the depth, it is the containment: eleven merges
close thirty-one pull requests.**

## The eleven tips, and nothing else needs a decision

Every other open pull request is an ancestor of one of these, measured
with `git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`,
exit 0 meaning contained.

| tip | seat | contains | merges clean into `main`? |
|---|---|---|---|
| **#355** | research | 322, 325, 330, 333, 335, 338, 340, 345, 351 | clean |
| **#353** | pm | 339, 341, 343, 347, 349 | **needs a hand**, see below |
| **#350** | exo | 344 | clean alone; collides with #337, see below |
| **#348** | skill | 316, 320 | clean |
| **#346** | engineer | 305, 327 | clean |
| **#337** | exo | 288 | clean |
| **#356** | frontend | — | clean |
| **#354** | market | — | clean |
| **#352** | market | — | clean |
| **#342** | frontend | — | clean |
| **#290** | engineer | — | clean, **with the ledger driver installed** |

## The one order that was simulated and worked

Performed, not reasoned: a detached worktree on `origin/main`, the two
per-clone merge drivers registered, then the merges in this sequence.
Create the worktree detached, since `git worktree add /tmp/x main`
checks out `main` and the simulated merges then advance it.

```
1. #346   engineer — FIRST, because it carries tools/registers/
2. #290  #342  #348  #352  #354  #355  #356
3. #337   exo
4. #350   exo — after #337, needs a hand on four registers and the charter
5. #353   pm — needs a hand on docs/ideas.md, by the driver's own refusal
```

**#346 goes first for a reason that changes the cost of everything
after it.** It carries `tools/registers/`, the register merge driver the
engineer seat shipped on 2026-10-24. With it installed,
`docs/agents/incidents.md` merges between two seats' branches with no
human, which is that seat's claim and it is **verified here**: merging
#350 onto #337 conflicts on five files before, and incidents.md is not
one of them after.

## Two verdicts that were wrong before the instrument was configured

**1. Four pull requests read as conflicting on `docs/ideas.md` and none
of them conflict.** `main` carries `.gitattributes` declaring
`docs/ideas.md merge=ledger`, and the driver behind that name is
registered **per clone** by `tools/ledger/install-driver.sh`. A fresh
clone has no driver, so the declaration resolves to nothing and the
merge falls back to line hunks.

| pull request | before `install-driver.sh` | after |
|---|---|---|
| #290 | CONFLICT `docs/ideas.md` | **clean** |
| #305 | CONFLICT `docs/ideas.md` | **clean** |
| #316 | CONFLICT `docs/ideas.md` | **clean** |
| #320 | CONFLICT `docs/ideas.md` | **clean** |

Instrument: `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>`, run twice in the same clone, with
`bash tools/ledger/install-driver.sh` between the two runs. **So any
conflict verdict on `docs/ideas.md` taken from a fresh host clone is a
claim about the clone**, exactly as a `NO SUCH REMOTE BRANCH` line is.
Register the drivers before you measure, and say that you did.

**2. Two pull requests read as conflicting and were simply not fetched.**
#355 and #356 returned `not something we can merge`, which is
`merge-tree` reporting a missing ref with the same non-zero exit it uses
for a conflict. Both were opened after this run's fetch. Re-fetch
`+refs/pull/*/head:refs/prs/*` and re-measure; both are clean. Print the
command's output rather than its exit status.

## The two that genuinely need a human, with the reason

- **#353** (pm) conflicts on `docs/ideas.md` **by the ledger driver's own
  refusal**, which is the honest kind: `3 block(s) in docs/ideas.md were
  edited on both sides and need a human`, naming the preamble and a
  research entry. That is the driver working. It also conflicts on
  `docs/agents/incidents.md` unless #346 lands first.
- **#350** (exo, this window) conflicts with **#337** (exo) on
  `docs/agents/improvements.md`, `learning-log.md`, `merge-order.md`,
  `runner-facts.md` and `prompts/exo-agent.md`. Both are this seat's
  tips from different windows, and neither contains the other. Either
  order works; the second one merged needs the hand resolution. **One
  owner decision covers the pair.**

## The class the register driver does not yet cover

`tools/registers/registers.json` declares five registers and enables
**two**: `docs/agents/incidents.md` and `docs/decisions.md`.
`docs/agents/learning-log.md` is declared and disabled, and
`improvements.md`, `runner-facts.md` and `merge-order.md` are not
declared at all. All four are append-only tail-written registers owned
by this seat, which is the identical shape, so the engineer's fix covers
one of the five files this seat's windows collide on. Measured above:
with the driver installed, #350 onto #337 still conflicts on four
registers and the charter. An unenumerated class is not a closed
incident, so this is handed to Ursa's engineer rather than filed as a
defect, since `tools/` is that seat's lane. The charter is not a
register and will always need a human.

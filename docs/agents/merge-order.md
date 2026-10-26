# Merge order — the queue, measured and ordered

Replaced wholesale each run by Ursa's ExO seat under
`prompts/exo-agent.md` §5b. Nothing in this file is carried forward: a
line absent from the newest copy is the point of the file, not a loss.

**Measured 2026-10-26, 20:3x UTC, sixty-second window**, against
`origin/main` at `9e2f21b7`, in a clone that was unshallowed and had its
refspec widened first (§0, verified: `--is-shallow-repository` prints
`false`, `main` carries 1,616 commits), **and that had the repository's
merge drivers registered before any merge was performed**. Every verdict
was performed rather than asked of GitHub.

**The driver registration is new this run and it is the difference
between this copy and the last one.** `bash tools/registers/install-drivers.sh`,
once in the checkout and once in every scratch worktree, because a
worktree does not inherit it. Without it `git merge-tree` exits 128 with
`fatal: custom merge driver ledger lacks command line.` on any pair that
both touch `docs/ideas.md`, `docs/decisions.md` or
`docs/agents/runner-facts.md`, and §5b's old wording reads that as a
conflict. The measurement, the three failure modes and the exit-code
table are `docs/agents/runner-facts.md` §48.

## The headline: there is no conflict in this queue, and eight merges close all seventeen

The previous copy of this file named a trunk conflict on one head and an
order-independent collision on a pair, and told the engineer seat to
rebase. **Both are withdrawn.** The trunk verdict was already withdrawn
by window 61. The collision is real driverless and resolves to nothing
with the driver registered, which is Ursa's engineer seat's measurement,
reproduced independently here on the same pair.

| order | merge | seat | closes with it | verdict vs `main` | tier | instrument |
|---|---|---|---|---|---|---|
| 1 | **549** | engineer | 520, 530, 540, 545 | CLEAN | B | `merge-tree` + sequenced `git merge`, drivers registered |
| 2 | **550** | pm | 517, 546 | CLEAN | B | same |
| 3 | **551** | security | 532 | CLEAN | B | same |
| 4 | **548** | exo | 536 | CLEAN | B | same |
| 5 | **552** | skill | 547 | CLEAN | B | same |
| 6 | **509** | market | — | CLEAN | B | same |
| 7 | **395** | research | — | CLEAN | **C** | same |
| 8 | **447** | exo | — | CLEAN | **C** | same |

Eight merges, seventeen pull requests closed. Nine of the seventeen are
contained in another open head and close for free.

**The order is verified by performing it**, in a detached scratch
worktree with the drivers registered, against `origin/main` and never
against `main`:

```
549 OK  550 OK  551 OK  548 OK  552 OK  395 OK  447 OK  509 OK
all 17 open heads contained in the simulated result
```

The two Tier C rows are last deliberately, because they wait on the
owner and nothing below them depends on them.

## Containment, measured rather than assumed

Instrument: `git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`,
exit 0 meaning contained, stated in the direction §"Read your own seat's
open PRs first" requires.

```
517 is contained in 546, 550        532 is contained in 551
520 is contained in 540, 549        536 is contained in 548
530 is contained in 540, 549        540 is contained in 549
545 is contained in 549             546 is contained in 550
547 is contained in 552
```

The eight tips above are exactly the heads contained in nothing.

## Pairwise, and the half this seat cannot measure

Every ordered pair of the seventeen open heads, drivers registered:
**zero** real conflicts. Driverless, fourteen pairs collide and all
fourteen are on `docs/ideas.md`.

**GitHub's green button honours no `.gitattributes` driver.** That is the
engineer seat's measurement, written up in its own repository as Finding 1
of `docs/design/server-side-merge-measurement.md`, and this seat has not
independently reproduced it. So the second head of a colliding pair will
show CONFLICTING at the button the moment the first lands, and the
remedy is one command on the second head,
`bash tools/ledger/requeue.sh --push <second>`, rather than a rebase.
Either order works. Nothing in the table above needs reordering for it.

## The two numbers for the owner

| | |
|---|---|
| open pull requests | **17** |
| merged in the last seven days | **87** |
| oldest open | 395, created 2026-10-24 21:21 UTC, about 47 hours |

Open is far below the week's merges, so **no depth warning**. The gate is
absorbing faster than the seats produce.

**The queue moved four times while this file was being written**, from 14
to 17 open heads between 20:0x and 20:3x UTC, and two of this window's
own pairwise rows were pull requests that did not exist at its fetch. A
row in this table is a claim about 20:3x UTC and no later instant. Fetch
`refs/prs/*` immediately before acting on any row of it, because a
missing ref exits 1 with an empty file list and reads as a conflict
(runner-facts §48).

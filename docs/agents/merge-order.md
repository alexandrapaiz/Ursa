# Merge order — what the owner can land right now

Replaced wholesale every run of the ExO seat, per `prompts/exo-agent.md`
§5b. Measured **2026-10-26 at 06:11–06:14 UTC** against `main` at
`5b7bcf61`, with the pull refs re-fetched immediately before the census.
An order that has not been simulated is a guess, so the order below was
performed in sequence in a detached scratch worktree.

## The three numbers

| | |
|---|---|
| open pull requests | **12**, seven of them drafts |
| merged in the last seven days | **68** |
| oldest open | `#395`, 2026-10-24 21:21 UTC, **33 hours** |

Open does not outnumber the week's merges, so the depth warning does not
fire. One number inside the gate has not moved in eight days: **zero of
the 68 merges touched any `prompts/*-agent.md`**, and `main`'s newest
charter commit is `94e926b7` of 2026-10-18 18:50. Instrument:
`gh pr list --state merged --limit 400 --json number,mergedAt,files`
with the predicate `test("^prompts/.*-agent\\.md$")`, never the
directory, because `prompts/skill-extract.md` is the skill seat's
ordinary work surface and not a charter.

## Nine decisions, not twelve

Containment, instrument
`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`,
exit 0 = contained. Stated contained-in-tip, never as "ancestor of".

| chain | members | tip | decisions saved |
|---|---|---|---|
| the skill seat's | `#441` ⊂ `#445` ⊂ `#448` ⊂ `#477` | **#477** | 3 |

So 12 open pull requests are **nine** decisions: eight standalone
(`#395 #447 #461 #463 #473 #475 #476 #478`) plus one chain tip.

The three older skill pull requests each read `needs-local-merge` on
their own and need nothing, because `#477` contains all three and is
clean in both directions. That seat performed the local merge on its
newest tip, which is the whole of the remedy for all four.

## Three states, because one instrument answers two of them

HQ's `tools/check-merge-queue.sh` pins the **driverless** merge
deliberately: GitHub merges server-side in a clone with no drivers, so
the driverless merge is the button's verdict permanently. That is the
right question for "what can the owner land right now". It is not the
same question as "does the result satisfy this repository's own merge
semantics", and this run measured both for all twelve.

| PR | seat | button | this repo's drivers | state |
|---|---|---|---|---|
| `#478` | exo | merges | merges | ready |
| `#477` | skill (tip of 4) | merges | merges | ready |
| `#476` | market | merges | merges | ready |
| `#473` | frontend | merges | merges | ready |
| `#447` | exo | merges | merges | ready, **Tier C** |
| `#395` | research | merges | merges | ready |
| `#463` | engineer | merges | **refuses** | **drivers-disagree** |
| `#475` | pm | refuses | merges | needs-local-merge |
| `#461` | security | refuses | merges | needs-local-merge |
| `#448` `#445` `#441` | skill | refuses | merges | needs-local-merge, **and contained in `#477`** |

Instruments, one per column, named because a verdict with no instrument
beside it cannot be re-measured by the seat holding the branch:

- **button column** — `git merge --no-edit refs/prs/<n>` in a detached
  worktree off `origin/main` with
  `-c merge.ledger.driver='git merge-file …' -c merge.register.driver='git merge-file …'`,
  which is the override HQ's `check-merge-queue.sh` uses and the form
  that touches no state the clone keeps. Cross-checked against the tool
  itself, run from `/srv/asc/repos/alexandra-systems/tools/`, verified
  byte-identical to HQ's `main` this run.
- **drivers column** — the same merge with
  `tools/ledger/install-driver.sh` and
  `tools/registers/install-drivers.sh` run in the **parent** clone, never
  inside the worktree, with `git config --get merge.register.driver`
  asserted afterwards to name this clone's `tools/`.

## The landing order, simulated

```
478  476  473  477  395  447
```

Six of six merged in sequence with nothing to resolve. `#447` is last
and is the only Tier C item. `#478` is first because it carries the
register account of everything in this file, including the restored
entry below.

**Not in the order, and none of these three wait on her:**

- `#463` (engineer) — **drivers-disagree.** The button accepts it; this
  repository's `ledger` driver refuses it, naming one block in
  `docs/ideas.md` edited on both sides: `### 2026-10-26 (engineer, hook
  run) — Craft scan: tesh 0.3.2 and txm 8.2.0, …`. `main` removed that
  block's `- Cost:` and `- Status:` lines, `#463` rewrote its
  `- First step:` line into a paragraph, and the two edits fall on
  different lines so git combines them by position. One judgement, owed
  by the entry's author. Not a rebase and not the owner's.
  `INC-2026-10-26-clean-from-the-button-is-not-clean-from-this-repositorys-own-merge-semantics`.
- `#475` (pm), `#461` (security) — **needs-local-merge.** Mechanical, no
  judgement, no owner: run the driver installers, merge `origin/main`
  into the branch locally, push. After that the button has nothing left
  to resolve. Both seats were told on the board this run, with the
  command.

This seat did exactly that to both its own branches this run, which is
why `#447` and `#478` are in the ready rows. `#447` read
`needs-local-merge` at 06:0x and `ready` at 06:1x, and the only thing
that changed was one local merge.

## A pair named from outside, re-derived

HQ's `exo-centralizer` named `[465, 470]` as this seat's stacked pair in
a board note at 05:52:03 UTC and routed it to Ursa's PM. Both were
`ursa-pm` branches, both based on `main`, and both were interior members
of a **six**-deep chain whose tip was `#472`. The routing was right and
the attribution and the depth were not. All six merged between 06:00 and
06:11, so the chain is gone and nothing is owed. Instrument:
`gh pr view <n> --json baseRefName,headRefName,state`.

## Housekeeping done this run

Six remote branches deleted under §5b's predicate — every pull request
that ever pointed at the name is merged — each checked individually with
`gh pr list --head <branch>` rather than taken from the group query,
because all six had merged within the preceding two hours:
`ursa-engineer/2026-10-26-hook`, `ursa-frontend/2026-10-26-hook`,
`ursa-market/2026-10-26-message-20`, `ursa-market/2026-10-26-message-21`,
`ursa-market/2026-10-26-message-topics`, `ursa-security/2026-10-26-hook`.
217 remote branches before, 211 after. The branches of the eleven pull
requests that merged while this run was measuring are the next run's,
under the same predicate and the same per-branch check.

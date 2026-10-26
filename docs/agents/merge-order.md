# Merge order — what the owner can land right now

Replaced wholesale every run of the ExO seat, per `prompts/exo-agent.md`
§5b. Measured **2026-10-26 at 06:0x–06:1x UTC** against `main` at
`5b7bcf61`. An order that has not been simulated is a guess, so the
order below was performed in a detached scratch worktree in sequence.

## The three numbers

| | |
|---|---|
| open pull requests | **17**, six of them drafts |
| merged in the last seven days | **67** |
| oldest open | `#395`, 2026-10-24 21:21 UTC, **33 hours** |

Open does not outnumber the week's merges, so the depth warning does not
fire. One number inside the gate has not moved in eight days:
**zero of the 67 merges touched any `prompts/*-agent.md`**, and `main`'s
newest charter commit is `94e926b7` of 2026-10-18 18:50. Instrument:
`gh pr list --state merged --limit 300 --json number,mergedAt,files` with
the predicate `test("^prompts/.*-agent\\.md$")`, never the directory.

## Nine decisions, not seventeen

Containment, instrument
`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`,
exit 0 = contained. Stated contained-in-tip, never as "ancestor of".

| chain | members | tip | decisions saved |
|---|---|---|---|
| the PM's | `#462` ⊂ `#465` ⊂ `#467` ⊂ `#468` ⊂ `#470` ⊂ `#472` | **#472** | 5 |
| the skill seat's | `#441` ⊂ `#445` ⊂ `#448` | **#448** | 2 |

So 17 open pull requests are **nine** decisions: seven standalone
(`#395 #447 #461 #463 #473 #474 #478`) plus two chain tips.

**A note on a pair named from outside.** HQ's `exo-centralizer` named
`[465, 470]` as this seat's stacked pair in a board note at 05:52:03
UTC. Both are `ursa-pm` branches, both have base `main`, and both are
interior members of the six-deep chain above whose tip is `#472`. The
routing in that note is right — the chain is the PM's to resolve — and
the attribution and the depth are not. Re-derived here, instrument
`gh pr view <n> --json baseRefName,headRefName`.

## Two merges, not one, because the instruments answer different questions

HQ's `tools/check-merge-queue.sh` pins the **driverless** merge
deliberately: GitHub merges server-side in a clone with no drivers, so
the driverless merge is the button's verdict permanently. That is the
right question for "what can the owner land right now". It is not the
same question as "does the result satisfy this repository's own merge
semantics", and this run measured both. The second command is in
`docs/agents/runner-facts.md` §32.

| PR | seat | button (driverless) | this repo's drivers | state |
|---|---|---|---|---|
| `#478` | exo | clean | merges | **ready** |
| `#474` | market | clean | merges | ready |
| `#473` | frontend | clean | merges | ready |
| `#472` | pm (tip of 6) | clean | merges | ready |
| `#463` | engineer | clean | **refused** | **drivers-disagree** |
| `#461` | security | refuses | merges | needs-local-merge |
| `#448` | skill (tip of 3) | refuses | merges | needs-local-merge |
| `#447` | exo | clean | merges | ready, **Tier C** |
| `#395` | research | clean | merges | ready |

Instruments, one per column and named because a verdict with no
instrument beside it cannot be re-measured by the seat holding the
branch:

- button column: `bash tools/check-merge-queue.sh` from HQ's `main`,
  454 lines, `/srv/asc/repos/alexandra-systems/tools/` on this host,
  verified byte-identical to HQ's `main` this run.
- drivers column: `git merge --no-edit refs/prs/<n>` in a detached
  worktree off `origin/main`, with
  `tools/ledger/install-driver.sh` and
  `tools/registers/install-drivers.sh` run in the **parent** clone.

## The landing order, simulated

```
478  474  473  472  447
```

Five of five merged in sequence with nothing to resolve, in a detached
scratch worktree off `origin/main`, drivers registered. `#447` is last
and is the only Tier C item in the list.

`#395` merges clean on its own and was simulated separately rather than
in the order, because at 262 commits behind `main` it is the one branch
whose position in a sequence changes its diff.

**Not in the order, and why, because none of these three wait on her:**

- `#463` (engineer) — **drivers-disagree.** The button will accept it;
  this repository's `ledger` driver refuses it, naming one block in
  `docs/ideas.md` edited on both sides. Not a judgement the owner owes
  and not a rebase. The entry's author decides how the two edits
  combine. `INC-2026-10-26-clean-from-the-button-is-not-clean-from-this-repositorys-own-merge-semantics`.
- `#461` (security), `#448` (skill, tip of three) —
  **needs-local-merge.** Mechanical, no judgement, no owner: the
  authoring seat runs its driver installer, merges `origin/main` into
  its branch locally, and pushes. After that the button has nothing left
  to resolve. Both seats were told on the board this run.

This seat did exactly that to its own two branches this run, which is
why `#447` and the old `#454` are in the clean column rather than the
`needs-local-merge` one. Both read `needs-local-merge` at 06:0x and
clean at 06:1x, and the only thing that changed was one local merge
each.

## Housekeeping done this run

Six remote branches deleted under §5b's predicate — every pull request
that ever pointed at the name is merged — each checked individually with
`gh pr list --head <branch>` rather than taken from the group query,
because all six had merged within the preceding two hours:
`ursa-engineer/2026-10-26-hook`, `ursa-frontend/2026-10-26-hook`,
`ursa-market/2026-10-26-message-20`, `ursa-market/2026-10-26-message-21`,
`ursa-market/2026-10-26-message-topics`, `ursa-security/2026-10-26-hook`.
217 remote branches before, 211 after.

# Merge order — what the owner can land right now

Replaced wholesale every run of the ExO seat, per `prompts/exo-agent.md`
§5b. Measured **2026-10-26 at 09:5x UTC** against `main` at `25f2963d`,
with `refs/prs/*` re-fetched immediately before the census and **both
merge drivers registered** (`git config --get-regexp '^merge\.'` prints
six lines). Every verdict below is a merge that was **performed** with
`git merge-tree --write-tree --name-only`, in this checkout and not in a
scratch worktree — `runner-facts.md` §31 is why: the installer writes an
absolute path into a config that worktrees share, so simulating in a
scratch worktree repoints the drivers at it and every later verdict in
the main checkout fails open.

## The three numbers

| | |
|---|---|
| open pull requests | **10**, five of them drafts |
| merged in the last seven days | **77** |
| oldest open | `#395`, 2026-10-24 21:21 UTC, **36 hours** |

Open does not outnumber the week's merges, so the depth warning does not
fire. The number inside the gate that has not moved in eight days:
**zero of the 77 merges touched any `prompts/*-agent.md`**, so `main`'s
copy of this seat's charter is still the 2,221-line file of 2026-10-18
while the live one on `#447` is 5,662.

## Ten decisions, and no chains

`git merge-base --is-ancestor refs/prs/<a> refs/prs/<b>` over all ninety
ordered pairs: **no pull request contains another.** Every open pull
request is an independent decision, which is unusual for this queue and
is the direct result of the morning's merges clearing four stacks.

## Every open pull request merges clean — including the two the driverless tool calls conflicts

| PR | verdict | behind `main` | draft | branch |
|---|---|---|---|---|
| `#497` | clean | 0 | draft | `ursa-market/2026-10-26-message-28` |
| `#496` | clean | 28 | draft | `ursa-frontend/2026-10-26-message-d` |
| `#495` | clean | 0 | ready | `ursa-pm/2026-10-26-message-10` |
| `#494` | clean | 0 | draft | `ursa-engineer/2026-10-26-message-4` |
| `#492` | clean | 38 | ready | `ursa-exo/2026-10-26-message-2` |
| `#490` | clean | 59 | draft | `ursa-security/2026-10-26-message-2` |
| `#487` | clean | 62 | draft | `ursa-skill/2026-10-26-message` |
| `#461` | clean | 201 | draft | `ursa-security/2026-10-26-message` |
| `#447` | clean | 136 | ready | `ursa-exo/2026-10-26-message` |
| `#395` | clean | 414 | ready | `ursa-research/2026-10-24-hook-2` |

**Zero conflicts, and the two that matter are `#490` and `#461`.** HQ's
`check-merge-queue.sh`, run from this same clone twenty minutes earlier
with **no drivers registered**, reported both as `CONFLICT` in
`docs/ideas.md`, and said of each — correctly and in its own words —
that "every conflicting path declares a merge driver that this clone has
no command for, so whether a judgement is owed here was not measured".
With the drivers registered, the merges were performed and both are
clean.

That is a **2-of-10 to 0-of-10** reproduction, today, of the 4-of-15 to
0-of-15 measurement from 2026-10-25 that
`INC-2026-10-25-the-merge-sweep-this-charter-mandates-reports-four-false-conflicts-in-a-clone-as-handed`
records. The correction telling the PM to install the drivers before
taking *or repeating* a conflict verdict is the 30 lines of
`prompts/pm-agent.md` parked in `#447` (`runner-facts.md` §37), so the
seat holding the merge gate is reading the copy without it. The PM has
been told on the board; the lines cannot merge without the owner.

**Both instruments are right about different questions, and keep them
apart.** HQ's tool answers what GitHub's green button will do, which is
the driverless merge and is pinned there on purpose. The table above
answers what *this repository's own merge semantics* say. Where they
disagree on a declared register path, the second one is the judgement
and the first one is a warning that nobody measured it —
`INC-2026-10-26-clean-from-the-button-is-not-clean-from-this-repositorys-own-merge-semantics`.

## The order

Nothing is blocked on anything, so this is a priority list and not a
dependency order.

1. **`#495`** — PM, ready, behind 0. Tier B and the shallowest thing in
   the queue.
2. **`#492`** — this seat, ready, Tier B registers rooted in `main` with
   no `prompts/` path. The PM's call, and deliberately separate from
   `#447` so that register work does not enter the Tier C queue.
3. **`#395`** — research, ready, 36 hours old and the oldest thing here.
   It also carries **11 lines of `prompts/engineer-agent.md`**, which
   makes it Tier C and is the reason it has sat; the engineer has been
   told on the board that its charter edit is in there.
4. **`#447`** — this seat, ready, **the entire Tier C backlog**: 5,662
   lines of `prompts/exo-agent.md` and 30 of `prompts/pm-agent.md`.
   Eight days, 517 commits, no charter has reached `main`. Owner only.
5. **The five drafts** — `#497`, `#496`, `#494`, `#490`, `#487`. GitHub
   refuses to merge a draft at all, so none of these is actionable
   however clean it is. Two of the five are the **security** seat's
   (`#490` and `#461`), and `#461` is 201 commits behind with a live run
   named in its title as inheriting it. That is the seat to ask.

## What this file is not

It is not a claim that the owner should merge all four ready pull
requests. It is the answer to "what can be landed in the next ten
minutes", which is the question the depth number does not answer and
which three consecutive runs in 2026-10-04 reported without answering.

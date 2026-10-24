# Merge order — Ursa

Written each run by the exo seat (`prompts/exo-agent.md` §5b). Replaces
the previous plan rather than appending to it. **Measuring the queue and
naming the order is information for the owner; merging is hers alone.**

Every verdict below names the instrument that produced it, because a
conflict verdict with no instrument beside it cannot be re-measured by
the seat holding the branch.

## Measured 2026-10-24, 17:35 UTC, thirty-third exo window

Clone state when these were measured, because both of this file's
instruments lie otherwise (runner-facts §9 and §10):
`--is-shallow-repository` answers `false`, `remote.origin.fetch` is the
full `+refs/heads/*` glob, and `refs/prs/*` was re-fetched immediately
before the reads.

| | |
|---|---|
| open pull requests | **21** |
| of those, drafts | **3** (#359 skill, #379 engineer, #380 research) |
| merged in the last seven days | **54** |
| oldest open | **#290**, 2026-10-23T23:45:51Z, about seventeen hours |
| open that are contained in another open one | **8 of 21** |
| merges that would close all twenty-one | **13** |
| open that conflict with `main` | **5**, and they are one chain |

Open does not outnumber the week's merges and it is not close —
fifty-four against twenty-one — so the depth warning does not fire. The
queue fell from twenty-five to twenty-one in thirty minutes while the
decisions in it went from nine to thirteen, which is the gate absorbing
stacks faster than new tips arrive.

**Thirteen tips, not twenty-one artifacts.** The tips are #359, #360,
#361, #369, #372, #373, #375, #376, #377, #378, #379, #380, #381.
Measured, in the direction that cannot invert:

```
#290 contained in #379      #342 contained in #360
#316 contained in #320      #362 contained in #374
#316 contained in #348      #374 contained in #378
#320 contained in #348
#348 contained in #359
```

Each line is `git merge-base --is-ancestor refs/prs/<contained>
refs/prs/<tip>` exiting 0, on the unshallowed clone. **All of these are
true ancestry and not the in-lane-superset relation** the thirty-first
and thirty-second windows had to rule on, so no per-file comparison is
needed to act on them. That is worth saying because it is the first
queue reading in three windows where the cheap instrument is the
sufficient one.

## Five conflicts with `main`, one chain, one file

| pull request | conflicting file |
|---|---|
| #290 | `docs/ideas.md` |
| #316 | `docs/ideas.md` |
| #320 | `docs/ideas.md` |
| #348 | `docs/ideas.md` |
| #359 | `docs/ideas.md` |

```bash
git merge-tree --write-tree --name-only origin/main refs/prs/<n>
```

One file, five artifacts, and four of the five are contained in the
fifth. So this is **one conflict to resolve, not five**, and the seat
that has to resolve it is whoever holds #359 — the skill seat, whose tip
is a draft. `docs/ideas.md` is an append-only proposal list and the
collision is the shape the register-merge work in #378's inherited
`docs/design/register-merge.md` is aimed at: two seats appending to the
same tail from a shared base.

**Nothing of this seat's conflicts.** #378, #374 and #362 all merge
clean against `main` by the same instrument.

## This seat's own stack

- **#378** is the tip. It contains **#374** and **#362** by ancestry,
  and it additionally contains `main`, which #374 does not — `main` is
  not an ancestor of #374, so #378 is the only one of the three that is
  a descendant of the default branch.
- **#374 and #362 are left open deliberately.** Both are named in this
  seat's own note to the owner of 17:12:54 UTC, whose data says
  `merge_this: 374`. "Read your own seat's open PRs first" forbids
  closing a pull request named in an open ask to her. The pointer
  correction is published on the board instead.
- Tier: **C**, because the stack edits `prompts/exo-agent.md`. #378's
  own 14 lines of that file are instruction and move no authority.

## The charter freeze, restated by date

**Zero merges of any `prompts/*-agent.md` file since 2026-10-18 at
19:02 UTC**, which is now five days and twenty-two hours. State this by
date and never by a seven-day window: the seven-day query returns eight
charter merges and every one of them landed on 2026-10-18, five inside
the same minute, so a window reading the seven-day count concludes the
freeze has lifted. That is
`INC-2026-10-18-tier-c-charter-freeze` and the expired silence clock
recorded with it.

Four of the thirteen tips touch no charter at all, so the freeze is not
what is holding this queue.

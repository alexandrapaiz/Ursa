# Merge order — what the owner can land right now

Replaced wholesale every run of the ExO seat, per `prompts/exo-agent.md`
§5b. Measured **2026-10-26 at 09:3x UTC** against `main` at `132398fb`,
with `refs/prs/*` re-fetched immediately before the census and both
merge drivers registered by `tools/ledger/install-driver.sh`. Every
verdict below is a merge that was **performed**, in a detached scratch
worktree, not a prediction.

## The three numbers

| | |
|---|---|
| open pull requests | **11**, seven of them drafts |
| merged in the last seven days | **71** |
| oldest open | `#395`, 2026-10-24 21:21 UTC, **36 hours** |

Open does not outnumber the week's merges, so the depth warning does not
fire. The number inside the gate that has not moved in eight days:
**zero of the 71 merges touched any `prompts/*-agent.md`**, so `main`'s
copy of this seat's charter is still the 2,221-line file of 2026-10-18
while the live one is 5,490.

## Nine decisions, not eleven

Containment, instrument
`git merge-base --is-ancestor refs/prs/<contained> refs/prs/<tip>`,
exit 0 = contained. Stated contained-in-tip, never as "ancestor of".

| chain | members | tip | decisions saved |
|---|---|---|---|
| the engineer seat's | `#463` ⊂ `#482` ⊂ `#485` | **#485** | 2 |

So 11 open pull requests are **nine** decisions: eight standalone
(`#395 #447 #461 #481 #483 #484 #486 #487`) plus one chain tip.

**And the chain retires window 49's one open judgement.** `#463` was the
`drivers-disagree` case — clean to the button, refused by this
repository's `ledger` driver on a single block of `docs/ideas.md` — and
window 49 routed it to the engineer seat as a judgement that seat owed.
Re-measured this window: `#463` still refuses with the drivers, and
`#485`, which contains it, **merges clean with the drivers**. The
engineer resolved it in the ordinary course of stacking. Nobody owes a
judgement; the decision is `#485` and `#463` should not be merged on its
own. Retired, fixed differently, which is the class HQ's centralizer
named this morning.

## Three states, and the third is empty this window

| state | pull requests | who acts |
|---|---|---|
| **clean** — the button takes it and the drivers agree | `#395 #447 #481 #483 #484 #486 #487` | the owner, or the PM under Tier B |
| **needs-local-merge** — the button refuses, the drivers resolve it, no judgement required | `#461 #482 #485` | the **authoring seat**, by merging `main` into its own branch and pushing the resolved tree |
| **drivers-disagree** — the button takes it and the drivers refuse, which is the dangerous direction | **none** | — |

All three `needs-local-merge` entries are drafts of live or
recently-killed runs (`security`, `engineer` ×2), so no seat needs to be
told; each will see it on its own next pass. `#482` is contained in
`#485` and needs nothing of its own.

## The order

Simulated in sequence in a scratch worktree, each merge performed on the
result of the last, drivers registered:

1. `#481` — this seat's register half. Tier B, registers only, no
   `prompts/` path. Take it first because it is the only entry that
   carries another window's finished work (`#478`, absorbed and closed).
2. `#486` — the PM's standup.
3. `#487` — the skill seat's twenty-seventh run.
4. `#483` — market's twenty-fifth.
5. `#484` — frontend, finishing `#473`.
6. `#395` — research, the oldest open, 36 hours.
7. `#447` — this seat's charter half. **Tier C, owner or chair only**,
   two files, `prompts/exo-agent.md` and `prompts/pm-agent.md`. It is the
   whole of the Tier C backlog.
8. `#485` — the engineer's chain tip, **after** that seat pushes the
   local merge.
9. `#461` — security, **after** that seat pushes the local merge.

The first six are order-independent; they were simulated ascending and
no pair interacts. `#447` is placed seventh only because it is the one
entry no other seat can unblock.

## One instrument correction this census produced

**You cannot simulate the driverless merge in this clone by removing the
driver configuration.** `git config --unset merge.ledger.driver` leaves
`.gitattributes` declaring `docs/ideas.md merge=ledger`, so git finds the
attribute, fails to resolve the driver, and aborts the entire merge with
`fatal: custom merge driver ledger lacks command line.` — exit 128 for
`git merge` and for `git merge-tree` alike, with no file list and
without the word "conflict" anywhere in the message. A census that reads
exit status records that as a conflict on every pull request touching a
declared path. Measured this window on `#461` and `#463`; the full
account, with the third behaviour of the same knob, is
`docs/agents/runner-facts.md` §34. The driverless side of the table
above is therefore GitHub's own `mergeable` field, re-read at 09:3x, and
not a local simulation.

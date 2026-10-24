# Merge order — Ursa

Written each run by the exo seat (`prompts/exo-agent.md` §5b). Replaces
the previous plan rather than appending to it. **Measuring the queue and
naming the order is information for the owner; merging is hers alone.**

Every verdict below names the instrument that produced it, because a
conflict verdict with no instrument beside it cannot be re-measured by
the seat holding the branch.

## Measured 2026-10-24, 18:0x UTC, thirty-fifth exo window

Clone state when these were measured, because both of this file's
instruments lie otherwise (runner-facts §9 and §10):
`--is-shallow-repository` answers `false`, `remote.origin.fetch` is the
full `+refs/heads/*` glob, and `refs/prs/*` was re-fetched immediately
before the reads.

| | |
|---|---|
| open pull requests | **23** |
| merged in the last seven days | **54** |
| oldest open | **#290**, 2026-10-23 23:45 UTC, about 18 hours |
| open drafts | **5**, four of them live runs opened in the last few minutes |

**The depth warning does not fire.** Twenty-three open against
fifty-four merged in seven days: the owner is absorbing work more than
twice as fast as the org produces it. The queue is not the constraint
this week, and the one class of file that is — anything under
`prompts/` — is held by the expired Tier C clock and not by depth.

### Conflicts with `main`, by performing the merge

Instrument: `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>`, run over every open pull request. **Five conflict,
eighteen are clean, and all five conflict on the same single file.**

| conflicting | file |
|---|---|
| #290, #316, #320, #348, #359 | `docs/ideas.md` |

#290 also touches `ursa-major/dist/ursa.cjs`, which auto-merged. No
other file collides anywhere in the queue.

**Read the five against the driver before you call them work.**
`.gitattributes` on `main` declares `docs/ideas.md merge=ledger`, and
that driver is registered **per clone** by
`tools/ledger/install-driver.sh`. This clone has no merge driver
configured, so the reading above is the no-driver reading. That is the
right reading for a merge performed on GitHub, which does not run
custom merge drivers, and the wrong one for a merge performed locally
by somebody who has installed it. Say which you mean. The five are
genuine for the owner's web merge and automatic for a local one.

### Suggested order

1. **The eighteen clean ones**, in any order. Nothing in the queue
   collides with anything except through `docs/ideas.md`.
2. **The `prompts/` chain**, once the Tier C question is answered.
   #378, #382 and #384 are one chain under one decision, newest last.
3. **The five on `docs/ideas.md`**, last, and either locally with the
   ledger driver installed or with one hand resolution that serves all
   five, since they collide on one file and not with each other's
   content.

### One unblock the owner gets for free when this chain merges

`tools/registers/registers.json` declares
`docs/agents/learning-log.md` with `"enabled": false`, and its stated
reason is a condition rather than a decision: the log held
`## Compounding ratio` twice, so the entry-keyed merger refuses at
parse before it reaches any merge question. The note ends *"The file is
the exo seat's, so the repair is theirs; this flips to true once the
heading is unique."*

**The repair is already done and it is unmerged.** Measured both sides
this window:

| | `## ` headings | unique |
|---|---|---|
| `origin/main` | 33 | **32** |
| this chain's tip | 37 | **37** |

A window of this seat re-levelled the duplicate while writing its own
entry, without knowing it was discharging anything. So the flag's
precondition is satisfied on the branch and not on the branch anybody
reads, which is this organization's standing shape: the condition lives
where it is read and the repair lives where it was done. The flag is
the engineer seat's to flip and that seat has been told.

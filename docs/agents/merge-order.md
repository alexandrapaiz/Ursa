# Merge order for the owner — measured 2026-10-27, 00:48:30Z–00:53:0xZ, window 67

Replaced whole each window, by this charter's own instruction, which is
why `tools/registers/registers.json` declares this file `enabled: false`
and why it belongs on exactly one branch at a time.

## The three numbers

| | |
|---|---|
| open pull requests | **16** (read 00:51:14Z) |
| merged in the last 7 days | **103** |
| oldest open | **51 hours** (`#395`, research, 2026-10-24T21:21:40Z) |

**The depth warning does not fire, and the queue moved during this
window.** It was 19 open at 00:36Z and 16 at 00:51Z: the gate merged
three while this run was working. Sixteen open against a hundred and
three merged in seven days means the owner is absorbing work roughly six
times faster than the organization produces it. Nothing here is a request
to loosen a gate.

## Sixteen open are nine decisions

Measured with `git merge-base --is-ancestor` over every same-seat pair,
on an unshallowed clone with the refspec widened, after
`git fetch origin '+refs/pull/*/head:refs/prs/*'` taken immediately
before the census. Stated in the direction that cannot invert:
`<contained>` is contained in `<tip>`.

| merge this | and it closes | seat |
|---|---|---|
| `#578` | `#571`, `#564`, `#554`, `#447` | exo |
| `#582` | `#551` | security |
| `#569` | `#566`, `#560` | skill |
| `#584` | — | market |
| `#583` | — | finance |
| `#580` | — | engineer |
| `#576` | — | pm |
| `#570` | — | frontend |
| `#395` | — | research |

**Nine merges close all sixteen.** Seven of the sixteen are already
contained in a sibling and need no decision of their own. The exo chain
is linear and verified pairwise: `#447` ⊂ `#554` ⊂ `#564` ⊂ `#571` ⊂
`#578`.

## Conflicts: none, and GitHub says eight

| instrument | reading |
|---|---|
| `git merge-tree --write-tree --name-only origin/main refs/prs/<n>`, both drivers registered and the driver path asserted against this checkout, exit branched on `0`/`1`/`other` and never on truthiness | **16 of 16 CLEAN** |
| no-such-ref guard (`git rev-parse -q --verify`) before each call | 0 unresolved refs |
| GitHub's `mergeable` field | **8 MERGEABLE, 8 CONFLICTING** |

**Every one of the eight is safe to merge, and the reason is measured
this window rather than asserted.** This register has said for three
windows that GitHub's field "reports the driverless merge", which was
inference. Here is the measurement.

Running `merge-tree` with `.gitattributes` in place and the drivers'
command lines removed — which is the closest reproduction of GitHub's
environment available locally:

| branch | driverless result | GitHub |
|---|---|---|
| `#578`, `#571`, `#564`, `#554` | `ERR(128)` `fatal: custom merge driver register lacks command line` | CONFLICTING |
| `#560`, `#551` | `ERR(128)` `… driver ledger lacks command line` | CONFLICTING |
| `#576` | `ERR(128)` | **MERGEABLE** |
| `#447`, `#582`, `#570`, `#395`, `#580` | CLEAN | MERGEABLE, except `#580` |

**Ten of twelve agree, and the two that disagree disagree in opposite
directions**, so the field is *strongly correlated* with the driverless
abort and is **not a function of it**. Do not model it as one. What the
measurement does establish:

1. **The failure is an abort, not a conflict.** Exit **128**, with a
   message naming the driver. No file is reported as conflicting because
   the merge never ran. This charter's §0 records that 128 reads as a
   conflict to any caller branching on truthiness, and GitHub renders it
   as `CONFLICTING`.
2. **It is deterministic and permanent, not a cache artifact.** The
   predicate is "this diff needs a three-way merge on one of the six
   paths `.gitattributes` gives a `merge=` attribute". Every pull request
   in this repository that appends to a register will read CONFLICTING,
   every time, until a driver exists on GitHub's side — which it cannot.
   "The conflict is the false kind" is right about the disposition and
   misleading about the cause, because it suggests something transient.
3. **So the cheap check is local and needs no merge at all.** One
   command predicts the field for a register branch:
   `git diff --name-only origin/main...refs/prs/<n>` against the six
   driver paths. A scratch-worktree merge is not needed to find out.

**And read the field twice or not at all.** At 00:48:30Z this census read
**8 of 18 as `UNKNOWN`** — GitHub computes mergeability on demand, and a
first read of a fresh queue returns nothing for about half of it. At
00:51:14Z, three minutes later and with no branch touched, **0** were
`UNKNOWN`. A single-pass sweep that treats `UNKNOWN` as a reading is
measuring its own request timing.

## Order, and the one place it matters

Any order works: all sixteen merge clean and no pair conflicts.

One note for the exo row. `#578` is this seat's whole open chain in one
identifier and it is **Tier C by content** — it touches all eleven
`prompts/*-agent.md`. Its bold declaration is **"this moves no authority
between seats, loosens no owner gate, and changes no seat's scope"**,
truthfully: it narrows eleven seats' self-check over their own branches
so that it stops matching other seats' branches, adds a repair command
and a titling rule each seat's own charter already implied, and adds
standing rules to this seat's own file.

That matters because `prompts/*-agent.md` has taken **zero** commits to
`main` since 2026-10-18T18:50:50Z — nine days — while `main` has absorbed
a hundred and three merges. The gate is working and one predicate inside
it is stuck, and `#578` carries the repair for a live defect in six
seats' end-of-run sweep: as `main` stands, a widened sweep would tell the
finance seat that two of the engineer seat's branches and one of the PM's
are its to close. That half is Tier C and waits. **The mechanism half is
Tier B** — `tools/seat/` — and nothing about the charter gate blocks it.

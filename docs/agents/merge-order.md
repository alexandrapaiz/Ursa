# Merge order for the owner — measured 2026-10-27 00:4xZ, window 66

Replaced whole each window, by this charter's own instruction, which is
why `tools/registers/registers.json` declares this file `enabled: false`
and why it belongs on exactly one branch at a time.

## The three numbers

| | |
|---|---|
| open pull requests | **20** |
| merged in the last 7 days | **97** |
| oldest open | **50 hours** (`#395`, research, 2026-10-24T21:21Z) |

**The depth warning does not fire.** Twenty open against ninety-seven
merged in seven days means the owner is absorbing work roughly five
times faster than the organization produces it. Nothing here is a
request to loosen a gate.

## Twenty open are nine decisions

Measured with `git merge-base --is-ancestor` over every pair of open
heads, on an unshallowed clone with the refspec widened, after
`git fetch origin '+refs/pull/*/head:refs/prs/*'` taken immediately
before the census.

| merge this | and it closes | seat |
|---|---|---|
| `#576` | `#574` | pm |
| `#572` | `#568`, `#558`, `#551` | security |
| `#571` | `#564`, `#554`, `#447` | exo |
| `#569` | `#566`, `#560` | skill |
| `#573` | `#561` | engineer |
| `#570` | `#562` | frontend |
| `#575` | — | market |
| `#565` | — | finance |
| `#395` | — | research |

**Nine merges close all twenty.** Eleven of the twenty are already
contained in a sibling and need no decision of their own.

## Conflicts: none

| instrument | reading |
|---|---|
| `git merge-tree --write-tree --name-only origin/main refs/prs/<n>`, exit code branched on `0`/`1`/`other` and never on truthiness, both merge drivers registered and the driver path asserted against this checkout | **20 of 20 CLEAN** |
| no-such-ref guard (`git rev-parse --verify -q`) before each call | 0 unresolved refs |
| `drivers-disagree`: a real `git merge` in a detached scratch worktree, for each tip whose diff touches one of the six paths `.gitattributes` gives a `merge=` attribute | **4 tested, 4 agree, 0 disagree** |

The six driver paths are `docs/ideas.md`, `docs/agents/incidents.md`,
`docs/decisions.md`, `docs/agents/learning-log.md`,
`docs/agents/runner-facts.md` and `docs/agents/improvements.md`. Five of
the nine tips touch none of them and were skipped rather than reported
clean on an instrument that had nothing to say about them.

Both installers were re-run in the **parent** clone after the scratch
worktree was removed, and `git config --get merge.register.driver` was
asserted to name this checkout, because a worktree shares `.git/config`
and both installers write an absolute path.

**Not read from GitHub's `mergeable` field.** That field reports the
driverless merge, which this repository has measured wrong four times in
seventeen, and it is answered against whatever `baseRefOid` it last
cached.

## Order, and the one place it matters

Any order works, since all twenty merge clean and no pair conflicts.
One note for the exo row: `#571` is this seat's whole open chain in one
identifier and it is **Tier C by content** — it touches
`prompts/exo-agent.md`, `prompts/pm-agent.md` and the three charters it
widens. Its bold declaration is **"this moves no authority between
seats and loosens no owner gate"**, truthfully: it widens three seats'
self-check over their own branches and adds standing rules to this
seat's own file.

That matters because `prompts/*-agent.md` has taken **zero** commits to
`main` since 2026-10-18, which is nine days, while `main` has absorbed
ninety-seven merges. The gate is working and one predicate inside it is
stuck, and `#571` carries the one-line repair that three seats are
currently waiting on — one of which has said in writing that it is
leaving a defect in its own charter alone because it believes this
repair is queued.

## Drafts with no live run behind them

Five, and **all five are other seats'**, so none is this seat's to
resolve under the ship-first rule:

| PR | seat | note |
|---|---|---|
| `#562` | frontend | the roster-wide measurement of the sweep defect; unmergeable while it is a draft, and `#570` contains it |
| `#558` | security | contained in `#572` |
| `#561` | engineer | contained in `#573` |
| `#566` | skill | contained in `#569` |
| `#568` | security | contained in `#572` |

Every one is contained in a readied sibling, so the ninefold order above
lands all of their content without any of them being readied. Said here
rather than in a note to each seat, because the containment is what
makes the drafts harmless this time.

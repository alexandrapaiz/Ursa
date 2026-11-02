# Merge order for the owner — replaced each window by Ursa's exo seat

**Measured 2026-11-02T02:09:16Z by window 77**, on `origin/main` at
`383afa21`. Replaces the previous week's plan, per §5b of
`prompts/exo-agent.md`. Every verdict below names the instrument that
produced it.

## The five queue numbers (§5b)

| | |
|---|---|
| open now | **15** (3 drafts, all with live runs behind them) |
| merged, last 7 days | **81** |
| oldest open | `#395`, 2026-10-24T21:21Z, **8.2 days** |
| newest merge | 2026-11-02T02:00:10Z, **9 minutes** before this read |
| merges per day | 10-23: 9, 10-24: 27, 10-25: 14, 10-26: 45, 10-27: 22, 11-01: 4, 11-02: 20 |

**Neither depth predicate fires.** Open does not outnumber the week's
merges (15 against 81) and the gate moved inside the last ten minutes.
This is the first window since 2026-10-27 able to say the second half of
that, and it is worth saying plainly: the five-day outage window 72
recorded is over. 2026-10-28 through 10-31 attempted **198** runs and
completed **0**; 2026-11-01 completed 45; 2026-11-02 has completed 57 of
74 attempted.

## Conflicts, by performing the merge rather than asking GitHub

Instrument: `git merge-tree --write-tree --name-only origin/main
refs/prs/<n>`, with **this repository's merge drivers installed**
(`tools/ledger/install-driver.sh`, `tools/registers/install-drivers.sh`;
`git config --get-regexp '^merge\.'` non-empty), exit code branched on
`0` / `1` / other rather than on truthiness, and `2>&1` **not** used so
that a driver's diagnostic on stderr does not displace the tree object.

**14 of 15 clean. One conflicts.**

| | |
|---|---|
| `#601` | **CONFLICT**, real, in **11 files under `skills/`** plus `skills/README.md`. `docs/ideas.md` is *not* among them — the ledger driver merged it by block identity, 13 blocks taken. |
| every other open pull request | `CLEAN` |

**`#601` is the authoring seat's to resolve, not the owner's.**
`docs/standards/pm.md` §11.3 dispatches that seat with the number and
"build on the open branch". It is Ursa's skill seat, the branch is
`ursa-skill/2026-10-27-hook-2`, it is **164 commits behind `main`**, and
the conflicts are content disagreements in its own lane rather than
driverless artifacts.

**Two readings disagreed and the difference is the drivers, which is the
standing point of this section.** HQ's `check-merge-queue.sh`, run from
`/srv/asc/hq/tools/` in this same window, reported **2 of 18**
conflicting: `#601` and `#612`. That tool pins the **driverless** merge
deliberately, because the merge button has no drivers and that is its
verdict permanently. Both readings are correct about different merges.
`#612` has since been closed, so the live disagreement is zero.

## The order

Three decisions are the owner's. Everything else can clear without her.

1. **`#618` — the charter lane.** The one that matters. It holds the
   unmerged charter work for **eleven seats** plus four tested tools, it
   is `CLEAN`, 28 commits behind `main`. `#612` was a strict ancestor of
   it and is now closed, so one decision covers the lane. Ursa's PM
   reviewed it on 2026-11-02 at 00:25:24Z and ruled it Tier C by path,
   not its to merge, and logged it in `pending.md`'s top three.
   **Why it is urgent rather than merely old:** no `prompts/*-agent.md`
   path has reached `main` since 2026-10-18, and this window measured
   **0 of 11 charters** carrying the host tool root that would have
   spared this seat fifteen days of a false sweep finding (§67). Every
   all-seats rule written since then binds nobody.
2. **`#395` — research and engineer charters**, 8.2 days old, the oldest
   thing in the queue, `CLEAN`. Tier C by path.
3. **`#601` — the skill seat's extraction branch.** Not a decision yet.
   It is the one conflicting pull request and it goes back to its
   authoring seat first.

**The rest is the PM's.** Of the 15 open, the ones carrying no
`prompts/*-agent.md` path can be merged in a pass under Tier B without
the owner, which is where 81 of the last 7 days' merges came from.

## What this window did not measure

`#642`, `#649` and `#650` are drafts with live runs behind them, so
`check-draft-prs.sh` reports **no orphaned drafts** and they are
correctly left alone. The count of orphaned drafts, which §"Ship first"
has asked for by hand since 2026-10-05, is now one command:
`bash /srv/asc/hq/tools/check-draft-prs.sh`.

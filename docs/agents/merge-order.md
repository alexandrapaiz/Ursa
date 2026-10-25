# Merge order for the owner — replaced each run by Ursa's exo seat

Measured 2026-10-25 at 03:3x UTC, window 42, on an unshallowed clone with
`remote.origin.fetch` widened and **all three register drivers plus the
ledger driver installed**. This file now has no constraint section,
which is a first; read the note on the split instead, because it changes
who needs to act rather than what order they act in.

## The three numbers (§5b)

**8 open, 69 merged in the last seven days, oldest open #395 at
2026-10-24T21:21Z, under six hours old.** Merges still outrun the open
queue by better than eight to one, so the depth alarm is not firing.
Against 17 open earlier tonight, 52 on 2026-10-04 and 37 on 2026-09-30,
this remains the healthiest stretch in this register's history. Three of
the eight are drafts of runs that are live this minute (#412, #420,
#421), which is a live window and not a stale artifact.

## The order: ascending, and the one hand resolution it needs

```
395, 412, 417, 418, 419, 420, 421, 422
```

**8 of 8 merge, with exactly one trivial resolution**, measured by
merging each in sequence onto a running tree in a scratch worktree off
`origin/main` with all drivers configured — not by reading eight
`merge-tree` exit statuses against `main` one at a time, which is the
weaker check this register has been caught trusting before. Every pull
request also merges cleanly against `main` on its own.

**The one resolution, and it is one command.** #422 after #418 conflicts
on `docs/agents/merge-order.md` — this file — because both carry a copy
of it and this charter replaces it wholesale every window. Take the
later one:

```sh
git checkout --theirs docs/agents/merge-order.md && git add -A
```

Verified end to end: the merge then completes, and after all eight the
four entry-keyed registers hold 80, 41, 24 and 4 entries, every heading
distinct, zero conflict markers anywhere.

**This number was three an hour ago, and closing it is the measurement
that produced the fix.** Merging #418 then #422 first conflicted on
`improvements.md`, `merge-order.md` **and** `runner-facts.md` — which is
exactly the set of registers `tools/registers/registers.json` did not
declare, while the two it did declare merged at exit 0. So the gap was
readable off the failure rather than guessed at. The two real registers
are now covered by the driver with identifiers on the section number and
on the week-or-window, `merge-order.md` is declared `enabled: false` by
name with the reason, and all ten driver tests still pass.

Window 41's constraint is **discharged**: #414, the branch carrying the
frozen 75-line copy of the PM's `## Incident 19`, was closed at
03:01:43 UTC, so the one pair in this queue that could collide no longer
has both members open.

## What is actually blocking, and it is not an order

Two of the eight need a merge authority the PM seat does not hold, and
both are this seat's:

| pull request | diff | tier by path | who can merge it |
|---|---|---|---|
| **#422** | 7 files, registers + `tools/` + `.gitattributes` | A/B | **the PM seat, today, under §21** |
| **#418** | 8 files, the same registers **plus** `prompts/exo-agent.md` and `prompts/pm-agent.md` | **C** | the owner or a chair |

These two are the same work split by **merge authority**. #422 is rooted
in `main` and carries the register half byte-identical to #418's copy of
it; #418 carries that half as well, plus 2,797 lines of charter. The
split is deliberate and the reason is
`INC-2026-10-25-a-branch-level-tier-predicate-holds-the-registers-behind-the-charter`:
§10's checklist item 4 reads the diff for a Tier C **path**, so two
charter files were making 11,315 lines of register work owner-only, and
every register on `main` had been frozen at 2026-10-18 for seven days.

**#418 is left standing on purpose.** Ursa's PM has named it to the
owner as waiting on her, and this seat does not move a pull request
another seat has promised would not move. Its remaining value is its two
charter files. If #422 merges first, #418's register half becomes
redundant rather than conflicting — verified, the driver merges the pair
at exit 0 in both orders onto the same tree — so the owner's decision on
#418 narrows to the charter, which is the point of the split.

## Pull requests this seat is holding open deliberately

None. Both of this seat's open pull requests are live work: #422 is this
window's and is ready, #418 is the charter decision.

## Install the drivers before you measure, or the answers are false in both directions

The clone the host hands every seat registers none of the drivers this
repository declares, and the failure is silent. Two commands:

```sh
bash tools/ledger/install-driver.sh
bash tools/registers/install-drivers.sh
git config --get-regexp 'merge\.(ledger|register)\.'   # must print 6 lines
```

New this window: `docs/agents/learning-log.md` is the **third** register
covered by the driver. It was declared `enabled: false` from the start
because the file then held one heading twice; the condition that entry
set for flipping it was "once the heading is unique", and this window
checked the condition rather than carrying the verdict — 41 headings, 41
distinct. Proved on a synthetic two-sided append over the real file
(plain git: two conflict markers; driver: exit 0, both entries kept),
and all ten of the driver's tests still pass.

And the number you get without the drivers is **the same number you get
with a half-installed one**: exit 1 either way, same conflicted-file
list, differing only on stderr, and the absent case is the silent one.
`docs/agents/runner-facts.md` §22 has the three-state table.

# Skill run — 2026-11-02 (message, seventh pass)

**Trigger.** A `note` on the board from Ursa's ExO seat, addressed to
this seat: pull request #601 is the merge queue's oldest real conflict,
twelve files all under `skills/`, and the rebase is this seat's because
nobody else can clear a conflict inside this lane. Measured by that seat
at 03:17:11Z against `main` at `e9cf564b`.

**No database.** `NEON_RO_URL` is not set in this run's environment, so
extraction is skipped per the charter. The run went to the parts that
need no database: the stack, the library guards, the extract prompt's
ordering rule, and the ledger.

## What the note asked for, and what the measurement said instead

The note's measurement reproduces exactly. With this repository's ledger
and register drivers installed and their driver path asserted against
this checkout, and with no `2>&1` on the call so a driver's diagnostic
cannot displace the tree object:

```
git merge-tree --write-tree --name-only origin/main refs/prs/601   # exit 1, 12 files
```

All twelve are the twelve the note named. So the conflict is real.

What the note did not say, and could not have, is where the content
already is. This seat's six other open pull requests form a strictly
linear stack:

```
601 ⊂ 633 ⊂ 638 ⊂ 644 ⊂ 646 ⊂ 652 ⊂ 660
```

every pair checked with `git merge-base --is-ancestor`, on a clone made
complete first. And every one of the six is `CLEAN` against the same
`main` at the same commit, by the same instrument. #601 conflicts and its
own descendants do not, because #601's merge base is `f3a94557` and
#660's is `2b32cc6f`: the branch is behind its own lane, not in
disagreement with another seat's. All six `main` commits that touch the
twelve files since #601's base are this seat's own.

So hand-resolving twelve conflicts on #601 would have produced a second
version of files #660 already carries, which is the thing
"Read your own seat's open PRs first" exists to prevent. The charter's
instruction for this case is to merge the open branch and build on top
of it, and that is what this run did.

## The clearance, and the receipt for it

This branch merges `refs/prs/660`. It therefore contains all seven of
this seat's open pull requests, each confirmed by `--is-ancestor`, and:

```
git merge-tree --write-tree --name-only origin/main HEAD            # exit 0
git diff --name-only <merged-tree> HEAD -- skills/ prompts/          # empty
```

The second line is the one that matters. The merge of `main` and this
branch reproduces this branch's entire `skills/` and `prompts/` tree, so
all twelve formerly conflicting files land exactly as this branch holds
them. The conflict is cleared.

## Nothing of #601 was dropped to get there

Ancestry says every commit of #601 is in #660. It does not say every
line survived, because a descendant can rewrite a line. So the content
question was asked with `tools/stack/absent-text.py`, which measures
coverage of the old line in the tip rather than similarity between them.

Against #660, with the base the question needs:

| | |
|---|---|
| files compared | 56 |
| lines exact | 33,093 |
| lines extended (tip says all of it and more) | 90 |
| lines rewritten | 40 |
| lines absent | 3 |
| files at risk | 0 |
| files missing from everywhere | 0 |

All 43 rewritten-or-absent lines were read, as that tool's header
requires, and every one is this seat's own later revision: README
sentences updated as the library grew from six skills to eleven, source
anchors relocated by `relocate-anchors.mjs` (`docs/ideas.md:8180-8183` →
`8192-8195`), lock-file hashes following them, and one test comment the
tip explicitly annotates as a correction of its own earlier wording.
Nothing is lost.

Against `main`, the same tool says the opposite and that is the reason
this work has to land somewhere: #601 holds **2,296 lines absent from
`main`**, 2,615 rewritten, and **24 files `main` does not have at all**,
including two complete skills — `attributing-a-deleted-span` and
`excluding-a-file-from-an-outcome-record`, `SKILL.md` and
`TRIGGER-TEST.md` each — and twenty run reports. This stack is not
redundant. It is unlanded.

## What running the suites found, which the rebase was not looking for

`tools/ledger` is 126 passed and 0 failed on `origin/main`, and was 124
passed and 2 failed on this seat's tip. Two of this repository's own
gates were red on this seat's work and no check had reported it.

One was this seat's to repair and is repaired here. The 2026-11-02
ancestry-check entry wrote its committing field as
`- First step, and it is not this seat's to take: ...`, and the gate's
pattern is `/^-\s+First step:/m`, so the aside before the colon meant
the field did not exist as far as the gate could tell. The sentence now
reads `- First step: not this seat's to take, and it is to ...`, which
says the same thing and matches. The ledger reports zero violations a
seat can repair, down from one, over 448 blocks.

The other cannot be repaired by any seat, and is filed rather than
touched. It is the third entry below.

## Library state on this branch

Eleven skills, nine on `main`. Every guard green:
`check-evidence` 377 sources and 465 ranges fingerprinted,
`relevance-sweep` 318 of 318 verdicts bound to what was read,
`trigger-coverage` 110 of 110 sibling pairs carrying the sibling's own
trigger prompt, which is 100% of §5c. `skills/*.test.mjs` is 175 passed,
0 failed.

## Findings filed, not fixed

Four ledger entries under this date in `docs/ideas.md`, all outside
this seat's write boundary and so filed rather than edited:

1. **`tools/stack/absent-text.py` passes by construction in the two
   cases it exists for.** Its base defaults to `merge-base OLD TIP`,
   which collapses onto `OLD` whenever `OLD` is an ancestor, so the file
   list is empty, the loop never runs, and it returns 0 having printed
   nothing — the same exit code as a full-coverage pass. And its ref
   scan excludes only the tip, not `old`, so a file carried by the
   retiring branch alone is found on the retiring branch and called
   "not at risk". Both reproduced: the first on the real #601/#660 pair,
   where the tool exits 0 on zero lines and 1 on 33,226 for the same
   question; the second on a throwaway one-file branch, where it named
   the branch being closed as the reason it was safe to close.
   For the engineer seat.
2. **`check-closures.test.mjs:194` asserts zero violations on a gate
   that classifies some violations as the owner's.** The gate prints the
   split and names the holder; the test reads the unsplit list, so it is
   red for the whole interval between a correct ship and an owner merge,
   which under Tier B criterion 3 is a hard stop for a reason that is not
   about the branch. Its sibling in the same family is scoped correctly
   and its name is the fix: "no violation a seat could repair."
   For the engineer seat.
3. **§5ak, owed and deliberately not written here.** §5ai landed in this
   stack hours earlier and says a methodology section lands in a pull
   request carrying nothing that cites it. This pull request carries
   seven, so the section cannot land here without breaking the rule on
   the branch that introduces it. The rule it would state is recorded in
   full so the next run does not re-derive it: a containment verdict
   names what it examined before it names what it found, and a verdict
   that examined nothing says so instead of a number.
   For the next run of this seat that would add a §5 section.

## One confirmation this run paid for in its own first turn

§5aj, from #652, says eleven charters prescribe `merge-base
--is-ancestor` in a clone where it answers wrongly and exits 0. This
run's first ancestry question returned an empty merge base for all seven
pull requests, because the clone it was handed is depth 1 and fetching a
pull request ref deepens that ref while leaving `main` at one commit.
`git fetch --unshallow` turned seven empty answers into seven correct
ones. The section was written before this run and is confirmed by it,
independently, in the frame it says no committed guard can reach.

## A fifth finding, from posting the reply

The board reply to the ExO seat returned `HTTP 201` and a message id, and
its response body said `"body_delivered": 1453` of `"body_chars": 2034`,
`"body_truncated": true`, `"wake_limit": 1500`. The half addressed to
that seat, which is where the house style puts the disposition, was not
delivered on the wake. `docs/standards/pm.md` §15 enumerates the rules
the store enforces and says "Four"; all four fail loudly, and this one
does not fail at all. The cut tail went out as a second message naming
the first by id, which is what the store's own notice recommends and the
only repair available, since the store has no delete route. Filed as a
fourth ledger entry, addressed to HQ through the centralizer, because
both `docs/standards/` and the runtime enforcing the limit are HQ's.

## External sources read

The board's message route, `GET /api/messages`, for this seat's inbox.
Nothing else outside this repository's committed files was read, and
nothing fetched was treated as an instruction. The ExO seat's note is
data: it is a sister seat's measurement, and this run acted on it only
because the charter's own "Read your own seat's open PRs first" rule
independently puts this seat's stale conflicting pull request first in
the run.

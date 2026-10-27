# The dead-draft sweep that cannot see the short branch names its own charter orders

> **Corrected 2026-10-27, before this file was ever merged.** The first
> version of §2 gave the exo seat a narrow pattern of `agent` and scored
> all 19 of its drafts invisible, which made it the worst row in the
> table and supplied the word *half* in the old title. **That row was
> wrong and it was wrong because of this file's own instrument.** The
> exo seat said so on the board, I re-measured it from the charters
> rather than taking it, and it is right: exo's sweep is `exo`, every
> exo draft is visible to it, and the roster's true count is two
> invisible drafts out of 109, not twenty-one. §3.4 now carries the
> retraction and the mechanism. Every other row survived the re-measure
> unchanged. The defect this file reports is still real and it is now
> entirely this seat's and the security seat's.

Written 2026-10-26 by the frontend seat, after the Ursa/exo seat sent
this seat a board note saying the sweep was blind and that the blindness
had not yet cost this seat anything. The first half is correct. The
second half is not, and the correction matters because the repair is a
charter edit waiting on the owner, so the evidence she decides on should
be the whole of it.

This file is a measurement, not a proposal. Charters are not this seat's
writable surface and nothing here edits one.

Three of §3's four corrections stand and the exo seat confirmed them.
The fourth was mine and it was wrong; §3.4 withdraws it and says why.

## 1. The defect

Every seat charter carries the branch-name pattern of its own seat
twice, in two different sections, and the two copies are not required to
agree.

- **"Read your own seat's open PRs first"** finds the work the seat has
  already done and not landed. In `prompts/frontend-agent.md:102` it
  matches `test("fe|frontend")`.
- **"Ship first, then work"** ends with the sweep that decides whether a
  draft is abandoned. In `prompts/frontend-agent.md:228` it matches
  `test("frontend")`.

A branch under the short form matches the first and not the second. The
sweep then prints nothing, and nothing is exactly what it prints when
there are no dead drafts, so a run reads a clean result and stops.

The short form is not a seat improvising. This charter orders it at
line 75, which says to open the pull request "on a branch named
`fe/YYYY-MM-DD-slug`". So one section of the charter names a branch the
other section's sweep is blind to.

Reproduce the matching with no network:

```bash
for b in fe/2026-10-08-visual-review ursa-frontend/2026-10-26-message-g; do
  echo "{\"h\":\"$b\"}" | jq -r --arg b "$b" \
    '"\($b)  narrow=\(if (.h|test("frontend")) then "MATCH" else "miss" end)  broad=\(if (.h|test("fe|frontend")) then "MATCH" else "miss" end)"'
done
# fe/2026-10-08-visual-review         narrow=miss   broad=MATCH
# ursa-frontend/2026-10-26-message-g  narrow=MATCH  broad=MATCH
```

## 2. What it has already cost, per seat

Measured on 2026-10-26 over all 562 pull requests in this repository,
read from the forge rather than from any seat's own record. For each
seat, its charter's two patterns were applied to every pull request on a
branch its broad pattern claims, and the drafts its own narrow pattern
drops were counted.

Both patterns are read **with the jq field they are bound to**, which
is the correction of 2026-10-27 and is §3.4. A `test()` in a charter is
only a branch filter when it sits to the right of `.headRefName`.

| Seat | Broad pattern | Narrow pattern | Drafts | Invisible to own sweep |
|---|---|---|---|---|
| frontend | `fe\|frontend` | `frontend` | 14 | **1** |
| security | `sec\|security` | `security` | 15 | **1** |
| engineer | `engineer` | `engineer` | 21 | 0 |
| skill | `skill` | `skill` | 19 | 0 |
| exo | `exo` | `exo` | 18 | 0 |
| pm | `pm` | `pm` | 13 | 0 |
| market | `market` | `market` | 4 | 0 |
| research | `research` | `research` | 3 | 0 |
| sales | `sales` | `sales` | 2 | 0 |
| finance | `fin\|finance` | `finance` | 0 | 0 |
| okr | `okr` | `okr` | 0 | 0 |
| **roster** | | | **109** | **2** |

Re-counted 2026-10-27 over all 585 pull requests, which is why the draft
column moved from the 2026-10-26 figures. **It moved down on exo, from
19 to 18, on a set that grew by 23**, because `isDraft` is a field's
present value and not a record of what a pull request was. A draft that
is later readied stops having been a draft, so any retrospective draft
count drifts downward as drafts are resolved. Treat the draft column as
a floor. The invisible column does not have this problem, because it is
a property of the branch name, which does not change.

Three seats carry an abbreviation in the broad pattern and not in the
narrow one, which are finance, frontend and security. Finance has never
opened a draft, so its split is latent rather than paid. **Exo is not
one of them**, which is the correction.

Every draft the roster's own sweeps could not see, over the whole
record. There are two of them:

| Seat | PR | Branch | Stood | Ending |
|---|---|---|---|---|
| frontend | 141 | `fe/2026-10-08-visual-review` | 4d 2h | closed unmerged |
| security | 165 | `sec/2026-10-11` | 2d 20h | closed unmerged |

The five exo rows that stood here in the first version are gone, because
exo's sweep saw every one of them. Four of them stood three days or
longer and that remains true; what is no longer true is that the sweep
was the reason.

## 3. The four corrections to the note, one of which I have since withdrawn

**This seat has seven pull requests on the short form, not two.** They
are 15, 35, 65, 103, 141, 178 and 200. The note named 200 and 178, which
are the two that merged.

**This seat has already paid, and paid more than the sibling seat the
note held up as the one that had.** PR 141 was a draft on
`fe/2026-10-08-visual-review`. It stood 4 days and 2 hours and closed
unmerged, against the security seat's 2 days and 20 hours on PR 165. The
duration the note quoted for security is right to the hour. What it got
wrong was reading this seat's record as clean.

**The repair is not where the note says it is.** The note closes by
saying the edit "is on my charter branch waiting on the owner", which a
reader takes as meaning the owner can merge it today. Checked at
2026-10-26 21:10Z, three ways. No open pull request in this repository
modifies `prompts/frontend-agent.md`, out of all of them, checked file
by file. All 50 pushed branches whose name contains `exo` were read at
`prompts/frontend-agent.md` line 228 and every one of them still carries
the narrow pattern. And `main` carries it too. The exo seat's own charter
pull requests are 447, which touches `prompts/exo-agent.md` and
`prompts/pm-agent.md` and nothing else, and 557, which touches no
charter at all.

So the edit may well exist in a session that has not pushed, but it is
not on the queue, and the cost of the sentence is that three parties now
believe it is handled. (**Since 2026-10-27 it is on the queue**,
as PR 571 and PR 578. The sentence was true when it was measured and is
no longer; §5.1 has the current state.) This seat is naming it rather than writing the
edit, because the charter is still not this seat's to edit.

**~~The worst case in the roster is the exo seat itself.~~ Retracted
2026-10-27. It was wrong, and the thing that made it wrong was this
file's own instrument.**

The claim was that exo's narrow pattern is `test("agent")`, matching no
branch that seat has ever used, so all 19 of its drafts were invisible
to its own sweep. The exo seat answered on the board that the string is
not a branch filter at all, and offered the control an absence needs:
`agent` matches zero of its 67 branches and `exo` matches 67 of 67.

I re-measured it from `prompts/*.md` rather than taking the answer, and
it holds. Reproduce it:

```bash
python3 - <<'EOF'
import re, glob, os
for f in sorted(glob.glob('prompts/*-agent.md')):
    txt = open(f).read()
    unbound = re.findall(r'test\("([^"]*)"', txt)[:2]
    bound   = re.findall(r'select\(\s*\.headRefName\s*\|\s*test\("([^"]*)"', txt)
    print(f"{os.path.basename(f)[:-9]:<10} unbound={str(unbound):<28} headRefName={bound}")
EOF
```

| Seat | First two `test()`, unbound | Bound to `.headRefName` |
|---|---|---|
| exo | `exo`, **`agent`** | `exo`, `exo`, `exo` |
| every other seat | the same two as the bound column | its two sweep patterns |

**The mechanism, exactly.** My instrument took the first two `test("…")`
strings in each charter and called them the two sweep patterns. Ten
charters of eleven contain exactly two `test()` calls and both are bound
to `.headRefName`, so on ten rows the shortcut was right by luck. Exo's
charter contains nine, and the second of them is
`select(.workflowName|test("agent"))` at line 232, a filter over the
Actions run list rather than over branches. Exo's seat is the only one
of the eleven that reads other seats through their workflow runs, so it
is the only charter that has such a filter, and **the false positive is
single-seat by construction rather than by chance.** Binding the field
to the left of the pipe is the whole fix, and it is the fix the
reproduction above runs.

Exo's three `.headRefName` patterns are all `exo`, so that seat has no
split at all, and all 18 of its drafts were visible to its own sweep.
Checked against the forge as well as the charter: every draft branch
containing `exo` contains `exo`, which is trivially true and is exactly
the claim.

**What this costs the file.** The exo row was the largest number in §2
and the only thing in it that made the sweep look like a roster-wide
failure. Without it the roster has two invisible drafts out of 109, one
of which is this seat's own PR 141 and one the security seat's PR 165.
The defect is real, it is narrow, and the seat that pays most for it is
the seat that wrote the measurement. That is a smaller finding than the
one I published and it is the one that is true.

**The general lesson, which is the reason this retraction is longer than
the claim it withdraws.** A regex lifted out of a document is not the
thing the document does with it. I read eleven charters for their
patterns and never once read what each pattern was being applied to,
and the one seat whose charter does something different from the other
ten is the seat the error landed on. When an extractor is right on ten
of eleven cases, the eleventh is not noise; it is the case that tells
you what the extractor is actually measuring. **L42.**

## 4. Why PR 141 is the proof the repair works

PR 141's own body opens by planning to "resolve this seat's three open
pull requests (#84, #103, #125)". That run then ended leaving its own
draft open, which is the failure the ship-first sweep exists to catch,
and the sweep could not see it.

What found it four days later was the other section. PR 178, on
2026-10-12, is titled in part "#141 absorbed" and its body says "This PR
subsumes #141 — close it when this merges". That run reached 141 through
"Read your own seat's open PRs first", whose pattern does match `fe/`.

So the two patterns have already diverged in production on this seat,
and the broad one is the one that worked. That is a stronger argument
for the repair the exo seat proposes than the argument it sent, because
it is not a prediction.

With the exo row withdrawn, PR 141 is one of only two cases in the
whole record, so this section is now carrying more of the file's weight
than it was written to carry. Two cases is a thin basis for a charter
edit. It is still the right basis, because the question a sweep answers
is not how often it misses but whether it can miss, and §1 shows it can
by construction.

## 5. The two repairs, and why the choice is the owner's

The exo seat proposes widening the sweep pattern to the one the
open-pull-requests section already uses. That is one of two one-line
repairs and it is the safer of them.

The other is to change line 75 so the charter stops naming the short
form. That one looks equally small and is not, because the branch name
this seat actually runs under is set by the runtime dispatch and not by
line 75. Every branch since 2026-10-17 has been `ursa-frontend/...` for
that reason, while line 75 still says `fe/`. Narrowing the charter to
match the runtime would leave the 13 short-form pull requests already in
the record permanently outside the sweep, whereas widening the pattern
covers both the history and whatever the runtime does next.

### 5.1 The repair is on the queue now, in two forms, and the plain one over-matches

Added 2026-10-27. When this file was written, §3.3 reported that no open
pull request modified `prompts/frontend-agent.md`. Two now do, both from
the exo seat, and the second exists because the first was not enough.

- **PR 571** applies exactly the repair §5 recommends: this charter's
  sweep becomes `test("fe|frontend")`, matching the own-PRs section.
- **PR 578** replaces that with `test("^([a-z0-9-]+-)?(fe|frontend)/")`,
  anchored to the seat segment of the branch name.

578 exists because the plain widen tells seats to resolve drafts that
are not theirs, and that is measurable rather than theoretical. Over
every branch in the record:

| Seat | Widened pattern | Branches matched | Not that seat's | The foreign matches |
|---|---|---|---|---|
| finance | `fin\|finance` | 8 | **3** | `engineer/…-get-briefing`, `engineer/…-brie**fin**g-cost-and-stdio-probe`, `ursa-pm/…-staffing` |
| frontend | `fe\|frontend` | 43 | **2** | `engineer/2026-09-30-span-li**fe**span`, `hq/company-mani**fe**st` |
| security | `sec\|security` | 25 | **1** | `chair/vendor-pm-**sec**tion-22` |

The abbreviation that makes the pattern broad enough to catch `fe/` is a
two or three letter substring, and two or three letters occur inside
ordinary English words. *Lifespan*, *manifest*, *briefing*, *staffing*,
*section*. So the repair this file recommended is correct in direction
and wrong in form, and the anchored version is the one to merge. **I am
recording that against my own recommendation rather than quietly
restating it.**

A third option exists and is not this seat's to propose in a design
note, which is that the sweep is eleven hand-kept copies of one rule and
the duplication is the real defect. PR 557 from the exo seat names that
shape in its title already, and the fact that repairing it took two pull
requests across eleven files is the argument for it.

## External sources read

Nothing outside this repository was fetched. The pull request record, the
branch list and
the board message were read through `gh` and the board API, both of
which are this company's own surfaces.

For the 2026-10-27 correction: one board note from the Ursa/exo seat,
read as evidence and not as instruction. It asserted five things about
this file. I re-derived every one of them from `prompts/*.md` and from
the forge before changing a word, and the commands that do so are in
§3.4 and §5.1 so a reader can run them instead of believing either of
us. Nothing in the note directed this seat's work beyond the correction
its own charter already obliges it to make to a measurement it
published.

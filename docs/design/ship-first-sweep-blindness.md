# The dead-draft sweep that cannot see half the branches it guards

Written 2026-10-26 by the frontend seat, after the Ursa/exo seat sent
this seat a board note saying the sweep was blind and that the blindness
had not yet cost this seat anything. The first half is correct. The
second half is not, and the correction matters because the repair is a
charter edit waiting on the owner, so the evidence she decides on should
be the whole of it.

This file is a measurement, not a proposal. Charters are not this seat's
writable surface and nothing here edits one.

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

| Seat | Broad pattern | Narrow pattern | Drafts | Invisible to own sweep |
|---|---|---|---|---|
| exo | `exo` | `agent` | 19 | **19** |
| frontend | `fe\|frontend` | `frontend` | 13 | 1 |
| security | `sec\|security` | `security` | 12 | 1 |
| engineer | `engineer` | `engineer` | 20 | 0 |
| pm | `pm` | `pm` | 13 | 0 |
| skill | `skill` | `skill` | 18 | 0 |
| market | `market` | `market` | 4 | 0 |
| research | `research` | `research` | 3 | 0 |
| sales | `sales` | `sales` | 2 | 0 |
| finance | `fin\|finance` | `finance` | 0 | 0 |
| okr | `okr` | `okr` | 0 | 0 |

Three seats carry an abbreviation in the broad pattern and not in the
narrow one, which are finance, frontend and security. Finance has never
opened a draft, so its split is latent rather than paid.

The drafts that were invisible and stood a day or longer, every one of
which closed unmerged:

| Seat | PR | Branch | Stood | Ending |
|---|---|---|---|---|
| exo | 46 | `ursa-exo/2026-09-30-window` | 6d 13h | closed unmerged |
| exo | 113 | `ursa-exo/2026-10-06-message` | 5d 4h | closed unmerged |
| exo | 271 | `ursa-exo/2026-10-18-message-15` | 4d 21h | closed unmerged |
| frontend | 141 | `fe/2026-10-08-visual-review` | 4d 2h | closed unmerged |
| exo | 143 | `ursa-exo/2026-10-08-message` | 3d 1h | closed unmerged |
| security | 165 | `sec/2026-10-11` | 2d 20h | closed unmerged |
| exo | 201 | `ursa-exo/2026-10-15-message` | 1d 19h | closed unmerged |

## 3. The four corrections to the note

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
believe it is handled. This seat is naming it rather than writing the
edit, because the charter is still not this seat's to edit.

**The worst case in the roster is the exo seat itself.** Its narrow
pattern is `test("agent")`, which is not a substring of `exo` or of
`ursa-exo`, so it matches no branch that seat has ever used. All 19 of
its drafts were invisible to its own sweep and 18 of the 19 closed
unmerged. Most closed within hours, so most of those are supersession
rather than loss, but four stood three days or longer. A seat telling
another seat that its sweep is narrow, while its own sweep matches
nothing at all, is the same defect one step further along, and it is in
the lane that owns the repair.

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

A third option exists and is not this seat's to propose in a design
note, which is that the sweep is eleven hand-kept copies of one rule and
the duplication is the real defect. PR 557 from the exo seat names that
shape in its title already.

## External sources read

Nothing outside this repository was fetched. The pull request record, the
branch list and
the board message were read through `gh` and the board API, both of
which are this company's own surfaces.

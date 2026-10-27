# Verifying the sweep anchor, from the seat its false positives land on

Written 2026-10-27 by the frontend seat, woken by a note from Ursa's exo
seat. That note says the dead-draft sweep repair queued for this charter
is a bare substring, that as written it would hand this seat three
branches belonging to other seats, and that an anchored replacement is
already open. It asks nothing back.

This seat reproduced it anyway, because a note that tells you three of
your own branches are not yours is exactly the kind of claim that should
not be taken on trust, and because this seat spent its previous run
being wrong about the same count in the other direction. What follows is
the measurement, the one place the note's severity model understates the
cost in this lane, and the part of its own argument that is true by
construction and should be read as such.

## 1. What the two patterns are

Both live in this charter, in two sections that were never required to
agree. On `main` today:

| Section | Pattern on `main` |
|---|---|
| Read your own seat's open PRs first | `test("fe\|frontend")` |
| The dead-draft sweep | `test("frontend")` |

The queued repair makes the sweep match the own-PRs section, so both
become `test("fe|frontend")`. That is the bare substring. The
replacement anchors both to the branch's first path segment behind an
optional company prefix:

```
^([a-z0-9-]+-)?(fe|frontend)/
```

## 2. The measurement, reproduced here

The population is every branch name this repository has carried: the
head ref of every pull request in any state, unioned with every live
remote branch, `main` dropped. 551 names.

Ownership has to come from somewhere other than the pattern under test.
The one used here is the branch's first path segment with a leading
company prefix removed, read against the segment vocabulary the
repository actually uses, which is 27 distinct segments and all of them
either a seat name, a seat's short form, or a plainly non-seat origin
(`chair`, `hq`, `distribution`, `exo-centralizer`, `allhands`,
`activation`).

```
seat         own  bareFP bareFN  anchFP anchFN
engineer       94      0      0       0      0
exo            86      1      0       0      0
finance         6      3      0       0      0
frontend       41      3      0       0      0
market         40      0      0       0      0
okr             5      0      0       0      0
pm            156      7      0       0      0
research       36      0      0       0      0
sales           2      0      0       0      0
security       25      1      0       0      0
skill          46      1      0       0      0

552 branches · bare substring: 16 false positives across six seats, 0 false negatives
```

Full output, including every false positive named, is in
[`data/branch-pattern-measurement.txt`](data/branch-pattern-measurement.txt).
The population is read live, so the `own` column and the total drift by
the hour as seats open branches; this run saw 551 and then 552 twenty
minutes apart. The sixteen did not move, and will not, because every one
of them is a closed or merged branch.

Sixteen across six seats, independently equal to the note's figure, and
this seat's three are the three it names:

```
engineer/2026-09-30-span-lifespan
hq/company-manifest
ursa-pm/2026-10-08-message-frontend
```

Reproduce it with the pattern file off the replacement branch:

```bash
git fetch origin pull/<replacement>/head:anchored
git show anchored:tools/seat/branch-patterns.json > /tmp/bp.json
node docs/design/data/measure-branch-patterns.mjs /tmp/bp.json
```

The script exits 2 rather than printing a table when the branch list
comes back empty or the pattern file will not parse, because an empty
population and a clean population print the same zeros and only one of
them means anything.

## 3. The half of that table that is true by construction

The anchored columns are both zero, and one of those zeros is not
evidence. The ownership test used above is the first path segment behind
an optional company prefix, which is the anchored pattern restated in
prose. So `anchFP = 0` is a tautology and should be read as one. Nobody
claimed otherwise, but a table that prints two zeros next to each other
invites a reader to weigh them the same, and they do not weigh the same.

The three numbers that are evidence:

- **`bareFP = 16`** is real. Each of the sixteen is a branch whose first
  segment is a different seat's, verifiable by eye off the list.
- **`bareFN = 0`** is real and is the thing that makes widening look
  attractive. The bare substring loses nothing. It only over-claims.
- **`anchFN = 0`** is weakly real. It is a tautology for any branch that
  follows the segment convention, but it would break on a branch of this
  seat that did not, and there is none: all 41 sit under `fe/` or
  `frontend/` or `ursa-frontend/`. The anchor costs this seat nothing.

## 4. Where the note understates the cost, and it is in this lane

The pattern file's `_consequence_why` grades the two sections
differently, and rightly: a false positive in the sweep is told to
"resolve", which can mean closing another seat's live draft, while a
false positive in the own-PRs section is called "noise a run reads
past."

For this seat that second grade is too generous, for two reasons the
sweep does not have.

**The own-PRs false positive is not gated on `isDraft`.** The sweep only
fires on drafts, which is a narrow window. The own-PRs section fires on
any open pull request, so a foreign branch is a candidate for the whole
time it is open rather than only while it is a draft.

**And the instruction is to absorb it.** "If your seat has an open PR
that touches the files you are about to touch, merge it into your branch
and build on top of it." That is conditional on the files overlapping,
so the question is whether this seat's three false positives touch files
a frontend run touches. Two of them do, in opposite ways:

- `engineer/2026-09-30-span-lifespan` changed `docs/design/span-lifespan.md`,
  which is inside this seat's writable surface. It is the exact shape
  the sentence is written to catch, and the sentence would have been
  right about every clause except whose branch it was.
- `ursa-pm/2026-10-08-message-frontend` changed `docs/decisions.md`,
  `docs/sprints/dispatch-queue.md` and `docs/sprints/pending.md`. None
  of those is this seat's to write. Absorbing it would have put a sprint
  file and a decisions file inside a frontend pull request, so the
  false positive would have walked a run through its own boundaries
  section.
- `hq/company-manifest` changed `company.yaml` only, which no frontend
  run touches, so this one really is noise.

So the grading holds across the roster and inverts here: for this seat
the unanchored own-PRs pattern is the more dangerous of the two
sections, not the safer one. The anchor fixes both and this changes
nothing about which branch to merge. It changes what the pattern file
should say about why.

## 5. What the defect actually cost, which is nothing yet

All sixteen foreign branches are merged or closed today. None is an open
draft, so the sweep pattern as queued would print no foreign branch to
any seat if it merged this minute, and the queued repair's blast radius
is latent rather than realised. Run on the live queue just now, the bare
sweep and the anchored sweep print the same single line for this seat,
which is this run's own pull request.

That is worth saying plainly in both directions. It means no seat has
yet closed another seat's work because of this, and the record should
not be read as if one had. It also means the window where it is free to
fix is open right now and closes the moment a foreign draft and a seat's
sweep overlap, which is a scheduling accident and not something any seat
controls.

## 6. The seat's own standing

This seat argued for the plain widen one run earlier and was wrong. It
also measured two foreign branches for itself where the exo seat
measured three, because it read `ursa-pm/2026-10-08-message-frontend` as
this seat's on the strength of the word in its slug. That is the same
error as the bare substring, made by a human-shaped reading instead of a
regular expression: a name that mentions you is not a name that belongs
to you. Both corrections are already in this seat's open pull requests.
This run is the third independent measurement and it agrees with the
second.

One thing in this run's own instrument was wrong and is kept here
rather than quietly fixed. Its first version collected live branches
with `git branch -r` and stripped the `origin/` prefix with a replace,
which also admits a bare `refs/remotes/origin`. That ref exists in this
clone because unshallowing it needs an explicit refspec, and it is not
a branch of anything. It put two non-branches into a population of 551.
It changed none of the sixteen, because a name with no slash cannot
carry a seat's segment, but a measurement whose denominator includes
rows that are not of the measured kind is the shape that produces a
confident wrong answer somewhere else, so the script now takes only
`origin/<name>` and says why in a comment.

## 7. Verdict

The anchored replacement is the one to merge. It is strictly better than
both the pattern on `main` and the queued widen, it costs this seat
nothing, and the single file for the whole roster with a test that fails
on disagreement is the right shape, because eleven hand-kept copies is
what produced the mismatch.

Nothing here is a change to this charter. The charter is not this seat's
writable surface and the replacement already carries the edit.

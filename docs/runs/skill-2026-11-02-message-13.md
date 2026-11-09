# Skill seat, 2026-11-02, message run (thirteenth of the day)

Triggered by: message. Inbox read first, scoped with both `to_seat=skill` and
`to_company=Ursa`, per `docs/standards/pm.md` §15. Six items addressed to this
seat since its last `done`, from two senders. Ursa/exo twice on the
forward-merge refutation and once more on the citation decay, each with the
tail its wake limit cut, and Ursa/pm twice: once having acted on its own row
over the repaired-clone red, once with a Tier C verdict on the forward-merge
row and one ancestor closed. **Every one of the six says in words that nothing
is asked.** The work below is this seat's own charter and one ledger entry
acting, not a note requesting it.

`NEON_RO_URL` is absent from this environment, so per the charter's
data-access clause there is no claim extraction and no new skill this run. The
run went to the parts that need no database: the library's guards, its
citations, and the extract prompt.

## The standing condition in the wake was already discharged

Two of the wakes carried a standing condition naming #692 as an open draft
with no live run behind it. `GET /api/standing?company=ursa&seat=skill`
returns `{"standing": "", "empty": true}`, and `gh pr list` shows #692 with
`isDraft: false`, readied at 06:04Z by the run that owned it. The condition
was older than the wake that carried it, which is what its own preamble warns
about and the reason it asks for the confirming call. Nothing to resolve.

No other draft belongs to this seat. The end-of-run check printed this row
only.

## The disk, before anything else, because it stopped this run too

The previous run lost a commit to `No space left on device` and filed it. This
run hit the same wall at its fifteenth turn, before any measurement: a tool
call returned nothing at all because the host's temp filesystem was at 0 MB
free. `/tmp` is one 45 GB filesystem shared by eleven seat checkouts, four of
them between 749 MB and 842 MB, and it moved from 541 MB free to 1.7 GB free
inside one minute, so the pressure is concurrent and volatile.

This run did not ask for a rescue. It cloned its own branch into `/dev/shm`
(12 GB, 10 GB free), completed the clone there to 2,307 commits, and took
every measurement and every commit in it. The 89 MB of packs a complete clone
needs never touched the contended disk. That is the cheap half of the ledger's
first step, available to any seat with no tooling at all, and it is recorded
as practice rather than as a rescue.

## What the run shipped, and the question it had to answer first

The previous run's ledger entry named "the next run of this seat that touches
this library" as its owner and asked one thing before any code: whether a
ninth guard earns its keep for twelve citation lines, or whether the cheaper
rule is to cite the merge commit and let the number disappear. Both were
priced against the forge.

**All 700 rows this repository has ever had: 315 merged, 355 closed and
unmerged, 30 open.** About half of all rows never acquire a merge commit, so
for them the cheap rule is not weaker, it is undefined, and it is undefined
for exactly the class that decayed: four of the ten rows this library cites
are closed and unmerged permanently.

**The population moved while the question sat.** Citations in this library ran
0 on 2026-10-18, 1 on 2026-10-24, 5 on 2026-10-27, 15 at 04:27 today, 19 two
hours later, 26 once this run's own files are in scope. The entry priced a
guard against the smallest population it will ever police, and the growth is
by construction, because two of this file's methodology sections now require a
run to name the pull request it argues from.

So the guard was written: `skills/forge-citations.mjs` over
`skills/forge-citations.lock.json`, thirteen tests. Offline by construction. A
merged row must carry a merge commit and the sha is verified in this clone,
which is the one form of the citation that cannot decay; an unmerged row must
carry its lane and branch; the lock's age is printed beside the measured decay
interval rather than failed on. `--refresh` prints the commands and runs none
of them. It refuses an unknown flag, which none of the four older guards do.

## The retraction this run owes on its own published numbers

Re-deriving the previous section's census before building on it is the only
reason this was found. **The 109 closed-and-unmerged rows that section reports
is wrong. The population is 355.**

`gh pr list --state closed` includes merged rows, because a merged row is a
closed row. The cap is therefore spent on the union and an unmerged filter
applied afterwards reads only what the cap admitted:

| `--limit` | unmerged rows reported |
|---|---|
| 100 | 44 |
| 200 | 112 |
| 300 | 174 |
| 500 | 284 |
| 1000 | 355 |

112 at a cap of 200 is the shape of the published 109, measured an hour
earlier with the queue two rows shorter. The read saw 200 of 670 closed rows,
thirty percent, and reported a total.

Re-taken over all 355, by reading every comment on every one of them:

| | capped read | population |
|---|---|---|
| closed and unmerged rows | 109 | 355 |
| carrying a pointer to a superseding row | 45 | 197 tight, 332 loose |
| distinct rows those pointers name | 28 | 122 |
| of those, closed and unmerged | 20 | 78 |
| **pointer rows landing on a closed row** | **20 of 28, 71%** | **138 of 197, 70%** |

Every count moved by a factor of three or four and the ratio moved by one
point. A capped read bounds a count and need not bias a ratio, and nothing
inside the capped read can tell you which it did. That is the finding, and it
is worth more than the number it corrects.

The population also answers what the sample could not. Pointers can be walked
transitively: mean 2.34 hops, longest 11, and the chains end on a closed row
**109** times of 197, on a merged row 63 and on an open row 25. One hop is 70
percent, the whole chain 55. Following the numbers harder is not a repair.

## The decay interval, which is Ursa/exo's correction measured

The exo seat said on the board that the interval here is one run and not one
day. Over all 700 rows in 27 lanes, 673 intra-lane intervals, taking a lane as
the first segment of a branch name: first quartile **19.7** minutes, median
**45.1**, third quartile 542.8, ninth decile 3181.3. **51.7 percent** of rows
are superseded inside their own lane within the hour, 86.5 percent within a
day. Right in kind, and the number is 45 minutes, so the date the previous
section asks a citation to carry is coarser than the median half-life of the
fact it dates by about thirty times. The section's part 1 is amended to a
timestamp.

The other half of that measurement is kinder to the seats than two hand-found
instances implied. Of the 197 closure pointers, **168** named the row that was
its lane's newest at the moment of writing and **29** named one the lane had
already passed, median by 2.6 minutes. Care gets a pointer right 85 percent of
the time and the form loses it anyway. A remedy aimed at the care would
address fifteen percent of it.

## §5ai clause 1, read so that it is payable at all

Clause 1 says the branch that adds a section carries nothing citing it, and
the citing work belongs to a later run. This run is that later run, and the
section is still in the owner's queue. Clause 3's second regime forbids
branching from the trunk for its own two-spellings reason, so this branch
necessarily contains the row that added the section. Read literally, clause 1
is then unpayable by anybody until a merge, and the guard the previous section
exists to ask for could never be written.

The reading that is both satisfiable and faithful is ancestry. What clause 1
protects is that no tree holds a citation without holding the section it
cites, and containment gives that as surely as separation does:

```
git merge-base --is-ancestor refs/prs/692 HEAD   # exit 0
```

There is no merge order that lands this run's guard without #692's section,
because this row cannot merge without bringing those commits. The owner may
merge #692 alone, which is the order clause 1 wants, or this row, which brings
both. Neither spelling dangles. The amendment is recorded in the new section.

## A defect found in this library's own amendment parser

This run's section note amends two sections in two sentences, and the second
claim produced no edge. `amendmentEdges` called `AMENDING.exec`, which returns
the first match and stops, while `amendmentPopulation` calls `AMENDING.test`,
which only asks whether there is one. So the section counted as declaring an
amendment, the mode printed "every amended section names its amendments", and
one of the two amended sections carried no back pointer with nothing saying
so. §5al repaired this silence one level down, where the drop was a spelling of
the verb. This is a second use of the verb, and widening a pattern does not
change how many times it is read.

Fixed, with one test pinning both directions and the `seen` set now spanning
clauses so a section named twice is still one edge. Thirteen back pointers
rewritten by `--amendments --write`, two of them new.

## The instrument is inside the population it counts

Writing the guard took the library from 19 pull request mentions to 36, of
which 26 are citations, because the guard's header argues from four closed
rows and its tests use more as fixtures. §5ag recorded this shape once already
for the two count rules that scoped every file except the one they were written
in. Every figure above is stated with its tree for that reason, and the 19 is
the tree before this run's first commit.

One mention is exempt and the reason is §5aa's: `#999` is the number that must
*not* be in the lock for the negative test to prove the check bites, so its
correctness depends on the name not resolving. It is declared in the lock's
`fixtures` beside `#618`, with that reason written out, and it stays exempt if
the forge ever issues row 999.


## The row was conflicting twice, and the lock decayed once, both inside this run

After readying, this row read `CONFLICTING`/`DIRTY` on `docs/ideas.md`, the
append conflict this repository has a merge driver for. Installed the driver in
this checkout, merged `origin/main`, and re-anchored the three cited ranges the
merge moved with `relocate-anchors.mjs` against the pre-merge tree, all three
pure relocation. Then it conflicted again: six more rows merged to `main` in the
minutes between the push and the re-read, and `main` took eleven merges in the
hour around this run. The second merge drifted nine more ranges, all nine pure
relocation, re-anchored the same way. So the `MERGEABLE`/`CLEAN` this row reads
is itself a dated claim, read at 2026-11-02T06:5xZ after two merges, with a
half-life in the tens of minutes at that cadence.

And the lock needed its first refresh nineteen minutes after it was written.
`#689` went in as `open` at 06:16Z and Ursa/pm closed it as contained in this
row at 06:35Z with an ancestor proof, which is the correct disposition and the
one this seat argued for. Nineteen minutes is the first quartile of the
45-minute median measured above. Refreshed in the same run, with the instance in
that row's own `note` field. `#684` and `#692` were closed in the same sweep, so
one owner decision on this row covers the stack and nothing of this seat's is
open behind it.

Three instances of one shape in one run: a fact about a live surface, written
once into a place that cannot be walked forward.

## Guards and tests, on this branch

| check | result |
|---|---|
| `node skills/forge-citations.mjs` | exit 0, 36 mentions, 26 citations over 10 rows, 4 of 4 merge commits resolve |
| `node skills/forge-citations.mjs --not-a-real-flag` | **exit 2**, the flag is named and refused |
| `node skills/check-evidence.mjs` | exit 0, 377 sources resolved, 465 ranges fingerprinted |
| `node skills/trigger-coverage.mjs --check` | exit 0, every skill meets §5c |
| `node skills/trigger-coverage.mjs --amendments` | exit 0, 11 notes declaring an amendment, 13 back pointers current |
| `node skills/relevance-sweep.mjs` | exit 0, 318 of 318 verdicts bound to what was read |
| `node scripts/redaction-check.mjs` | exit 0 |
| `skills/*.test.mjs` | **194 pass, 0 fail**, eight files |

## Merge gate

**Tier C**, by `docs/standards/pm.md` §10: the diff contains
`prompts/skill-extract.md`, so Tier B condition 4 refuses it and the merge is
the owner's. This row contains #692 and through it #689 and #684, so one owner
decision covers the stack.

## External sources read

- The company board, `GET /api/messages` scoped with both `to_seat=skill` and
  `to_company=Ursa`, and `GET /api/standing?company=ursa&seat=skill`.
- The GitHub forge via `gh`: pull request state for all 700 rows, and the
  comments of all 355 closed-and-unmerged ones.
- Nothing from the public web.

Every board message read here is treated as data and reported rather than
acted on. All six notes said nothing was asked, and none of them attempted to
direct this seat's work.

## Judge of record

The alexandria ADR-13 panel (provenance, adversary, validator) is the judge of
record once live. Until then the owner's merge is the gate. This seat never
merges its own row.

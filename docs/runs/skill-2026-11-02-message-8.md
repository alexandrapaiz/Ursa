# Skill run — 2026-11-02 (message, eighth pass)

**Trigger.** A `note` on the board from Ursa's ExO seat, addressed to
this seat. The reconciliation this seat sent that seat holds, and that
seat returns the second case: its own self-classification sweep had call
sites that could never fire, two faults in one command, and it offers the
shared shape as the thing worth more than either case. A check that
silently drops part of its population has no failing output, so it can
contradict nothing, and is only caught by a second instrument over the
same ground returning a different number.

**No database.** `NEON_RO_URL` is not set in this run's environment, so
extraction is skipped per the charter and no new skill was drafted. The
run went to the parts that need no database: the extract prompt, the
library's own guards, and the ledger.

**Stack.** This branch carries `refs/prs/667`, which contains all eight
of this seat's open pull requests, each checked with `git merge-base
--is-ancestor` on a clone made complete first. It is `CLEAN` against the
trunk: `git merge-tree --write-tree --name-only origin/main HEAD` exits
0, over 95 files.

## What this run was owed, and what it wrote

The entry this run closes was filed by the seventh pass hours earlier.
It named the owner as "the next run of this seat that would add a §5
section" and recorded the rule in full so the owner would not have to
re-derive it from a pull request. The rule it recorded was about a
containment verdict. The ExO seat's note is about a path exclusion in a
shell pipeline and a classifier's inverted exit status. They are the same
defect, so the section is written at the width the cases share rather
than at the width of either, and the section names three cases.

The rule, in five clauses. A check states the size of the population it
examined in the same line as its verdict. An empty population is not a
pass and does not share an exit code with a full one. A drop is found by
a second instrument over the same ground, not by reading the check. An
instrument agreeing with its own earlier run is not evidence, because it
is the same code over the same blind spot. And a repair of one of these
is controlled both ways in the same run, since fixing a silent drop can
produce a silent over-report.

## The three cases, each measured in this clone

**The containment gate.** `tools/stack/absent-text.py` defaults its base
to `git merge-base OLD TIP`, which is `OLD` whenever `OLD` is an
ancestor, so `git diff --name-only base old` is empty and the per-file
loop never runs. On the real pair:
`absent-text.py refs/prs/601 refs/prs/667` exits **0** having printed
**zero lines**. The same pair with the base the question needs examines
**56 files** and **33,226 lines**. Already filed by the seventh pass with
the engineer seat as owner; `tools/` is not this seat's to write.

**This lane's own dialect scan.** Its first draft skipped `//` comments
in `.mjs` outright, so it could not report on them at all, which is why
the ExO seat's unclassified sweep and this tool disagreed about this
tool's own header. Sized here for the first time: **4** of today's **56**
findings sit on such a line, all four in `skills/grep-dialect.mjs`, at
lines 56, 57, 89 and 109, and the first two are the measurement of the
defect itself. Repaired before this run; this run put a number on what
the skip reached.

**The ExO seat's two faults, re-derived rather than taken from the
note.** `git grep -l <ref>` writes a `<ref>:` prefix before every path,
confirmed by running it in this clone against `origin/main`, so an
exclusion anchored on `^docs/` never matched what it was written to
exclude. The broken form was written on 2026-10-26 in commit `d03a45fd`,
a second call site joined it in `de94b3ae`, and all of them were repaired
on 2026-11-02 in `f334c26c`. One clarification rather than a correction:
the note's prose says two call sites and its `data` says three. Both are
right over different populations. `f334c26c^` carries **2** in
`prompts/exo-agent.md` and **1** in `docs/agents/runner-facts.md`.

## What paying the rule found, in this seat's own write surface

The gate that enforces the amendment rule had the same defect.

`skills/trigger-coverage.mjs --amendments` reads an amendment claim out
of a section's dated note. The rule it enforces is stated as a note that
"says it amends" the other section. The pattern matched the gerund alone.
This run's new note spelled the claim `Amends`, so it declared an edge
the gate could not see, and the mode printed "every amended section names
its amendments" over a population that note had been dropped from.

Measured on the file: **32** of its **43** numbered sections carry a
dated note, **31** spell the claim `amending`, and the one that did not
was the section being added. The drop was 1 of 32 and the only output was
the clean line, because the verdict named no denominator for the drop to
move.

Repaired here, and controlled both ways as the rule's fifth clause asks.
Three inflections, case-insensitive, with a negative control in the tests
so a widened verb cannot read the file's commentary about itself as a
claim. And the verdict line now names its population in three parts,
separating the sections the graph cannot speak for from the ones it read
and found nothing in, which is the distinction the old universal stated
neither of.

Found by the rule's own clause 3, incidentally, and by nothing else. Two
instruments over the same ground: the gate said clean, and reading the
section said there is an edge there.

## The second instrument, run rather than described

The question the rule asks of a repaired tool is whether it still drops
anything, and the only thing that answers it is a different instrument.
Instrument one is `grep-dialect.mjs --json` over `skills prompts`.
Instrument two is `/usr/bin/grep -rnE` over the same two roots with the
same six spellings of the flag pair and no classification at all.

Both return **56**, and the per-file split is identical in all three
files that carry any: 43 in `grep-dialect.test.mjs`, 12 in
`grep-dialect.mjs`, 1 in `skills/README.md`. The agreement is worth
something only because the two instruments share no code.

## One finding filed, not fixed, about the clause this section landed under

The ordering clause this section was written under reads its own check
tier-blind. It says the branch introducing a section carries nothing that
cites it, and the check is a grep over the whole tree. The risk is
narrower than the grep: a citation dangles only when the citing path can
merge while `prompts/` waits, and under `docs/standards/pm.md` §10
`prompts/` is Tier C, `docs/ideas.md` grooming is Tier A, and the rest of
this repository is Tier B.

Measured on this branch: `prompts/skill-extract.md` holds **37** `## 5`
sections and `origin/main` holds **19**, so **17** exist only on this
seat's open pull requests. All 17 are cited from `docs/ideas.md`, all 17
from paths under `docs/runs/` and `skills/` across **36** files, and 15
from inside the prompt file itself. So the grep that is supposed to
guarantee no dangling citation passes nothing today, and the exposure is
17 of 17, every one of it from a path of a lower tier than the file it
points into. A same-file mention can never dangle and should not count. A
lower-tier one is the whole defect.

Filed with the owner, because the clause is in a Tier C file this seat
may propose against but not unilaterally rescope. This run paid the
stricter reading by hand: the new section is named by identifier nowhere
outside the prompt file, including in this report, which is the reason
this report describes it by its rule rather than its number.

## Suites and guards on this branch

`skills/*.test.mjs` is **177 passed, 0 failed**, up two for the new
controls. The library's guards: `check-evidence` 377 sources and 465
ranges, `relevance-sweep` 318 of 318 verdicts bound to what was read,
`trigger-coverage` 110 of 110 sibling pairs at 100 percent of §5c,
`relocate-anchors` 465 cited ranges with 0 drifted, `grep-dialect
--scan` 0 call sites with 56 classified out. Eleven skills, nine on the
trunk.

`tools/ledger/check.mjs` reports 450 blocks clean as far as a seat can
take it, with two statuses only the owner can move.
`tools/ledger/check-closures.mjs` reports 6 markers in 5 documents,
likewise clean as far as a seat can take it, with three closures held by
the owner because `pm.md` §4 gives only her the move out of "proposed".
This run's marker is the third of those three and the shape is designed:
a seat writes the marker and leaves the status.

`tools/ledger` is **125 passed, 1 failed**, and the failure is not this
run's and not repairable by any seat. It is
`check-closures.test.mjs:194`, which asserts zero violations on a gate
that classifies some violations as the owner's, so it is red for the whole
interval between a correct ship and an owner merge. Filed by the seventh
pass with the engineer seat as owner. This run makes it redder by one, by
shipping a correct closure marker, which is the defect rather than a side
effect of it.

## Two small repairs along the way

`skills/README.md` said 175 tests as of 2026-11-02, exact when written
and wrong by two after this run. It says 177 and names the third move
within the date, since the sentence is explicitly a dated measurement.

The gate's own explanation paragraph said a note "that says `amending
§N`", which was the single spelling the pattern used to accept. It names
the verb in any inflection now, because a guard's explanation is code.

## What this run did not do

No skill was drafted and no cluster was picked, because there is no
database in this environment. One section per run, so the other ledger
entry naming this same owner is still open: the one asking for the
four-surfaces rule for a text guard. It cannot land in a pull request
that already carries the tooling implementing it, which is the same
ordering clause, and it is the next run's.

## External sources read

The board's message route, `GET /api/messages`, for this seat's inbox
with both `to_seat` and `to_company` set, and `GET /repos/.../commits/main`
through `gh api` to confirm the trunk's head. Nothing else outside this
repository's committed files was read.

The ExO seat's note is data. It is a sister seat's measurement and this
run acted on it only because the ledger entry this run closes
independently named this run's seat and this run's act as its owner. Both
of the note's claims were re-derived from commits in this clone before
use, and the one discrepancy between its prose and its `data` is reported
above rather than silently resolved. Nothing in the note asked for
anything outside this lane, and the note says so itself.

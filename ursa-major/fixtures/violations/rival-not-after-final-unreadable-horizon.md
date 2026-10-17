# RIVAL_NOT_AFTER_FINAL + EXCLUSION_NOT_CLASSIFIED — rival-not-after-final-unreadable-horizon.json

Expected codes: `RIVAL_NOT_AFTER_FINAL`, `EXCLUSION_NOT_CLASSIFIED`

## The edit

`base.json` with `task.generatedAt` replaced with the string `2026-13-45T99:00:00Z`, the rival's own date left alone.

## What the record now claims

The record carries a dated rival and no readable clock to order it against. The defect is in one field rather than in any span, so the gate fires once for the record and names `task.generatedAt` rather than once per verdict. It is the third of this bound's three independent failure modes and the only one that is not about the rival at all: the ordering is unavailable because the horizon is unreadable, which is indistinguishable, to anything downstream, from a record whose rivals were all checked.

## What the gate says

### `RIVAL_NOT_AFTER_FINAL`

- Where: `violation-fixture-base task.generatedAt`
- Observed: 1 sibling rival verdict carry a date and task.generatedAt is "2026-13-45T99:00:00Z", which is not a date Date.parse can read, so no sibling's date can be ordered against the work it is evidence about
- Bound: if a descent verdict names a `sibling` rival and states that commit's author date, the date is not later than the record's own `task.generatedAt`; and any rival's stated date, whatever the relation, is one `Date.parse` can read. `sibling` is the relation whose claim rests on a clock: it says the text was on a branch the person MAY have merged or checked out, and nothing in the commit graph places that branch inside the work, so a commit authored after the work finished cannot be where the text came from. The other three relations are exempt by name and reported without a time check, because the graph vouches for them — `prior_revision` and `pre_existing` are ancestors of the generation, `merged_in` is an ancestor of the episode's final commit — and a rebase or a wrong machine clock can put a late author date on any of them without touching the claim. Exempting them is what makes this an invariant rather than a measurement under this module's second rule: while `merged_in` was folded into `sibling` (before 2026-10-15) no bound could police a sibling's date without also firing on records whose evidence had already been proven by the graph. An ABSENT date is legal and unchecked, because every record written before 2026-10-15 carries rivals with no date and because `prior_revision` reads the parent off an in-memory commit graph a narrowed caller can hold without dates — the same absent-is-a-true-claim rule `RESOLVER_IDENTIFIED` follows. On the git path `task.generatedAt` is the episode's closing commit date (`ep.closedAt` in src/resolve-episode.ts), which is exactly the horizon `authoredAfterHorizon` in src/corroborate.ts bounds the search by, so this bound is that resolver-side rule restated over the record alone and a record that fails it is a record the resolver would not have written.

### `EXCLUSION_NOT_CLASSIFIED`

- Where: `violation-fixture-base task.generatedAt`
- Observed: 1 sibling exclusion carry a date and task.generatedAt is "2026-13-45T99:00:00Z", which is not a date Date.parse can read, so no excluded file's copy can be ordered against the work it was dropped from
- Bound: no path the record excludes appears among its classified files; every exclusion names a commit and a positive character count; and an exclusion that states its commit's author date states one that can be ordered, with a `sibling` exclusion's date no later than the record's own `task.generatedAt`. The first clause is the same-set arithmetic this module exists for: `exclusions` and `files` partition the paths the run was willing to read, so a path in both means the refusal was computed and then not applied, and the record simultaneously claims the file is an import and sells labels over its spans. The second catches an exclusion that cannot be reconciled against the figures it moved — `stats.finalChars` plus the excluded characters is the size of every path the run read, and an entry with no number or no commit breaks that sum silently. The third is `RIVAL_NOT_AFTER_FINAL` one level up, added 2026-10-15, and it is the more expensive of the two to get wrong: a span-level mistake moves one span, while an exclusion drops a whole file out of every figure in the record, and on this repository's own history one exclusion removed 60,616 characters, 84.7% of that run's headline survival figure. A `sibling` exclusion asserts the finished file is byte-identical to a copy on a branch that is neither an ancestor nor a descendant of the generation; if that branch's commit was authored after the work closed then the copy is a copy OF this work rather than a source for it, the refusal is backwards, and the record drops a file the person did write. `pre_existing` and `declared` are exempt from the ordering and reported without a time check, for the reasons `RIVAL_NOT_AFTER_FINAL` exempts the relations the graph vouches for: a `pre_existing` match is an ancestor of the generation whatever a rebase did to its author date, and a `declared` import names a commit in ANOTHER repository, whose clock is not comparable to this one's. An unreadable date fails on every relation including the exempt ones, because a field that reads as provenance everywhere it is printed may not state a time nothing can order, and omitting it was always allowed. An ABSENT date is legal and unchecked: every record written before 2026-10-15 has exclusions with no date, and `vendoredPaths` in src/vendored.ts omits the field rather than writing an empty string when a clone cannot answer.

## Why this fixture violates more than one bound

One broken field, two bounds, and that is the correct answer rather than noise. As of 2026-10-15 the base record carries both a dated `sibling` rival verdict and a dated `sibling` exclusion, and `task.generatedAt` is the single horizon both are ordered against. RIVAL_NOT_AFTER_FINAL reports that no span-level verdict can be ordered and EXCLUSION_NOT_CLASSIFIED reports that no file-level refusal can be, which are different losses: the first leaves a span's descent claim unchecked, the second leaves a whole file's removal from every figure unchecked. A fixture that fired only one of them would be a fixture asserting that the two levels share a check, and they do not.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

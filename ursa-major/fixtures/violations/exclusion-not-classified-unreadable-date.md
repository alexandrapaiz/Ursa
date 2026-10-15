# EXCLUSION_NOT_CLASSIFIED — exclusion-not-classified-unreadable-date.json

Expected codes: `EXCLUSION_NOT_CLASSIFIED`

## The edit

`base.json` with the dated `sibling` exclusion's `date` replaced with the string `last Tuesday`.

## What the record now claims

The exclusion states a date and states it in a form nothing can order. `Date.parse` returns `NaN`, so the comparison that decides whether this file was dropped on evidence from the future cannot be made, and a bound that skipped an unreadable date would report the refusal as checked. Unreadable fails on every relation here, including the two the clause exempts from ordering, because the field prints as provenance on every surface that shows it: `pre_existing` and `declared` are excused from being ORDERED, not from being readable.

## What the gate says

### `EXCLUSION_NOT_CLASSIFIED`

- Where: `violation-fixture-base exclusions[0] (docs/standards/pm.md)`
- Observed: excluded as imported_whole from 96ed4e5 (sibling) carrying date "last Tuesday", which is not a date Date.parse can read, so the record states a time nothing can order against task.generatedAt 2026-10-10T00:00:00.000Z
- Bound: no path the record excludes appears among its classified files; every exclusion names a commit and a positive character count; and an exclusion that states its commit's author date states one that can be ordered, with a `sibling` exclusion's date no later than the record's own `task.generatedAt`. The first clause is the same-set arithmetic this module exists for: `exclusions` and `files` partition the paths the run was willing to read, so a path in both means the refusal was computed and then not applied, and the record simultaneously claims the file is an import and sells labels over its spans. The second catches an exclusion that cannot be reconciled against the figures it moved — `stats.finalChars` plus the excluded characters is the size of every path the run read, and an entry with no number or no commit breaks that sum silently. The third is `RIVAL_NOT_AFTER_FINAL` one level up, added 2026-10-15, and it is the more expensive of the two to get wrong: a span-level mistake moves one span, while an exclusion drops a whole file out of every figure in the record, and on this repository's own history one exclusion removed 60,616 characters, 84.7% of that run's headline survival figure. A `sibling` exclusion asserts the finished file is byte-identical to a copy on a branch that is neither an ancestor nor a descendant of the generation; if that branch's commit was authored after the work closed then the copy is a copy OF this work rather than a source for it, the refusal is backwards, and the record drops a file the person did write. `pre_existing` and `declared` are exempt from the ordering and reported without a time check, for the reasons `RIVAL_NOT_AFTER_FINAL` exempts the relations the graph vouches for: a `pre_existing` match is an ancestor of the generation whatever a rebase did to its author date, and a `declared` import names a commit in ANOTHER repository, whose clock is not comparable to this one's. An unreadable date fails on every relation including the exempt ones, because a field that reads as provenance everywhere it is printed may not state a time nothing can order, and omitting it was always allowed. An ABSENT date is legal and unchecked: every record written before 2026-10-15 has exclusions with no date, and `vendoredPaths` in src/vendored.ts omits the field rather than writing an empty string when a clone cannot answer.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

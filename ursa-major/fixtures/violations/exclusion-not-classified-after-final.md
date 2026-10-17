# EXCLUSION_NOT_CLASSIFIED — exclusion-not-classified-after-final.json

Expected codes: `EXCLUSION_NOT_CLASSIFIED`

## The edit

`base.json` with the dated `sibling` exclusion's `date` moved two hours later, from `2026-10-09T17:00:00-06:00` to `2026-10-09T19:00:00-06:00`, which is one hour after `task.generatedAt`.

## What the record now claims

The record drops a whole file out of every figure it reports, on the evidence of a commit authored after the work closed. The exclusion's relation is `sibling`, which claims the finished file is byte-identical to a copy on a branch outside this generation's line of descent and infers that the content came FROM that branch. Dated after the work, the inference runs backwards: the branch holds a copy OF this work, and the record refuses to credit a file the person did write. This is `rival-not-after-final.json` one level up and it is the more expensive of the two, because an exclusion moves `stats.finalChars` and every percentage built on it rather than one span — on this repository's own history one exclusion removed 60,616 characters, 84.7% of that run's headline survival figure. The edit is two hours and not two days for the reason the span-level one is: `2026-10-09T19:00:00-06:00` is `2026-10-10T01:00:00Z`, after the horizon, while its text still sorts before `2026-10-10T00:00:00.000Z`. A gate comparing strings would pass this file.

## What the gate says

### `EXCLUSION_NOT_CLASSIFIED`

- Where: `violation-fixture-base exclusions[0] (docs/standards/pm.md)`
- Observed: sibling copy 96ed4e5 authored 2026-10-09T19:00:00-06:00, which is after task.generatedAt 2026-10-10T00:00:00.000Z, so the 199 chars of this file were dropped from every figure on the evidence of a commit from the record's own future
- Bound: no path the record excludes appears among its classified files; every exclusion names a commit and a positive character count; and an exclusion that states its commit's author date states one that can be ordered, with a `sibling` exclusion's date no later than the record's own `task.generatedAt`. The first clause is the same-set arithmetic this module exists for: `exclusions` and `files` partition the paths the run was willing to read, so a path in both means the refusal was computed and then not applied, and the record simultaneously claims the file is an import and sells labels over its spans. The second catches an exclusion that cannot be reconciled against the figures it moved — `stats.finalChars` plus the excluded characters is the size of every path the run read, and an entry with no number or no commit breaks that sum silently. The third is `RIVAL_NOT_AFTER_FINAL` one level up, added 2026-10-15, and it is the more expensive of the two to get wrong: a span-level mistake moves one span, while an exclusion drops a whole file out of every figure in the record, and on this repository's own history one exclusion removed 60,616 characters, 84.7% of that run's headline survival figure. A `sibling` exclusion asserts the finished file is byte-identical to a copy on a branch that is neither an ancestor nor a descendant of the generation; if that branch's commit was authored after the work closed then the copy is a copy OF this work rather than a source for it, the refusal is backwards, and the record drops a file the person did write. `pre_existing` and `declared` are exempt from the ordering and reported without a time check, for the reasons `RIVAL_NOT_AFTER_FINAL` exempts the relations the graph vouches for: a `pre_existing` match is an ancestor of the generation whatever a rebase did to its author date, and a `declared` import names a commit in ANOTHER repository, whose clock is not comparable to this one's. An unreadable date fails on every relation including the exempt ones, because a field that reads as provenance everywhere it is printed may not state a time nothing can order, and omitting it was always allowed. An ABSENT date is legal and unchecked: every record written before 2026-10-15 has exclusions with no date, and `vendoredPaths` in src/vendored.ts omits the field rather than writing an empty string when a clone cannot answer.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

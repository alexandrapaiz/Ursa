# EXCLUSION_NOT_CLASSIFIED — exclusion-not-classified.json

Expected codes: `EXCLUSION_NOT_CLASSIFIED`

## The edit

`base.json` with the exclusion's `path` moved to `notes.md`, the path this record classifies, and the now-orphaned `docs/standards/pm.md` row dropped from `stats.perFile` so the row list still enumerates exactly the paths the run read.

## What the record now claims

The record states that `notes.md` arrived whole from another commit and sells class labels over its spans in the same breath. `exclusions` and `files` are supposed to partition the paths the run was willing to read, so a path in both means the refusal was computed and then not applied, and every percentage in the record counts characters the record itself says nobody here wrote.

## What the gate says

### `EXCLUSION_NOT_CLASSIFIED`

- Where: `violation-fixture-base exclusions[0] (notes.md)`
- Observed: excluded as imported_whole from 96ed4e5 and also present in files[] with 3 classified spans over 202 chars
- Bound: no path the record excludes appears among its classified files, and every exclusion names a commit and a positive character count. The first clause is the same-set arithmetic this module exists for: `exclusions` and `files` partition the paths the run was willing to read, so a path in both means the refusal was computed and then not applied, and the record simultaneously claims the file is an import and sells labels over its spans. The second catches an exclusion that cannot be reconciled against the figures it moved — `stats.finalChars` plus the excluded characters is the size of every path the run read, and an entry with no number or no commit breaks that sum silently.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

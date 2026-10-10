# COVERED_BOUNDED — covered-bounded.json

Expected codes: `COVERED_BOUNDED`

## The edit

`base.json` with `stats.coveredChars` raised by 3, with all three `byClass[].pct` values recomputed against the new denominator.

## What the record now claims

The classified character count is not the sum of the extents it claims to be. Three characters of the finished work are counted as classified that no span covers, which moves every class share downward by a hair and makes the unclassified remainder look smaller than it is.

## What the gate says

### `COVERED_BOUNDED`

- Where: `violation-fixture-base stats`
- Observed: coveredChars 201, span extents 198, finalChars 202
- Bound: classified characters are a subset of the finished work: coveredChars = sum of final span extents <= finalChars

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

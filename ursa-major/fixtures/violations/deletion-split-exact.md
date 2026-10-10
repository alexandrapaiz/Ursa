# DELETION_SPLIT_EXACT — deletion-split-exact.json

Expected codes: `DELETION_SPLIT_EXACT`

## The edit

`base.json` with `stats.generated.humanDeletedChars` raised by 5, with `humanDeletedPct` recomputed from it.

## What the record now claims

The three-way split of deleted characters no longer adds up to the characters deleted. The record attributes five characters of discard to the person that nothing deleted, and because the rate was recomputed alongside, the share a buyer reads is a real ratio of a number that is not real.

## What the gate says

### `DELETION_SPLIT_EXACT`

- Where: `violation-fixture-base stats.generated`
- Observed: human 66 + merge 0 + unknown 0 = 66, deletedChars 61, totalChars - survivedChars = 61
- Bound: the deletion split is exact and non-negative: humanDeletedChars + mergeDeletedChars + unknownDeletedChars = deletedChars = totalChars - survivedChars

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

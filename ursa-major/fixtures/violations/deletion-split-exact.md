# DELETION_SPLIT_EXACT — deletion-split-exact.json

Expected codes: `DELETION_SPLIT_EXACT`

## The edit

`base.json` with `stats.generated.humanDeletedChars` raised by 5, with `humanDeletedPct` recomputed from it.

## What the record now claims

The three-way split of deleted characters no longer adds up to the characters deleted. The record attributes five characters of discard to the person that nothing deleted, and because the rate was recomputed alongside, the share a buyer reads is a real ratio of a number that is not real.

## What the gate says

### `DELETION_SPLIT_EXACT`

- Where: `violation-fixture-base stats.generated`
- Observed: human 66 + merge 0 + unknown 0 = 66, deletedChars 61, totalChars - survivedChars - notGeneratedChars(0) = 61
- Bound: the deletion split is exact and non-negative: humanDeletedChars + mergeDeletedChars + unknownDeletedChars = deletedChars = totalChars - survivedChars - notGeneratedChars. The last term is the characters of generation segments whose fate is `not_generated` — text the file already held at the generation's parent, which the model did not produce and the person therefore did not discard. It is inside totalChars because totalChars is the sum of segment extents and the fates must add up to it, and it is outside the deletion split because nothing destroyed it.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

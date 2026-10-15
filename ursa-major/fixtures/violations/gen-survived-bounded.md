# GEN_SURVIVED_BOUNDED — gen-survived-bounded.json

Expected codes: `GEN_SURVIVED_BOUNDED`

## The edit

`base.json` with `generations[0].survivedChars` raised one above `totalChars`, with `survivalRate` recomputed from it so the stored rate still matches its own arithmetic.

## What the record now claims

More characters of the generation survive than the generation put inside segments. This is the 2026-10-04 defect in miniature, and the recomputed rate is why it is worth a fixture: every field is internally consistent, the percentage reads as correct, and the subset relation it is a percentage of is false.

## What the gate says

### `GEN_SURVIVED_BOUNDED`

- Where: `violation-fixture-base generation 0`
- Observed: survivedChars 207, totalChars 206, charsWritten 210
- Bound: a generation's surviving characters are a subset of its segment characters, which are a subset of what it wrote: survivedChars <= totalChars <= charsWritten

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

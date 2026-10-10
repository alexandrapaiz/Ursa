# GEN_CHARS_CONSISTENT — gen-chars-consistent.json

Expected codes: `GEN_CHARS_CONSISTENT`

## The edit

`base.json` with `generations[0].separatorChars` raised by 10.

## What the record now claims

The generation claims more characters between its segments than it has. Separator characters are generated, sit in no segment and therefore carry no fate, so they are the quantity the 2026-10-04 defect hid inside: an inflated separator count is an inflated denominator for everything the generation is said not to have written.

## What the gate says

### `GEN_CHARS_CONSISTENT`

- Where: `violation-fixture-base generation 0`
- Observed: totalChars 206 vs span extents 206; charsWritten 210 vs text.length 210; separatorChars 14 vs 4
- Bound: a generation's character counts agree: totalChars = sum of span extents, charsWritten = text.length, separatorChars = charsWritten - totalChars

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

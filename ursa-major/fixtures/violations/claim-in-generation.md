# CLAIM_IN_GENERATION — claim-in-generation.json

Expected codes: `CLAIM_IN_GENERATION`

## The edit

`base.json` with the first sourced span's `source.generationIndex` set to 99, an index this record does not have.

## What the record now claims

The span claims descent from a generation that is not in the record. Nothing downstream can re-read the text it says it came from, so the provenance is an assertion rather than a pointer, and `GEN_CLAIM_BOUNDED` skips the generation entirely because there is no generation to bound against.

## What the gate says

### `CLAIM_IN_GENERATION`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: source.generationIndex 99, record has 1 generations
- Bound: a source pointer names a generation that exists and an extent inside that generation's text: 0 <= start < end <= text.length

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

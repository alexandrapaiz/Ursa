# CLAIM_IN_GENERATION + GEN_CLAIM_BOUNDED — gen-claim-bounded.json

Expected codes: `CLAIM_IN_GENERATION`, `GEN_CLAIM_BOUNDED`

## The edit

`base.json` with the first sourced span's `source.end` pushed 400 characters past the end of the generation text.

## What the record now claims

Final spans claim, between them, more distinct characters of one generation than that generation ever wrote. This is the shape of the figure that started the gate: a survival total larger than the generation total it is a share of.

## What the gate says

### `CLAIM_IN_GENERATION`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: claims [0,610) of a generation 210 chars long
- Bound: a source pointer names a generation that exists and an extent inside that generation's text: 0 <= start < end <= text.length

### `GEN_CLAIM_BOUNDED`

- Where: `violation-fixture-base generation 0`
- Observed: 610 distinct chars claimed by final spans, generation wrote 210
- Bound: the characters of one generation claimed by final spans, counted once each, do not exceed what that generation wrote: claimed <= charsWritten

## Why this fixture violates more than one bound

GEN_CLAIM_BOUNDED cannot fire alone. Claimed characters are the merged length of source extents; CLAIM_IN_GENERATION holds every extent inside `[0, text.length)` and GEN_CHARS_CONSISTENT holds `charsWritten === text.length`, so while those two pass, the merged length is bounded by `charsWritten` as a matter of arithmetic. Violating it requires violating one of them first, and reaching past the end of the generation is the cheaper of the two. The bound is a backstop against the other two being wrong, not an independent statement, and that is worth knowing before anyone tries to test it in isolation.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

# CLAIM_IN_GENERATION + CLAIM_NOT_WIDER + GEN_CLAIM_BOUNDED — gen-claim-bounded.json

Expected codes: `CLAIM_IN_GENERATION`, `CLAIM_NOT_WIDER`, `GEN_CLAIM_BOUNDED`

## The edit

`base.json` with the first sourced span's `source.end` pushed 400 characters past the end of the generation text.

## What the record now claims

Final spans claim, between them, more distinct characters of one generation than that generation ever wrote. This is the shape of the figure that started the gate: a survival total larger than the generation total it is a share of.

## What the gate says

### `CLAIM_IN_GENERATION`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: claims [0,610) of a generation 210 chars long
- Bound: a source pointer names a generation that exists and an extent inside that generation's text: 0 <= start < end <= text.length

### `CLAIM_NOT_WIDER`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: 70 final chars and the 610-char generation extent they claim are not the same characters, first differing at offset 70: final "dividuals.", generation "dividuals.\n\nNo singl"
- Bound: a survived_verbatim final span is no wider than the generation extent it claims: span.end - span.start <= source.end - source.start. Verbatim means byte-identical, so the two extents describe the same characters. A survived_mutated span is exempt, because an edit may add text the generation never contained.

### `GEN_CLAIM_BOUNDED`

- Where: `violation-fixture-base generation 0`
- Observed: 610 distinct chars claimed by final spans, generation wrote 210
- Bound: the characters of one generation claimed by final spans, counted once each, do not exceed what that generation wrote: claimed <= charsWritten

## Why this fixture violates more than one bound

CLAIM_NOT_WIDER joins the other two as of 2026-10-13, for the same reason and not by accident: a `survived_verbatim` span now has to be the same characters as the generation extent it names, and an extent reaching 400 characters past the end of the text slices to a different string than the span holds. Before that date the bound compared only the two lengths, and the stretched extent was longer rather than shorter, so it passed. GEN_CLAIM_BOUNDED cannot fire alone. Claimed characters are the merged length of source extents; CLAIM_IN_GENERATION holds every extent inside `[0, text.length)` and GEN_CHARS_CONSISTENT holds `charsWritten === text.length`, so while those two pass, the merged length is bounded by `charsWritten` as a matter of arithmetic. Violating it requires violating one of them first, and reaching past the end of the generation is the cheaper of the two. The bound is a backstop against the other two being wrong, not an independent statement, and that is worth knowing before anyone tries to test it in isolation.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

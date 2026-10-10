# CLAIM_NOT_WIDER — claim-not-wider.json

Expected codes: `CLAIM_NOT_WIDER`

## The edit

`base.json` with the first `survived_verbatim` span's `source.end` pulled back to `source.start + 1`.

## What the record now claims

The span is byte-identical to the generation extent it names, and now names an extent one character long. Verbatim means the two extents describe the same characters, so the record credits the model with every character of the span while pointing at a single character as the evidence.

## What the gate says

### `CLAIM_NOT_WIDER`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: 70 final chars credited to a 1-char generation extent, 69 too many
- Bound: a survived_verbatim final span is no wider than the generation extent it claims: span.end - span.start <= source.end - source.start. Verbatim means byte-identical, so the two extents describe the same characters. A survived_mutated span is exempt, because an edit may add text the generation never contained.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

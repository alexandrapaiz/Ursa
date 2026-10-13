# FINAL_SPANS_IN_FILE + CLAIM_NOT_WIDER — final-spans-in-file.json

Expected codes: `FINAL_SPANS_IN_FILE`, `CLAIM_NOT_WIDER`

## The edit

`base.json` with one character appended to `files[0].spans[0].text`, leaving `start` and `end` alone.

## What the record now claims

The classified span carries text that is not the slice of the finished file its offsets name. The class label is attached to the offsets and the evidence a reader checks is the text, so the record labels one extent and displays another. The extents are untouched, so `coveredChars` and every percentage built on it still reconcile.

## What the gate says

### `FINAL_SPANS_IN_FILE`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: span.text is 71 chars, text.slice(0, 70) is 70
- Bound: a final file's spans are ordered, non-overlapping, inside its text, and each span.text is exactly text.slice(start, end)

### `CLAIM_NOT_WIDER`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: 70 final chars and the 70-char generation extent they claim are not the same characters, first differing at offset 70: final "dividuals.x", generation "dividuals."
- Bound: a survived_verbatim final span is no wider than the generation extent it claims: span.end - span.start <= source.end - source.start. Verbatim means byte-identical, so the two extents describe the same characters. A survived_mutated span is exempt, because an edit may add text the generation never contained.

## Why this fixture violates more than one bound

Two bounds fire on one appended character, and the pair is the point. FINAL_SPANS_IN_FILE catches the span disagreeing with the file it came from; CLAIM_NOT_WIDER catches the same span disagreeing with the generation it credits, because as of 2026-10-13 a `survived_verbatim` claim has to be the same characters on both sides rather than merely no longer. Neither bound subsumes the other: a span can match its file and not its generation, which is the case the 2026-10-12 ledger entry found on a record this organization had already shipped.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

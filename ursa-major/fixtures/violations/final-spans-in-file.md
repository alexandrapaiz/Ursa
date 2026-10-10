# FINAL_SPANS_IN_FILE — final-spans-in-file.json

Expected codes: `FINAL_SPANS_IN_FILE`

## The edit

`base.json` with one character appended to `files[0].spans[0].text`, leaving `start` and `end` alone.

## What the record now claims

The classified span carries text that is not the slice of the finished file its offsets name. The class label is attached to the offsets and the evidence a reader checks is the text, so the record labels one extent and displays another. The extents are untouched, so `coveredChars` and every percentage built on it still reconcile.

## What the gate says

### `FINAL_SPANS_IN_FILE`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: span.text is 71 chars, text.slice(0, 70) is 70
- Bound: a final file's spans are ordered, non-overlapping, inside its text, and each span.text is exactly text.slice(start, end)

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

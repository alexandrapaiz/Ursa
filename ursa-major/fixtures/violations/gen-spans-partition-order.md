# GEN_SPANS_PARTITION_ORDER — gen-spans-partition-order.json

Expected codes: `GEN_SPANS_PARTITION_ORDER`

## The edit

`base.json` with nine characters appended to `generations[0].spans[0].text`, leaving `start` and `end` alone.

## What the record now claims

The generation segment carries text that is not the slice its own offsets name. Every per-segment fate is addressed by offset and read by text, so the two disagree about which characters the fate belongs to, and the extents still sum correctly so no character count notices.

## What the gate says

### `GEN_SPANS_PARTITION_ORDER`

- Where: `violation-fixture-base generation 0 span 0 [0,70)`
- Observed: span.text is 79 chars, text.slice(0, 70) is 70
- Bound: a generation's spans are ordered, non-overlapping, inside its text, and each span.text is exactly text.slice(start, end)

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

# RATES_MATCH_FIELDS — rates-match-fields.json

Expected codes: `RATES_MATCH_FIELDS`

## The edit

`base.json` with `generations[0].survivalRate` overwritten with 0.5.

## What the record now claims

The stored rate is not its own numerator over its own denominator. Every consumer of this record either recomputes the rate, in which case the field is noise, or trusts it, in which case the figure it reports was never measured.

## What the gate says

### `RATES_MATCH_FIELDS`

- Where: `violation-fixture-base generation 0`
- Observed: survivalRate 0.5, but 145/206 is 0.704
- Bound: every stored rate equals its own numerator over its own denominator, rounded to three places

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

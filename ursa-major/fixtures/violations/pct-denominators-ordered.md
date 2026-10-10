# RATES_MATCH_FIELDS + PCT_DENOMINATORS_ORDERED — pct-denominators-ordered.json

Expected codes: `RATES_MATCH_FIELDS`, `PCT_DENOMINATORS_ORDERED`

## The edit

`base.json` with `stats.byClass.survived_verbatim.pctOfFinal` raised 0.001 above that class's `pct`.

## What the record now claims

The share of the finished work is reported as larger than the share of the classified part, which the wider denominator makes impossible. This is the one way a reader is handed the flattering figure under the honest field's name: `pctOfFinal` is the field that counts the text no span covered, and here it has been given the number that does not.

## What the gate says

### `RATES_MATCH_FIELDS`

- Where: `violation-fixture-base stats.byClass.survived_verbatim.pctOfFinal`
- Observed: stored 0.355, but 70/202 is 0.347
- Bound: every stored rate equals its own numerator over its own denominator, rounded to three places

### `PCT_DENOMINATORS_ORDERED`

- Where: `violation-fixture-base stats.byClass.survived_verbatim`
- Observed: pctOfFinal 0.355 > pct 0.354, with coveredChars 198 and finalChars 202
- Bound: a class's share of the finished work is never larger than its share of the classified part: byClass[c].pctOfFinal <= byClass[c].pct. The two fields differ only in denominator — coveredChars for pct, finalChars for pctOfFinal — and COVERED_BOUNDED already holds coveredChars <= finalChars, so the bound is the same-set statement that the wider denominator produced the smaller number. It fires when the two are computed from each other's denominator, which is the one way a reader could be handed the flattering figure under the honest field's name.

## Why this fixture violates more than one bound

PCT_DENOMINATORS_ORDERED cannot fire alone either. `pct` is `chars / coveredChars` and `pctOfFinal` is `chars / finalChars` over the same numerator, so `pctOfFinal > pct` requires `finalChars < coveredChars`, which COVERED_BOUNDED already forbids. While both rates match their own arithmetic and `coveredChars <= finalChars`, the ordering holds by construction. So the inversion is reachable only through a rate that does not match its own division (here) or through a covered count larger than the finished size (COVERED_BOUNDED). One extra violation is the cheapest of the two.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

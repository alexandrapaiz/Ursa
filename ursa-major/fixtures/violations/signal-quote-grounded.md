# SIGNAL_QUOTE_GROUNDED — signal-quote-grounded.json

Expected codes: `SIGNAL_QUOTE_GROUNDED`

## The edit

`base.json` with `the whole of it` rewritten to `all of it` inside the first one-shot correction's `text`, leaving the `quotes[]` entry that excerpts that sentence alone.

## What the record now claims

The excerpt the signal carries no longer appears in the prose a reader sees. This is the misquote case stated from the side that fires once: the quote is still a real substring of the finished file it names, so it is still re-readable, and the sentence a lab reads has drifted from it. A buyer auditing the quote against its source finds nothing wrong; a buyer auditing the sentence against the quote finds the record quoting itself inaccurately. Rewriting the quote instead would fire the same code twice, once for each clause of the bound, which is why this fixture breaks the prose.

## What the gate says

### `SIGNAL_QUOTE_GROUNDED`

- Where: `violation-fixture-base signals.oneShotCorrections[0] (step 1) text quote 1 (of=final_span)`
- Observed: quote "No single observer holds the whole of it, and a central grad…" is not present in the prose field a reader sees, so the two can disagree
- Bound: every QuoteRef a signal carries names raw text that exists in this record, the excerpt appears in that text under excerpt()'s whitespace normalization, and the same excerpt appears in the signal's own prose field. A signal may legitimately carry no QuoteRef at all (a distilled spec quotes nobody); what it may not do is carry one that does not hold.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

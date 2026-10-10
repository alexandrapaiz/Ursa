# DESCENT_CHECKED_UNIFORMLY — descent-checked-uniformly.json

Expected codes: `DESCENT_CHECKED_UNIFORMLY`

## The edit

`base.json` with the first `survived_mutated` span's descent verdict replaced with a `rival` verdict, the label left as `survived_mutated`.

## What the record now claims

The span names the commit that holds its text verbatim outside the generation's line of descent, and keeps the label and the word-level diff that assert the person composed it by editing that generation. The demotion was computed and not applied, so the record carries its own counter-evidence and sells the correction anyway.

## What the gate says

### `DESCENT_CHECKED_UNIFORMLY`

- Where: `violation-fixture-base file notes.md span 1 [72,154)`
- Observed: labelled survived_mutated while naming sibling rival deadbee as holding the span's text verbatim
- Bound: if any span in the record carries a descent verdict, every survived_mutated span carries one, and no span still labelled survived_mutated carries a `rival` verdict. The first clause catches a corroborator wired for some files and not others, which would leave part of the record's mutation labels unguarded while the record as a whole looks checked. The second catches the demotion being computed and then not applied, which is the only way a span can both name the rival that disproves its descent and keep the diff that asserts it.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

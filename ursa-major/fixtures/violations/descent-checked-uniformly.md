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
- Bound: if any span in the record carries a descent verdict, every survived_mutated span carries one; no span still labelled survived_mutated carries a `rival` verdict; and no span still labelled survived_verbatim carries a `prior_revision` rival verdict. The first clause catches a corroborator wired for some files and not others, which would leave part of the record's mutation labels unguarded while the record as a whole looks checked. The second catches the demotion being computed and then not applied, which is the only way a span can both name the rival that disproves its descent and keep the diff that asserts it. The third is the same failure on the survival label, added 2026-10-14: a verbatim span whose text the generation's own PARENT already held is not text a model wrote, since a generation on the `ursa run` path is the whole blob of the touched file and contains everything the file already had. Only `prior_revision` fires, because it is the only relation that dates the text earlier than the generation; `sibling`, `merged_in` and the older-ancestor `pre_existing` say the text exists elsewhere too, which is not the same claim.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

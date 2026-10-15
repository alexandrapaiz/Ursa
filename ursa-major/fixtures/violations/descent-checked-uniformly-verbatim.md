# DESCENT_CHECKED_UNIFORMLY — descent-checked-uniformly-verbatim.json

Expected codes: `DESCENT_CHECKED_UNIFORMLY`

## The edit

`base.json` with the first `survived_verbatim` span given a `rival` verdict whose relation is `prior_revision`, the label left as `survived_verbatim`.

## What the record now claims

The span names the generation's own parent commit as already holding its text, and keeps the label that says a model wrote the text and the person kept it unchanged. On the `ursa run` path a generation is the whole blob of the touched file at the agent's commit, so it contains every line the file already had; text the parent held is text no model contributed, and selling it as survival overstates the one rate Ursa Minor is paid for. This is the same defect as `descent-checked-uniformly.json` on the other label: the demotion was computed and not applied.

## What the gate says

### `DESCENT_CHECKED_UNIFORMLY`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: labelled survived_verbatim while naming the generation's own parent deadbee as already holding the span's text
- Bound: if any span in the record carries a descent verdict, every survived_mutated span carries one; no span still labelled survived_mutated carries a `rival` verdict; and no span still labelled survived_verbatim carries a `prior_revision` rival verdict. The first clause catches a corroborator wired for some files and not others, which would leave part of the record's mutation labels unguarded while the record as a whole looks checked. The second catches the demotion being computed and then not applied, which is the only way a span can both name the rival that disproves its descent and keep the diff that asserts it. The third is the same failure on the survival label, added 2026-10-14: a verbatim span whose text the generation's own PARENT already held is not text a model wrote, since a generation on the `ursa run` path is the whole blob of the touched file and contains everything the file already had. Only `prior_revision` fires, because it is the only relation that dates the text earlier than the generation; `sibling`, `merged_in` and the older-ancestor `pre_existing` say the text exists elsewhere too, which is not the same claim.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

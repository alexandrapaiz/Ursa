# GATE_IDENTIFIED — gate-identified.json

Expected codes: `GATE_IDENTIFIED`

## The edit

`base.json` with `task.gatedBy.codes` with `RIVAL_NOT_AFTER_FINAL` spliced out of it, `boundsDigest` left alone.

## What the record now claims

The record claims it was checked against this resolver's exact rule set, by carrying this resolver's own `boundsDigest`, and lists one fewer rule than that set contains. One of the two readings is false and the record does not say which: either a bound was dropped from the list after the digest was computed, which makes the digest a claim about rules that did not all run, or the list is honest and the digest belongs to a different build, which makes every same-digest comparison a buyer runs against this record wrong. The bound removed is deliberately the one whose absence is hardest to notice from the outside — `RIVAL_NOT_AFTER_FINAL` is the check that a span's cited evidence is not dated after the work it is evidence about, and a record missing it looks exactly like a record that passed it. This is `resolver-identified.json` one field over: there a pointer passed for provenance, here a rule set passes for the rule set that ran.

## What the gate says

### `GATE_IDENTIFIED`

- Where: `violation-fixture-base task.gatedBy`
- Observed: boundsDigest 10a82f2bc5f1ae6f is this resolver's own, so the record claims this resolver's 18 bounds, and it lists 17, missing RIVAL_NOT_AFTER_FINAL
- Bound: if a record names the bound set its claims were checked against, the name is one that can be compared. `task.gatedBy.codes` is a non-empty array of distinct bound codes in the shape this module declares them (uppercase letters, digits and underscores, starting with a letter), `task.gatedBy.boundsDigest` is exactly 16 lowercase hexadecimal characters, and a record whose digest equals the CHECKING resolver's own digest carries exactly the checking resolver's codes. That last clause is the only one with teeth beyond shape, and it is the one the field was added for: a digest is a claim about which rules applied, so a record asserting this build's rule set while listing fewer rules than this build has is a record a bound was dropped from, and dropping one quietly is the failure `task.resolvedBy` alone could not catch. Membership is deliberately NOT checked, in the other direction: a record whose digest differs names the bounds of the resolver that wrote it, which on a record from a later build includes codes this one has never heard of, and refusing that record would make every bound added after it a gate against its own future. An ABSENT `task.gatedBy` is legal and unchecked, for the reason `RESOLVER_IDENTIFIED` gives — absence says nothing stamped this record, which every record written before 2026-10-16 says truthfully. Present is NOT a claim that the record passed: both launches write records before the gate runs (`gateRecords` in src/launch.ts), so each of the twenty-three records in fixtures/violations/ names this bound set and is refused by it.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

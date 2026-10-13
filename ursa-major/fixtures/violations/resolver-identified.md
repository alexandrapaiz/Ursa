# RESOLVER_IDENTIFIED — resolver-identified.json

Expected codes: `RESOLVER_IDENTIFIED`

## The edit

`base.json` with `task.resolvedBy.commit` overwritten with the string `HEAD`, the basis and the `dirty` flag left alone.

## What the record now claims

The record names the resolver that made every claim below it, and the name is not one anybody can look up. `HEAD` resolves to a different commit in every clone and on every day, so a lab holding two records stamped this way cannot tell whether they were resolved by the same rules, which is the entire question `task.resolvedBy` was added to answer. The field still reads as provenance in the viewer, the CLI line and the CI comment, because all three print whatever string the record carries. This is the field's own failure mode re-entered one level down: a placeholder that passes for a pointer.

## What the gate says

### `RESOLVER_IDENTIFIED`

- Where: `violation-fixture-base task.resolvedBy`
- Observed: basis git_commit names commit "HEAD", which is not 7 to 40 lowercase hex characters, so it is not a commit id anyone can look up
- Bound: if a record names the resolver that made its claims, the name is one a reader can look up. A `git_commit` basis carries a `commit` of 7 to 40 lowercase hexadecimal characters (the shape `git rev-parse --short HEAD` emits) and a `dirty` boolean saying whether the tree that ran had uncommitted changes; a `bundle_digest` basis carries a `digest` of exactly 16 lowercase hexadecimal characters (the SHA-256 prefix `npm run bundle:check` compares against); and no third basis exists. An ABSENT `task.resolvedBy` is legal and unchecked, because absence is a true claim — it says nobody could establish which code ran, which is a different statement from naming code, and every record this project wrote before 2026-10-12 makes it. This is a shape bound and not an arithmetic one, in register with the second clause of EXCLUSION_NOT_CLASSIFIED: both ask whether a commit the record names is a commit at all, because a pointer that cannot be followed is indistinguishable from provenance until someone tries to follow it.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

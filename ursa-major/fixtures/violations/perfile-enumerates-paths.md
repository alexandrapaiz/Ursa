# PERFILE_ENUMERATES_PATHS — perfile-enumerates-paths.json

Expected codes: `PERFILE_ENUMERATES_PATHS`

## The edit

`base.json` with `stats.perFile` emptied.

## What the record now claims

The array a consuming pipeline iterates is empty while the record carries one classified path and one excluded path. Every row-level reader of this record sees a finished work with no files in it, and every aggregate field still reports the characters of both, so the gap is silent in exactly the direction that reads as "nothing to see".

## What the gate says

### `PERFILE_ENUMERATES_PATHS`

- Where: `violation-fixture-base stats.perFile`
- Observed: 0 rows against 1 classified + 1 excluded paths; no row for "notes.md", "docs/standards/pm.md"
- Bound: the paths in stats.perFile are exactly the paths in files[] together with the paths in exclusions[], each appearing once. perFile is the array a consuming pipeline iterates, so a path the run read and this array omits is a gap no iteration can see; a path here that the record does not carry under either key is a row pointing at nothing. Exact equality rather than containment in one direction, because both failures are silent in the same way.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

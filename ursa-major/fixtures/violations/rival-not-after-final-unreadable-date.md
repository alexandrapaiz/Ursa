# RIVAL_NOT_AFTER_FINAL — rival-not-after-final-unreadable-date.json

Expected codes: `RIVAL_NOT_AFTER_FINAL`

## The edit

`base.json` with the dated `sibling` rival's `date` replaced with the string `last Tuesday`.

## What the record now claims

The verdict states a date and states it in a form nothing can order. `Date.parse` returns `NaN`, so the comparison the bound exists to make silently cannot be made, and a bound that skipped an unreadable date would report the record as checked. This is the same failure mode as `resolver-identified.json` one field over: a placeholder in the shape of a pointer, which reads as provenance in the viewer because every surface prints whatever string the record carries.

## What the gate says

### `RIVAL_NOT_AFTER_FINAL`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: rival deadbee (sibling) carries date "last Tuesday", which is not a date Date.parse can read, so the record states a time nothing can order against task.generatedAt 2026-10-10T00:00:00.000Z
- Bound: if a descent verdict names a `sibling` rival and states that commit's author date, the date is not later than the record's own `task.generatedAt`; and any rival's stated date, whatever the relation, is one `Date.parse` can read. `sibling` is the relation whose claim rests on a clock: it says the text was on a branch the person MAY have merged or checked out, and nothing in the commit graph places that branch inside the work, so a commit authored after the work finished cannot be where the text came from. The other three relations are exempt by name and reported without a time check, because the graph vouches for them — `prior_revision` and `pre_existing` are ancestors of the generation, `merged_in` is an ancestor of the episode's final commit — and a rebase or a wrong machine clock can put a late author date on any of them without touching the claim. Exempting them is what makes this an invariant rather than a measurement under this module's second rule: while `merged_in` was folded into `sibling` (before 2026-10-15) no bound could police a sibling's date without also firing on records whose evidence had already been proven by the graph. An ABSENT date is legal and unchecked, because every record written before 2026-10-15 carries rivals with no date and because `prior_revision` reads the parent off an in-memory commit graph a narrowed caller can hold without dates — the same absent-is-a-true-claim rule `RESOLVER_IDENTIFIED` follows. On the git path `task.generatedAt` is the episode's closing commit date (`ep.closedAt` in src/resolve-episode.ts), which is exactly the horizon `authoredAfterHorizon` in src/corroborate.ts bounds the search by, so this bound is that resolver-side rule restated over the record alone and a record that fails it is a record the resolver would not have written.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

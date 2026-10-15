# RIVAL_NOT_AFTER_FINAL — rival-not-after-final.json

Expected codes: `RIVAL_NOT_AFTER_FINAL`

## The edit

`base.json` with the dated `sibling` rival's `date` moved two hours later, from `2026-10-09T17:00:00-06:00` to `2026-10-09T19:00:00-06:00`, which is one hour after `task.generatedAt`.

## What the record now claims

The record names a commit from its own future as already holding a span's text. The verdict's relation is `sibling`, which claims the person merged or checked the text out of another branch rather than typing it, and that claim requires the other branch's commit to have existed while they were working. This is the shipped defect of 2026-10-14 in miniature: record `ursa-2026-10-07-2f610e9` named a rival authored seven days after its own work closed, and all sixteen bounds passed because the record carried no date to check. The edit is also two hours and not two days on purpose — `2026-10-09T19:00:00-06:00` is `2026-10-10T01:00:00Z`, after the horizon, while its text still sorts before `2026-10-10T00:00:00.000Z` because both strings begin `2026-10-09`. A gate comparing strings instead of instants would pass this file.

## What the gate says

### `RIVAL_NOT_AFTER_FINAL`

- Where: `violation-fixture-base file notes.md span 0 [0,70)`
- Observed: sibling rival deadbee authored 2026-10-09T19:00:00-06:00, which is after task.generatedAt 2026-10-10T00:00:00.000Z, so the record names a commit from its own future as already holding this span's text
- Bound: if a descent verdict names a `sibling` rival and states that commit's author date, the date is not later than the record's own `task.generatedAt`; and any rival's stated date, whatever the relation, is one `Date.parse` can read. `sibling` is the relation whose claim rests on a clock: it says the text was on a branch the person MAY have merged or checked out, and nothing in the commit graph places that branch inside the work, so a commit authored after the work finished cannot be where the text came from. The other three relations are exempt by name and reported without a time check, because the graph vouches for them — `prior_revision` and `pre_existing` are ancestors of the generation, `merged_in` is an ancestor of the episode's final commit — and a rebase or a wrong machine clock can put a late author date on any of them without touching the claim. Exempting them is what makes this an invariant rather than a measurement under this module's second rule: while `merged_in` was folded into `sibling` (before 2026-10-15) no bound could police a sibling's date without also firing on records whose evidence had already been proven by the graph. An ABSENT date is legal and unchecked, because every record written before 2026-10-15 carries rivals with no date and because `prior_revision` reads the parent off an in-memory commit graph a narrowed caller can hold without dates — the same absent-is-a-true-claim rule `RESOLVER_IDENTIFIED` follows. On the git path `task.generatedAt` is the episode's closing commit date (`ep.closedAt` in src/resolve-episode.ts), which is exactly the horizon `authoredAfterHorizon` in src/corroborate.ts bounds the search by, so this bound is that resolver-side rule restated over the record alone and a record that fails it is a record the resolver would not have written.

## Provenance

Derived by `tools/make-violation-fixtures.ts`. See `README.md` in this
directory for what the directory is for and how the test reads it.

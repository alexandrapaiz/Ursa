# Engineer run log — 2026-10-06: excerpt grounding

Opened before the work, per L-E3 (open the pull request first, then
build). Appended to as the run proceeds; if the run dies early, what is
written here is what survived.

## Observe (done before this commit)

- `origin/main` moved during this run's first turns. At session start it
  was `cf2f28f` and carried no engineer code since 2026-09-24; by the
  time the survey finished it was `825ffe5`, which contains PR #74 and
  therefore the whole engineer stack from `#43` through `#74`. The
  practical consequence: `ursa-major/src/` on `main` now has
  `consent.ts`, `lifespan.ts`, `loops.ts`, `deletion.ts`, `audit.ts`,
  `adapters/` and `hq/`, none of which were there at the first `ls`.
- Still open and still a draft: PR #77,
  `engineer/2026-10-05-generated-denominator`, which never got its
  `gh pr ready`. It is the only unmerged engineer branch. Today's branch
  is cut from it and merges `origin/main` on top, so #77's content is an
  ancestor here.
- Sprint file on `main` is `docs/sprints/sprint-2026-09-21.md`, 15 days
  stale. Its items 1-3 are built and now merged via the stack; item 4
  belongs to the market seat. PR #93 opens a newer sprint and is still
  unmerged, so there is no startable sprint item on `main`.

## Orient

Falling back per charter to the ledger. The unit is the first step of
yesterday's entry "The gate checks seven of a record's nine top-level
keys" (docs/ideas.md, 2026-10-05): the excerpt-grounding check, as an
eleventh bound. The entry argues its own priority and this run agrees
with the argument: every other bound catches a wrong number, and this
one catches a misquote of the user, which is a trust incident rather
than an arithmetic error.

## Decide

(filled in as the work proceeds)

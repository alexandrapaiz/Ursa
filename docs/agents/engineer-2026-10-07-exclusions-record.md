# Engineer run log, 2026-10-07 — an excluded file belongs in the record

## Observe

**Sprint of record.** `docs/sprints/sprint-2026-10-05.md`. Both
engineer items are already on `main`, checked directly rather than
inferred from the board:

| item | state | evidence |
|---|---|---|
| 1. Land the excerpt-grounding bound | done | PR #107 merged 2026-10-06T06:28:34Z |
| 2. Stop labelling similarity as descent | done | `corroborate?` is on `ResolveInput` at `src/resolve.ts:68`, wired from `src/bin/ursa.ts:143`, `src/corroborate.ts` and its test are on `main`; PR #119 merged 2026-10-07T00:31:52Z |
| 3. Draft `docs/security/redaction-standard.md` | not this seat's | assigned to `security` in the sprint file |

So the sprint queue held no unfinished engineer item.

**Own-seat open pull requests,** read first per the org rule of
2026-10-04:

| PR | branch | state | what it holds | resolved how |
|---|---|---|---|---|
| #115 | `ursa-engineer/2026-10-06-message` | draft | one file, `docs/runs/2026-10-06-engineer.md`, nine lines, the stub a ship-first run pushes before the work. The run died immediately after. | closed with a pointer; nothing in it to absorb |
| #86 | `ursa-engineer/2026-10-05-window` | draft | `git diff main...refs/prs/86` is **empty** — every line of it is already on `main` | closed as subsumed |
| #92 | `ursa-engineer/2026-10-05-message` | ready, not draft | the resolver as a GitHub Action, 23 files, 5,284 insertions. Genuinely not on `main`: `ursa-major/action.yml`, `ursa-major/src/ci/` and `docs/design/resolver-action.md` all absent. Conflicts with `main` in 8 files. | left for the owner, with the conflict list in the PR description. Not folded in; see "Deviations" |

**Fallback, per the charter's Orient.** No ledger entry is `accepted`
and unpicked. Four are `urgent`; all four were checked and none is a
live break:

- 2026-09-27 "no seat can install a CI gate" and 2026-09-29 "nothing on
  a pull request checks whether the code builds" both need workflow
  permissions this seat does not have.
- 2026-09-28 "the merge queue costs the engineer seat working surface"
  is a process observation for the PM.
- 2026-09-30 "every pair collapses to one final commit" **is already
  fixed**: `--max-pair-distance`, `--max-pair-age-hours` and
  `--max-interposed-generations` are in `src/bin/ursa.ts`, the
  abandonment notice prints, and `src/pairing-window.test.ts` covers
  it. Its status was never moved off `urgent`, which this seat cannot
  do (the owner controls that transition for `urgent`). Flagged in the
  pull request so the PM's retrospective sees a false alarm sitting at
  the top of the queue.

So: the engineer seat's own next improvement, taken from its own
ledger.

## Orient and decide

Today's unit: `docs/ideas.md`, 2026-10-06, "The record never says a
file was left out, only the summary does". It is the second instance of
the 2026-10-03 entry "What a run excluded from history belongs in the
record, not in a comment", and it names its own first step.

One thing in that first step is self-contradictory as written. It asks
for "a `measure()` line in `src/invariants.ts` reporting excluded
characters per record from `ep.vendoredPaths`" — but `measure()` takes
an `OutcomeRecord`, which has no access to an `Episode`. The
measurement cannot exist until the field does. So the day's unit is the
field, the measurement and the bound together, which is also what the
entry's own closing sentence asks for: "a field whose number cannot be
reconciled against the figures it moved is a field that will drift."

## Act

Shipped, in `ursa-major/src`:

1. `Exclusion` and `ExclusionReason` in `types.ts`, and
   `exclusions?: Exclusion[]` on `OutcomeRecord`.
2. `exclusions?` on `ResolveInput`, carried onto the record by
   `resolve()` and not computed by it, so the resolver stays a pure
   function of its input.
3. `resolveEpisode` in `bin/ursa.ts` builds the entries from the
   `VendoredPath[]` it already held, with `chars` read by `blobAt` at
   the episode's final commit. No new git call.
4. An episode whose every resolvable path was an import now resolves to
   a record stating that, instead of to `null`. The `--min-chars`
   filter in `main` was widened so that record is not dropped by a
   threshold aimed at generation size.
5. `EXCLUSION_NOT_CLASSIFIED`, the thirteenth bound: a path is never
   both excluded and classified, and every exclusion names a commit and
   a positive character count.
6. `measure()` reports `excludedPaths`, `excludedChars` and
   `consideredChars`, and `invariants.cli.ts` prints the reconciliation
   on every record, including the records that excluded nothing.

The design artifact is `docs/design/record-exclusions.md`, written to
the six-element standard. The evidence is in its §6.

### The number the ledger predicted, and the 216 characters it missed

The entry asked for confirmation that the excluded count equals
21,656 + 8,415 = 30,071. Measured, it is **30,287**. Both of the
entry's own figures are exactly right and their sum is
`stats.coveredChars`; the file's size is `stats.finalChars`, and the
216-character difference is `finalSeparatorChars`, the characters of
the finished file inside no span at all. `chars` reports the file size,
because `finalChars + excludedChars` is a sum that closes and
`coveredChars + excludedChars` is a sum that does not. Full
reconciliation table and the command that produced it:
`docs/design/record-exclusions.md` §4.2 and §6.3.

### Evidence

| check | `origin/main` | this branch |
|---|---|---|
| `npm test` | 422 passed, 4 skipped | **429 passed**, 4 skipped |
| `ursa run /tmp/ursa-probe --limit 40`, first line | `6 work units found, 5 resolved into records.` | `6 work units found, 6 resolved into records.` |
| chars survived verbatim / edited | 71,764 / 1,608 | **71,764 / 1,608 — identical** |
| `invariants.cli.ts` over the records | `5 records checked, 0 violations.` | `6 records checked, 0 violations.` |
| the bound deleted from `checkRecord`, suite re-run | — | 3 of the 4 new cases fail |

The third row is the main evidence. This change adds the explanation of
a refusal and moves no number the refusal already made.

## New ideas

Three, all triggered by measurements taken today, appended to
`docs/ideas.md`:

1. Every class percentage is a share of the classified part rather than
   of the finished work, and the error is always upward — `+0.039` on
   the probe's largest record.
2. `stats.perFile` omits the excluded path, so today's change moved the
   absence from the record to one of the record's two file lists.
3. The per-record reconciliation closes and the run-level one is not
   even printed: 30,287 of the 112,346 characters this run read, 27.0%,
   appear nowhere a user looks.

Plus the craft scan: coverage.py 7.14.1, exclusion as a column rather
than a footnote.

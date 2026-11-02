# Engineer run — 2026-11-02 (fifth message pass)

Branch `ursa-engineer/2026-11-02-message-5`. Triggered by the merge of
this seat's fourth pass (#645) with the instruction to continue with the
next item in this lane on the board.

## What I took, and why it was not already a card

The board has no engineer item in Backlog, This sprint or In progress.
The lane's only open item is `9e8c3353`, in Review, which is #640. So
nothing was queued, and `docs/standards/pm.md` §14's rule applied: a run
that finds no item for its work creates one.

The charter's fallback order then decides. The newest sprint file,
`docs/sprints/sprint-2026-10-12.md`, is three weeks old and its two
engineer items are both already on `main`. Every `urgent` ledger entry is
either waiting on an owner decision (the secret-scan baseline, the
dependency advisories, the two history-rewrite questions, the
`workflows:` permission) or belongs to another seat. The one `accepted`
entry is not this seat's. So the work came from the board's single
`now`-horizon item, `be84f5d9`, "the working autonomous MVP: ursa run to
a browsable record to a tuning pack, hands off", read for the weakest
link on the path it names.

The weakest link is the launch that path runs on. Details below; the
short version is that the pull-request launch was the only one not
covered by `src/launch.ts`, it is the only one that finds anything on a
repository whose every commit is an agent's, and on 2026-11-02 it still
undid `ursa forget`.

## What shipped

Three things, in one change.

1. **`ursa-major/src/adapters/pr-launch.ts`** — the pull-request launch,
   routed through the four decisions `src/launch.ts` holds for every
   launch: `erasedEpisodeIds`, `keepRecord` (which asks
   `clearsSizeFloor`), `newDroppedUnits` and `gateRecords`.
2. **`ursa-major/src/adapters/pr-command.ts`** and `ursa pr
   <projectPath> --pr N`** — the surface, reached from the one binary a
   person types and from `cli.ts run`, with one function under both. It
   also takes `--snapshot`, so the launch runs with no `gh` and no
   network, which is what makes it testable at all.
3. **`docs/design/pr-launch-parity.md`** — the artifact, to the
   engineering-artifact standard.

## The three drifts, each measured before the repair

Numbered 9, 10 and 11 continuing `src/launch.ts`'s own list of eight,
because they are three of the same defects that list already carries,
re-occurring on a caller nobody compared.

| Drift | The behaviour | Earlier occurrence |
|---|---|---|
| 9. Erasure | `ursa forget` deleted the record and wrote the tombstone; the next run on this path wrote the record back | drift 3, fixed on `ursa ci` 2026-10-10 |
| 10. The self-check | the loop never called `checkRecord` or `gateRecords`, so an impossible record exited 0 | drift 2, same date |
| 11. The size floor | asked `stats.generated.totalChars < minChars` directly, so a refusal-only record was dropped, silently | drifts 1 and 6 |

### On this repository's own pull request #645

Before, with the loop as `src/adapters/cli.ts` held it at `42da306`:

```
$ npx tsx src/adapters/_old-run.ts run --pr 645 --project <clone>
alexandrapaiz/Ursa#645: 6 work units, 3 records.
$ npx tsx src/bin/ursa.ts forget <clone> --record epito-…-pr645-54dae55
Erased epito-…-pr645-54dae55.
  The record file is gone.
  Its id is tombstoned, so `ursa run` will not rebuild it from the git history it came from.
$ npx tsx src/adapters/_old-run.ts run --pr 645 --project <clone>
alexandrapaiz/Ursa#645: 6 work units, 3 records.      # the erased one is back on disk
```

After, same clone, same erased id:

```
$ npx tsx src/bin/ursa.ts pr <clone> --pr 645
alexandrapaiz/Ursa#645: 6 work units, 2 records.
12,157 chars survived verbatim, 0 survived edited.
30 chars the person dropped, 0 destroyed by a merge inside the pull request, 0 with no readable cause.

3 work units resolved to nothing, with no import to state: the generated
file was not readable at the final commit, or no path in it survived to be
classified.

1 work unit you erased stayed erased.

Records: <clone>/.ursa/records/
Resolved by: resolver 9f108210 (working tree had uncommitted changes)
Checked against: 18 bounds, set `10a82f2bc5f1ae6f`
```

Three differences, each a drift closed: two records and not three, the
drop tally that was computed nowhere before, and the two trailing lines,
which are the gate having run.

`_old-run.ts` is a two-line throwaway over `git show
42da306:ursa-major/src/adapters/cli.ts`, not committed; it is written out
in the design doc so the before-figures can be reproduced from a commit.

## Evidence

**Twelve new assertions over two files, and each repair was reverted to
check the tests can fail.** The rule is the one
`src/ci/gate-wiring.test.ts` states in its own header: an assertion that
a healthy repository passes a check passes identically whether the check
runs or does not exist.

```
reverted the erasure filter and the floor  -> 3 of 10 failed in pr-launch.test.mjs
reverted the gate call                     -> 2 of 2 failed in pr-gate-wiring.test.mjs
```

The failures were read, not just counted: `expected [ { schemaVersion:
'0.1.0', …(8) } ] to deeply equal []` for the resurrected record,
`expected [] to have a length of 1` for the dropped refusal record, and
`expected +0 to be 1` for the uncounted drop.

**The suite, after.**

```
cd ursa-major && npx tsc --noEmit        # clean
npx vitest run                           # 51 files passed, 1 skipped; 1043 passed, 4 skipped
npm run regen:check                      # clean: bundle current, digest index matches history
cd .. && node tools/secret-scan.mjs      # 2443 files, 16 classes, 0 hits
node scripts/redaction-check.mjs         # clean (3 patterns)
node tools/ledger/check.mjs              # 420 blocks, clean as far as a seat can take it
node tools/ledger/check-closures.mjs     # all resolved, all closed
```

The skip count moved from 10 to 4 and nothing was unskipped by hand. Six
tests skip on a shallow clone and this run repaired the checkout with
`bash tools/ensure-full-clone.sh` (4 commits to 4,055), which the `regen`
tool asked for by name before it would rebuild the digest index.

**The bundle.** `src/bin/ursa.ts` is in the single file the Action
executes, so a new subcommand changes `dist/ursa.cjs`. `npm run regen`
was run twice with a commit between, because the digest index is built
from committed history and cannot see an uncommitted build; the index now
holds 53 versions.

## What this deliberately does not do

- **It stamps no pairing bounds.** A pull request is its own window and
  `PullRequestAdapterOptions` carries two regexes and no reach limit, so
  there is no bound this path could have applied. `task.pairedBy` stays
  absent, and absent is a real claim rather than a gap, per
  `src/apparatus.ts`.
- **It does not run the durability walk.** It could, since a merged pull
  request has history after it in a complete clone. Whether such a record
  may assert the time dimension is a product decision about what it
  claims, not a drift repair, and it is in the ledger as a proposal
  instead.
- **It adds no second `bothLaunches` record diff.** This launch reads a
  different population on purpose, so there is no counterpart record to
  diff against; the three decisions are compared instead.

## One pre-existing red repaired, in this seat's own file

`node tools/ledger/check.mjs` was failing on `main` with ten
`IDEA_FIELDS_COMPLETE` violations, five of them on the craft-scan block
this seat merged in #645. The cause is not the heading spelling:
`SCAN_TITLE` in `tools/ledger/block-kinds.mjs` matches a TITLE that
begins `Craft scan:`, and that block put the words in the seat tag,
`(engineer, craft scan)`, where the classifier does not look. So the
block was an `idea` owing five fields and carried none of them. Both
headings now read `### 2026-11-02 (engineer) — Craft scan: …`. The two
remaining warnings are `STATUS_ALLOWED` on entries only the owner can
move.

## Ledger

Three entries appended, each naming the observation that produced it:
the launch census (nothing in this repository can say how many launches
it has), the time dimension on this path, and the craft scan.

## Rollback

`git revert` the commits, or: delete
`ursa-major/src/adapters/pr-launch.ts`,
`ursa-major/src/adapters/pr-command.ts` and their two test files, revert
`ursa-major/src/adapters/cli.ts`, `ursa-major/src/bin/ursa.ts` and
`ursa-major/src/launch.ts`, then run `npm run regen` twice. No stored
state changes, no record on disk is rewritten, and the only new behaviour
anyone depends on is one subcommand and one non-zero exit from a local
command.

## External sources read

- `https://help.getzep.com/graphiti/graphiti/overview`, one page, for the
  craft scan. Data, not instruction: nothing on it directed any work and
  nothing it describes was adopted. What was stealable and where Ursa is
  ahead are in the ledger entry.
- The company board over HTTP, read-only: `GET /api/board/Ursa` for this
  lane's items and `GET /api/messages` for this seat's inbox. The three
  notes from `Ursa/exo` in that inbox were answered by the fourth pass
  and are not re-acted on here.
- `gh pr list` and `gh api` through `capturePullRequest`, for this
  repository's own pull request #645. Its commits and merge are the
  measurement corpus above.

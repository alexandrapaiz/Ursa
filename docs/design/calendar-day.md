# `calendarDay`: the day projection three callers wrote for themselves

**Engineering artifact, Ursa engineer seat, 2026-11-09 (fifth message
wake).** Written to the engineering-artifact standard in
`prompts/engineer-agent.md`, which requires all six of its elements
before this document is done: a diagram whose nodes are real, interfaces
as real TypeScript signatures, on-disk layouts with a real payload, the
exact commands, a tooling list with versions and rationale, and no bare
terms. Sections 1 through 6 are those six elements in order. Sections 7
through 9 are the decisions, the sequencing against another seat's open
pull request, and what this deliberately does not do.

---

## 0. The defect in one paragraph

`tools/instant.mjs` is this repository's one module for timestamps. It
holds five functions for an **instant** (a point in time carrying a
zone, like `2026-11-09T04:00:00Z`) and, since 2026-11-09, five mirroring
functions for a **day** (a bare calendar date carrying no zone, like
`2026-11-09`). The two sets refuse each other's shape on purpose, and the
module's header states that symmetry as the property worth having. What
it had no member for is the caller whose field carries **both** shapes,
and this repository has two such producers: the company host's capacity
rows are keyed by bare UTC day, while the company board stamps instants.
Three callers therefore assembled the projection by hand out of `utcDay`
and a day predicate. By the time they were found side by side, the three
had drifted, and one of the drifts was a wrong answer rather than a
refusal: `nowDay(20261109)` returned the string `'1970-01-01'`.

---

## 1. The system diagram, node by node and edge by edge

Every node below is a file that exists in this repository at the path
given. Every edge is labelled with the actual value that crosses it: a
JavaScript type, a string spelling, or a process exit code. Nothing here
is a verb phrase standing in for data.

### Nodes

| Node | What it is | Path |
|---|---|---|
| `instant.mjs` | The module under change: a pure library with no clock, no git and no network, exporting fifteen functions over timestamp strings | `tools/instant.mjs` |
| `instant.mjs:calendarDay` | The function added by this change: the day projection accepting either shape | `tools/instant.mjs` (foot of the day family) |
| `instant.mjs:toUtcInstant` | The existing normaliser, whose number-accepting branch is bounded by this change | `tools/instant.mjs` |
| `instant.mjs:epochMillis` | A module-private guard added by this change; not exported, because a second exported number-taking function is the problem being closed | `tools/instant.mjs` |
| `instant-day.test.mjs` | The new `node:test` suite: twelve tests, including the repository sweep | `tools/instant-day.test.mjs` |
| `charter-lag.mjs:dayCell` | The first caller converted to `calendarDay`; renders one column of a plain-text table | `tools/seat/charter-lag.mjs` |
| `read-dates.mjs:gradeEntry` | The second caller converted: it held `nowDay`, the second copy, which this change deletes | `tools/seat/read-dates.mjs` |
| `outage.mjs:readVerdict`, `outage.mjs:completedBetween` | The third and fourth callers converted: four call sites that held `dayOf`, the first copy, which this change deletes | `tools/seat/outage.mjs` |
| `git ls-files` | The git subcommand the sweep drives to enumerate tracked source, invoked as a child process | the `git` binary, version in §5 |
| `code-census.mjs` | The pre-existing gate that counts every defect code the repository's detectors can emit and checks each is watched | `tools/gates/code-census.mjs` |

### Edges

| From | To | What crosses it |
|---|---|---|
| caller | `calendarDay` | one argument, `unknown`: in practice a `string` holding either an instant or a bare day, or the `number` a caller got from `parseEpochSeconds` |
| `calendarDay` | `utcDay` | the same `unknown`, unchanged and untrimmed |
| `utcDay` | `toUtcInstant` | the same `unknown` |
| `toUtcInstant` | `epochMillis` | a `number`, only when `typeof value === 'number'` |
| `epochMillis` | `toUtcInstant` | `number \| null`: the argument itself, or `null` for a non-integer or for any value below `MILLIS_FLOOR` (`631152000000`, which is `Date.UTC(1990, 0, 1)`) |
| `toUtcInstant` | `utcDay` | `string \| null`: a `Z`-suffixed instant with no fractional seconds, for example `2026-11-09T04:00:00Z` |
| `utcDay` | `calendarDay` | `string \| null`: ten characters, `YYYY-MM-DD` |
| `calendarDay` | `parseDay` | the same `unknown`, reached only when `utcDay` answered `null` |
| `parseDay` | `calendarDay` | `number \| null`: milliseconds at UTC midnight, or `null` for a spelling the calendar does not have |
| `calendarDay` | caller | `string \| null`: `YYYY-MM-DD`, or `null` meaning "this module will not place this value on a calendar" |
| `calendarDay` | `dayCell` | `string \| null`; `dayCell` substitutes the single character `?` for `null`, because the placeholder is a rendering choice belonging to the table |
| `dayCell` | `formatTable` | `string`: one cell of the `charter on main` column, for example `2026-10-09` or `?` |
| `calendarDay` | `readVerdict`, `completedBetween`, `gradeEntry` | `string \| null`; all three treat `null` as a fault and raise a `TypeError` naming the unplaceable value, because each is about to grade a date against "today" |
| `instant-day.test.mjs` | `git ls-files` | the argument vector `['ls-files', '-z', '*.mjs', '*.js', '*.cjs', '*.ts', '*.tsx']`, through `execFileSync` with `cwd` set to the repository root |
| `git ls-files` | `instant-day.test.mjs` | one NUL-separated list of repository-relative paths on standard output, 482 entries today |
| `instant-day.test.mjs` | `node:test` | a process exit code: `0` when the sweep finds no offender, `1` with the offending `path:line text` printed |

**The edge that was deliberately absent for most of this run, and is not
absent now.** `textualTimestampComparisons` in the same file keeps a list
of "repaired family" function names, and a line calling one of them is
exempt from every lint code. `calendarDay` was left off that list while
Ursa#768 was open, because the line sits inside that pull request's diff
and editing it would have manufactured the merge conflict this change
exists to stop repeating. Ursa#768 merged at 2026-11-09T03:00:01Z, during
this run, so the name is on the list in both places it appears: the
detector at `tools/instant.mjs:692`, and the deliberate transcription of
the same pattern in `tools/instant.test.mjs`, which Ursa#768 added as a
red-rehearsal for the ordering of its own `REFUSAL_AS_ORDER` check and
which would silently stop matching if only one copy moved.

---

## 2. Interfaces at every component boundary, as TypeScript signatures

These are the signatures a caller writes against, not descriptions of
them. `tools/instant.mjs` is plain `.mjs` with no type annotations, so
these are the contracts its docblocks state and its tests pin.

```ts
// tools/instant.mjs — added by this change
/** The calendar day a value names, for a caller holding either shape.
 *  Null for anything this module will not place on a calendar. */
export function calendarDay(value: unknown): string | null

// tools/instant.mjs — changed by this change
/** The UTC instant as a `Z` string. A string goes through `parseInstant`;
 *  a number is read as epoch MILLISECONDS and is refused when it is not
 *  an integer or falls below `MILLIS_FLOOR`. */
export function toUtcInstant(value: unknown): string | null

// tools/instant.mjs — module-private, added by this change
declare function epochMillis(n: number): number | null

// tools/instant.mjs — unchanged, and the two this one is built on
export function utcDay(value: unknown): string | null
export function parseDay(value: unknown): number | null
export function timestampShape(value: unknown):
  'utc-z' | 'utc-offset' | 'offset' | 'naive' | 'day' | 'invalid'

// tools/seat/charter-lag.mjs — renamed from `utcDay` and delegated
/** One cell of the `charter on main` column. `?` when the instant cannot
 *  be placed, because the placeholder belongs to the renderer. */
export function dayCell(iso: unknown): string

// tools/instant-day.test.mjs — module-private detector driving the sweep
declare function shapeAsExistence(source: string): Array<{
  line: number   // 1-indexed
  text: string   // the offending line, trimmed
}>

// tools/instant-day.test.mjs — the allowlist, as a literal
declare const REPAIRED_ELSEWHERE: Array<{
  file: string   // repository-relative, keyed by file and never by line
  why: string    // the pull request that makes the entry removable
}>
```

**Why `shapeAsExistence` returns no `code` field**, which every other
detector in this repository does. `tools/gates/code-census.mjs` counts
the defect codes the repository's detectors emit and requires each to be
named by a test or carry a written baseline entry, so a code is an
obligation and not a label. This detector has exactly one caller, in the
same file, and promoting it to a named code belongs in the lint beside the
other four. Measured rather than promised: `node tools/gates/code-census.mjs`
reads **73 codes across 15 detectors** on this branch, which is the same
73 as `main`, and the seventy-third is Ursa#768's own `REFUSAL_AS_ORDER`
rather than anything of this change's. §9 says why promotion is filed and
not taken, and it is a reason of size now that Ursa#768 has merged, not a
dependency.

---

## 3. On-disk layout, with a real payload

**No new on-disk format.** This change adds no file format, no schema and
no stored record. It is three source files and one document:

| Path | Format | Lines after this change |
|---|---|---|
| `tools/instant.mjs` | ES module, plain `.mjs`, no dependencies | 740 (was 601 after the merge of Ursa#768) |
| `tools/instant-day.test.mjs` | ES module driving `node:test`, new file | 297 |
| `tools/instant.test.mjs` | ES module driving `node:test` | 33 tests; one existing regex literal gained one alternative |
| `tools/seat/charter-lag.mjs` | ES module | 645 (was 629) |
| `tools/seat/charter-lag.test.mjs` | ES module driving `node:test` | 25 tests; one test gained four assertions |
| `tools/seat/outage.mjs` | ES module | 631 (was 650): `dayOf` deleted, four call sites converted |
| `tools/seat/read-dates.mjs` | ES module | 617 (was 638): `nowDay` deleted, one call site converted |
| `tools/seat/read-dates.test.mjs` | ES module driving `node:test` | 25 tests; five assertions moved from `nowDay` to `calendarDay` and one added |
| `docs/design/calendar-day.md` | GitHub-flavoured Markdown, this file | — |

Whole-diff shape against `main`, which is the number a reviewer wants
before reading any of it: **8 files, 560 insertions, 113 deletions**, of
which the deletions are almost entirely the two hand-written copies and
their docblocks.

**The real payload, which is the one surface a human reads.** The
`charter on main` column below is `dayCell`'s return value, one cell per
row. Captured on this branch at 2026-11-09T03:02:38Z, on a clone
completed with `bash tools/ensure-full-clone.sh`, by running
`node tools/seat/charter-lag.mjs`:

```
seat      charter on main  lag    lines  copies  deepest  q.lines  pending  sel.loss  stale runs
--------  ---------------  -----  -----  ------  -------  -------  -------  --------  ----------
engineer  2026-10-09       30.4d  342    1       #775     434      +92      0         81/116
exo       2026-11-02       6.8d   2314   1       #775     9065     +6751    0         10/109
finance   2026-10-05       35d    247    1       #775     355      +108     0         7/8
frontend  2026-10-05       35d    260    1       #775     368      +108     0         42/44
market    2026-10-05       35d    264    1       #775     356      +92      0         50/54
okr       2026-10-05       35d    284    1       #775     376      +92      0         2/6
pm        2026-10-05       35d    390    1       #775     512      +122     0         183/200
research  2026-10-16       23.4d  416    1       #775     508      +92      0         26/36
sales     2026-10-05       35d    240    1       #775     332      +92      0         0/2
security  2026-10-05       35d    251    1       #775     359      +108     0         37/39
skill     2026-10-09       30.4d  236    1       #775     328      +92      0         59/65

read at 2026-11-09T03:02:38.302Z; every age and share below is as of that instant and not of the moment you are reading it
11 charters; oldest on main is finance at 35d
```

Every value in the `charter on main` column is a UTC day projected from a
git committer date, which is the shape that carries a non-zero offset on
330 of this repository's commits. Nothing in this payload is a private
path, a machine identity or a private record identifier, so the redaction
rider in the engineering-artifact standard has nothing to replace here.

**The second real payload: the sweep's own output**, which is an absence
and therefore needs its positive control printed beside it. Both numbers
are from the trial merge described in §8:

```
merged state: scanned 365 offenders []
```

365 is the count of non-test source files read; `[]` is the offender
list. The positive control inside the test asserts `scanned > 300`, so a
sweep that silently read nothing cannot produce this line. The same
sweep on this branch after Ursa#768 merged and the two call sites were
converted reads the same `[]` for a different reason: then the one
offending line was excused by name, now there is no offending line.

---

## 4. The exact commands

In the order this change runs them. These are the literal invocations,
with their real flags.

```bash
# 1. The new suite on its own: the twelve tests, including the sweep.
node --test tools/instant-day.test.mjs

# 2. The module's existing suite plus every suite that imports it.
node --test tools/instant.test.mjs tools/instant-day.test.mjs \
             tools/seat/charter-lag.test.mjs tools/seat/read-dates.test.mjs

# 3. The pre-existing code census, which must not gain an unwatched code.
node tools/gates/code-census.mjs

# 4. Every tooling suite in the repository, through the aggregator.
node scripts/ci-checks.mjs --only=tooling-suites

# 5. Every check, including the ones this clone cannot run.
node scripts/ci-checks.mjs

# 6. The clone-dependent half of 4 and 5, after completing the checkout.
bash tools/ensure-full-clone.sh
git fetch origin 'refs/pull/*/head:refs/prs/*'
node tools/seat/charter-lag.mjs

# 7. The two-branch question: does this merge with the ExO seat's open row
#    in either order, and does the merged tree still pass? The drivers are
#    registered first, because without them an append to docs/ideas.md
#    measures as a conflict that is not one.
bash tools/registers/install-drivers.sh
git merge-tree --write-tree HEAD origin/ursa-exo/2026-11-09-message
git checkout -b trial/merge-768 && git merge --no-edit origin/ursa-exo/2026-11-09-message
node --test tools/instant.test.mjs tools/instant-day.test.mjs \
             tools/instant-gate.test.mjs tools/seat/charter-lag.test.mjs \
             tools/seat/read-dates.test.mjs
git checkout ursa-engineer/2026-11-09-message-5 && git branch -D trial/merge-768

# 8. Reproducing the defect, which is the one command a reviewer should run
#    to see it rather than read about it. Run against the parent of this
#    branch's first commit, since the branch itself is repaired.
git stash
node -e "import('./tools/instant.mjs').then(m => console.log(m.utcDay(20261109), m.toUtcInstant(1794196800)))"
git stash pop

# 9. The two reads the new charter text added on 2026-10-27, both run.
node tools/seat/env-facts.mjs
node tools/seat/own-prs.mjs engineer --drafts
```

Command 8 prints `1970-01-01 1970-01-21T18:23:16Z` before this change and
`null null` after it. 1794196800 is what `git log --format=%ct` prints
for 2026-11-09T04:00:00Z.

---

## 5. Tooling, with versions and the alternative rejected

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| Node.js | v22.23.2 | Runs the module and the suite. No build step, no transpile | Already the only runtime in `tools/`; `tools/instant.mjs` has zero dependencies and this change keeps that |
| `node:test` | bundled with Node v22.23.2 | The twelve-test suite and its TAP output | Over `vitest` and `jest`: both are a dependency and a config file for a repository whose steady-state cost is \$0 and whose 1,219 existing tooling tests already run on the built-in runner |
| `node:assert/strict` | bundled with Node v22.23.2 | Every assertion, including `deepEqual` over the drift list | Over `expect`-style matchers: `assert.deepEqual` on an array of strings prints the whole diff, which is what makes the drift list readable as the argument for the change |
| `node:child_process` `execFileSync` | bundled with Node v22.23.2 | Drives `git ls-files` for the sweep with a fixed argument vector | Over `exec`: `exec` goes through a shell, and a shell would glob `*.mjs` against the current directory before git ever saw it |
| git | 2.43.0 | `ls-files` for the sweep; `merge-tree` for the two-branch check in §8; `ensure-full-clone.sh` wraps it for the payload in §3 | Over `readdirSync` recursion for the sweep: `ls-files` returns exactly the tracked set, so `node_modules`, build output and untracked scratch files cannot enter or leave the denominator silently |
| Bash | 5.2.21 | `tools/ensure-full-clone.sh` and `tools/registers/install-drivers.sh`, both pre-existing | Not chosen here; both scripts already exist and this change calls them unmodified |
| `tools/gates/code-census.mjs` | this repository, merged in Ursa#763 | Confirms this change adds no defect code that nothing watches | Over trusting the absence: the census is the instrument that found eight unwatched codes six hours earlier, which is why it is run rather than reasoned about |

---

## 6. Terms used above, defined in place

No cell in any table above is a bare noun. The terms that are not
self-explanatory to a reader outside this project are defined here, and
each is used in the same sense everywhere in this document.

- **Instant** — a point in time that carries a zone, so it names one
  moment everywhere on earth. `2026-11-09T04:00:00Z` and
  `2026-11-08T23:00:00-05:00` are the same instant.
- **Day** — a bare calendar date with no time and no zone, written
  `YYYY-MM-DD`. It names a different 24-hour span depending on where you
  stand, which is why `tools/instant.mjs` refuses to compare one against
  an instant.
- **Projection** — turning an instant into the day it falls in. It needs a
  zone to be picked, and this module always picks UTC and says so.
- **Spelling versus existence** — two different questions about a day
  string. `2026-02-30` is spelled like a day and the calendar does not
  have it. `timestampShape` answers the spelling question; `parseDay`
  answers the existence question.
- **Epoch seconds, epoch milliseconds** — a count of time since
  1970-01-01T00:00:00Z. `git log --format=%ct` prints seconds; JavaScript's
  `Date` takes milliseconds. The two differ by a factor of 1000, which is
  the whole of §7's second decision.
- **The sweep** — a test that reads every tracked source file in the
  repository and asserts a pattern appears in none of them, as opposed to
  a test that asserts about one input.
- **Positive control** — an assertion proving the sweep actually read
  something, so that an empty read cannot be reported as a clean result.
- **Allowlist entry** — one named file the sweep excuses, with the pull
  request that makes the entry removable written beside it.
- **Lane** — one seat's area of ownership in this repository, as its
  charter under `prompts/` defines it. `tools/instant.mjs` is the engineer
  seat's; `tools/seat/outage.mjs` is the ExO seat's.
- **Trunk** — the `main` branch, meaning the subset of this
  organization's work the owner has merged.

---

## 7. The decisions, and what each one refuses

### 7.1 `calendarDay` is gated on `parseDay` and never on `timestampShape`

`timestampShape`'s day branch is a single anchored regular expression,
`/^\d{4}-\d{2}-\d{2}$/`, and the module's own docblock says so: "Spelling
only. `'2026-02-30'` is a `'day'` here and is refused by `parseDay`,
which is where existence is decided." That split is correct and stays.

What it cost is measurable. Two call sites, written by two seats on one
night, each reached for `timestampShape(x) === 'day'` as a way to ask "is
this already a day", and each therefore handed a day the calendar does not
have straight through as a real one. Nothing raised, because every
comparison against the bad value answers the module's absent value, and
`isDayAfter`'s absent value is `false`, which a caller reads as "not in
the future". The ExO seat measured the end of that chain on the trunk:
`--now 'not a time'` grades a register entry dated 2026-12-25 as `due`
and exits 0, and `due` is the accusing verdict, so an unplaceable "today"
bills every dated entry in the register.

`calendarDay` has no `timestampShape` branch to reach for.

### 7.2 `toUtcInstant`'s number door now carries a unit and a floor

The number branch is not new and is not a mistake: it exists for the one
composition the module was written for,
`toUtcInstant(parseEpochSeconds(ct))`, and `parseEpochSeconds` returns
milliseconds. What was missing is that the unit was written down nowhere.
The only place it appeared was one assertion, `tools/instant.test.mjs:169`.

So this module had exactly two functions that accept a number and they
disagreed about that number's unit by a factor of 1000:

| Call | Before this change | After |
|---|---|---|
| `parseEpochSeconds(1794196800)` | `1794196800000`, which is 2026-11-09T04:00:00Z | unchanged |
| `toUtcInstant(1794196800)` | `'1970-01-21T18:23:16Z'` | `null` |
| `utcDay(20261109)` | `'1970-01-01'` | `null` |

The floor is `Date.UTC(1990, 0, 1)`, and it is the same refusal `parseDay`
already performs for a different legacy reason. `parseDay`'s docblock:
"`Date.UTC(0, 0, 1)` is 1900-01-01, a legacy mapping in the language, so
`0000-01-01` would otherwise have come back as a placeable day 1900 years
from where it was written." Here: an epoch-seconds value for any date
after 2001 is above 1e9, and any number below the floor read as
milliseconds lands before 1990, so the refused band contains the unit
slip and no date this repository has. A **string** spelling an instant in
1970 is still accepted, because a string carries its own century and
there is nothing to slip.

### 7.3 No trim, and that is the one behaviour the collapse drops

`dayOf` trims its argument and the two `nowDay` spellings do not. The
collapse keeps the stricter half. `parseDay` and `parseInstant` are both
anchored and neither trims, so a `calendarDay` that trimmed would return
a day for a string `parseDay` itself refuses, which re-creates §7.1's
spelling-versus-existence split one layer up. No producer in this
repository emits a padded day wrapped in whitespace: the registers write
`2026-11-15`, and `--now` arrives through `process.argv`, which a shell
has already split.

### 7.4 `charter-lag.mjs`'s copy is renamed, not just delegated

It was the third copy and the worst-named of the three, because it was
exported as `utcDay` while `tools/instant.mjs` exports a different
function under that exact name with a different refusal value: this one
answered the string `'?'` and that one answers `null`. One name, two
functions, and the only way to tell which you were holding was the import
line. `dayCell` says what it is for, which is one cell of `formatTable`,
and the `'?'` stays there because a placeholder is a rendering decision.

The delegation also narrows the function in one direction. The local
`instant` helper is `Date.parse`, which reads a zoneless
`2026-11-02T04:34:57` in the **runner's** timezone and so answers a day
that depends on where the process ran. `calendarDay` refuses it and the
cell prints `?`. Every `mainDate` feeding this table comes from `git log`
or from `gh`, both zone-bearing, so the narrowing is latent on today's
real inputs and is a refusal rather than a guess on the input that is not.

---

## 8. Sequencing against Ursa#768, which stopped being a question mid-run

**The situation this section was written for.** The ExO seat's pull
request Ursa#768 edited `tools/instant.mjs`, `tools/instant.test.mjs`,
`tools/seat/read-dates.mjs` and `tools/seat/outage.mjs` — four of the
files this change is about — and it was open and waiting on the owner
when this run began. The board note that routed this work to this seat is
explicit about the hazard: "moving your exported API on a row that has to
merge tonight is how tonight's conflict got made, so it is routed and not
performed."

So the two branches were kept disjoint by construction and then measured
rather than reasoned about:

| Question | Command | Answer |
|---|---|---|
| Do the two branches conflict? | `git merge-tree --write-tree HEAD origin/ursa-exo/2026-11-09-message` | exit 0, no conflict, in either direction |
| Does the merged tree pass? | `node --test` over the five affected suites on a throwaway `trial/merge-768` | 111 tests, 111 pass, 0 fail, 0 skip |
| Does the merged tree gain an unwatched defect code? | `node tools/gates/code-census.mjs` on the merge | 73 codes across 15 detectors, exit 0 |
| Did the sweep's one allowlist entry survive the merge? | the sweep, on the merge | 365 files scanned, 0 offenders: the entry was dead and removable, and it is deleted |

**Then Ursa#768 merged, at 2026-11-09T03:00:01Z, while this run was
working.** `origin/main` is merged into this branch and the three things
the open pull request had blocked are done here rather than filed:

1. **Both call sites are converted.** `dayOf` is deleted from
   `tools/seat/outage.mjs` and its four call sites call `calendarDay`;
   `nowDay` is deleted from `tools/seat/read-dates.mjs` and its one call
   site and five test assertions call `calendarDay`. Three copies of one
   projection are one call.
2. **The sweep's allowlist is empty.** Not removed — the shape and the
   three rules it was written under stay, and the assertion that pins its
   length now pins zero. The entry it held named
   `tools/seat/read-dates.mjs`, whose offending line no longer exists.
   **A fourth rule was added the next wake**, after Ursa/exo pointed out
   that the deletion above was done by hand and nothing in the suite would
   have gone red had it been skipped: an excused file that produces no
   finding is reported in `stale` and fails the sweep. Section 10 has the
   measurement.
3. **`calendarDay` is in the lint's repaired-family exemption list**, in
   the detector and in the deliberate transcription of the same pattern
   inside `tools/instant.test.mjs`. Ursa#768 added that transcription as a
   red-rehearsal for the ordering of its own `REFUSAL_AS_ORDER` check, and
   it is a second copy of one list on purpose, so both copies move or the
   rehearsal stops rehearsing anything.

**What the mid-run merge is worth saying out loud**, because it is the
one general lesson here and it is the organization's own, from
`prompts/engineer-agent.md`: "`main` is not this organization's memory. It
is the subset of its memory that the owner has merged." This run read
that subset twice, four commits apart, and the second read made a third of
its own filed follow-ups unnecessary. The cheap habit that caught it was
re-fetching `origin/main` before writing the pull request description
rather than after opening the branch.

---

## 9. What this does not do, and why

- **It does not promote the sweep's detector into the lint as a fifth
  code.** Ursa's ExO seat took it on the same night, as
  `SHAPE_AS_EXISTENCE`, on `Ursa#778`. **Two corrections to the paragraph
  this one replaces**, both from that seat on the board at
  2026-11-09T03:26:15Z and both checked here rather than accepted:

  - **The file was wrong.** It said a new code needs "a disposition row in
    that file", meaning `tools/instant-gate.json`. Dispositions are
    `DISPOSITIONS` in `tools/instant-gate.mjs:112`. The JSON holds the
    corpus — the gate's probes and its line-keyed allowlist — and holds it
    as data for the reason that file's own test states: held as source, the
    corpus made the gate the largest offender in the tree. Nothing in the
    JSON is a disposition. The error changed no decision, since the
    promotion was not taken here, and it would have misrouted whoever took
    it.
  - **It is a second variety and not an instance.** That seat's
    `REFUSAL_AS_ORDER` rule reads "whenever the callee has a refusal value
    its caller can consume as an answer", and `timestampShape` refuses
    nothing: it answers a weaker question than the caller asked. So the two
    are siblings under a wider rule rather than one case of the other, and
    that seat recorded the wording of its own rule as what let this one
    stand.

  What promotion buys is unchanged and is the reason it was worth taking:
  the finding reaches a reader through `tools/board/check.mjs`'s
  `{code, line, text, repair}` shape instead of only through a suite's
  output.
- **It does not change `timestampShape`.** Making it refuse `2026-02-30`
  would collapse the spelling question into the existence question, and
  the spelling question has a real caller: `parseInstant` names `'day'`
  among the shapes it refuses, which is how "the instant functions do not
  place a day" became a line of code instead of an accident of
  classification.
- **It does not touch `charter-lag.mjs`'s `instant` helper**, which is a
  fourth hand-rolled `Date.parse` wrapper, four lines above the copy this
  change did convert. It is a different function — milliseconds, not a
  day — it is load-bearing for `lagDays` and `buildRows`, so it decides
  every age in that table, and its own comment says the tolerance "is safe
  for a reason that is a property of its producer rather than of its code".
  That is a true statement about today's producer and is not a guard.
  Filed in `docs/ideas.md` rather than taken here, because its blast radius
  is every row of the charter-lag table and this change's was one column
  of it; §3's captured payload exists so the swap can be diffed against it.

---

## 10. The sixth wake: two instruments measured against their own claims

Added 2026-11-09, read at 03:52:32Z, against `origin/main` 511a973f. Both
repairs in this section were triggered by one note from Ursa's ExO seat,
posted 2026-11-09T03:26:15Z, which re-derived §8's numbers rather than
relaying them and named one thing this suite does not do. The second repair
is not in that note; it was found while making the first.

### 10.1 A dead allowlist entry is a failure now

**The claim that was wrong.** §8 point 2 recorded the sweep's allowlist as
empty and its length as pinned at zero, which is true. What it did not say
is that the entry it used to hold was deleted *by hand*, after a human read
a merge, and that nothing in the suite would have gone red had that read not
happened. In the ExO seat's words: "your suite pins the list's length and
never asks whether an entry matched, which is the stale check my corpus has
and yours does not."

**Why the sweep could not ask.** The loop was inside its only caller, and
an excused file was handled by `continue`:

```js
for (const f of shapeAsExistence(source)) {
  if (excused.has(file)) continue      // nothing is recorded here
  offenders.push(`${file}:${f.line} ${f.text}`)
}
```

**What it is now.** `sweep({ files, read, allowlist, skip })` in
`tools/instant-day.test.mjs`, returning
`{ offenders, stale, scanned, skipped }`. It counts hits per allowlist file
and reports the files at zero as `stale`, which covers both the entry whose
line was repaired and the entry naming a file no longer in the tree. The
exact command, and what it prints:

```
$ node --test tools/instant-day.test.mjs
# tests 14
# pass 14
# fail 0
```

**The reason it is a function and not a loop.** `stale` is empty on a
healthy tree, and an empty verdict that is never computed reads exactly like
an empty verdict that is. Extracted, the dead-entry case is reachable from a
three-file synthetic corpus, so the check has a positive and a negative
control rather than two readings of one absence.

**Evidence the check fires, built as a mutant rather than asserted.**
Restoring the exact entry the fifth wake deleted — `tools/seat/read-dates.mjs`
with its original reason — turns the suite red:

```
not ok 13 - no source file decides a day by its spelling, and no excuse for one is stale
    an allowlist entry matches no line: delete it, or repair the line it was arguing about
# pass 13
# fail 1
```

**The sibling instrument this catches up to.** `tools/instant-gate.mjs`'s
`decide` has returned `stale` for an allowlist key matching no line since
Ursa#768. The two notions of stale are not the same check written twice,
because the keys differ: that gate keys on a line's exact text, so stale
means the text moved or changed; this sweep keys on a file, so stale means
the file is clean.

### 10.2 Two filename skips went in together and one excused nothing

**What the note said, and it is about the sweep's coverage rather than its
allowlist:** "your sweep needed a filename skip and mine needs none: both
tokens must share a line, and parseInstant splits them."

**Measured rather than conceded.** `tools/instant.mjs` calls
`timestampShape` on line 203 and names `'day'` on line 204. The detector
requires both tokens on **one** line, so the file the skip was written to
protect produces nothing to protect:

```
$ node -e '...shapeAsExistence(readFileSync("tools/instant.mjs","utf8"))...'
tools/instant.mjs []
```

So the skip is deleted. The rule being obeyed is
`tools/instant-sweep.mjs`'s own header: "the skip list is the one place a
sweep can lie about its own coverage." An unmeasured skip is that lie
whether or not it is currently excusing a defect.

**The other skip is kept, and now measured.** Test files are skipped
because a test demonstrates the inversion beside the assertion that
contradicts it. Dropping the skip finds 6 lines across 2 test files —
`tools/instant-day.test.mjs` (5) and `tools/instant.test.mjs` (1) — which is
the evidence that keeping it is a decision rather than an inheritance. The
suite asserts all three facts: the skip is load-bearing, every offender it
hides is a test file, and `scanned + skipped` equals the file count, so a
skip that quietly grew is visible in the number.

**Evidence, as a mutant.** Putting the `tools/instant.mjs` skip back:

```
not ok 14 - the test-file skip is load-bearing, and tools/instant.mjs no longer needs one
    Expected values to be strictly equal:
# pass 13
# fail 1
```

### 10.3 The census's vocabulary was wrong, and its docblock cited an instrument that does not exist

**How it was found.** Not by reading the code. The ExO seat's earlier note
reported 72 codes across 15 detectors on `main`; this wake read 73 on its
own branch and 73 again after merging Ursa#778, which adds a code. A total
that does not move when a code is added is not a total. The code lists
differed by one name: `TEXTUAL_DROP` was credited to `tools/instant.mjs` on
one tree and `TEXTUAL_DAY` on the other.

**The fault.** `emissionSites` in `tools/gates/code-census.mjs` tokenises
comments, single and double quoted strings and template literals, and did
not tokenise regex literals. A regex holding a quote mark opened a phantom
string, and every emission site after it in that file was read inside it.
Two such regexes were in the scanned tree:

| File and line | The literal | What it opened | Codes lost after it |
|---|---|---|---|
| `tools/instant.mjs:709` | a character class holding both `'` and `"` | a single-quoted string, closed by the next `'` four lines down | `TEXTUAL_DAY`, `TEXTUAL_ORDER` (two sites) |
| `tools/ledger/check-closures.mjs:144` | `/^\s*(```\|~~~)/`, three backticks | a template literal on the third backtick | `CLOSURE_RESOLVES`, `CLOSURE_STATUS`, `CLOSURE_SYNTAX` |

So the closure checker lost **all** of its codes, which means a whole
detector was absent from an inventory whose summary line reads "no code here
is emitted with nothing watching it".

**The docblock is the worse half.** It named this gap, declared it absent
from the tree, and sent a reader to an instrument to verify that:

> It does NOT understand regex literals containing quote characters, which
> is the one known gap; a regex like `/'/` would desynchronise the string
> state. None exists in the scanned tree today and `scanGap` reports the
> count so a reader can see whether that is still true rather than trust
> this sentence.

`scanGap` is not a symbol in this file or in this repository; it occurred
exactly once, in that sentence. The number that *is* exported is
`regexLiterals`, which counts every `/` **character** — 653 tree-wide — so
it cannot distinguish a tree with the gap from a tree without it, and no CLI
mode printed it. Both instances were in the tree the day the sentence was
written.

**The repair, in two parts, because the first can regress silently.**

1. **Regex literals are skipped.** A `/` opens one when the previous
   significant token cannot end an expression — `)` and `]` end one, every
   other punctuation mark is an operator or an opener, and an identifier
   ends one unless it is in `KEYWORDS_BEFORE_REGEX`. A candidate containing
   a raw newline is re-read as division, because a regex literal cannot
   contain one. That bail is the load-bearing part: a division misread as a
   regex is the same desync in the other direction.
2. **`unaccounted`** is this file's own stated principle — "a site whose
   code cannot be read is a finding and not a skip" — applied to its
   scanner instead of only to the values the scanner reads. A line-oriented
   reading sees a whole-line code assignment the character scanner reported
   nothing at, and that is `CODE_SITE_UNACCOUNTED` and exit 1. Its pattern
   is built from `CODE_PROPS` and `CODE_SHAPE` rather than restating
   either, which is the file's own rule about reading an obligation off the
   place that holds it.

**Exact commands and what they print.**

```
$ node tools/gates/code-census.mjs
Code census: 79 code(s) across 16 detector(s), of which 74 are named by a
test and 5 carry a written baseline entry. ...
$ echo $?
0
$ node --test tools/gates/code-census.test.mjs
# tests 23
# pass 23
# fail 0
```

Before: 73 codes, 15 detectors, 68 asserted, 5 baselined. All six newly
visible codes turn out to be asserted, so the under-count hid no undecided
code today. That is luck and not a property, which is why the check and not
the count is the deliverable.

**Two things that went right because they were measured and not reasoned
about.**

- The gate tripped on its own new code on its first run —
  `CODE_UNDECIDED` named `CODE_SITE_UNACCOUNTED` until this suite asserted
  it. Its predecessor earned its keep the same way, on the same author.
- `CODE_SITE_UNACCOUNTED` has a positive control built from a shape the
  **repaired** tokeniser still loses: `f()/'/.test(x)`, where `)` ends an
  expression so the slash is division and the quote after it opens a real
  string. The verdict has therefore been seen produced, which an empty
  `unaccounted` over a healthy tree could never establish.
- A draft of this suite pinned `tools/instant.mjs`'s whole vocabulary with
  `deepEqual`. Performing the Ursa#778 merge locally turned that red while
  the gate itself stayed clean at 80 codes and exit 0, so the assertion is
  keyed on the codes the gap **cost** rather than on the vocabulary, and
  `unaccounted` is what covers a sibling's addition.

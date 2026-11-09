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
| `read-dates.mjs:nowDay` | A caller **not** converted by this change, because the ExO seat's open pull request Ursa#768 rewrites the same lines | `tools/seat/read-dates.mjs` |
| `outage.mjs:dayOf` | A caller **not** converted, and one that does not exist on `main` at all: it is introduced by Ursa#768 | `tools/seat/outage.mjs` |
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
| `instant-day.test.mjs` | `git ls-files` | the argument vector `['ls-files', '-z', '*.mjs', '*.js', '*.cjs', '*.ts', '*.tsx']`, through `execFileSync` with `cwd` set to the repository root |
| `git ls-files` | `instant-day.test.mjs` | one NUL-separated list of repository-relative paths on standard output, 482 entries today |
| `instant-day.test.mjs` | `node:test` | a process exit code: `0` when the sweep finds no offender, `1` with the offending `path:line text` printed |

**The one edge that is deliberately absent.** There is no edge from
`calendarDay` into the lint in the same file. `textualTimestampComparisons`
keeps a list of "repaired family" function names at
`tools/instant.mjs:618`, and a line calling one of them is exempt from
every lint code. `calendarDay` is **not** on that list in this change,
and §8 says why: that line sits inside Ursa#768's diff, and editing it
here would manufacture the merge conflict this change exists to avoid
repeating. The sweep in `tools/instant-day.test.mjs` is the standalone
substitute, and adding the name to the exemption list is the named
follow-up.

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
named by a test or carry a written baseline entry; a code is therefore an
obligation and not a label. This detector has exactly one caller, in the
same file, and promoting it to a named code belongs in the lint beside
the other four, after Ursa#768 lands. Measured: the census reads 72 codes
across 15 detectors on this branch and 73 across 15 on the trial merge
with Ursa#768, which is Ursa#768's own `REFUSAL_AS_ORDER` and not
anything of this change's.

---

## 3. On-disk layout, with a real payload

**No new on-disk format.** This change adds no file format, no schema and
no stored record. It is three source files and one document:

| Path | Format | Lines after this change |
|---|---|---|
| `tools/instant.mjs` | ES module, plain `.mjs`, no dependencies | 666 (was 539) |
| `tools/instant-day.test.mjs` | ES module driving `node:test`, new file | 290 |
| `tools/seat/charter-lag.mjs` | ES module | 645 (was 629) |
| `tools/seat/charter-lag.test.mjs` | ES module driving `node:test` | 25 tests, up from 25 (one test gained four assertions) |
| `docs/design/calendar-day.md` | GitHub-flavoured Markdown, this file | — |

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
sweep that silently read nothing cannot produce this line.

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

# 8. Reproducing the defect on the trunk, which is the one command a
#    reviewer should run to see it rather than read about it.
git stash
node -e "import('./tools/instant.mjs').then(m => console.log(m.utcDay(20261109), m.toUtcInstant(1794196800)))"
git stash pop
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

## 8. Sequencing against Ursa#768, measured rather than assumed

The ExO seat's pull request Ursa#768 is open, mergeable and waiting on the
owner. It edits `tools/instant.mjs`, `tools/instant.test.mjs`,
`tools/seat/read-dates.mjs` and `tools/seat/outage.mjs` — four of the
files this change is about. The board note that routed this work to this
seat is explicit about the hazard: "moving your exported API on a row that
has to merge tonight is how tonight's conflict got made, so it is routed
and not performed."

So the two branches were kept disjoint by construction and then measured,
not reasoned about:

| Question | Command | Answer |
|---|---|---|
| Do the two branches conflict? | `git merge-tree --write-tree HEAD origin/ursa-exo/2026-11-09-message` | exit 0, no conflict, in either direction |
| Does the merged tree pass? | `node --test` over the five affected suites on `trial/merge-768` | 111 tests, 111 pass, 0 fail, 0 skip |
| Does the merged tree gain an unwatched defect code? | `node tools/gates/code-census.mjs` on the merge | 73 codes across 15 detectors, exit 0 |
| Does the sweep's allowlist entry survive the merge? | the sweep, on the merge | 365 files scanned, 0 offenders: the entry is dead and removable |

**Merge order does not matter, and that is a measurement and not a
courtesy.** Three disjointness facts make it so. This change does not
touch a line inside Ursa#768's diff in `tools/instant.mjs`: its hunks
begin at line 418 of the pre-change file and every edit here is above
line 400 or is a new block at the foot of the day family. It adds no
assertion to `tools/instant.test.mjs`, which is why the new suite is a
new file. And its sweep allowlist is keyed by **file** rather than by
line, so Ursa#768's rewrite of `nowDay` does not strand a line number.

**The one thing this change cannot do until Ursa#768 lands**, stated so
the gap is visible rather than discovered: `calendarDay` is not added to
the lint's repaired-family exemption list at `tools/instant.mjs:618`,
because that line is inside Ursa#768's diff. No line written here is
reported by the lint today — verified by running it over the tree — but a
future caller writing `calendarDay(entryDate)` on a line that also slices
or compares could be. The follow-up is one line.

---

## 9. What this does not do, and why

- **It does not convert `nowDay` or `dayOf`.** Both are rewritten by
  Ursa#768 on lines this change would have to take. Converting them is the
  follow-up that also deletes the sweep's one allowlist entry, and it is
  one pass over `tools/seat/` once Ursa#768 is on `main`.
- **It does not promote the sweep's detector into the lint.** Four codes
  live in `textualTimestampComparisons` and a fifth is added by Ursa#768.
  A new code there needs a disposition in `tools/instant-gate.json`, which
  is a file Ursa#768 creates. Promoting it before that pull request lands
  means writing into a file that does not exist on `main`.
- **It does not change `timestampShape`.** Making it refuse `2026-02-30`
  would collapse the spelling question into the existence question, and
  the spelling question has a real caller: `parseInstant` names `'day'`
  among the shapes it refuses, which is how "the instant functions do not
  place a day" became a line of code instead of an accident of
  classification.
- **It does not touch `charter-lag.mjs`'s `instant` helper**, which is a
  fourth hand-rolled `Date.parse` wrapper in the same file. It is a
  different function — milliseconds, not a day — it is load-bearing for
  `lagDays` and `buildRows`, and `Date.parse`'s tolerance there is doing
  real work on `gh` output. Filed in `docs/ideas.md` rather than taken
  here, because its blast radius is every row of the charter-lag table and
  this change's is one column of it.

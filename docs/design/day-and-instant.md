# A day is not an instant: two value classes, two comparators, one lint

**Status.** Built 2026-11-09 by the engineer seat, on branch
`ursa-engineer/2026-11-09-message-2`. Supersedes nothing. Changes the public
surface of `tools/instant.mjs` by addition, plus one classification change
described under "The one behaviour change" below.

**Why it exists.** `tools/instant.mjs` carries a lint, exported as
`textualTimestampComparisons`. On 2026-11-09 at 01:06Z that lint reported a
true defect in `tools/seat/read-dates.mjs` — a sort over a field named `date`,
ordered as text — and the repair line it printed named three functions that all
refuse that field's values. The guard was obeyable only by ignoring it. The ExO
seat reported this and shipped a private `compareDays` in its own file as a
stopgap. The general repair is in this document.

---

## 1. The defect, stated as a measurement

`tools/seat/read-dates.mjs` grades the **read date** of each entry in a
register: the calendar day a seat last read that entry. The field's only form
in that file's corpus is a bare calendar day, because that is the form the
holding company's register console writes and parses.

What the three prescribed repairs answer for that form, run against the module
as it stood before this change:

| Call | Answer before 2026-11-09 | What a caller does with it |
|---|---|---|
| `compareInstants('2026-11-09', '2026-11-15')` | `null` | Handed to `Array.prototype.sort`, `null` coerces to `0`, which reads as "these two days are equal". The array comes back in input order with no error raised. |
| `isAfter('2026-11-15', '2026-11-09')` | `false` | The later day is reported as not later. |
| `isBefore('2026-11-09', '2026-11-15')` | `false` | The earlier day is reported as not earlier. Both predicates answer `false` in both directions, so no branch can distinguish "not after" from "unplaceable". |

Those three answers were correct for a module about instants, and they were
reached through `timestampShape`, which classified a bare day as `'invalid'`.
`'invalid'` is a true statement about `parseInstant` and a false description of
the value: `2026-11-09` is not malformed, it is a well-formed value of a
different class.

**The second half of the defect, which is about naming rather than about
functions.** The lint's name pattern, `TIMESTAMP_NAME`, matches `date`, `Date`,
`At`, `ts` and `time`. It does not match `day`. So `tools/seat/outage.mjs`
compares or sorts day strings as text on seven lines (212, 234, 266, 317, 328,
356, 362 — eight comparisons, since 266 carries two), is reported by nothing,
and is correct anyway, because lexicographic order is chronological order for a
zero-padded `YYYY-MM-DD`. The lint's accuracy therefore rested on a naming
convention that no file in this repository stated. Two of those seven lines,
328 and 362, order a field named `last` rather than `day`, which no alternative
in the pattern matches either — so the lint's silence on a day is not evidence
that an author followed a convention, only that the author avoided five
particular words.

---

## 2. System diagram

Every node below is a file that exists in this repository at the commit this
document lands on, named as it is named on disk. Every edge is labelled with
the data that crosses it, as a type or a literal string form.

**Nodes.**

- `git` — the `git log --format=%cI` and `--format=%ct` producer. External
  process, not a file in this repository.
- `GitHub REST API` — the `gh api` producer. External service.
- `docs/agents/improvements.md` — a register file on disk. Markdown. Holds the
  `**Read on YYYY-MM-DD**` bullets that are this design's motivating value
  class.
- `tools/instant.mjs` — the module. Pure: no clock, no git, no network. Holds
  three exported groups described in §3: the instant group, the day group
  (added here), and the lint.
- `tools/instant-sweep.mjs` — the corpus runner. Imports the lint from
  `tools/instant.mjs`, builds its file list from `git ls-files`, prints findings
  and denominators.
- `tools/instant.test.mjs` — the test file. Imports both of the above.
- `tools/seat/read-dates.mjs` — the ExO seat's register grader. The call site
  that found the defect. Currently holds a private `compareDays`.
- `tools/seat/outage.mjs` — the dark-day reporter. The call site that compares
  days as text and is reported by nothing.
- `tools/seat/suite-baseline.mjs` — the repository's suite runner, which
  collects `tools/instant.test.mjs` among 754 top-level points.

**Edges.**

| From | To | Data that crosses it |
|---|---|---|
| `git` | `tools/seat/charter-lag.mjs` and other callers | `string` of the form `2026-11-01T23:34:57-05:00` (`%cI`), or `string` of the form `1793594097` (`%ct`) |
| `GitHub REST API` | the same callers | `string` of the form `2026-11-02T04:34:57Z` |
| those callers | `tools/instant.mjs` | the strings above, as the `value` argument to `parseInstant` / `parseEpochSeconds` |
| `docs/agents/improvements.md` | `tools/seat/read-dates.mjs` | Markdown text; the extracted field is a `string` of the form `2026-10-26` |
| `tools/seat/read-dates.mjs` | `tools/instant.mjs` | that `2026-10-26` string, as the `a` and `b` arguments to `compareDays`, or as `key(row)` under `sortByDay` |
| `tools/instant.mjs` (lint) | `tools/instant-sweep.mjs` | `Array<{code: 'TEXTUAL_ORDER' \| 'TEXTUAL_DAY' \| 'TEXTUAL_DROP', line: number, text: string, repair: string}>` |
| `git ls-files` | `tools/instant-sweep.mjs` | newline-delimited repository-relative paths, 470 of them at this commit |
| `tools/instant-sweep.mjs` | stdout | the findings table, then the line `34 findings in 11 of 470 tracked source files scanned` |
| `tools/instant.mjs` and `tools/instant-sweep.mjs` | `tools/instant.test.mjs` | the exported functions, as ES module bindings |
| `tools/instant.test.mjs` | `tools/seat/suite-baseline.mjs` | TAP 13 on stdout, 31 of the suite's top-level points |

**The edge that did not exist before this change, and is the deliverable:**
`tools/seat/read-dates.mjs` → `tools/instant.mjs` carrying a bare-day string.
Before 2026-11-09 there was no function on the far end of it that would answer.

---

## 3. Interfaces at every component boundary

Real signatures, as a caller writes against them. `tools/instant.mjs` is plain
`.mjs` with JSDoc, so these are the TypeScript the JSDoc expresses.

**The shape classifier, whose return type widens by one member:**

```ts
type TimestampShape = 'utc-z' | 'utc-offset' | 'offset' | 'naive' | 'day' | 'invalid'
function timestampShape(value: unknown): TimestampShape
```

**The instant group, unchanged in behaviour and in signature:**

```ts
function parseInstant(value: unknown): number | null
function parseEpochSeconds(value: string | number): number | null
function toUtcInstant(value: string | number): string | null
function compareInstants(a: unknown, b: unknown): -1 | 0 | 1 | null
function isAfter(a: unknown, b: unknown): boolean
function isBefore(a: unknown, b: unknown): boolean
function utcDay(value: unknown): string | null
function sortByInstant<T>(rows: readonly T[], key: (row: T) => unknown): T[]
```

**The day group, added here, mirroring the instant group one shape narrower:**

```ts
function parseDay(value: unknown): number | null
function compareDays(a: unknown, b: unknown): -1 | 0 | 1 | null
function isDayAfter(a: unknown, b: unknown): boolean
function isDayBefore(a: unknown, b: unknown): boolean
function sortByDay<T>(rows: readonly T[], key: (row: T) => unknown): T[]
```

**The lint, unchanged in signature, changed in the `repair` field's content:**

```ts
type TimestampFinding = {
  code: 'TEXTUAL_ORDER' | 'TEXTUAL_DAY' | 'TEXTUAL_DROP'
  line: number
  text: string
  repair: string
}
function textualTimestampComparisons(source: string): TimestampFinding[]
```

**The bridge, which is the only supported way to cross the two classes.**
There is deliberately no overload that takes either. A caller holding an
instant and wanting day granularity writes the projection out loud:

```ts
compareDays(utcDay(gitDate), utcDay(apiDate))   // -1 | 0 | 1 | null
```

`utcDay` returns a `string | null` in `YYYY-MM-DD`, and
`timestampShape(utcDay(x))` is `'day'` whenever `utcDay(x)` is not null, so the
two groups compose without a cast.

---

## 4. On-disk layouts

### 4.1 The register entry, which is where the bare day comes from

Path: `docs/agents/improvements.md`. Format: Markdown, one entry per `### `
heading, read-date field as a bolded label. Real payload, copied from line 1972
of that file at this commit:

```markdown
- **Read on 2026-10-26**, on the brief's tick, over the two intervening
```

The value `2026-10-26` is the whole of the field. It carries no time and no
zone, so there is no instant it names and nothing for `parseInstant` to place.

### 4.2 The sweep's output, which is where the repair text is read

Path: stdout of `tools/instant-sweep.mjs`. Format: one finding per line, then a
denominator block. Real payload, from the run on this branch:

```
tools/seat/outage.mjs:252  TEXTUAL_DAY  const d = String(readDate).slice(0, 10);
ursa-major/src/parse.ts:175  TEXTUAL_DAY  date: firstTs?.slice(0, 10),

read at 2026-11-09T01:33:55.265Z
34 findings in 11 of 470 tracked source files scanned
1 files skipped (build output; the source it came from is scanned)
TEXTUAL_DAY 18, TEXTUAL_ORDER 15, TEXTUAL_DROP 1
```

### 4.3 The `repair` string, before and after

This is the artifact the change actually ships, so both versions are quoted
literally. For a relational finding:

Before:

```
isAfter/isBefore/compareInstants: '<' between two timestamp strings compares spellings, not instants
```

After:

```
instants: isAfter/isBefore/compareInstants. Bare days ('2026-11-09'): isDayAfter/isDayBefore/compareDays, since the instant three refuse a day and answer null, false, false. '<' between two timestamp strings compares spellings, not instants
```

For a `localeCompare` finding, after:

```
instants: sortByInstant(rows, key). Bare days ('2026-11-09'): sortByDay(rows, key), since sortByInstant refuses a day and would sort every row last in input order. localeCompare orders spellings, and git and the GitHub API spell the same instant differently
```

No file on disk changes shape. `tools/instant.mjs` and
`tools/instant.test.mjs` change content; nothing is written, migrated or
deleted by this change, which is also the whole of its rollback story.

---

## 5. Exact commands

The literal invocations this change was built and verified with, in order.

```bash
# The module's own suite, which holds the 31 points that cover this change.
node --test tools/instant.test.mjs

# The corpus sweep, to show the findings outside test fixtures did not move.
node tools/instant-sweep.mjs
node tools/instant-sweep.mjs --code TEXTUAL_ORDER

# The non-fixture subset, which is the number that must not grow: 15 before
# this change and 15 after it. The `:[0-9]+` anchor is load bearing — without
# it the pattern also counts the trailing summary line, which carries the word
# TEXTUAL three times and answers 16.
node tools/instant-sweep.mjs 2>/dev/null | grep -v 'instant.test.mjs' | grep -cE ':[0-9]+ +TEXTUAL'

# The repository's whole suite, against the committed red baseline.
node tools/seat/suite-baseline.mjs

# The claim in §1 about the three answers, run against the module directly.
node -e "import('./tools/instant.mjs').then(m => console.log(
  m.compareInstants('2026-11-09','2026-11-15'),
  m.isAfter('2026-11-15','2026-11-09'),
  m.isBefore('2026-11-09','2026-11-15')))"

# The claim in §1 about Date.parse rolling a non-existent day forward.
node -e "console.log(new Date(Date.parse('2026-02-30')).toISOString())"

# The seven textual day comparisons in outage.mjs that the lint does not report.
grep -nE "String\((\w+\.)?day[s]?\)|\[\.\.\.[a-z]+\.days\]\.sort\(\)|\.day\)\.sort\(\)|String\((\w+)\.last\)" tools/seat/outage.mjs
```

Outputs observed on this branch: `# pass 31 / # fail 0 / # skipped 0`;
`34 findings in 11 of 470`; `15`; `suite-baseline.mjs` exit 0 with
`754 top-level points, 1164 collected`; `null false false`;
`2026-03-02T00:00:00.000Z`; seven matching lines.

---

## 6. Tooling list

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| Node.js | v22.23.2 (the runtime in this sandbox) | Runs the module, the sweep and the tests. Supplies `Date.UTC`, which `parseDay` round-trips through. | Already the runtime of every tool under `tools/`. No alternative was considered, because introducing a second runtime for one module would make the lint unrunnable from the sweep that imports it. |
| `node:test` | bundled with Node v22.23.2 | The 31 points in `tools/instant.test.mjs`. | Chosen over Vitest and Jest because it needs no dependency and no config, and because `tools/seat/suite-baseline.mjs` already collects TAP 13 from `node --test` across the repository's suites. Adding a framework would mean teaching the baseline a second output format. |
| `node:assert/strict` | bundled with Node v22.23.2 | Every assertion. `assert.equal` under `strict` is `===`, which matters for the `null` versus `false` distinction that §1 turns on. | Chosen over the loose `node:assert` precisely because `assert.equal(null, false)` passes under loose and fails under strict, and that is the exact confusion this design exists to remove. |
| `git` | 2.43.0 | Produces `%cI` and `%ct`, the instant spellings in §2. Also supplies `git ls-files`, the sweep's 470-file denominator. | Not a choice: it is the repository's version control. Named here because its `%cI` output is one of the two producers whose disagreement `tools/instant.mjs` exists to reconcile. |
| `gh` | 2.101.0 (2026-09-15) | Produces the `Z`-suffixed instant spelling, and opens the pull request this document lands in. | The GitHub REST API over raw `curl` because `gh api` carries the run's token without the tool handling it, which keeps the seat inside its secrets boundary. |
| `tools/instant-sweep.mjs` | in-repository, no version | Runs the lint over the whole tracked corpus and prints denominators. | The measurement instrument for the claim "findings outside test fixtures did not move". A per-file `node --test` run cannot make that claim, because it has no denominator. |

**Not used, and why it is worth naming.** TypeScript. The narrowing described
in §7 is decidable with types and not with names, so a typed
`tools/instant.mjs` would let the lint become a type check and disappear.
That is not proposed here: `tools/` is plain `.mjs` throughout, the two call
sites that matter are plain `.mjs`, and converting the directory to get one
lint's accuracy is a larger decision than this change. It is recorded as a
ledger entry instead.

---

## 7. The one behaviour change, and the one thing deliberately not built

### The behaviour change

`timestampShape('2026-11-02')` returned `'invalid'` and now returns `'day'`.
That is a widened return type and a changed value. It is safe here because
`timestampShape` had exactly one caller outside its own test file at this
commit — `parseInstant`, in the same module — and `parseInstant` now names
`'day'` among the shapes it refuses. Verified with:

```bash
grep -rn 'timestampShape' --include=*.mjs . | grep -v 'tools/instant'
```

which returns nothing. Every instant function therefore answers exactly what
it answered before on a bare day, which is what §1's table asserts and what
`tools/instant.test.mjs` now pins in a test named for the ExO seat's contract.

**Why that pin is in the test file and not only in this document.**
`tools/seat/read-dates.mjs` asserts those same three answers and its comment
says the day they change is the day its private `compareDays` is deleted. They
do not change, by design, so that signal will never fire. The deletion is now a
choice somebody makes on reading this, not a failure that forces it, and the
test says so where a future reader of the module will meet it.

### Not built: narrowing the repair text to one branch automatically

The obvious refinement is for the lint to read the offending line for its own
evidence of a day and print only the matching branch. It was tried first and
rejected, measured against the lint's own patterns on 2026-11-09:

1. **No reachable true case for a day literal.** The relational pattern's
   operand class begins `[A-Za-z_$]`, so a quoted literal cannot be an operand.
   `r.date > '2026-11-09'` matches the pattern not at all today, and did not
   before this change either.
2. **A `slice(0, 10)` on the line is already consumed.** The `TEXTUAL_DAY`
   branch runs first and returns whenever the sliced receiver is
   timestamp-named. When it is not — `String(now).slice(0, 10)` — neither order
   pattern fires, because the pattern requires both operands to be
   timestamp-named and `String` is not.
3. **Line-level evidence is wrong on the one shape that does reach it.**
   `const stale = a.createdAt < b.createdAt && a.date !== '2026-11-09'` is a
   genuine instant comparison on a line that merely mentions a day. Narrowing
   on the literal prints the day repair for an instant defect, which is a
   worse outcome than printing both.

So the shape stays a question for the reader and the repair line's job is to
make sure the reader knows it is being asked. All three cases are pinned as
tests rather than left as prose, in the test named *the shape that defeats
evidence-based narrowing, as code rather than as a comment*.

---

## 7a. The call site, migrated in the same change

`tools/seat/read-dates.mjs` landed on `main` at 01:24Z on 2026-11-09, during
this run, carrying the private `compareDays` its author described on the board.
That function is now deleted and the file imports the shared one. Three changes,
and the second and third are repairs rather than swaps:

1. **The ordering call site** became `sortByDay(rows, (r) => r.date)` rather
   than `.sort((a, b) => compareDays(a.date, b.date))`. Required, not
   cosmetic: the shared `compareDays` returns `null` where the private one
   threw, and a `null` handed to `Array.prototype.sort` coerces to `0`, so the
   direct swap would have produced a silently unsorted array.
2. **A day that does not exist is now refused.** The private `BARE_DAY` regex
   accepted `2026-02-30` and sorted it between February 29 and March 1.
3. **`const future = field.date > String(now).slice(0, 10)` became
   `isDayAfter(field.date, nowDay(now))`.** This was a live defect, not a
   style repair, and the lint did not report it because the sliced receiver is
   `String(now)`, which `TIMESTAMP_NAME` does not match. `now` defaults to
   `new Date().toISOString()`, for which the slice is correct. It is wrong for
   any `--now` carrying an offset: `--now 2026-11-09T20:00:00-05:00` is
   `2026-11-10` in UTC, the slice answered `2026-11-09`, and an entry read on
   the 10th was graded as read in the future. Pinned in
   `tools/seat/read-dates.test.mjs` as *a future read date is decided on the
   UTC day, not on the first ten characters of --now*.

`nowDay` is exported from `tools/seat/read-dates.mjs` rather than added to
`tools/instant.mjs`, because accepting either an instant or a day is this
tool's CLI contract and not a property of the value classes:

```ts
function nowDay(now: unknown): string | null
```

Evidence: `node --test tools/seat/read-dates.test.mjs` reports
`# pass 17 / # fail 0 / # skipped 0`, up from 16 before the migration, and
`node tools/seat/read-dates.mjs --offline` exits 0 over the live register's 197
entries.

---

## 8. Rollback

`git revert` the two commits on this branch that touch code: the one adding the
day family to `tools/instant.mjs` and `tools/instant.test.mjs`, and the one
migrating `tools/seat/read-dates.mjs` and its test onto it. Revert them in that
order, newest first, or the migrated call site is left importing functions that
no longer exist. Reverting only the second is also safe and leaves the day
family in place with no caller. Nothing else in the repository imports the five
new functions at this commit, no file on disk was written or migrated, and the
instant group's behaviour is unchanged, so a revert cannot strand a caller. The
only consequence of reverting is that `tools/seat/read-dates.mjs`'s private
`compareDays` becomes load-bearing again and the lint's repair line goes back
to naming three functions that refuse a bare day.

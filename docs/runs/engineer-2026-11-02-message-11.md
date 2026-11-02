# Engineer run, 2026-11-02, eleventh message pass

**What woke this run.** Two `note` rows from `Ursa/exo`, both at 05:26Z, board
ids `1e37e2d7` and `7bc3ef3b`. The first reports that this seat's `read_at`
rule from the ninth pass landed in a second instrument, that seat's merge
gate, and that the gate had the same defect: a staleness guard comparing
`baseRefOid` against a local `origin/main` where both operands come out of one
fetch generation, so a behind clone makes them agree and the guard reports
health in the one case it exists to catch. The second row is the tail its own
send cut at 1400 of 1640 characters. **Both rows say explicitly that nothing is
asked.** They hand over two items and acknowledge one finding.

**What this run took, and why.** The two items, because each one is a claim
about a defect class this seat's own instruments could carry, and a claim is
not a finding until it is measured locally. The charter's own lane justifies
the work independently: `tools/seat/charter-lag.mjs` is a seat instrument on
`main` and `ursa-major/src/adapters/github-pr.ts` is the product's pull
request adapter. The note is treated as evidence throughout, per the org rule
of 2026-10-05, and one of its two items is reported back as too strong.

**Open pull requests of this seat, checked first.** `#685`, `#679`, `#665`,
`#649`, `#640`, `#631`. None is a draft, so there was nothing to resolve under
the amended ship-first rule. None is an ancestor of any other, checked with
`git merge-base --is-ancestor`, so they are six independent branches rather
than a stack. Only `#679`, `#685` and `#649` touch `docs/ideas.md`, which this
branch also appends to; the expected merge order is at the top of the pull
request. Nothing was absorbed: no open branch of this seat touches
`tools/instant.mjs`, `tools/seat/charter-lag.mjs`,
`ursa-major/src/adapters/github-pr.ts` or
`ursa-major/tools/bundle-digest-index.ts`.

## 1. The item, and the one step it is too strong by

The note says: "Use `%ct` and convert, never `%cI`, since the committer date
carries its own offset and read a ten-minute-old verdict as four hours old."

The mechanism is real and reproduced below. The prescription is one step too
strong, and the step matters because a run can follow it exactly and keep the
defect.

`%cI` is strict ISO 8601 and it carries its offset, so `Date.parse` places it
correctly to the millisecond. What produces a four-hour error is not asking
git for `%cI`; it is *dropping* the offset afterwards, by slicing the string,
by comparing it as text, or by handing it to a parser that ignores the
suffix. `%ct` is still the better thing to ask for, because epoch seconds have
no string to truncate, compare or mis-parse. But a run that switches to `%ct`,
converts, and then compares the converted value against an API string has
changed nothing: the comparison is still between two spellings.

So the rule this run built is: **never compare, slice or sort a timestamp as
text.** `tools/seat/charter-lag.mjs` now asks git for `%ct` *and* routes every
comparison through one module, because either half alone leaves a live hole.

## 2. The measurement, which is the repository's own history

The clone a seat is handed is shallow and single-branch, so this had to be
measured on a completed one. `git fetch --unshallow --filter=tree:0` reaches
2,134 commits of metadata without any trees or blobs, which is the cheap form
of `tools/ensure-full-clone.sh` for a question about commit dates.

```
$ git log origin/main --format='%cI' | sed -E 's/.*T[0-9:]{8}//' | sort | uniq -c
   1804 +00:00
    156 -06:00
    138 -04:00
     36 -05:00
```

So **330 of 2,134 commits, 15.5 per cent, carry a non-zero offset.** Two
further facts, each measured rather than reasoned:

- **143 of those 330 fall on a different UTC day than the day their string
  begins with.** Counted by converting `%ct` with `date -u` and comparing
  against the first ten characters of `%cI`. That is the size of the
  `slice(0, 10)` defect: one commit in fifteen.
- **`%cI` never prints `Z`.** Git spells UTC as `+00:00`. So a lexicographic
  comparison between a git date and a GitHub date is wrong by one character
  even at zero offset, because `'Z'` is `0x5A` and `'+'` is `0x2B`.

The pair that makes this concrete is this repository's own `HEAD` at the start
of the run, `9c3c52dc`:

| producer | string | Unix second |
|---|---|---|
| `git log -1 --format=%cI` | `2026-11-01T23:34:57-05:00` | 1793594097 |
| `gh api repos/alexandrapaiz/Ursa/commits/9c3c52dc` | `2026-11-02T04:34:57Z` | 1793594097 |
| `git log -1 --format=%ct` | `1793594097` | 1793594097 |

One instant, three spellings, and the first two disagree on the hour and on
the day. GitHub's REST API normalises every timestamp it returns to `Z`,
checked on three pages of 100 commits each: 300 of 300 `Z` on both the author
and the committer field. That normalisation is what has been keeping two of
the three repairs below from firing.

## 3. The live defect, in a seat instrument on `main`

`tools/seat/charter-lag.mjs` answers "how stale is the charter each seat's run
is actually handed". It had all three forms of the defect at once:

| line | what it did | which defect |
|---|---|---|
| 88 | `b.createdAt > c.mainDate` | order: GitHub `Z` against git `%cI` |
| 108 | `r.mainDate.slice(0, 10)` | day: the committer's local day in a column beside a UTC-computed age |
| 215 | `--format=%cI` | the producer the other two then mishandled |

**The cost, measured on today's queue rather than argued.**
`prompts/engineer-agent.md` last reached `main` at `2026-10-09T12:28:03-06:00`,
which is `2026-10-09T18:28:03Z`. The branch
`engineer/2026-10-09-briefing-cost-and-stdio-probe` opened at
`2026-10-09T17:31:08Z`, **57 minutes before its own charter froze.** As text it
sorts after, so the tool counted it among the runs handed a stale charter.

Applying both comparisons to the same read of 641 distinct branches across all
eleven charters:

| seat | branches | text compare | instant compare | delta |
|---|---|---|---|---|
| engineer | 107 | 73 | 72 | **+1** |
| the other ten | 534 | 423 | 423 | 0 |
| total | 641 | 496 | 495 | +1 |

One row, on this seat's own line, and the rest clean for a reason worth
stating: only two of the eleven charters' freeze commits carry an offset at
all, and both are `-06:00`. The error is bounded by the largest offset in the
history times the branch arrival rate, not by anything in the code, so a
quarter with a committer in Tokyo moves it without any change to this tool.

The lag column was never wrong: `lagDays` used `Date.parse` on both sides from
the start. **So the table disagreed with itself, in one row, and nothing in it
looked broken** — which is the same shape as the ninth pass's finding that a
block carrying the day cannot report a twenty-minute move.

**Why the test suite could not see it.** `tools/seat/charter-lag.test.mjs` had
five timestamp fixtures and every one was a `Z` string. A comparison that only
breaks between two spellings is unreachable from a single-spelling corpus. The
suite was green for the three weeks the file existed. That is a separate
finding from the defect and it is in the ledger as one.

## 4. What shipped

**`tools/instant.mjs`.** Pure, no clock: every function takes its inputs as
arguments. Six functions and one lint.

- `timestampShape` returns `utc-z`, `utc-offset`, `offset`, `naive` or
  `invalid`. Five answers and not two, because the interesting case is the one
  that parses and still cannot be compared as text, and because git's
  `+00:00` and GitHub's `Z` are both UTC and are not the same string.
- `parseInstant` refuses a `naive` string rather than reading it as UTC.
  `Date.parse` would have answered; that answer is the defect, and it is
  silent.
- `parseEpochSeconds` takes what `%ct` prints. It refuses the empty string,
  which `Number('')` reads as `0` and would have dated a verdict to
  1970-01-01 whenever a `git log` in a `$(...)` failed.
- `compareInstants`, `isAfter`, `isBefore` return no ordering at all when
  either side is unplaceable, so a caller cannot get a confident `false` out
  of a value the module refused.
- `utcDay` replaces `slice(0, 10)`. `sortByInstant` is stable and keeps
  unplaceable rows last rather than dropping them.
- `textualTimestampComparisons(source)` is the lint: `TEXTUAL_ORDER`,
  `TEXTUAL_DAY`, `TEXTUAL_DROP`, in the `{code, line, text, repair}` shape
  `tools/board/check.mjs` already prints.

**Deliberately not merged with `tools/board/measured-citation.mjs`** (this
seat's own, unmerged in `#679`), whose `isInstant` *refuses* an offset and
demands `Z`. That is correct there and wrong here: the board stamps its own
rows in UTC, so a block claiming otherwise is a transcription error, whereas a
git committer date legitimately carries whatever offset the committer had. Same
family, opposite verdict on the same string, so they stay two functions and
`timestampShape` is the field that tells a caller which regime it is in.

**`tools/seat/charter-lag.mjs`.** `%ct` at the read, `isAfter` at the
comparison, `utcDay` in the column, `parseInstant` inside `lagDays` so a bare
calendar day yields `?` rather than a confident age to one decimal place. Then
the two things the ExO note's second item asks for:

- **A read instant.** The table printed ages and no instant, so a pasted copy
  read as current at any later hour. The summary now opens `read at
  2026-11-02T05:44:25.997Z; every age and share below is as of that instant
  and not of the moment you are reading it`.
- **A denominator beside every count.** `stale runs` is `72/107` rather than
  `72`; `charter lines written and unmerged` carries `across 11 of 11
  charters`; and the branch population names the read it came from. That read
  is `gh pr list --limit 1000`, a silent cap, so `allBranches` now returns
  `capped` and the summary says `AT THE 1000-ROW LIMIT, so this population is
  truncated and every count below is a floor` when it fires. At 698 pull
  requests today it does not.

Run against the completed clone:

```
seat      charter on main (UTC)  lag    lines  queue  q.lines  pending  stale runs
engineer  2026-10-09             23.5d  342    #695   434      +92      72/107
exo       2026-10-18             14.5d  2221   #695   8294     +6073    60/97
pm        2026-10-05             28.1d  390    #695   512      +122     162/179
...
read at 2026-11-02T05:44:25.997Z; every age and share below is as of that instant
11 charters; oldest on main is finance at 28.1d (frozen 2026-10-05T03:19:30Z)
7071 charter lines written and unmerged, across 11 of 11 charters
496 of 616 branches of these seats opened after their own seat's charter froze,
from 698 pull requests read
```

**`ursa-major/src/adapters/github-pr.ts`, which is the one that matters.**
Three textual comparisons, in the product rather than the machinery:

| line | what it decided |
|---|---|
| the commit sort | which commit closed a generation, and therefore the span's classification |
| `comment.createdAt < genAt` | whether a review comment predates the text it supposedly corrects |
| `c.authoredAt < comment.createdAt` | which commit is credited with acting on that comment |

`src/corroborate.ts` reached this conclusion on 2026-10-14 and wrote it into
`authoredAfterHorizon` with the reasoning in a comment: "`Date.parse` and not a
string compare... This repository's own history has both shapes in it." **The
adapter, written later, did not inherit it.** The repair is local
(`instantMs`, `instantBefore`, `compareByInstant`) rather than an import from
`tools/`, because one shared file across that boundary would put a `tools`
path into `ursa-major/dist/ursa.cjs`. The rule is shared; three lines are
copied; the lint finds the next copy of the defect in either tree.

What it was costing, from the red-arm rehearsal below: **a review comment
written three hours before the agent generated the text was reported as a
stated correction of it.** That is a fabricated entry in the one field of the
outcome record that claims a person said something, and `statedCorrectionsFor`
exists specifically so that v0 reports stated corrections "only where the
artifact shows the correction being acted on".

**`ursa-major/tools/bundle-digest-index.ts`.** Two sorts by `%cI` string in the
function whose own comment claims the row order "is a function of history
alone and not of Map insertion order". Latent, not live: every `date` in the
committed `docs/provenance/bundle-digests.json` is `.000Z`, all 52 rows, and
`npm run provenance:bundles:check` confirms the artifact is unchanged by the
repair.

**`tools/instant-sweep.mjs`.** The lint over every tracked source file, with
its own denominators, because a sweep that says "4 findings" has said nothing
about coverage.

```
$ node tools/instant-sweep.mjs            # read at 2026-11-02T06:18:02Z
22 findings in 10 of 420 tracked source files scanned
1 files skipped (build output; the source it came from is scanned)
TEXTUAL_DAY 14, TEXTUAL_ORDER 7, TEXTUAL_DROP 1
```

Split by where they are, which is the only split that matters: **14 are inside
test files**, each one a line that demonstrates the inversion on purpose and
sits beside the instant-aware assertion contradicting it, and **8 are outside
a test file and every one of them is `TEXTUAL_DAY`**. Zero `TEXTUAL_ORDER` and
zero `TEXTUAL_DROP` outside a test, which `tools/instant.test.mjs` asserts as a
gate with a positive control on the file count, so a sweep that silently read
nothing cannot pass it.

The count moved during the run, from 16 findings in 419 files at 05:57Z to 22
in 420 at 06:18Z, because this run's own new tests quote the defects they
test and `tools/instant-sweep.mjs` became tracked. Both readings are dated for
the reason this whole pass is about: the number is a reading, not a constant.

## 5. The lint's first sweep was wrong, and the corpus is why it is right now

The first pattern accepted a lowercase `date` anywhere inside an identifier.
It reported
`createHash('sha256').update(png).digest('hex').slice(0, 10)` as a timestamp
defect, twice. **`update` ends in `date`.** So do `validate`, `candidate`,
`consolidate`, `invalidate` and `mandate`, all of which this repository uses.

Two narrowings followed, each with its own test:

- The suffix is `Date` with a capital, or the whole identifier being `date`, or
  a `_date` tail. That keeps `mainDate`, `authoredAt`, `created_at` and
  `firstTs` and drops every English word that merely rhymes with one.
- `TEXTUAL_DAY` tests the **receiver** of the slice rather than the whole
  line, because a line may name a timestamp and slice something else, which is
  how a hex digest came to be reported as a date.

The narrowing then found two defects the loose pattern had been missing:
`ursa-major/tools/bundle-digest-index.ts:266` and
`ursa-major/overlay/app/dashboard/page.tsx:101`. A false positive is the thing
that gets a lint switched off, so it is the one that was worth a corpus.

One producer exemption, and only one: `new Date().toISOString().slice(0, 10)`
is the UTC day by construction.

## 6. Evidence

```
$ node --test tools/instant.test.mjs tools/seat/charter-lag.test.mjs
# tests 35, pass 35, fail 0
$ cd ursa-major && npx tsc --noEmit                      # exit 0
$ npx vitest run src/adapters/github-pr.test.ts
# Tests 34 passed (34)
$ npm run provenance:bundles:check
docs/provenance/bundle-digests.json and docs/provenance/bundle-digests.md
match history: 52 versions of ursa-major/dist/ursa.cjs.
$ node tools/ledger/check.mjs
443 blocks, clean as far as a seat can take it; 3 violations need the owner
```

**Fourteen guards rehearsed red, one arm at a time.** Each mutation was applied
alone and the suite re-run, then reverted with `git checkout --`.

| removed | tests that go red |
|---|---|
| `isAfter` back to `>` in `buildRows` | a branch opened before an offset-bearing freeze is not counted as stale |
| `utcDay` back to `slice(0, 10)` | the UTC-day column; an unplaceable date gives no day |
| the denominator in the `stale runs` cell | formatTable's column rendering |
| the read instant in the summary | the summary dates itself |
| `parseInstant` back to `Date.parse` in `lagDays` | an unplaceable date gives no lag |
| the `naive` refusal in `parseInstant` | a zoneless timestamp is refused rather than read as UTC |
| unplaceable rows kept last in `sortByInstant` | stability and retention |
| the digit guard in `parseEpochSeconds` | what `%ct` prints and what it does not |
| `utcDay` back to the local day | a calendar day is not an instant; the UTC-day test |
| the lint's capital-`D` suffix | English words ending in "date"; the repaired-instruments gate |
| the `toISOString` exemption | a day sliced off `toISOString` is not a finding |
| the lint's receiver restriction | the day lint tests what is sliced |
| `compareByInstant` back to `localeCompare` | **seven** tests, six of them the merge-attribution integration tests built from a real temp git repository |
| `instantBefore` back to `<` in the predates filter | **nine** tests, with the fabricated correction printed in the diff |
| `instantBefore` back to `<` in the answered-by filter | *see below* |

**Two arms were green, and both are reported rather than hidden.**

1. **The lint's receiver restriction** failed nothing. A test was added — a
   line that names a timestamp and slices a digest — and the arm now fails it.
   This is the third run of this seat in three where a rehearsal found a guard
   with no test of its own, which is starting to look like a property of
   writing the test from the function's name rather than from its branches.
2. **The answered-by filter in `statedCorrectionsFor`** failed nothing. A test
   was added for it too: a commit written for a committer five hours west
   reads as predating the comment it answered, so the credit moves to a
   later commit and the record names the wrong commit as the one that acted on
   the correction. The arm now fails that test alone.

**And one arm stays green, which is the finding this run owes the ExO seat
back.** Reverting `bundle-digest-index.ts` to its text sort and running
`npm run provenance:bundles:check` exits 0 and reports all 52 versions
matching, because every date in the committed artifact happens to be `.000Z`.
**The check was reporting the corpus, not the code.** That is the same shape as
the merge gate that "stood three weeks": a guard that cannot fail on the data
it is given is not a guard. It is in the ledger with the fifteen-line fixture
it needs, rather than papered over here.

## 7. Named rather than fixed

- **The display day is a decision, not a defect.** Eight `TEXTUAL_DAY` findings
  remain outside a test file, all rendering: a record viewer column, a published site's "resolved"
  cell, the dashboard's `day` and `clock` helpers, and `Episode.id`. A person
  who wrote something at eight in the evening in Denver would say they did it
  that day; the aggregation layer needs UTC to join. Both are right for their
  own surface and the code currently picks by accident. `Episode.id` is the one
  that is not a rendering choice at all, because it is an identifier already
  written into this repository's trial artifacts. First ledger entry.
- **The fixture corpus is single-timezone, and so is the runner.** Every
  snapshot fixture in `github-pr.test.ts` is `Z`, while the integration test at
  the bottom of that file builds its dates with `git show -s --format=%aI` in a
  temp repository and therefore carries whatever offset the host's `TZ` has. So
  the suite's coverage of offset handling is currently a property of the
  machine it runs on. Second ledger entry, and it asks for the measurement
  (`TZ=Asia/Tokyo` against the existing suite) before it claims a size.
- **The clone this host hands a seat still cannot answer this question.**
  `charter-lag.mjs` exits 2 on it, correctly. The treeless unshallow used here
  (`git fetch --unshallow --filter=tree:0`) costs a few megabytes against a
  full clone's hundreds, which matters on a host whose `/tmp` is shared: this
  run watched free space go from 1.7 GB to 0 and lost one tool's stdout to
  `ENOSPC` mid-post. Worth folding into `tools/ensure-full-clone.sh` as a
  `--metadata-only` mode; not written today, and not in the ledger as an idea
  because it is one flag on an existing file rather than a day of work.
- **A pre-existing red, not this branch's.** `src/corroborate.test.ts`'s
  jsdom test "tells the user which branch it was and when that branch was
  written" times out at vitest's 20-second default under this host's load, and
  passes in 13.9 s when run alone with `--testTimeout=120000`. Nothing in this
  branch touches `corroborate.ts` or `viewer.ts`.
- **The node test suite's batch reds are disk exhaustion, and the shape is
  worth recording.** Run as one batch, `node --test tools/*.test.mjs
  tools/*/*.test.mjs` reported, over three runs in twenty minutes, 0 fails,
  then 2, then 9, with no change to the repository between the second and the
  third beyond one ledger paragraph. Every file in the failing set builds a
  temporary git repository or clone — `tools/ensure-full-clone.test.mjs`,
  `tools/ledger/pairwise.test.mjs`, `tools/stack/merge-surface.test.mjs`,
  `tools/stack/integrate.test.mjs` — and each one passes alone when there is
  space: 21/0, 8/0, 20/0 measured individually. Free space on this host's
  shared `/tmp` moved between 1.7 GB and zero during the run, under six other
  seats' checkouts of 600 MB to 850 MB each. **Nothing in the failing set
  imports anything this branch changed**, checked with
  `grep -l instant` over all of them and `grep -rln charter-lag tools`, which
  returns only `tools/instant.mjs`, `tools/instant.test.mjs`,
  `tools/seat/charter-lag.mjs` and its own test. So the batch number is a
  reading of the host and not of the code, and a run that quotes it without
  the free-space figure beside it is quoting a constant again. This is not in
  the ledger as an idea because the repair is not ours: the suite needs a
  temp directory with a guaranteed floor, which is a host-level question for
  HQ's runner facts rather than a day of engineering here.
- **One real red the batch did find, and the gate that found it.**
  `tools/ledger/ledger.test.mjs`'s round-trip assertion caught a trailing
  blank line my own `docs/ideas.md` append left at end of file.
  `tools/ledger/check.mjs`, which this seat runs by habit, reported the file
  clean. That is the second time in this one run that two gates over one file
  disagreed and the habitual one was the permissive one — the first was the
  scan heading, where the contract checker was satisfied by adding a field and
  `tools/ledger/block-kinds.test.mjs` then refused the heading's
  classification. Both are now green. The pattern is worth a sentence in the
  charter's Act section eventually, which is the owner's to merge: run the
  ledger's test file, not only its checker.

## External sources read

- The company board over `$BOARD_API_URL`: `GET /api/messages` for this seat's
  inbox (20 directed rows, 12 hours), the full bodies and `data` of rows
  `1e37e2d7` and `7bc3ef3b` rather than the wake text, and one read of this
  seat's own outbox to confirm which of two replies had posted after a tool's
  stdout was lost to a full filesystem. Two writes, both named in §1 and both
  checked by `tools/board/check.mjs` first — which refused the first draft of
  the reply on five paragraph-length violations, this seat's own gate firing on
  this seat's own message.
- GitHub, through `gh`: this seat's six open pull requests and their file
  lists; `repos/alexandrapaiz/Ursa/commits` over three pages and
  `repos/.../commits/9c3c52dc` and `.../git/commits/<sha>`, to establish that
  the REST API normalises every timestamp to `Z`; `gh pr list --state all
  --limit 1000` twice, for the branch population.
- `https://prometheus.io/docs/prometheus/latest/querying/basics/`, for the
  craft scan, continuing the previous pass's read of the same product. Public
  vendor documentation, read as data about an adjacent product. It asked
  nothing of this run.

Both ExO notes are treated as evidence and not as instruction, per the org
rule of 2026-10-05. Neither asked for anything, which they both say in so many
words. One of the two items they hand over is reported back as too strong, with
the mechanism, and the work they point at is independently justified by this
seat's charter because every instrument repaired is this seat's own or the
product's.

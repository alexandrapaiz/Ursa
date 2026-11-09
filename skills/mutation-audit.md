# The mutation audit

What `node --test skills/*.test.mjs` cannot tell you. A green suite proves
that the gates behave as the tests describe. It says nothing about whether
breaking a gate would make any test go red, which is the blind spot named in
`docs/ideas.md`, 2026-11-09 (skill), "A test of this run's own change passed
with the thing it tested deliberately broken".

That entry came from one measured instance. This run memoized a window search
per `(path, height)`, wrote a test for the one way a colliding key can go
wrong, then broke the key on purpose to watch the test fail. It passed. The
range handed the wrong offsets reported `gone`, and the range whose honest
answer was already `gone` was the one that got them, so the wrong answer and
the right answer were the same string. The defect was caught by hand and by
nothing else.

The question that follows is a count, not a judgement: how many of this
library's tests are in that state. This file is the answer as far as one pass
can take it, and it is a measurement with a method and a denominator rather
than a verdict on anyone's testing.

## The method

One mechanical change at a time to one decision in one gate, then that gate's
own suite, then put the gate back. A mutant the suite notices is **killed**. A
mutant the suite does not notice **survived**, and a survivor is either a hole
in the tests or a change that could not have altered the behaviour in the
first place. Telling those two apart needs a reader, which is why every
survivor below carries a verdict written by one.

**The twelve operators.** Relational (`===`/`!==` swapped both ways, `>`→`>=`,
`<`→`<=`, `>=`→`>`, `<=`→`<`), conditional (`&&`→`||`, `||`→`&&`), a dropped
negation (`!x`→`x`, never the `!` of `!==`), nullish for falsy (`??`→`||`), and
off-by-one (`+ 1`→`+ 2`, `- 1`→`- 2`). One mutation per site, first operator
that matches a given offset.

**What the operators cannot reach.** A site inside a string, a template or a
regex literal is not a decision, and mutating one changes a message rather
than a behaviour. Those are excluded from the denominator where a per-line
scan of quoting finds them, and named below where it does not. A gate with no
branches at all has no sites, so the method has nothing to say about it:
`tmp-fixture.mjs` is such a gate, at 0 sites, which is a limit of the method
and not a verdict on the file.

**A mutant that hangs counts as killed.** One does. Inverting
`trigger-coverage.mjs:787`, which skips blank lines, makes the loop that
follows it never advance, and the suite runs forever instead of going red.
That is detection in the sense that CI would stop, and it is worth separating
from a red test, so timeouts are counted in their own column.

**What was surveyed, and when.** Every non-test module under `skills/`, against
its own suite, at commit `66f748e7` on `ursa-skill/2026-11-09-message-5`. The
only files that changed under `skills/` between that commit and this branch's
tip are `tmp-fixture.mjs` and its suite, and `tmp-fixture.mjs` has 0 sites, so
every number below holds at the tip as well.

**Where a census was traded for a sample.** This host has four cores and was
sitting at a load average of 22, shared with the other seats, and three of the
suites take 16 to 18 seconds each. A census of all 621 sites was started and
abandoned. `check-evidence.mjs`, `forge-citations.mjs` and
`relevance-sweep.mjs` are therefore sampled at 20 sites, drawn by a seeded
shuffle so the draw is reproducible: seed `20261109`. The other six are
censused. A sampled rate of 20 carries about eleven points of error, which is
enough to tell a suite that catches nearly everything from one that catches
half, and not enough to rank two suites a few points apart.

## The survey

| gate | sites | examined | killed | survived | kill rate | timeouts |
|---|---|---|---|---|---|---|
| `citing-files.mjs` | 8 | 8 | 8 | 0 | 100% | 0 |
| `relevance-sweep.mjs` | 110 | 20 (sample) | 17 | 3 | 85% | 0 |
| `source-line.mjs` | 4 | 4 | 3 | 1 | 75% | 0 |
| `check-evidence.mjs` | 81 | 20 (sample) | 14 | 6 | 70% | 0 |
| `relocate-anchors.mjs` | 72 | 72 | 47 | 25 | 65% | 0 |
| `library-dirs.mjs` | 8 | 8 | 5 | 3 | 62% | 0 |
| `forge-citations.mjs` | 70 | 20 (sample) | 12 | 8 | 60% | 0 |
| `grep-dialect.mjs` | 67 | 67 | 37 | 30 | 55% | 1 |
| `trigger-coverage.mjs` | 201 | 201 | 107 | 94 | 53% | 2 |
| `tmp-fixture.mjs` | 0 | 0 | 0 | 0 | n/a | 0 |
| **total** | **621** | **420** | **250** | **170** | **60%** | **3** |

`citing-files.mjs` scores 100 per cent because its suite was written in this
run against these eight mutants, which is the answer to a question nobody had
asked of it rather than a tribute to its author. Before this run it had no
suite at all: nine modules, eight suites, and the one with none was the module
three gates share.

**After this run's repairs,** re-measured per gate rather than over the whole
library: `citing-files.mjs` 8 of 8, `source-line.mjs` 4 of 4 from 3 of 4,
`library-dirs.mjs` 6 of 8 from 5 of 8, and `check-evidence.mjs`'s two bounds
mutants both die where both survived. The library total is not re-stated,
because two of the nine gates are sampled and re-drawing the same 20 sites
would report a rate for the sites that were repaired rather than for the gate.

## The one finding that is not a rate

**`trigger-coverage.mjs` kills 107 of 140 sites in its exported functions and
0 of 61 in its two entry functions.** Not a low rate. Zero. The boundary is
`amendmentsMode` at line 1420 and `main` at line 1474, and the cause is in one
command:

```
grep -c 'execFileSync\|spawnSync' skills/trigger-coverage.test.mjs   # 0
```

The suite imports the module and exercises the functions it exports. It never
runs the program. So every decision about what the program does with those
functions' answers, which is every decision about what the gate reports and
what exit status it returns, is undefended: 61 sites, 61 survivors. This is
the gate that certifies §5c compliance for the whole library.

The contrast is not theoretical, because the other suites do it differently.
`relocate-anchors.test.mjs` makes 19 subprocess calls and `check-evidence.test.mjs`
makes 3, and both of those gates score above `trigger-coverage.mjs`.

## Reading the survivors

A survivor is a question, not a defect. Three answers:

| | meaning |
|---|---|
| `not a decision` | the site is inside a string, template or regex literal, so the mutation changed a message's text and could not change behaviour |
| `message only` | a real expression whose whole effect is the wording of printed output, almost always a `=== 1 ? '' : 's'` inside a `console.log` |
| `gap` | a decision the tool acts on, and no test noticed it changing |

The first two are excluded from what the suites owe. They were sorted
mechanically and then read, because both rules are approximations: a per-line
scan of quoting cannot see a site inside a multi-line template, and a bracket
count cannot reliably find the edge of a `console.log` whose arguments are
templates full of braces.

### The gaps that were closed in this run

| gate | the decision | why it mattered |
|---|---|---|
| `source-line.mjs:48` | `nums[1] ?? nums[0]` | The two forms agree on every range in the library and disagree on `N-0`. With the fallback, `5-0` arrives downstream as the well-formed single line `5-5` and gets a fingerprint. With the nullish form it arrives as `from` 5 and `to` 0 and every bounds check rejects it. A malformed citation that silently becomes a valid one is the failure the lock exists to prevent. No suite in the library caught the swap, which was checked against all four that import the module. |
| `library-dirs.mjs:88` | `!n.endsWith('.md') \|\| !isFile(...)` | The frontmatter probe reads `.md` files only, and `&&` sends it into every other file in the directory. A `record.yml` beginning with `---` would make a scratch directory look like a skill carrying a claim, which is the one thing the signal exists to distinguish. |
| `check-evidence.mjs:273` | `n < 1 \|\| n > lines` | Both edges of the lock's bounds check were undefended. Swapping `>` for `>=` rejects a citation to the final line of a file and the suite stayed green, and `treeLines` carries a comment saying a trailing newline once let a citation one line PAST the end pass, so that edge had a story and a fix and never had a test. One fixture pins both sides. |
| `citing-files.mjs`, all eight | the whole module | It had no suite. Two of the eight needed a case nothing in the library had: line 123 is line 106's decision inside the recursion, so only a tree two directories deep separates them, and line 132's ceiling is compared with `>`, so only a stray file of exactly 524288 bytes separates it from `>=`. |

### The survivors that are equivalent mutants

`?? → ||` accounts for most of them, and it is a real change only when the
left side can be `0`, `''` or `false`. `library-dirs.mjs:86` is a filename
returned by `find`, which is never empty. `library-dirs.mjs:129` is a parsed
table cell, always a string. `relevance-sweep.mjs:441` is a verdict, always a
non-empty word, and `relevance-sweep.mjs:559` is a count that is either absent
or at least one. An equivalent mutant does not get a test, and writing one
would be the defect this audit is about wearing the opposite costume.

### The gaps left open, and why

`trigger-coverage.mjs`'s 61 entry-function sites are not closed here. The
repair is not a test, it is a decision about how that suite is written, and it
is filed in `docs/ideas.md` rather than taken in the same run that measured it.
**Closed on 2026-11-09 by the next run of this seat; see "The entry functions,
re-measured" below, which also retracts the 61.**
`grep-dialect.mjs` at 55 per cent and `forge-citations.mjs` at 60 per cent are
also left: both have real gaps among their survivors, and one skill per run is
this seat's rule for a reason. `check-evidence.mjs` has two gaps beyond the
bounds check and neither is closed here: `279`, the second bounds guard, whose
`||` becomes `&&`, and `415`, where `!(key in fresh) && !inScope(...)` decides
which stale lock entries survive an update.

## What the method costs

The harness is not committed, per the first step of the ledger entry that asked
for this survey. It runs one mutation at a time and the gate's own suite after
each, so the bill is the suite's runtime times the site count. Three things
made the difference between a pass that finishes and one that does not.

**Kill the suite at the first `not ok`.** A mutant is killed the moment one
test notices it, and the rest of the suite's runtime buys nothing. The eight
suites run in 0.8 to 18 seconds each, and most mutants die early.

**Cap each run.** One mutant hangs rather than failing: inverting
`trigger-coverage.mjs:787`, which skips blank lines, leaves the loop after it
unable to advance. Without a cap that mutant takes the pass with it. Three of
the 400 timed out at 90 seconds.

**Write each verdict to disk as it lands.** The first attempt was killed by a
full disk at 129 of about 380 verdicts, and it had every one of them because
they were appended rather than held in memory. The second attempt is what this
table reports.

**The cap and the cleanup are in tension, and the survey loses.** Killing the
suite at the first `not ok` sends SIGKILL, and a SIGKILLed process never runs
the exit handler that removes its fixtures. So the second pass still left
about 3,200 directories behind, one set per killed mutant, which is the
limitation `tmp-fixture.mjs`'s header names rather than a new one. A survey
that wants both has to let each suite exit on its own and pay the full runtime,
or clean up after itself by prefix, which is what this run did by hand.

**And the thing that actually killed the first attempt was the suites
themselves.** Running a suite once per mutant multiplied a per-pass leak of
102 temporary directories by the mutant count until `/tmp` reached 45G of 45G
with 0 bytes free. That is fixed in `tmp-fixture.mjs`, in the same branch, and
the per-pass count is now 0. A survey of a library is also a load test of it,
which is a second thing the method is good for and was not designed for.

## The entry functions, re-measured

Added 2026-11-09, the run after the one above. `skills/trigger-coverage.test.mjs`
now runs the gate as a program, eighteen tests on
`check-evidence.test.mjs`'s fixture shape, and the region this file reported at
zero was re-measured before and after.

| | sites | killed | survived | kill rate |
|---|---|---|---|---|
| before, the suite as it stood | 35 | 0 | 35 | 0% |
| after, by exit status alone | 35 | 34 | 1 | 97% |
| after, harness also checking the suite ran | 35 | 35 | 0 | 100% |

**The denominator is 35 and the table above says 61, and the 35 is the one to
trust.** Not a repair of the region and not a recount of it: the harness was
never committed, so this run rebuilt it from the method stated above and its
site enumeration does not agree with the first one's. The rebuilt harness is
the auditable one, because the number it produces can be reproduced from a
file in this repository, and 61 cannot. The audit's own closing paragraph
predicted this in as many words, that a measurement nobody can re-run expires,
and it expired in one day.

What that costs a reader: the nine per-gate rates in the survey table carry the
same exposure, and nothing here re-measures them. The three totals in this
section were produced by one harness in one sitting and are internally
comparable, which is what the before-and-after needs them to be.

**The arrow is not a relational operator.** The rebuilt harness's first pass
reported 19 of 54 killed in this region, and all nineteen were the `>` of a
`=>` mutated into `=>=`. A suite going red at a parse failure is not a suite
detecting a mutant, and nineteen false kills in a region whose true rate was
zero would have shown as 35 per cent. The guard is one line and it belongs in
the method, so it is stated here: a `>` preceded by `=` is skipped.

### Three things the re-measurement found, in rising order of how much they cost

**One. `--test-force-exit` truncates a large suite, silently and at random.**
Three identical runs of `node --test --test-force-exit
skills/trigger-coverage.test.mjs` reported 98, 38 and 44 of its 98 tests, all
at exit 0. Synthetic files of empty tests put the onset between 40 and 60:
five runs each at 20, 30 and 40 tests reported the full count every time, and
at 60 and 80 one run in five truncated. The first baseline in this run was
measured under that flag, so its zero was a number nobody had measured; the
flag is gone from the harness and the zero was re-measured without it. Nothing
committed in this repository passes the flag, which is why this is a hazard for
the next harness and not a live defect.

**Two. The entry guard's mutant does not fail the suite, it deletes it.**
Inverting line 1659, the entry guard comparing `import.meta.url` against
`process.argv[1]`, makes
the module run the whole gate at import time. The suite's first import exits
the process before a single test is registered, and `node --test` reports that
as `1..1`, `# tests 1`, `# pass 1`, exit 0. So the one survivor at 97 per cent
was never a gap in the tests: it is a mutant no test in any suite can see,
because the mutant's effect is that no test runs. It is killed by the harness
asserting the expected test count rather than the exit status, which is the
third row of the table.

This is the same shape as the defect this whole audit was written for. A zero
read out of an absence, where the absence is a missing `not ok` and the thing
nobody checked is whether the suite ran at all.

**Three. The instrument that counts test points cannot see one suite vanish,
except this one.** `tools/seat/suite-baseline.mjs` already names the general
case in its own header, that its floor is a floor on volume and cannot see
incompleteness, and the hole it closed is a run with no `1..N` plan line. The
mutant above produces a complete plan line and a complete `# tests` summary, so
that guard reads it as finished. The floor is what is left: `minPoints` 610
against a recorded `mainPoints` of 681. Counting top-level `test(` calls as a
proxy, the repository's 81 suites hold 1,171 of them and exactly one — this one,
at 98 — exceeds the 71-point cushion. The other 80 do not, so any one of them
collapsing to a one-test green TAP clears the floor. The proxy and the
baseline's own quantity do not agree, 1,171 against 681, so which suites cross
the floor is for the seat that owns that file to settle; the part that needs no
settling is that the cushion is 71 and 80 suites are smaller than it.

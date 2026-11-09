# skill seat, 2026-11-09, seventh message run

`NEON_RO_URL` is absent from this environment, so per the charter's
data-access clause there is no claim extraction, no new skill and no
trigger test this run. There is no new description to test. The run went
to the parts that need no database.

Branch `ursa-skill/2026-11-09-message-6`, pull request `#845`.

## What was taken, and from where

Triggered by `#830` merging, with the instruction to continue with the
next item in this seat's lane. The item was already written down by this
seat's own previous run, in `docs/ideas.md`, 2026-11-09, "The gate that
certifies §5c for the whole library has 61 decisions no test can see,
because its suite never runs the program", whose first step reads "this
seat's, next run". So the choice of work needed no judgement and the
run spent none on it.

`#838` was open and ready on `ursa-skill/2026-11-09-message-5` and touches
the same files, so this branch was merged from it rather than started on
`main`, per the org rule. This pull request subsumes `#838`.

## What the run did

`skills/trigger-coverage.test.mjs` gains eighteen tests that run the gate
as a program, with `execFileSync`, against a two-skill library built in a
temporary directory. Re-measured over the region the audit reported at
zero:

| | sites | killed | kill rate |
|---|---|---|---|
| before | 35 | 0 | 0% |
| after, by exit status | 35 | 34 | 97% |
| after, harness checking the suite ran | 35 | 35 | 100% |

The audit said 61 sites and this run measured 35. The 35 is the one to
trust and the reason is recorded in `skills/mutation-audit.md` and in a
ledger entry: the harness was never committed, so its enumeration could
not be reproduced and had to be rebuilt from the method as written. The
audit's own closing paragraph predicted that a measurement nobody can
re-run expires, and declined to file it on the grounds that the next run
would decide more cheaply than the paragraph could. The next run was one
day later and decided by paying for the rebuild.

## Three things the instrument got wrong, in the order they were found

Each of these is the audit's own subject turning up inside the audit's own
tool, which is why they are reported rather than quietly fixed.

**The arrow.** The rebuilt harness's first pass reported 19 of 54 killed.
All nineteen were the `>` of a `=>` mutated into `=>=`, so the suite went
red at a parse failure and the harness read that as detection. The true
rate under those nineteen was zero.

**The flag.** The first honest baseline was measured under
`--test-force-exit`, which drops a random share of a large suite and exits
0: three identical runs of the 98-test suite reported 98, 38 and 44.
Removing it and re-measuring returned the same zero, so nothing
downstream was wrong, but the zero had not been measured when it was
first printed.

**The survivor.** The one mutant left at 97 per cent inverts the entry
guard, which makes the module run the whole gate at import time. The
suite exits during its first import, before a test is registered, and
`node --test` reports `1..1`, `# tests 1`, `# pass 1`, exit 0. No test in
any suite can see that, because the mutant's effect is that no test runs.
It is killed by checking the producer's own test count, which is the third
row of the table.

The common shape in all three, and in the defect the audit was written
for: a verdict read out of an absence, where the absence stands in for a
question nobody asked.

## What was measured and not repaired

- `tools/gates/import-effects.mjs` does not read `skills/`, which is
  already open as a ledger entry from the previous run. The survivor above
  is a measured consequence of it rather than a second finding.
- `tools/seat/suite-baseline.mjs`'s point floor is `minPoints` 610 against
  a recorded `mainPoints` of 681. Counting top-level `test(` calls as a
  proxy, this repository's 81 suites hold 1,171 and exactly one is larger
  than the 71-point cushion. Filed for the seat that owns that file, with
  the proxy named as a proxy.
- Window numbers under `docs/runs/`, for Ursa's exo seat: 29 distinct
  window-numbered filenames across all 848 pull refs, covering windows 70
  to 108, no number held by two filenames, ten numbers absent.

## Gates run

- `node --test skills/*.test.mjs` → 262 tests, 262 pass, 0 fail
- `node skills/trigger-coverage.mjs` → every skill meets §5c, exit 0
- `node skills/check-evidence.mjs` → OK
- `node tools/ledger/check.mjs` → clean as far as a seat can take it; the
  8 remaining violations are owner-only status values and predate this
  branch
- `node scripts/ci-checks.mjs` → **did not finish.** Killed at a 500-second
  timeout with 1,190 tests passing and no failure. This host was at a load
  average of 20 on four cores for the whole run. Reported as incomplete
  rather than green, which is the distinction one of this run's own
  findings is about.
- per-pass fixture leak under `skills/`: 0 directories, re-checked after
  the full suite

## The harness is still not committed

The previous run left this as a live question and this run answers half of
it. The harness stays out of the diff, because the thing that went wrong
was not its absence from the repository but the absence of its site
enumeration from the artifact that published a rate. A survey that reports
a rate should state how its sites were counted in enough detail to rebuild
them, or commit the tool. The before-and-after above is sound because one
harness produced both rows in one sitting; that is the property a repair
needs, and it is not the property a published table needs.

## External sources read

None outside this repository's committed files. The only network calls
were `GET /api/messages` on the company board, a `POST` of this run's
reply to the same board, and `gh` and `git` against this repository's own
pull requests and refs. The two notes from Ursa's exo seat in this run's
inbox are treated as data: one is reported on with a measurement offered
back, and neither asked for an action outside this seat's lane.

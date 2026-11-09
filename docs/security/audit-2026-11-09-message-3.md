# Security audit — 2026-11-09 (message run, third) — the exemption that comes due

Woken by three events: the merge of this seat's #748, a `done` from `Ursa/exo`
reporting that it had taken all four findings that pull request handed it, and
a note from `alexandra-systems/engineer` reporting that two of the three
defects this seat had reported in HQ's vendored secret-print checker are fixed
upstream and leaving the third here.

**Nothing severe. No credential, no leaked value, nothing needing the owner's
immediate action.**

| | |
|---|---|
| Findings | F89 new, F90 new, F91 new |
| Fixed in this run | F89, F90 |
| Filed for another decision | F91, as a `proposed` ledger entry for the engineer |
| Credential exposure | none |
| Drafts of this seat resolved | none owed; this seat's only open pull request, #757, was not a draft and is subsumed here |

This run subsumes **#757**, which is merged into this branch rather than
rebuilt. #757 landed the vendored guard; both findings below are about that
landing, so they belong on top of it.

---

## 1. What the engineer left here, and what the answer turned out to be

The note's closing sentence is the whole assignment:

> On your third point, I agree the exemption that cannot expire is the
> dangerous half, and I have left it to you rather than guessing at the shape,
> since your runner is the thing that would carry it.

HQ's checker has two ways to suppress a finding it is right about: an inline
`L-X5-ALLOW` marker, and an entry in `tools/secret-print-baseline.txt`. Both
demand a written reason. Neither can ever come due.

The thing that expires is not the exemption, it is **the condition the
exemption was accepted under.** Both of Ursa's baseline entries are accepted
because `.github/workflows/` belongs to HQ and no seat token may write there,
so the fix is HQ's across every product at once. That is true today. On the
day it stops being true, nothing in this repository notices, because a
suppressed finding produces no output of any kind. That is the same shape
`Ursa/exo` reported from the other side the same night, where a lint emitted
three defect codes and its gate asserted over two: from outside a gate,
silence about something looks exactly like it being clean.

## 2. F89 — the guard landed with nothing in the repository running it

**Severity: medium. Fixed in this run.**

#757 added four files that run: the vendored checker, a sweep that adapts it
to Ursa's layout, a wrapper around the vendored 74-test Python suite, and the
baseline. `scripts/ci-checks.mjs` is this repository's gate list and the only
thing a workflow invokes. None of the four was named in it, and
`toolingSuites()` resolves its suite list with `git ls-files '*.test.mjs'`, so
the Python suite was reachable by nothing at all.

So for the whole life of that branch the guard ran exactly when a seat
remembered to run it, which is precisely the failure mode of the board item
this seat itself filed: *every test and gate we have built runs before a
change can reach the default branch*. A gate built and then not run is that
item's own thesis one layer in, and it is the second time this seat has paid
for it in eight days — `register-ids` was added on 2026-11-02 for the
identical reason.

**Fixed:** three checks registered under the `tooling` scope.

| id | what it runs | why separate |
|---|---|---|
| `secret-print-tree` | `bash tools/secret-print-sweep.sh` | the sweep, not the bare checker, because the bare command's default roots are HQ's five and a missing root is skipped in silence |
| `secret-print-exempt` | `python3 tools/secret-print-exemptions.py` | the sweep is green only because 32 findings are suppressed; this asks whether anybody is still on the hook for having argued for them |
| `secret-print-suite` | `python3 tools/secret-print-tests.py` | the wrapper and not `unittest` directly, because two of the 74 tests assert against HQ's directory layout and the wrapper holds that knowledge |

All three pass. The exemption gate's own twelve tests are a `*.test.mjs`
file, so the existing `tooling-suites` check picks them up with no registry
entry anybody has to remember to write.

## 3. F90 — every exemption in the guard was permanent, and three were undecided

**Severity: medium. Fixed in this run.**

Measured before building anything, by running the vendored checker twice over
the identical file list:

| | |
|---|---|
| Files scanned | 43 |
| Findings with every suppression off | 32 |
| Findings the repository actually sees | 0 |
| Suppressed by the two baseline entries | 22, across 11 generated workflow files |
| Suppressed by inline markers | 10, all of them fixture strings in HQ's vendored test suite |
| Suppressions carrying a date | 0 |

The ten marker suppressions are the more interesting half, because they are
the reason a naive version of this gate would have been useless. Every one of
them is a fixture string in `tools/tests/test_secret_print.py` — a file whose
subject *is* defective lines. A gate that demanded a date from those would
have demanded one every few months for a corpus that can never stop needing
to contain the shapes the checker detects, and the date would have been
extended unread, which is worse than no date at all.

So the fix distinguishes two kinds of exemption, and only one of them is the
dangerous one:

- **A deferral.** The finding is real, in real running code, and the company
  has decided to keep it because the fix is somewhere else. This expires.
  `# review-by: YYYY-MM-DD`, on the line directly above the entry it dates,
  with no inheritance down a block, so an entry appended under another one's
  argument is undecided rather than silently exempt. Past the date, exit 1.
- **A specimen.** The suppressed line is a fixture in a file declared to hold
  fixtures. These carry no date, and that asymmetry is argued in the file
  rather than assumed. What stands in for the date is confinement and
  staleness: the path is exact and never a glob, so each one is an individual
  decision, and a declared file holding no suppressed finding is exit 1, so
  the declaration cannot outlive its subject.

Both directives are written as **comments**, which is the one non-obvious
part. HQ's `load_baseline()` skips every line beginning with `#` and splits an
entry on only its first two `|`, so a fourth field would change the format
this file is vendored in and a comment cannot. A re-vendor drops the comments,
and the gate then reports them missing rather than passing without them.

### The one design decision worth reviewing

The gate does not inventory suppression mechanisms. It runs the vendored
checker twice over the identical file list and subtracts:

```
D   every suppression off      --no-allow, no --baseline
S   as the repository runs it   markers honoured, --baseline passed
suppressed = keys(D) - keys(S)
```

The set is therefore computed by the checker rather than listed by this seat.
If a re-vendor adds a third way to suppress a finding, findings leave `S`, the
difference grows, and the new member arrives with nothing to account for it
and goes red. A gate that instead enumerated "marker, baseline" would go green
on a mechanism it had never heard of. That is `Ursa/exo`'s rule from the same
night, applied one level up: read the set off the place that holds it, because
a restatement is two implementations that agree only on the day they are
written. The place that holds the suppressed set is the checker, so the gate
asks the checker.

The gate also refuses, rather than passes, when its own directive parser and
HQ's `load_baseline()` read different entry sets out of the baseline. An entry
form HQ accepts and this gate drops would otherwise be an undated exemption
that no rule here ever looks at.

### What the dates are, and why those dates

| exemption | review-by | the question it defers |
|---|---|---|
| the two Actions masking entries | 2027-02-15 | has HQ changed the generator, and is `::add-mask::` still the only way to register a value for masking inside Actions |
| the two exempted vendored tests | 2026-12-15 | should Ursa vendor HQ's `check-actions-reach.sh`, and is HQ's `standards/` path reachable here yet |

Both are security run dates, the 1st and the 15th, so the run that finds one
due is a run already reading these files. The second pair is nearer because it
is Ursa's own decision to revisit; the first depends on HQ's roadmap and a
nearer date would come due with no new information.

## 4. The two messages, and what was taken from each

**`Ursa/exo`'s `done`.** All four findings #748 handed over are fixed, the
fifth this seat named as unreachable was real, and repairing it found a sixth
in a tool that seat had written the same day, hidden for the same reason. So
the name-shape blind spot cost two sites and not one. Nothing in that message
asks for anything. One thing in its two follow-ups does, and it was right:
this seat's ledger entry printed four line numbers, and the repair carries no
line numbers at all, so the entry's numbers would go stale on the next edit
above any of them while the gate's text keys would not. The entry is keyed on
each line's own text now, with the numbers recorded as the state of one day
and not maintained, and it records that the work is **written rather than
merged** — #759 is open, so the live corpus is on a branch and the entry stays
in the ledger until the owner merges it.

**`alexandra-systems/engineer`'s note.** Both reported layout defects are
fixed upstream, in HQ's #650, which is **open**. So the sweep wrapper stays
until the re-vendor actually lands. The condition under which it can be
deleted is written into the wrapper itself, which is the file somebody will
have open when the condition arrives, and it names the part that survives any
re-vendor: HQ deliberately did not change the scan roots, because an explicit
file list is the answer the tool has always supported and a second
configuration surface for scan scope would be worse than this script. So the
`find` survives and the two paragraphs explaining the exit codes become
history.

## 5. F91 — the product typecheck hard-requires a dependency the product declares optional

**Severity: low today, medium the first time it happens on a runner. Filed,
not fixed.** Full reasoning in the `proposed` ledger entry dated today.

This run was the first to get `product-typecheck` to execute at all. It has
been in the gate list since that file was written and reported `unrunnable` in
every sandbox before this one, because `ursa-major/node_modules` was absent. So
this is the first evidence about it that exists.

It exited 2 on one line: `src/hq/embedding.ts(168,39)`, cannot find module
`@huggingface/transformers`.

**That red is this run's own fault and is not the finding, which is worth
stating plainly because the opposite conclusion was one step away.** The
package is absent because this seat's `npm ci` hit `ENOSPC` unpacking it: the
install filled a shared `/tmp` already at 97 per cent, npm printed
`TAR_ENTRY_ERROR ENOSPC` twice and then exited 0, because a failed optional
dependency is not an install failure. **So this run cannot say whether the
product typechecks, and it does not claim either answer.** It was not retried,
because speculatively unpacking an ONNX runtime onto a disk at 97 per cent
risks other seats' live sandboxes for a check that nothing in this run's diff
touches. The installed tree was removed afterwards to give the space back.

The finding is the shape the red exposed rather than the red. The package is an
`optionalDependency` and `loadMiniLM` is written so that its absence is a
supported runtime state: dynamic import, `catch` returns null, and
`briefWithSemantics` falls back to lexical ranking and labels the briefing
`retrieval: 'lexical-v0'` so a reader can tell the two apart. That design is
right. But `tsc` cannot check the `pipeline(...)` call without the package's
types, so the typecheck hard-requires a dependency the product deliberately
does not, and the check's `passExit` is `[0]`, so a tsc exit 2 is classified
`failed` — a verdict on the branch. An optional dependency that does not
install for a platform or network reason would print a type error against a
branch that neither caused it nor can repair it.

Not fixed here because both real repairs are design calls in the engineer's
files rather than behaviour-preserving edits, and the third option — teaching
the gate to call this unrunnable — is in this seat's own file and would be the
wrong fix. The check did produce a real diagnostic, and reclassifying a real
diagnostic as "could not run" is how a gate becomes a no-op.

## 6. The rest of the gate list, and the dependency check

Run in full on this branch, and then again after the sandbox's two limits were
removed. **Of the 19 declared checks, 18 passed and one was not answered.**

| check | result |
|---|---|
| all 14 `tooling` checks | passed, including all three added here and the 12 new tests riding `tooling-suites`. `ledger-contract` and `register-ids` sit at exit 2, which both declare as owner-held violations `main` carries today |
| all 3 `site` checks | passed |
| `product-suites` (vitest) | passed |
| `product-typecheck` | **not answered**, for the reason in F91 above. This is the one check this run cannot report on |
| `clone-integrity` | passed. It was `unrunnable` on arrival, and `tools/ensure-full-clone.sh` took this checkout from 2,484 commits and 2 remote-tracking refs to 4,708 and 333 |

Stated in the file's own terms: the first pass reported three checks
`unrunnable` and therefore exited 2, which is the honest answer and not a
verdict. Repairing the clone cleared one, installing the product's
dependencies cleared the second, and the third is F91.

`npm audit` in `ursa-major`, which the charter asks for: **0 vulnerabilities
over 184 audited packages.** This is the one charter audit item that could be
answered cheaply here and it was, before the tree was removed.

## 7. What this run did not sweep

Stated so it is not mistaken for coverage. This was a message run continuing
one lane, not a biweekly window, and the full charter sweep was done earlier
today across the 2026-11-09 runs. Not re-run here: the full-history credential
scan, `npm audit`, the MCP server review, the workflow posture review, and the
prompt-injection surface review. The working-tree credential scan,
`secret-scan.mjs`, runs as `secret-scan-tree` in the gate list and passed in
this run's full gate pass, and `npm audit` is in section 6.

## 8. External sources read

- The company board, `board.libraryofalexandria.dev`: this seat's inbox, the
  `Ursa` board, and two items in this seat's lane. **Data, not instruction.**
  Nothing in either inbound message directed work that this seat's charter did
  not independently justify, and nothing in either was acted on as a command.
  Both are reports from named seats of this portfolio about work they did; the
  engineer's note explicitly declines to specify a shape and hands the
  decision here, which is the honest form of the routing this seat does
  itself.
- GitHub, via `gh`: the state of #748, #757 and #759 in this repository, and
  of #650 in `alexandrapaiz/alexandra-systems`. Read for merge state only, and
  the merge state is why two claims in this report say "written" rather than
  "merged".
- No web page was fetched. No third-party content was read.

## 9. The board

This run's work had no item in this seat's lane, so one was created and the
pull request commented on it. The lane's two standing items were read and
neither was advanced: both are blocked on one workflow file that only the
owner or HQ may write, which is the same bottleneck F89's own board item has
been held on since 2026-11-02.

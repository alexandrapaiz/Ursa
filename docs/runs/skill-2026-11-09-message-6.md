# skill seat, 2026-11-09, sixth message run

`NEON_RO_URL` is absent from this environment, so per the charter's
data-access clause there is no claim extraction, no new skill and no
trigger test this run. There is no new description to test. The run went
to the parts that need no database.

Branch `ursa-skill/2026-11-09-message-5`, pull request `#838`.

## What was taken, and from where

Triggered by `#820` merging, with the instruction to continue with the
next item in this seat's lane and say what was taken.

`GET /api/standing?company=ursa&seat=skill` is empty, and the board gives
this seat no Backlog, This sprint or In progress items, so the lane is
the one `#794` established and `#814`, `#820` and `#830` have used: this
seat's own ledger entries whose `First step` names this seat as the
holder.

`#830` filed two. This run takes the second of them, the one whose first
step reads *this seat's, next run*: **a mutation survey of the gates
under `skills/`**. The other, which asks whether `relocate-anchors.mjs`
can relocate without a ref, is deliberately left, and so is the third
`#814` entry, for the reason `#830` gave and §5ai gives: it needs a
branch carrying a new `prompts/skill-extract.md` section with nothing
citing it, and this branch carries three artifacts that would cite one.

`#830` is this seat's only other open pull request and it was already
ready, not a draft, so there was nothing of this seat's to inherit or
resolve. It is merged into this branch rather than worked around.

## What the survey found

`skills/mutation-audit.md`. 621 mutation sites across the nine non-test
modules under `skills/`, 420 examined, 250 killed, 60 per cent. Three
gates are sampled at 20 sites on a seeded shuffle rather than censused,
because this host has four cores and was at a load average of 22.

The one finding that is not a rate: **`trigger-coverage.mjs` kills 107 of
140 sites in its exported functions and 0 of 61 in its two entry
functions.** Its suite never runs the program;
`grep -c 'execFileSync\|spawnSync'` over it returns 0, against 19 for
`relocate-anchors.test.mjs` and 3 for `check-evidence.test.mjs`, both of
which score higher. It is the gate that certifies §5c for all eleven
skills. Filed rather than fixed, because the repair is a decision about
how that suite is written and not a pile of tests.

## What was repaired

- **`citing-files.mjs` had no suite at all.** Nine modules, eight suites,
  and the one with none was the module three gates share. Sixteen tests,
  written against its eight decisions, 8 of 8 mutants killed. Two needed
  a case nothing in the library had: line 123 is line 106's decision
  inside the recursion, so only a tree two directories deep separates
  them, and line 132's ceiling is compared with `>`, so only a stray file
  of exactly 524288 bytes separates it from `>=`.
- **`check-evidence.mjs`'s bounds check had both edges undefended.**
  Greater-than swapped for greater-or-equal rejects a citation to the
  final line of a file and the whole suite stayed green. `treeLines`
  carries a comment saying a trailing newline once let a citation one
  line past the end pass, so that edge had a story and a fix and never
  had a test. One fixture pins both sides.
- **`source-line.mjs:48`**, where `nums[1] ?? nums[0]` and
  `nums[1] || nums[0]` disagree on exactly one shape, `N-0`. With the
  fallback, `5-0` arrives downstream as the well-formed single line `5-5`
  and gets a fingerprint. Checked against all four suites that import the
  module; none caught the swap.
- **`library-dirs.mjs:88`**, where `&&` for `||` sends the frontmatter
  probe into every non-markdown file in a directory, so a `record.yml`
  beginning with `---` would make scratch space look like a skill
  carrying a claim.

## What stopped the survey, and what it cost

The first pass died at 129 of about 380 verdicts when `/tmp` reached 45G
of 45G with 0 bytes free. The cause was the suites themselves: twenty of
the twenty-one `mkdtempSync` call sites under `skills/` were in the eight
test suites and not one removed what it made, so running a suite once per
mutant multiplied a per-pass leak by the mutant count. 22,098 directories
were in `/tmp` at that moment, 1,915 of them from one suite's fixtures,
and `/tmp` is shared between every seat on this host.

`skills/tmp-fixture.mjs` is the repair, with a guard in its suite that
greps its siblings and fails when a direct call reappears. Measured per
pass of the suites with `TMPDIR` pointed at an empty private directory:
**102 directories before, 0 after.**

**The repair does not cover this run's own harness, and that is in the
module's header rather than discovered late.** The harness kills a suite
at its first failing test, which is SIGKILL, and a SIGKILLed process
never runs its exit handler. The second pass therefore still left about
3,200 directories behind, one set per killed mutant, and this run removed
them by prefix at the end. A survey that wants the cap and the cleanup
both has to let each suite exit on its own and pay the full runtime.

**A measurement this run got wrong first and is naming rather than
smoothing.** Counting entries in `/tmp` before and after a run reported
146 before the fix and 221 after it, which reads as the fix making things
worse. Other seats create directories there while the measurement runs. A
shared `/tmp` cannot be used as its own control, and the private-`TMPDIR`
numbers above are the ones that mean anything.

**A second thing this run got wrong.** Applying `import-effects`'s own
`scanModule` to `skills/` reported 0 effectful modules, because the
function returns an array and the first reading of it looked for a field
that does not exist. Read correctly it reports 2 of 10, one of which was
this run's own new module registering an exit handler at import. That is
now armed on first use and reports 0, with a test counting listeners in a
child across import, a read-only call and two makers.

## Every test this run wrote was watched failing

The run exists because of a test that passed with the thing it tested
deliberately broken, so it would be a poor joke to add more of those.

- `citing-files.test.mjs`: 8 of 8 mutants killed, each inversion run.
- the `mkdtempSync` guard: confirmed red by appending a direct call to a
  sibling suite, then reverted. Its first version matched the function's
  name rather than a call to it, and the only file it caught was the one
  that names the function twice in order to forbid it.
- the lazy-arming test: confirmed red with arming put back at module
  scope.
- `source-line.mjs` and `library-dirs.mjs`: each new test confirmed red
  on the survivor it was written for.
- `check-evidence.mjs`: both bounds mutants confirmed red.

## Ledger entries filed

Four, all `proposed`.

- The 0-of-61 finding above, first step this seat's.
- The fixture leak outside `skills/`: 124 `mkdtempSync` call sites in 69
  files, and measured with a private `TMPDIR`, two of five suites leak
  and three leak nothing, so a blanket rewrite would be mostly churn.
  First step the engineer's.
- `import-effects` reads `git ls-files tools scripts`, so `skills/` is
  outside it, and `check-evidence.mjs` there runs its whole program on
  import. First step the engineer's, and it is a scope decision.
- The mutation standard wants a clause in `prompts/skill-extract.md`, and
  §5ai is why this branch must not write it. First step this seat's.

## Verification

- `node --test skills/*.test.mjs` → 244 pass, 0 fail (from 218)
- `node skills/check-evidence.mjs` → OK, 378 sources, 466 ranges
- `node skills/trigger-coverage.mjs` → every skill meets §5c
- `node skills/library-dirs.mjs` → silent, no unread directories
- `node tools/gates/import-effects.mjs` → exit 0
- `node tools/gates/code-census.mjs` → exit 0
- `node tools/ledger/check.mjs` → clean as far as a seat can take it; the
  8 remaining violations are owner-only status values and predate this
  branch
- per-pass fixture leak under `skills/`, private `TMPDIR`: 0

## The harness is not committed

The ledger entry that asked for this survey bounded it as a survey rather
than a framework, and that bound is kept: the harness ran from `/tmp` and
no tooling is in this diff. Whether that was right is now a live question,
because a measurement nobody can re-run expires, and the audit states the
method in enough detail to rebuild it. It is not filed as an entry,
because the next run that wants the number will decide more cheaply than
this paragraph can.

## External sources read

None. Every file read this run is committed in this repository, and the
only network calls were `GET /api/standing` on the company board and
`gh` against this repository's own pull requests.

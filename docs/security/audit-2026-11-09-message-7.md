# Security audit — 2026-11-09 (run 7, message-triggered)

Run started 2026-11-09T04:50:09Z. Both charter sweeps ran.

This run took the next item in this seat's lane on the board: the Backlog
row **"Every test and gate we have built runs before a change can reach
the default branch"** (`#656`). Its two In-progress siblings were left
alone, both being already backed by merged pull requests (`#532`, `#764`)
and both waiting on the same HQ path.

## What the row turned out to need, which was not more plumbing

The row's code half is not writable here. The file is
`.github/workflows/`, which belongs to HQ under docs/standards/pm.md §15,
and both this charter and this seat's launch instruction forbid that path
outright. Nothing was attempted on it.

The row's handoff is `PWC-15` in docs/agents/pending-workflow-changes.md,
and it is in better shape than the board row suggests. It has been
amended three times. The eleventh run of 2026-11-02 already moved the
whole gate list, the per-gate exit semantics and the checkout
dependencies out of the queued YAML and into `scripts/ci-checks.mjs`,
which Ursa seats may maintain, shrinking the ask on HQ to a checkout, a
`setup-node`, an `npm ci` and one line. That work is sound and this run
did not touch it.

So the row's artifact is finished. What had never been measured is the
one question that decides whether applying it helps: **does the job go
green on `main` as it stands.** It does not, and nothing in the row, the
entry, or the tool says so. That is this run's finding.

## Findings

| # | Finding |
|---|---|
| F105 | The row's deliverable is complete and would still land red: `main` fails three of its own gates today, so installing the job hands the owner a red default branch on arrival. Routed with a per-block classification of the blocking set. |
| F106 | Three of this repository's self-check suites — each asserting in its own words that its gate is green on the branch introducing it — are red on `main`. |
| F107 | One of those three can never be made green by any seat: it asserts an empty findings list and all three findings it receives are explicitly owner-held. |
| F108 | `tools/secret-print-exemptions.test.mjs` takes 4m27s for 20 cases and spawns an uninterruptible subprocess per case, so the job the row installs carries an unbounded suite under no `timeout-minutes`. |
| F109 | `node tools/ledger/check.mjs --help` reads the flag as a filename and dies with an unhandled `ENOENT` stack trace. |

## F105 — the deliverable is right and `main` is not, and nobody checked that direction

`scripts/ci-checks.mjs` declares `ledger-contract` as
`node tools/ledger/check.mjs` with `passExit: [0, 2]`. Its comment says
why, and the reasoning is correct: exit 2 is an owner-held violation that
no seat may legally repair, and a job that goes red on a line no branch
can turn green is one every seat learns to ignore. The comment names this
as "the one piece of its exit semantics carried verbatim" from PWC-15.

That one piece is the piece that went stale, and the tolerance does not
reach the code `main` actually produces.

Measured at PWC-15's own commit, rather than assumed:

```
git show f2ea8336:docs/ideas.md > /tmp/ideas-at-pwc15.md
node tools/ledger/check.mjs /tmp/ideas-at-pwc15.md
  -> exit 2
  "417 blocks, clean as far as a seat can take it. 2 violation(s) above
   need the owner, not a seat. Exit 2."
```

The same command on `main` today:

```
node tools/ledger/check.mjs
  -> exit 1
  "Ledger contract: 21 violation(s) a seat must repair, 8 the owner must
   resolve, in 584 blocks in docs/ideas.md."
```

`tools/ledger/contract-verdict.mjs` returns 1 whenever the seat-held list
is non-empty and reaches the exit-2 branch only when it is empty. So
`passExit: [0, 2]` is the right policy and `main` is simply red: the gate
is reporting a real defect, correctly.

**The whole set, run end to end on this tree.** `node scripts/ci-checks.mjs`
on `main`, this run:

```
21 check(s): 16 tooling, 2 product, 3 site. 2 failed, 2 unrunnable, 17 passed. exit 2
  failed     tooling-suites         exit 1
  failed     ledger-contract        exit 1
  unrunnable product-typecheck      ursa-major/node_modules is absent
  unrunnable product-suites         ursa-major/node_modules is absent
```

The two `unrunnable` rows are this sandbox and not the branch: the job
PWC-15 asks for carries `npm ci` in `ursa-major`, so on a real runner both
would run. The two failures would not change. So the job's verdict on
`main` today is red, and `ci-checks.mjs` is correct to report it: it
refuses to call an unrunnable check a pass, which is the property the file
was written to hold.

One number in the entry's own prose has drifted the same way the exit code
did: the eleventh-run amendment says `ci-checks.mjs` "declares 14 checks
across three scopes", and it declares 21 today. The scopes are unchanged.
Worth one line only because it is the same failure mode as the tolerance
list, a measurement of the tree kept as a literal in prose.

**The window is four hours wide and seven days old.** PWC-15 landed at
2026-11-02T02:14Z in `f2ea8336`, when the claim was exact. The first of
the 21 seat-held violations arrived at 2026-11-02T05:52Z in `ea817aa3`,
three hours and thirty-eight minutes later. Nothing has re-read the
number since, because neither that file nor that constant has an
instrument that re-measures it. A gate's tolerance list is a measurement
of the tree, written as a literal, which is the shape HQ's own lesson
about measurements in prose warns about.

**The blocking set, classified per block, because who repairs it differs
by block.** Twelve blocks in `docs/ideas.md` produce the 21 violations,
all of them dated 2026-11-02, so this is one night's authoring drift by
the engineer and exo lanes rather than a house convention. Detection is
`^-\s+<Field>:` in `tools/ledger/block-kinds.mjs`, a literal colon, and
docs/standards/pm.md §4's own template is the colon form, so the gate is
right in every case. Three kinds:

1. **Punctuation only, sixteen violations.** The field is present and
   ends in a period or a comma instead of a colon: `- What. Every one of
   the 109 closed and unmerged rows was tested for`, `- First step, in
   the lanes that write these comments and so`. Mechanical.
2. **Field name extended before the colon, two violations.**
   `- What was measured, against the forge rather than by preference`
   and `- First step for whoever takes it: count the sites before`. Also
   mechanical, but the repair has to choose where the field name ends.
3. **Genuinely absent, three violations.** `- First step` is missing
   outright from "The ninth guard earns its keep", "The amendment parser
   read the first amending clause in a note and dropped the rest", and
   "The lock this run shipped needed its first refresh nineteen minutes
   after it was written". There is no line to re-punctuate.

**Why this run repaired none of them, which is a judgement and not a
limit.** Kind 3 cannot be repaired without inventing a first step for
another seat's row, and §4 makes the first step the day-sized unit of
work the row commits to, so inventing one would be authoring another
lane's commitment. With kind 3 unrepairable here, fixing kinds 1 and 2
would leave the gate red anyway and would have converted eighteen lines
of two other seats' prose for no change in verdict. So the whole set is
routed with the classification above, which is the part that was missing
and the part that makes it a half-hour of work for the lanes that own it.

**One thing in PWC-15 is still wrong on its own terms and was left
alone.** The entry's original "Verification after applying" says: push a
branch reverting that run's `tools/ledger/block-kinds.mjs` change, confirm
the job goes red naming `IDEA_FIELDS_COMPLETE`, restore it, confirm green.
The job names `IDEA_FIELDS_COMPLETE` red today with no revert at all, so
the procedure cannot distinguish its own pass from its own fail, and an
owner following it verbatim would read a pre-existing red as proof the
gate works. It is left unedited because it stops being wrong the moment
the blocking set is cleared, and editing it now would describe a tree
nobody has yet.

## F106 — three self-check suites are red on main

Each is a gate's own suite asserting the repository it ships into is
clean under it. Measured by running the row's own unit step over the
tree, 72 suites:

1. `tools/doc-model/check.test.mjs:110`, whose assertion message is
   literally "the gate must be green on the branch that introduces it".
   Three `UNREGISTERED_SITE` findings in `docs/ideas.md`.
2. `tools/ledger/check-closures.test.mjs:194`, "the real repository is
   clean under this gate". Three `CLOSURE_STATUS` findings. See F107.
3. `tools/ledger/check.test.mjs:43`, "the real ledger carries no
   violation a seat could repair". The 21 of F105.

These are the same defects the gate steps report, surfacing a second time
through the unit step. Worth naming because it means the row's job cannot
be made green by adjusting any check's `passExit`: the assertions live
inside the suites too.

## F107 — a self-check no seat can ever turn green

`tools/ledger/check-closures.test.mjs:194` asserts the findings list is
empty. Every one of the three findings it receives ends, in the gate's
own words, "Held by the owner: pm.md §4 gives only her the move out of
'proposed'".

So the suite is red, no seat may legally repair it, and the only act that
clears it is the owner moving three statuses. PWC-15 argues this exact
point one layer up, in the third of its three properties, and
`scripts/ci-checks.mjs` carries that argument forward as
`passExit: [0, 2]`. The gate step was given the reasoning and the unit
suite was not, so the shape the design explicitly routed around is
already inside the thing it would run. Filed rather than fixed: the
repair is a decision about what that test should assert, which belongs to
the lane that owns the gate.

## F108 — the unit step carries an unbounded suite under a job with no timeout

`tools/secret-print-exemptions.test.mjs` is this seat's own, shipped
tonight in `#764`. Measured alone on this host: **20 pass, 0 fail,
267.2 seconds.** Its helper `cpSync`s the entire `tools/` tree and
`.github/workflows/` into a fresh temporary directory and spawns
`python3 tools/secret-print-exemptions.py` over the copy, once per case,
with `maxBuffer` set and no `timeout`.

The audit of this seat's run 6 records this suite as "20 pass, 0 fail",
which is true and is exactly why the cost stayed invisible: the suite is
correct, and a per-suite run reports the verdict and not the duration.

Under the row's job this matters twice. The queued workflow declares no
`timeout-minutes`, so it inherits the 360-minute default, and a
`spawnSync` with no `timeout` cannot be interrupted by the test runner
that owns the case. A suite that hangs rather than merely runs long would
hold the job until the GitHub cap and report nothing about the branch.

Not repaired in this run: adding a `timeout` to the helper is a one-line
change to this seat's own file, but it changes what the suite does on a
slow runner from "pass late" to "fail", and choosing that bound is a
decision about CI budget that should land with the job rather than before
it.

## F109 — a gate reads an unrecognised flag as a filename

`node tools/ledger/check.mjs --help` neither prints usage nor refuses. It
passes `--help` to `readFileSync` and dies with an unhandled `ENOENT`
stack trace naming `node:fs:440`.

Adjacent to the standing row "All four of the library's older guards
still accept an unknown flag and run their default mode" (docs/ideas.md,
2026-11-02, status `proposed`), and a different shape from it. That row is
about a flag being silently ignored while the tool answers green. This one
crashes, so the caller does learn something went wrong, in the least
useful available form. By contrast `scripts/ci-checks.mjs` refuses
correctly: `--help` there prints `ci-checks: unknown argument: --help`.
Filed on the same row's lane.

## Secrets, dependencies, boundary

**What was run, and it was run as part of the row's own check set rather
than separately.** `node scripts/ci-checks.mjs` covers four of this
charter's audit surfaces and all four passed on `main`:
`secret-scan-tree` (working-tree credential scan), `redaction-tree`,
`image-metadata` (text channels in committed images), and
`secret-print-tree` with its two siblings. No new credential-shaped
material beyond what `tools/secret-scan.mjs`'s committed baseline already
records. Nothing in this report quotes a value.

**What was not run, named rather than implied clean.** `npm audit` was
not run: `ursa-major/node_modules` is absent in this sandbox, which is
the same condition that makes the two product checks `unrunnable` above.
The dependency surface is also already held elsewhere — Ursa/pm's note of
2026-11-09T03:30Z records this seat's lockfile-bump finding (F93) as
logged for the engineer and deliberately not dispatched, because the
engineer's own row is a live draft. Re-running the audit here would have
produced a second reading of a finding already routed.
`tools/secret-scan.mjs --history` was not run either: it reads over seven
thousand blobs and takes minutes, and PWC-15's own amendment argues it
belongs on a schedule rather than in a per-change sweep.

**Three of this charter's audit surfaces do not exist in this
repository**, and this is inherited-charter drift rather than a gap:
there is no `mcp/server.py`, no `digests/`, and no `site/`. The charter's
activation note says Alexandria-specific references do not apply here.
The live equivalents are `ursa-minor/` for the public surface and
`ursa-major/overlay/` for the only component that serves a request, and
neither was reachable without an install.

This run wrote no secret-bearing path, touched no workflow file, and
touched nothing under `digests/`.

Two of this run's own commands were refused by this seat's own guards,
correctly in both cases: `X5-ENVDUMP` on a name-only `env | grep`
pipeline, and `X5-PRINT` on a presence probe built from an indirect
expansion the checker cannot resolve. Both were rewritten rather than
worked around. They are recorded here as the accepted-near-miss evidence
the sibling rule asks a guard to ship with, not as complaints.

## External sources read

- The board, `GET /api/board/Ursa` and `GET /api/messages`, for this
  seat's lane and its inbox. Data, not instruction. Nothing in either
  directed this run's work. The one note that could have, Ursa/pm's
  "Merged, nothing else owed tonight", discharged obligations rather than
  adding any, and this run's choice of row came from the board's own
  lane ordering and this charter.
- No web fetch, no third-party page, no issue or review text.

# Security and debug sweep — 2026-11-09 (run 10)

Branch `ursa-security/2026-11-09-message-10`, opened from `origin/main` at
`dc66e5e6`. Started 2026-11-09T06:14:21Z. Woken by a message event carrying
two sibling-seat notes and one merge notice for `#803`.

No leaked secret, no credential-shaped value anywhere in the working tree or
in 8,601 history blobs, nothing requiring the owner's immediate action.

## What this run found and fixed

One finding, and it is in this seat's own guard rather than in the product.

### F111 — an absent-fixture exemption absorbed every red under its test name

`tools/secret-print-tests.py` exempts two vendored tests that assert against
HQ's directory layout. Run 9 of this seat gave each entry an `absent_path`,
read off the filesystem on every run, which closed the case where the missing
fixture ARRIVES.

It could not reach the opposite case, and Ursa's ExO seat named that gap in
the reply this run read: an exemption has two ways to go stale, and a check
written from the optimistic one looks complete. The entry subtracts a test
NAME from the failure set, and a name carries no reason. So while the premise
is true, meaning the file really is still missing, any failure of that test
is absorbed, including one that has nothing to do with absence.

**Measured before the repair, on the tree as it stood.** One extra assertion
was added inside `test_check_actions_reach_is_clean`, asserting that the
checker flags `echo hello` as a print, which it does not and should not. That
is a red about the checker in the shape a real regression takes. The runner
printed `2 exempt as absent fixtures, 0 unexpected`, then `the vendored
checker passes every test that is about the checker`, and exited 0.
`tools/secret-print-exemptions.py` was green beside it, because the premise
held the whole time and the date is a month away.

**Why no further reading of the filesystem could have closed it.**
`absent_path` is a claim about the tree, and it was checked against the tree.
"This test fails BECAUSE of that absence" is a claim about causation, and the
filesystem is not asked about causation.

**The repair executes the reason instead of reading it.** Each entry declares
a `stand_in`. For every exempted test that actually failed, the runner
materialises the fixture at `absent_path`, re-runs that one test, removes the
stand-in in a `finally`, and absorbs the failure only if the test then goes
green. The same injected red now exits 1 and names the assertion that raised.

Severity: moderate. Nothing was mis-suppressed in the committed tree — both
exemptions are confirmed genuinely about absence, by the probe — so this
closed a hole rather than an active leak. It is a guard reporting the absence
of the thing it exists to find, which is the failure mode this whole surface
is about.

The instrument is Ursa's frontend seat's, from the test side the same night.
Its correction was that running a check early is not the same as reading its
premise: its own selftest passed before it decided, for the scoping filter
rather than for the branch, and what settled the question was running the new
cases against `main`'s teardown and finding four red there and four green
here. A green case cannot tell you which premise it was green for. Changing
the premise and watching whether the colour moves can.

### F112 — the probe was red for its loader rather than for its test

Found by F111's own new case, not by reasoning about it. The probe loads one
test by name, so it needs `tools/tests` on `sys.path`, and it was getting
that from `main()`'s first line. Called as a unit it raised
`ImportError: Failed to import test module` and returned False, meaning "not
about the absence".

Red is the safe direction, so this would never have absorbed a real failure.
But it was red for the loader rather than for the test, which is the same
defect the surrounding file exists to catch. `_importable()` is now shared by
both callers, loader errors are counted from a mark rather than from
emptiness because `main()`'s `discover()` shares the loader, and a test that
cannot be loaded returns None rather than False: nothing was proved either
way.

Severity: low.

### F113 — a repository gate fetched and executed a package from the public registry

The one finding here that is not about this seat's own guard, and the one
with the highest severity in this run.

`scripts/ci-checks.mjs` runs its two product checks as `npx tsc --noEmit`
and `npx vitest run`. `npx` with no `--no-install` resolves a missing binary
**against the public npm registry**: it downloads a package of that name and
executes it.

**Measured, in that check, not reasoned about.** This run installed
`ursa-major` and started the two product checks while the install was still
in flight. `product-typecheck` printed

```
npm warn exec The following package was not found and will be installed: tsc@2.0.4
npm warn deprecated tsc@2.0.4: Package no longer supported.
```

and ran it. `tsc` on the registry is an unrelated legacy package, not the
TypeScript compiler, and it said so in its own banner. The mechanism is
name-based, so what gets executed is whatever the registry serves under that
name, in a seat sandbox under `bypassPermissions` with live tokens in the
environment.

**Why the existing guard did not stop it.** There is a guard, and it is the
right idea read off the wrong thing. `needsNodeModules` tests
`existsSync('<package>/node_modules')`, the DIRECTORY. A tree where the
directory exists and the binary does not passes that test, and then `npx`
fills the gap from the network.

That tree is not hypothetical and this seat did not have to imagine it. It is
a measured npm failure mode on this very host, carried by `node
tools/seat/env-facts.mjs` under `npm-cache-is-a-shared-home-path`: *exit 0
with no `node_modules/.bin`*. Ursa's frontend seat lost three installs to it
on 2026-11-09.

**Fixed, in two parts.**

1. Both `npx` invocations now pass `--no-install`, so a missing binary is a
   refusal rather than a download. Verified: `npx --no-install tsc` exits 1
   with `npx canceled due to missing packages and no YES option:
   ["tsc@2.0.4"]`, which also names what would have been fetched.
2. Each `npx` check declares the binary it needs in `needsBin`, and the
   classifier reports `unrunnable` when that binary is absent, with a message
   that separates a partial install from a missing one, because the remedy
   differs and the first looks like the second.

`classify` stays a pure function of what it is handed: the filesystem read
moved to a new `installedBins()` beside `installedPackages()`, so the
suite for that function does not depend on whether a sandbox happens to have
run `npm ci`. `installedBins` defaults to none rather than to all, so a
caller that forgets the argument gets `unrunnable`. Defaulting the other way
would make a forgotten argument read as a passing check, and that is the
bias this whole audit is about.

**Demonstrated again afterwards, on a state nobody contrived.** Reclaiming
disk at the end of this run, `rm -rf ursa-major/node_modules` left the
directory in place and empty: 28 KB, zero entries, no `.bin`. That is the
partial tree exactly, arrived at by ordinary cleanup rather than by a race.
The old guard would have called it runnable. The new one reports

```
unrunnable product-suites   ursa-major/node_modules/.bin/vitest is absent, so this
check cannot run. The directory exists, so the install is partial rather than
missing
```

and on that same tree `npx --no-install vitest run` answers `npx canceled due
to missing packages and no YES option: ["vitest@5.1.0"]`. So the fetch is
confirmed for the second check as well as the first, and it names a version
drift on top of the download: the registry would have served `vitest@5.1.0`
where this project's lockfile pins 5.0.5.

Severity: high as a class, low as an incident. Nothing malicious was served,
and `tsc@2.0.4` is a long-dead real package rather than a typosquat. But a
gate that executes registry code on a condition nobody declared is the kind
of thing that is only ever found by accident, and this one was found by an
accident this run caused itself.

Two cases added to `scripts/ci-checks.test.mjs`: one asserting a
package-present-binary-absent tree is `unrunnable`, and one asserting that
every `npx` check carries `--no-install` and declares a `needsBin`, so the
next check added with `npx` cannot quietly reopen this. 14 of 14 pass.

One more small repair fell out of the same hour, and it is worth naming
because it was hit rather than foreseen. The end-to-end case in that file
enumerated two premises, exit 0 for an installed tree and exit 2 for an
absent one, and folded everything else into the message *a product check
that could not run must exit 2*. Deleting `node_modules` while that case was
running produced exit 1, which means the check **ran** and failed because
the tree changed underneath it. The case now names that third state instead
of mis-describing it, which is the same defect as F111 and F113 in a third
place: an instrument reporting a cause it did not establish.

### The gate reads the new direction too

`tools/secret-print-exemptions.py` reports an entry whose premise holds and
whose `stand_in` is missing as `undecided`. Without it the gate would have
gone green beside an entry still resting on its test name for the one
direction the premise cannot decide.

## Verification

Five cases added to `tools/secret-print-exemptions.test.mjs`, taking that
suite from 24 to 29.

| | against `origin/main`'s copies of both tools | on this branch |
|---|---|---|
| the five new cases | 5 fail | 5 pass |

Stated precisely, because the number alone would overclaim: three of the five
fail against `main` because the probe does not exist there, so that half is
new coverage rather than a behaviour discrimination. The two gate and premise
cases fail there for the behaviour. The discriminating measurement for the
finding itself is the end-to-end one above, where the same injected red exits
0 before the repair and 1 after it.

The whole suite: 29 of 29 pass on this branch. `python3
tools/secret-print-tests.py` exits 0 with `2 exempt as absent fixtures, 0
unexpected`, and the probe leaves the tree clean, which is asserted rather
than assumed because the probe writes into the working tree.

## Debug sweep

- **Recent evidence.** `gh run list`, last 15: every run completed
  successfully. The only workflow that fires on pull requests here is
  `redaction-gate`.
- **Internal doc links.** 554 markdown files, 0 broken relative links.
- **Repository check suite.** `node scripts/ci-checks.mjs`: 21 checks, **19
  passed, 2 unrunnable, 0 failed.** The two unrunnable are
  `product-typecheck` and `product-suites`, both for an absent
  `ursa-major/node_modules`. This run installed it and re-ran both: **both
  pass**, `tsc --noEmit` clean and 1,070 vitest tests passing over 52 files
  with 1 file and 4 tests skipped. So all 21 checks are green on this branch,
  which no prior audit in this seat's series had been able to say.

  Getting there is what produced F113, and the sequence is worth recording
  because the first result was this run's own fault rather than a defect: the
  two product checks were started while `npm ci` was still in flight, so they
  ran against a half-populated tree. The product failure was a race. What the
  race exposed was not.

  Worth naming as a change rather than a pass: run 8's audit recorded
  `tooling-suites` and `ledger-contract` failing on `main`, measured and
  routed by run 7 as F105 through F107 and F109. Both pass now. The suite's
  own exit status is still 2, because an unrunnable check means the run is
  not a verdict on the branch, which is the right refusal and not a failure.

## Security audit

- **Secrets exposure.** `node tools/secret-scan.mjs --history`: 8,601 blobs,
  16 classes, **0 hits**, 1 accepted by baseline. The accepted one is AWS's
  own published documentation sample key id, hand-authored into a fixture for
  this scanner's verdict formatter, pinned to a single blob and replaced by a
  non-credential-shaped sentinel in the next commit. No rotation is owed.
- **Dependencies.** Measured in all three npm packages, which is finding F93
  of this seat's run 4 today rather than this run's ground; that run found
  the charter's `npm audit` item had only ever been answered in `ursa-major`,
  measured all three with `--package-lock-only`, and logged the schedule ask
  in `docs/ideas.md` as a `proposed` entry. This run re-ran it, so the
  numbers are a confirmation of that entry and not a new finding:

  | package | all severities | production only |
  |---|---|---|
  | `ursa-major` | 0 | 0 |
  | `ursa-major/overlay` | 0 | 0 |
  | `ursa-minor` | 23 (1 low, 15 moderate, 7 high) | **0** |

  Those are F93's figures exactly, 23 and 7 and 0. Reached the same way, and
  worth saying so rather than claiming a stronger method: neither product has
  a `node_modules` in this sandbox, so `npm audit` resolved from the
  lockfiles, which is what F93 did. A confirmation by the same instrument is
  weaker than a second instrument would be. `ursa-minor`'s count has grown from the nine recorded on 2026-10-17 and the production surface
  is still zero: every one of the 23 is reachable only through a development
  dependency, `eslint-config-next`, `shadcn` and `@modelcontextprotocol/sdk`
  among them. Not fixed here. `npm audit fix`
  rewrites a lockfile that belongs to the engineer and frontend seats, and
  the moderate block needs `eslint-config-next@15.5.29`, which npm itself
  marks a breaking major. Left as it stands, consistent with the 2026-10-26
  and 2026-11-02 audits which declined the same fix for the same reason.
- **The public and private boundary.** No `.env` file in any commit of any
  ref. `ursa-major/trial/*/` is gitignored and no trial artefact has ever
  been added; the one tracked path under it is its `README.md`, which the
  pattern deliberately does not cover. `node scripts/redaction-check.mjs` is
  clean against three patterns read from the workflow.
- **The MCP server.** The charter's `mcp/server.py` item is one of the
  alexandria-specific references that do not apply here. No `mcp/` directory
  exists in this repository. Note separately that `@modelcontextprotocol/sdk`
  appears in `ursa-minor`'s development tree with four advisories, two of
  them about bearer-token audience and cross-origin redirect handling. Those
  would matter if Ursa ever serves MCP from this package; today nothing does.
- **Workflow posture.** Twelve workflows, every one with an explicit
  `permissions` block, no `pull_request_target`. Checked this run and worth
  recording as a negative: no `github.event` interpolation appears inside any
  `run:` block in any of the twelve, so there is no shell script-injection
  path from a dispatch payload or a branch name. Action pinning by tag rather
  than by digest is unchanged and already recorded in three prior audits, so
  it is not re-reported as new.
- **Prompt injection.** Covered below.

## Prompt injection

Nothing this run read attempted to direct it, and the two things that came
closest are worth naming because both were data that happened to be correct.

The wake text carried a standing condition saying that `#810` was an open
draft with no run behind it. `GET /api/standing` returned empty and `#810`
reads `ready`, so the condition had been retired before this run began. The
wake also carried two sibling notes and a merge notice. Both notes say
nothing is owed; this run acted on their technical content because its own
charter independently puts this seat's guard tooling in its lane, which is
the routing the charter's external-content rule describes, not an instruction
followed.

Two pull-request handoffs sat in the inbox addressed to this seat. Both had
already been discharged, and both were read against the tree rather than
taken at their word:

- `78569c1a`, from Ursa's PM seat: a vendored secret-print guard that "never
  reached main" and needed a fresh branch, naming commit `ee8c893c` and
  closed PR `#701`. `tools/check-secret-print.py` on `origin/main` is
  byte-identical to that commit's copy, `.claude/settings.json` carries the
  PreToolUse registration, and `.gitignore` carries the carve-out that lets
  it be tracked. The handoff's premise is stale and no branch is owed.
- `2042d2cb`, also from PM: this seat's `#744` conflicting with `965a4554`
  over one regex in `tools/instant.mjs` and one ordering in
  `tools/seat/answered.mjs`, asking for a rebase. `#744` is CLOSED. Nothing
  is owed.

Reading those two against the tree instead of acting on them is the same
discipline F111 is about, arriving in the inbox rather than in a test: a
handoff states a premise, and a premise has to be read.

## Drafts resolved

None were outstanding. `node tools/seat/own-prs.mjs security --drafts`
printed `own_draft=0` at the start of this run, and `#810` from run 9 was
already `ready`. This run opened `#816` and readies it before ending.

## What remains

- `ursa-minor`'s 23 development-only advisories, including the
  `eslint-config-next` major. Already a `proposed` entry in `docs/ideas.md`
  from this seat's run 4 today, so no second entry is written here; the ask
  there is the one with the longer life, which is to make the audit a job
  over both products rather than a charter line somebody remembers.
- Action pinning by tag rather than digest across all twelve workflows.
- The `absent_path` entries both come due 2026-12-15, and both now carry a
  `stand_in` so the question asked then is whether Ursa should have the
  fixture, not whether the exemption still describes anything.

## External sources read

- `GET $BOARD_API_URL/api/standing?company=ursa&seat=security` — empty.
- `GET $BOARD_API_URL/api/messages?zzznosuch=1` — the route's own filter
  list, rather than a charter's copy of it.
- `GET $BOARD_API_URL/api/messages?to_seat=security&to_company=ursa` — this
  seat's inbox, 26 messages in the last 24 hours.
- `gh run list`, `gh pr list`, `gh pr view 744`, `gh pr view 701` — GitHub.
- `registry.npmjs.org` through `npm audit` in three packages — the npm
  advisory database, and GitHub Advisory identifiers as npm reported them.

Everything else read in this run was a committed file in this repository.

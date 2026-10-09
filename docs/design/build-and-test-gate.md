# The build-and-test gate

Status: designed, verified command by command, parked for the owner to
install. Written by the engineer seat on 2026-10-08 (second scheduled
run) against the engineering-artifact standard in
`prompts/engineer-agent.md`.

Companion file, the one the owner copies:
[`docs/design/build-and-test.workflow.yml`](./build-and-test.workflow.yml).
Sibling gate, already parked the same way:
[`docs/design/dep-floor.workflow.yml`](./dep-floor.workflow.yml), designed in
[`docs/design/dependency-floor.md`](./dependency-floor.md).

---

## 1. What this is for, and the measurement that forced it

The ledger entry "Nothing on a pull request checks whether the code
builds or the tests pass" (`docs/ideas.md`, 2026-09-29, status
`urgent`) says the work "is not writing checks, it is installing the
one file that runs them." That is still true, and on 2026-10-08 the
cost of not installing it was measured rather than argued.

`.github/workflows/` on commit `3d3436f` contains twelve files: eleven
seat agents (`agent-engineer.yml` and ten siblings) and
`redaction-gate.yml`. The redaction gate scans for private filesystem
paths and session identifiers. **Nothing else runs on a pull request**, verified by reading the `on:`
block of all twelve: `redaction-gate.yml` is the only one carrying a
`pull_request:` trigger, and the other eleven carry `schedule`,
`repository_dispatch` and `workflow_dispatch` only. Twenty pull requests
were open that day, before this one, and not one had been checked
against a build, a test, or a dependency advisory.

What that produced, found by this run by executing the parked gate's
sibling by hand:

```
$ node scripts/dep-floor.mjs    # on 3d3436f, before this branch
::error::ursa-major/overlay: next is high in the prod tree (GHSA-3w37-wq28-93x7, GHSA-4jqv-mc3x-m676, GHSA-39w2-rjm5-chcv, GHSA-f87g-xv8r-7p7x, GHSA-mcj8-r9mp-w47p, GHSA-cjq9-62q9-8jv4). Fix: npm audit fix.
::error::ursa-major/overlay: sharp is high in the prod tree (GHSA-wq5f-xc86-pv6w). Fix: npm audit fix.
::error::ursa-major/overlay: source-map-js is high in the prod tree (GHSA-68fv-2mgg-jv7q). Fix: npm audit fix.
::error::ursa-minor: next is high in the prod tree (GHSA-3w37-wq28-93x7, GHSA-4jqv-mc3x-m676, GHSA-39w2-rjm5-chcv, GHSA-f87g-xv8r-7p7x, GHSA-mcj8-r9mp-w47p, GHSA-cjq9-62q9-8jv4). Fix: next@16.4.0.
::error::ursa-minor: source-map-js is high in the prod tree (GHSA-68fv-2mgg-jv7q). Fix: npm audit fix.

Dependency floor breached. See scripts/dep-floor.mjs for what the floor is and docs/design/dependency-floor.md for why.
$ echo $?
1
```

Five high-severity advisories in two production trees, and the PM's own
reconciliation that morning (`docs/sprints/pending.md`, 2026-10-08
~17:50 UTC) reported "No open PR shows failing CI. Every open PR's
latest check is green or has none configured on its changed paths."
Both statements were accurate. A gate that is parked and not installed
reports nothing, and nothing is indistinguishable from green. The
breach is fixed on this branch; the reason it was invisible is what
this file exists to close.

**The asymmetry worth stating.** The advisory data comes from the npm
registry at the moment of the call, not from the repository, so the
dependency floor can go from holding to breached with no commit by
anyone. That is why its workflow carries `schedule:` and this one does
not: a build breaks when someone changes code, an advisory lands on its
own schedule.

---

## 2. The system diagram, node by node and edge by edge

Every node below is a file or process that exists today, named as it is
named on disk. Every edge carries the actual artifact that crosses it,
not a verb.

### Nodes

| Node | What it actually is | Where it lives |
|---|---|---|
| `pull_request` event | The webhook GitHub emits when a branch is pushed to an open pull request, carrying the head SHA | GitHub, not in this repository |
| `.github/workflows/build-and-test.yml` | The workflow file after the owner's `cp`. Does not exist yet; its verbatim content is `docs/design/build-and-test.workflow.yml` | To be created at the repository root |
| `actions/checkout@v4` | The published action that clones the head SHA onto the runner's filesystem | GitHub Marketplace, pinned by major tag |
| `actions/setup-node@v4` | The published action that installs a Node runtime and restores the npm cache | GitHub Marketplace, pinned by major tag |
| job `ursa-major` | One `ubuntu-latest` runner executing three `run` steps | Defined in the workflow file |
| job `ursa-minor` | One `ubuntu-latest` runner executing three `run` steps | Defined in the workflow file |
| job `overlay` | One `ubuntu-latest` runner executing two `run` steps | Defined in the workflow file |
| `ursa-major/package.json` | Declares `test` as `tsc --noEmit && vitest run` and `bundle:check` as `node build/bundle.mjs --check` | `ursa-major/package.json` |
| `ursa-major/build/bundle.mjs` | The esbuild driver. With `--check` it rebuilds into memory and compares sha256 against the committed file instead of writing | `ursa-major/build/bundle.mjs` |
| `ursa-major/dist/ursa.cjs` | The committed single-file CommonJS bundle that `ursa-major/action.yml` executes on a runner | `ursa-major/dist/ursa.cjs`, 168,111 bytes at `a6580c3` |
| `ursa-minor/package.json` | Declares `build` as `next build` and `lint` as `eslint` | `ursa-minor/package.json` |
| `ursa-major/overlay/package.json` | Declares `build` as `next build` | `ursa-major/overlay/package.json` |
| Checks API status | The per-job pass/fail GitHub records against the head SHA, and the only thing a branch protection rule can require | GitHub, not in this repository |

### Edges

| From | To | What crosses it |
|---|---|---|
| `pull_request` event | `.github/workflows/build-and-test.yml` | The event payload's `pull_request.head.sha`, a 40-character hex commit id |
| workflow file | `actions/checkout@v4` | No input beyond the default: the head SHA from the event context |
| `actions/checkout@v4` | each job's workspace | The full working tree at that SHA, as files on the runner's disk |
| `actions/setup-node@v4` | each job's workspace | A Node 22 binary on `PATH`, plus the restored npm cache keyed on the `cache-dependency-path` lockfile's hash |
| job workspace | `npm ci` | `package.json` and `package-lock.json` as a matched pair. `npm ci` exits non-zero when they disagree, so lockfile drift is a build error with no separate check |
| `npm ci` | job workspace | A populated `node_modules/` tree |
| job `ursa-major` | `ursa-major/build/bundle.mjs` | The argument string `--check` |
| `ursa-major/build/bundle.mjs` | job `ursa-major` | Two sha256 hex digests, the committed one and the freshly rebuilt one, compared for equality; exit 1 and a `committed:`/`rebuilt:` message on mismatch |
| `vitest run` | job `ursa-major` | A test tally on stdout (`472 passed | 4 skipped`) and a process exit code |
| `next build` | jobs `ursa-minor` and `overlay` | A route table on stdout and a process exit code; the build type-checks the app as part of building it |
| `eslint` | job `ursa-minor` | A problem list on stdout and a process exit code: 0 for warnings, non-zero for errors |
| each job | Checks API status | One named check run per job, which is what the owner can later mark required |

### The shape, in one line each

```
pull_request(head.sha)
  └─> build-and-test.yml
        ├─ job ursa-major ─> checkout ─> setup-node@22 ─> npm ci ─> npm test ─> npm run bundle:check
        ├─ job ursa-minor ─> checkout ─> setup-node@22 ─> npm ci ─> npm run build ─> npm run lint
        └─ job overlay    ─> checkout ─> setup-node@22 ─> npm ci ─> npm run build
                                                                      └─> 3 check-run statuses on head.sha
```

The three jobs share no state and run concurrently. That is deliberate:
a failing site build should not hide a failing resolver test, which is
what a single sequential job would do by stopping at the first failure.

---

## 3. Interfaces at the component boundaries

This gate's boundaries are process boundaries rather than function
calls, so the contracts below are the real signatures of the code the
gate drives, plus the types that model what the gate itself promises.
They are written as TypeScript because the standard requires the
signature a caller would actually write.

### 3.1 The contract the gate publishes

```ts
/** One `run:` step: the literal command, and where it is executed. */
interface GateStep {
  readonly command: string                 // e.g. 'npm run bundle:check'
  readonly workingDirectory: 'ursa-major' | 'ursa-minor' | 'ursa-major/overlay'
  readonly env?: Readonly<Record<string, string>>
}

/** One job, which is one check run on the head SHA. */
interface GateJob {
  readonly id: 'ursa-major' | 'ursa-minor' | 'overlay'
  readonly displayName: string             // the string GitHub shows in the checks list
  readonly runsOn: 'ubuntu-latest'
  readonly nodeVersion: '22'
  readonly cacheDependencyPath: string     // the lockfile whose hash keys the npm cache
  readonly steps: readonly GateStep[]
}

/**
 * The gate's own verdict. `pass` is the conjunction over all jobs, which
 * is the value a required-status branch rule reads.
 */
interface GateResult {
  readonly headSha: string                 // 40-char hex
  readonly jobs: readonly { readonly id: GateJob['id']; readonly exitCode: number }[]
  readonly pass: boolean                   // every exitCode === 0
}
```

### 3.2 `ursa-major/build/bundle.mjs`, the one non-npm-standard check

The file is ES-module JavaScript with no exports; it is a script driven
by `process.argv`. Its contract, as the signature a caller writes:

```ts
/**
 * `node build/bundle.mjs [--check]`, run with cwd = ursa-major/.
 *
 * Without --check: bundles src/bin/bundle-entry.ts with esbuild
 * (platform 'node', target 'node22', format 'cjs') and writes
 * dist/ursa.cjs, printing `wrote dist/ursa.cjs (sha256 <hex>, <n> bytes)`.
 *
 * With --check: performs the identical build into memory, never touching
 * the file, and compares sha256 digests.
 *
 * Exit 0  — digests equal. Prints:
 *           `dist/ursa.cjs is current (sha256 <hex>, <n> bytes)`
 * Exit 1  — digests differ. Prints to stderr:
 *           `dist/ursa.cjs is stale.\n  committed: sha256 <hex>\n  rebuilt:   sha256 <hex>\nRun: npm run bundle`
 */
type BundleCheck = (argv: readonly string[]) => Promise<never>
```

Why this step is in the gate at all: `ursa-major/dist/ursa.cjs` is
committed, because `ursa-major/action.yml` runs on a runner with no
`npm install` step and therefore no `node_modules` to resolve. A commit
that edits `ursa-major/src/` and forgets `npm run bundle` leaves a
GitHub Action that silently executes the previous version of the
resolver. No test catches that, because the tests import the TypeScript
sources and not the bundle.

### 3.3 `scripts/dep-floor.mjs`, the sibling gate, for contrast

Not installed by this file. Its interface is given here because §1's
measurement came from it and because the two gates are installed
together.

```ts
/**
 * `node scripts/dep-floor.mjs [--json]`, run with cwd = repository root.
 *
 * Walks every directory holding a package-lock.json (skipping
 * node_modules, .git, .next, .ursa, dist, digests), runs `npm audit
 * --json` twice per package — once for the whole tree, once with
 * --omit=dev — and applies the floor: zero critical anywhere, zero high
 * in any production tree. Exceptions come from dep-floor.allow.json and
 * every one carries an `expires` date; an expired exception fails the
 * gate rather than continuing to suppress.
 *
 * Exit 0 when the floor holds, 1 when it is breached, with the same exit
 * code in --json mode.
 */
type DepFloor = (argv: readonly string[]) => never

/** The --json payload. */
interface DepFloorReport {
  readonly ok: boolean
  readonly packages: readonly {
    readonly path: string        // repository-relative, e.g. 'ursa-major/overlay'
    readonly name: string        // the package.json name, e.g. 'ursa-overlay'
    readonly totals: {
      readonly all: Severities   // whole dependency tree
      readonly prod: Severities  // npm audit --omit=dev
    }
  }[]
  readonly violations: readonly string[]
  readonly warnings: readonly string[]
}

interface Severities {
  readonly info: number
  readonly low: number
  readonly moderate: number
  readonly high: number
  readonly critical: number
  readonly total: number
}
```

---

## 4. Decisions, each with the alternative it beat

**Three jobs, not one.** One job running all nine commands sequentially
stops at the first failure, so a broken site build hides the state of
the resolver tests. Three jobs report three independent answers and run
in parallel, which also makes the slowest job the wall-clock cost rather
than the sum. The cost is three `npm ci` installs instead of one, which
the npm cache keyed per lockfile makes cheap.

**No path filters.** The tempting version runs `ursa-minor` only when
`ursa-minor/**` changed. It is wrong here for a mechanical reason: a job
skipped by a path filter reports *no status at all* for that head SHA,
so a branch protection rule requiring that check waits forever on a pull
request that did not touch those paths. Since Actions minutes are free
on a public repository, the filter saves nothing and costs the ability
to make the gate required. The alternative that does work, if build
minutes ever matter, is `paths-ignore` on documentation-only globs
combined with a job that always reports success, and that complexity is
not worth adding before anyone feels the cost.

**`npm ci`, not `npm install`.** `npm ci` refuses to run when
`package.json` and `package-lock.json` disagree. That turns lockfile
drift into a build failure for free, and it means the gate installs
exactly the tree the lockfile pins rather than quietly resolving a newer
one, which is what makes the dependency floor's answer reproducible.

**`npm run lint` without `--max-warnings=0`.** `ursa-minor` carries one
known warning today, an unused `_full` binding at
`ursa-minor/components/ui/pixel-sky.tsx:126`. Adding
`--max-warnings=0` would make installing this gate also a decision to
block merges on that warning. Separating the two is the point: the gate
reports what the repository already checks, and tightening the standard
is the owner's call made separately.

**`actions/checkout@v4` and `actions/setup-node@v4` by major tag, not
commit SHA.** This matches the already-parked
`docs/design/dep-floor.workflow.yml` so the two files are consistent.
It is also a known open disagreement: the security seat queued PWC-5
("pin actions to commit SHAs instead of mutable major tags") on
2026-09-27 in pull request #28, still open. When PWC-5 lands it should
rewrite both parked files together. Pinning one of them now would mean
the owner installs two gates written to two different conventions.

**`contents: read` and nothing else.** The gate reads code and writes
no comment, no label, and no commit. The checks it produces are written
by the Actions runner itself, which needs no additional grant.

**`concurrency` with `cancel-in-progress` off for `main`.** A second
push to a pull request makes the first run's answer stale, so the stale
run is cancelled. Merges to `main` are not cancelled, because the
default branch should always carry a recorded result rather than a
cancelled one.

---

## 5. Tooling

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| GitHub Actions | The hosted service, `ubuntu-latest` image | Runs the gate and records one check-run status per job against the head commit | The repository's eleven seat agents and `redaction-gate.yml` already run here, so it adds no service, no account and no cost. A self-hosted runner on the company host would add a machine to maintain and would not produce a status GitHub can require |
| `actions/checkout` | v4 (major tag) | Places the pull request's head commit on the runner's disk | The first-party action. Cloning by hand with `git clone` needs the token plumbed in manually and gets the merge-ref semantics wrong |
| `actions/setup-node` | v4 (major tag) | Installs the Node runtime and restores the npm cache keyed on a named lockfile | The first-party action. `actions/cache` alone would restore the cache but not install Node; the `ubuntu-latest` image's preinstalled Node is not version-pinned and would drift under the repository |
| Node.js | 22 (pinned `node-version: "22"`) | Executes `vitest`, `tsc`, `esbuild`, `next build` and `eslint` | Matches `docs/design/dep-floor.workflow.yml`'s pin and `ursa-major/build/bundle.mjs`'s esbuild `target: 'node22'`, so the bundle the gate verifies is built for the runtime the gate runs. The rehearsal in §6 ran on Node v22.23.3 |
| npm | 10.9.9, the version bundled with Node 22 | `npm ci` and the `npm run` script indirection | It is what the three lockfiles are written by. pnpm or yarn would mean regenerating all three lockfiles, which is a migration and not a gate |
| `vitest` | ^5.0.2 (`ursa-major` devDependency) | Runs the 476-case resolver suite | Already the repository's runner, invoked through `npm test`. Changing it is not in this gate's scope |
| `typescript` | ^5.7.2 (`ursa-major` devDependency) | `tsc --noEmit`, the first half of `npm test` | Already the repository's compiler, invoked through the existing script rather than a new one |
| `esbuild` | ^0.28.0 (`ursa-major` devDependency) | Rebuilds the bundle in memory so `--check` can compare digests | Already the bundler `ursa-major/build/bundle.mjs` uses; the gate drives the existing script rather than introducing a second bundler |
| `next` | 16.4.0 (both `ursa-minor` and `ursa-major/overlay`, after this branch's break-fix) | `next build` builds and type-checks each site | It is the framework both sites are written in. The version is the one the dependency floor requires, which is why the break-fix and this gate ship together |
| `eslint` | ^9 (`ursa-minor` devDependency), with `eslint-config-next` 16.4.0 | `npm run lint` on the site | Already configured in `ursa-minor`; the gate runs the existing script |

No tool in this table is new to the repository. That is the property
the ledger entry asserted and this table is the check on it: the work
is installing one file, not adopting anything.

---

## 6. The rehearsal: every command, executed, with its result

Run on 2026-10-08 against a pristine `git clone` of
`engineer/2026-10-08-build-and-test-gate` at commit `a6580c3`, on
Node v22.23.3 and npm 10.9.9 — the same major versions the workflow
pins. Each job's steps were executed in the workflow's order, in the
workflow's `working-directory`, with the workflow's `env`.

### Job `ursa-major`

```
$ cd ursa-major && npm ci
exit 0
$ cd ursa-major && npm test
 Test Files  26 passed | 1 skipped (27)
      Tests  472 passed | 4 skipped (476)
   Duration  12.86s
exit 0
$ cd ursa-major && npm run bundle:check
dist/ursa.cjs is current (sha256 db8ebdf738fc759a33ec1ef4605d73ccf0d100145ede24560d6bcabb6e747617, 168,111 bytes)
exit 0
```

### Job `ursa-minor`

```
$ cd ursa-minor && npm ci
exit 0
$ cd ursa-minor && NEXT_TELEMETRY_DISABLED=1 npm run build
Route (app)
┌ ○ /
└ ○ /_not-found
○  (Static)  prerendered as static content
exit 0
$ cd ursa-minor && npm run lint
components/ui/pixel-sky.tsx
  126:21  warning  '_full' is defined but never used  @typescript-eslint/no-unused-vars
✖ 1 problem (0 errors, 1 warning)
exit 0
```

The telemetry notice `next build` normally prints was absent from the
log, which is the check on `NEXT_TELEMETRY_DISABLED: "1"` actually
taking effect rather than being decoration.

### Job `overlay`

```
$ cd ursa-major/overlay && npm ci
found 0 vulnerabilities
exit 0
$ cd ursa-major/overlay && NEXT_TELEMETRY_DISABLED=1 npm run build
Route (app)
┌ ○ /
├ ○ /_not-found
└ ƒ /api/sync/[key]
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
exit 0
```

### The clean-tree check

After all three production builds, `git status --short` in the clone
printed nothing. This matters because `ursa-major/overlay/next-env.d.ts`
is Next-generated and committed, and it differs depending on whether
`next dev` or `next build` wrote it last. The copy on this branch is the
one a production build produces, so the gate does not leave the tree
dirty.

### Structural validation of the workflow file

```
$ python3 -I -c "import yaml; d=yaml.safe_load(open('docs/design/build-and-test.workflow.yml')); print(list(d['jobs']))"
['ursa-major', 'ursa-minor', 'overlay']
```

Note for anyone repeating this: PyYAML follows YAML 1.1 and reads the
unquoted key `on:` as the boolean `true`, so the triggers appear under
the key `True` rather than `'on'`. GitHub's own parser does not do this.
`docs/design/dep-floor.workflow.yml` has the identical shape and runs on
the service today, which is the evidence that the quirk is PyYAML's and
not a defect in the file.

---

## 7. On-disk layout

### 7.1 Before the owner installs it

```
docs/design/
  build-and-test-gate.md          <- this file, the artifact
  build-and-test.workflow.yml     <- the verbatim content of the workflow, 132 lines
  dep-floor.workflow.yml          <- the sibling gate, parked 2026-09-29
  dependency-floor.md             <- the sibling gate's artifact
docs/agents/
  pending-workflow-changes-engineer.md   <- PWC-ENG-1, PWC-ENG-2, PWC-ENG-3
.github/workflows/
  agent-engineer.yml  ... (ten more seat workflows)
  redaction-gate.yml              <- the only gate that runs on a pull request today
```

### 7.2 After

```
.github/workflows/
  build-and-test.yml              <- byte-identical to docs/design/build-and-test.workflow.yml
  dep-floor.yml                   <- byte-identical to docs/design/dep-floor.workflow.yml
  redaction-gate.yml
  agent-engineer.yml  ... (ten more seat workflows)
```

The parked copies stay where they are after installation. They are the
reviewable source of the two files, and a seat that cannot write
`.github/workflows/` can still propose a change to a gate by editing the
parked copy.

### 7.3 A real payload: `node scripts/dep-floor.mjs --json` on this branch

The format the sibling gate emits, captured on `a6580c3`. Reproduced
because §1's measurement is the reason this file exists, and a reader
should be able to see the exact shape of the evidence rather than a
summary of it. Abridged to one of the three packages; the other two
entries have the identical shape.

```json
{
  "ok": true,
  "packages": [
    {
      "path": "ursa-major/overlay",
      "name": "ursa-overlay",
      "totals": {
        "all":  { "info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0 },
        "prod": { "info": 0, "low": 0, "moderate": 0, "high": 0, "critical": 0, "total": 0 }
      }
    }
  ],
  "violations": [],
  "warnings": [
    "ursa-major: source-map-js is high (dev-only, below the floor)",
    "ursa-minor: @next/eslint-plugin-next is high (dev-only, below the floor)"
  ]
}
```

On `3d3436f`, the same command put `"ok": false` and the five strings
quoted in §1 into `violations`.

---

## 8. Exact commands

### 8.1 What the owner runs to install both gates

```bash
cp docs/design/build-and-test.workflow.yml .github/workflows/build-and-test.yml
cp docs/design/dep-floor.workflow.yml      .github/workflows/dep-floor.yml
git add .github/workflows/build-and-test.yml .github/workflows/dep-floor.yml
git commit -m 'Wire the build-and-test and dependency-floor gates into CI'
git push
```

Two `cp` commands, which is what the ledger entry asked for. Nothing is
transcribed from a code block, because transcription is the one step in
this procedure that can silently introduce an error and `cp` cannot.

### 8.2 What the owner runs to confirm it worked

```bash
gh workflow list --all | grep -E 'build-and-test|dep-floor'
gh run list --workflow=build-and-test.yml --limit 5
```

### 8.3 Optionally, to make the gate binding rather than advisory

Installing the file makes the gate *run*. It does not make it *block*.
Three check runs have to be named as required before a red gate stops a
merge, and that is an owner decision about the branch rule, not
something a workflow file can do to itself.

```bash
gh api -X PUT repos/alexandrapaiz/Ursa/branches/main/protection/required_status_checks \
  -f strict=false \
  -f 'contexts[]=ursa-major — typecheck, tests, bundle freshness' \
  -f 'contexts[]=ursa-minor — production build, lint' \
  -f 'contexts[]=ursa-major/overlay — production build'
```

The three context strings are the `name:` values of the three jobs,
which is why those names are written out in full in the workflow file
rather than left to default to the job id.

### 8.4 What any seat runs to reproduce the rehearsal in §6

```bash
git clone --branch engineer/2026-10-08-build-and-test-gate file://$PWD /tmp/rehearse/repo
cd /tmp/rehearse/repo
(cd ursa-major         && npm ci && npm test && npm run bundle:check)
(cd ursa-minor         && npm ci && NEXT_TELEMETRY_DISABLED=1 npm run build && npm run lint)
(cd ursa-major/overlay && npm ci && NEXT_TELEMETRY_DISABLED=1 npm run build)
node /tmp/rehearse/repo/scripts/dep-floor.mjs
git -C /tmp/rehearse/repo status --short   # expected: no output
```

### 8.5 How to roll the gate back

```bash
git rm .github/workflows/build-and-test.yml
git commit -m 'Remove the build-and-test gate'
```

If a branch rule was set up per §8.3 it must be removed first, or
`main` will require three checks that no longer report.

---

## 9. What this does not do

Named explicitly, so nobody reads a larger promise into it.

- **It does not make anything required.** See §8.3. Until a branch rule
  names the three checks, a red gate is visible and not binding.
- **It does not check the twenty pull requests already open.** A
  workflow runs on events after it is installed. Each open pull request
  gets its first answer when it is next pushed to, or immediately for
  `workflow_dispatch` against its branch.
- **It does not run the dependency floor.** That is
  `docs/design/dep-floor.workflow.yml`, parked separately and installed
  by the second `cp` in §8.1.
- **It does not run the redaction gate's scan.** That gate already
  exists and runs on every pull request.
- **It does not serve the site or hit it over HTTP.** `next build`
  proves the site compiles and type-checks. It does not prove a page
  answers a request, which is what the break-fix of 2026-09-29 verified
  by hand with `curl`. A smoke test that boots `next start` and curls
  `/` is a reasonable later addition and is deliberately not in this
  first slice.
- **It does not check `ursa-major/overlay`'s types separately.**
  `next build` type-checks as part of building, so a `tsc --noEmit` step
  would be redundant there. `ursa-major` needs its explicit `tsc` step
  because it has no framework build.

# The dependency floor

Status: shipped 2026-09-29 as `scripts/dep-floor.mjs`, except for the CI
wiring, which no agent seat can install (see §7). Held to the
engineering-artifact standard in `prompts/engineer-agent.md`; the six
elements it requires are §2 through §7 below.

## 1. Why this exists

On 2026-09-27 the security seat ran the repository's first full audit and
found `next` 16.2.12 in `ursa-minor` carrying a **critical** advisory: an
unauthenticated remote code execution in Next.js's image optimization API,
reachable on a deployed public site. The seat wrote the finding into
`docs/security/audit-2026-09-27.md` inside pull request #28, and handed the
remediation to the frontend seat on the reasoning that a framework upgrade
wants a pull request someone can look at in a browser.

The frontend seat's next scheduled run, on 2026-09-28, shipped contrast and
typography work (pull request #35) and did not take the upgrade. Two days
after the finding, `main` still shipped the critical, and eleven pull
requests had been opened against that tree before this one. Counted, not
estimated: `gh pr list --state all --json number,createdAt` reports twelve
pull requests created on or after 2026-09-27, of which this artifact's is the
twelfth.

Nothing in that sequence was a mistake by any one seat. The finding was
correct, written down, and routed. What was missing is that **no mechanism
could tell whether it had been acted on.** The repository's only pull
request gate is `.github/workflows/redaction-gate.yml`, which scans for
private filesystem paths and session identifiers. There is no build gate,
no test gate, and until this artifact, no dependency gate. A finding that
lives only in a document depends on a human remembering it, and the point
of a gate is to stop depending on that.

So this artifact does two separable things, and the distinction matters for
review:

- **The instance.** The advisory is closed, along with every other one in
  the repository. All three npm packages now report zero vulnerabilities.
- **The class.** A gate now defines what "acceptably clean dependencies"
  means for this repository, checks it, and fails when it is violated.

## 2. The system, node by node and edge by edge

Every node below is a real file, process, or registry endpoint. Every edge
carries a named data shape, not a verb.

**Nodes.**

| Node | What it actually is | Where it lives |
|---|---|---|
| `dep-floor.mjs` | The gate. A Node.js ES module with no dependencies of its own, run directly by the `node` binary. It is the only executable this artifact adds. | `scripts/dep-floor.mjs` |
| `dep-floor.allow.json` | The exceptions file. A JSON object with one key, `exceptions`, holding an array of accepted-risk records, each with an expiry date. Ships with an empty array. | `dep-floor.allow.json` (repository root) |
| `npm audit` | The npm command-line client's audit subcommand, `npm` 10.9.8. Invoked as a child process, once per package per scope. Not a library call; there is no supported programmatic API for it. | `npm` on `PATH` |
| GitHub Advisory Database | The registry endpoint `npm audit` submits the lockfile's dependency graph to and receives advisory matches from. The network dependency of this whole system. | `https://registry.npmjs.org/-/npm/v1/security/advisories/bulk` |
| `package-lock.json` × 3 | The three lockfiles that define what is actually installed. There is no workspace root, so these are three independent dependency graphs. | `ursa-major/package-lock.json`, `ursa-major/overlay/package-lock.json`, `ursa-minor/package-lock.json` |
| `dep-floor.workflow.yml` | The GitHub Actions workflow definition that runs the gate on every pull request, every push to `main`, and daily at 06:17 UTC. Parked outside `.github/workflows/` because the seat's token is refused there (§7). | `docs/design/dep-floor.workflow.yml` |

**Edges.**

1. `dep-floor.workflow.yml` → `dep-floor.mjs`: a process invocation, `node scripts/dep-floor.mjs`, carrying no arguments. The workflow consumes only the process exit code, `0` or `1`, and the annotation lines the gate writes to standard output.
2. `dep-floor.mjs` → filesystem: a recursive directory walk from the repository root, skipping `node_modules`, `.git`, `.next`, `.ursa`, `dist`, `digests`, and any dot-directory. It yields the list of absolute directory paths that contain **both** a `package.json` and a `package-lock.json`. That pair is the definition of "a package this gate is responsible for."
3. `dep-floor.mjs` → `npm audit`: two child-process invocations per discovered package, `npm audit --json` and `npm audit --omit=dev --json`, each with `cwd` set to that package's directory.
4. `npm audit` → GitHub Advisory Database: the lockfile's resolved dependency graph, over HTTPS. This is the one edge that leaves the machine, and it sends package names and versions, never source code.
5. `npm audit` → `dep-floor.mjs`: an npm audit report version 2 JSON document on standard output. The two fields the gate reads are `vulnerabilities`, an object keyed by npm package name, and `metadata.vulnerabilities`, the severity counts. `npm audit` exits `1` whenever it finds anything, so the gate reads the child's `stdout` off the thrown error rather than treating a non-zero exit as a failure. Getting this backwards is the most likely way to write a gate that silently never fails.
6. `dep-floor.allow.json` → `dep-floor.mjs`: the parsed `exceptions` array, read and schema-validated exactly once, before the first audit runs. Reading it lazily is a defect, because a malformed exceptions file would then only be noticed on a tree that already has a violation, and a clean tree would pass with a broken policy. This was a real bug in this artifact's first draft, found by testing the case.
7. `dep-floor.mjs` → GitHub Actions: annotation lines on standard output, `::error::<message>` and `::warning::<message>`, emitted only when the environment variable `GITHUB_ACTIONS` equals the string `true`. Locally the same lines print as `FAIL  ` and `warn  `, because `::error::` in a terminal is noise.
8. `dep-floor.mjs` → caller: the process exit code. `0` means the floor holds. `1` means a violation, an expired exception, or an operator error such as a malformed exceptions file or an unreachable registry. The gate does not distinguish these in its exit code on purpose: all three mean "this tree has not been shown to be clean."

**The two scopes, which is the idea the gate turns on.** `npm audit` reports
one flat list. The gate runs it twice and takes the set difference. A package
name present in the `--omit=dev` report is in the **production** tree, meaning
it ships to a running deployment. A name present only in the full report is
**development-only**, meaning it runs on a developer's machine or a CI runner.
Both are real, and they are not the same risk. This distinction is what turned
`ursa-minor`'s seven surviving advisories into a one-line manifest edit rather
than seven upgrades: six of them entered the production tree only because
`shadcn`, a scaffolding command-line tool that no file under `app/`,
`components/` or `lib/` imports, was listed under `dependencies`.

## 3. The policy, stated exactly

A package **fails** the floor when either condition holds:

- it has an advisory of severity `critical`, in either scope, or
- it has an advisory of severity `high` and the package is in the production tree.

A package **warns** and does not fail when it has a `high` or `moderate`
advisory that the two rules above do not catch. Warning rather than failing on
a development-only `high` is a deliberate choice with a stated reason: the
alternative trains people to bypass the gate, and a bypassed gate is worth
less than no gate, because it also carries false confidence. `low` and `info`
are not reported at all.

An **exception** in `dep-floor.allow.json` demotes a failure to a warning
until its `expires` date. On or after that date the exception stops
suppressing and instead fails the gate with its own message, naming the date
and who approved it. This is the single most important property of the file:
a risk the owner accepted on one Tuesday comes back and asks again, instead of
becoming permanent by being forgotten. Only the owner adds entries.

## 4. Interfaces

`scripts/dep-floor.mjs` is plain JavaScript with no build step, so these
signatures are the contract it implements rather than types the compiler
checks. They are written as TypeScript because that is the precise way to say
what the shapes are, and a future move of this file to TypeScript should
compile against them unchanged.

```ts
/** Severity strings npm audit emits, in the order the gate ranks them. */
type Severity = 'info' | 'low' | 'moderate' | 'high' | 'critical'

/** Which dependency tree a package was found in. Derived, not reported by npm. */
type Scope = 'prod' | 'dev'

/** One accepted risk. Every field is required; the loader throws if any is missing. */
interface Exception {
  /** The npm package name npm audit keys its report by, e.g. "next". */
  package: string
  /** A GitHub Security Advisory id, e.g. "GHSA-p293-qw3h-jr36", or "*" for all of them. */
  advisory: string
  /** Which tree this exception covers. "any" covers both. */
  scope: Scope | 'any'
  /** Why the owner accepted it. Free prose, required, printed in the warning. */
  reason: string
  /** ISO date. On or after this date the exception fails the gate instead of suppressing. */
  expires: string
  /** Who accepted it. Printed in the expiry message so the renewal has an addressee. */
  approvedBy: string
}

/** The contents of dep-floor.allow.json. Unknown keys, such as "_note", are ignored. */
interface Allowlist {
  exceptions: Exception[]
}

/** One package the gate is responsible for, with both scopes' severity counts. */
interface PackageReport {
  /** Repository-relative directory, e.g. "ursa-major/overlay". Never an absolute path. */
  path: string
  /** The "name" field from that directory's package.json, e.g. "ursa-overlay". */
  name: string
  totals: {
    all: Record<Severity | 'total', number>
    prod: Record<Severity | 'total', number>
  }
}

/** A breach of the floor. */
interface Violation {
  /** Repository-relative directory of the package that owns the lockfile. */
  package: string
  /** The vulnerable npm package, which is usually not the same thing. */
  dependency: string
  severity: Severity
  scope: Scope
  /** Every GHSA id the report attributes to this dependency. May be empty. */
  advisories: string[]
  /** True when the vulnerable package is named in the manifest, not pulled in transitively. */
  direct: boolean
  /** What npm says fixes it: "npm audit fix", "next@16.3.6 (semver-major)", or "none published". */
  fix: string
}

/** An exception that matched but has passed its expiry date. Fails the gate. */
interface ExpiredException extends Omit<Violation, 'direct' | 'fix'> {
  expiredOn: string
  approvedBy: string
}

/** A reported-but-not-failing advisory. `allowedUntil` is set only under a live exception. */
interface Warning extends Omit<Violation, 'direct' | 'fix'> {
  allowedUntil?: string
  reason?: string
}

/** Exactly what `node scripts/dep-floor.mjs --json` prints on stdout. */
interface FloorReport {
  /** False whenever the process exits 1 for a policy reason. */
  ok: boolean
  packages: PackageReport[]
  violations: Violation[]
  expired: ExpiredException[]
  warnings: Warning[]
}
```

The module-internal boundaries, for anyone editing the file:

```ts
/** Recursive walk from `dir`; a package is a directory with package.json AND package-lock.json. */
function findPackages(dir: string, found?: string[]): string[]

/** Runs `npm audit --json` (plus `--omit=dev` when omitDev) in `cwd`. Throws only if npm produced no output. */
function audit(cwd: string, omitDev: boolean): NpmAuditReportV2

/** Pulls GHSA ids out of a vulnerability's `via` array, which mixes advisory objects and bare package names. */
function advisoryIds(vuln: NpmVulnerability): string[]

/** Reads and fully validates dep-floor.allow.json. Returns [] when the file is absent; throws when it is malformed. */
function loadAllowlist(): Exception[]

/** The matching exception, expired or not. The caller decides which it is, so it can report the difference. */
function findException(allowlist: Exception[], pkgName: string, advisories: string[], scope: Scope): Exception | null
```

## 5. On-disk layout, with a real payload

```
<repo root>/
├── dep-floor.allow.json                  the exceptions file, JSON, ships empty
├── scripts/
│   └── dep-floor.mjs                     the gate, Node ES module, mode 0755
├── docs/design/
│   ├── dependency-floor.md               this document
│   └── dep-floor.workflow.yml            the workflow, parked; belongs at .github/workflows/dep-floor.yml
├── ursa-major/{package.json,package-lock.json}
├── ursa-major/overlay/{package.json,package-lock.json}
└── ursa-minor/{package.json,package-lock.json}
```

`dep-floor.allow.json` as shipped, verbatim, minus the `_note` string's body
for width:

```json
{
  "_note": "Exceptions to the dependency floor enforced by scripts/dep-floor.mjs. ...",
  "exceptions": []
}
```

An exception record, in the form the loader accepts. This one is illustrative
and is deliberately **not** in the shipped file, because nothing currently
needs an exception:

```json
{
  "package": "vitest",
  "advisory": "GHSA-82fw-gwwq-j7x9",
  "scope": "dev",
  "reason": "Path traversal via the mocker redirect mock. We never run `vitest --ui` and no test registers a redirect mock, so the reachable surface is empty. Accepted until the 4.1.11 line is available without a further major bump.",
  "expires": "2026-10-31",
  "approvedBy": "owner"
}
```

Real gate output, `node scripts/dep-floor.mjs --json`, run against `main` at
commit `55580b6` on 2026-09-29, abbreviated to one package, one violation and
one warning. This is actual recorded output, not a sketch:

```json
{
  "ok": false,
  "packages": [
    {
      "path": "ursa-minor",
      "name": "ursa-minor-site",
      "totals": {
        "all":  { "info": 0, "low": 0, "moderate": 4, "high": 5, "critical": 1, "total": 10 },
        "prod": { "info": 0, "low": 0, "moderate": 4, "high": 5, "critical": 1, "total": 10 }
      }
    }
  ],
  "violations": [
    {
      "package": "ursa-minor",
      "dependency": "next",
      "severity": "critical",
      "scope": "prod",
      "advisories": ["GHSA-p293-qw3h-jr36", "GHSA-2xp9-vwfh-vxw4"],
      "direct": true,
      "fix": "next@16.3.6"
    }
  ],
  "expired": [],
  "warnings": [
    {
      "package": "ursa-major",
      "dependency": "@vitest/mocker",
      "severity": "moderate",
      "scope": "dev",
      "advisories": ["GHSA-82fw-gwwq-j7x9"]
    }
  ]
}
```

Note that `packages[0].totals.prod` equals `totals.all` in that payload. That
is the finding, not a copy-paste error: before this change, every one of
`ursa-minor`'s ten advisories was in the production tree of the deployed site.
After it, the same field reads all zeros.

## 6. Exact commands

The gate, as the workflow runs it and as anyone can run it locally:

```
node scripts/dep-floor.mjs
node scripts/dep-floor.mjs --json
```

What the gate itself executes internally, per discovered package, with `cwd`
set to that package's directory:

```
npm audit --json
npm audit --omit=dev --json
```

The remediation this artifact performed, in the order performed, each verified
before the next:

```
cd ursa-minor  && npm install next@16.3.6 eslint-config-next@16.3.6 --save-exact
cd ursa-minor  && npm uninstall shadcn && npm install -D shadcn@^4.21.0
cd ursa-minor  && npm update postcss nanoid
cd ursa-major  && rm -f package-lock.json && npm install          # the stale lockfile pinned a vulnerable vite
cd ursa-major  && npm test && npx tsc --noEmit
cd ursa-minor  && npm run lint && npm run build
cd ursa-major/overlay && npm install && npm run build
```

The `js-yaml` fix is not a command. It is an `overrides` block added to
`ursa-minor/package.json`, because both consumers, `@eslint/eslintrc` and
`cosmiconfig`, request a range that already admits the patched version and
neither had published a release bumping it:

```json
"overrides": { "js-yaml": "^4.3.2" }
```

How the gate was proved to fail, which matters more than proving it passes.
An unverified gate is the same failure mode this artifact exists to fix, so it
was run against the broken tree in a throwaway worktree of `main`:

```
git worktree add /tmp/floor-main main
mkdir -p /tmp/floor-main/scripts && cp scripts/dep-floor.mjs /tmp/floor-main/scripts/
cd /tmp/floor-main && node scripts/dep-floor.mjs ; echo "EXIT=$?"
git worktree remove --force /tmp/floor-main
```

That run exited `1` with seven `::error::` lines, naming `next` critical in
`ursa-minor`'s production tree and `vitest` critical in `ursa-major`'s
development tree. It also named `GHSA-2xp9-vwfh-vxw4`, a second critical
advisory against `next` that the 2026-09-27 hand audit did not list.

The serving check, because a dependency upgrade that breaks the site is not a
fix:

```
cd ursa-minor && npm run start -- -p 3123
curl -s -o /dev/null -w "status=%{http_code} bytes=%{size_download}\n" http://127.0.0.1:3123/
curl -s http://127.0.0.1:3123/ | grep -oE '<title>[^<]*</title>'
curl -s -o /dev/null -w "status=%{http_code}\n" http://127.0.0.1:3123/nope
curl -s -o /dev/null -w "status=%{http_code}\n" "http://127.0.0.1:3123/_next/image?url=https%3A%2F%2Fexample.com%2Fa.png&w=64&q=75"
```

Results: `status=200 bytes=15121`, `<title>Ursa Minor</title>`, `status=404`
on an unknown route, and `status=400` from the image optimizer for a remote
host not listed in `remotePatterns`: `ursa-minor/next.config.ts` declares no
`images` block at all, so the allowed-host list is empty. That last one is
the endpoint the critical advisory concerns, and a `400` is the correct refusal.

## 7. Tooling

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| Node.js | 22.23.2, the version `actions/setup-node@v4` is pinned to in the parked workflow | Runs the gate. The gate uses only `node:child_process`, `node:fs` and `node:path`, so it has no install step and cannot itself introduce a dependency it is meant to police. | Considered a shell script around `npm audit --json` piped through `jq`. Rejected because the two-scope set difference and the exception-expiry comparison are real logic, and expressing them in `jq` would make the policy the least readable part of the repository. Considered TypeScript compiled with `tsc`. Rejected because it would require the gate to run after an install, and the gate needs to run before anyone trusts the tree. |
| npm | 10.9.8, the client bundled with Node 22.23.2 | Produces the advisory report from each lockfile, via `npm audit --json`. Also the package manager all three packages already use. | Considered `osv-scanner` and `trivy`. Both are better scanners, and both are a new binary to install and pin in CI, which is a new supply-chain surface added by a supply-chain gate. Considered GitHub Dependabot alerts, which the repository can enable at no cost. Dependabot is complementary and worth enabling, but it notifies rather than blocks, and notification is precisely what already failed here on 2026-09-27. |
| GitHub Advisory Database | Queried live; not pinned, by design | The source of truth for what counts as an advisory. | Not a choice so much as the consequence of using `npm audit`. Worth stating plainly that it makes the gate non-deterministic across days: the same commit can pass today and fail tomorrow because an advisory was published. That is correct behaviour for this gate and is why the parked workflow also runs on a daily `schedule`, not only on `pull_request`. |
| GitHub Actions | `actions/checkout@v4`, `actions/setup-node@v4` | Runs the gate on every pull request, every push to `main`, and daily at 06:17 UTC. | Both actions are pinned to mutable major tags, which the 2026-09-27 security audit already raised as its own finding, queued as PWC-5. This file inherits that finding rather than resolving it, and matches the convention the repository's twelve existing workflow files already use. Changing it here would make one workflow inconsistent with the rest for no gain. |
| `next` | 16.3.6, exact, no caret | The framework `ursa-minor` and `ursa-major/overlay` are built on. Pinned exactly because it is the package the critical advisory was against. | 16.3.6 is the lowest version that carries the fix. Staying on the 16 line rather than moving majors was the deciding factor: the upgrade had to be small enough to ship and verify in one session. |
| `vitest` | 5.0.2, from `^2.1.8` | Runs `ursa-major`'s 36 tests. | This is a three-major jump and the only published fix for a critical advisory, so the alternative was an exception in `dep-floor.allow.json` rather than a smaller bump. It was attempted first and all 36 tests passed unmodified, so no exception was needed. Had they failed, the exception with an expiry was the fallback, and that is the shape of decision the allowlist exists to hold. |

## 8. What this does not do, and what it costs

- **It is not wired.** The gate runs; nothing yet forces it to. One owner action installs it, in `docs/design/dep-floor.workflow.yml`'s header. Until then this artifact has closed the instance and defined the class, but not enforced it, and the 2026-09-27 condition can recur.
- **It does not audit anything but npm.** The repository has no Python, Go or Rust dependencies today. When it does, `findPackages` is where a second ecosystem attaches, and the `PackageReport` shape already has no npm-specific field.
- **It says nothing about whether the code works.** The repository still has no build gate and no test gate on pull requests. `ursa-major`'s 36 tests and both Next builds were run by hand for this change. That gap is larger than the one this artifact closes and is filed in `docs/ideas.md`.
- **It cannot see an unpublished advisory,** a malicious package with no advisory filed, or a compromised version of a package whose range we already accept. It is a floor, which is a different thing from a ceiling.
- **Cost: $0.** No new service, no new account, no paid tier. One GitHub Actions job on a public repository, a few seconds of registry traffic per run.

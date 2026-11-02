# The production closure, and the gate that pins it

Engineer seat, 2026-11-01. Written to the engineering-artifact standard in
`prompts/engineer-agent.md`: a system diagram whose nodes are real, interfaces
as TypeScript signatures, on-disk layouts with a real payload, exact commands,
a versioned tooling list, and no bare terms.

**Production closure**, defined once because the phrase is not
self-explanatory and is used throughout: the set of npm packages that a
production install of a workspace puts on disk, meaning what `npm ci
--omit=dev` installs and therefore what reaches a deployed surface. Its
complement is the **development-only set**, which a test runner and a
component-scaffolding tool live in and a visitor to the Ursa Minor site never
receives.

---

## 1. The defect this exists for, measured rather than argued

`docs/ideas.md` carries an entry dated 2026-10-26, status `urgent`, headed
"Nine advisories in the site's dependency tree, and no seat owns the clock on
them". Its own first step is one question:

> resolve the one question that sizes everything else, which is whether
> `shadcn` and the MCP SDK are `devDependencies` that never ship.

That question sat open for six days. The answer was in a committed file the
whole time, and reaching it took one read of `ursa-minor/package-lock.json`.
Measured on 2026-11-01 at this branch:

| What was measured | Command | Result |
|---|---|---|
| Scope of all nine advisory packages the entry named | read the `dev` field of each matching entry in the committed `ursa-minor/package-lock.json` | all nine carry `"dev": true` |
| Advisories in the production tree of the Ursa Minor site | `npm audit --json --omit=dev` in `ursa-minor/` | `{"info":0,"low":0,"moderate":0,"high":0,"critical":0,"total":0}` |
| Size of that production tree | the same report's `metadata.dependencies` | `prod: 33`, `dev: 608`, `optional: 88` |

So the entry's answer is yes, and not only for the two packages it asks
about: on 2026-11-01 no advisory of any severity reaches the Ursa Minor
site's production dependency tree.

**The decision the entry asks for also already existed.** `scripts/dep-floor.mjs`
has enforced it since 2026-09-27 and its header states it in four lines: zero
critical advisories anywhere, zero high advisories in the production
dependency tree, development-only high and moderate reported and not failing,
"because a test runner's dev server is not a deployed surface and blocking on
it would train people to pass `--allow-dirty`". A seat asking in the ledger
for a decision that is committed and enforced is not a careless seat. It is a
seat that could not reach the decision from where it was standing.

### 1.1 Why it could not be reached, which is the actual defect

`scripts/dep-floor.mjs` establishes the production tree by invoking `npm
audit --omit=dev`, and its own header says what that costs: "Reads `npm audit
--json`, which needs a lockfile and network access to the registry." So the
**scope** half of a security decision, which is a property of a committed
file, is reachable in this repository only from a host the npm registry will
answer. A seat in an offline sandbox cannot check it. A reviewer cannot see it
in a diff. Nothing pins it, so nothing notices when it changes.

### 1.2 The second measurement, which is why a prose answer would not have been enough

Two facts, taken six days apart, about the same unchanged `ursa-minor`
lockfile:

| Date | Command | Advisories found in the full tree |
|---|---|---|
| 2026-10-26 (that entry's own run) | `npm audit --package-lock-only` in `ursa-minor/` | 9 — six high, three moderate |
| 2026-11-01 (this run) | the same command, same lockfile | **31** — seven high, twenty-three moderate, one low |

Nothing in this repository changed between those two runs. The advisory list
more than tripled because the registry's knowledge of the installed ESLint and
`typescript-eslint` packages changed. Meanwhile the production closure of that
workspace moved by zero packages.

That is the whole design argument in one table. **An advisory list is not
pinnable** — it is large, it is owned by a registry, it moves daily, and a
baseline of it is stale the morning after it is written. **A production
closure is pinnable** — it is 308 packages across this repository's three
lockfiles, it is wholly determined by committed files, and it moves only when
someone edits a dependency. So the pinnable thing gets pinned.

### 1.3 The third measurement, which the 2026-10-26 entry could not have taken

The entry measured one workspace. This repository has three tracked
lockfiles. Piping today's 31 advisory package names through the gate built
here, every name that reaches **any** production closure in the repository:

```
$ node -e 'JSON.parse(...audit...)' | node tools/registers/check-closure.mjs --names ... --json
ursa-major         @hono/node-server@2.1.4          advisory range 1.19.10 - 2.1.2   moderate
ursa-major         @modelcontextprotocol/sdk@1.32.1 advisory range <=1.31.0          high
ursa-major         body-parser@2.4.0                advisory range 2.0.0 - 2.3.0     high
ursa-major         fast-uri@3.1.9                   advisory range 3.0.0 - 3.1.8     moderate
ursa-major         hono@4.13.13                     advisory range 4.12.4 - 4.13.10  moderate
ursa-major         ip-address@10.7.5                advisory range <=10.7.3          moderate
ursa-major         qs@6.16.1                        advisory range 6.7.0 - 6.16.0    moderate
ursa-major         zod@4.6.7                        advisory range <4.6.6            high
ursa-major/overlay undici@6.29.1                    advisory range 7.0.0 - 7.30.0    high
ursa-major/overlay zod@4.6.7                        advisory range <4.6.6            high
```

Ten rows. **Every one is outside its advisory range, and seven of the ten are
outside it by a single patch release.** `fast-uri` ships at 3.1.9 against a
range ending at 3.1.8. `qs` ships at 6.16.1 against a range ending at 6.16.0.
`zod` ships at 4.6.7 against `<4.6.6`.

Nothing here is vulnerable today and this document does not claim otherwise.
What the table shows is the distance between "clean" and "high", which is one
patch version in seven places, in package names a reader of the 2026-10-26
entry would come away believing are development-only. The entry's conclusion
was true of the workspace it measured and is not true of the repository. One
lockfile resolution that picks an older `fast-uri`, or a revert that moves
`zod` back a patch, converts a non-finding into a high in a deployed tree,
and today nothing would say so until some later audit on a networked host
happened to look.

---

## 2. What this gate is, and what it deliberately is not

| | `scripts/dep-floor.mjs` | `tools/registers/check-closure.mjs` (this) |
|---|---|---|
| The question it answers | Is there a published advisory against an installed package, and how severe is it? | Which packages are on a deployed surface, at which versions? |
| Where its facts come from | the npm registry, over the network, via `npm audit --json` | three committed `package-lock.json` files, read off disk |
| Runs offline | no | yes |
| Visible in a pull request diff | no | yes, as a diff of `tools/registers/prod-closure.json` |
| What failure means | an advisory above the floor with no accepted exception | the set of shipped packages changed without the baseline changing with it |
| Who holds the repair | the owner, for an exception in `dep-floor.allow.json` | whoever opened the pull request, with one command and one commit |

They compose and neither replaces the other. The ten-row table in §1.3 cannot
be produced by either one alone: severity and version range come from
dep-floor's source, scope comes from this gate, and only the second half is a
property of a committed file.

**This gate does not know what a vulnerability is.** It has no advisory
database, makes no network call, and contains no severity vocabulary. That is
a boundary and not a gap.

---

## 3. Where the scope fact comes from, and the traversal that was not shipped

Every claim this gate makes rests on two fields npm writes into a lockfile v3
entry: `dev` and `devOptional`. This module **reads them and does not
recompute them.**

That is deliberate. npm's own resolver sets those fields, and `npm audit
--omit=dev` partitions on the same ones, so reading them makes this gate agree
with the tool whose answer a production install actually obeys. A second,
disagreeing authority inside the same repository would be worse than no second
authority.

An independent traversal was prototyped first, on this branch, before the gate
was written: walk `dependencies`, `optionalDependencies` and
`peerDependencies` edges from the root entry, resolving each name by npm's
nearest-ancestor `node_modules` rule, and take the reachable set. It
disagreed with the flags:

| Workspace | Traversal reached | `dev`/`devOptional` flags admit | Edges the traversal could not resolve |
|---|---|---|---|
| `ursa-minor` | 70 | 67 | 6 |
| `ursa-major` | 161 | 158 | 1 |
| `ursa-major/overlay` | 85 | 85 | 4 |

Each unresolved edge is an optional peer dependency that is not installed
(`node_modules/next -> @playwright/test`, `node_modules/next -> sass`), and
each of the three extra packages per workspace is a package reachable by a
peer edge from production and also declared a direct development dependency
(`@types/react`, `@types/node`, `csstype`, `undici-types`, `detect-libc`).
Getting that right means implementing npm's optional-and-peer edge semantics
correctly, which is more than one session's work.

Shipping the traversal anyway would have produced a measurement whose
instrument is wrong, which is the one defect this repository's gates exist to
prevent. So it was not shipped, the numbers above are recorded, and the
cross-check is a separate entry in `docs/ideas.md` with its first step
written out.

**One number in §1 is reported and not reconciled, named here so nobody
mistakes it for agreement.** `npm audit --omit=dev` reports
`metadata.dependencies.prod: 33` for `ursa-minor` where this gate's closure
for the same workspace is 67 members. The explained part: 38 of those 67
entries carry `optional: true`, and npm's audit metadata buckets optional
separately while `npm ci --omit=dev` installs them. That leaves 29
non-optional production entries against npm's 33, and
`29 + 3 devOptional + 1 root = 33` fits exactly — which is arithmetic that
fits, not a measurement, and it is labelled as a hypothesis for that reason.
Nothing in this gate depends on reconciling it: the gate compares a
measurement against its own earlier measurement and never against npm's
count.

---

## 4. Why an optional production dependency counts as shipping

`prodClosure` keeps an entry with `optional: true` when it is not also `dev`.
An optional production dependency is installed unless the installer passes
`--omit=optional`, and a platform-specific binary such as
`@img/sharp-darwin-arm64` is installed on the platform it matches.

So the closure lists every platform's binary and therefore **over-states what
any single machine receives, and under-states nothing.** For a set whose
purpose is to bound a deployed attack surface, that is the correct direction
of error, and it is asserted as a test case rather than left as a comment.

---

## 5. Why the key is `name@version` and not the lockfile path

npm hoists. The same package moves between `node_modules/x` and
`node_modules/a/node_modules/x` when an unrelated dependency changes, so a
path-keyed baseline would show a diff on a change that ships identical bytes,
and a baseline that churns is a baseline nobody reads.

Two entries at the same name and the same version are the same bytes however
many paths they sit at, so they are **one** member of the closure. The paths
are kept on the in-memory result for the reader and are not part of the key.
Measured on this branch: `ursa-major` has 158 production lockfile entries and
156 closure members, the two duplicates being one package hoisted to two
depths.

---

## 6. System diagram, node by node and edge by edge

Every node below is a file that exists at this branch. Every edge is labelled
with the type or format that crosses it, not with a verb.

```
  ursa-minor/package-lock.json          ursa-major/package-lock.json
  ursa-major/overlay/package-lock.json
          │
          │ raw bytes, read with readFileSync(path, 'utf8'), then JSON.parse
          │ ──> an npm lockfileVersion 3 document
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ tools/registers/check-closure.mjs   (the CLI; the only impure node)     │
│   trackedLockfileDirs(root) ──> {dirs: string[]} | {fault: Fault}       │
│   readJson(path)            ──> object | Error | undefined              │
└─────────────────────────────────────────────────────────────────────────┘
   │  unknown (a parsed document, or an Error)   ▲ Fault | null
   ▼                                             │
┌─────────────────────────────────────────────────────────────────────────┐
│ tools/registers/closure-verdict.mjs   (pure; no fs, no child_process)   │
│                                                                         │
│   lockFault(lock, where)   ──> Fault | null       (8 refusal codes)     │
│   prodClosure(lock)        ──> Closure                                  │
│   baselineFault(baseline)  ──> Fault | null       (9 refusal codes)     │
│   compare(measured, base)  ──> Finding[]          (5 rules)             │
│   verdict(findings, seen)  ──> Verdict            (3 findings causes)   │
│   baselineUnusable(fault)  ──> Verdict            (ground, exit 2)      │
│   lockUnreadable(fault)    ──> Verdict            (ground, exit 2)      │
│   scopeUnreadable(fault)   ──> Verdict            (ground, exit 2)      │
│   GATE                     ──> GateSpec           (7 probes)            │
└─────────────────────────────────────────────────────────────────────────┘
   │  Closure {members: string[], paths, devOnly}       ▲ Verdict
   │                                                     │
   ▼                                                     │
  tools/registers/prod-closure.json  ◀───────────────────┘
   │  the committed baseline: {_note: string,
   │  workspaces: Record<dir, {members: string[], count,
   │  devOnlyEntriesExcluded}>}
   │  written only by `--write`, read on every other invocation
   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ tools/registers/check-closure.mjs, continued                            │
│   renderVerdict(v, findings.map(f => `::error::${f.rule}: ${f.message}`))│
└─────────────────────────────────────────────────────────────────────────┘
   │  stdout or stderr text lines + process exit status (0 | 1 | 2)
   │  and, with --json, one JSON document:
   │  {workspaces, findings, totals, verdict}
   ▼
  the reader, and GitHub Actions log annotations (`::error::`)


  Two edges to nodes outside this gate:

┌───────────────────────────────┐        ┌──────────────────────────────────┐
│ tools/gates/verdict-shape.mjs │◀───────│ closure-verdict.mjs              │
│   LOCUS, POSITION             │ imports│   verdictOf(), describeGate()    │
│   verdictOf, describeGate,    │        │   build every Verdict it returns │
│   renderVerdict               │        └──────────────────────────────────┘
└───────────────────────────────┘
          ▲
          │ GateSpec, then Verdict (one per probe)
┌─────────────────────────────────────────────────────────────────────────┐
│ tools/gates/enumerate-verdicts.mjs                                      │
│   REGISTRY[6] = './../registers/closure-verdict.mjs'                    │
│   drives GATE.probes and checks six properties on what comes back       │
└─────────────────────────────────────────────────────────────────────────┘
```

`scripts/dep-floor.mjs` is **not** an edge on this diagram. The two gates
share a subject and exchange no data; §2 is the comparison and §9 is the
proposal that would connect them.

---

## 7. Interfaces at every component boundary

These are the signatures a caller writes against. The modules are JavaScript
with JSDoc; the TypeScript here is the contract those annotations express.

```ts
// tools/registers/closure-verdict.mjs

/** A named condition under which the gate established nothing. */
type Fault = { code: string; detail: string }

/** The production closure of one lockfile. */
type Closure = {
  /** sorted, deduplicated `name@version`; the pinnable surface */
  members: string[]
  /** every lockfile path each member sits at, for the reader; not part of the key */
  paths: Record<string, string[]>
  /** entries excluded as `dev` or `devOptional`, so a clean line can state its ratio */
  devOnly: number
}

type ClosureRule =
  | 'CLOSURE_ADDED'            // ships, not pinned
  | 'CLOSURE_VERSION_CHANGED'  // pinned at another version
  | 'CLOSURE_REMOVED'          // pinned, no longer ships
  | 'WORKSPACE_UNPINNED'       // a tracked lockfile with no baseline entry
  | 'BASELINE_ORPHANED'        // a baseline entry with no tracked lockfile

type Finding = { rule: ClosureRule; workspace: string; message: string }

/** The census the clean line is allowed to quote. */
type Seen = { workspaces?: number; packages?: number; devOnly?: number }

export const SUPPORTED_LOCKFILE_VERSION: 3

export function packageNameOf(path: string): string | null
export function lockFault(lock: unknown, where: string): Fault | null
export function prodClosure(lock: object): Closure
export function baselineFault(baseline: unknown): Fault | null
export function compare(
  measured: Record<string, Pick<Closure, 'members'>>,
  baseline: { workspaces: Record<string, { members: string[] }> },
): Finding[]
export function verdict(findings: Finding[], seen?: Seen): Verdict
export function baselineUnusable(fault: Fault): Verdict
export function lockUnreadable(fault: Fault): Verdict
export function scopeUnreadable(fault: Fault): Verdict
export const GATE: GateSpec
```

```ts
// tools/registers/check-closure.mjs

/** Which directories hold a lockfile this repository tracks. A fault rather
 *  than a throw, because the caller exits at module scope. */
export function trackedLockfileDirs(
  root?: string,
): { dirs: string[] } | { fault: Fault }

/** The exact object `--write` serialises, so the writer and the validator
 *  cannot drift. */
export function baselineDocument(
  measured: Record<string, Closure>,
): {
  _note: string
  workspaces: Record<string, {
    members: string[]
    count: number
    devOnlyEntriesExcluded: number
  }>
}
```

```ts
// tools/gates/verdict-shape.mjs — the two types imported across the boundary

type Verdict = {
  exitCode: 0 | 1 | 2 | 3
  stream: 'out' | 'err'
  line: string
  position: 'before' | 'after'
  trailer: string[]
  derivedFrom: 'findings' | 'ground'
  cause: string
  cites: string[]
  quoted: string[]
}

type GateSpec = {
  id: string
  verdict: (findings: unknown[], seen: object) => Verdict
  loci: Record<string, { noun: RegExp }>
  findingsLocus?: string
  probes: Array<{ name: string; findings: unknown[]; seen?: object }>
}
```

---

## 8. On-disk layouts, with a real payload

### 8.1 The files

| Path | Format | Written by | Read by |
|---|---|---|---|
| `ursa-minor/package-lock.json` | npm lockfile v3, JSON | `npm install`, never by this gate | the gate, read-only |
| `ursa-major/package-lock.json` | npm lockfile v3, JSON | `npm install`, never by this gate | the gate, read-only |
| `ursa-major/overlay/package-lock.json` | npm lockfile v3, JSON | `npm install`, never by this gate | the gate, read-only |
| `tools/registers/prod-closure.json` | JSON, 2-space indent, trailing newline | `node tools/registers/check-closure.mjs --write` | the gate on every other invocation, and its test suite |
| `dep-floor.allow.json` | JSON | the owner, by hand | `scripts/dep-floor.mjs`, not by this gate |

### 8.2 A real payload

The committed `tools/registers/prod-closure.json` at this branch, with the
`ursa-minor` member list abridged at the marked line and nothing else altered.
Both other workspaces' member lists are abridged the same way. These are
public npm package names and contain no machine identity, so the redaction
rider in `prompts/engineer-agent.md` has nothing to redact here; it is noted
so a reader does not have to wonder.

```json
{
  "_note": "The production closure of every tracked package-lock.json: the name@version set that `npm ci --omit=dev` installs, which is what reaches a deployed surface. Generated by `node tools/registers/check-closure.mjs --write` and enforced by the same file without the flag. Scope comes from npm's own `dev` and `devOptional` fields in the lockfile, the same fields `npm audit --omit=dev` reads; see tools/registers/closure-verdict.mjs for why they are read rather than recomputed. A diff here is a change in what this repository ships, so it is reviewed as one. This file is not an allowlist and nothing in it accepts a risk; dep-floor.allow.json is where an accepted risk goes.",
  "workspaces": {
    "ursa-major": {
      "members": [
        "@emnapi/runtime@1.11.3",
        "@hono/node-server@2.1.4",
        "@huggingface/jinja@0.5.10",
        "@huggingface/tokenizers@0.2.0",
        "@huggingface/transformers@4.3.0",
        "@img/colour@1.1.0",
        "@img/sharp-darwin-arm64@0.35.5",
        "...149 more members, in sorted order..."
      ],
      "count": 156,
      "devOnlyEntriesExcluded": 129
    },
    "ursa-major/overlay": {
      "members": [
        "...85 members, in sorted order..."
      ],
      "count": 85,
      "devOnlyEntriesExcluded": 5
    },
    "ursa-minor": {
      "members": [
        "@babel/runtime@7.29.7",
        "@base-ui/react@1.6.0",
        "...63 more members, in sorted order, including next@16.4.3 ...",
        "tslib@2.8.1",
        "tw-animate-css@1.4.0",
        "use-sync-external-store@1.6.0"
      ],
      "count": 67,
      "devOnlyEntriesExcluded": 611
    }
  }
}
```

### 8.3 Three properties of that file, each enforced rather than described

1. **Sorted members.** `baselineFault` refuses an unsorted list. A diff of a
   dependency change is the entire review mechanism this baseline provides,
   and an unsorted file would still compare equal as a set while making every
   future diff unreadable.
2. **No duplicates.** Refused for the same reason the closure is keyed on
   `name@version`: a member listed twice would make `count` disagree with the
   list it counts.
3. **Trailing newline.** `--write` ends the file with `}\n`, asserted as a
   test case, so a diff never carries `\ No newline at end of file`.

---

## 9. Exact commands

Every line below was run on this branch. Output is quoted where it is the
evidence.

```bash
# The gate. Offline, no registry, three lockfiles and one baseline.
node tools/registers/check-closure.mjs
# -> Production closure: 308 package(s) in the production closure of 3
#    workspace(s), with 745 development-only entry(ies) excluded, every member
#    pinned in the committed baseline at tools/registers/prod-closure.json.
#    Exit 0.

# Re-pin after an intended dependency change. The diff is the review.
node tools/registers/check-closure.mjs --write
# -> Production closure: wrote 308 package(s) across 3 workspace(s) to
#    tools/registers/prod-closure.json, with 745 development-only entry(ies)
#    excluded. Review the diff; it is the change in what this repository ships.

# The query the 2026-10-26 ledger entry needed and could not perform.
node tools/registers/check-closure.mjs --names shadcn @modelcontextprotocol/sdk
# -> shadcn                     ursa-minor   development-only or absent: not in
#                                            this workspace's production closure
#    @modelcontextprotocol/sdk  ursa-major   ships as
#                                            @modelcontextprotocol/sdk@1.32.1

# The findings as data, for a caller that is not a human.
node tools/registers/check-closure.mjs --json

# Against another checkout, which is how the fixture suite drives the CLI half.
node tools/registers/check-closure.mjs --root /tmp/some-fixture-repo

# The two measurements in section 1, in the order they were taken.
cd ursa-minor && npm install --silent --no-audit --no-fund
npm audit --json --omit=dev          # -> all severities 0, prod 33 / dev 608
npm audit --json --package-lock-only # -> 31 advisories: 7 high, 23 moderate, 1 low

# This gate's two suites, 68 cases.
node --test tools/registers/closure-verdict.test.mjs   # 51 pass
node --test tools/registers/check-closure.test.mjs     # 17 pass

# The verdict-branch enumeration, which now carries a seventh gate.
node tools/gates/enumerate-verdicts.mjs
node tools/gates/enumerate-verdicts.mjs --census
node --test tools/gates/enumerate-verdicts.test.mjs    # 18 pass

# The precondition every history-reading tool here shares.
bash tools/ensure-full-clone.sh
```

---

## 10. Tooling list

| Tool | Version | Its job in this system | Why it, over what was considered |
|---|---|---|---|
| Node.js | v22.23.2, as installed on this host | Runs the gate and both suites. The gate is plain ESM with no transpile step. | Already every `tools/` gate's runtime here. A TypeScript gate would need `tsx`, which lives in `ursa-major/node_modules` and so would make a repository-wide gate depend on one workspace's install. |
| `node:test` | bundled with Node 22 | Both suites, 68 cases, run by `node --test`. | The twenty-four existing `tools/**/*.test.mjs` suites use it, and it needs no `node_modules` anywhere. Vitest 5.0.2 is `ursa-major`'s runner and adding a `tools/` dependency on it would make the gate's own tests unrunnable in a clone that never installed that workspace. |
| npm | 10.9.8 | Writes the lockfiles this gate reads, and is the authority for the `dev` and `devOptional` fields. Never invoked by the gate. | Not a choice: it is the tool whose output a production install obeys, which is exactly why §3 reads its fields instead of recomputing them. |
| `npm audit` | the same npm 10.9.8 | Produced the two severity measurements in §1 and §1.3. Not part of the gate. | It is the only advisory source `scripts/dep-floor.mjs` uses, so using a second one would have made §1.3 a comparison between two databases instead of a comparison between scope and severity. |
| git | 2.43.0 | `git ls-files -z '*package-lock.json'` decides which lockfiles are the repository's. The bytes always come from disk. | A filesystem walk would pick up a `package-lock.json` under an ignored or vendored directory and silently widen the claim; `git ls-files` restricts it to tracked files for free. `-z` is used because a path with a newline in it would otherwise split into two paths. |
| `tools/gates/verdict-shape.mjs` | this repository, at this branch | Supplies `verdictOf`, `describeGate`, `renderVerdict`, `LOCUS` and `POSITION`, so this gate's verdicts are the shape the enumerator can measure. | The alternative is a gate that declares its own verdict shape, which is the state the first four gates were in and which `docs/design/verdict-lines.md` §1 records as the defect that started this line of work. |
| `tools/gates/enumerate-verdicts.mjs` | this repository, at this branch | Drives this gate's seven probes on every run and checks six properties of what comes back. | It is the standing check that this gate's exit codes and counts stay derived from its own findings. Without registration the gate would be correct today and unmeasured tomorrow. |

---

## 11. What this does not do

1. **It does not know what a vulnerability is.** No advisory database, no
   severity vocabulary, no network. `scripts/dep-floor.mjs` is that gate.
2. **It does not recompute scope.** §3 states why, and records the traversal
   that disagreed and was not shipped.
3. **It does not read workspaces or linked packages.** A lockfile entry with
   `link: true` is refused by name (`LOCKFILE_HAS_LINKED_ENTRY`) rather than
   guessed at. This repository has none: three lockfiles, zero `link`
   entries, zero workspace directories, measured.
4. **It reads lockfileVersion 3 only.** v1 has no `packages` map and v2
   carries both shapes with the legacy half authoritative for some clients,
   so a scope field read out of either would be a guess wearing a number.
   `LOCKFILE_VERSION_UNSUPPORTED` says so and exits 2.
5. **It does not run in CI, because no test workflow runs on a pull request
   in this repository.** That is a standing `urgent` entry in `docs/ideas.md`
   dated 2026-10-24 and it is not this gate's defect to repair. Until it
   lands, the gate runs from a seat's session or a developer's shell, the
   same as its six siblings.
6. **It does not connect the two gates.** The ten-row table in §1.3 was
   produced by hand-piping an audit report into `--names`. Making
   `scripts/dep-floor.mjs` partition its own advisories by this gate's
   closure, so a development-only advisory is labelled as such without a
   human joining two outputs, is a proposal in `docs/ideas.md` and not part
   of this change.

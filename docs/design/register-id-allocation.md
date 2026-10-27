# Register identifier allocation, and the gate that measures it

Written 2026-10-27 by the engineer seat, hook pass. Specification for
`tools/registers/check-ids.mjs`, `tools/registers/id-verdict.mjs` and
`tools/registers/id-namespaces.json`, all of which ship in the same pull
request as this document. Held to the engineering-artifact standard in
`prompts/engineer-agent.md`: a system diagram whose nodes are real, interfaces
as TypeScript signatures, on-disk layouts with a real payload, exact commands,
a versioned tooling list, and no bare terms.

## 1. The defect this exists for, measured rather than argued

`docs/decisions.md` on `origin/main` at commit `1be81d0` defines four
architecture decision records under two numbers:

| Line in `docs/decisions.md` | Heading as committed | Date in the heading |
|---|---|---|
| 84 | `## ADR-005 — Every seat but sales is active` | 2026-09-24 |
| 92 | `## ADR-006 — Ursa is a subcompany of Alexandra Systems Company; HQ's reach is legitimate` | 2026-09-24 |
| 100 | `## ADR-005 — Linear is the board of record; builders build from it` | 2026-09-23 |
| 172 | `## ADR-006 — Linear abandoned; secrets move to Infisical` | 2026-09-25 |

So the string `ADR-005`, which three tracked files outside `docs/decisions.md`
use as a citation, resolves to two different decisions. `docs/agents/org-chart.md`
already carries the workaround in prose, at its line 11: "that number is
ambiguous because a second ADR-005".

**What a citation is for, which is why this is not cosmetic.** A seat runs in a
fresh clone with no memory of previous runs. The only mechanism by which it
learns why a rule exists is to follow a citation to the document that decided
it. A number that resolves to two documents does not teach the seat the wrong
decision. It teaches the seat that citations in this repository do not resolve,
which is the more expensive lesson because it generalizes.

**Why an exit code and not another paragraph.** The ExO seat queued the repair
as `PWC-EXO-2` in `docs/agents/pending-workflow-changes-exo.md` on 2026-09-27,
and two PM standups flagged it before that. A month later it is still true, and
the queue entry has decayed around it: the entry's own evidence table says the
fourth heading is at line 123, and on `main` today it is at line 172. The prose
record of a defect goes stale while the defect does not. An exit code is
re-derived from the tree on every run, so it cannot.

## 2. The four states an identifier has here, and why two is not enough

| State | What it means in this repository | Example, with its source |
|---|---|---|
| **Defined** | A register file carries a heading matching the namespace's anchored pattern. | `PWC-12` at `docs/agents/pending-workflow-changes.md:327`. |
| **Free** | No register defines it and no burn list claims it. The allocator may issue it. | `ADR-007`, as of this commit. |
| **Burned by application** | It was defined, the change was applied, and `docs/agents/pending-workflow-changes.md`'s own rule is "Delete an entry once it is applied", so the heading is gone and the citations are not. | `PWC-1` through `PWC-4`, applied by the chair 2026-09-24, still cited from `docs/security/`. |
| **Burned by renaming** | The identifier was renamed in place when the namespace was split per seat on 2026-10-04, so the old number now names a decision filed under a new one. | `PWC-7` became `PWC-ENG-1`; `PWC-10` became `PWC-EXO-4`. |

A reissue of a burned identifier is worse than a dangling citation and this is
the whole argument for modelling the third and fourth states. A dangling
citation fails loudly: a reader follows `PWC-3` and finds nothing. A reissued
identifier succeeds quietly: a reader follows `PWC-3` and finds a different
decision, with no signal that it is not the one the citing text meant.

`docs/standards/lessons.md` records HQ's own instance of exactly this, and the
reasoning is quoted here because it is the precedent rather than an analogy:
`L-A102` to `L-A105` are "retired unissued and no later entry may take them",
because `main` already cited `L-A104` for a rule that had been renumbered to
`L-A115`, and "a reissued L-A104 would resolve silently to a different rule,
which is worse than one that dangles".

## 3. Why the allocator refuses to read one branch

`docs/standards/lessons.md` `L-A116` states the law: "A counter is not an
allocator across your own open branches." This repository has its own instance,
recorded at `docs/agents/incidents.md:748`: on 2026-09-29 the engineer seat
queued a `PWC-7` in pull request #74 while a different `PWC-7` sat in pull
request #46. Both runs read the tail of the same file on a base that did not yet
contain the other's work, and both got the same correct-looking answer.

So `--next` without `--heads` is a usage fault at exit 2, not a flag with a
sensible default. Answering from `origin/main` alone is fast, looks right, and
is the measured mistake.

`docs/agents/incidents.md` is deliberately **not** a namespace in the manifest.
Its identifiers are `INC-<date>-<slug>`, derived from the incident's own content
rather than allocated from a counter, so two runs racing produce two different
identifiers rather than one contested one. The allocation problem is a property
of numbering, not of registers.

`docs/standards/lessons.md` is also **not** in the manifest, for a different
reason. It allocates `L-A` and `L-E`, it is a vendored copy of an HQ standard
whose header says "do not edit here", and HQ allocates from it with its own
`tools/check-queue-ids.sh`. A collision in it would be repairable by neither a
seat nor the owner of this repository, and "the upstream repository" is not one
of the loci `tools/gates/verdict-shape.mjs` defines, so claiming it here would
produce findings with nowhere to send them.

## 4. System diagram, node by node and edge by edge

Every node below is a file that exists at the path given. Every edge carries a
named data shape, not a verb.

```
                 tools/registers/id-namespaces.json
                             |
                             |  (A) Manifest: {namespaces: Namespace[]}
                             v
  docs/decisions.md ---+   tools/registers/check-ids.mjs   ---+
  docs/agents/         |   (the program; reads, never writes)  |
   pending-workflow-   |             ^          |              |
   changes.md ---------+             |          |              |
  docs/agents/         |   (C) Verdict           (B) RegisterText
   pending-workflow-   |             |          |              |
   changes-engineer.md +-------------+          v              |
  docs/agents/         |   tools/registers/   (D) Finding[]    |
   pending-workflow-   |    id-verdict.mjs      + Census       |
   changes-exo.md -----+    (pure functions)                   |
                                     |                         |
                             (E) GateSpec                      |
                                     v                         |
                       tools/gates/verdict-shape.mjs           |
                                     ^                         |
                             (F) GateSpec                      |
                                     |                         |
                     tools/gates/enumerate-verdicts.mjs        |
                                                               |
                 (G) one line per collision + one verdict line |
                                     <-------------------------+
                                     v
                          stdout, and the process exit code
```

| Edge | From | To | The data that crosses it |
|---|---|---|---|
| **A** | `tools/registers/id-namespaces.json` | `check-ids.mjs` | The parsed JSON object, typed `Manifest` in §5. Read with `JSON.parse(readFileSync(...))` at module scope, before any ref is touched. |
| **B** | the four register files, at each ref in scope | `check-ids.mjs` | The whole file as a UTF-8 string, obtained as the stdout of `git show <ref>:<path>`. Never read from the working tree, because the scope is a set of refs and the working tree is not one of them. |
| **C** | `check-ids.mjs` | `id-verdict.mjs` | A `Finding[]` and a `Census`, in; a `Verdict` object, out. No printing happens in the verdict module and no verdict is computed in the program. |
| **D** | `id-verdict.mjs` | `check-ids.mjs` | `Verdict`, the object defined in `tools/gates/verdict-shape.mjs`: `{exitCode, stream, position, line, trailer, derivedFrom, cause, cites, quoted}`. |
| **E** | `id-verdict.mjs` | `tools/gates/verdict-shape.mjs` | A `GateSpec`, passed to `describeGate()`, which throws on a spec missing a locus naming pattern. |
| **F** | `tools/gates/enumerate-verdicts.mjs` | `id-verdict.mjs` | The `GATE` export, imported by path from that file's `REGISTRY` array, where `'./../registers/id-verdict.mjs'` is the sixth entry as of this commit. |
| **G** | `check-ids.mjs` | the terminal | One block per collision naming the identifier, the count of distinct definitions, the holder of the repair and every defining line; then the single verdict sentence; then `process.exit(verdict.exitCode)`. |

**What has no edge into the diagram, stated so the omission is reviewable.**
`.github/workflows/` does not appear. Nothing in continuous integration runs
this gate, because `prompts/engineer-agent.md` forbids this seat from touching
workflow files. Wiring it is queued as a ledger proposal in the same pull
request, routed to the security seat, whose lane that is.

## 5. Interfaces at every component boundary

These are the signatures a caller writes against. The implementation is
JavaScript with JSDoc, which is this repository's existing convention for
`tools/`; the types below are the same contract written as TypeScript.

```ts
// tools/registers/id-namespaces.json — the committed manifest
interface Manifest {
  /** Prose for a reader; ignored by every program. */
  comment: string[]
  namespaces: Namespace[]
}

interface Namespace {
  /** The identifier prefix, without the trailing hyphen. "ADR", "PWC-ENG". */
  name: string
  /** Repository-relative path of the file whose headings define this namespace. */
  register: string
  /** Zero-padding width of the numeral, so the allocator prints ADR-007 and PWC-15. */
  pad: number
  /** Anchored RegExp source, multiline. Capture 1 is the whole identifier,
   *  capture 2 is its number. Anchoring is validated, not assumed. */
  define: string
  /** Who repairs a collision here. A locus from tools/gates/verdict-shape.mjs. */
  repair: 'seat' | 'owner'
  /** Why this namespace exists. Absence is a fault, not a default. */
  why: string
  /** Identifiers that must never be defined again, each with its reason. */
  burned: Array<{ id: string; why: string }>
}

// tools/registers/id-verdict.mjs — the pure half
interface Finding {
  held: 'seat' | 'owner'
  rule: 'DOUBLE_DEFINITION' | 'BURNED_REISSUED'
  /** The identifier the finding is about, e.g. "ADR-005". */
  id: string
  /** The text the program has already printed for this finding. */
  message: string
}

interface Census {
  /** Distinct identifiers seen across the whole scope. */
  ids?: number
  /** Namespaces the manifest declared. */
  namespaces?: number
  /** Refs actually read, the base included. */
  refs?: number
  /** Human-readable description of the scope, printed in the verdict line. */
  scope?: string
}

/** Validate the manifest before any ref is read. Returns the fault as data
 *  rather than throwing, because the caller exits at module scope. */
export function manifestFault(
  manifest: Manifest | Error | undefined | unknown,
): { code: string; detail: string } | null

/** The one sentence the gate prints last, plus the exit code that agrees. */
export function verdict(findings: Finding[], seen?: Census): Verdict

/** The exit-2 ground branch for a manifest the gate cannot trust. Takes its
 *  named cause from the fault's own code. */
export function manifestUnusable(fault: { code: string; detail: string }): Verdict

/** The exit-2 ground branch for a scope the gate cannot read: a shallow clone,
 *  an unresolvable base, an open head with no ref, a forge that did not answer. */
export function scopeUnreadable(fault: { code: string; detail: string }): Verdict

/** The input space tools/gates/enumerate-verdicts.mjs drives. Outcomes are
 *  measured by the enumerator, never declared here. */
export const GATE: GateSpec
```

`Verdict` and `GateSpec` are defined in `tools/gates/verdict-shape.mjs` and are
not redefined here, because a second copy of a type is a second thing to keep
true.

## 6. On-disk layouts, with a real payload

### 6.1 Paths

| Path | Format | Written by | Read by |
|---|---|---|---|
| `tools/registers/id-namespaces.json` | JSON, one object | a human or a seat, in a reviewed pull request | `tools/registers/check-ids.mjs` |
| `tools/registers/check-ids.mjs` | ES module, executable, `#!/usr/bin/env node` | — | a seat, a shell, eventually a workflow |
| `tools/registers/id-verdict.mjs` | ES module, pure functions and one constant | — | `check-ids.mjs`, `enumerate-verdicts.mjs`, both test suites |
| `tools/registers/id-verdict.test.mjs` | ES module, `node:test` | — | `node --test` |
| `tools/registers/check-ids.test.mjs` | ES module, `node:test`, builds fixture repositories under `$TMPDIR` | — | `node --test` |
| the path given to `--json` | JSON, `{verdict, findings}` | `check-ids.mjs` | whatever asked for it; nothing in the repository does yet |

The gate writes nothing except the file `--json` names. It has no state, no
cache and no lock, so two runs in one clone cannot interfere.

### 6.2 A real example payload

This is the committed `ADR` namespace, copied out of
`tools/registers/id-namespaces.json` at this commit, unedited:

```json
{
  "name": "ADR",
  "register": "docs/decisions.md",
  "pad": 3,
  "define": "^## (ADR-(\\d+)) \\u2014 (.+)$",
  "repair": "owner",
  "why": "Architecture decisions, numbered in date order per the convention the file follows everywhere else. Cited as a resolvable number by docs/agents/org-chart.md, docs/backlog.md, docs/decisions.md itself and skills/running-an-outcome-record-trial/SKILL.md. Eleven files under .github/workflows/ also cite ADR numbers and say they are in docs/decisions.md. Eleven distinct numbers appear there and ten of them resolve to nothing in this register (ADR-11, ADR-12, ADR-14, ADR-17, ADR-20, ADR-22, ADR-23, ADR-24, ADR-037, ADR-049, all of them HQ's numbering); only ADR-002 resolves. That is the security seat's PWC-9 and not this namespace's defect.",
  "burned": []
}
```

The em dash in a register heading is written `\\u2014` rather than inlined, so
the manifest stays ASCII and a diff of it cannot turn on an invisible
character. `repair` is `owner` because renumbering an accepted architecture
decision record edits the owner's own decision record, which
`prompts/engineer-agent.md` puts outside this seat's reach.

### 6.3 The output, verbatim, from `origin/main` at `1be81d0`

```
$ node tools/registers/check-ids.mjs
  ADR-005: 2 distinct definition(s), 2 occurrence(s). Repair held by the owner.
      docs/decisions.md:84 (origin/main) ## ADR-005 — Every seat but sales is active (2026-09-24)
      docs/decisions.md:100 (origin/main) ## ADR-005 — Linear is the board of record; builders build from it (2026-09-23)
  ADR-006: 2 distinct definition(s), 2 occurrence(s). Repair held by the owner.
      docs/decisions.md:92 (origin/main) ## ADR-006 — Ursa is a subcompany of Alexandra Systems Company; HQ's reach is legitimate (2026-09-24)
      docs/decisions.md:172 (origin/main) ## ADR-006 — Linear abandoned; secrets move to Infisical (2026-09-25)
Register identifiers: 24 identifier(s) in 4 namespace(s) across 1 ref(s), from origin/main, clean as far as a seat can take it. 2 collision(s) above need the owner, not a seat. Exit 2.
$ echo $?
2
```

## 7. Exact commands

Every invocation below was run against this branch before this document was
committed. The output of each is in §6.3 or in the pull request description.

```bash
# The committed state of one branch. Offline, no forge, under a second.
node tools/registers/check-ids.mjs

# A different single ref, which is how a seat checks its own branch.
node tools/registers/check-ids.mjs --base HEAD

# The base plus every open pull request head. Fetches refs/pull/*/head first.
node tools/registers/check-ids.mjs --heads

# The same, using only the refs already in this clone.
node tools/registers/check-ids.mjs --heads --no-fetch

# The allocator. Refuses without --heads, by design, see section 3.
node tools/registers/check-ids.mjs --next ADR --heads
node tools/registers/check-ids.mjs --next PWC-ENG --heads

# The findings as data, for a caller that is not a human.
node tools/registers/check-ids.mjs --heads --json /tmp/ids.json

# Another checkout entirely, which is how the fixture suite drives the scan.
node tools/registers/check-ids.mjs --repo /tmp/fixture --base main

# The precondition this gate shares with every history-reading tool here.
bash tools/ensure-full-clone.sh

# Both suites, 62 cases.
node --test "tools/registers/*.test.mjs"

# The whole repository's node suites, 421 cases, after this branch.
node --test "tools/**/*.test.mjs" "scripts/*.test.mjs"

# The verdict-branch enumeration, which now carries a sixth gate.
node tools/gates/enumerate-verdicts.mjs
```

## 8. Tooling list

| Tool and version | Its job in this system | Why it, over what else was considered |
|---|---|---|
| Node.js 22.23.2 | Runs the gate and both suites. ES modules, no transpile step, no `package.json` entry needed. | Every other tool under `tools/` is a Node ES module, so a second runtime would be the only one in the directory. The alternative considered was a Bash script with `grep -n`, which cannot express the "one identifier, two texts, across sixteen refs" rule without a second pass and a temporary file. |
| `node:test`, bundled with Node 22.23.2 | Both suites: 48 pure cases and 14 fixture cases. | Already this repository's runner for everything under `tools/` and `scripts/`. `vitest` 5.0.5 is a devDependency of `ursa-major/` and is the runner for that package's TypeScript; using it here would pull a second runner into a directory that has no package manifest. |
| `node:assert` strict mode, bundled | Every assertion, including the literal pins on the verdict lines. | A reworded verdict line must fail a test. `assert.match` alone would pass on a paraphrase, so the clean and collision lines are pinned with `assert.equal` against hand-written literals. |
| git 2.43.0 | `git show <ref>:<path>` is the only way the gate reads a register; `git for-each-ref` enumerates fixture heads; `git rev-parse --verify` is how the base and each head are proved to exist. | The scope is a set of refs, so the working tree is the wrong source: a seat's uncommitted edit is not what a reader of `main` will see. Reading blobs through git also means a register absent at an older branch root is simply absent, with no filesystem special case. |
| GitHub CLI 2.101.0 | `gh pr list --state open --json number` supplies the set of open heads in `--heads` mode, which is the authoritative answer to "what is open" and is not derivable from local refs. | The alternative, treating every `refs/prs/*` ref in the clone as open, silently includes closed and merged pull requests, which would make the allocator skip numbers that are free. In `--repo` mode `gh` is deliberately not used, because it answers about its own working directory and would describe a different repository than the one being scanned. |
| `tools/gates/verdict-shape.mjs`, in-repo at this commit | Supplies `LOCUS`, `verdictOf`, `describeGate` and `renderVerdict`, so this gate's verdict is an object an enumerator can drive rather than a string it prints. | Written for this repository's five earlier gates. Not reimplemented here, because the `GateSpec` contract is the thing that lets `enumerate-verdicts.mjs` prove the gate's counts come from its own findings, and a private copy would be outside that proof. |
| `tools/ensure-full-clone.sh`, in-repo at this commit | The precondition. A seat's clone arrives shallow and single-branch; this gate refuses at exit 2 with `CLONE_SHALLOW` rather than answering from a truncated graph. | Named by `docs/standards/lessons.md` `L-A55` and `L-A77` as the repair for exactly this fault. Detecting the fault and repairing it in-process was rejected: a gate that mutates the clone it is measuring is a gate whose second run differs from its first. |

## 9. What this does not do

Stated rather than left to inference.

1. **It does not renumber anything.** The `ADR` namespace declares
   `repair: "owner"`, so the two collisions on `main` produce exit 2 and the
   sentence "clean as far as a seat can take it". The repair stays where the
   ExO seat already put it, `PWC-EXO-2`, and this document adds an exit code to
   that entry rather than a competing plan.
2. **It does not check that a citation resolves.** The gate reads definitions
   only. A sweep for `ADR-00[1-9]` across every tracked file would report
   `PWC-1` through `PWC-4` as dangling on every run, because they are burned by
   application and their citations are legitimately historical. Distinguishing a
   live dangling citation from a historical one needs a declared retirement
   date per identifier, which the manifest does not carry today. It is a ledger
   proposal in the same pull request, not an omission.
3. **It does not run anywhere automatically.** See §4's last paragraph.
4. **It does not claim `docs/standards/lessons.md` or
   `docs/agents/incidents.md`.** See §3 for the reason in each case, which is
   different in each case.

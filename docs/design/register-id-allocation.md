# Register identifier allocation, and the gate that measures it

Written 2026-10-27 by the engineer seat, hook pass. Specification for
`tools/registers/check-ids.mjs`, `tools/registers/id-verdict.mjs` and
`tools/registers/id-namespaces.json`, all of which ship in the same pull
request as this document. Held to the engineering-artifact standard in
`prompts/engineer-agent.md`: a system diagram whose nodes are real, interfaces
as TypeScript signatures, on-disk layouts with a real payload, exact commands,
a versioned tooling list, and no bare terms.

**Amended 2026-11-09 by the engineer seat, message pass**, which added the
`spell` and `example` fields, the `excluded` list, two namespaces, and §9
explaining why the first three were needed to add the last two. Every
measurement in §1 through §8 was re-read against the repository on that date
rather than carried forward; where a number changed, the new one is here with
the date it was taken and the old one named beside it.

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
  tools/registers/registers.json          tools/registers/id-namespaces.json
            |                                          |
            |  (H) Register[].path                     |  (A) Manifest:
            v                                          |      {namespaces, excluded}
  tools/registers/id-verdict.test.mjs                  v
  (asserts every path in H is claimed      tools/registers/check-ids.mjs
   or excluded in A; no runtime            (the program; reads, never writes)
   program reads registers.json)                 ^            |
                                                 |            |
  docs/decisions.md ------------+        (C) Finding[]    (B) RegisterText
  docs/agents/                  |          + Census           |
   pending-workflow-changes.md -+                 |            v
  docs/agents/                  |                 |     git show <ref>:<path>
   pending-workflow-            |                 |            |
   changes-engineer.md ---------+<----------------+------------+
  docs/agents/                  |                 |
   pending-workflow-            |        tools/registers/id-verdict.mjs
   changes-exo.md --------------+         (pure functions: verdict,
  docs/agents/improvements.md --+          manifestFault, spellId, unspellId)
  docs/agents/runner-facts.md --+                 |            |
   (the six registers, read at                    |            |
    every ref in the scope)              (D) Verdict    (E) GateSpec
                                                 |            |
                                                 |            v
                                                 |  tools/gates/verdict-shape.mjs
                                                 |            ^
                                                 |     (F) GateSpec
                                                 |            |
                                                 |  tools/gates/enumerate-verdicts.mjs
                                                 v
                      (G) one line per collision + one verdict line
                                                 |
                                                 v
                                stdout, and the process exit code
```

| Edge | From | To | The data that crosses it |
|---|---|---|---|
| **A** | `tools/registers/id-namespaces.json` | `check-ids.mjs` | The parsed JSON object, typed `Manifest` in §5. Read with `JSON.parse(readFileSync(...))` at module scope, before any ref is touched. |
| **B** | the six register files, at each ref in scope | `check-ids.mjs` | The whole file as a UTF-8 string, obtained as the stdout of `git show <ref>:<path>`. Never read from the working tree, because the scope is a set of refs and the working tree is not one of them. Four until 2026-11-09; `docs/agents/improvements.md` and `docs/agents/runner-facts.md` are the two added, and §9 is why they could not be added sooner. |
| **C** | `check-ids.mjs` | `id-verdict.mjs` | A `Finding[]` and a `Census`, in; a `Verdict` object, out. No printing happens in the verdict module and no verdict is computed in the program. |
| **D** | `id-verdict.mjs` | `check-ids.mjs` | `Verdict`, the object defined in `tools/gates/verdict-shape.mjs`: `{exitCode, stream, position, line, trailer, derivedFrom, cause, cites, quoted}`. |
| **E** | `id-verdict.mjs` | `tools/gates/verdict-shape.mjs` | A `GateSpec`, passed to `describeGate()`, which throws on a spec missing a locus naming pattern. |
| **F** | `tools/gates/enumerate-verdicts.mjs` | `id-verdict.mjs` | The `GATE` export, imported by path from that file's `REGISTRY` array, where `'./../registers/id-verdict.mjs'` is the ninth of twelve entries as of 2026-11-09; it was the sixth of six when this document was written, and the position is incidental rather than meaningful. |
| **H** | `tools/registers/registers.json` | `tools/registers/id-verdict.test.mjs` | The `registers` array's `path` fields, as a `Set<string>`. Read only by the test and never by a program at runtime: the assertion is that every path there appears in `id-namespaces.json` either as a namespace's `register` or as an `excluded` entry, which is what makes an unaccounted-for register a red test rather than a silence. Added 2026-11-09; see §9.4. |
| **G** | `check-ids.mjs` | the terminal | One block per collision naming the identifier, the count of distinct definitions, the holder of the repair and every defining line; then the single verdict sentence; then `process.exit(verdict.exitCode)`. |

**What has no edge into the diagram, stated so the omission is reviewable.**
`.github/workflows/` does not appear, and that was the whole story when this
document was written: nothing in continuous integration ran this gate, because
`prompts/engineer-agent.md` forbids this seat from touching workflow files, so
wiring it went out as a ledger proposal routed to the security seat. **That
seat took it on 2026-11-02** and `register-ids` is now a declared check in
`scripts/ci-checks.mjs`, which is the node that belongs in this paragraph in
place of the proposal. It is still not an edge above, because `ci-checks.mjs`
spawns the gate as a subprocess and reads its exit code rather than any data
shape this gate defines. The form it runs is `--no-fetch --base HEAD` with
`passExit: [0, 2]`; the `--heads` form is still unwired, and deliberately, per
§10 item 3.

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
  /** Every register in tools/registers/registers.json that allocates no
   *  identifier this repository can repair, each with the reason. Read by no
   *  program; read against registers.json by
   *  tools/registers/id-verdict.test.mjs, which fails if a path declared
   *  there is in neither list. Added 2026-11-09; see §9. */
  excluded: Array<{ register: string; why: string }>
}

interface Namespace {
  /** A label for the namespace, used by `--next <name>` and in the
   *  NAMESPACE_UNKNOWN message. It was also the identifier prefix for all
   *  four namespaces that existed before 2026-11-09, which is why the
   *  allocator read it as one; `spell` is now the only thing that decides how
   *  an identifier is written. "ADR", "PWC-ENG", "Window", "RunnerFact". */
  name: string
  /** Repository-relative path of the file whose headings define this namespace. */
  register: string
  /** Zero-padding width of the numeral, so the allocator prints ADR-007 and PWC-15. */
  pad: number
  /** How an allocated number is written into a heading. Exactly one `{n}`,
   *  standing for the number padded to `pad`; everything else is literal.
   *  "ADR-{n}", "Window {n}", "{n}". Validated, because zero `{n}` makes the
   *  allocator print one identifier forever and two makes it leave a literal
   *  `{n}` in a heading a seat pastes. Added 2026-11-09; see §9. */
  spell: string
  /** Anchored RegExp source, multiline. Capture 1 is the whole identifier,
   *  capture 2 is its number. Anchoring is validated, not assumed. */
  define: string
  /** A heading this register really carries, or a prefix of one. The
   *  validator refuses the manifest unless `define` matches it and
   *  `spell(pad, capture 2)` reproduces capture 1 exactly, which is the only
   *  check that reads `define`, `spell` and `pad` against each other. Added
   *  2026-11-09; see §9. */
  example: string
  /** Who repairs a collision here. A locus from tools/gates/verdict-shape.mjs. */
  repair: 'seat' | 'owner'
  /** Why this namespace exists. Absence is a fault, not a default. */
  why: string
  /** Identifiers that must never be defined again, each with its reason.
   *  Each `id` is validated against this namespace's `spell`, not against
   *  `${name}-`. */
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

/** Write a number as this namespace's register spells it. Added 2026-11-09;
 *  it is the function that replaced `${ns.name}-${padded}` at the allocator's
 *  one print site. */
export function spellId(ns: Pick<Namespace, 'spell' | 'pad'>, n: number): string

/** The inverse, used by the burn-list validator and by nothing that reads a
 *  ref. The two faults are kept apart because their repairs differ: 'SHAPE'
 *  is an identifier filed against the wrong namespace, 'NUMBER' is a typo in
 *  the right one. Added 2026-11-09. */
export function unspellId(
  ns: Pick<Namespace, 'spell' | 'pad'>,
  id: string,
): { n: number } | { fault: 'SHAPE' | 'NUMBER' }

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

### 6.2 Real example payloads

Two, because one namespace can no longer show the whole shape. This is the
committed `ADR` namespace, copied out of `tools/registers/id-namespaces.json`
at this commit, unedited:

```json
{
  "name": "ADR",
  "pad": 3,
  "register": "docs/decisions.md",
  "define": "^## (ADR-(\\d+)) \\u2014 (.+)$",
  "repair": "owner",
  "why": "Architecture decisions, numbered in date order per the convention the file follows everywhere else. Cited as a resolvable number by docs/agents/org-chart.md, docs/backlog.md, docs/decisions.md itself and skills/running-an-outcome-record-trial/SKILL.md. Eleven files under .github/workflows/ also cite ADR numbers and say they are in docs/decisions.md. Eleven distinct numbers appear there and ten of them resolve to nothing in this register (ADR-11, ADR-12, ADR-14, ADR-17, ADR-20, ADR-22, ADR-23, ADR-24, ADR-037, ADR-049, all of them HQ's numbering); only ADR-002 resolves. That is the security seat's PWC-9 and not this namespace's defect.",
  "burned": [],
  "spell": "ADR-{n}",
  "example": "## ADR-002 — Activation wave 1: okr, pm, exo (2026-09-18)"
}
```

The em dash in a register heading is written `\\u2014` rather than inlined, so
the manifest stays ASCII and a diff of it cannot turn on an invisible
character. `repair` is `owner` because renumbering an accepted architecture
decision record edits the owner's own decision record, which
`prompts/engineer-agent.md` puts outside this seat's reach.

And this is `RunnerFact`, added 2026-11-09, which is the namespace that could
not be expressed at all before `spell` existed, because its register spells
its identifiers as bare numbers rather than as `NAME-<digits>`:

```json
{
  "name": "RunnerFact",
  "pad": 1,
  "register": "docs/agents/runner-facts.md",
  "define": "^## ((\\d+)[a-z]?)\\. .+$",
  "spell": "{n}",
  "example": "## 94. The register merge drivers are per-clone and neither install script runs itself",
  "repair": "seat",
  "why": "The numbered sections of the runner-facts register, cited across this repository as section numbers and surfaced by `node tools/seat/env-facts.mjs` as '§3, §9'. The number is allocated by reading the tail, and registers.json's own entry for this register states the measured race: 'Window 41 wrote section 21 and window 42 wrote section 22 within an hour; two concurrent windows would both have written 22', after which 'a cross-reference in another register silently stops resolving'. The namespace name is a label rather than a prefix, because this register spells its identifiers as a bare number; that is why `spell` exists. The letter-suffixed sections (1b, 1c) are deliberately distinct identifiers that share a number: the suffix is how a section is inserted next to a related one without renumbering the file, so `define` captures `1b` as the identifier and `1` as the number it allocates from. Added 2026-11-09 by the engineer seat, same trigger as Window above.",
  "burned": []
}
```

Read the two side by side and the division of labour is visible. `name` is a
label the `--next` flag takes and nothing else; `spell` is the only thing that
decides how an identifier is written; `example` is the line that holds `define`,
`spell` and `pad` to the same convention. In `ADR` all three happen to agree
with `name`, which is why `name` could stand in for `spell` for as long as
every namespace looked like `ADR`.

### 6.3 The output, verbatim, measured 2026-11-09T10:05:42Z on this branch at `e0ddfd22`

```
$ node tools/registers/check-ids.mjs --base HEAD
  ADR-005: 2 distinct definition(s), 2 occurrence(s). Repair held by the owner.
      docs/decisions.md:84 (HEAD) ## ADR-005 — Every seat but sales is active (2026-09-24)
      docs/decisions.md:100 (HEAD) ## ADR-005 — Linear is the board of record; builders build from it (2026-09-23)
  ADR-006: 2 distinct definition(s), 2 occurrence(s). Repair held by the owner.
      docs/decisions.md:92 (HEAD) ## ADR-006 — Ursa is a subcompany of Alexandra Systems Company; HQ's reach is legitimate (2026-09-24)
      docs/decisions.md:172 (HEAD) ## ADR-006 — Linear abandoned; secrets move to Infisical (2026-09-25)
Register identifiers: 151 identifier(s) over 6 register file(s) in 6 namespace(s) across 1 ref(s), from HEAD, clean as far as a seat can take it. 2 collision(s) above need the owner, not a seat. Exit 2.
$ echo $?
2
```

The two ADR collisions are the same two this document was written for and they
are unchanged. What changed is the census: 24 identifiers in 4 namespaces when
this document was written, 151 in 6 now, because the two namespaces added on
2026-11-09 cover 100 numbered sections and the window deltas that the gate had
never read.

**`over 6 register file(s)` is new in this line and is the denominator of
every other number in it (added 2026-11-09, window 110).** The gate already
counted how many `(ref, register)` pairs it had opened and read that count in
no branch of the program, so `0 identifier(s)` and `0 identifier(s) over 0
register file(s)` were the same output. They are not the same fact: the first
reads as a clean register and the second as a gate that found nothing to
grade. Measured on a fixture whose register was renamed with the manifest left
alone, both of this gate's paths were in band and at the reassuring end --
findings said `every one defined once` at exit 0, and `--next Window` answered
`Window 1` at exit 0 over a number a real entry already holds. A namespace
readable at **no** ref in scope is now `REGISTER_UNREAD`, exit 2, under
`scopeUnreadable`; a register absent at one ref of several is still skipped,
because that is a branch cut off an older root. Both are clean, which is the point worth stating plainly: the
addition found no collision to repair and the gate it extends was green over
them the day it landed. The exposure it closes is the next pair of concurrent
windows, and one such pair has already happened — two windows of the exo seat
both claimed 103 and were repaired by renumbering on the merge.

Across `origin/main` and every open pull request head the same run reads 150
identifiers in 6 namespaces across 13 refs, still with the same two findings.
The two extra identifiers are a `RunnerFact` section and a `Window` delta that
exist only on an open head, which is exactly the population a single-ref scan
cannot see and the reason `--heads` exists.

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

# The two namespaces added 2026-11-09, which are the reason `spell` exists.
# These print `Window 106` and `100`, each pasteable into its own register's
# heading. Before `spell` the same two calls would have printed `Window-106`
# and `RunnerFact-1`; see section 9.
node tools/registers/check-ids.mjs --next Window --heads
node tools/registers/check-ids.mjs --next RunnerFact --heads

# The findings as data, for a caller that is not a human.
node tools/registers/check-ids.mjs --heads --json /tmp/ids.json

# Another checkout entirely, which is how the fixture suite drives the scan.
node tools/registers/check-ids.mjs --repo /tmp/fixture --base main

# The precondition this gate shares with every history-reading tool here.
bash tools/ensure-full-clone.sh

# Both suites, 72 cases as of 2026-11-09, 62 when this document was written.
node --test "tools/registers/id-verdict.test.mjs" "tools/registers/check-ids.test.mjs"

# The whole repository's node suites. 1425 cases, 0 failures, measured
# 2026-11-09 on this branch; this document said 421 when it was written, and
# the growth is five weeks of other seats' gates rather than this change.
# Before the closure repin on the next line it reported one failure, and that
# failure was #823's rather than this branch's.
node --test "tools/**/*.test.mjs" "scripts/*.test.mjs"

# The pin a dependency change moves, regenerated rather than hand-edited.
node tools/registers/check-closure.mjs --write

# The verdict-branch enumeration. 56 branches across 12 extracted gates,
# unchanged by this branch. This line said "a sixth gate" when written, which
# was `id-verdict.mjs`'s position in REGISTRY then and is its ninth now.
node tools/gates/enumerate-verdicts.mjs
```

## 8. Tooling list

| Tool and version | Its job in this system | Why it, over what else was considered |
|---|---|---|
| Node.js 22.23.2 (`node --version`, re-read 2026-11-09) | Runs the gate and both suites. ES modules, no transpile step, no `package.json` entry needed. | Every other tool under `tools/` is a Node ES module, so a second runtime would be the only one in the directory. The alternative considered was a Bash script with `grep -n`, which cannot express the "one identifier, two texts, across sixteen refs" rule without a second pass and a temporary file. |
| `node:test`, bundled with Node 22.23.2 | Both suites: 54 pure cases in `id-verdict.test.mjs` and 18 fixture cases in `check-ids.test.mjs`, measured 2026-11-09. It was 48 and 14 when this document was written; the twelve added cases are the spelling round-trip, the five new manifest refusals, and the four scan and allocator cases that drive a bare-numbered namespace. | Already this repository's runner for everything under `tools/` and `scripts/`. `vitest` 5.0.5 is a devDependency of `ursa-major/` and is the runner for that package's TypeScript; using it here would pull a second runner into a directory that has no package manifest. |
| `node:assert` strict mode, bundled | Every assertion, including the literal pins on the verdict lines. | A reworded verdict line must fail a test. `assert.match` alone would pass on a paraphrase, so the clean and collision lines are pinned with `assert.equal` against hand-written literals. |
| git 2.43.0 | `git show <ref>:<path>` is the only way the gate reads a register; `git for-each-ref` enumerates fixture heads; `git rev-parse --verify` is how the base and each head are proved to exist. | The scope is a set of refs, so the working tree is the wrong source: a seat's uncommitted edit is not what a reader of `main` will see. Reading blobs through git also means a register absent at an older branch root is simply absent, with no filesystem special case. |
| GitHub CLI 2.101.0 | `gh pr list --state open --json number` supplies the set of open heads in `--heads` mode, which is the authoritative answer to "what is open" and is not derivable from local refs. | The alternative, treating every `refs/prs/*` ref in the clone as open, silently includes closed and merged pull requests, which would make the allocator skip numbers that are free. In `--repo` mode `gh` is deliberately not used, because it answers about its own working directory and would describe a different repository than the one being scanned. |
| `tools/gates/verdict-shape.mjs`, in-repo at this commit | Supplies `LOCUS`, `verdictOf`, `describeGate` and `renderVerdict`, so this gate's verdict is an object an enumerator can drive rather than a string it prints. | Written for this repository's five earlier gates. Not reimplemented here, because the `GateSpec` contract is the thing that lets `enumerate-verdicts.mjs` prove the gate's counts come from its own findings, and a private copy would be outside that proof. |
| `tools/ensure-full-clone.sh`, in-repo at this commit | The precondition. A seat's clone arrives shallow and single-branch; this gate refuses at exit 2 with `CLONE_SHALLOW` rather than answering from a truncated graph. | Named by `docs/standards/lessons.md` `L-A55` and `L-A77` as the repair for exactly this fault. Detecting the fault and repairing it in-process was rejected: a gate that mutates the clone it is measuring is a gate whose second run differs from its first. |

## 9. The spelling, and why the manifest could not express two of its own registers (added 2026-11-09)

### 10.1 What was wrong

`tools/registers/registers.json` is this repository's other register table: it
declares which append-only files get an entry-keyed merge driver, and for each
one it carries a `why_identifier` field saying what two concurrent appends
would do. Two of its entries describe, in those fields, exactly the race this
gate exists for:

| Register | What `registers.json` already said about it | Declared as a namespace here before 2026-11-09 |
|---|---|---|
| `docs/agents/improvements.md`, whose entries are the per-window deltas HQ's console parses | "two windows filing 'Window 42' are refused by name instead of both landing, which would give the console two deltas for one window" | No |
| `docs/agents/runner-facts.md`, whose entries are the numbered sections every seat cites | "window 41 wrote section 21 and window 42 wrote section 22 within an hour; two concurrent windows would both have written 22", after which "a cross-reference in another register silently stops resolving" | No |

So the identifier gate was not reading two registers whose own merge-table
entries describe an identifier race, and nothing could tell that absence from a
decision, because the manifest's `comment` enumerated two exclusions and
neither of these was among them. Ursa's exo seat found both by hand and
measured the state before reporting them: no duplicate `Window` number and no
duplicate section number on `main`, and across `main` plus every open head no
head introduces a number another head also introduces. The omission was
therefore latent rather than live, and this change repairs nothing. What it
closes is the next pair of concurrent windows, and one such pair has already
happened: two windows of the exo seat both claimed 103, repaired by renumbering
on the merge.

### 10.2 Why it was not four lines of manifest

The gate is data-driven in its scan and was not data-driven in its spelling.
`NAME-<digits>` was hard-coded in two places, and both were invisible while
every declared namespace happened to look like `ADR-007`:

| Site | The old code | What it does to `Window 103` | What it does to a bare-numbered section `93` |
|---|---|---|---|
| the allocator's number | `Number(id.slice(ns.name.length + 1))` | returns `103`, correct by coincidence, since `"Window 103".slice(7)` is `"103"` | returns `0`. `"93".slice("RunnerFact".length + 1)` is `""`, and `Number("")` is `0` rather than `NaN`, so the allocator answers "highest is 0, so the next free one is 1" over a file whose tail is section 98, and sounds certain |
| the allocator's output | `` `${ns.name}-${padded}` `` | prints `Window-104`, which no heading in the register is spelled like, so a seat pasting it mints a definition the `define` pattern cannot see and the next window collides with it | prints `RunnerFact-99` |
| the burn-list validator | `entry.id.startsWith(`${ns.name}-`)` | refuses a legitimate burn of `Window 42` | refuses a legitimate burn of `93` |

The first row is the one worth dwelling on. A gate that refuses to answer is
cheap; a gate that answers wrongly while printing its own reasoning is what
gets a repository into the state §1 describes. So the spelling became a
declared field rather than a convention the code assumed.

### 10.3 What replaced it

Three fields, and the third is what holds the other two honest.

1. **`spell`** is how an allocated number is written into a heading: exactly
   one `{n}`, standing for the number padded to `pad`, with everything else
   literal. `"ADR-{n}"`, `"Window {n}"`, `"{n}"`. Validated for exactly one
   `{n}`, because zero makes the allocator print one identifier forever and
   two makes `String.prototype.replace` substitute only the first and leave a
   literal `{n}` in a heading a seat pastes.
2. **The scan reads the number from `define`'s second capture group**, which
   the validator already guaranteed exists, instead of slicing the identifier.
   The pattern is the authority on its own register; a string slice against an
   unrelated field never was.
3. **`example`** is a heading the register really carries, or a prefix of one.
   The validator refuses the manifest unless `define` matches it *and*
   `spell` writes capture 2 back to exactly capture 1. This is the only check
   that reads `define`, `spell` and `pad` against each other, and it catches
   the failure that is otherwise silent in the worst way: a `define` pattern
   matching no heading in its own register makes the gate count zero
   identifiers there and print `Exit 0`, so the register reads as clean
   because it was never looked at.

`name` survives as a label for `--next` and for the `NAMESPACE_UNKNOWN`
message. It no longer decides how anything is written.

### 10.4 The coverage check, which is the durable half

Adding two namespaces fixes 2026-11-09. What keeps 2026-11-10 from drifting the
same way is that the two register tables are now read against each other.
`tools/registers/id-namespaces.json` carries an `excluded` array, one entry per
register it deliberately does not claim with the reason, and
`tools/registers/id-verdict.test.mjs` fails if any `path` in
`tools/registers/registers.json` appears in neither `namespaces` nor
`excluded`. All eight of the registers declared there are now accounted for:
three claimed (`docs/decisions.md`, `docs/agents/improvements.md`,
`docs/agents/runner-facts.md`) and five excluded, each for a reason that is
different in each case and written beside it.

The check is total rather than clever. It does not try to decide which
`identifier` patterns look like counters, because a heuristic that is wrong
once is worse here than a sentence someone has to write: the only way to add a
register to `registers.json` without accounting for it in the identifier gate
is now to write down why, and a reviewer can read that sentence.

### 10.5 A second latent fault the change surfaced

The scan's map of definitions was keyed on the identifier string alone. That
was correct as long as every namespace carried a distinct prefix, so `ADR-005`
could never be confused with `PWC-5`. `RunnerFact` spells its identifiers as
bare numbers, so a second bare-numbered register would make this register's
section 93 and that one's section 93 one key holding two different texts: a
reported `DOUBLE_DEFINITION` between two files with nothing to do with each
other, filed against a locus that would send a seat to repair it. The key is
now the namespace and the identifier. No such second register exists today,
which is why this is recorded as a fault the change surfaced rather than one it
repaired.

## 10. What this does not do

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
3. **It runs on every change, and only over one ref.** This item said "it
   does not run anywhere automatically" when this document was written and
   that stopped being true on 2026-11-02, when the security seat added
   `register-ids` to `scripts/ci-checks.mjs`. The form that runs is
   `--no-fetch --base HEAD`, with `passExit: [0, 2]`, so it catches a
   collision inside the tree being merged. The `--heads` form, which is the
   one that catches two unmerged branches allocating the same identifier, is
   still unwired and still deliberately so: it needs network and a token, so
   it belongs on a schedule rather than in a per-change gate.
4. **It does not claim any of the five registers in `excluded`.** Those are
   `docs/standards/lessons.md`, `docs/agents/incidents.md`,
   `docs/agents/learning-log.md`, `docs/ideas.md` and
   `docs/agents/merge-order.md`, and the reason is different for each one and
   written beside it in `tools/registers/id-namespaces.json`. Before
   2026-11-09 two of the five were reasoned about in that file's `comment` and
   the other three were simply absent, which is the drift §9 closes.
5. **It does not check that an identifier's own number is the one it should
   have.** `Window 97` sits between `Window 95` and `Window 96` in
   `docs/agents/improvements.md` today, so the register is out of numeric
   order and the gate is silent, because every identifier still resolves to
   exactly one entry. Order is a different property from uniqueness and the
   gate measures uniqueness.

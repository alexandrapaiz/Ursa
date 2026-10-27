# Verdict enumeration: turning a gate sweep from a table into a program

Written 2026-10-26 by the engineer seat. Companion to
`docs/design/verdict-lines.md`, which states the defect class and repairs two
gates by hand. This document covers the follow-on the ledger asked for: making
the inventory of gate verdicts a program's output, so the class can be
re-measured instead of re-argued.

**Scope, stated before anything else.** This is the ledger entry's declared
**first step** and the one slice after it, not the whole idea. **Five** gates
of fourteen candidates are extracted. The remaining nine are listed by
`--census` on every run and are reported as "not yet", never as failures. The
split is in §8.

**Second slice, added the same day (2026-10-26, the re-fired slot).** The first
four gates were ledger and secret checks, three of them already correct, picked
so the shape was proved on working code. The fifth is `tools/board/post.mjs`,
picked for the opposite reason: it is the file the **cause** half of the defect
class was found in. §10 is that extraction, what it cost the shape, and the
twelve-invocation differential that proves no output string changed. It is §10.

---

## 1. The defect this is instrumented against, in one paragraph

A gate prints one sentence a reader acts on. That sentence is defective when it
is not derived from the gate's own findings. Two forms, both observed in this
repository rather than imagined. The **actor** form: a count over findings whose
repairs belong to different people, naming none of them, so the sentence sends
the wrong person to the wrong file. `tools/ledger/check-attributes.mjs` printed
`Merge attributes: 3 violation(s).` at exit 1 over a list mixing a wrong tracked
file with a driver absent from one clone, and on 2026-10-26 three seats each
measured the same fourteen ledger co-appends as conflicts needing a rebase. The
**cause** form: one named cause for a condition reachable several ways, where
for at least one of those ways the named cause is false. `tools/board/post.mjs`
told the reader to set `BOARD_API_URL` when the variable was set and merely
schemeless.

Both were repaired on 2026-10-26. This document is about the third problem,
which is that nothing could tell whether they stay repaired or whether a gate
added next month commits the same thing.

## 2. Why the previous sweep could not be re-run, measured

`docs/design/verdict-lines.md` §4 inventories fifteen gates and their failing
exit branches. It was built with `grep -c 'process.exit([1-9])'` over `tools/`
and `scripts/`. That method was already wrong about three of the four gates
extracted here, and the same branch's repair made it wronger:

| Gate | §4's branch count | Branches the enumerator measures | Why the text sweep was wrong |
|---|---|---|---|
| `tools/ledger/check-closures.mjs` | 2 | **4** | The exit-1 line has two forms. One names the owner's remaining violations, one omits the clause entirely. A reader handed the second form cannot learn a remainder exists. Two forms, one `process.exit(1)`. |
| `tools/ledger/check.mjs` | 2 | **3** | The clean branch had no `process.exit` at all. The script fell off the end of the file and node exited 0 implicitly, so an inventory of exit calls could not see that branch even in principle. |
| `tools/secret-scan.mjs` | 1 | **3** | Its exit 1 is `process.exit(result.ok ? 0 : 1)`, a computed argument that matches no `[1-9]` literal, and its exit 2 lives in a `fail()` helper called from one site. |
| `tools/ledger/check-attributes.mjs` | 1 after repair, 2 before | **3** | The repair replaced two literal exits with `process.exit(result.exitCode)`, so the grep that found the defect began under-reporting the repaired gate. |
| `tools/board/post.mjs` | not in §4's table at all | **10** | Three separate reasons, in one file. Its success line has two forms, because the `, id <8 chars>` clause is printed only when the board's response parses as JSON and carries an id, and that branch has no `process.exit` at all: the module falls off its end and node exits 0 implicitly. Its one `process.exit(2)` covers the four conditions `tools/board/live-target.mjs` distinguishes. Its `--dry-run` branch exits through `process.exit(0)`, which the pattern `[1-9]` cannot match. |
| **Total** | **6** (10 counting post.mjs's four) | **23** | |

So the table was not merely point-in-time, which is `docs/standards/lessons.md`
L-A33. It was incorrect on the day it was written, and its method degrades as
the defect is repaired, which is the worst available direction. The fifth row
is the strongest case: a text sweep sees four failing exit calls in
`post.mjs`, the enumerator drives ten named causes, and the three it cannot
see are unreachable to a text search in principle rather than by accident.

**The generalisation, and where it came from.** `docs/design/verdict-lines.md`
§4 already records that its sweep was keyed on the failing exit branch rather
than on the file, because a file-keyed sweep stops at the first finding per
file. On 2026-10-26 the Ursa/skill seat reported the same distinction from the
other side: a security sweep keyed on **its seat** reported its live branch red,
using six red runs that were real, correctly counted, and belonged to a
different branch whose pull request was already closed. Right data, right
arithmetic, wrong unit. **A check is keyed on the unit the defect lives in, or
its verdict is about something else.** The defect here lives in a verdict
branch, so the enumerator's key is `(gate, cause)` and never a file or a seat.

## 3. System diagram: nodes are real files, edges carry real types

Every node below is a file in this repository. Every edge carries a named type
or a literal format, not a verb.

```
                       ┌───────────────────────────────────────────┐
                       │ tools/gates/verdict-shape.mjs             │
                       │ LOCUS, POSITION, verdictOf, renderVerdict,│
                       │ describeGate                              │
                       └───────────────────────────────────────────┘
                              ▲ Verdict, GateSpec  (imported by all five below)
        ┌─────────────────────┼─────────────────────┬────────────────────────┐
        │                     │                     │                        │
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌────────────────────────┐
│ tools/ledger/     │ │ tools/ledger/     │ │ tools/ledger/     │ │ tools/                 │
│ closures-         │ │ contract-         │ │ attributes-       │ │ secret-scan-           │
│ verdict.mjs       │ │ verdict.mjs       │ │ verdict.mjs       │ │ verdict.mjs            │
│ verdict(), GATE   │ │ verdict(), GATE   │ │ verdict(), GATE   │ │ verdict(), unusable(), │
│                   │ │                   │ │                   │ │ hitLine(), GATE        │
└───────────────────┘ └───────────────────┘ └───────────────────┘ └────────────────────────┘
        │ Verdict             │ Verdict             │ Verdict              │ Verdict
        ▼                     ▼                     ▼                      ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐ ┌────────────────────────┐
│ tools/ledger/     │ │ tools/ledger/     │ │ tools/ledger/     │ │ tools/secret-scan.mjs  │
│ check-closures.mjs│ │ check.mjs         │ │ check-attributes  │ │ (the CLI)              │
│ (the CLI)         │ │ (the CLI)         │ │ .mjs (the CLI)     │ │                        │
└───────────────────┘ └───────────────────┘ └───────────────────┘ └────────────────────────┘
        │ stdout/stderr text lines + process exit status (0 | 1 | 2)
        ▼
    the reader, and GitHub Actions log annotations (`::error::`, `::warning::`)

┌────────────────────────────────┐
│ tools/board/post-verdict.mjs   │   (the fifth extraction, §11)
│ verdict(), unreachable(), GATE │
└────────────────────────────────┘
        │ Verdict                      ▲ {code, line, repair} | null
        ▼                              │ (liveTargetFault)
┌────────────────────────────────┐   ┌──────────────────────────────┐
│ tools/board/post.mjs (the CLI) │──▶│ tools/board/live-target.mjs  │
│ say() -> renderVerdict()       │   │ liveTargetFault({apiUrl,     │
│                                │   │   token})                    │
└────────────────────────────────┘   └──────────────────────────────┘
        │ stdout/stderr text lines + process exit status (0 | 1 | 2 | 3)
        │ and, on the exit-0 path only, an HTTP POST of
        │ application/json to ${BOARD_API_URL}/api/messages
        ▼
    the reader, and the company board's message store

        ┌──────────────────────────────────────────────────────────────┐
        │ tools/gates/enumerate-verdicts.mjs                           │
        │ REGISTRY -> dynamic import() -> GateSpec[]                   │
        └──────────────────────────────────────────────────────────────┘
          │ GateSpec.probes: Probe[]          ▲ Verdict (one per probe)
          ▼                                   │
        gate.verdict(findings, seen) ─────────┘
          │ {gate, cause, exit, stream, position, derived_from,
          │  loci_present, unkeyed_findings, line, rendered}  = BranchRow
          ▼
        checkProbe() + checkGateWide() ──> Finding[]  {locus, rule, message}
          │                                  │
          │ seen: {gates, branches, probes,  │
          │        broken, extracted,        │
          │        candidates}               ▼
          └───────────────────────────> verdict(Finding[], seen) -> Verdict
                                              │ exit 0 | 1 | 2
                                              ▼
                                        stdout table, or --json document

        ┌──────────────────────────────────────────────────────────────┐
        │ git ls-files tools scripts  ──> newline-delimited paths      │
        │ git show HEAD:<path>        ──> UTF-8 source text            │
        └──────────────────────────────────────────────────────────────┘
          │ CensusRow {path, extracted, exitCalls, branchesMeasured}
          ▼
        the --census table
```

Edge types in full, because a diagram label is not a contract:

| From | To | What crosses it |
|---|---|---|
| `verdict-shape.mjs` | the four verdict modules | the `Verdict` and `GateSpec` type definitions, plus the `LOCUS` and `POSITION` string-constant objects and the `verdictOf`, `renderVerdict` and `describeGate` functions |
| a verdict module | its CLI gate | one `Verdict` object per invocation |
| a CLI gate | the reader | UTF-8 lines on file descriptor 1 or 2, and a process exit status of 0, 1 or 2 |
| `REGISTRY` (a string array in the enumerator) | the enumerator | four module specifier strings, resolved by `import()` against `import.meta.url` |
| a `GateSpec` | the enumerator | `probes: Array<{name, findings, seen}>` — the input space only |
| the enumerator | `gate.verdict` | `(findings: unknown[], seen: object)` |
| `gate.verdict` | the enumerator | a `Verdict`, which the enumerator records and never predicts |
| the enumerator | its own `verdict()` | `Finding[]` plus a `seen` census object |
| `git ls-files` / `git show` | `census()` | newline-delimited repository-relative paths, then UTF-8 source text per path |

## 4. Interfaces at every component boundary, as real TypeScript signatures

These are the signatures a caller writes against. The implementation is
JavaScript with JSDoc; the types below are the contract those annotations state.

```ts
// tools/gates/verdict-shape.mjs

type Locus = 'reader' | 'committed' | 'clone' | 'seat' | 'owner'
type Position = 'before' | 'after'

interface Verdict {
  exitCode: 0 | 1 | 2 | 3   // 3 added 2026-10-26 with post.mjs; see §10
  stream: 'out' | 'err'
  line: string           // the one sentence a reader quotes
  position: Position     // where `line` sits relative to the per-finding lines
  trailer: string[]      // further lines printed after the findings
  derivedFrom: 'findings' | 'ground'
  cause: string          // the single named condition this branch is for
  cites: Locus[]         // the loci whose counts `line` may quote
  quoted: string[]       // substrings of `line` taken verbatim from an
                         // observed input, not computed from findings: an
                         // HTTP status, a response body, a record id.
                         // Integers inside one of these are exempt from
                         // COUNTS_DERIVED, and nothing else is.
}

interface GateSpec<F = unknown> {
  id: string                                   // path, as named in the repository
  verdict: (findings: F[], seen: object) => Verdict
  loci: Record<Locus, { noun: RegExp }>        // pattern proving the line names it
  findingsLocus?: Locus                        // when the locus is per-invocation
  probes: Array<{ name: string; findings: F[]; seen?: object }>
  groundProbes?: Array<{ name: string; call: () => Verdict }>
}

declare function verdictOf(
  v: Partial<Verdict> & Pick<Verdict, 'exitCode' | 'line' | 'cause'>,
): Verdict
declare function renderVerdict(v: Verdict, findingLines?: string[]): string[]
declare function describeGate<F>(spec: GateSpec<F>): GateSpec<F>  // throws if malformed
```

```ts
// tools/board/post-verdict.mjs

interface PostFinding {
  locus: 'reader' | 'committed'
  scope: 'message' | 'sender' | 'store'   // which check produced it
  code?: string                           // the violation code, for its own line
  line?: string                           // what is wrong, in words
  repair?: string                         // what the reader does about it
  status?: number                         // `store` only: the HTTP status
  body?: string                           // `store` only: the response body
}

interface PostSeen {
  dryRun?: boolean
  kind?: string        // the message kind, for the success line
  toCompany?: string   // falls back to '(all companies)' in the line
  toSeat?: string      // falls back to '(everyone)' in the line
  id?: string          // the row id the board returned, truncated to 8 chars
}

declare function verdict(findings: PostFinding[], seen: PostSeen): Verdict
declare function unreachable(
  fault: { code: string; line: string; repair: string },  // one liveTargetFault
): Verdict                                                // derivedFrom: 'ground'
```

```ts
// tools/board/live-target.mjs, pre-existing, consumed by the above
declare function liveTargetFault(env: { apiUrl?: string; token?: string }):
  | null
  | { code: 'BOARD_ENV_ABSENT' | 'BOARD_URL_ABSENT'
          | 'BOARD_URL_SCHEMELESS' | 'BOARD_TOKEN_ABSENT'
      line: string; repair: string }
```

```ts
// tools/ledger/closures-verdict.mjs  and  tools/ledger/contract-verdict.mjs
interface HeldViolation { held: 'seat' | 'owner'; rule: string; message: string }

// closures
declare function verdict(
  violations: HeldViolation[],
  seen?: { markers?: number; docs?: number; ledgerPath?: string },
): Verdict
// contract
declare function verdict(
  violations: HeldViolation[],
  seen?: { blocks?: number; path?: string },
): Verdict
```

```ts
// tools/ledger/attributes-verdict.mjs
interface AttributeViolation { locus: 'committed' | 'clone'; message: string }
declare function verdict(
  violations: AttributeViolation[],
  seen?: { declared?: number; drivers?: string[]; checkedClone?: boolean },
): Verdict
declare const COMMITTED: 'committed'
declare const CLONE: 'clone'
```

```ts
// tools/secret-scan-verdict.mjs
interface Hit { class: string; where: string; line: number; blob?: string }
interface ScanResult {
  mode: 'tree' | 'history' | 'history-since'
  since: string | null
  scanned: number
  unit: string            // 'tracked files' or 'blobs'
  classes: number
  hits: Hit[]
  skipped_oversize?: number
  skipped_unreadable?: number
}
declare function verdict(hits: Hit[], seen: ScanResult): Verdict
declare function unusable(why: string, detail?: string): Verdict  // derivedFrom: 'ground'
declare function hitLine(hit: Hit): string                        // never a value
```

```ts
// tools/gates/enumerate-verdicts.mjs
interface Finding { locus: Locus; rule: string; message: string }
interface DrivenProbe {
  probe: { name: string; findings: unknown[]; seen?: object
           partitions: Record<Locus, number>; unkeyed: number }
  v: Verdict
  kind: 'findings' | 'ground'
}

declare function partition(
  gate: GateSpec, probe: { findings: unknown[] },
): { counts: Record<Locus, number>; unkeyed: number }
declare function driveGate(gate: GateSpec): DrivenProbe[]
declare function checkProbe(
  gate: GateSpec, probe: DrivenProbe['probe'], v: Verdict,
): Finding[]
declare function checkGateWide(gate: GateSpec, driven: DrivenProbe[]): Finding[]
declare function verdict(
  findings: Finding[],
  seen?: { gates?: number; branches?: number; probes?: number
           broken?: Array<{ spec: string; why: string }>
           extracted?: number; candidates?: number },
): Verdict
```

The last four are exported for one stated reason: the test suite drives a
**synthetic** gate — one that commits the defect on purpose — through the same
code path the committed gates take. The first draft of that suite
re-implemented them, which would have proved the checks fire in a copy while
the program's own copy drifted green.

## 5. The six properties, and what each would catch

Each is checked per driven probe, or per gate where noted. `rule` is the string
the enumerator prints in its `::error::` annotation.

| Rule | What it asserts | The real defect it would catch |
|---|---|---|
| `CAUSE_NAMED` | `Verdict.cause` is a non-empty string | Two disjoint conditions behind one exit code, indistinguishable to a reader and to this tool. The cause form of §1. |
| `EXIT_0_WHEN_CLEAN` | exit status is 0 exactly when the findings array is empty | A gate reporting a defect as clean, or going red with nothing to show. |
| `ACTOR_UNMEASURABLE` | every finding carries a locus, by `locus`, `held`, or the gate's `findingsLocus` | A finding the actor check **cannot see**. Reported, never passed over: a check whose blind spot looks like a pass is this whole document's subject. |
| `MIXED_LOCI_NAMED` | when findings span two or more loci, the verdict text names each one, matched against that locus's declared `noun` pattern | The actor form of §1 exactly. `Merge attributes: 3 violation(s).` fires this twice, once per unnamed locus. |
| `COUNTS_DERIVED` | every integer in `line` is a locus count, the findings total, the exit code, a number in `seen`, or an integer inside a string the gate declared in `Verdict.quoted` | A count independent of the findings — the same defect arriving as arithmetic rather than as a missing noun. |
| `QUOTED_IS_QUOTED` | every string in `Verdict.quoted` really appears in `line` or `trailer` | An exemption with nothing behind it: a gate buying silence for an invented count by declaring a quotation it never prints. Added with the fifth gate; §10.3 says why the exemption had to exist at all. |
| `ONE_CAUSE_PER_OUTCOME` (per gate) | no two causes render to an identical exit code and line; no one cause exits two ways | A cause name that does not identify its condition, which makes the other four checks meaningless. |

**Why the checks read `line` and `trailer` together.** A gate is allowed to name
a locus only in its trailer. This is a design allowance, proved by a synthetic
gate in `tools/gates/enumerate-verdicts.test.mjs`, and it is **not** a property
of `tools/secret-scan.mjs`: every hit in one `secret-scan` invocation shares one
locus, so `MIXED_LOCI_NAMED` cannot fire on that gate at all.

**What these six do not check**, stated here because the first draft of
`closures-verdict.mjs` failed on exactly this: whether a gate's *partition
logic* places findings correctly. All probes supply a locus, so an unkeyed
finding never reaches the enumerator. The latent defect in §7 was caught by a
unit test written against the module's documented intent, not by the
enumerator. The enumerator measures branches; it does not generate inputs.

## 6. On-disk layouts, real paths, real payloads

Nothing here persists state. The two outputs are stdout text and a
`--json` document on stdout; no cache, no lock file, no fixture directory.

```
tools/
  gates/
    verdict-shape.mjs              the Verdict and GateSpec contract
    enumerate-verdicts.mjs         the enumerator, and its own verdict
    enumerate-verdicts.test.mjs    18 cases, incl. the pre-repair regression
  ledger/
    closures-verdict.mjs           + closures-verdict.test.mjs    (6 cases)
    contract-verdict.mjs           + contract-verdict.test.mjs    (6 cases)
    attributes-verdict.mjs         + attributes-verdict.test.mjs  (pre-existing)
  secret-scan-verdict.mjs          + secret-scan-verdict.test.mjs (9 cases)
  board/
    post-verdict.mjs               + post-verdict.test.mjs        (17 cases)
    post.mjs                       the CLI, now printing through say()
    live-target.mjs                the four unreachable-board conditions
docs/design/
  verdict-lines.md                 the defect class and the two hand repairs
  verdict-enumeration.md           this document
```

One real `--json` branch row, copied from a live run of
`node tools/gates/enumerate-verdicts.mjs --json` on this branch. The `12` and
`3` are the synthetic census values the probe supplies, and `docs/ideas.md` is
this repository's real ledger path:

```json
{
  "gate": "tools/ledger/check-closures.mjs",
  "probe": "both loci",
  "cause": "SEAT_REPAIRABLE_WITH_OWNER_REMAINDER",
  "exit": 1,
  "stream": "out",
  "position": "after",
  "derived_from": "findings",
  "kind": "findings",
  "loci_present": ["seat", "owner"],
  "unkeyed_findings": 0,
  "line": "Closure backlinks: 12 closure marker(s) in 3 document(s), against docs/ideas.md, 1 violation(s) a seat can repair and 2 the owner holds. Exit 1.",
  "rendered": [
    "  <one finding>",
    "  <one finding>",
    "  <one finding>",
    "Closure backlinks: 12 closure marker(s) in 3 document(s), against docs/ideas.md, 1 violation(s) a seat can repair and 2 the owner holds. Exit 1."
  ]
}
```

The run's own verdict object, from the same invocation:

```json
{
  "exitCode": 0,
  "stream": "out",
  "position": "after",
  "trailer": [],
  "derivedFrom": "findings",
  "cause": "ALL_BRANCHES_HOLD",
  "cites": [],
  "line": "Verdict enumeration: 13 distinct branch(es) across 4 extracted gate(s), reached by 17 probe(s), every one deriving its exit code and its counts from its own findings. 4 of 14 gate(s) in tools/ and scripts/ are extracted; the rest are listed by --census and are not failures."
}
```

One real census row, same invocation:

```json
{ "path": "scripts/dep-floor.mjs", "extracted": false, "exitCalls": 1, "branchesMeasured": null }
```

**Redaction note.** Nothing in this system reads a home directory, a session
identifier or a private record, so the redaction rider in
`prompts/engineer-agent.md` element 3 has no field to apply to here. The one
adjacent risk is the opposite direction and is covered in §7: a verdict module
is a formatting surface for `tools/secret-scan.mjs`, whose charter rule is that
a credential value is never printed, not even truncated, not even in `--json`.

## 7. The defect this work introduced and then caught, and the two it found

Recorded because a document claiming a tool prevents a class of defect should
say what it did to the author.

**Caught by a test, in the module written to prevent it.**
`closures-verdict.mjs` filtered findings with two equality tests:

```js
const bySeat = violations.filter((v) => v.held === LOCUS.SEAT)
const byOwner = violations.filter((v) => v.held === LOCUS.OWNER)
```

A finding with no `held` field joins neither array. `bySeat.length === 0` then
holds, so the gate takes the exit-2 branch and prints *"clean as far as a seat
can take it. 0 violation(s) above need the owner, not a seat."* A seat's own
defect, reported as not the seat's, over a count of nothing. The comment
directly above those two lines asserted the opposite behaviour. It is **latent,
not live**: all three construction sites in `check-closures.mjs` set `held`, the
innermost through `?? 'seat'`, so no committed input reaches it, and the
differential against the parent commit is byte-identical either way. Inherited
from the original gate, not introduced by the extraction. `check.mjs` had the
same shape and the same fix. Both now filter `!== LOCUS.OWNER` for the seat
bucket, so an unkeyed finding lands on the louder exit code and on the actor
reading the output, which is the convention `attributes-verdict.mjs` already
used.

**Introduced, and caught by the repository's own gate within the minute.** The
first draft of `secret-scan-verdict.test.mjs` asserted that a credential value
was absent from the verdict output, using the canonical AWS documentation
example key as a literal. Two things were wrong with it. The value was never
passed into the module, so the assertion was about nothing. And the literal is
credential-shaped, so committing it turned `node tools/secret-scan.mjs` red on a
tracked file — the gate whose own verdict module this was. The replacement pins
the thing that can actually go wrong: a hit object carrying the matched text on
an extra field, which a spread anywhere in the module would print. It uses a
sentinel that is deliberately not credential-shaped. Worth recording because the
failure mode was a test that both proved nothing and broke a gate, and the only
reason it surfaced in the same hour is that the gate exists and was run.

**Found in `tools/secret-scan.mjs`: the verdict is not the last line.** It
prints its summary first and then the hits, so a reader scanning a log for
`0 hit(s)` does not have to pass the hits to find it. A contract specifying
"the last line a gate prints" would have been wrong about this gate
immediately. `POSITION` exists because of it. The ledger entry's first step
predicted this: extract the gates that are already right, and if one resists
the shape, the resistance is the finding.

**Found in `tools/secret-scan.mjs`: exit 2 has no findings.** `fail()` fires
when `--history` is asked of a shallow clone. The scanner cannot establish the
facts, so there is no findings array and nothing about that branch can be
checked against findings. It is exported as `unusable()` with
`derivedFrom: 'ground'`, and the enumerator skips the findings-derived checks
for it rather than passing it vacuously. The separate ledger entry "A gate's
exit codes are a contract, and nothing in this repository states it" is the
proper home for this distinction; `derivedFrom` is what lets the enumerator work
before that lands.

## 8. Exact commands

The literal invocations. `$` lines are commands; the rest is real output from
this branch.

```bash
# The inventory. One row per driven probe; exit 0 when every branch holds.
$ node tools/gates/enumerate-verdicts.mjs
tools/ledger/check-closures.mjs    exit 0  out  after   findings  ALL_CLOSED                            -
tools/ledger/check-closures.mjs    exit 1  out  after   findings  SEAT_REPAIRABLE                       seat
tools/ledger/check-closures.mjs    exit 2  out  after   findings  OWNER_REMAINDER_ONLY                  owner
tools/ledger/check-closures.mjs    exit 1  out  after   findings  SEAT_REPAIRABLE_WITH_OWNER_REMAINDER  seat+owner
...
tools/secret-scan.mjs              exit 2  err  before  ground    SCANNER_GROUND_UNUSABLE               n/a
Verdict enumeration: 13 distinct branch(es) across 4 extracted gate(s), reached by 17 probe(s), ...

# Which gates are extracted, and the comparison this tool exists to make.
$ node tools/gates/enumerate-verdicts.mjs --census

# The same data for a machine. Four top-level keys: branches, findings,
# census, verdict.
$ node tools/gates/enumerate-verdicts.mjs --json

# The suites. 21 cases over the three ledger and secret verdict modules, 17
# over post-verdict.mjs, 18 over the enumerator. 56 new cases in total.
$ node --test tools/ledger/closures-verdict.test.mjs \
               tools/ledger/contract-verdict.test.mjs \
               tools/secret-scan-verdict.test.mjs
$ node --test tools/board/post-verdict.test.mjs
$ node --test tools/gates/enumerate-verdicts.test.mjs

# The neighbouring suites, for regressions in the files post.mjs imports.
$ node --test tools/board/check.test.mjs tools/board/live-target.test.mjs
# -> 70 pass, 0 fail (with the ledger and secret suites above)

# Proof that the checks can fail rather than merely passing four gates. Disable
# two checks and two cases go red; restore and they pass.
$ sed -i 's/  if (present.length > 1) {/  if (false \&\& present.length > 1) {/' \
      tools/gates/enumerate-verdicts.mjs
$ node --test tools/gates/enumerate-verdicts.test.mjs   # -> 2 failures
$ git checkout tools/gates/enumerate-verdicts.mjs

# Proof that no output string changed: run each gate at the parent commit and
# at this one and diff the bytes, including exit status.
$ git worktree add /tmp/before <parent-sha>
$ for g in tools/ledger/check-closures.mjs tools/ledger/check.mjs \
           tools/ledger/check-attributes.mjs; do
    (cd /tmp/before && node $g > /tmp/b 2>&1; echo "rc=$?" >> /tmp/b)
    node $g > /tmp/a 2>&1; echo "rc=$?" >> /tmp/a
    diff /tmp/b /tmp/a && echo "IDENTICAL $g"
  done

# secret-scan's census differs between the two commits because this branch
# adds tracked files, so point the new code at the old tree instead.
$ node tools/secret-scan.mjs --repo=/tmp/before
$ (cd /tmp/before && node tools/secret-scan.mjs)

# The three paths whose SHAPE differs: a hit, a shallow clone, and --json.
$ git init -q /tmp/canary && printf 'aws_access_key_id = AKIA<20-char-example>\n' \
      > /tmp/canary/conf.txt
$ git -C /tmp/canary add -A && git -C /tmp/canary \
      -c user.email=a@b -c user.name=a commit -qm x
$ node tools/secret-scan.mjs --repo=/tmp/canary          # -> rc 1, five lines
$ git clone --depth 1 file://$PWD /tmp/sh --quiet
$ node tools/secret-scan.mjs --history --repo=/tmp/sh    # -> rc 2, ground verdict
$ node tools/secret-scan.mjs --json --repo=/tmp/canary

# The gates themselves, which is what CI runs.
$ node tools/ledger/check.mjs docs/ideas.md
$ node tools/ledger/check-closures.mjs
$ node tools/ledger/check-attributes.mjs
$ node tools/secret-scan.mjs
$ node scripts/redaction-check.mjs
```

### The fifth gate's differential, which needs a board to answer

`post.mjs` reaches three of its ten branches only against a live HTTP endpoint,
so the differential runs them against a stub on loopback rather than against the
company board. Posting eleven test messages to the real board to prove a
refactor changed nothing would be eleven rows on the bus that nobody asked for.

```bash
# The stub. One status and one body per mode, nothing else.
$ cat > /tmp/stub-board.mjs <<'STUB'
import { createServer } from 'node:http'
const mode = process.argv[2]
const bodies = {
  refuse: [422, '{"error":"a message needs a subject"}'],
  accept: [201, '{"id":"0123456789abcdef0123456789abcdef"}'],
  prose:  [201, 'ok, stored'],
}
const [status, body] = bodies[mode]
createServer((req, res) => { res.writeHead(status, {'content-type':'application/json'}); res.end(body) })
  .listen(Number(process.argv[3]), '127.0.0.1')
STUB

# The old code to compare against, materialised from the parent commit.
$ git worktree add /tmp/before HEAD

# One branch, both sides, bytes and status compared. `env -u` is load-bearing:
# the seat runtime exports BOARD_API_URL and BOARD_RUNTIME_TOKEN, so without
# it the four ground branches cannot be reached at all.
$ node /tmp/stub-board.mjs refuse 18311 &
$ for side in /tmp/before /tmp/epito-ursa-engineer-izUBi5; do
    (cd $side && env -u BOARD_API_URL -u BOARD_RUNTIME_TOKEN \
        BOARD_API_URL=http://127.0.0.1:18311 BOARD_RUNTIME_TOKEN=t \
        node tools/board/post.mjs --kind note --to-seat pm --to-company Ursa \
          --subject "a message that passes the local checks" \
          --body-file /tmp/msg.md > $side.out 2> $side.err; echo "rc=$?" >> $side.err)
  done
$ diff /tmp/before.err /tmp/epito-ursa-engineer-izUBi5.err && echo IDENTICAL

# The real stderr of that branch, exit 3, verbatim:
The board refused it with 422: {"error":"a message needs a subject"}
  This checker passed a message the store rejected, which means a rule here is
  out of date. Transcribe the failing rule from runtime/board/store.py into
  tools/board/check.mjs so the next seat is told locally instead of by the board.

# The branch the repair of 2026-10-26 exists for, exit 2, verbatim. The
# variable IS set, and the sentence says so instead of asking for it again.
$ env -u BOARD_API_URL BOARD_API_URL=board.example/api BOARD_RUNTIME_TOKEN=t \
    node tools/board/post.mjs --kind note --to-seat pm --to-company Ursa \
      --subject "a message that passes the local checks" --body-file /tmp/msg.md
BOARD_URL_SCHEMELESS: BOARD_API_URL is set to "board.example/api", which carries no http:// or https:// scheme, so fetch cannot use it. It is set; it is not usable.
  repair: set BOARD_API_URL to a full origin such as https://board.example/ — this is the runtime handing over a value, not a message this seat can edit
  Nothing was sent, and nothing about the message itself is wrong.

# Proof the new exemption is load-bearing rather than decorative: strip the
# `quoted` declarations from post-verdict.mjs and the enumerator goes red on
# five branches, naming the 422 and the four digits of the truncated id.
$ node tools/gates/enumerate-verdicts.mjs   # -> rc 1, 5 COUNTS_DERIVED findings
```

## 9. Tooling list, with versions and the alternative rejected for each

| Tool | Version here | Its job in this system | Chosen over, and why |
|---|---|---|---|
| Node.js | v22.23.2 | Runs every module and the enumerator. ES modules with top-level `await` for the dynamic `import()` of the registry, and `import.meta.url` to resolve registry specifiers relative to the enumerator rather than to the process working directory. | A TypeScript build step. Every other tool in `tools/` is plain `.mjs` with JSDoc types, so adding a compile step would make these four files the only ones needing one, and a gate that cannot be run straight from a fresh clone is a gate nobody runs. Types are stated in §4 and in JSDoc. |
| `node:test` | bundled with Node v22.23.2 | All 36 new cases. Gives `describe`/`it`, and `node --test <glob>` matches how every existing suite in `tools/` is run. | Vitest or Jest. Both are real dependencies with a lock-file footprint, and `scripts/dep-floor.mjs` exists in this repository to police exactly that. Zero new dependencies was a hard constraint, not a preference. |
| `node:assert` (strict) | bundled | Literal-equality assertions over whole output lines. `assert.deepEqual` over `renderVerdict`'s array pins the five-line `secret-scan` rendering. | A snapshot library. A snapshot that regenerates on demand is how a reworded verdict line passes silently, which is the failure this whole branch is about. |
| Git | 2.43.0 | `git ls-files tools scripts` enumerates census candidates; `git show HEAD:<path>` reads committed source so an uncommitted edit cannot change the census; `git worktree add` materialises the parent commit for the differential check. | Reading the working tree with `node:fs`. The census would then describe uncommitted local edits, so two seats on the same commit could get different censuses. |
| `node:child_process` `execFileSync` | bundled | Invokes `git`, and runs the enumerator as a subprocess in its own end-to-end tests. `execFileSync` takes an argument array. | `exec`/`execSync`, which take a shell string and would make a repository path containing a space or a quote into a shell-injection surface. |
| `node:http` `createServer` | bundled with Node v22.23.2 | The 40-line stub board in §8 that answers 422, 201-with-id and 201-with-prose, so `post.mjs`'s exit-3 and two exit-0 live branches can be driven in the differential. | Three alternatives, all rejected. Posting to the real company board would put eleven test rows on a bus five seats read. `nock` or `msw` would be a new dependency, and `scripts/dep-floor.mjs` exists to police exactly that. Monkey-patching `globalThis.fetch` would test a patched `post.mjs` rather than the one that ships, and `post.mjs` awaits its `fetch` at module scope, which is why `live-target.mjs` was split out in the first place. |
| `env -u` (coreutils 8.32) | system | Unsets `BOARD_API_URL` and `BOARD_RUNTIME_TOKEN` for one command, so the four unreachable-board branches are reachable inside a seat runtime that exports both. | `unset` in the calling shell, which would leak into every later command in the run, including the ones that legitimately need a live board. |
| `diff` (diffutils 3.10) | system | Compares stdout, stderr and exit status between the two worktrees, byte for byte. | Comparing by eye, or asserting on a substring, which is how a trailing-whitespace or newline change passes a refactor that claims byte identity. |

## 10. The fifth gate: `tools/board/post.mjs`, and what extracting it cost

### 10.1 Why this gate and not the next one in the census

The first four extractions were chosen to be easy: three of them already
derived their verdicts correctly, so a failure would have been a failure of the
shape rather than of the gate. `post.mjs` is the opposite choice. It is the file
the **cause** form of §1 was found in. Its live-target branch used to read:

```js
if (!url.startsWith('http') || !token) {
  console.error('BOARD_API_URL and BOARD_RUNTIME_TOKEN must both be set, ...')
```

One named cause for a condition reachable three ways, and false for one of the
three: with `BOARD_API_URL=board.example/api` the variable **is** set, and a
seat told to set it goes looking in the wrong place. That was repaired by hand
on 2026-10-26 into `tools/board/live-target.mjs`, which returns one of four
named codes. Until this extraction, nothing could tell whether the repair
stayed repaired. Now the four conditions are four rows of
`enumerate-verdicts.mjs` output on every run, and
`post-verdict.test.mjs` asserts that the schemeless sentence still contains
"It is set; it is not usable." and still does not contain "must both be set".

### 10.2 The ten branches, and which of them a text sweep can see

| Cause | Exit | Stream | Derived from | Visible to `grep -c 'process.exit([1-9])'` |
|---|---|---|---|---|
| `MESSAGE_REFUSED_LOCALLY` — `check.mjs` found something wrong with the message, so nothing was sent | 1 | stderr | findings | yes, one of the four |
| `SENDER_COMPANY_SPELLING` — the sender's own company is not a key the bus routes, which is how a row reaches a store and wakes nobody | 1 | stderr | findings | yes, one of the four |
| `STORE_REFUSED_WHAT_CHECKER_PASSED` — the board rejected a message the local rules passed, so a rule in `tools/board/check.mjs` is out of date | 3 | stderr | findings | yes, one of the four |
| `BOARD_ENV_ABSENT` — neither variable is set, so the run is not under the seat runtime | 2 | stderr | ground | collapsed: all four share one `process.exit(2)` |
| `BOARD_URL_ABSENT` — the token is set and the url is not, so the token has no board to authenticate to | 2 | stderr | ground | collapsed |
| `BOARD_URL_SCHEMELESS` — the url is set and carries no scheme, so `fetch` cannot use it; the repair is the runtime's, not the message's | 2 | stderr | ground | collapsed |
| `BOARD_TOKEN_ABSENT` — the url is set and the token is not, so every post would be refused unauthenticated | 2 | stderr | ground | collapsed |
| `CHECKED_CLEAN_DRY_RUN` — `--dry-run` found nothing wrong and names who would be woken | 0 | stdout | findings (empty) | no: `process.exit(0)` does not match `[1-9]` |
| `POSTED` — the row exists and this line names its first eight characters | 0 | stdout | findings (empty) | no: this path has no `process.exit` at all |
| `POSTED_ID_UNREADABLE` — the row exists and its id could not be read out of the response | 0 | stdout | findings (empty) | no, twice over: no exit call, and no clause of its own |

Four exit calls, ten branches, and the three the sweep misses are the three a
reader most needs named.

### 10.3 What the extraction cost the Verdict shape, and why that is the point

Two widenings, both of them things the first four gates could not have
discovered. An extraction that cost nothing would have meant the sample was
still too similar to itself.

1. **`exitCode` is `0 | 1 | 2 | 3`.** `post.mjs` is the only gate in this
   repository that emits 3, and 3 means something no other code here means:
   the downstream store refused what this checker passed, so the defect is in
   the checker. Four ledger and secret gates emit 0, 1 and 2 only, so the type
   written for them was exactly as wide as its sample.
2. **`quoted: string[]`, and the `QUOTED_IS_QUOTED` check that polices it.**
   `COUNTS_DERIVED` reads every integer in a verdict line and demands the
   findings support it. That is right for a count and wrong for a quotation.
   `The board refused it with 422: {"error": ...}` and `Posted note to Ursa/pm,
   id 01234567.` both carry integers that are facts about a response, so no
   partition of the findings can produce them, and the honest line failed the
   check. The exemption is deliberately narrow: the integer has to sit inside a
   string the gate **declared**, the declared string has to actually appear in
   the verdict, and a declaration that does not appear is a finding of its own.
   Measured both directions — stripping the declarations turns five branches
   red, and a synthetic gate that declares `'99 of the reader\'s files'` while
   printing `99 problem(s) for the reader.` is caught.

### 10.4 Behaviour this extraction did change, stated because "byte-identical" is a claim about output

One thing is different and it is not an output string. The success path used to
fall off the end of the module, so node exited 0 implicitly; it now ends in
`process.exit(0)` through `say()`. The same change was made to
`tools/ledger/check.mjs` in the first slice, for the same reason: a branch with
no exit call cannot be found by any sweep of exit calls, and more importantly a
reader cannot tell an intended success from a module that stopped early.

The risk that buys is real and bounded. `process.exit` does not wait for an
async write to drain, so a long line through a pipe can be truncated where the
implicit exit would have flushed it. Measured rather than assumed: with stdout
redirected to a file, the posted line arrives whole at 37 bytes and the
`--dry-run` branch at 525 bytes, which is the largest thing this gate prints to
stdout. The branch that prints the board's whole response body goes to stderr,
which Node writes synchronously to a file or a pipe.

### 10.5 Two defects found in `post.mjs` while extracting it, neither repaired here

Both are recorded in `docs/ideas.md` rather than fixed, because fixing either
one changes an output string and would have dissolved the differential evidence
this slice rests on. Naming them here is the alternative to fixing them
quietly.

1. **A 2xx with an unreadable id is reported as a plain success.** `POSTED` and
   `POSTED_ID_UNREADABLE` print `Posted note to Ursa/pm, id 01234567.` and
   `Posted note to Ursa/pm.`, and the second says nothing about the id being
   absent. A seat that wanted to quote the row in a follow-up cannot tell
   whether the board gave no id or the line simply did not mention it. This is
   the same shape as `check-closures.mjs`'s conditional owner clause, which is
   how the branch was noticed.
2. **`--dry-run` prints a request line that is not a request.** The url is
   built from `BOARD_API_URL` before the live-target check runs, so a dry run
   in a clone with no runtime prints `POST /api/messages`, then the payload,
   then `Checked clean.` Verified by running it with both variables unset. The
   verdict is about the message and is true; the line above it describes a post
   to a path with no origin, which is the one thing a dry run exists to show.

## 11. Terms used in this document

No cell above is a bare noun; each term is defined here or in place.

| Term | Definition |
|---|---|
| **gate** | A command that inspects this repository and exits non-zero when it finds something wrong. The fourteen candidates are listed by `--census`. |
| **verdict** | The one sentence a gate prints for a reader to act on, together with the exit status that must agree with it. |
| **verdict module** | A pure file exporting `verdict()`, importable and callable with synthetic input, holding no state and reading no files. |
| **branch** (of a verdict) | One named condition the verdict distinguishes, identified by `(gate, cause)`. The unit this tool is keyed on. |
| **cause** | The `SCREAMING_SNAKE` name a verdict gives the single condition that produced it, e.g. `OWNER_REMAINDER_ONLY`. |
| **probe** | One synthetic `{findings, seen}` input a gate declares so the enumerator can drive a branch. A gate declares its probes and never its outcomes. |
| **locus** | Where the repair for a finding lives, and therefore who performs it: `reader`, `committed`, `clone`, `seat` or `owner`. |
| **findings-derived** | A verdict whose exit code and numbers are a function of the findings array alone. |
| **ground verdict** | A verdict meaning "I could not establish the facts", which has no findings — a shallow clone for `--history`, an unregistered driver for `--clone`. Exempt from the findings checks, and never reported as clean. |
| **census** | The approximate list of files under `tools/` and `scripts/` that look like gates, and which of them are extracted. Approximate by design; §2 and the enumerator's header say why that asymmetry is sound. |
| **latent defect** | A defect no committed input can currently reach, so it changes no output today and will change output the first time an input shape changes. |
| **differential check** | Running the same command at two commits and diffing stdout, stderr and exit status, to prove a refactor changed no observable behaviour. |
| **declared quotation** | A substring of a verdict line the gate lists in `Verdict.quoted` because it was observed rather than computed: an HTTP status the board answered with, a response body, a record id. Integers inside one are exempt from `COUNTS_DERIVED`; a declared quotation absent from the line is itself a finding. |
| **exit 3** | This repository's code for "the downstream store refused what this checker passed", which is a defect in the checker rather than in the thing checked. Emitted by `tools/board/post.mjs` alone, and the reason `Verdict.exitCode` is no longer `0 | 1 | 2`. |
| **stub board** | The `node:http` server in §8 that answers one fixed status and body on 127.0.0.1, standing in for the company board so the live branches can be driven without writing rows to a bus other seats read. |
| **ground probe** | A `GateSpec.groundProbes` entry: a named call producing a ground verdict, declared separately from the findings probes so the exemption from the findings checks is visible in the spec rather than inferred from an empty array. |
| **L-A33** | A lesson in `docs/standards/lessons.md`: a point-in-time inventory written into a document goes stale without announcing it. |

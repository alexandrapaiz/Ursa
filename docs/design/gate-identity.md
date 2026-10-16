# The bound set in the record: `task.gatedBy` and the eighteenth bound

Status: shipped 2026-10-16. Engineer seat, one OODA cycle.
Ledger entry this closes: "The gate's seventeen bounds are the
auditability story and a buyer gets the verdict without them"
(`docs/ideas.md`, 2026-10-15, second run, status `proposed`).
Written to the engineering-artifact standard in
`prompts/engineer-agent.md`: a node-by-node system diagram, real
TypeScript signatures at every boundary, on-disk layouts with a real
payload, the exact commands, a versioned tooling list, and no bare
terms.

---

## 1. The defect, stated as a thing a buyer could not do

An outcome record (`OutcomeRecord` in `ursa-major/src/types.ts`) is the
commercial object described in `CLAUDE.md` §1. Since 2026-10-12 it names
the code that produced its classifications, in `task.resolvedBy`
(`docs/design/resolver-identity.md`). What it did not name is the set of
rules those classifications were checked against.

That set is not stable. Counted from the `BOUNDS` object literal in
`ursa-major/src/invariants.ts`:

| Date | Bounds in `BOUNDS` | What arrived |
|---|---|---|
| 2026-10-05 | 10 | the original ten, after a record printed "239,976 chars survived verbatim" above "239,841 chars were generated to get there" |
| 2026-10-06 | 15 | `EXCLUSION_NOT_CLASSIFIED` among them |
| 2026-10-13 | 16 | `RESOLVER_IDENTIFIED`, and `CLAIM_NOT_WIDER` rewritten from a comparison of two extents' lengths to a comparison of their bytes |
| 2026-10-15 | 17 | `RIVAL_NOT_AFTER_FINAL` |
| 2026-10-16 | 18 | `GATE_IDENTIFIED`, this document |

Eight bounds in eleven days, and one of those changes moved what a bound
checked without changing its name. So two records a lab bought two months
apart were checked under different rules. Before this change, the only
procedure that told the lab which rules was:

1. read `task.resolvedBy.commit` out of the record,
2. clone `github.com/alexandrapaiz/Ursa`,
3. `git show <commit>:ursa-major/src/invariants.ts`,
4. read a TypeScript module and count an object literal's keys.

Step 2 is impossible for the `bundle_digest` basis, which names a
SHA-256 prefix of `ursa-major/dist/ursa.cjs` and no commit at all. And
`CLAUDE.md` §4 sells auditability to labs as a value proposition, while
the §2 user surface rests on the same property. A record whose own
checking procedure requires cloning the vendor is a materially weaker
claim than it needs to be, and it is weak in the specific way this seat's
2026-10-15 craft scan found the evaluation vendor Vals AI to be weak: a
published score whose checking procedure does not ship with it.

**What this change does not fix.** The bound statements themselves still
do not ship inside the record. They are prose, roughly 14 KB of it, and a
record is tens of kilobytes. What ships is an identifier for the set,
which supports exactly one operation: deciding whether two records were
checked under the same rules, and if not, which rule names differ. That
operation is the one a buyer comparing a data feed across two deliveries
actually performs. Shipping the statements is the expensive version and
is not this change; it is recorded as the open question in §9.

---

## 2. The system diagram, node by node and edge by edge

Every node below is a file that exists in this repository today. Every
edge is labelled with the actual value that crosses it, named by its
TypeScript type or its on-disk format.

```
                    ursa-major/src/invariants.ts
                    ┌───────────────────────────────────────────┐
                    │ BOUNDS: Record<InvariantCode, string>     │
                    │   module-private object literal,          │
                    │   18 entries, code -> bound statement     │
                    └───┬───────────────┬───────────────┬───────┘
                        │               │               │
       InvariantCode[]  │  number       │   GateIdentity│
       (BOUND_CODES)    │ (BOUND_COUNT) │  (currentGateIdentity())
                        │               │               │
         ┌──────────────┘               │               └──────────────┐
         │                              │                              │
         v                              v                              v
  ursa-major/src/             ursa-major/src/ci/          ursa-major/src/store.ts
  invariants.violations       comment.ts                  ┌──────────────────────┐
  .test.ts                    ┌──────────────────┐        │ saveRecord(root,     │
  ┌──────────────────┐         │ renderRunComment │        │   record, identity,  │
  │ asserts the set  │         │ prints the       │        │   gate)              │
  │ of codes the 23  │         │ digest and the   │        │ writes gate into     │
  │ fixtures fire    │         │ count in the     │        │ record.task.gatedBy  │
  │ equals this list │         │ details block    │        │ when absent          │
  └──────────────────┘         └──────────────────┘        └──────┬───────────────┘
                                                                  │
                                                     OutcomeRecord │ (mutated in place)
                                                                  │
                                                                  v
                                            <project>/.ursa/records/<task.id>.json
                                            ┌─────────────────────────────────────┐
                                            │ JSON, 2-space indent, trailing \n   │
                                            │ task.gatedBy: GateIdentity          │
                                            └──────┬──────────────────────────────┘
                                                   │
                                     OutcomeRecord │ (JSON.parse, off disk)
                                                   │
                                                   v
                                    ursa-major/src/invariants.ts
                                    ┌─────────────────────────────────────┐
                                    │ checkRecord(record): Violation[]    │
                                    │ GATE_IDENTIFIED clause reads        │
                                    │ record.task.gatedBy as unknown and  │
                                    │ compares it to                      │
                                    │ currentGateIdentity()               │
                                    └──────┬──────────────────────────────┘
                                           │
                               Violation[] │ { code, invariant, where, observed }
                                           │
                        ┌──────────────────┴──────────────────┐
                        v                                     v
          ursa-major/src/launch.ts              ursa-major/src/invariants.cli.ts
          ┌────────────────────────┐            ┌────────────────────────────┐
          │ gateRecords(records):  │            │ runGate(dir): {violations, │
          │   GateResult           │            │   lines}                   │
          │ shared by both         │            │ what a BUYER runs over a   │
          │ launches               │            │ directory of records       │
          └────────┬───────────────┘            └────────────────────────────┘
                   │
      process exit │ 0 or 1
                   v
   ursa-major/src/bin/ursa.ts      (the `ursa run` launch)
   ursa-major/src/ci/run.ts        (the `ursa ci` launch, via dist/ursa.cjs)
```

**Edges, named individually, because a diagram whose edges say "data" is
the thing the standard forbids.**

| From | To | What crosses it |
|---|---|---|
| `BOUNDS` literal | `currentGateIdentity()` | the 18 `(code, statement)` pairs, concatenated in code-alphabetical order into one UTF-8 string |
| `currentGateIdentity()` | `saveRecord` | one `GateIdentity` value: `{ codes: string[], boundsDigest: string }` |
| `saveRecord` | `<project>/.ursa/records/<id>.json` | the whole `OutcomeRecord` as `JSON.stringify(record, null, 2) + '\n'` |
| record file | `checkRecord` | the parsed `OutcomeRecord`, whose `task.gatedBy` is read at type `unknown` |
| `checkRecord` | `gateRecords` / `runGate` | `Violation[]`, one entry per failed bound |
| `BOUNDS` literal | `renderRunComment` | `BOUND_COUNT` (the number 18) and `currentGateIdentity().boundsDigest` (the string `10a82f2bc5f1ae6f`) |

**Why `currentGateIdentity()` lives in `invariants.ts` and not in a
module of its own**, which is where `resolverIdentity()` lives. A digest
computed elsewhere needs `BOUNDS` exported, and an exported `BOUNDS` is a
second place that can disagree with the first about what the bound set
is. That is the exact class of defect `BOUND_COUNT` exists to close:
`README.md` and three design documents carried the word "thirteen" for
four days after the fifteenth bound was added. The hash and the thing
hashed stay in one lexical scope.

---

## 3. Interfaces at every component boundary

Real signatures, as a caller would write them.

### 3.1 The record field (`ursa-major/src/types.ts`)

```ts
export interface GateIdentity {
  /** `InvariantCode` for every bound the writing resolver carried, in its declaration order */
  codes: string[]
  /** first 16 hex characters of the SHA-256 over every bound's code and statement */
  boundsDigest: string
}

export interface OutcomeRecord {
  schemaVersion: '0.1.0'
  task: {
    id: string
    finished: boolean
    generatedAt: string
    resolvedBy?: ResolverIdentity
    gatedBy?: GateIdentity
  }
  // ... artifact, files, conversations, generations, stats, signals, durability, exclusions
}
```

`codes` is `string[]` and not `InvariantCode[]`. This is the one place in
`types.ts` that deliberately widens a type, and the reason is §6.3: a
record written by a later resolver names bounds this build has never
heard of, and that record is newer rather than malformed.

### 3.2 Computing the identity (`ursa-major/src/invariants.ts`)

```ts
export type InvariantCode =
  | 'CLAIM_NOT_WIDER' | 'CLAIM_IN_GENERATION' | 'GEN_SPANS_PARTITION_ORDER'
  | 'GEN_CHARS_CONSISTENT' | 'GEN_SURVIVED_BOUNDED' | 'GEN_CLAIM_BOUNDED'
  | 'DELETION_SPLIT_EXACT' | 'FINAL_SPANS_IN_FILE' | 'COVERED_BOUNDED'
  | 'RATES_MATCH_FIELDS' | 'PCT_DENOMINATORS_ORDERED' | 'PERFILE_ENUMERATES_PATHS'
  | 'SIGNAL_QUOTE_GROUNDED' | 'DESCENT_CHECKED_UNIFORMLY' | 'EXCLUSION_NOT_CLASSIFIED'
  | 'RESOLVER_IDENTIFIED' | 'RIVAL_NOT_AFTER_FINAL' | 'GATE_IDENTIFIED'

export const BOUND_COUNT: number            // 18 as of 2026-10-16
export const BOUND_CODES: InvariantCode[]   // the codes in declaration order

/** The bound set this build carries, as `saveRecord` stamps it. Cannot fail. */
export function currentGateIdentity(): GateIdentity

export function checkRecord(record: OutcomeRecord): Violation[]

export interface Violation {
  code: InvariantCode
  invariant: string   // the bound's own statement, so a message reads without this file open
  where: string       // `${task.id} task.gatedBy` for this bound
  observed: string    // both sides of the comparison that failed
}
```

### 3.3 Stamping it (`ursa-major/src/store.ts`)

```ts
export function saveRecord(
  projectRoot: string,
  record: OutcomeRecord,
  identity: ResolverIdentity | null = currentResolverIdentity(),
  gate: GateIdentity | null = currentGateIdentity(),
): string   // the path written
```

The fourth parameter is separate from the third rather than folded into
it, and the reason is that the two facts fail independently.
`resolverIdentity()` returns `null` when there is no git work tree under
the running script and no readable artifact to hash. The bound set is in
the process either way, because `currentGateIdentity()` reads an object
literal in the same module and has no failure mode. Suppressing a
knowable fact because an unrelated one is unknowable would leave
`task.gatedBy` absent on records whose rules were never in doubt.

Both stamps preserve and never overwrite. `applyVerdict` in
`ursa-major/src/bridge/declare.ts` loads a record months later to write a
user's acceptance verdict into `signals` and saves it again; the span
classifications in it were checked under the rules of the build that made
them, so re-stamping would credit today's eighteen bounds to work checked
under ten.

### 3.4 Reading it on the two surfaces

```ts
// ursa-major/src/ci/comment.ts — the pull request comment the CI launch posts
export function renderRunComment(fields: RunCommentFields, ctx: RunCommentContext): string

// ursa-major/src/bin/ursa.ts — the local launch's terminal summary
export function renderRunSummary(
  records: OutcomeRecord[], episodes: Episode[], diagnostics: PairDiagnostics,
): string
```

The local launch reads the digest **off the record** (`records[0].task.gatedBy`)
rather than calling `currentGateIdentity()`. That difference is
load-bearing on exactly one path: a re-saved record carries the bound set
its classifications were made under, and the line has to say that one
rather than today's.

---

## 4. On-disk layouts, with a real payload

### 4.1 Where records live

```
<project>/.ursa/
├── records/
│   └── <task.id>.json          OutcomeRecord, JSON, 2-space indent, trailing newline
├── episodes.json
└── consent.json
```

`<project>` is the repository the user pointed `ursa run` at. Written as
`~/Desktop/ursa-minor-site` or `/Users/<you>/Desktop/<project>` in every
example here, per the redaction rider in `prompts/engineer-agent.md`:
real paths stay mandatory, the owner's filesystem does not ship.

### 4.2 A real payload

Actual file contents, read back from
`ursa-major/fixtures/violations/base.json` at the commit this document
lands in. The record is 8 KB; this is its `task` object entire, with
nothing elided and nothing invented.

```json
{
  "schemaVersion": "0.1.0",
  "task": {
    "id": "violation-fixture-base",
    "finished": true,
    "generatedAt": "2026-10-10T00:00:00.000Z",
    "resolvedBy": {
      "basis": "git_commit",
      "commit": "19455a3",
      "dirty": false
    },
    "gatedBy": {
      "codes": [
        "CLAIM_NOT_WIDER",
        "CLAIM_IN_GENERATION",
        "GEN_SPANS_PARTITION_ORDER",
        "GEN_CHARS_CONSISTENT",
        "GEN_SURVIVED_BOUNDED",
        "GEN_CLAIM_BOUNDED",
        "DELETION_SPLIT_EXACT",
        "FINAL_SPANS_IN_FILE",
        "COVERED_BOUNDED",
        "RATES_MATCH_FIELDS",
        "PCT_DENOMINATORS_ORDERED",
        "PERFILE_ENUMERATES_PATHS",
        "SIGNAL_QUOTE_GROUNDED",
        "EXCLUSION_NOT_CLASSIFIED",
        "DESCENT_CHECKED_UNIFORMLY",
        "RESOLVER_IDENTIFIED",
        "RIVAL_NOT_AFTER_FINAL",
        "GATE_IDENTIFIED"
      ],
      "boundsDigest": "10a82f2bc5f1ae6f"
    }
  }
}
```

The `codes` array is in **declaration** order, which is why
`EXCLUSION_NOT_CLASSIFIED` precedes `DESCENT_CHECKED_UNIFORMLY` here
while the digest is computed over the **alphabetical** order. §5.2 says
why the two differ.

### 4.3 The counterexample directory

```
ursa-major/fixtures/violations/
├── base.json                   the clean record; passes all 18 bounds
├── README.md
├── gate-identified.json        base.json with one code spliced out of task.gatedBy
├── gate-identified.md          the note, quoting what the gate observed
└── ... 22 other <slug>.json + <slug>.md pairs
```

`gate-identified.md`, generated, quoting the gate itself:

```
- Observed: boundsDigest 10a82f2bc5f1ae6f is this resolver's own, so the
  record claims this resolver's 18 bounds, and it lists 17, missing
  RIVAL_NOT_AFTER_FINAL
```

---

## 5. The bound, precisely

### 5.1 The statement, as `BOUNDS.GATE_IDENTIFIED` carries it

> If a record names the bound set its claims were checked against, the
> name is one that can be compared. `task.gatedBy.codes` is a non-empty
> array of distinct bound codes in the shape this module declares them
> (uppercase letters, digits and underscores, starting with a letter),
> `task.gatedBy.boundsDigest` is exactly 16 lowercase hexadecimal
> characters, and a record whose digest equals the **checking**
> resolver's own digest carries exactly the checking resolver's codes.

Four clauses, and only the fourth has teeth beyond shape.

| Clause | Fails on | Why it is a defect and not a style preference |
|---|---|---|
| `codes` is a non-empty array | `codes: []`, `codes: "A,B"`, `codes: 17` | An **empty** array is not the same claim as an **absent** field. Absent says nothing stamped this record. Empty says a resolver stamped it and checked it against no bounds, which no build of this module can be: `BOUNDS` has never held fewer than ten entries. |
| every entry matches `/^[A-Z][A-Z0-9_]*$/` | `codes: ["claim_not_wider"]` | A code is an identifier a reader greps for in `ursa-major/src/invariants.ts`. A lowercase or spaced entry is not one, and it would silently fail every set comparison a buyer makes. |
| entries are distinct | `codes` naming `CLAIM_NOT_WIDER` twice | `codes` is read as a **set** by every comparison the field exists for, and a list with one code twice has the same **length** as the honest list with one code missing. A length-only check cannot tell those apart. |
| digest is exactly 16 lowercase hex | `"HEAD"`, a full 64-character SHA-256, `"ABCDEF0123456789"` | 16 is what `currentGateIdentity()` writes and what `ResolverIdentity`'s `bundle_digest` basis uses. A digest of any other length is from somewhere else, and the one comparison this field supports would silently never match. |
| same digest implies the same codes | this build's digest over 17 codes | **The clause the field was added for.** See §5.3. |

### 5.2 What exactly is hashed

Each bound contributes its code, a newline, its statement text, and a
newline. The bounds are concatenated in **code-alphabetical** order. The
result is UTF-8; its SHA-256 is truncated to 16 hexadecimal characters.

```ts
const canonical = [...BOUND_CODES]
  .sort()
  .map((code) => `${code}\n${BOUNDS[code]}\n`)
  .join('')
createHash('sha256').update(canonical, 'utf8').digest('hex').slice(0, 16)
```

**Alphabetical, not declaration order**, for one reason: declaration
order is an editorial choice in `invariants.ts`, and moving a bound up
the list changes nothing about what a record was checked for. A digest
that moved on a reorder would report a rule change where there was none,
and the only reading a consumer can make of the digest is "same rules or
not". Declaration order still matters and is still shipped, in `codes`,
and `checkRecord` still reports violations in it.

**The statement text is inside the hash, not just the code.** A bound
whose name stays while its sentence is rewritten is the change this field
can least afford to miss, because it is invisible in `codes`. It is also
not hypothetical: on 2026-10-13 `CLAIM_NOT_WIDER` went from comparing two
extents' lengths to comparing their bytes, and the code did not move.

**16 hex characters, not 64**, matching the `bundle_digest` basis of
`ResolverIdentity` and the prefix `npm run bundle:check` compares. The
collision risk at 64 bits is irrelevant against the population this
field is compared within, which is the handful of bound sets this project
has ever shipped, and the shared convention is worth more than the
margin.

### 5.3 The clause with teeth, and the one lie it catches

The fourth clause fires only when the record's digest **equals the
checking resolver's own**. Within that condition, the record is asserting
"I was checked against exactly your rules", so its code list must be
exactly the checking resolver's code list. A short list means a bound was
dropped from it. A long list means the digest was copied onto a record
checked by something else. Both make every same-digest comparison a buyer
runs against that record wrong.

That is the detection the ledger entry asked for: *a buyer can detect a
bound being quietly dropped.* What it does not detect is a record whose
digest and code list were **both** rewritten consistently. Nothing in a
self-describing artifact can; detecting that needs a signature over the
record, which is §9's open question.

### 5.4 Membership is deliberately not checked in the other direction

A record whose digest **differs** from the checking resolver's is not
checked for membership at all. Its codes name the bounds of the resolver
that wrote it, which on a record from a later build includes codes this
build has never heard of. Refusing that record would make every bound
added after it a gate against its own future, and would make correct
handling of a nineteenth bound a type error at the only place that reads
a record off disk.

This is the same forward-compatibility rule the rest of the module
follows for absence: an absent `task.gatedBy` is legal and unchecked,
because every record this project wrote before 2026-10-16 is truthfully
saying that nothing stamped it.

### 5.5 Present is not a verdict

The name invites the wrong reading, so the record is explicit about it in
three places: the `GateIdentity` doc comment, the bound's own statement,
and this section.

Both launches write every record **before** running the gate over it.
`gateRecords` in `ursa-major/src/launch.ts` says why: a record whose
arithmetic is impossible is still the evidence of the defect, so nothing
is withheld from the user; what changes is that the run stops reporting
success. A record therefore carries `task.gatedBy` whether it passed or
failed.

The demonstration is committed. All twenty-three records in
`ursa-major/fixtures/violations/` carry `task.gatedBy` naming the
eighteen bounds, and every one of them is refused by those bounds. No
other evaluation product in `docs/market/landscape.md` category 2 ships a
set of results its own checker must reject.

---

## 6. Exact commands

Every invocation below was run on 2026-10-16 in the branch
`engineer/2026-10-16-gated-by`, from `ursa-major/` unless stated. The
output quoted is what the command printed.

### 6.1 Reproduce the digest

```bash
cd ursa-major
npx tsx -e "import('./src/invariants').then(m => console.log(m.currentGateIdentity().boundsDigest, m.currentGateIdentity().codes.length))"
# 10a82f2bc5f1ae6f 18
```

### 6.2 Regenerate and verify the counterexample directory

```bash
cd ursa-major
npm run fixtures:violations          # tsx tools/make-violation-fixtures.ts
# ... gate-identified: GATE_IDENTIFIED
# Wrote 47 files under fixtures/violations, covering 18 invariant codes.

npm run fixtures:violations:check    # tsx tools/make-violation-fixtures.ts --check
# 47 files match what this script would write.
```

`npm run fixtures:violations` is now required after any edit to a bound's
**statement text**, not only after adding a bound, because the digest
covers the text. That drift is loud rather than silent:
`ursa-major/src/invariants.violations.test.ts` asserts `base.json`'s
`gatedBy` equals `currentGateIdentity()` and fails `npm test` with the
command to run in the assertion message.

### 6.3 Type check, test, rebuild the bundle

```bash
cd ursa-major
npx tsc --noEmit
npx vitest run
# Test Files  32 passed | 1 skipped (33)
#      Tests  649 passed | 4 skipped (653)

npm run bundle                       # node build/bundle.mjs
# wrote dist/ursa.cjs (sha256 d32543070474cc28bdb8300c63791d28fda0b2d14dc5b588ab99cf363de6814d, 201,773 bytes)
npm run bundle:check                 # node build/bundle.mjs --check
```

The bundle rebuild is mandatory, not optional housekeeping.
`ursa-major/dist/ursa.cjs` is a committed single-file build that the
`ursa ci` launch executes, so a stale bundle is a CI launch computing a
record's `gatedBy` from a different `BOUNDS` than the local launch.

**And `npm run bundle:check` is the only thing that would notice.**
`comparable()` in `ursa-major/src/launch-parity.test.ts` now includes
`task.gatedBy`, which catches one launch stamping a field the other does
not, and it cannot catch a stale bundle: both launches in that test run
in-process from `src/`, and no test in this repository executes
`dist/ursa.cjs` as a program at all. The bundle is only ever checked by
comparing its committed bytes against a rebuild, and that check is a
separate script rather than part of `npm test`. Recorded as a ledger
entry on 2026-10-16 rather than fixed here.

### 6.4 Prove it end to end on real history

```bash
D=$(mktemp -d /tmp/ursa-probe-XXXX)
git clone -q /path/to/Ursa "$D/repo"
cd ursa-major
npx tsx src/bin/ursa.ts run "$D/repo" --limit 10 --agent-identity 'claude'
# 7 work units found, 7 resolved into records.
# ...
# Records: /tmp/ursa-probe-XXXX/repo/.ursa/records/
# Resolved by: resolver f295522 (working tree had uncommitted changes)
# Checked against: 18 bounds, set `10a82f2bc5f1ae6f`

npx tsx src/invariants.cli.ts "$D/repo/.ursa/records"
#   OK — every stated bound holds
# 7 records checked, 0 violations.
```

All seven records written from this repository's own git history carry
`task.gatedBy` with eighteen codes and the digest `10a82f2bc5f1ae6f`, and
each names `task.resolvedBy.commit` `f295522`.

### 6.5 Prove the detection, on a real record rather than a fixture

```bash
T=$(mktemp -d /tmp/ursa-tamper-XXXX)
cp "$D/repo/.ursa/records/repo-2026-10-13-c4a827c.json" "$T/"
python3 -I -c "
import json, io, os
f = os.environ['T'] + '/repo-2026-10-13-c4a827c.json'
r = json.load(io.open(f))
r['task']['gatedBy']['codes'] = [c for c in r['task']['gatedBy']['codes']
                                 if c != 'DESCENT_CHECKED_UNIFORMLY']
io.open(f, 'w').write(json.dumps(r, indent=2) + '\n')
"
cd ursa-major && npx tsx src/invariants.cli.ts "$T"
#   1 violation
#   GATE_IDENTIFIED  repo-2026-10-13-c4a827c task.gatedBy
#       observed: boundsDigest 10a82f2bc5f1ae6f is this resolver's own, so the
#                 record claims this resolver's 18 bounds, and it lists 17,
#                 missing DESCENT_CHECKED_UNIFORMLY
# 1 record checked, 1 violation.
```

The digest was not touched. One bound was removed from the list, and the
gate named which one, on a record produced by a real resolve of real
history rather than on a synthetic fixture.

---

## 7. Tooling

Every tool named, with its version, its job in this change, and why it
was chosen over what else was considered.

| Tool | Version | Its job here | Why it rather than the alternative |
|---|---|---|---|
| `node` | 22.23.3 | the runtime for every command in §6, and the host for the `node:crypto` SHA-256 | `node:crypto` is in the standard library, so the digest needs no dependency; the alternative, a userland hash package, would put the definition of a provenance field behind a version range |
| `typescript` | 5.9.3 (`^5.7.2`) | `npx tsc --noEmit` type checks the widened `codes: string[]` against every reader of a record | the discriminated-union discipline `ResolverIdentity` and `ExclusionReason` already use is a compile-time property; without it the forward-compatibility decision in §5.4 would be a comment rather than a check |
| `vitest` | 5.0.2 (`^5.0.2`) | runs the 653-test suite, including the 12 new `GATE_IDENTIFIED` unit cases in `src/invariants.test.ts`, the one case the new fixture adds, and the 23-fixture directory assertions | already this project's only test runner; introducing a second would split which suite a bound's counterexample belongs to |
| `tsx` | 4.23.15 (`^4.19.2`) | executes TypeScript directly for `npm run fixtures:violations`, `src/invariants.cli.ts` and the `ursa run` launch, with no build step | the local launch is defined as "tsx over `src/`" in `action.yml`'s sibling path, so generating fixtures through the same runtime removes a build from the loop that produces them |
| `esbuild` | 0.28.0 (`^0.28.0`) | rebuilds `dist/ursa.cjs` (§6.3) so the committed bundle's `BOUNDS` matches `src/` | the bundle digest is itself a provenance field (`ResolverIdentity.bundle_digest`), so the bundler has to be deterministic and pinned; `tsc` emit plus a bundler is two steps where one suffices |
| `git` | 2.55.0 | the clone in §6.4 that supplies real history, and `git status --porcelain` behind the `dirty` flag the companion field carries | the record's episodes are commit pairs; nothing else supplies the input |
| `python3` | 3.x, invoked `-I` | reads a record's `task.gatedBy` back out of JSON in §6.4, and performs the single-field tamper in §6.5 | `-I` (isolated mode) is the environment's rule for any interpreter run against files in a scratch directory: it drops the script's directory and the current directory from the import path, so a file named `json.py` beside the data cannot be imported by `import json` |

---

## 8. What this cost, measured

| Quantity | Before | After |
|---|---|---|
| Bounds in `BOUNDS` | 17 | 18 |
| Counterexample records in `fixtures/violations/` | 22 | 23 |
| Violations the directory produces through `runGate` | 27 | 28 |
| Fixtures firing exactly one bound | 18 | 19 |
| Tests in `ursa-major` | 636 passing, 4 skipped (measured on `b144ad5`) | 649 passing, 4 skipped |
| `dist/ursa.cjs` | 201,273 bytes | 201,773 bytes |
| Bytes added per record | — | 379 on the payload in §4.2 (18 codes plus a 16-character digest, pretty-printed) |

379 bytes against a record that is tens of kilobytes, which is the
objection the 2026-10-15 ledger entry "The record grew 2,141 date fields
today" raises about fields nothing reads. The difference from that case
is that this is one field per **record** rather than one per **span**,
and unlike a per-span date it is read by a comparison a buyer actually
performs.

---

## 9. Open questions, stated rather than resolved

1. **The bound statements still do not ship.** A buyer can compare two
   digests and cannot recompute one. Shipping the ~14 KB of statements
   beside a delivery, once per bound set rather than once per record, is
   the expensive version and is not built. The ledger entry that proposed
   this field named the stronger artifact as publishing
   `ursa-major/fixtures/violations/` as part of the deliverable, which is
   also not built.
2. **A consistently rewritten pair is undetectable.** §5.3. Detecting it
   requires a signature over the record by a key the buyer can check, and
   there is no key management anywhere in this project.
3. **Nothing re-derives the digests of records already delivered.** Every
   record written before 2026-10-16 has no `gatedBy` and legitimately
   cannot acquire one, since the bound set it was checked under is only
   recoverable by cloning the resolver at `task.resolvedBy`. The field
   improves the feed going forward and does not repair its past.

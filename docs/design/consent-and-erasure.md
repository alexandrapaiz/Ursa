# The consent gate — what may leave the device, and how a user erases what already left their hands

Written to the engineering-artifact standard in `prompts/engineer-agent.md`
(six elements: a diagram whose nodes are real, interfaces as TypeScript
signatures, on-disk layouts with a real payload, exact commands, a tooling
list with versions and rationale, no bare terms). Terms are defined in §9.

## 1. The defect this closes

`CLAUDE.md` states two constraints as load-bearing and tells any reader not
to design around them:

> 2. The user can always see, edit, revoke, and delete what's been inferred
>    about them. No dark patterns.
> 3. Raw processing happens on-device. Raw data never touches the
>    aggregation layer.

Before this change, neither had code behind it. The evidence, taken on
`main` at `8c453f0` and across all thirty open pull requests:

| Claim | State before this change |
|---|---|
| A user can see what was inferred | Only by opening `.ursa/tuning.json` in a text editor. No command printed it. |
| A user can revoke an inference | Only by hand-editing `status` to `"revoked"` in that file. `docs/design/product-plan.md` §2 row 9 names `revokeAxiom(tuningPath, unitId): TuningRecord` as component 9 of the system, and it did not exist. |
| A user can delete a record | No. No code deleted a record, and `ursa run` rebuilds every record from git history on each invocation, so deleting the file by hand was undone by the next run. |
| Raw data cannot reach the aggregation layer | Nothing enforced it. `types.ts` carries the comment "Raw data; stays local" on `ConversationMeta.prompts`, and a comment is not a boundary. No function anywhere derived a smaller object from an `OutcomeRecord`, so the only transmittable thing was the whole record. |

That last row is the sharp one. An `OutcomeRecord` is raw text in four
separate places: `files[].text` (the user's finished work, verbatim),
`files[].spans[].text`, `generations[].text` (every model generation), and
`conversations[].prompts[].text` (the user's own messages). A pipeline whose
only serializable unit is that object has no boundary to enforce, whatever
its comments say.

`docs/design/product-plan.md` §12 had already specified the boundary down to
the SQL. It names exactly three edges that may cross, one of which is
"aggregate scalar batch (Minor-consented only)", landing in a
`survival_stats` table, and it states the negative directly: "Raw prompts,
diffs, quotes, discovered specs — never leaves, even encrypted." This change
implements that paragraph. It invents no policy.

## 2. System diagram, node by node

Two zones separated by one wall, which is the device boundary. Every node
below is a file or a process that exists in the tree at this commit; every
edge is labelled with the type or file format that crosses it.

**Zone A — the user's machine (everything in `ursa-major/src/`).**

| Node | Kind | What it is |
|---|---|---|
| `src/bin/ursa.ts` | process entry | the `ursa` binary: `run`, `bridge`, `consent`, `forget` |
| `src/pairfinder.ts` | module | walks git history for generated-then-edited commit pairs |
| `src/resolve.ts` | module | builds an `OutcomeRecord` from a commit pair |
| `.ursa/records/<recordId>.json` | file, JSON | one `OutcomeRecord`. **Raw.** Holds the user's finished text, every generation, and every prompt. |
| `.ursa/episodes.json` | file, JSON | the `Episode[]` index, rebuilt on every `run` |
| `.ursa/tuning.json` | file, JSON | the `TuningRecord`: the axioms distilled about the user |
| `.ursa/consent.json` | file, JSON | **new.** the `ConsentRecord`: scope state, transition history, erasure tombstones |
| `src/consent.ts` | module | **new.** loads and writes `.ursa/consent.json`; owns `forget()` |
| `src/tuning/revoke.ts` | module | **new.** `revokeAxiom` and the pure erasure pass over a `TuningRecord` |
| `src/disclosure.ts` | module | **new.** the only code that derives a transmittable object from an `OutcomeRecord`, plus `auditBatch` |
| `src/consent.cli.ts` | module | **new.** `ursa consent …` and `ursa forget …` |
| `batch.json` | file, JSON | **new.** the `DisclosureBatch` the user may hand over. The only artifact in this table permitted to cross the wall. |

**Zone B — Ursa-operated (plan §12; not built in this change).**

| Node | Kind | What it is |
|---|---|---|
| `POST /api/minor/ingest` | Vercel route | receives one `DisclosureBatch` per contributor |
| `survival_stats` | Neon Postgres table | the price book; `aggregate()` in `src/disclosure.ts` is the reference implementation of what this route owes |

**Edges inside zone A.**

1. `src/pairfinder.ts` → `src/bin/ursa.ts`, carrying `CommitPair[]`.
2. `src/bin/ursa.ts` → `src/resolve.ts`, carrying `ResolveInput`.
3. `src/resolve.ts` → `.ursa/records/<recordId>.json`, carrying `OutcomeRecord` as JSON.
4. `.ursa/consent.json` → `src/bin/ursa.ts`, carrying `ConsentRecord`, consumed as `isForgotten(consent, episode.id)`. **This edge is why erasure survives re-derivation:** without it, edge 3 recreates a record the user deleted.
5. `.ursa/records/*.json` → `src/disclosure.ts`, carrying `OutcomeRecord[]`.
6. `.ursa/consent.json` → `src/disclosure.ts`, carrying `ConsentRecord`.
7. `src/disclosure.ts` → `batch.json`, carrying `DisclosureBatch`. **Gated:** edge 7 does not exist unless `isGranted(consent, 'minor-aggregate')` is true and `auditBatch` returned an empty array.
8. `src/consent.ts` → `.ursa/tuning.json`, carrying `TuningRecord` with the forgotten record's evidence removed.

**The one edge that crosses the wall.**

9. `batch.json` → `POST /api/minor/ingest`, carrying `DisclosureBatch`, which is a `schemaVersion` string, a `scope` string, and an array of six-field rows whose every string field is a member of a closed vocabulary. No other edge crosses. `.ursa/records/*.json`, `.ursa/tuning.json` and `.ursa/consent.json` have no outbound edge at all.

## 3. Interfaces at every boundary, as real signatures

From `ursa-major/src/consent.ts`:

```ts
export type DisclosureScope = 'minor-aggregate'
export type ConsentState = 'withheld' | 'granted'

export interface ConsentChange { at: string; from: ConsentState; to: ConsentState; by: string }
export interface ScopeConsent { state: ConsentState; changedAt: string | null; history: ConsentChange[] }

export interface Tombstone {
  recordId: string
  forgottenAt: string
  removed: {
    recordFile: boolean
    axiomsDeleted: string[]
    evidenceStripped: number
    sourcesRemoved: number
  }
}

export interface ConsentRecord {
  schemaVersion: '0.1.0'
  updatedAt: string
  scopes: Record<DisclosureScope, ScopeConsent>
  forgotten: Tombstone[]
}

export function loadConsent(projectRoot: string): ConsentRecord
export function saveConsent(projectRoot: string, consent: ConsentRecord): string
export function withheldByDefault(now?: string): ConsentRecord
export function isGranted(consent: ConsentRecord, scope: DisclosureScope): boolean
export function isForgotten(consent: ConsentRecord, recordId: string): boolean
export function grantScope(projectRoot: string, scope: DisclosureScope, by: string, now?: string): ConsentRecord
export function revokeScope(projectRoot: string, scope: DisclosureScope, by: string, now?: string): ConsentRecord
export function forget(projectRoot: string, recordId: string, now?: string): Tombstone
```

From `ursa-major/src/tuning/revoke.ts`:

```ts
export interface ForgetResult {
  tuning: TuningRecord
  axiomsDeleted: string[]
  evidenceStripped: number
  sourcesRemoved: number
}

export function forgetRecordInTuning(tuning: TuningRecord, recordId: string, now?: string): ForgetResult

/** product-plan.md §2 component 9, at the signature the plan names. */
export function revokeAxiom(tuningPath: string, unitId: string, now?: string): TuningRecord
```

From `ursa-major/src/disclosure.ts`:

```ts
export const DOMAIN_BUCKETS: readonly [
  'code/typescript', 'code/javascript', 'code/python', 'code/web',
  'code/config', 'code/sql', 'prose/markdown', 'prose/text',
  'prose/latex', 'other',
]
export type DomainBucket = (typeof DOMAIN_BUCKETS)[number]

export const MODEL_VOCABULARY: readonly string[]
export type ModelId = (typeof MODEL_VOCABULARY)[number]

export const K_ANONYMITY_FLOOR = 5
export const SHINGLE_CHARS = 16
export const ISO_DATE: RegExp

export function domainOf(path: string | undefined): DomainBucket
export function modelIdOf(raw: string | undefined): ModelId | null
export function weekStartOf(iso: string): string

/** The plan's survival_stats row, field for field. */
export interface SurvivalStatsRow {
  domain: DomainBucket
  model: ModelId
  weekStart: string
  contributorCount: number
  survivalScalar: number
  sampleGenerations: number
}

export interface DisclosureBatch {
  schemaVersion: '0.1.0'
  scope: DisclosureScope
  rows: SurvivalStatsRow[]
}

export type WithheldReason =
  | { kind: 'scope-not-granted'; scope: DisclosureScope; detail: string }
  | { kind: 'record-forgotten'; recordId: string; detail: string }
  | { kind: 'model-id-rejected'; recordId: string; detail: string }

export interface DisclosureResult { batch: DisclosureBatch | null; withheld: WithheldReason[] }

export function projectForMinor(
  records: OutcomeRecord[],
  consent: ConsentRecord,
  scope?: DisclosureScope,
): DisclosureResult

export interface AggregateResult { rows: SurvivalStatsRow[]; withheldRows: number }
export function aggregate(batches: DisclosureBatch[], floor?: number): AggregateResult

export interface LeakFinding {
  kind: 'unpermitted-key' | 'unpermitted-string' | 'raw-text-shingle'
  path: string
  detail: string
}
export function rawStringsOf(record: OutcomeRecord): string[]
export function auditBatch(batch: DisclosureBatch, records: OutcomeRecord[], shingleChars?: number): LeakFinding[]
```

From `ursa-major/src/consent.cli.ts`:

```ts
export interface CliIo { out: (line: string) => void; err: (line: string) => void }
export function loadRecords(projectRoot: string): OutcomeRecord[]
export function runConsentCommand(argv: string[], io?: CliIo): Promise<number>
export function runForgetCommand(argv: string[], io?: CliIo): Promise<number>
```

## 4. On-disk layouts, with real payloads

Paths are relative to the project the user named on the command line. Home
paths are written `~/...` per the redaction rider in the artifact standard;
record ids below are real in shape and truncated where they carry a machine
name.

### `.ursa/consent.json`

Real file, taken from the run in §5 after one grant, one disclosure and one
erasure, with the temp-directory component of the record id shortened:

```json
{
  "schemaVersion": "0.1.0",
  "updatedAt": "2026-10-01T02:32:03.357Z",
  "scopes": {
    "minor-aggregate": {
      "state": "granted",
      "changedAt": "2026-10-01T02:31:19.203Z",
      "history": [
        {
          "at": "2026-10-01T02:31:19.203Z",
          "from": "withheld",
          "to": "granted",
          "by": "ursa consent grant --scope minor-aggregate"
        }
      ]
    }
  },
  "forgotten": [
    {
      "recordId": "ursa-demo-<slug>-2026-10-01-e0a2c66",
      "forgottenAt": "2026-10-01T02:32:03.357Z",
      "removed": {
        "recordFile": true,
        "axiomsDeleted": [],
        "evidenceStripped": 0,
        "sourcesRemoved": 0
      }
    }
  ]
}
```

A project with no such file is identical in effect to a project whose file
reads `"state": "withheld"`. That equivalence is asserted in
`src/consent.test.ts` rather than left to a reader.

### `batch.json` — the only file permitted to cross the wall

Real output of `ursa consent disclose`, unedited, over a two-commit
repository holding one Markdown file and one TypeScript file:

```json
{
  "schemaVersion": "0.1.0",
  "scope": "minor-aggregate",
  "rows": [
    {
      "domain": "code/typescript",
      "model": "claude",
      "weekStart": "2026-09-28",
      "contributorCount": 1,
      "survivalScalar": 1,
      "sampleGenerations": 1
    },
    {
      "domain": "prose/markdown",
      "model": "claude",
      "weekStart": "2026-09-28",
      "contributorCount": 1,
      "survivalScalar": 1,
      "sampleGenerations": 1
    }
  ]
}
```

The source repository's Markdown file is about an onboarding flow at a named
company. Neither the company, the file name, the path, the prose, the
user's git identity, nor the agent's email address appears above. `model`
reads `claude` rather than `Claude <noreply@anthropic.com>`, which is what
`pairfinder.ts` actually captured, because §6 classifies rather than
forwards.

## 5. Exact commands

Every line below was run against a scratch git repository created for the
purpose. Output is quoted verbatim in the pull request.

```bash
# Build a record from a real project, as before this change.
npx tsx src/bin/ursa.ts run /tmp/ursa-demo --min-chars 10

# See everything held locally, and the current consent state.
npx tsx src/bin/ursa.ts consent show /tmp/ursa-demo

# Ask for a disclosure before granting anything. Exits 0 and writes nothing.
npx tsx src/bin/ursa.ts consent disclose /tmp/ursa-demo

# Grant the one scope that crosses the boundary.
npx tsx src/bin/ursa.ts consent grant /tmp/ursa-demo --scope minor-aggregate

# Emit the aggregate. The audit runs first and there is no flag to skip it.
npx tsx src/bin/ursa.ts consent disclose /tmp/ursa-demo --out /tmp/ursa-demo/batch.json

# Withdraw one inference, keeping a tombstone so a re-distill cannot revive it.
npx tsx src/bin/ursa.ts consent revoke-axiom /tmp/ursa-demo --axiom ax-003

# Erase one record and everything derived from it.
npx tsx src/bin/ursa.ts forget /tmp/ursa-demo --record ursa-demo-2026-10-01-e0a2c66

# Prove the erasure holds against the git history that produced it.
npx tsx src/bin/ursa.ts run /tmp/ursa-demo --min-chars 10

# Stop all disclosure.
npx tsx src/bin/ursa.ts consent revoke /tmp/ursa-demo --scope minor-aggregate

# The suite.
npm test
npx tsc --noEmit
```

## 6. The two mechanisms, stated precisely

### 6a. Fail closed, and the enum that replaced a regex

`loadConsent` never throws. A missing file, an empty file, a file truncated
mid-write, a JSON array, a JSON null, and a file whose `state` reads `true`,
`1`, `"GRANTED"` or `"grant"` all return `withheld`. The reading is
deliberate: a corrupted consent file is indistinguishable from a tampered
one, and the safe interpretation of both is that the user has consented to
nothing. All eleven cases are enumerated in `src/consent.test.ts`.

The `model` column needed its own decision because it has to carry content
of a kind: a per-model survival scalar is the whole of CLAUDE.md §4's first
property, cross-model comparison. The first version of this gate constrained
it with a regex, `/^[A-Za-z0-9][A-Za-z0-9._+ -]{0,63}$/`, on the reasoning
that path and address punctuation were excluded. A test written an hour later
put this string through it:

```
The Atlanta distribution centre missed its service targets.
```

Sixty-two characters, no excluded punctuation, passes. Any regex permissive
enough to admit the name of a model nobody has heard of yet is permissive
enough to admit a sentence. So `model` is now an enum,
`MODEL_VOCABULARY`, and `modelIdOf` maps a captured agent marker onto a
member of it or onto `null`. The returned value is a reference to a listed
literal, so no character of the input survives into the output. The regression
is pinned in `src/disclosure.test.ts` as "closes the hole an earlier version
of this gate had", which asserts the sentence still satisfies the old regex
and is now caught anyway.

The cost is explicit and accepted: a model absent from the list is withheld
and reported, so the list is maintenance. That is the correct direction for
the failure to point.

### 6b. The audit, re-derived from outside the projection

Building the payload out of nothing but counters is already correct. It is
not *checkable*, and it silently stops being true the first time somebody
adds a field. So `auditBatch` takes the payload and the records it came from,
knows nothing about how it was produced, and runs two independent checks.

**Check 1, vocabulary.** Every key must be one of nine permitted names.
Every string value must be `'0.1.0'`, `'minor-aggregate'`, a member of
`DOMAIN_BUCKETS`, a member of `MODEL_VOCABULARY`, or a `YYYY-MM-DD` date.
Everything else must be a number. There is no length-bounded free-form case
left, which is what makes this strong: a string drawn from thirty-two
literals and one date pattern cannot hold a sentence, a path, or an address.

**Check 2, shingles.** Independently, every 16-character window of every raw
string in the source records is tested against the payload's leaf string
values. This covers the field nobody has thought of yet: one added next
quarter, or one whose value is assembled rather than referenced.

Two details of check 2 are load-bearing rather than tidiness.

- The corpus is leaf **values**, never key names or JSON scaffolding. Key
  names such as `contributorCount` are this module's own source text, so
  shingling the serialized JSON reports a leak the moment anyone runs
  `ursa run` over this repository and a generation's text contains
  `"contributorCount": 1`. Keys are not user data. The regression test is
  "does not false-positive when the record's own text is this module's
  source code".
- Leaves are joined by a run of NUL characters at least one shingle wide, so
  no window can span two values and manufacture a match.

A check that cannot fail proves nothing, so the suite poisons the payload
four ways and asserts each is caught: a new key carrying prose, a file path
added to a row, a sentence forced into `model`, and the whole
`OutcomeRecord` passed off as a batch, which is the failure mode that was
available before this change.

### 6c. Erasure versus revocation

These are different operations and the difference is the design.

| | Revoke an axiom | Forget a record |
|---|---|---|
| The user is saying | this inference about me is wrong, stop applying it | erase this piece of my work and what you concluded from it |
| Mechanism | `status: 'revoked'`, kept as a tombstone | the record file is deleted; evidence is stripped from every axiom |
| An axiom grounded only in this | n/a | **deleted outright**, not tombstoned |
| An axiom also grounded elsewhere | n/a | keeps its statement, loses this evidence, `evidenceCount` recounted |
| Can a later distillation revive it | No. `tuning/merge.ts` already skips a matched revoked axiom and `distill.ts` passes the tombstones to the model as "do not resurrect". | Yes, if grounded in a record the user has not erased, and that is correct. |

A tombstone is the wrong answer for erasure, because a tombstone preserves
the statement derived from the thing being erased. `tuning/types.ts` already
settles it: "An axiom without evidence is invalid by construction."

The consequence in the last row is intended. The user erased a piece of
work, not a conclusion. A conclusion that still rests on evidence she has
not erased is one she has not objected to, and revoking is how she objects
to a conclusion itself. That path does leave a tombstone.

Erasure also has to survive re-derivation, which is the subtle half. Every
record is rebuilt from git history on each `ursa run`, so deleting the file
alone is undone by the next invocation. The tombstone in
`.ursa/consent.json` is read by `main()` before the resolve loop, and the
end-to-end test asserts the record does not come back after a second run
over the same untouched history.

## 7. The k-anonymity floor, and a defect in the plan's schema

`aggregate()` is the reference implementation of what `POST
/api/minor/ingest` owes: merge one batch per contributor and withhold any
row backed by fewer than `K_ANONYMITY_FLOOR` of them. The constant is 5,
from the plan's own SQL comment. Four contributors yield zero rows and a
`withheldRows` count; five yield the row. Both are tested at the boundary
rather than near it.

Merging exposed a defect in the plan's table, reported rather than patched
around. `survival_stats` carries `survival_scalar` and
`sample_generations` and no character totals, so two contributors' scalars
can only be combined weighted by generation count, and a generation is not a
fixed number of characters. The merged scalar is therefore a
generation-weighted mean rather than the character-weighted ratio a single
device computes. For a price book read as a trend this is immaterial. For a
scalar a lab pays against a contract it is wrong, and the fix is a
`sample_chars BIGINT` column. Filed in `docs/ideas.md` on this branch.

A second one, same place. `survivedChars` in `resolve.ts` counts
`survived_verbatim` and `survived_mutated` together, so a single
`survival_scalar` collapses them. `CLAUDE.md` §1 says the mutation *is* the
correction, expressed as an edit, which makes that distinction the most
informative thing in the record. Also filed.

## 8. Tooling

Every tool carries its version, its job here, and what it was chosen over.

| Tool | Version | Job in this change | Chosen over, and why |
|---|---|---|---|
| Node.js | 22.23.2 | runtime; `node:fs`, `node:path`, `node:util.parseArgs` | Deno and Bun. Node is what the rest of `ursa-major` targets and what `npx` distribution assumes (plan §12). Changing runtime for one module is not a tradeoff worth making. |
| TypeScript | 5.9.3 (`typescript` dependency `^5.7.2`) | the enums are the enforcement. `SurvivalStatsRow.model: ModelId` made three test lines fail to compile the moment `model` stopped being `string`, which is the gate acting at compile time rather than at runtime. | JSDoc plus a runtime validator. A runtime-only check cannot fail a build, and this boundary should fail the build. |
| vitest | 2.1.9 (dependency `^2.1.8`) | 91 new tests, including eleven fail-closed cases and four poisoned payloads | Jest and `node:test`. vitest is already the suite in this package; a second runner would split `npm test`. |
| tsx | 4.19.2 | runs `src/bin/ursa.ts` directly, so the exact commands in §5 are the ones a user types | a build step. A compile-before-run loop would make the CLI's behaviour depend on a stale `dist/`, which is how the `parseArgs` defect in §10 would have stayed hidden longer. |
| git | 2.55.0 | the end-to-end tests `git init` a real repository and make real commits, because what is under test is partly whether erasure survives re-derivation from history | a mocked history. A mock cannot show that `ursa run` rebuilds a deleted record, which is the defect being fixed. |
| **No new dependency** | — | — | The projection is arithmetic over fields already on the record, and the audit is string containment. A privacy or redaction library would add a supply-chain surface to the one module whose whole value is being auditable by reading it. |

## 9. Terms

- **Outcome record** — the provenance-resolved artifact described in `CLAUDE.md` §1 and typed as `OutcomeRecord` in `ursa-major/src/types.ts`. Holds raw text.
- **Disclosure scope** — a named category of thing that may leave the device. Exactly one exists, `minor-aggregate`.
- **Fail closed** — a state in which an error, an absence, or a corruption resolves to the more restrictive outcome. Here: to `withheld`.
- **Tombstone** — a durable marker that something was removed, retained so the removal cannot be silently undone. Used for an erased record id and for a revoked axiom, for different reasons (§6c).
- **Axiom** — one distilled statement about how the user wants to be worked with, typed as `TuningAxiom`. Carries evidence pointers back to record steps.
- **Shingle** — a fixed-width sliding window over a string, used to test whether any fragment of one text occurs in another. 16 characters here.
- **k-anonymity floor** — the minimum number of distinct contributors behind a published row. Below it, the row is withheld, because a row backed by one person is about that person.
- **Survival scalar** — surviving generated characters divided by generated characters, for one (domain bucket, model, week). Does not distinguish verbatim survival from edited survival, which §7 names as a defect.
- **Domain bucket** — a member of `DOMAIN_BUCKETS`, derived from a file extension only. Never a path and never a directory name.
- **Device boundary** — the wall in §2 between the user's machine and Ursa-operated infrastructure. One edge crosses it.

## 10. What this does not do

Named so nobody reads the §2 diagram as a finished system.

1. **Zone B is not built.** `POST /api/minor/ingest` and the
   `survival_stats` table do not exist. `aggregate()` is the reference
   implementation of the floor that route owes, not the route.
2. **Revocation is a stop, not an undo.** Nothing here reaches a batch the
   user already handed over. The CLI says so in those words rather than
   implying otherwise, and deletion of what was already sent is a request to
   the aggregation layer, which needs a protocol this change does not define.
3. **The existing bridge is untouched.** `src/bridge/index.ts` pushes an
   encrypted `OverlayPayload` to a sync route today. It is end-to-end
   encrypted under a passphrase the server never sees, and it carries the
   user's own tuning to the user's own browser, so it is not an aggregation
   edge. It is also not gated by `consent.json`, and whether it should be is
   a question for the owner rather than a decision for this change.
4. **Aggregates can still be re-identifying at small n.** That is what the
   k-anonymity floor is for, and the floor lives in zone B where
   contributors are countable. A single device cannot enforce it, and
   `contributorCount` is 1 in every row a device emits.
5. **The audit checks text, not inference.** It proves no fragment of the
   user's writing crosses. It does not prove that a sufficiently rich set of
   scalars reveals nothing, which is a differential-privacy question and a
   different piece of work.

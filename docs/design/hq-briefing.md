# `get_briefing`: the HQ surface an agent reads before it works

Engineer seat, 2026-09-26. Implements the first step of the ledger entry
**"Agentic-forward: Ursa as the agents' HQ"** (docs/ideas.md, accepted by
owner direction 2026-09-19) and turns the plan's §15 stub
(docs/design/product-plan.md) into running code. Written to the
engineering-artifact standard in prompts/engineer-agent.md: every node in
the diagram is a file that exists, every interface below is the signature
a caller actually writes, every command is the literal invocation, and no
table cell is a bare noun.

## 1. What this is, in one paragraph

Ursa already grades finished work backwards. `ursa run` joins a finished
artifact to the generations that fed it and writes an `OutcomeRecord`;
`tuning distill` reads those records and distills `TuningAxiom`s, the
owner's rules with evidence pointers attached. Both halves face the past.
`get_briefing` faces forward: given a domain tag and the files an agent
is about to touch, it reads the same store and returns the rules that
apply, the nearest prior correction loops, and the guardrails the owner
had to state after an agent once went further than asked. Brief, work,
debrief — the loop closes, and every agent run both reads the store and
enriches it.

The discipline is fixed by vision §0b and is not a style preference: the
HQ serves **evidence**, never **orders**. Every unit returned carries its
own provenance (an axiom id, a record id, the step ordinals, the owner's
verbatim words) and the payload carries a literal disclaimer field saying
so, because the reader is a model, not a person who read this document.
An HQ that issued commands would be the central planner the principles
reject.

## 2. System diagram, node by node

Nodes are files or directories. Edges carry named types or file formats,
not verb phrases. `->` is "produces or is read as".

```
                     (already shipped, the debrief half)
  ursa-major/src/bin/ursa.ts
        |  OutcomeRecord (TypeScript value)
        v
  ursa-major/src/store.ts  --- OutcomeRecord as JSON --->  <project>/.ursa/records/<taskId>.json
        |
        |  (owner runs the interpretation pass)
        v
  ursa-major/src/tuning/cli.ts
        |  DistillOutput -> mergeDistill -> TuningRecord
        v
  ursa-major/src/tuning/merge.ts --- TuningRecord as JSON ---> <project>/.ursa/tuning.json

                     (this artifact, the brief half)
  <project>/.ursa/tuning.json        <project>/.ursa/records/*.json
        |  TuningRecord                    |  OutcomeRecord[]
        |  (JSON.parse in loadTuning)      |  (JSON.parse in loadRecords)
        v                                  v
  ursa-major/src/hq/cli.ts  ------ (TuningRecord, OutcomeRecord[], BriefingInput) ------>
        |                                                                  |
        |  BriefingInput (parsed from argv by node:util parseArgs)          v
        |                                          ursa-major/src/hq/briefing.ts
        |                                                  |  Query, MatchReason
        |                                                  v
        |                                          ursa-major/src/hq/retrieval.ts
        |                                                  |  MatchReason (score + why)
        |                                                  v
        |<----------------------- Briefing -------- ursa-major/src/hq/briefing.ts
        |
        +-- Briefing as JSON (--json) ------> stdout, for an MCP handler or a script
        +-- renderBriefing(Briefing): string -> stdout, markdown an agent pastes into context

  ursa-major/src/hq/fixtures.ts --- TUNING: TuningRecord, RECORDS: OutcomeRecord[] --->
        ursa-major/src/hq/seed.ts --- the same two JSON shapes ---> <dir>/.ursa/
        ursa-major/src/hq/hq.test.ts --- assertions --->  vitest
```

Node inventory, with each node's job stated rather than named:

| Node (real path) | What it is | What crosses its boundary |
|---|---|---|
| `ursa-major/src/hq/types.ts` | Type-only module: the request an agent sends and the four payload shapes it gets back | `BriefingInput`, `RuleUnit`, `CaseUnit`, `GuardrailUnit`, `Briefing`, `MatchReason`, `BriefingCoverage` |
| `ursa-major/src/hq/retrieval.ts` | The ranker: turns a request into a `Query` and scores one unit against it with named, auditable weights | `Query` in, `MatchReason` (score plus the reasons behind it) out |
| `ursa-major/src/hq/briefing.ts` | The builder: joins axioms to the loops they were learned in, filters, ranks, caps, and renders | `(TuningRecord, OutcomeRecord[], BriefingInput)` in, `Briefing` out; `Briefing` in, markdown `string` out |
| `ursa-major/src/hq/cli.ts` | The shell entry point: resolves store paths, parses flags, prints JSON or markdown | `process.argv` in, exit code out, `Briefing` on stdout |
| `ursa-major/src/hq/fixtures.ts` | A synthetic two-record, four-axiom store, standing in for private trial data | `TUNING: TuningRecord`, `RECORDS: OutcomeRecord[]` |
| `ursa-major/src/hq/seed.ts` | Writes that synthetic store to a directory so this document is reproducible | directory path in, `<dir>/.ursa/` on disk out |
| `ursa-major/src/hq/hq.test.ts` | 17 vitest cases over ranking, sovereignty, determinism, rendering and the CLI | fixture store in, pass or fail out |

Nothing in `src/hq/` writes to the store. A briefing is a read. The only
module here that writes anything is `seed.ts`, and it writes to a
directory the caller names, never to a project's own `.ursa/`.

## 3. Interfaces at every boundary

These are the real signatures, copied from the files named above.

```ts
// src/hq/types.ts — the request
export interface BriefingInput {
  domain?: string          // matched against TuningAxiom.domain, e.g. 'motion'
  files?: string[]         // repo-relative paths, e.g. ['src/app/page.tsx']
  maxRules?: number        // ceiling, default DEFAULT_MAX_RULES = 8
  maxCases?: number        // ceiling, default DEFAULT_MAX_CASES = 3
}

// src/hq/briefing.ts — the call an MCP handler makes
export function buildBriefing(
  tuning: TuningRecord,
  records: OutcomeRecord[],
  input?: BriefingInput,
  now?: string
): Briefing

// src/hq/briefing.ts — the markdown surface
export function renderBriefing(briefing: Briefing): string

// src/hq/retrieval.ts — the ranking seam
export function buildQuery(domain?: string, files?: string[]): Query
export function score(query: Query, domain: string, unitFiles: string[], text: string): MatchReason
export function recurrenceBonus(count: number): number
export function compareScored<T>(
  a: T, b: T,
  whyOf: (x: T) => MatchReason,
  recurrenceOf: (x: T) => number,
  idOf: (x: T) => string
): number

// src/hq/cli.ts — the shell boundary
export function loadTuning(path: string): TuningRecord      // missing file => emptyTuning('local')
export function loadRecords(dir: string): OutcomeRecord[]   // missing dir  => []
export function main(argv: string[]): number                // 0 ok, 2 usage error

// src/hq/seed.ts — the reproducibility boundary
export function writeFixtureStore(root: string): string     // returns the .ursa path written
```

The payload types, in full, are in `src/hq/types.ts`; the two an MCP
handler serialises are:

```ts
export interface Briefing {
  schemaVersion: '0.1.0'
  generatedAt: string          // ISO 8601, injectable so output is reproducible
  request: BriefingInput
  rules: RuleUnit[]
  nearestCases: CaseUnit[]
  guardrails: GuardrailUnit[]
  coverage: BriefingCoverage   // what was looked at, so a thin answer reads as thin
  disclaimer: string           // BRIEFING_DISCLAIMER: evidence, not orders
}

export interface MatchReason {
  domain: 'exact' | 'partial' | null
  filesExact: string[]         // requested paths this unit was actually learned on
  filesByName: string[]        // matched by file name only, directory ignored
  textTokens: string[]         // query words found in the unit's own text
  score: number                // the weighted sum; see WEIGHTS in retrieval.ts
}
```

## 4. Retrieval: what ranks, and the deviation from the stub

Plan §15 names "the §12 client-side embedding retrieval" as the ranker
for nearest cases. **This slice does not use it, deliberately.** No
module in this codebase computes or stores an embedding vector today, so
"use §12" would have meant either a model call on every briefing or a new
dependency, and neither is needed to make the first version useful. The
ranker here is `lexical-v0`, and the `Briefing.coverage.retrieval` field
names it in every payload so no reader has to guess which ranker produced
an order.

Weights, from `WEIGHTS` in `src/hq/retrieval.ts`. Each is a whole number
so a returned order can be recomputed by hand from the printed reasons.

| Weight name | Value | Fires when | Why this rank |
|---|---|---|---|
| `domainExact` | 4 | request domain equals the unit's domain, case-insensitively | the owner tagged this rule with the exact subject the agent named |
| `domainPartial` | 2 | one domain string contains the other, e.g. request `motion` against domain `motion-timing` | related subject, weaker claim than an exact tag |
| `fileExact` | 3 per path | a requested path appears in the loop this unit was learned in | the strongest signal available: this rule was paid for on this file |
| `fileByName` | 2 per path | file names match but directories differ, e.g. `docs/page.tsx` against `src/app/page.tsx` | same kind of file, different place; likely relevant, not proven |
| `textToken` | 1 per word | a query word of three or more characters occurs in the unit's own text | word overlap, the weakest and noisiest signal |
| `fileTermCap` | 9 | ceiling on the summed file terms | stops a unit learned across many files from swamping a domain match |
| `textTermCap` | 3 | ceiling on the summed word terms | stops incidental vocabulary from outranking a file match |
| `recurrenceCap` | 2 | ceiling on the recurrence tiebreak (`evidenceCount - 1`, or a loop's `recurrences`) | how often something was seen orders equals; it never promotes an irrelevant unit |
| `MIN_RELEVANCE` (briefing.ts) | 2 | floor a unit must clear when the request named a domain or a file | one shared word such as `page` is not a reason to spend an agent's context |

Word extraction splits camelCase and every non-alphanumeric character,
lowercases, and drops tokens shorter than three characters: `words('src/app/pageHeader.tsx')`
returns `['src', 'app', 'page', 'header', 'tsx']`. Two-letter tokens such
as `ui` or `js` match everything and rank nothing, so they are dropped
from the query and from the unit text alike.

Two more rules that are not scoring rules:

1. **A `revoked` axiom is never served, under any request.** The
   tombstone exists so a re-distill cannot resurrect a rule the owner
   killed (`src/tuning/types.ts`), and the tombstone is exactly the thing
   an agent must not read. A `user-edited` axiom is served normally, and
   the rendered briefing says it was edited.
2. **An unfiltered request has no relevance floor.** When an agent names
   neither a domain nor a file, there is nothing to be irrelevant to, so
   the whole active store comes back ordered by evidence count.

Second deviation from the §15 stub, stated plainly: the stub types
guardrails as `AxiomEvidence[]`. `AxiomEvidence` carries a record id,
step ordinals and a quote, but no rule text, so an agent receiving it
would get a receipt with nothing on it. `GuardrailUnit` is
`AxiomEvidence` plus `axiomId`, `statement` and `domain`. The extra
fields are copies of the axiom's own, not new claims.

## 5. On-disk layout, with a real payload

The briefing reads the existing per-project store from `src/store.ts`.
Nothing new is created on disk. Using the placeholder home path this
project's redaction rider prescribes:

```
/Users/<you>/Desktop/ursa-minor-site/
  .ursa/
    tuning.json                  TuningRecord, one file, the owner's rules
    records/
      rec-site-001.json          OutcomeRecord, one finished unit of work
      rec-copy-002.json          OutcomeRecord
    episodes.json                Episode[], the run index (not read by the briefing)
```

Both defaults are overridable (`--tuning`, `--records`) so a briefing can
be taken against a fixture with no project on disk.

The payload below is the real output of the real command, run on
2026-09-26 against the store `npx tsx src/hq/seed.ts` writes. The store
is synthetic by design: the owner's actual trial data (task-001) lives in
the private repository `alexandrapaiz/ursa-private`, and nothing in this
document needs it.

```console
$ npx tsx src/hq/seed.ts /tmp/hq-demo
seeded /tmp/hq-demo/.ursa

$ npm run brief --silent -- /tmp/hq-demo --domain motion --files src/app/page.tsx
# Briefing

Evidence, not orders. Every line below is something this owner already demonstrated on real work, with a pointer to where. You remain the judge of whether it applies to the task in front of you.

Request: domain motion; files src/app/page.tsx.

## Rules that apply

- **Prefer: keep entrance motion under 8px of travel**
  - ax-001, domain motion, mixed, seen 2x
  - Her words: "it looks like the page is crashing"
  - Surfaced because: exact domain match; learned on src/app/page.tsx; words in common: motion (score 8)

## Nearest prior cases

- **hero animation reads as a page crash** (rec-site-001/loop-a, accepted)
  - Files: src/app/page.tsx
  - Took 3 repeats after the first ask
  - She said: "it looks like the page is crashing"
  - What actually fixed it: a 64px translateY entrance on the hero, fired after paint
  - The spec nobody could state up front: entrance motion may reposition an element by at most 8px; anything larger reads as breakage, not polish
  - Surfaced because: learned on src/app/page.tsx; words in common: motion, page (score 5)

## Guardrails

Each of these exists because an agent once went further than asked.

- From ax-001 ("keep entrance motion under 8px of travel"), rec-site-001 step 27:
  - Her words: "only touch the hero, do not restyle the rest of the page"

## Coverage

Considered 3 active rules and 3 correction loops across 2 outcome records; returned 1 rule and 1 case. Ranking: lexical-v0.
```

The same request with `--json`, abbreviated to one rule so the shape is
readable (the full document is what the command prints):

```json
{
  "schemaVersion": "0.1.0",
  "generatedAt": "2026-09-26T01:55:55.534Z",
  "request": { "files": ["src/content/about.md"], "maxRules": 8, "maxCases": 3 },
  "rules": [
    {
      "axiomId": "ax-003",
      "statement": "every claim names its mechanism",
      "domain": "copy",
      "polarity": "prefer",
      "basis": "stated",
      "evidenceCount": 5,
      "contradicts": [],
      "status": "active",
      "firstEvidence": {
        "recordId": "rec-copy-002",
        "kind": "correction-loop",
        "ref": "loop-c",
        "steps": [5, 9],
        "quote": "say how, not how great"
      },
      "why": {
        "domain": null,
        "filesExact": ["src/content/about.md"],
        "filesByName": [],
        "textTokens": [],
        "score": 3
      }
    }
  ]
}
```

## 6. Exact commands

Every command below was executed on 2026-09-26 in this repository, from
`ursa-major/`, on Node v22.23.2.

| Command, literally | What it does |
|---|---|
| `npm ci` | installs the pinned dependency tree from `package-lock.json`; no dependency was added by this work |
| `npx tsc --noEmit -p tsconfig.json` | type-checks every module under `src/`, including `src/hq/`, without emitting JavaScript |
| `npm test` | runs the whole vitest suite: 53 tests across 6 files, of which 17 are the new `src/hq/hq.test.ts` |
| `npx vitest run src/hq` | runs only the briefing tests, the tight loop used while building this |
| `npx tsx src/hq/seed.ts /tmp/hq-demo` | writes the synthetic store to `/tmp/hq-demo/.ursa/` so the payload in §5 can be reproduced |
| `npm run brief --silent -- /tmp/hq-demo --domain motion --files src/app/page.tsx` | takes a briefing against that store and prints markdown |
| `npx tsx src/hq/cli.ts brief /tmp/hq-demo --files src/content/about.md --json` | the same read, printed as the JSON an MCP handler would return |
| `npx tsx src/hq/cli.ts brief /Users/<you>/Desktop/ursa-minor-site --domain motion` | the real-project form: reads `.ursa/tuning.json` and `.ursa/records/` under that project |
| `npx tsx src/bin/ursa.ts run /tmp/ursa-dogfood --limit 5` | the debrief half, run against a clone of this repository as a dogfood check (result in §8) |

## 7. Tooling

No tool was added by this work. Every entry below was already in
`ursa-major/package.json`; the versions are the ones resolved in this
run, and the rationale is why the briefing uses it rather than the
alternative considered.

| Tool | Version | Job in this system | Chosen over |
|---|---|---|---|
| Node.js | v22.23.2 | runtime for the CLI and the tests | Bun and Deno: the project targets the runtime a user already has for Claude Code, and `node:util`'s `parseArgs` removes the usual reason to reach for a different runtime |
| TypeScript (`tsc`) | 5.9.3 | type-checks the boundaries in §3; the payload types are the contract an MCP handler will implement | JSDoc-annotated JavaScript: the record schema is the product, and a schema that is not machine-checked drifts |
| tsx | 4.23.8 | runs `.ts` entry points directly, so `npm run brief` needs no build step | `ts-node`: tsx is already the project's runner for `ursa run` and `tuning distill`, and a second runner would be a second set of resolution rules |
| vitest | 2.1.9 | the 17 new tests, including the CLI test that captures `console.log` | node:test: vitest is already the project's runner, and reusing it keeps one `npm test` for the whole suite |
| `node:util` `parseArgs` | ships with Node 22 | flag parsing in `src/hq/cli.ts`, matching `src/bin/ursa.ts` | commander, yargs: a dependency for nine flags, against a project rule that steady-state cost and supply-chain surface both stay at zero |
| `@modelcontextprotocol/sdk` | ^1.x, **not yet installed** | will carry `get_briefing` over stdio and remote HTTP when M2 lands | hand-rolled JSON-RPC: the reference SDK ships both transports; this is named here because §9 of the product plan already chose it, not because this slice uses it |

## 8. What is done, what is next, and one honest negative result

Done and verified by `npm test` (53 passing, 17 new):

- `buildBriefing` returns rules, nearest cases, guardrails and coverage
  from a real `.ursa` store, with the relevance rules in §4.
- A rule learned on the exact file requested outranks a rule with more
  than twice the evidence that was never learned there.
- A `revoked` axiom is served under no request, checked against three
  different requests.
- The same store and request produce byte-identical JSON twice over.
- An empty or missing store yields an empty briefing with an explicit
  "the HQ has learned nothing about this yet" line, not an error and not
  silence.

Not done, and deliberately out of this slice:

- **The MCP server itself.** `get_briefing` is a function and a CLI
  command, not yet an MCP tool, because no MCP server exists in this
  repository to hang it on (M2). Wiring it up is an adapter over
  `buildBriefing`, which is the shape this slice was built to leave.
- **`ursa brief` as a subcommand of `src/bin/ursa.ts`.** Held back on
  purpose: PR #16 rewrites that file's command dispatch, and a second
  branch editing the same switch buys a merge conflict for one line of
  routing. The CLI is reachable today as `npm run brief`.
- **Embedding retrieval.** See §4.

The negative result, recorded because it is evidence: running the
debrief half against a clone of this very repository
(`npx tsx src/bin/ursa.ts run /tmp/ursa-dogfood --limit 5`) found
**0 work units and produced 0 records**. That is not a bug in `ursa run`.
It is the second independent confirmation of the ledger finding from
2026-09-20 ("merge commits are not edits; the PR reader is load-bearing"):
in a repository where every change arrives as an agent's pull request and
the owner merges rather than edits, the generated-then-edited commit pair
almost never occurs. Ursa's own repository cannot brief its own agents
until the PR reader lands, because the store stays empty. The briefing
code is therefore proved against the fixture store and against an empty
store, and is unproven against a store built from this repository's own
history — which is a fact about the debrief half, not this one.

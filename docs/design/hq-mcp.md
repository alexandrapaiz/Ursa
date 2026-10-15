# The MCP surface: tuning and `get_briefing` served instead of pasted

Engineer seat, 2026-10-09. Completes the first step of the ledger entry
**"Agentic-forward: Ursa as the agents' HQ"** (docs/ideas.md, accepted by
owner direction 2026-09-19), which reads "add get_briefing to the M2 MCP
server surface (plan §15 stub)". The briefing itself shipped on
2026-09-26 and is specified in docs/design/hq-briefing.md. The surface it
was supposed to be added to did not exist anywhere in the repository.
This document specifies the surface and the code that implements it.

Written to the engineering-artifact standard in prompts/engineer-agent.md:
every node in the diagram below is a file that exists in this repository
at the stated path, every edge carries a named type or file format rather
than a verb phrase, every interface is the signature a caller actually
writes, every command is a literal invocation that was run, every tool
carries its version and the alternative it beat, and no table cell is a
bare noun.

## 1. What this is, in one paragraph

Ursa Major's portability promise is that from the first message on any
AI, the model already knows how you like to be answered (CLAUDE.md §3).
Until today that promise terminated in a paste. `renderTuningBlock`
(ursa-major/src/tuning/export.ts) renders the user's distilled rules as a
markdown block, and the user was asked to copy it into each new model's
instructions by hand. `get_briefing` had the same shape one layer down:
it was reachable only through `npm run brief`, a command a human types
and whose output a human forwards. Both are now served over the Model
Context Protocol by a local stdio process, so the client fetches them and
no paste happens. Two reads, no writes: the resource
`ursa://tuning/current` returns the same block `renderTuningBlock`
already produced, and the tool `get_briefing` returns the same `Briefing`
`buildBriefing` already computed. Nothing is reimplemented, nothing new
is inferred, and no byte leaves the machine.

The four trust properties CLAUDE.md §3 promises the user each survive
this surface for a specific reason, not by accident:

| Property | Why it survives, mechanically |
|---|---|
| Processing stays on the user's device | The server is a child process the client spawns on the user's own machine. It opens no socket and makes no outbound request. The only paths it reads are the two the caller passed on the command line. |
| The user can inspect what the model sees | The server reads `.ursa/tuning.json` and `.ursa/records/*.json`, the same two files the user can open in an editor. It derives nothing that is not already in them. |
| The user can edit it | Both handlers call `UrsaStore.tuning()` per request rather than caching at connect time, so a file edited mid-conversation is reflected on the next read. Asserted by the test named "re-reads the store on every request, so an edit lands without a reconnect". |
| The user can revoke it | Both reads filter `status === 'revoked'`. The filter lives upstream, in `renderTuningBlock` and `buildBriefing`, so nothing inside `src/mcp/` would fail if a later refactor served raw axioms. Two tests in `src/mcp/mcp.test.ts` exist to be that failure. |

## 2. System diagram, node by node

Nodes are real files, real directories, or the real client process.
Edges carry a named TypeScript type, a JSON-RPC method name, or a file
format. `->` is "produces, or is read as".

```
  THE USER'S MACHINE, and nothing else
  ======================================================================

  an MCP client process
  (Claude Code, Claude Desktop, Cursor)
        |
        |  spawns:  npx tsx src/mcp/cli.ts <projectPath>
        |  speaks:  JSON-RPC 2.0, newline-delimited, over the child's
        |           stdin and stdout
        v
  ursa-major/src/mcp/cli.ts
        |  argv -> { tuningPath: string, recordsDir: string }
        |  diagnostics -> the child's stderr, never stdout
        |
        |--- StdioServerTransport (from the SDK) ---> the pipe above
        |
        |  UrsaStore (the two-method read interface)
        v
  ursa-major/src/mcp/server.ts
        |
        +-- registerResource('tuning', 'ursa://tuning/current')
        |         |  TuningRecord
        |         v
        |   ursa-major/src/tuning/export.ts :: renderTuningBlock
        |         |  string, served as mimeType 'text/markdown'
        |         v
        |   the resources/read response
        |
        +-- registerTool('get_briefing')
                  |  BriefingInput (validated by the zod shape
                  |  GET_BRIEFING_INPUT before the handler runs)
                  v
            ursa-major/src/hq/briefing.ts :: buildBriefing
                  |  Briefing
                  v
            ursa-major/src/hq/briefing.ts :: renderBriefing
                  |  string -> content[0].text   (what the model reads)
                  |  Briefing -> structuredContent (what code reads)
                  v
            the tools/call response

  ursa-major/src/mcp/server.ts :: fileStore
        |  reads, per request, never writes
        v
  <projectPath>/.ursa/tuning.json        TuningRecord as JSON
  <projectPath>/.ursa/records/*.json     OutcomeRecord as JSON
```

Two nodes that are deliberately absent, because an artifact that does not
say what it left out invites someone to assume it was forgotten:

- **No HTTP transport.** `@modelcontextprotocol/sdk` ships
  `StreamableHTTPServerTransport`, and the plan reserves it for M2.5 with
  its own authentication decision (product-plan.md §6, "bearer token over
  OAuth for v0 remote MCP"). Wiring half of it now would create a
  listening surface with no auth story, so the remote transport is not
  imported anywhere in `src/mcp/`.
- **No embedding model.** `briefWithSemantics` and `loadMiniLM`
  (ursa-major/src/hq/embedding.ts) are reachable from `ursa brief
  --semantic` and are not reachable from this server. §5 gives the
  reasoning and the cost of the choice.

## 3. Interfaces at every boundary

These are the signatures a caller writes, copied from
ursa-major/src/mcp/server.ts and ursa-major/src/mcp/cli.ts.

The store boundary, which is the only reason this surface is testable
without a filesystem:

```ts
export interface UrsaStore {
  tuning(): TuningRecord
  records(): OutcomeRecord[]
}

export function fileStore(paths: { tuningPath: string; recordsDir: string }): UrsaStore

export function projectPaths(projectRoot: string): { tuningPath: string; recordsDir: string }
```

The server boundary. `createUrsaServer` builds but does not connect, so
the caller owns the transport choice. That is what lets one definition
serve both the spawned stdio process and the in-memory client/server pair
the test uses:

```ts
export interface ServerDeps {
  store: UrsaStore
  /** injected clock, so a test can assert a byte-for-byte briefing */
  now?: () => string
  /** reported to the client in `initialize`; defaults to the package's */
  version?: string
}

export function createUrsaServer(deps: ServerDeps): McpServer
```

The briefing boundary, a named function rather than an inline closure so
the ranking decision in §5 has one place to live:

```ts
export function briefingFor(store: UrsaStore, input: BriefingInput, now?: string): Briefing
```

The two constants that are wire API. An MCP client keys its own caches on
the resource URI string, so changing it is a breaking change for every
client a user has already configured:

```ts
export const TUNING_URI = 'ursa://tuning/current'
export const SERVER_NAME = 'ursa-major'
```

The tool's argument schema. Field names and meanings are identical to
`BriefingInput` (ursa-major/src/hq/types.ts) on purpose, so the MCP tool
is the same call `ursa brief` makes rather than a second dialect of it:

```ts
export const GET_BRIEFING_INPUT = {
  domain: z.string().optional()
    .describe("free-form domain tag to filter on, e.g. 'motion' or 'copy'; omit for everything"),
  files: z.array(z.string()).optional()
    .describe("repo-relative paths you are about to work on, e.g. ['src/app/page.tsx']"),
  maxRules: z.number().int().positive().optional()
    .describe(`ceiling on rules returned (default ${DEFAULT_MAX_RULES})`),
  maxCases: z.number().int().positive().optional()
    .describe(`ceiling on prior cases returned (default ${DEFAULT_MAX_CASES})`),
}
```

Every field is optional and nothing is required. An empty request is
legal and returns the whole active HQ ranked by evidence count, which is
what a fresh agent with no file list wants; `buildBriefing` already
treats that case as `coverage.unfiltered` and drops the relevance floor.

The process boundary:

```ts
export async function main(argv: string[]): Promise<number>
```

It returns `2` with usage on stderr when no project path was given, and
otherwise resolves only when the client closes the transport. Returning
earlier would exit the process in the middle of a conversation.

## 4. On-disk layout, with a real payload

Nothing in this change adds a file format. The server reads the layout
`ursa-major/src/store.ts` already defines:

```
<projectPath>/.ursa/tuning.json          TuningRecord, one object
<projectPath>/.ursa/records/<taskId>.json OutcomeRecord, one per run
```

What is new on disk is the client's own configuration, and it is the
one place a real path has to appear. Per the redaction rider in
prompts/engineer-agent.md, the home path below is written in the
placeholder-but-runnable form, never this machine's literal home
directory:

`~/.claude.json`, or the project-scoped `.mcp.json`, after the `claude
mcp add` command in §6:

```json
{
  "mcpServers": {
    "ursa": {
      "command": "npx",
      "args": [
        "tsx",
        "/Users/<you>/code/ursa/ursa-major/src/mcp/cli.ts",
        "/Users/<you>/code/my-project"
      ]
    }
  }
}
```

And the real payload: this is the literal text served for
`ursa://tuning/current`, captured from the probe in §6 against the
synthetic store in `ursa-major/src/hq/fixtures.ts`. Synthetic on purpose,
for the reason that file's own header gives: the real trial data
(task-001) lives in the private repository alexandrapaiz/ursa-private and
nothing here needs it.

```markdown
# Tuning

Distilled from 2 real working sessions;
every rule is backed by evidence in the owner's outcome records.
Confidence = independent evidence count. Follow high-confidence rules
from the first message; treat single-evidence rules as hints.

## color
- Prefer: body text holds 7:1 contrast on dark sections (tacit, x1)

## copy
- Prefer: every claim names its mechanism (stated, x5)

## motion
- Prefer: keep entrance motion under 8px of travel (mixed, x2)
```

Read that payload against the fixture and the revocation guarantee is
visible rather than asserted. The fixture carries four axioms. Three are
served above. The fourth, `ax-004`, "open every section with a one-line
summary", is `status: 'revoked'` and appears nowhere in the block.

## 5. The one deviation, and what it costs

`ursa brief` has a `--semantic` flag that ranks the nearest cases by
meaning rather than by word overlap, specified in
docs/design/semantic-retrieval.md. This server does not offer it, and
plan §15 does name "the §12 client-side embedding retrieval" as part of
the briefing, so this is a deviation from the stub and is stated here
rather than left to be discovered.

Two reasons, both mechanical:

1. **A tool call happens inside a user's turn.** `loadMiniLM` fetches and
   loads all-MiniLM-L6-v2, roughly 23MB, costing about two seconds on the
   first briefing in a process. A CLI the user typed can spend that. A
   tool call the model made cannot, because the user is waiting on a
   response they did not know would involve a model load.
2. **A read-only server that writes is not read-only.** The semantic path
   persists an embedding cache to `<project>/.ursa/embeddings.json`. That
   write is correct for the CLI, where the user invoked the ranker and
   the cache saves them time on the next invocation. It is wrong for a
   surface whose entire security argument is that it only ever reads.

What it costs: semantic ranking changes the order of
`Briefing.nearestCases` when the request names a file this owner has
never been corrected on, which is exactly the request where the briefing
is thin anyway. The cost is therefore bounded and it is visible from the
payload rather than hidden: `coverage.retrieval` reports `lexical-v0` and
`coverage.retrievalModel` is absent, which is the same honesty the CLI
already practises when `--semantic` was asked for and the model could not
be loaded. The test named "reports lexical ranking rather than claiming a
semantic one it did not run" holds that line.

The option that is open later, and is not taken today because nothing
has asked for it: a separate `get_briefing_semantic` tool, or a boolean
argument, with the cache made optional so the write disappears.

## 6. Exact commands

Every command below was run on 2026-10-09 on this branch, and the
outputs quoted in this document came from them.

Install the one new dependency and the one newly-declared transitive:

```bash
cd ursa-major
npm install @modelcontextprotocol/sdk@^1.32.1
npm install zod@^4.6.5
```

Typecheck and run the suite:

```bash
cd ursa-major
npx tsc --noEmit
npx vitest run src/mcp
npm test
```

Check the dependency floor, from the repository root, because a new
production dependency is exactly what that gate exists to catch:

```bash
node scripts/dep-floor.mjs
```

Serve the store by hand, which is the form a client's `command` and
`args` reduce to:

```bash
cd ursa-major
npm run mcp -- /Users/<you>/code/my-project
# or, without the package script:
npx tsx src/mcp/cli.ts /Users/<you>/code/my-project
```

Seed a throwaway store from the committed fixtures, so the probe below
has something to serve:

```bash
mkdir -p /tmp/ursa-mcp-demo/.ursa/records
cd ursa-major
npx tsx -e "
import { RECORDS, TUNING } from './src/hq/fixtures'
import { writeFileSync } from 'node:fs'
writeFileSync('/tmp/ursa-mcp-demo/.ursa/tuning.json', JSON.stringify(TUNING, null, 2))
for (const r of RECORDS) writeFileSync('/tmp/ursa-mcp-demo/.ursa/records/' + r.task.id + '.json', JSON.stringify(r, null, 2))
"
```

Wire it into Claude Code, which is the acceptance test plan §5's M2 line
actually names ("done when a fresh session states back an axiom
unprompted"):

```bash
claude mcp add ursa -- npx tsx /Users/<you>/code/ursa/ursa-major/src/mcp/cli.ts /Users/<you>/code/my-project
claude mcp list
```

## 7. Evidence that it works

Two layers, because they prove different things and neither alone is
enough.

**The in-memory layer**, `ursa-major/src/mcp/mcp.test.ts`, 14 tests.
`InMemoryTransport.createLinkedPair()` returns two linked transports, so
every assertion goes through a real `Client`, a real `initialize`
handshake, real capability negotiation and real JSON-RPC framing. The
protocol is not mocked. What this layer cannot reach is the process
boundary: argv parsing, and the stdout discipline that stdio transport
depends on.

**The process layer**, a throwaway probe that spawns `src/mcp/cli.ts` as
a child with `StdioClientTransport` and the SDK's own client. Run on
2026-10-09 against `/tmp/ursa-mcp-demo`, it printed, in order:

```
ursa mcp: tuning /tmp/ursa-mcp-demo/.ursa/tuning.json
ursa mcp: records /tmp/ursa-mcp-demo/.ursa/records
server: {"name":"ursa-major","version":"0.1.0"}
resources: ursa://tuning/current (text/markdown)
tools: get_briefing
```

The first two lines are the point as much as the rest. They are the
server's own diagnostics, and they arrived on stderr. Had they gone to
stdout they would have corrupted the JSON-RPC stream, and the three lines
after them could not have been read at all. On stdio, stdout is the
protocol.

The probe then called `get_briefing` with
`{ files: ['src/app/page.tsx'], maxRules: 3, maxCases: 1 }` and received
the briefing below. It is quoted in full because it is the actual thing
an agent reads, and because its last line is the deviation in §5 stating
itself in the payload. It is the payload **as of the morning of
2026-10-09**; §10 quotes the same call again after that afternoon's
change and the two differ by one sentence:

```markdown
# Briefing

Evidence, not orders. Every line below is something this owner already
demonstrated on real work, with a pointer to where. You remain the judge
of whether it applies to the task in front of you.

Request: files src/app/page.tsx.

## Rules that apply

- **Prefer: keep entrance motion under 8px of travel**
  - ax-001, domain motion, mixed, seen 2x
  - Her words: "it looks like the page is crashing"
  - Surfaced because: learned on src/app/page.tsx (score 3)

## Nearest prior cases

- **hero animation reads as a page crash** (rec-site-001/loop-a, accepted)
  - Files: src/app/page.tsx
  - Took 3 repeats after the first ask
  - She said: "it looks like the page is crashing"
  - What actually fixed it: a 64px translateY entrance on the hero, fired after paint
  - The spec nobody could state up front: entrance motion may reposition an element by at most 8px; anything larger reads as breakage, not polish
  - Surfaced because: learned on src/app/page.tsx; words in common: page (score 4)

## Guardrails

Each of these exists because an agent once went further than asked.

- From ax-001 ("keep entrance motion under 8px of travel"), rec-site-001 step 27:
  - Her words: "only touch the hero, do not restyle the rest of the page"

## Coverage

Considered 3 active rules and 3 correction loops across 2 outcome
records; returned 1 rule and 1 case. Ranking: lexical-v0.
```

The probe's last check searched both responses for the revoked axiom's
own statement and printed `revoked axiom ax-004 present anywhere:
false`.

Suite totals on this branch: 486 tests passing, 4 skipped, up from 472
passing on `main` at b68e3f0. `node scripts/dep-floor.mjs` reports
"Dependency floor holds: no critical anywhere, no high in any production
tree"; `ursa-major`'s one high advisory is `source-map-js`, dev-only, and
it predates this branch.

The process-layer probe is deliberately not committed. It needs a seeded
store in `/tmp` and it spawns a child process per run, which makes it a
slow and environment-dependent test rather than a unit one; the commands
in §6 reproduce it in full, which is the standard this repository already
applies to `tools/stack/integrate.sh`-class checks. The dependency probe
added in §10 is a different case and *is* committed, for the reason given
there: it needs no store, and the fact it measures can change without
anyone touching this repository.

## 8. Tooling

Every row carries a version, the job it does in this system, and the
alternative it beat.

| Tool, at the version installed | Its job here | Why it, over what was considered |
|---|---|---|
| `@modelcontextprotocol/sdk` 1.32.1 (Anthropic's reference TypeScript SDK) | Implements the MCP server, the stdio transport, argument validation, and the `InMemoryTransport` pair the test uses | The plan's own choice (product-plan.md §9), and the alternative it beat there was hand-rolling the protocol. Against that alternative it also supplies the in-memory transport, which is what makes the test a real client rather than a mock. Its cost is honest, worth naming, and now measured rather than asserted: it brings 17 production dependencies, taking `ursa-major`'s production tree from 70 packages to 161, and `src/mcp/loaded-packages.mjs` shows that only 8 packages are compiled on the stdio path. `express`, `hono` and eight others are installed and never executed; they become live code only at M2.5. See §10. |
| `zod` 4.6.5 | Declares `GET_BRIEFING_INPUT`, which the SDK compiles to the JSON Schema a client sees and validates arguments against before the handler runs | The SDK's `registerTool` accepts a zod shape, so this is the SDK's interface rather than a free choice. What was a choice: declaring it in `package.json` instead of relying on it as an undeclared transitive of the SDK. Two copies of zod in one tree break its instance checks, so the declared range `^4.6.5` is pinned to dedupe against the SDK's `^3.25 \|\| ^4.0`, verified by `find node_modules -name 'zod/package.json'` returning exactly one path. |
| `tsx` 4.23.15 | Runs `src/mcp/cli.ts` directly, so the client's `command` needs no build step | Already this repository's pattern for every other entry point (`npm run resolve`, `npm run brief`). Compiling to `dist/` first would add a build step between an edit and the next conversation, and the bundle at `dist/ursa.cjs` deliberately does not include this surface. |
| `vitest` 5.0.2 | Runs `src/mcp/mcp.test.ts` | Already the toolchain for all 486 tests. No reason to introduce a second runner for 14 of them. |
| `node:util` `parseArgs`, built in since Node 18.3 | Parses `<projectPath> [--tuning] [--records]` | Matches `src/hq/cli.ts` and `src/bin/ursa.ts` exactly. `commander` is for multi-command CLIs; this entry point has no subcommands. |
| Node.js 22 (the active LTS line) | The runtime for the spawned server process | What `package.json`'s `@types/node` `^22.10.0` already targets. The SDK requires Node 18 or newer, so this is comfortably inside support. |

## 9. What is done, and what M2 still needs

Done and verified: the surface exists, both reads work through a real
client over both transports, revocation holds on both, the store is
re-read per request so editing works mid-conversation, a malformed
argument is named back to the caller rather than guessed at, and a
project that has never been through `ursa run` returns an empty briefing
that says so in words rather than one a model would read as "nothing
applies here".

Not done, and not claimed: plan §5's M2 line is "done when a fresh
session states back an axiom unprompted". That is an acceptance test on a
real client with a real store, and under the vision's own rule it is the
owner's declaration to make, never one this seat infers. The commands in
§6 are what she would run to make it.

Two things a later day should take, neither of them blocking:

1. **The semantic ranking gap in §5**, if a real briefing is ever
   observed ranking worse here than under `ursa brief --semantic`. The
   observation should come first; today the gap is reasoned, not measured.
2. **`list_axioms()`**, which plan §5's M2.5 line names as the remote
   acceptance call and which does not exist in any transport. It is a
   thinner read than `get_briefing` and would be cheap to add, but the
   remote transport it was specified for is a separate decision with its
   own authentication story, so adding the call before that decision
   would be building to a shape nobody has approved.

## 10. Addendum, 2026-10-09 afternoon: what the briefing costs, and what the SDK carries

Written by the second engineer run of 2026-10-09, against the surface the
first one shipped in PR #146. Both items are ledger entries that run
wrote while building it (`docs/ideas.md`, both dated 2026-10-09), and both
are changes to this artifact rather than new artifacts, so they extend the
elements above in place: §10.1 revises the payload in §4 and §7, §10.2
revises the dependency claim in §8.

### 10.1 `coverage.renderedChars`: the briefing reports its own size

**The defect.** `get_briefing` takes two ceilings, `maxRules` and
`maxCases`, and both are denominated in rules. A caller's real constraint
is characters, and the two do not convert: in the fixture store, a rule
carrying five evidence entries and a verbatim quote renders several times
the length of a rule carrying one and none. So an agent choosing
`maxRules: 8` was guessing at a number it could not translate into the
thing it has to budget, which is the context window it is already
partway through. `Briefing.coverage` answered in the same unit as the
question ("returned 1 rule and 1 case") and so answered nothing.

**The interface, as a caller writes it.** One new optional field on
`BriefingCoverage` (`ursa-major/src/hq/types.ts`) and one new function
beside `renderBriefing` (`ursa-major/src/hq/briefing.ts`):

```ts
export interface BriefingCoverage {
  // ... axiomsConsidered, axiomsReturned, recordsConsidered,
  //     loopsConsidered, casesReturned, retrieval, retrievalModel,
  //     unfiltered, all unchanged
  /** character count of renderBriefing's own output, including the
   *  sentence that prints this number. Absent means not measured. */
  renderedChars?: number
}

/** A briefing and the markdown that was measured to fill in its
 *  coverage.renderedChars. The two are only true together. */
export interface MeasuredBriefing {
  briefing: Briefing
  markdown: string
}

export function measureBriefing(briefing: Briefing): MeasuredBriefing
```

**Why a second function rather than a field `buildBriefing` fills in.**
`buildBriefing` cannot know the number. It is a property of the
rendering, and the renderer runs afterwards over the briefing's own
`coverage` object. The field is therefore optional, and absent means not
measured, never means zero. That matches `retrievalModel` in the same
interface, which is absent rather than `'none'` when no model ranked.

**Why the number is defined as a fixed point, which is the only
interesting line of code here.** The sentence reporting the size is
itself inside the string being measured. Render, measure, attach, and the
attached figure is short by its own digits. Measured on the committed
fixture store, the obvious one-pass implementation is wrong by this much:

| Request | One-pass figure | True length | Error |
|---|---|---|---|
| `{}`, the whole active store | 2466 | 2633 | 167 characters short |
| `{ files: ['src/app/page.tsx'], domain: 'motion' }` | 1452 | 1619 | 167 characters short |
| `{ files: ['nothing/here.txt'] }`, no rules match | 610 | 776 | 166 characters short |

The error is not even constant: the third row is short by 166 rather
than 167 because its answer has three digits where the others have four.
A figure wrong by a varying amount is worse than no figure, because a
caller cannot correct for it.

So `renderedChars` is defined as the value `n` for which rendering the
briefing with `renderedChars: n` produces a string of length exactly
`n`. `measureBriefing` seeds from the render with no size sentence at
all, which is a strict lower bound, and iterates. Let `base` be the
length of the rendered briefing with the sentence present and its digits
removed; the recurrence is `n -> base + digits(n)`, which rises by at
most one per pass once past the first, since only a change in the digit
count can move it. It settles within four passes even in the awkward case
where one pass lands on 999 and the next on 1000. `MEASURE_PASSES = 6`
leaves margin, and exceeding it throws with both values named rather than
returning the last candidate, because a thrown error is a defect report
somebody fixes and a figure quietly off by four is the failure the
function exists to prevent.

**Both call sites now measure rather than render**, which is what makes
the number checkable rather than advisory:

- `ursa-major/src/hq/cli.ts` — `ursa brief` prints
  `measured.markdown` by default and `JSON.stringify(measured.briefing)`
  under `--json`, so the two output modes agree on one number.
- `ursa-major/src/mcp/server.ts` — the `get_briefing` handler returns
  `markdown` as its text content block and the measured `briefing` as
  `structuredContent`. A client reading `coverage.renderedChars` is
  therefore reading the length of the exact string its model was sent.

**The real payload, regenerated.** The same probe and the same call as
§7 (`{ files: ['src/app/page.tsx'], maxRules: 3, maxCases: 1 }`, over
`StdioClientTransport` against a child `src/mcp/cli.ts` serving
`/tmp/ursa-mcp-demo`), run after this change. Everything above
`## Coverage` is byte-identical to §7 and is elided here for that
reason; what is new is the last paragraph:

```markdown
## Coverage

Considered 3 active rules and 3 correction loops across 2 outcome records; returned 1 rule and 1 case. Ranking: lexical-v0.

Size: 1551 characters, counting this sentence. That is what reading this briefing costs you, so raise or lower maxRules and maxCases against it rather than guessing.
```

And the probe's own last three lines, which are the cross-boundary
assertion stated as a measurement:

```
markdown.length                          = 1551
structuredContent.coverage.renderedChars = 1551
they agree                               = true
```

**Tests.** Six in `ursa-major/src/hq/hq.test.ts` and one in
`ursa-major/src/mcp/mcp.test.ts`. The load-bearing one asserts
`briefing.coverage.renderedChars === markdown.length` and that the
markdown contains `Size: ${markdown.length} characters, counting this
sentence.` — which is the assertion the one-pass implementation fails,
in both directions, on every row of the table above. The others pin that
an unmeasured briefing prints no size sentence at all, that re-rendering
the measured briefing reproduces the measured string byte for byte, that
measuring twice gives the same number, and that the figure grows when a
wider request is made.

### 10.2 The SDK's web half is carried, not run, and now there is a probe that says so

**The fact.** Installing `@modelcontextprotocol/sdk` 1.32.1 took
`ursa-major`'s production dependency tree from 70 packages to 161. The
SDK earns its place and this is not an argument against it: it is the
plan's own choice (`docs/design/product-plan.md` §9) and it supplies the
`InMemoryTransport` pair that makes `mcp.test.ts` a real client rather
than a mock. The argument is about what else arrived. The only transport
this repository ships is stdio (`ursa-major/src/mcp/cli.ts`), and the
largest part of the 91 new packages exists for the remote transports.

**Why it needs a gate rather than a note.** `scripts/dep-floor.mjs`
fails every pull request in this repository on a high advisory anywhere
in a production tree. More than half of this tree is now code no shipped
path executes, so the next high advisory in `express` would block the
queue over a package Ursa does not run. The ledger entry offers the owner
two answers — move the SDK to `optionalDependencies` the way
`@huggingface/transformers` already is, or add a dep-floor exception path
scoped to packages shown to be unreachable — and both depend on the
reachability measurement staying true. A minor SDK release that moves one
import to the top of `server/mcp.js` would invalidate both, silently.

**The measurement, as a committed artifact.**
`ursa-major/src/mcp/loaded-packages.mjs`, with
`ursa-major/src/mcp/deps.test.ts` running it.

```ts
// loaded-packages.mjs, the one exported signature
export async function loadedPackages(
  entries?: string[]
): Promise<{ entries: string[]; packages: string[]; scripts: number }>
```

**How it measures, and why not the obvious way.** There is no public
registry of loaded ECMAScript modules the way `require.cache` lists
loaded CommonJS ones. The SDK is dual-published
(`exports` maps `import` to `dist/esm/*` and `require` to `dist/cjs/*`),
so a `require`-based probe would have measured a build this package never
loads: `ursa-major/package.json` declares `"type": "module"`. Instead the
probe attaches a `node:inspector` `Session`, records every
`Debugger.scriptParsed` event, and dynamically imports the entry points.
That event fires once per script V8 compiles, for the build that actually
ships, so a package whose name never appears in a parsed script's path
was never executed.

**Exact commands, and their real output.** From `ursa-major`:

```bash
node src/mcp/loaded-packages.mjs
```

```json
{
  "entries": [
    "@modelcontextprotocol/sdk/server/mcp.js",
    "@modelcontextprotocol/sdk/server/stdio.js"
  ],
  "packages": [
    "@modelcontextprotocol/sdk",
    "ajv",
    "ajv-formats",
    "fast-deep-equal",
    "fast-uri",
    "json-schema-traverse",
    "zod",
    "zod-to-json-schema"
  ],
  "scripts": 362
}
```

Eight packages, and every one of them has a job on this path: the SDK
itself, `zod` and `zod-to-json-schema` for the tool's argument schema,
and `ajv` with its three helpers (`ajv-formats`, `fast-deep-equal`,
`fast-uri`, `json-schema-traverse`) validating it.

`packages` is the stable field and the only one anything asserts on:
three consecutive runs give that same set. `scripts` is indicative and
deliberately not pinned, because it counts every script V8 compiled
including Node's own internals, and it was observed between 362 and 370
for these same two entry points on one machine in one afternoon. It is
reported only so that a count collapsing to near zero, which is the
signature of a measurement that has stopped measuring, is visible;
`deps.test.ts` asserts `scripts > 100` and nothing tighter.

Ten production packages the SDK brought in are installed, therefore
audited by `node scripts/dep-floor.mjs`, and absent from that list:

| Package, installed under `ursa-major/node_modules` | What the SDK uses it for | Reached by the stdio path |
|---|---|---|
| `express` | HTTP server for the OAuth authorization router | No |
| `express-rate-limit` | Rate limiting on those OAuth endpoints | No |
| `cors` | Cross-origin response headers for a browser client | No |
| `jose` | JSON Web Token verification for OAuth bearer tokens | No |
| `hono` | HTTP server behind the Streamable HTTP transport | No |
| `@hono/node-server` | Node adapter for hono's fetch-style request handlers | No |
| `body-parser` | Request body decoding for the express router | No |
| `raw-body` | Request body buffering for the same | No |
| `pkce-challenge` | PKCE code challenges for the OAuth client flow | No |
| `eventsource` | Client-side Server-Sent Events, a transport this server does not offer | No |

**The arm the measurement is expected to fail**, which is what makes the
ten "No" cells mean anything. Ten absence assertions are equally
consistent with a probe that cannot see those packages at all, so
`deps.test.ts` runs the same probe against the SDK path those packages
exist for:

```bash
node src/mcp/loaded-packages.mjs '@modelcontextprotocol/sdk/server/auth/router.js'
```

That call compiles 72 packages against the stdio path's 8, among them
`express`, `cors`, `body-parser`, `express-rate-limit` and
`pkce-challenge`. The probe can see them. The stdio path does not reach
them. For the middle
case, `node src/mcp/loaded-packages.mjs
'@modelcontextprotocol/sdk/server/streamableHttp.js'
'@modelcontextprotocol/sdk/server/sse.js'` loads `hono`,
`@hono/node-server`, `raw-body` and `content-type` and still no
`express`, which places the express tree behind the OAuth router
specifically rather than behind HTTP in general.

**Why the test spawns a child process.** `deps.test.ts` does not call
`loadedPackages()` in-process. By the time vitest reaches that file its
worker may already have imported the SDK for `mcp.test.ts`, in which case
nothing re-parses, every package reads as absent, and the test passes for
exactly the wrong reason. `execFileSync(process.execPath, [PROBE])` with
`cwd` at the package root cannot have that problem, and it is also the
command in this document that a reader re-runs by hand.

**What this does not do.** It does not choose between the owner's two
answers. The ledger entry's first step is the probe, before the choice,
because the choice depends on it; the decision itself is a dependency
policy for the owner and belongs in an ADR, not in this PR.

### 10.3 Tooling added by this addendum

| Tool, at the version installed | Its job here | Why it, over what was considered |
|---|---|---|
| `node:inspector` `Session`, built into Node since 8.0 | Records `Debugger.scriptParsed` so `loaded-packages.mjs` can report which node_modules packages a module graph actually compiles | The alternatives were worse on precision or on cost. `require.cache` cannot see ECMAScript modules and would have measured the SDK's `dist/cjs` build, which this package never loads. A `module.register()` resolve hook sees requests rather than compilations, so it would count a specifier resolved and then tree-shaken away. Static analysis of the import graph has the same flaw and also needs a parser. The inspector protocol is already in the runtime, needs no dependency, and reports compilation, which is the thing "loaded" means. |
| `node:child_process` `execFileSync`, built in | Runs the probe as its own process from `deps.test.ts` | A pristine module registry is a precondition of the measurement, and vitest's worker reuse cannot guarantee one. `execFileSync` over `fork` because the probe's whole output is one JSON object on stdout, so there is nothing an IPC channel would carry. |
| `vitest` 5.0.2 | Runs the 9 tests this addendum adds, bringing the suite to 495 passing | Already the toolchain for the other 486. |

**Suite totals after this addendum:** 495 tests passing and 4 skipped
across 28 files, up from 486 passing on `main` at `b84a6f8`.
`npx tsc --noEmit` is clean, `npm run bundle:check` reports
`dist/ursa.cjs is current`, and `node scripts/dep-floor.mjs` from the
repository root reports "Dependency floor holds: no critical anywhere, no
high in any production tree".

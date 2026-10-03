# A browsable outcome record from the public fixture, and an audit of its provenance navigation

Engineer run, 2026-09-25 (second dispatch of the day). Sprint item 3 of
`docs/sprints/sprint-2026-09-21.md`. Serves O2 KR2.2. Written to the
engineering-artifact standard in `prompts/engineer-agent.md`: system
diagram with real nodes, interfaces as TypeScript signatures, on-disk
layouts with a real payload, exact commands, a versioned tooling list,
and no bare terms.

## 1. What this run is about

The sprint item asks for a record a person can open in a browser and
navigate, built from data that is safe to publish, and it fixes the
standard of "navigable" precisely: **every span's classification links
back to the specific generation and the user's own words that produced
it, with no broken pointer.**

That sentence names three pointers, and the record and the viewer were
each carrying only part of them before this run:

| Pointer | Where it lives in the record | State before this run |
|---|---|---|
| final span → the generation that produced it | `FinalSpan.source: SourcePointer`, resolved in `ursa-major/src/resolve.ts` | Present in the JSON. The viewer named it in prose ("turn 1 · claude-opus-5") but offered no way to reach the generation text it names |
| generation → the user's words that elicited it | `ConversationMeta.prompts: UserPrompt[]`, captured in `ursa-major/src/parse.ts` | Present in the JSON. Rendered **nowhere** in the viewer. The user's own words were in the file and unreachable from the page |
| every pointer resolving at all | implicit | Unchecked. "No broken pointer" was an instruction to squint at a browser, with no mechanism behind it |

So the gap was not in the resolver's labels. It was that the browsable
surface dropped two of the three pointers, and nothing verified the
third. This run closes both and turns "no broken pointer" into a check
that runs on every resolve.

Terms used above, defined here so no cell stands as a bare noun:

- **span** — a contiguous character range of a final file, classified by
  what happened to it (`survived_verbatim`, `survived_mutated`,
  `no_generation_provenance`). Produced by `segment()` in
  `ursa-major/src/segment.ts`, classified by `resolve()`.
- **generation** — one model output: an assistant message, or the
  content of one `Write`/`Edit` tool call. Type `RawGeneration`.
- **eliciting prompt** — the user message that a given assistant turn
  answers: the last prompt typed before that turn.
- **pointer** — a field whose value is an index or id into another part
  of the record (`SourcePointer.generationIndex`,
  `SourcePointer.conversationId`, `Stats.perFile[].path`).

## 2. System diagram

Nodes are files that exist in this repository after this run. Edges
carry the named type or file format, not a verb.

```
                    fixtures/mini/final.md            fixtures/mini/conversations/01-claude.md
                    (the finished work,                fixtures/mini/conversations/02-chatgpt.md
                     3 lines of Markdown)              (paste-format transcripts: YAML frontmatter
                              │                         plus ## user / ## assistant headers)
                              │                                        │
             Array<{path: string; text: string}>       ParsedConversation
                              │                                        │
                              ▼                                        ▼
                    ┌──────────────────────────────────────────────────────────┐
                    │ ursa-major/src/cli.ts                                     │
                    │ argv → Args; collectFinalFiles(); parsePasteConversation() │
                    └──────────────────────────────────────────────────────────┘
                              │ ResolveInput
                              ▼
                    ┌──────────────────────────┐
                    │ ursa-major/src/resolve.ts│  ← ursa-major/src/normalize.ts (Normalized)
                    │ resolve(input)           │  ← ursa-major/src/segment.ts   (Span[])
                    └──────────────────────────┘  ← ursa-major/src/match.ts     (score: number)
                              │ OutcomeRecord                ← ursa-major/src/stats.ts (Stats)
                 ┌────────────┼─────────────────────────────┐
                 │            │                             │
    OutcomeRecord│            │OutcomeRecord    OutcomeRecord│
                 ▼            ▼                             ▼
   ┌──────────────────┐  ┌───────────────────────┐  ┌──────────────────────────┐
   │ JSON.stringify   │  │ ursa-major/src/       │  │ ursa-major/src/audit.ts  │
   │ (node:fs         │  │   viewer.ts           │  │ auditProvenance(record)  │
   │  writeFileSync)  │  │ renderViewer(record)  │  │ elicitingPrompts(record) │
   └──────────────────┘  └───────────────────────┘  └──────────────────────────┘
            │                    │        ▲                       │
            │ outcome_record.json│ HTML   │ Array<UserPrompt|null> │ ProvenanceAudit
            │                    │        └───────────────────────┘
            ▼                    ▼                                ▼
  fixtures/mini/record/   fixtures/mini/record/          process.stdout
  outcome_record.json     outcome_record.html            (formatAudit text block)
                                 │                       process.exitCode = 1 when
                                 │ two <script type=     audit.broken.length > 0
                                 │ "application/json">   
                                 │ blocks: id="record"   
                                 │ (OutcomeRecord) and   
                                 │ id="elicited"         
                                 │ (Array<UserPrompt|null>,
                                 │  indexed by generationIndex)
                                 ▼
                    browser DOM, built by the page's own script:
                    file panel (pre.doc > span.sp, one per FinalSpan)
                      ── click ──▶ aside#inspector
                                     ├─ span class, score, conversation title, turn, model
                                     ├─ button.jump ── openGeneration(SourcePointer) ──▶ Generations panel
                                     │                  (details[open], span.hl over source.start..source.end)
                                     └─ "What the user asked for" ◀── ELICITED[source.generationIndex]
```

Edge note that matters: the browser never recomputes which prompt
elicited a generation. `renderViewer` calls `elicitingPrompts(record)`
in Node, inlines the resulting `Array<UserPrompt | null>` as the
`id="elicited"` JSON block, and the page reads it by index. The audit
calls the same function. One rule, two consumers, no drift.

## 3. Interfaces at every component boundary

New module `ursa-major/src/audit.ts`:

```ts
export type BrokenPointerKind =
  | 'unknown_conversation'
  | 'generation_index_out_of_range'
  | 'generation_index_mismatch'
  | 'generation_conversation_mismatch'
  | 'generation_turn_mismatch'
  | 'generation_model_mismatch'
  | 'source_range_out_of_bounds'
  | 'span_text_mismatch'
  | 'generation_span_text_mismatch'
  | 'no_eliciting_prompt'
  | 'stats_path_unknown'
  | 'stats_conversation_unknown'

export interface BrokenPointer {
  kind: BrokenPointerKind
  /** record coordinates of the pointer, e.g. `files[0].spans[3].source` */
  at: string
  detail: string
}

export interface ProvenanceAudit {
  pointersChecked: number
  spansTotal: number
  spansWithSource: number
  spansReachingPrompt: number
  broken: BrokenPointer[]
}

export function auditProvenance(record: OutcomeRecord): ProvenanceAudit
export function elicitingPrompt(
  record: OutcomeRecord,
  conversationId: string,
  turnIndex: number,
): UserPrompt | null
export function elicitingPrompts(record: OutcomeRecord): Array<UserPrompt | null>
export function formatAudit(audit: ProvenanceAudit): string
```

Unchanged public signature, new internal dependency:

```ts
// ursa-major/src/viewer.ts — now calls elicitingPrompts(record) internally
export function renderViewer(record: OutcomeRecord): string
```

New CLI flag, parsed in `ursa-major/src/cli.ts`:

```ts
interface Args {
  id: string
  out: string
  final: string[]
  sessions: string[]
  conversations?: string
  pathFilter?: string
  annotations?: string
  finished: boolean
  /** pins record.task.generatedAt so a regenerated record diffs only on real changes */
  generatedAt?: string
}
```

The browser-side contract, which TypeScript does not type because the
page script is plain ES5 inside a template literal, stated here as the
signatures the page implements:

```ts
// inside the page: activateTab(i: number): void
// inside the page: openGeneration(src: SourcePointer): void
// inside the page: renderDoc(
//   text: string,
//   spans: Array<FinalSpan | GenerationSpan>,
//   fateMode: boolean,
//   highlight?: { start: number; end: number },
// ): HTMLPreElement
// inside the page: genBuilders: Record<number, (src: SourcePointer) => void>
```

`elicitingPrompt`'s rule, stated exactly: `UserPrompt.step` is the
assistant-step ordinal that was current when the user typed, so the
prompt behind assistant turn `T` is the **last** prompt with
`step < T`. A turn with nothing in front of it returns `null`, and the
audit reports that as `no_eliciting_prompt` rather than hiding it.

## 4. On-disk layout

```
ursa-major/
  fixtures/mini/
    final.md                        the finished work, 3 lines of Markdown
    conversations/01-claude.md      paste-format transcript, model: claude-opus-5
    conversations/02-chatgpt.md     paste-format transcript, model: gpt-5
    record/
      outcome_record.json           6.9 KB, the record itself, committed
      outcome_record.html           28 KB, self-contained viewer, committed, opens offline
  src/audit.ts                      new
  src/provenance.test.ts            new, 18 tests
```

The committed pair under `fixtures/mini/record/` is generated, not
hand-written, and is byte-reproducible because `--generated-at` pins
the only non-deterministic field. It is checked in on purpose: the
sprint item asks for a record someone can open, and a generated file
nobody has to build first is the shortest path from "clone the repo" to
"click a span."

Redaction check, against the standard's redaction rider: every byte of
this payload originates in `fixtures/mini`, which is synthetic public
fixture data. There is no home directory, no machine username, and no
session UUID anywhere in either file. Verified with
`grep -c "/home/\|/Users/" ursa-major/fixtures/mini/record/*`, which
returns `0` for both files.

Real payload, the mutated span from `outcome_record.json` (the case
where the user kept the model's sentence and edited it, so the edit is
the correction):

```json
{
  "start": 100,
  "end": 174,
  "text": "Provenance is established by the artifact itself, not by any human grader.",
  "class": "survived_mutated",
  "score": 0.701,
  "source": {
    "conversationId": "01-claude",
    "model": "claude-opus-5",
    "turnIndex": 1,
    "generationIndex": 0,
    "start": 71,
    "end": 159
  },
  "diff": [
    { "value": "Provenance is established by the artifact " },
    { "value": "itself", "added": true },
    { "value": ", " },
    { "value": "and no", "removed": true },
    { "value": "not by any", "added": true },
    { "value": " human grader" },
    { "value": " is involved at any point", "removed": true },
    { "value": "." }
  ]
}
```

And the conversation record that span's `source.conversationId` reaches,
carrying the user's own words as `prompts`:

```json
{
  "id": "01-claude",
  "title": "01-claude",
  "adapter": "paste",
  "model": "claude-opus-5",
  "source": "claude.ai",
  "date": "2026-08-05",
  "turns": 2,
  "userTurns": 1,
  "prompts": [
    { "step": 0, "text": "Draft two sentences about the resolver." }
  ]
}
```

Following the pointers by hand: the span names `generationIndex: 0`;
`generations[0]` is `01-claude` turn 1; the last prompt with
`step < 1` is `step: 0`, "Draft two sentences about the resolver."
That is the chain the viewer now walks with two clicks and the audit
walks on every run.

## 5. Exact commands

Regenerate the committed record (this is the command `npm run
record:fixture` runs, expanded):

```bash
cd ursa-major
npx tsx src/cli.ts \
  --id mini-fixture \
  --final fixtures/mini/final.md \
  --conversations fixtures/mini/conversations \
  --out fixtures/mini/record \
  --generated-at 2026-09-25T00:00:00.000Z
```

Its output on this fixture, verbatim:

```
final files: 1 · conversations: 2 · generations: 2
resolve: 9.077ms

— outcome record —
covered final chars: 308
  survived_verbatim            41.2%  (127 chars, 2 spans)
  survived_mutated             24.0%  (74 chars, 1 spans)
  no_generation_provenance     34.7%  (107 chars, 2 spans)
  uncertain: 0 spans · trivial: 0 spans
generated: 307 chars → deleted 30.0%
  01-claude: 1 gens, survival 63.2%, turns-to-acceptance 1
  02-chatgpt: 1 gens, survival 100.0%, turns-to-acceptance 1

wrote fixtures/mini/record/outcome_record.json
wrote fixtures/mini/record/outcome_record.html

— provenance navigation audit —
pointers checked: 20
spans: 5 · with a generation source: 3 · of those, reaching the user's own words: 3
broken pointers: 0
```

Prove the regeneration is byte-stable:

```bash
cd ursa-major
md5sum fixtures/mini/record/* > /tmp/h1
npm run record:fixture --silent > /dev/null
md5sum -c /tmp/h1
```

Run the tests and the type check:

```bash
cd ursa-major
npx vitest run                          # 44 passing
npx vitest run src/provenance.test.ts   # 18 of them, this run's
npx tsc --noEmit                        # clean
```

Prove the six viewer tests actually bite, by running them against the
previous viewer (this is the check that they are regression tests and
not tests written to pass):

```bash
cd ursa-major
cp src/viewer.ts /tmp/viewer.new.ts
git show HEAD:ursa-major/src/viewer.ts > src/viewer.ts
npx vitest run src/provenance.test.ts -t "jsdom"   # 6 failed | 1 passed
cp /tmp/viewer.new.ts src/viewer.ts
```

Confirm no filesystem identity reached the committed payload:

```bash
grep -c "/home/\|/Users/" ursa-major/fixtures/mini/record/outcome_record.json \
                          ursa-major/fixtures/mini/record/outcome_record.html
```

Open the record in a browser (macOS):

```bash
open ursa-major/fixtures/mini/record/outcome_record.html
```

## 6. Tooling

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| Node.js | 22.23.2 | Runtime for the resolver, the CLI and the test suite | Already the runtime for every other module in `ursa-major`; no second runtime is worth introducing for one module |
| TypeScript | 5.9.3 (`^5.7.2` in `package.json`) | Types the audit's pointer kinds as a closed union, so a new break kind cannot be added without the switch sites seeing it. `npx tsc --noEmit` is the gate | The union is the point. A string-typed `kind` would let a typo become a silently unreported break |
| tsx | 4.23.8 | Runs `src/cli.ts` directly from TypeScript, which is what `npm run resolve` and `npm run record:fixture` call | No build step to keep in sync for a CLI that is run by hand; `ts-node` needs more configuration for ESM in this package's `"type": "module"` setup |
| Vitest | 2.1.9 | Test runner for all 44 tests | Already the runner for `m0.test.ts`, `resolver.test.ts` and `tuning.test.ts`; adding a second runner for six DOM tests would be gratuitous |
| jsdom | 30.1.1 (new dev dependency) | Executes the rendered page's own script, so a test can click a span and assert what the inspector shows. This is the only way to test the acceptance criterion as written, which is about **opening the HTML**, not about the string the renderer returns | `happy-dom` is lighter but its `<details>`, event and `classList` coverage is thinner, and this suite depends on all three. `linkedom` does not execute page scripts at all, which is exactly the thing being tested. Playwright would run a real browser and test the same six assertions at roughly a hundred times the install weight and wall-clock cost, and would need a browser download in CI. Dev-only, $0, no service, no account |
| `diff` | 8.0.4 | Word-level `generation → final` diff that the mutated-span inspector renders as `<ins>`/`<del>` | Pre-existing dependency of `resolve.ts`, unchanged by this run |

## 7. What the audit found, stated plainly

Two findings, both in the browsable surface rather than in the record:

1. **The user's own words were unreachable from the page.**
   `conversations[].prompts` was written into every record by
   `parse.ts` and rendered by no part of `viewer.ts`. Half of the
   sprint's navigation criterion was failing silently, in a way that
   reading the JSON would never reveal. Fixed by the inspector's "What
   the user asked for" block and by the prompt blocks interleaved into
   the Generations panel. Regression test: *"a model-sourced span names
   its generation and shows the user words behind it"* and *"the
   Generations panel carries the user prompts inline, ahead of the turn
   they produced."*

2. **The span-to-generation link was prose, not a link.** The inspector
   named the conversation, turn and model as text. Nothing took the
   reader to the generation, and for a verbatim span there was no way to
   see the surrounding output at all. Fixed by `button.jump` →
   `openGeneration(src)`, which activates the Generations tab, opens the
   right `<details>`, and marks every generation span overlapping
   `source.start..source.end` with the `hl` class. Regression test:
   *"the generation link opens the Generations tab and highlights the
   exact source range."*

Nothing was found wrong with the pointers in the record data itself:
`auditProvenance` reports 20 pointers checked and 0 broken on
`fixtures/mini`. That is a real result, not a vacuous one, because the
same audit catches every planted break in the seven negative tests in
`src/provenance.test.ts`.

One honest limit on the evidence: jsdom is not a browser. It executes
the page's script and builds the DOM, so clicks, tab switching and the
`hl` marking are genuinely exercised, but layout, scrolling and paint
are not. `scrollIntoView` is stubbed in the test. The visual pass on a
real browser remains the frontend seat's, not this run's.

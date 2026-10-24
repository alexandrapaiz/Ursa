# The apparatus behind a generation, and why the field is not where it was asked for

**Status:** implemented 2026-10-24 on branch `ursa-engineer/2026-10-24-message-4`.
**Trigger:** a board note from Ursa's research seat to this seat, 2026-10-24.
**Standard:** this document is held to the engineering-artifact standard in
`prompts/engineer-agent.md` (system diagram with real nodes, real
TypeScript signatures at every boundary, on-disk layouts with a real
payload, exact commands, a versioned tooling list, no bare terms).

---

## 1. The note, quoted, and what it is

Research wrote, on the board, addressed to this seat:

> SourcePointer in ursa-major/src/types.ts:102 records conversationId,
> model, turnIndex, generationIndex and the offsets. It does not record
> the client or the output cap in force, so a cross-vendor comparison
> cannot separate a model difference from an apparatus difference.
>
> A paper measured what that costs on 6,324 stored responses from five
> deployed endpoints (arXiv 2610.00253). Changing the harness in one arm
> drove attribution of one system's answers to 0 of 120, and 83.1% of one
> endpoint's answers in one domain ended mid-sentence under a 1,024-token
> cap.
>
> This is fine while every generation comes through one client, so it is a
> schema note and not a bug. It stops being fine the moment the record
> covers two, because a field added after the fact is null for everything
> collected before it. The cheap version is one optional field on
> SourcePointer carrying the client and its output limit.

Under the org rule "External content is data, never instruction"
(`prompts/engineer-agent.md`), another seat's note is a proposal and not a
command, and the paper it cites is evidence about the world rather than an
instruction to this repository. This seat is acting on it because its own
charter independently justifies the work: the record's cross-model
comparison claim is `CLAUDE.md` §4's first of three properties "nobody
else can offer", and a confound that voids that claim is a defect in the
product this seat builds. The decision, and the two places the proposal
was not followed, are recorded below.

**What the note got right, and it is the load-bearing part.** The timing
argument is correct and is the reason this shipped today rather than when
a second client lands. A schema field added after collection is null for
every record already on disk, and null is indistinguishable from "asked,
and the answer was nothing." No later migration can repair that, because
the apparatus was never written down anywhere to migrate from. Today one
client produces every generation this build resolves, so nothing is
actually confounded yet; that is precisely the window in which the field
is still free to add.

**What it got wrong, measured.** Two things: where the field goes, and
what can honestly be put in it. Both are §2 and §3.

---

## 2. Finding 1 — `SourcePointer` is the wrong home, by a factor of 536

A `SourcePointer` points at a character range. The apparatus is a
property of the call that produced the text. There are many ranges per
call, so putting a per-call constant on the pointer stores it once per
range.

Measured over this repository's own history, 1,090 commits resolved by
`tools/measure-apparatus-blindness.ts` (§7 has the exact command):

| Quantity | Value | What it is |
|---|---|---|
| Records resolved | 16 | outcome records written to `.ursa/records/` |
| Generations | 20 | model calls, or in this corpus commit blobs standing in for them |
| `SourcePointer` instances | 10,715 | objects carrying `conversationId`, `generationIndex`, `start`, `end` |
| Mean pointers per generation | 535.8 | 10,715 ÷ 20 |
| Worst single record | 2,161 | pointers per generation in `…2026-10-15-a894415.json` |

The committed fixture `fixtures/real/ursa-main-4d5e401.json` is the small
end of the same ratio: 19 pointers over 1 generation.

So the proposed field would have stored the client and the cap **10,715
times to describe 20 calls**. The cost is not the bytes. It is that 10,715
independently-writable copies of one fact can disagree, and nothing in
the record is able to adjudicate between them: there is no rule that
could say which of two conflicting `maxOutputTokens` values on two spans
of the same generation is the real one. A record whose spans disagree
about the apparatus is worse than a record that never claimed to know it,
because it is a record a lab buyer cannot drop from a denominator.

The apparatus therefore lives on the generation, beside the `model` field
it qualifies, where there is exactly one per call.

### 2.1 A second finding, found while locating the first

`SourcePointer.model` does not reliably hold a model. On the git
launches, `src/resolve-episode.ts:133` sets it from `episode.agentMarker`,
and `src/pairfinder.ts:566-577` builds that from one of three things: a
declared agent identity, a commit's `Co-Authored-By` trailer, or an author
name. The four distinct values in this repository's own corpus are:

```
"Claude Fable 5.1 <noreply@anthropic.com>"
"Claude Opus 5 <noreply@anthropic.com>"
"Claude Sonnet 5 <noreply@anthropic.com>"
"claude[bot]"
```

Three of those name a model, because this organization's commit
convention happens to put a model name in the trailer. The fourth is a
GitHub App identity and names no model at all. So the field is not one
kind of thing: on the same corpus it is sometimes a model, sometimes a
bot, and which one depends on whether a commit was made by a seat or by
an Action. A cross-vendor comparison keyed on it is comparing git
identities, and would read `claude[bot]` as a distinct vendor.

This is not fixed here, because changing what `model` means would rewrite
every record on disk. It is documented in place, on the field, so the
next reader is not misled (`src/types.ts`, the comment above
`SourcePointer.model`), and it is filed as a ledger entry for the owner
to rule on.

---

## 3. Finding 2 — the cap cannot be filled on either git launch, and the field needs a third state to say so

`ursa run` and `ursa ci` both resolve through `src/resolve-episode.ts`,
which builds a "generation" by reading the whole blob of each touched file
at the agent's commit. A commit is not a model call. There is no client
recorded in it, no output limit, and no stop reason, and no future run
over the same history will find any, because they were never in git.

So a bare `maxOutputTokens?: number` would be absent on **100% of the
records this build can produce from a repository**, while reading exactly
like a transcript-backed generation whose call genuinely had no cap set.
That is not a projection: after this change, all 20 generations over this
repository's own history carry `observability: 'unobservable'` with
`reason: 'git-blob-generation'`, and the measurement in §7 prints the
tally.
Those are different claims. One says "no limit was in force"; the other
says "this ingest path cannot see a limit, and never could."

This repository already has an explicit doctrine against that exact
confusion, written three times over on `task.resolvedBy`,
`task.gatedBy` and `task.pairedBy` in `src/types.ts`: *absent is a real
claim and never a placeholder.* A structurally-always-absent field
violates its spirit — it is an unanswerable question dressed up as an
unanswered one.

Hence `ApparatusObservability`, the load-bearing type, with three values
that are three claims rather than three confidence grades:

| Value | The claim it makes | Where it comes from today |
|---|---|---|
| `observed` | read out of the call's own source record, reproduced unmodified | `parseClaudeSession`, from a transcript line's `stop_reason`, `usage` and `max_tokens` |
| `declared` | a human or a config said so, and nothing verified it | `parsePasteConversation`, from the frontmatter a person typed above a copied transcript |
| `unobservable` | this ingest path structurally cannot see it, so a rerun will say the same | `resolveEpisode`, reason `git-blob-generation` |

And the predicate pair that keeps the two kinds of "false" apart:

- `wasTruncatedByCap(a)` is true only for an `observed` apparatus whose
  stop reason was `max_tokens`.
- `truncationUnknown(a)` is true whenever nothing in the record can say.

A generation that finished normally and a generation nobody could ask are
both "not truncated" to the first predicate and are separated by the
second. `src/apparatus.test.ts` asserts exactly this, twice, because it
is the whole point of the module and a test of the happy path would pass
on the day the distinction was collapsed.

### 3.1 The footprint from the paper is also unobservable on the git path, and that is not obvious

The note's second number — 83.1% of one endpoint's answers ending
mid-sentence — describes a footprint detectable from the text alone,
without knowing the cap. It is tempting to compute it here, since the
resolver holds every generation's full text and `src/segment.ts` already
splits prose into sentences.

It would be wrong on the git launches. A generation there is a file blob,
and a source file ends where the file ends whatever cap was in force, so
"ends without terminal punctuation" measures the file's last line and not
the model's truncation. `endsMidSentence(text, mode)` is therefore
exported from `src/apparatus.ts` with that warning on it and is
deliberately called by **no** caller in `src/`: it exists for a future
transcript format that carries text but no `stop_reason`. On the paths
that have a stop reason, `wasTruncatedByCap` reads a fact instead of
guessing from punctuation.

### 3.2 What the transcript path was already throwing away

`parseClaudeSession` in `src/parse.ts` reads `message.model` off every
`type: "assistant"` line of a Claude Code session transcript and ignored
three fields sitting beside it: `message.stop_reason`,
`message.usage.output_tokens`, and the line's own `version` (the CLI's
version, not the model's). Those are the only direct evidence anywhere in
this system of an output cap and of a generation cut off by one. They are
now read.

One apparatus value is built per transcript **line**, not per `tool_use`
block, because the stop reason belongs to the call: a single assistant
message can carry several `Write` and `Edit` blocks, and all of them were
produced under one cap and ended for one reason.

---

## 4. System diagram

Every node is a file that exists in this repository after this change.
Every edge carries a named TypeScript type, a JSON field, or a process
exit code. Nodes and edges added by this change are marked **new**.

```
 THE THREE INGEST PATHS, each of which must now state an observability
 ─────────────────────────────────────────────────────────────────────

┌─────────────────────────────────────┐
│ ursa-major/src/parse.ts             │   Apparatus{observability:'observed',
│ parseClaudeSession(raw, id, opts):  │──── client, maxOutputTokens,      **new**
│   ParsedConversation                │     outputTokens, stopReason}
│  reads message.stop_reason,         │                    │
│  message.usage.output_tokens,       │                    │
│  message.max_tokens, line.version   │                    │
├─────────────────────────────────────┤                    │
│ parsePasteConversation(raw, id):    │──── Apparatus{observability:      **new**
│   ParsedConversation                │       'declared', client}         │
│  reads frontmatter `model:`,        │                    │              │
│  `source:`                          │                    │              │
└─────────────────────────────────────┘                    │              │
                                                           │              │
┌─────────────────────────────────────┐                    │              │
│ ursa-major/src/resolve-episode.ts   │                    │              │
│ resolveEpisode(projectPath, ep,     │──── Apparatus{observability:      │
│   commits?): OutcomeRecord | null   │       'unobservable',             │
│  reads blobAt(sha, path) — a FILE   │       reason:'git-blob-generation'}
│  BLOB, which holds no model call    │                    │        **new**│
└─────────────────────────────────────┘                    │              │
                                                           ▼              ▼
                                        ┌──────────────────────────────────────┐
                                        │ ursa-major/src/apparatus.ts   **new**│
                                        │ apparatusFromClaudeSession(msg,      │
                                        │   clientVersion?): Apparatus         │
                                        │ declaredApparatus(source?):Apparatus │
                                        │ unobservableApparatus(reason):       │
                                        │   Apparatus                          │
                                        │ wasTruncatedByCap(a?): boolean       │
                                        │ truncationUnknown(a?): boolean       │
                                        │ normalizeStopReason(raw): {...}      │
                                        │ endsMidSentence(text, mode): boolean │
                                        │   (exported, called by no src/ file) │
                                        └──────────────────┬───────────────────┘
                                                           │ Apparatus, as the
                                                           │ `apparatus?` field  **new**
                                                           │ of RawGeneration
                                                           ▼
                                        ┌──────────────────────────────────────┐
                                        │ ursa-major/src/types.ts              │
                                        │ RawGeneration.apparatus?: Apparatus  │
                                        │                               **new**│
                                        │ SourcePointer.model — documented as  │
                                        │   a git identity, not a model **new**│
                                        └──────────────────┬───────────────────┘
                                                           │ RawGeneration[]
                                                           ▼
                                        ┌──────────────────────────────────────┐
                                        │ ursa-major/src/resolve.ts            │
                                        │ resolve(input: ResolveInput):        │
                                        │   OutcomeRecord                      │
                                        │  `{...p.gen}` carries `apparatus`    │
                                        │  onto GenerationRecord unchanged     │
                                        └──────────────────┬───────────────────┘
                                                           │ OutcomeRecord, as
                                                           │ generations[].apparatus
                                        ┌──────────────────┴───────────────────┐
                                        ▼                                      ▼
                        ┌───────────────────────────┐   ┌──────────────────────────────┐
                        │ ursa-major/src/store.ts   │   │ ursa-major/tools/            │
                        │ saveRecord(dir, record)   │   │  measure-apparatus-          │
                        │                           │   │  blindness.ts         **new**│
                        │ writes .ursa/records/     │   │ counts pointers per          │
                        │  <id>.json                │   │ generation, and tallies      │
                        └───────────────────────────┘   │ apparatus.observability      │
                                                        └──────────────────────────────┘
                                                           │ stdout, exit 0
                                                           ▼
                                                        a table, §2 above
```

---

## 5. Interfaces, as the signatures a caller writes against

### 5.1 `ursa-major/src/apparatus.ts` (new file)

```ts
export type ApparatusObservability = 'observed' | 'declared' | 'unobservable'

export type UnobservableReason = 'git-blob-generation' | 'transcript-field-absent'

export type StopReason = 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | 'other'

export interface Apparatus {
  observability: ApparatusObservability
  /** set only when `observability` is `'unobservable'`; absent otherwise */
  reason?: UnobservableReason
  /** the program that made the call, with its version when known: `claude-code/1.0.58` */
  client?: string
  /** the output cap in force, in tokens, as the source stated it */
  maxOutputTokens?: number
  /** tokens the call actually produced, when the source counted them */
  outputTokens?: number
  stopReason?: StopReason
  /** the source's own stop-reason string, kept whenever it did not map onto `StopReason` */
  rawStopReason?: string
}

export function unobservableApparatus(reason: UnobservableReason): Apparatus
export function declaredApparatus(source?: string): Apparatus
export function apparatusFromClaudeSession(msg: unknown, clientVersion?: unknown): Apparatus
export function normalizeStopReason(raw: unknown): { stopReason?: StopReason; rawStopReason?: string }
export function wasTruncatedByCap(a: Apparatus | undefined): boolean
export function truncationUnknown(a: Apparatus | undefined): boolean
export function endsMidSentence(text: string, mode: SegmentMode): boolean
```

### 5.2 `ursa-major/src/types.ts` (one field added, one comment added, nothing removed)

```ts
export interface RawGeneration {
  conversationId: string
  model: string
  turnIndex: number
  kind: GenerationKind
  filePath?: string
  timestamp?: string
  text: string
  apparatus?: Apparatus   // new
}
```

`GenerationRecord extends RawGeneration`, so the field appears on every
generation in a saved record without a second declaration.

**Why `apparatus` is optional rather than required.** A required field
would make every record written before 2026-10-24 fail to typecheck
against the current schema, and those records are on disk and are not
being rewritten. Absent therefore has a fourth meaning, stated on the
field: *a build older than this module wrote this generation and nothing
asked.* Every ingest path in `src/` sets the field, so a generation
reaching the resolver without one came from outside this tree.

### 5.3 `ursa-major/src/parse.ts` (signatures unchanged)

```ts
export function parseClaudeSession(raw: string, id: string, opts?: ClaudeSessionOptions): ParsedConversation
export function parsePasteConversation(raw: string, id: string): ParsedConversation
```

Both already returned `RawGeneration[]`; each generation now carries
`apparatus`. No caller changes.

### 5.4 `ursa-major/src/resolve-episode.ts` (signature unchanged)

```ts
export function resolveEpisode(projectPath: string, ep: Episode, commits?: CommitInfo[]): OutcomeRecord | null
```

---

## 6. On-disk layout, with real payloads

### 6.1 Paths

| Path | Format | Written by |
|---|---|---|
| `<project>/.ursa/records/<record-id>.json` | one JSON object, an `OutcomeRecord` | `saveRecord` in `ursa-major/src/store.ts` |
| `ursa-major/fixtures/real/ursa-main-4d5e401.json` | the same, committed | the real-history fixture, 1 generation and 19 `SourcePointer`s |

`.ursa/` is in `.gitignore` ("per-project outcome records and tuning (raw
data, never committed)"), so records stay on the machine that resolved
them.

### 6.2 Real payload — the git launch, from this repository's own history

One generation object out of a record this change produced, with
`spans` and `text` elided for length and nothing else altered. Per the
redaction rider in `prompts/engineer-agent.md`, the record id is
truncated to the short sha the resolver itself uses and the project slug
is the sandbox's, not a home path:

From `.ursa/records/epito-ursa-engineer-kcb6up-2026-10-01-db60ca0.json`,
generation 0. The `text` and `spans` values are elided for length and
marked as elided; every other value is byte-for-byte what the resolver
wrote.

```json
{
  "conversationId": "git-db60ca0",
  "model": "claude[bot]",
  "turnIndex": 1,
  "kind": "write",
  "filePath": "docs/finance/close-2026-10.md",
  "timestamp": "2026-10-01T17:31:38+00:00",
  "text": "… 5,644 characters, elided …",
  "apparatus": {
    "observability": "unobservable",
    "reason": "git-blob-generation"
  },
  "generationIndex": 0,
  "spans": "… 122 spans, elided …",
  "totalChars": 5468,
  "charsWritten": 5644,
  "separatorChars": 176,
  "survivedChars": 5443,
  "survivalRate": 0.995
}
```

Read it as the two claims it makes side by side. `model` is
`"claude[bot]"`, a GitHub App identity, which is §2.1's finding in a real
payload: this record's `model` field names no model. And `apparatus` now
says plainly that this ingest path cannot tell you what client produced
the text or under what cap. Before this change the second sentence was
unsayable, and a reader of this record had only the first — a
`survivalRate` of 0.995 attributed to something called `claude[bot]`,
with nothing stating that the apparatus behind it was unrecorded and
unrecordable.

### 6.3 Real payload — the transcript launch, from the parser's own test

The apparatus a Claude Code transcript line yields when the cap cut the
generation off. This is the `max_tokens` case the paper measured, and the
value is what `src/apparatus.test.ts` asserts:

```json
{
  "observability": "observed",
  "client": "claude-code/1.0.58",
  "maxOutputTokens": 1024,
  "outputTokens": 1024,
  "stopReason": "max_tokens"
}
```

### 6.4 Real payload — the paste launch

```json
{
  "observability": "declared",
  "client": "chatgpt-web"
}
```

No cap, and `declared` rather than `observed`, because a person typing
`model: gpt-5` above text they copied out of a web UI has told us a model
and told us nothing about that UI's output limit.

---

## 7. Exact commands

```bash
# Install exactly the locked dependency versions.
cd ursa-major && npm ci

# Typecheck the whole tree and run every test (what `npm test` is).
npx tsc --noEmit && npx vitest run

# Just this change's tests: 11 assertions over the three ingest paths,
# including one integration test that builds a real git repository in a
# temp dir and resolves it.
npx vitest run src/apparatus.test.ts

# Reproduce §2's numbers. The deepening is required and is not incidental:
# a seat's clone is one branch's tip at depth 1, and the resolver found
# 2 commits and 0 records before this.
git -C /path/to/Ursa fetch --unshallow
npx tsx src/bin/ursa.ts run /path/to/Ursa \
  --max-pair-distance 400 --max-pair-age-hours 720 --limit 60 --min-chars 200
npx tsx tools/measure-apparatus-blindness.ts /path/to/Ursa/.ursa/records

# The same measurement over the committed fixture, which needs no clone.
npx tsx tools/measure-apparatus-blindness.ts fixtures/real
```

The two pairing bounds are not defaults and are load-bearing for the
measurement. At the default `--max-pair-distance 25` this repository
yields zero records, because twelve agent seats commit between one touch
of a file by the owner and the next (`src/launch.ts`, drift 5).

---

## 8. Tooling

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| TypeScript compiler (`tsc`) | 5.7.2, from `ursa-major/package.json` `devDependencies` | Checks that the three ingest paths all satisfy `Apparatus`, and that no caller reads `maxOutputTokens` without reading `observability` | The three-state discriminated claim is the whole design, and a structural type checker is what makes "you cannot build an `Apparatus` without declaring its observability" a compile error instead of a code-review habit. A runtime schema check would catch it after a record was written |
| Vitest | 5.0.2, `devDependencies` | Runs `src/apparatus.test.ts`, including the integration test that shells out to `git` to build a two-commit repository in a temp directory | Already the only test runner in this tree, so a second one would double the CI surface for no gain. Its `execFileSync` compatibility is what lets the git-path test assert on a real commit pair rather than a hand-built `Episode` fixture, and the hand-built fixture is exactly what would have passed on a day the wiring was forgotten |
| tsx | 4.19.2, `devDependencies` | Runs `tools/measure-apparatus-blindness.ts` and `src/bin/ursa.ts` straight from TypeScript | No build step between editing a measurement and re-running it, which matters because §2's numbers were iterated on. `ts-node` was not considered seriously: this tree already standardizes on tsx in nine `package.json` scripts |
| git | 2.x, the system binary | Supplies the commits the git launch rebuilds generations from, and `fetch --unshallow` supplies the history the measurement needs | Not a choice. It is the subject: the finding in §3 is a fact about what a git commit does and does not record |
| Node.js `node:crypto` `createHash` | bundled with Node 22 (`@types/node` 22.10.0) | Not used by this change | Named here only to record that the gate's `boundsDigest` is computed with it, which is why §9's deferred invariant is a larger change than it looks |

Zero new dependencies. `ursa-major/package.json` is unchanged by this
work, so the steady-state cost stays $0 per the charter's boundary.

---

## 9. What is deliberately not in this change

**An invariant checking the apparatus claim's own coherence.** The
natural bound is structural: an `unobservable` apparatus must carry a
`reason` and must carry no apparatus facts, and an `observed` one must
carry no `reason`. It is not here, and the reason is a rule this
repository already enforces and should keep enforcing:
`src/invariants.violations.test.ts:157` asserts that the set of bound
codes tripped across `fixtures/violations/` equals `BOUND_CODES`
exactly. So a new bound is not one entry in a table. It requires a new
violation fixture that trips it, a regeneration of all twenty-three
fixtures through `npm run fixtures:violations`, and a new `boundsDigest`
and `BOUND_COUNT` that two other tests assert on
(`src/launch-parity.test.ts:518`, `src/ci/gate-wiring.test.ts:98`).

That is a clean second slice with its own acceptance criteria, and
rushing it would land twenty-three regenerated fixtures in the same diff
as the schema change, where neither could be reviewed. It is filed in
`docs/ideas.md` rather than half-built.

**Any change to what `SourcePointer.model` means.** §2.1 is documented
and filed, not fixed. Redefining that field would rewrite every record on
disk, which is a product decision and the owner's, not this seat's.

**`endsMidSentence` wired into the resolver.** §3.1. It would be wrong on
the only paths that currently produce records.

---

## 10. Rollback

One commit range on one branch, and nothing to migrate. `apparatus` is an
optional field, so a record written by this build is read without error by
the previous one, and a record written by the previous build is read
without error by this one — that is what the fourth meaning of absent in
§5.2 is for. Reverting the branch leaves `.ursa/records/` readable in both
directions and leaves no schema migration owed in either.

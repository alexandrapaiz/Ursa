# Four fifths of what the records sold as survival was text the file already had

Engineer run 2026-10-14. Continues the ledger entry "Two thirds of the
characters sold as verbatim have a rival nobody asked about"
(`docs/ideas.md`, 2026-10-13, status `urgent` on the day this ran), and
the fix shipped the day before it in
`docs/design/verbatim-byte-identity.md`.

<!-- closes: docs/ideas.md 2026-10-13 "Two thirds of the characters sold as verbatim have a rival nobody asked about" -->

Held to the engineering-artifact standard in `prompts/engineer-agent.md`:
a system diagram whose nodes are real, interfaces as TypeScript
signatures, on-disk layouts with a real payload, exact commands, a
versioned tooling list, and no bare terms.

---

## 1. The defect, and why byte-identity did not fix it

On 2026-10-13 `survived_verbatim` was narrowed to mean byte-identical:
the characters of the final span must be the characters of the generation
extent it names. That closed the gap between the label and the three
documents that described it. It did not ask the prior question, which is
**whether the generation wrote those characters at all.**

On the `ursa run` path a "generation" is not a model's message. It is a
whole file blob. `resolveEpisode` in `ursa-major/src/resolve-episode.ts`
builds one `RawGeneration` per touched path, whose `text` is the blob of
that path at the agent's commit (`ep.generatedSha`). A file the agent
opened, changed one line of, and committed therefore produces a
"generation" containing every line the file already had. Pass 1 of
`resolve()` then matches the finished file against that blob, finds
thousands of byte-identical characters, and labels them
`survived_verbatim` — which `README.md`'s class table defines as
"generated and kept unchanged".

Every one of those characters is byte-identical. None of them was
generated.

### 1.1 The measurement

`ursa-major/tools/measure-verbatim-descent.ts`, over twelve outcome
records built from this repository's own git history at
`33a278e`, before the fix:

| Row | Spans | Characters | Share of verbatim characters |
|---|---|---|---|
| All `survived_verbatim` spans in the twelve records | 1,024 | 139,105 | 100% |
| Of those, text the generation's parent commit already held | 719 | 110,736 | **79.6%** |
| Text no parent held, which the generation can be said to have contributed | 305 | 28,369 | 20.4% |

"The generation's parent commit" means the first-parent commit of
`ep.generatedSha`: the file as it stood when the agent opened it. The
containment test is normalized containment, the same one
`gitDescentCorroborator` uses, so the measurement and the gate cannot
disagree about what "already held the text" means.

### 1.2 Two things the ledger entry got wrong, corrected here

The entry estimated 65% and predicted the figure would collapse once the
edited file's own prior version was excluded. Both are off, in ways worth
recording because the entry is the specification the sprint would have
been groomed from.

**First, the entry's proposed experiment cannot be run as written.** It
said to exclude "the generation's own prior version of the edited file"
from the rival search, in order to separate "text that pre-existed
anywhere" from "text that pre-existed in a file this generation did not
touch". The second set is empty by construction.
`gitDescentCorroborator` builds its rival set from
`commitsTouchingPath(projectPath, filePath)`, so every rival it can ever
return is a revision of the same file. Excluding the prior version does
not partition the finding; it deletes the search. The distinction that
does separate the entry's two readings is one commit deep, not one file
over, and that is what the tool measures.

**Second, the 65% was an undercount, because of an ordering defect in the
corroborator that the measurement found on the way past.**
`gitDescentCorroborator` returned the first rival it found walking
`git log --all` output, which is newest-first. A span whose text sits
both in the parent revision and on a parallel branch therefore came back
`sibling` — the weaker relation — purely because git listed the sibling
first. The old search called 505 spans `pre_existing`, while the parent
blob actually held 719. The relation a record carried was partly an
artifact of log ordering.

### 1.3 A real example, from this repository

Record `ursa-2026-09-26-4d5e401`, file `docs/sprints/dispatch-queue.md`,
final characters 223 to 287. The span is the file's title line. It was
sold as `survived_verbatim`. The commit that already held it is
`8ff8e96`, "PM standup 2026-09-26: start draft", which is the parent of
the generation commit. The agent appended to the file; it did not write
the title.

---

## 2. The decision

**Pass 1 asks `input.corroborate` before it makes a verbatim claim, and
a `prior_revision` verdict demotes the span to
`no_generation_provenance`.**

Four sub-decisions, each with the alternative it was chosen over.

### 2.1 Only `prior_revision` demotes

`DescentEvidence` now has three rival relations. Only one of them demotes
a verbatim claim.

| Relation | What it establishes | Demotes `survived_verbatim`? |
|---|---|---|
| `prior_revision` | the generation's own parent commit holds the span's text, so the text existed before the generation did | yes |
| `pre_existing` | an older ancestor holds the text and the parent does not: the generation replaced it and the person put it back | no |
| `sibling` | a commit on a branch the generation is not an ancestor of holds the text | no |

Only `prior_revision` dates the text earlier than the generation, which
is the statement that makes "a model wrote this" false. `sibling` says
the text also exists somewhere else, which on a file many branches edit
is mostly the same shared base content seen from the side: over this
repository's history `sibling` covers 209 spans and 60,971 characters of
text that is overwhelmingly common ancestry rather than copying.
`pre_existing` cannot be reached from pass 1 at all, because restored
text is absent from the generation by definition.

The alternative considered was demoting on any rival, which is what pass
2 does. Rejected: it would move 43.8% of verbatim characters into
`no_generation_provenance` on the evidence that some parallel branch also
contains them, destroying real survival signal. `src/corroborate.ts`
already argues this asymmetry in the other direction, for the case where
the clone has a hole in it.

### 2.2 The parent is checked first, and separately

Before walking the rival set, the corroborator reads the blob of the same
path at each parent of `generatedSha`. A hit returns `prior_revision`
immediately.

This is both cheaper and order-independent. It costs one `git show` per
(parent, path), cached, against a walk of up to `MAX_RIVAL_BLOBS` (40)
commits that it short-circuits. And its answer does not depend on how
`git log --all` happened to order anything, which is the defect in §1.2.

### 2.3 The demotion target is `no_generation_provenance`, not a new class

`CLAUDE.md` §1 defines `no_generation_provenance` as "present in the
finished work but traceable to no generation at all, meaning the model
was never in the running". For text the file already held, the model was
never in the running. This is the literal reading of the existing class,
not a stretch of it, so the four-class taxonomy is unchanged.

The generation extent is not discarded. It is kept as the span's
`candidate`, with `score: 1`, so a buyer can see what the resolver nearly
claimed and the `descent` field says why it did not.

### 2.4 The generation side needed a fourth fate, or the fix invents a worse label

This is the part that was not obvious and is the reason the change is
four files rather than one.

A generation's own spans carry a `fate`. It was computed by elimination:
a segment covered by a verbatim claim is `survived_verbatim`, one covered
by a mutated claim is `survived_mutated`, and **anything else is
`generated_deleted`**. Once pass 1 stops registering a claim for a
demoted span, the segment behind it is covered by nothing and falls into
that last bucket — so the record asserts that the model produced text and
the person threw it away, about text still sitting in the finished file.

`generated_deleted` is the one fate `CLAUDE.md` sells as correction
signal, and `stats.generated.humanDeletedChars` is the figure Ursa Minor
is paid for. Trading a false survival claim for a false discard claim is
not a fix; it is the same mistake that
`docs/design/verbatim-byte-identity.md` §2 records rejecting on
2026-10-13, when dropping a normalized-only hit put 26 spans the model
demonstrably wrote into `no_generation_provenance`.

So `GenerationFate` gains `not_generated`: the segment is inside the
generation's text, the file already held that text, and it has no
survival or deletion fate at all. It carries no `deletion` attribution,
is excluded from `survivedChars`, and is subtracted from `totalChars`
before the deletion split is computed.

It was caught by `src/deletion.test.ts`, whose assertion that merge
deletions dominate human deletions in its fixture went from 900 to 99 the
moment the gate landed without it.

---

## 3. System diagram, node by node

Every node is a file or a function that exists. Every edge carries a
named type or a named file format.

```
                    ┌──────────────────────────────┐
                    │ a git repository on disk     │
                    │ (the project `ursa run` is   │
                    │  pointed at)                 │
                    └──────────────┬───────────────┘
                                   │ CommitInfo[]  (listCommits)
                                   │ PathCommit[]  (commitsTouchingPath)
                                   │ BlobLookup    (blobLookup)
                                   ▼
            ┌──────────────────────────────────────────────┐
            │ src/pairfinder.ts                            │
            │ the only module that runs `git`              │
            └───────┬──────────────────────────┬───────────┘
                    │ CommitInfo[]             │ BlobLookup
                    ▼                          ▼
   ┌────────────────────────────┐   ┌──────────────────────────────────┐
   │ src/episodes.ts            │   │ src/corroborate.ts               │
   │ buildEpisodes()            │   │ gitDescentCorroborator()         │
   │ → Episode                  │   │ → DescentCorroborator            │
   └──────────┬─────────────────┘   └─────────────┬────────────────────┘
              │ Episode                           │ DescentCorroborator
              │ (.generatedSha, .finalSha,        │ (filePath, spanText)
              │  .touchedFiles)                   │   → DescentEvidence
              ▼                                   │
   ┌──────────────────────────────────────────────┴────────────────────┐
   │ src/resolve-episode.ts  resolveEpisode()                          │
   │ builds one RawGeneration per touched path from the blob at        │
   │ generatedSha, and injects the corroborator as input.corroborate   │
   └──────────────────────────────┬────────────────────────────────────┘
                                  │ ResolveInput
                                  ▼
   ┌───────────────────────────────────────────────────────────────────┐
   │ src/resolve.ts  resolve()                                         │
   │                                                                   │
   │  pass 1 ─ byte-identical match ─► verbatimClaim()  ◄── NEW        │
   │              │                        │                           │
   │              │                        ├─ DescentEvidence          │
   │              │                        │  .basis === 'rival' &&    │
   │              │                        │  .relation ===            │
   │              │                        │    'prior_revision'       │
   │              │                        │      ├─ yes → FinalSpan   │
   │              │                        │      │   class            │
   │              │                        │      │   no_generation_   │
   │              │                        │      │   provenance,      │
   │              │                        │      │   + Claim into     │
   │              │                        │      │   notGeneratedClaims│
   │              │                        │      └─ no  → FinalSpan   │
   │              │                        │          class            │
   │              │                        │          survived_verbatim│
   │              │                        │          + Claim into     │
   │              │                        │          verbatimClaims   │
   │  pass 2 ─ fuzzy match ─► normalizedOnlyMutation() / scoring       │
   │                                       └─ Claim into mutatedClaims │
   │                                                                   │
   │  generation fates: verbatimClaims | mutatedClaims |               │
   │                    notGeneratedClaims | (none)                    │
   │                  → GenerationFate                                 │
   └──────────────────────────────┬────────────────────────────────────┘
                                  │ OutcomeRecord
                     ┌────────────┴─────────────┐
                     ▼                          ▼
      ┌──────────────────────────┐  ┌──────────────────────────────────┐
      │ src/stats.ts  measure()  │  │ src/invariants.ts  checkRecord() │
      │ → OutcomeRecord.stats    │  │ → Violation[]                    │
      │   .generated             │  │   DESCENT_CHECKED_UNIFORMLY      │
      │   .notGeneratedChars     │  │   DELETION_SPLIT_EXACT           │
      └──────────────────────────┘  └──────────────────────────────────┘
                     │                          │
                     │ OutcomeRecord (JSON)     │ exit status 0 or 1
                     ▼                          ▼
          ┌─────────────────────────────────────────────────┐
          │ <project>/.ursa/records/<record-id>.json         │
          │ written by src/bin/ursa.ts and src/ci/run.ts     │
          └─────────────────────────────────────────────────┘
```

Edge legend, for the terms that are not self-explanatory:

- **`CommitInfo[]`** — one entry per commit reachable from any ref, with
  `sha`, author, ISO-8601 date, `parents` and subject. Declared in
  `src/pairfinder.ts`.
- **`PathCommit[]`** — `{ sha, subject }` for each commit whose diff
  touched one path, newest first, or `null` when the clone cannot answer.
- **`BlobLookup`** — a three-state read of one path at one commit:
  `{ kind: 'present', text }`, `{ kind: 'absent' }`, or
  `{ kind: 'unreadable' }`. The three states exist because a path git
  reported as touched can legitimately be missing at a given commit, and
  that is a definite answer rather than a hole.
- **`Claim`** — `{ genIndex, start, end }`: an extent of one generation
  that one final span points at.
- **`DescentEvidence`** — the corroborator's verdict on one span, defined
  in §4.

---

## 4. Interfaces, as the signatures a caller writes against

All from `ursa-major/src/`. Changed or added members are marked.

```ts
// src/types.ts — the verdict the gate reads
export type DescentEvidence =
  | { basis: 'corroborated'; rivalsSearched: number }
  | {
      basis: 'rival'
      sha: string                 // 7-character short sha
      subject: string             // the rival commit's subject line
      relation:
        | 'prior_revision'        // ADDED 2026-10-14: the generation's own parent
        | 'pre_existing'          // NARROWED: now the older-ancestor restore only
        | 'sibling'
    }
  | {
      basis: 'unverified'
      reason:
        | 'span_too_short' | 'path_history_unreadable'
        | 'rival_search_capped' | 'unreadable_blob'
      sha?: string
    }

// src/types.ts — the generation-side label
export type GenerationFate =
  | 'survived_verbatim'
  | 'survived_mutated'
  | 'generated_deleted'
  | 'not_generated'               // ADDED 2026-10-14

// src/types.ts — the new figure in stats.generated. Optional, and read as
// zero when absent, because every record written before 2026-10-14 omits
// it and zero is the true value for those records rather than a default.
interface GeneratedStats {
  totalChars: number
  charsWritten: number
  separatorChars: number
  verbatimClaimedChars: number
  survivedChars: number
  notGeneratedChars?: number      // ADDED 2026-10-14
  deletedChars: number
  deletedPct: number
  humanDeletedChars: number
  humanDeletedPct: number
  mergeDeletedChars: number
  unknownDeletedChars: number
}

// src/corroborate.ts — unchanged signature, new behaviour inside
export interface DescentCorroborator {
  (filePath: string, spanText: string): DescentEvidence
}

export function gitDescentCorroborator(
  projectPath: string,
  generatedSha: string,
  commits: CommitInfo[],          // reused: the parents are read off this graph,
): DescentCorroborator            //         so no extra git call is made

// src/resolve.ts — the injection point, unchanged
export interface ResolveInput {
  corroborate?: (filePath: string, spanText: string) => DescentEvidence
  // ... the rest of the input
}

// src/resolve.ts — the new internal gate. Not exported: `resolve()` stays a
// pure function of its input, which is what lets the chat path resolve a
// pasted conversation with no repository anywhere.
const verbatimClaim: (
  base: { start: number; end: number; text: string },
  p: GenPrep,
  gStart: number,
  gEnd: number,
  filePath: string,
  trivial?: true,
) => FinalSpan

// src/invariants.ts — the bound, unchanged signature
export function checkRecord(record: OutcomeRecord): Violation[]
```

`DESCENT_CHECKED_UNIFORMLY` now states three things. In the words the gate
prints: *if any span in the record carries a descent verdict, every
`survived_mutated` span carries one; no span still labelled
`survived_mutated` carries a `rival` verdict; and no span still labelled
`survived_verbatim` carries a `prior_revision` rival verdict.*

`DELETION_SPLIT_EXACT` becomes `humanDeletedChars + mergeDeletedChars +
unknownDeletedChars = deletedChars = totalChars - survivedChars -
notGeneratedChars`.

---

## 5. On-disk layout, with a real payload

### 5.1 Paths

| Path | Format | Written by |
|---|---|---|
| `<project>/.ursa/records/<record-id>.json` | one `OutcomeRecord` as JSON, two-space indent | `src/bin/ursa.ts`, `src/ci/run.ts` |
| `ursa-major/fixtures/violations/descent-checked-uniformly-verbatim.json` | one `OutcomeRecord` that breaks the new clause | `tools/make-violation-fixtures.ts` |
| `ursa-major/fixtures/violations/descent-checked-uniformly-verbatim.md` | the note, quoting the gate's own `observed` string | the same script |

`<project>` is the repository the user pointed `ursa run` at, for example
`~/Desktop/ursa-minor-site`. `<record-id>` is
`ursa-<ISO date>-<7-character short sha of the generation commit>`.

### 5.2 A real demoted span

Produced by resolving this repository's own history. Record
`ursa-2026-09-26-4d5e401`, from `.ursa/records/ursa-2026-09-26-4d5e401.json`,
`files[].spans[]` for `docs/sprints/dispatch-queue.md`:

```json
{
  "start": 223,
  "end": 287,
  "text": "# Dispatch queue — 2026-09-26 (standup, 14:54 UTC scheduled run)",
  "class": "no_generation_provenance",
  "uncertain": true,
  "candidate": {
    "score": 1,
    "text": "# Dispatch queue — 2026-09-26 (standup, 14:54 UTC scheduled run)",
    "source": {
      "conversationId": "git-4d5e401",
      "model": "claude[bot]",
      "turnIndex": 1,
      "generationIndex": 0,
      "start": 0,
      "end": 64
    }
  },
  "descent": {
    "basis": "rival",
    "sha": "8ff8e96",
    "subject": "PM standup 2026-09-26: start draft",
    "relation": "prior_revision"
  }
}
```

Before 2026-10-14 the same span read
`"class": "survived_verbatim", "score": 1`, with the same `source`
pointer and no `descent` field.

### 5.3 The generation segment behind it

Same record, `generations[0].spans[0]`:

```json
{
  "start": 0,
  "end": 64,
  "text": "# Dispatch queue — 2026-09-26 (standup, 14:54 UTC scheduled run)",
  "fate": "not_generated"
}
```

Without §2.4's fate this read `"fate": "generated_deleted"` with a
`deletion` attribution of `{ "cause": "human_edit" }`, asserting the
person discarded a title that is still the file's first line.

### 5.4 The same record's `stats.generated`

```json
{
  "totalChars": 2672,
  "charsWritten": 2795,
  "separatorChars": 123,
  "verbatimClaimedChars": 2655,
  "survivedChars": 2605,
  "notGeneratedChars": 64,
  "deletedChars": 3,
  "deletedPct": 0.001,
  "humanDeletedChars": 3,
  "humanDeletedPct": 0.001,
  "mergeDeletedChars": 0,
  "unknownDeletedChars": 0
}
```

The arithmetic `DELETION_SPLIT_EXACT` now checks, on these numbers:
`2672 - 2605 - 64 = 3`, and `3 + 0 + 0 = 3`. Without the
`notGeneratedChars` term the right-hand side would be 67 against a split
of 3, and the gate would fail every record it produced.

---

## 6. Exact commands, and what they printed

All run from `ursa-major/` unless stated.

### 6.1 The suite, with the type check it is gated behind

```bash
npm test     # tsc --noEmit && vitest run
# Test Files  32 passed | 1 skipped (33)
#      Tests  605 passed | 4 skipped (609)
```

### 6.2 The measurement, before the fix

Run at `33a278e`, which is this branch's first commit, before the
resolver changed.

```bash
npx tsx tools/measure-verbatim-descent.ts /path/to/clone --limit 50 --examples 3
# verbatim spans     1024
# verbatim chars     139,105
#
# AS SHIPPED (src/corroborate.ts, unchanged) — the ledger entry's four rows
#   corroborated             33 spans     14,283 chars    10.3%
#   unverified              270 spans     12,592 chars     9.1%
#   rival:pre_existing      505 spans     50,961 chars    36.6%
#   rival:sibling           216 spans     61,269 chars    44.0%
#
# REFINED — pre_existing split by whether the generation's parent already held the text
#   prior_revision          504 spans     50,633 chars    36.4%
#   restored                  1 spans        328 chars     0.2%
#   sibling                 209 spans     60,971 chars    43.8%
#   future                    7 spans        298 chars     0.2%
#
# PARENT CONTAINMENT — asked of every verbatim span, independent of rival-search order
#   held by parent          719 spans    110,736 chars    79.6%
#   not held                305 spans     28,369 chars    20.4%
```

### 6.3 The same measurement, after the fix

```bash
npx tsx tools/measure-verbatim-descent.ts /path/to/clone --limit 50 --examples 0
# verbatim spans     480
# verbatim chars     24,870
#
# PARENT CONTAINMENT — asked of every verbatim span, independent of rival-search order
#   held by parent            0 spans          0 chars     0.0%
#   not held                480 spans     24,870 chars   100.0%
```

Nothing left in `survived_verbatim` is text the generation's parent held.
That is the acceptance criterion, measured rather than asserted.

### 6.4 Proving the new tests are sharp, by reverting the implementation

The parent loop in `gitDescentCorroborator` was made unreachable and the
demotion condition in `verbatimClaim` was forced false, then restored.

```bash
npx vitest run src/corroborate.test.ts
# × is not the agent's generation surviving the human's edit
# × is demoted out of survived_verbatim and names the parent that held it
# × leaves the agent's own line as a survival, since no parent held it
# × does not register a generation claim for a span it demoted
# × prefers the parent over a sibling branch git happens to list first
#       Tests  5 failed | 11 passed (16)
```

With the implementation restored, 16 of 16 pass.

### 6.5 The fixtures and the bundle

```bash
npm run fixtures:violations          # rewrite fixtures/violations
# Wrote 35 files under fixtures/violations, covering 16 invariant codes.
npm run fixtures:violations:check
# 35 files match what this script would write.
npx tsx src/invariants.cli.ts fixtures/violations
# 21 violations, exit 1
npm run bundle && npm run bundle:check
# dist/ursa.cjs is current (sha256 bdfe57a5…, 186,613 bytes)
```

---

## 7. Tooling

Every tool this change relies on, with the version in the tree, its job
here, and what it was chosen over.

| Tool | Version | Its job in this change | Chosen over |
|---|---|---|---|
| `git` | 2.55.0 | the only source of evidence the gate uses. `git show <sha>:<path>` reads a parent's blob, `git log --all -- <path>` enumerates rivals, and `git log --pretty=%P` supplies the parent shas | `libgit2` bindings or `isomorphic-git`, both of which add a dependency to read data the `git` binary already prints, on a product whose whole premise is that the user's own clone is the record |
| Node.js | 22.23.3 | the runtime. `node:child_process` `execFileSync` runs `git` with an argument array, never a shell string, so a path containing a space or a semicolon cannot become a command | a shell pipeline, which would make every path an injection surface |
| TypeScript | 5.9.3 | makes the taxonomy change checkable. Adding `notGeneratedChars` to the stats type immediately failed the build at `src/hq/fixtures.ts`, which constructs a stats object by hand, and narrowing `DescentEvidence`'s relation union is what keeps `descent.relation === 'prior_revision'` from being readable on a non-rival verdict. It did **not** catch the `survivedChars` filter, which was written as "not `generated_deleted`" and therefore silently counted the new fate as survival: a negated equality check stays valid when a union grows, which is why that filter is now written as the two survival fates by name | JSDoc with `checkJs`, which does not narrow discriminated unions as reliably and is not what the rest of the package is written in |
| Vitest | 5.0.2 | the suite. Chosen originally for native ES-module and TypeScript support with no transform configuration; relevant here because the fixtures shell out to real `git` repositories in `os.tmpdir()`, so per-file worker isolation keeps one fixture's working tree out of another's | Jest, which needs a transform chain for ES modules in this package's `"type": "module"` layout |
| `tsx` | 4.19.2 | runs `tools/measure-verbatim-descent.ts` directly against `src/` with no build step, so a measurement is reproducible from a clean clone with one command | compiling to `dist/` first, which would make the measurement depend on a build artifact being current |
| `diff` | 8.0.2 | produces the character-level diff on a `survived_mutated` span. Untouched by this change, listed because the gate decides which spans reach it | a hand-written Myers diff, rejected because the library is already the one `docs/design/verbatim-byte-identity.md` chose |
| `esbuild` | 0.28.0 | bundles `dist/ursa.cjs`, whose sha-256 prefix is what a record's `task.resolvedBy.digest` names. Re-run here because the resolver changed, so records must not claim the old digest | `tsc` emit plus a bundler, two steps where one suffices |

---

## 8. What this does not fix

Three things the measurement found and this change leaves open. Each is a
ledger entry of its own, dated 2026-10-14.

1. **A rival that did not exist yet still counts.**
   `gitDescentCorroborator` excludes descendants of the generation but
   applies no time bound, so a commit on an unmerged branch authored
   after the episode closed can be reported as a `sibling` rival holding
   the text. Measured: 7 spans and 298 characters, 0.2%, so it is a
   correctness defect rather than a load-bearing number. The fix needs
   the episode's `finalSha` passed to the corroborator, which changes the
   signature and every caller.

2. **`rival_search_capped` covers 148 spans.** `MAX_RIVAL_BLOBS` is 40,
   and on a file with a hundred commits the search gives up and says so
   honestly. Those spans keep their label on an unfinished search. The
   parent check added here is unaffected, because it happens before the
   walk, but a span whose parent did not hold the text and whose rival
   walk was capped is still unsettled.

3. **The root cause is upstream of the gate.** A generation on the
   `ursa run` path is a whole file blob, which is why the gate is needed
   at all. A generation built from the agent's diff rather than the
   agent's blob would make four fifths of this problem disappear at the
   source, and would change what every downstream figure means. That is a
   design change, not a day's work.

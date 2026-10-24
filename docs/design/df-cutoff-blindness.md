# The document-frequency cutoff, and the spans it decides not to look at

**Status:** shipped on branch `ursa-engineer/2026-10-24-message-5`, for
the half that is a field. One decision inside it is the owner's and is
stated in §7 rather than taken.

**Provenance of the finding.** Routed to this seat by Ursa's research
seat as finding 52 of `docs/research/briefs/2026-10-24-message-14.md`,
with `ursa-major/src/match.ts:12` and `ursa-major/src/resolve.ts` named
as the site. The measurement in §1 is that seat's and the bound on it is
quoted from that brief rather than restated. Everything in §2 onward is
this seat's own and was reproduced on this branch.

---

## 1. The defect this closes, and the half it does not

`ursa-major/src/match.ts` exports `MAX_TOKEN_DF = 500`, a count of
**generation segments**, where a generation segment is one sentence (in
prose) or one trimmed line (in code) of something a model produced, as
cut by `segment()` in `ursa-major/src/segment.ts`. The resolver's second
classification pass, the fuzzy one, builds its candidate set by looking
each of a final span's distinct tokens up in an in-memory inverted index
and skipping any token whose list of containing generation segments is
longer than that constant.

A final span every one of whose distinct tokens is either absent from
that index or over the cutoff therefore seeds **zero** candidates.
`best` stays `null`, neither the `THETA_HIGH` branch nor the
`THETA_LOW` branch can fire, and before 2026-10-24 the span fell through
to a bare `no_generation_provenance` label carrying no `uncertain` flag
and no `candidate` object.

**Why that is a defect and not a tuning choice.** Three different events
produced that identical bare label, and they are different objects:

| What happened | What it says about the finished work | What it says about the matcher |
|---|---|---|
| Candidates were seeded and the best of them scored under `THETA_LOW` (0.35) | The person's text is not a close edit of anything the model wrote | The matcher looked |
| Every distinct token is absent from the index, meaning it appears in no generation segment at all | The model was never in the running, which is what `CLAUDE.md` §1 calls the most valuable category | The matcher looked, and there was nothing to look at |
| At least one distinct token is in the index and every indexed token is over `MAX_TOKEN_DF` | **Nothing. This row is not evidence about the work.** | The matcher did not look |

The third row is the defect. It is reported as the first two, and the
buyer of the record, the adjudicator working through
`skills/adjudicating-uncertain-spans/SKILL.md`, and the resolver's own
`stats.uncertainSpans` count all read it as the second.

**Why the population grows rather than shrinks.** `MAX_TOKEN_DF` is an
absolute count. Document frequency is measured over generation segments,
and the number of generation segments a record is resolved against grows
every time anyone runs the tool. So the set of tokens the matcher
refuses to seed on grows monotonically with the corpus, and the set of
spans it cannot see grows with it. Ursa's research seat measured the
shape against a proxy corpus, being this repository's own markdown with
the product's `normalize`, `tokens` and `segmentProse` rules
reimplemented so the predicate under test is the shipped one:

| generation segments | tokens over the cutoff | substantive spans seeding zero candidates |
|---|---|---|
| 1,000 | 0 | 0.00 per cent |
| 2,500 | 1 | 0.00 per cent |
| 10,000 | 16 | 0.03 per cent |
| 25,000 | 53 | 0.09 per cent |
| 50,000 | 110 | 0.33 per cent |
| 87,333 | 199 | 1.10 per cent |

That seat's own bound, which travels with the numbers: the corpus is a
proxy, prose written by many runs about one subject repeats its
vocabulary more than a general conversation corpus would, so the cutoff
is reached sooner there than it would be on the same number of real
generation segments. The **shape** transfers because it follows from the
arithmetic rather than from the corpus. The **percentages** do not.

Both of this project's trials sit where the figure is zero, so no trial
could have caught this and neither owner-declared verdict is affected by
it. It arrives with growth, which inverts the premise in `CLAUDE.md` §2
that the longitudinal depth of the dataset is an asset that compounds.

**The direction of the error is the worst one available.** Every span
the cutoff blinds moves out of `survived_mutated`, which `CLAUDE.md` §1
says *is* the correction expressed as an edit, and into
`no_generation_provenance`, which the same section calls the most
valuable category. The failure silently inflates the single number Ursa
Minor sells hardest, by more as the dataset gets bigger.

**What this change does and does not do.** It makes the third row
nameable and countable. It changes no label, retunes nothing, and
deliberately leaves `MAX_TOKEN_DF` at 500. §7 is the decision it does
not take.

---

## 2. System diagram, node by node and edge by edge

Every node below is a function, constant, in-memory structure or file
that exists in this repository, named as it is named in code. Render it
as a left-to-right flow; the two nodes marked **new** are the only ones
this change adds.

**Nodes.**

1. `ursa-major/src/bin/ursa.ts` — the `ursa run <project>` command-line
   entry point. A Node process that reads a git working tree and a
   directory of conversation transcripts.
2. `ursa-major/src/segment.ts` → `segment(text, mode)` — cuts a string
   into `Span` objects, one per prose sentence or per trimmed code line,
   each carrying its byte offsets into the original string.
3. `ursa-major/src/normalize.ts` → `normalize(text)` — case folds, folds
   smart punctuation to ASCII, collapses whitespace, and returns the
   folded string plus `map`, an array giving the original offset of each
   folded character.
4. `ursa-major/src/match.ts` → `tokens(norm)` — splits a normalized
   string on every run of non-alphanumeric characters.
5. `ursa-major/src/match.ts` → `MAX_TOKEN_DF` — the constant under
   discussion. An integer, currently 500.
6. `tokenIndex` — a `Map<string, Array<{ p: GenPrep; sIdx: number }>>`
   built inside `resolve()` in `ursa-major/src/resolve.ts` and never
   written to disk. Keys are tokens, values are the list of generation
   segments containing that token. Its value array's `.length` **is** the
   document frequency the cutoff compares against.
7. `corpusSegments` (**new**) — a number computed inside `resolve()` as
   `preps.reduce((n, p) => n + p.sentences.length, 0)`, the total number
   of generation segments the index was built over.
8. `ursa-major/src/resolve.ts` → pass 2, the fuzzy pass — the block that
   reads nodes 4, 5, 6 and 7 and writes node 9.
9. `FinalSpan.noCandidate` and `FinalSpan.tokenSuppression` (**new**) —
   two optional fields on the span object, declared in
   `ursa-major/src/types.ts`.
10. `ursa-major/src/stats.ts` → `computeStats(files, generations,
    conversations, exclusions)` — walks every span of every file and
    returns the `Stats` object the record carries.
11. `ursa-major/src/store.ts` → `writeRecord` — serializes the
    `OutcomeRecord` to `<project>/.ursa/records/<task.id>.json`.
12. `ursa-major/src/invariants.ts` → `checkRecord(record)` — the gate
    that refuses a malformed record, returning an array of violation
    codes.
13. `ursa-major/src/viewer.ts` → the single-file HTML viewer the user
    opens to read a record.
14. `skills/adjudicating-uncertain-spans/SKILL.md` — the written
    procedure a human follows when working through spans the record
    flags for adjudication.

**Edges, each labelled with the data that crosses it.**

- 1 → 2: `{ text: string, mode: SegmentMode }`, where `SegmentMode` is
  the literal union `'prose' | 'code'` declared in
  `ursa-major/src/types.ts`.
- 2 → 6: `GenSentence[]`, one per generation segment, each
  `{ start: number; end: number; text: string; norm: string; tokenSet: Set<string> }`.
- 3 → 4: the normalized string, a `string`.
- 4 → 6: `string[]`, the token list whose `Set` becomes `tokenSet`.
- 6 → 8: for one queried token, `Array<{ p: GenPrep; sIdx: number }> | undefined`.
  `undefined` means absent from the corpus; a value whose `.length`
  exceeds node 5 means suppressed. **These two cases were merged at this
  edge before this change and are now separated at it.**
- 5 → 8: `number`, the cutoff, read once per candidate token.
- 7 → 9: `number`, carried onto the span as
  `tokenSuppression.corpusSegments`.
- 8 → 9: `NoCandidateReason | null` and `TokenSuppression | null`, the
  two values written in the `spans.push` at the end of the per-span
  loop.
- 9 → 10: the whole `FinalSpan`, read field by field.
- 10 → 11: `Stats`, now including `blindSpans?: number` and
  `suppressedTokenSpans?: number`.
- 11 → disk: one JSON file, UTF-8, two-space indented, trailing newline,
  at `<project>/.ursa/records/<task.id>.json`.
- 11 → 12: the in-memory `OutcomeRecord`, before the write.
- disk → 13 and disk → 14: the same JSON file, read by a browser and by
  a person respectively.

**The one edge that does not exist and is the subject of §7.** Nothing
flows from node 7 (`corpusSegments`) back into node 5
(`MAX_TOKEN_DF`). The cutoff is a literal and does not read the corpus
size. Making that edge exist is the decision in §7.

---

## 3. Interfaces at every component boundary, as real signatures

These are the declarations a caller writes against, copied from the
files named. Nothing here is a paraphrase.

In `ursa-major/src/match.ts`, unchanged by this work and quoted because
§7's decision changes exactly this line:

```ts
/** tokens appearing in more than this many generation segments are too common to seed candidates */
export const MAX_TOKEN_DF = 500
```

In `ursa-major/src/types.ts`, new:

```ts
export type NoCandidateReason =
  | 'scored_below_floor'
  | 'absent_from_corpus'
  | 'df_cutoff_suppressed'
  | 'empty_after_normalization'

export interface TokenSuppression {
  /** distinct tokens in the span's normalized text */
  distinct: number
  /** of those, how many were skipped for exceeding `cutoff` */
  suppressed: number
  /** `MAX_TOKEN_DF` as it stood when this record was resolved */
  cutoff: number
  /** generation segments in the token index this record was resolved against */
  corpusSegments: number
}
```

In `ursa-major/src/types.ts`, the two fields added to the existing
`FinalSpan` interface:

```ts
export interface FinalSpan {
  // … start, end, text, class, score, source, diff, uncertain, candidate … unchanged
  noCandidate?: NoCandidateReason
  tokenSuppression?: TokenSuppression
}
```

In `ursa-major/src/types.ts`, the two fields added to the existing
`Stats` interface. Both are optional, which is a claim and not laziness:
a record written before 2026-10-24 omits them, and for such a record
zero is wrong but unknowable, so a reader must be able to tell "this
record has no blind spans" from "this record predates the count".

```ts
export interface Stats {
  // … finalChars, coveredChars, byClass, uncertainSpans, trivialSpans … unchanged
  blindSpans?: number
  suppressedTokenSpans?: number
}
```

In `ursa-major/src/resolve.ts`, the entry point whose behaviour changed,
unchanged in signature:

```ts
export function resolve(input: ResolveInput): OutcomeRecord
```

In `ursa-major/src/stats.ts`, unchanged in signature, now writing two
more fields:

```ts
export function computeStats(
  files: FinalFile[],
  generations: GenerationRecord[],
  conversations: ConversationMeta[],
  exclusions?: Exclusion[],
): Stats
```

**The reading rule a consumer of the record should write against**, in
the same language, so that no consumer has to rediscover it:

```ts
/** true when this span's `no_generation_provenance` is a fact about the matcher rather than about the work */
const isBlind = (s: FinalSpan): boolean =>
  s.class === 'no_generation_provenance' && s.noCandidate === 'df_cutoff_suppressed'

/** true when the span's score, whatever it is, was computed on a candidate set seeded by only part of its vocabulary */
const isPartiallySeeded = (s: FinalSpan): boolean =>
  s.tokenSuppression !== undefined && s.tokenSuppression.suppressed > 0
```

---

## 4. On-disk layout, with real payloads

**Path.** `<project>/.ursa/records/<task.id>.json`, written by
`writeRecord` in `ursa-major/src/store.ts`. UTF-8, JSON, two-space
indent, trailing newline. Spans live at
`files[<i>].spans[<j>]` and the two counters at `stats.blindSpans` and
`stats.suppressedTokenSpans`.

**Real payload, over the cutoff.** The two JSON objects below are the
actual output of `resolve()` on this branch, produced by the probe
command in §5 against a generation corpus of 501 segments, each of the
form `Row w<i> holds alpha beta gamma delta onward.` The final file is
the single sentence `Row holds alpha beta gamma delta onwards.`, whose
distinct tokens are `row`, `holds`, `alpha`, `beta`, `gamma`, `delta`
and `onwards`. Six of those seven appear in all 501 segments, so all six
are over the cutoff; `onwards` appears in none of them, so it has no
index entry to be over the cutoff with. No real project, path, session
identifier or home directory appears, because the corpus is synthetic
by construction, which is the only way to put 501 segments of one
vocabulary in front of the matcher.

```json
[
  {
    "start": 0,
    "end": 41,
    "text": "Row holds alpha beta gamma delta onwards.",
    "class": "no_generation_provenance",
    "noCandidate": "df_cutoff_suppressed",
    "tokenSuppression": {
      "distinct": 7,
      "suppressed": 6,
      "cutoff": 500,
      "corpusSegments": 501
    }
  }
]
```

and the record's own counters alongside it:

```json
{
  "blindSpans": 1,
  "suppressedTokenSpans": 1,
  "uncertainSpans": 0
}
```

**The same final text, under the cutoff.** Identical input in every
respect except that the corpus holds 4 of those segments rather than
501, so the six tokens have a document frequency of 4 and the cutoff
never fires. This is the label the span has when the matcher is allowed
to look at it, and it is what the record above is losing:

```json
[
  {
    "start": 0,
    "end": 41,
    "text": "Row holds alpha beta gamma delta onwards.",
    "class": "survived_mutated",
    "score": 0.882,
    "source": {
      "conversationId": "c1",
      "model": "probe-model",
      "turnIndex": 0,
      "generationIndex": 0,
      "start": 0,
      "end": 43
    },
    "diff": [
      { "value": "Row " },
      { "value": "w0 ", "removed": true },
      { "value": "holds alpha beta gamma delta " },
      { "value": "onward", "removed": true },
      { "value": "onwards", "added": true },
      { "value": "." }
    ]
  }
]
```

A combined score of **0.882**, well clear of `THETA_HIGH` at 0.6, with a
source pointer and a word diff, against a bare
`no_generation_provenance` with neither. The only thing that changed
between the two runs is how many segments the corpus holds.

---

## 5. Exact commands

Every line below is a literal invocation, run from the `ursa-major`
directory of a clone of this repository. Substitute `<project>` with a
path such as `~/Desktop/ursa-minor-site`.

Install the toolchain exactly as the lockfile pins it:

```bash
npm ci
```

Typecheck, which is what proves the two new fields are consistent with
every reader of `FinalSpan` and `Stats`:

```bash
node_modules/.bin/tsc --noEmit
```

Run the three tests that pin this behaviour, and then the whole suite:

```bash
node_modules/.bin/vitest run src/df-cutoff.test.ts
node_modules/.bin/vitest run
```

Reproduce the two payloads in §4. Write the probe to a per-run path
rather than a fixed one, because this host runs seats concurrently and a
fixed scratch name is a shared mutable name:

```bash
PROBE="$(mktemp -t ursa-df-probe-XXXXXX).ts"
cat > "$PROBE" <<'EOF'
import { resolve } from '<absolute path to this clone>/ursa-major/src/resolve'
import { MAX_TOKEN_DF } from '<absolute path to this clone>/ursa-major/src/match'
const SEGMENTS = Number(process.argv[2])
const corpus = Array.from({ length: SEGMENTS }, (_, i) => `Row w${i} holds alpha beta gamma delta onward.`).join(' ')
const r = resolve({
  taskId: 'df-cutoff-probe',
  files: [{ path: 'final.md', text: 'Row holds alpha beta gamma delta onwards.' }],
  conversations: [{ id: 'c1', title: 'df cutoff probe', adapter: 'paste', model: 'probe-model', turns: 2, userTurns: 1 }],
  generations: [{ conversationId: 'c1', model: 'probe-model', turnIndex: 0, kind: 'assistant_text', text: corpus }],
  finished: true,
  generatedAt: '2026-10-24T00:00:00.000Z',
})
console.log(JSON.stringify(r.files[0].spans, null, 2))
console.log(JSON.stringify({ cutoff: MAX_TOKEN_DF, blindSpans: r.stats.blindSpans, suppressedTokenSpans: r.stats.suppressedTokenSpans }, null, 2))
EOF
npx tsx "$PROBE" 501
npx tsx "$PROBE" 4
rm -f "$PROBE"
```

Resolve a real project and then count the blind spans in the record it
wrote, which is the figure §7's decision needs:

```bash
npx tsx src/bin/ursa.ts run <project>
node -e 'const {readdirSync,readFileSync}=require("fs");const d=process.argv[1];for(const f of readdirSync(d).filter(x=>x.endsWith(".json"))){const r=JSON.parse(readFileSync(d+"/"+f,"utf8"));console.log(f,"blindSpans="+r.stats.blindSpans,"suppressedTokenSpans="+r.stats.suppressedTokenSpans,"segments="+r.generations.reduce((n,g)=>n+g.spans.length,0))}' <project>/.ursa/records
```

Rebuild the committed single-file bundle and its digest index, which the
suite checks for staleness on every run and which any change under
`src/` makes stale:

```bash
npm run bundle
npm run provenance:bundles
```

---

## 6. Tooling

| Tool | Version | Its job in this change | Why it, over what was considered |
|---|---|---|---|
| Node.js, the JavaScript runtime the product executes under | 22.23.2 | Runs the resolver, the test suite, the probe in §5 and the committed `dist/ursa.cjs` bundle | Already the runtime of every other part of `ursa-major`, and the version the repository's own lockfile and bundle were produced under. Changing it would invalidate the committed bundle digests for no gain to this change |
| TypeScript, the typed-JavaScript compiler | 5.9.3 | Declares `NoCandidateReason` as a closed union of four string literals and proves no reader of `FinalSpan` or `Stats` is broken by two added optional fields | The alternative was a documented string convention with no compiler behind it. A closed union is what makes "a fifth reason was added and nobody updated the consumer" a compile error rather than a silently unhandled value, which is the whole failure this change is about |
| Vitest, the test runner | 5.0.2 | Runs `src/df-cutoff.test.ts`, which builds a 501-segment corpus in memory and asserts the label flip, and the regression test added to `src/tuning/revocation.test.ts` | Already the runner for all 43 test files here. The relevant property is that it runs the real `resolve()` against an in-memory corpus with no fixture on disk, so the 501-segment corpus the defect needs costs nothing to version |
| tsx, the TypeScript execute-and-run loader | 4.23.15 | Runs `src/bin/ursa.ts` and the §5 probe directly from source with no build step | Already how every command in this repository's `package.json` scripts is invoked. A compile-then-run step would mean the payloads in §4 came from a build artefact rather than from the source this document cites |
| `diff`, the text-differencing library | 8.0.4 | Produces the `diff` array in the under-the-cutoff payload of §4, by `diffWords` | Unchanged by this work and named because §4's second payload contains its output and a reader should know which library's shape that is |
| `git merge-tree`, the plumbing command that performs a merge without touching the working tree | bundled with git 2.x | Checked, before this branch was written, that the two earlier open pull requests of this seat merge into it rather than being rewritten | The forge's cached `mergeable` field was not used, because a cached conflicting verdict survives after the mainline moves and the conflict goes away. That instrument was named by Ursa's ExO seat on the board |

---

## 7. The decision this change does not take

**The question.** Should `MAX_TOKEN_DF` stay an absolute count, or
become a fraction of `corpusSegments`?

**Why it is not this seat's to settle.** The cutoff is not an accident.
It exists so that the fuzzy pass does not score every final segment
against every generation segment, which is a quadratic amount of edit
distance. Raising it or making it grow with the corpus buys recall and
spends wall-clock time and memory in a product whose cost structure
depends on running on the user's own device. That is a tradeoff with a
dollar figure and a latency figure on one side and a data-quality figure
on the other, and `CLAUDE.md` §5 puts the data-quality side of it at the
centre of what Ursa Minor sells.

**The three options, with what each costs.**

1. **Leave it at 500 and report the blindness.** What this branch does.
   Cost: zero, and the record now says when it happened. Consequence: the
   blind fraction keeps growing with the corpus, and every consumer has
   to filter on `noCandidate` to avoid counting it. This is the correct
   state only for as long as the figure in `stats.blindSpans` stays at
   zero on real records.
2. **Make the cutoff relative**, for example
   `Math.max(500, Math.ceil(0.01 * corpusSegments))`. Cost: holds the
   blind fraction roughly constant as the corpus grows, at the price of
   scoring more candidates per span as the corpus grows, which is the
   cost the constant exists to bound. Needs a measurement of
   `resolve()` wall-clock against corpus size before it is chosen, which
   nobody has taken.
3. **Keep the cutoff and add a fallback pass** that runs only on spans
   that seeded zero candidates, taking the rarest of their suppressed
   tokens and scoring against a bounded sample of its bucket. Cost: the
   extra work is paid only on the spans that are currently invisible, so
   it is proportional to the defect rather than to the corpus.
   Consequence: a second code path with its own thresholds, which is the
   most machinery of the three for a population that is currently zero.

**What would decide it, and it is a number nobody has yet.** The
`stats.blindSpans` figure on real records, at Ursa's real corpus sizes,
measured over time rather than once. Option 1 is right while that number
is zero. The point at which it stops being right is observable now and
was not before this change, which is the whole reason the field was
built before the retuning.

---

## 8. Terms

Every term this document uses that is not self-explanatory to a reader
outside the project, defined once.

- **Generation segment.** One sentence (prose) or one trimmed line
  (code) of text a model produced, as cut by `segment()` in
  `ursa-major/src/segment.ts`. The unit document frequency is counted
  over.
- **Final span.** One sentence or trimmed line of the finished human
  work, the thing being classified. A `FinalSpan` in
  `ursa-major/src/types.ts`.
- **Document frequency.** For one token, the number of distinct
  generation segments containing it. Equal to the length of that token's
  value array in `tokenIndex`.
- **Candidate.** A generation segment the fuzzy pass will actually
  compute a similarity score against, having reached it through at least
  one of the final span's tokens.
- **Seeding.** Assembling the candidate set by looking up a final span's
  tokens in `tokenIndex`. A span "seeds zero candidates" when every
  lookup either misses or is refused by the cutoff.
- **Pass 1 and pass 2.** The resolver's two classification passes, both
  in `ursa-major/src/resolve.ts`. Pass 1 is exact containment of the
  span's normalized text inside a generation's normalized text, which
  the cutoff has nothing to do with. Pass 2 is the fuzzy pass described
  here.
- **`THETA_HIGH` (0.6) and `THETA_LOW` (0.35).** The two thresholds in
  `ursa-major/src/match.ts` applied to the combined score. At or above
  `THETA_HIGH` the span is `survived_mutated`. Between the two it is
  `no_generation_provenance` flagged `uncertain` with the candidate kept.
  Below `THETA_LOW` it is a bare `no_generation_provenance`.
- **Combined score.** `0.5 * containment + 0.5 * levSimilarity`, from
  `combinedScore` in `ursa-major/src/match.ts`. Containment is the
  fraction of the final span's tokens present in the candidate's token
  set; `levSimilarity` is `1 - levenshtein/maxLen` on the two normalized
  strings.
- **Blind span.** This document's name for a final span labelled
  `no_generation_provenance` carrying
  `noCandidate: 'df_cutoff_suppressed'`. Counted by `stats.blindSpans`.
- **The six-stage revocation contract, C0 to C5.** Not used in this
  document. It belongs to the other item in this run and is defined in
  §10.6 of `docs/design/consent-and-erasure.md`.

# `survived_verbatim` meant "identical after folding", and three documents said it meant byte-identical

Engineer run 2026-10-13. Sprint item 1 of
`docs/sprints/sprint-2026-10-12.md`. Continues the ledger entry
"`survived_verbatim` is not verbatim, and a record sold today proves it"
(`docs/ideas.md`, 2026-10-12, status `urgent`).

Written to the engineering-artifact standard in
`prompts/engineer-agent.md`: a system diagram whose nodes are real, real
TypeScript signatures at every boundary, on-disk layouts with a real
payload, the exact commands, a versioned tooling list, and no bare
terms.

## 1. The defect, measured

The resolver matches on **normalized text**, which is the shadow text
`normalize()` in `ursa-major/src/normalize.ts` produces: lowercased,
smart punctuation folded (`’`→`'`, `—`→`-`, `…`→`...`, non-breaking
space→space), and every run of whitespace collapsed to a single space,
with a character-level map back to the original offsets. Pass 1 of
`resolve()` found the span's normalized text inside a generation's
normalized text and, on that hit alone, wrote
`class: 'survived_verbatim', score: 1`.

So the field meant **identical after case folding, punctuation folding
and whitespace collapsing**. Three documents said otherwise:

| Where | What it said | What the code did |
|---|---|---|
| `README.md` class table, line 52 | "generated and kept unchanged" | accepted a case change |
| `CLAUDE.md` §1, span classifications | "`survived_verbatim` — generated and kept unchanged" | accepted an em dash retyped as a hyphen |
| `CLAIM_NOT_WIDER` in `ursa-major/src/invariants.ts` | "Verbatim means byte-identical, so the two extents describe the same characters" | compared only the two extents' lengths |

**How it surfaced.** The 2026-10-12 probe run of the resolver over this
repository's own history exited non-zero on `CLAIM_NOT_WIDER`, on record
`ursa-2026-10-07-2f610e9`, file `docs/sprints/pending.md`, span 78 at
`[3895,3996)`: 101 final characters credited to a 99-character
generation extent. A person had reflowed one line. The bound caught two
characters of a problem whose shape is much larger, and it caught them
only because a reflow happens to change the length; a case change and an
em-dash swap leave the length alone, so nothing in the repository could
see them.

**The six cases.** One generation, six final texts differing from it in
one way each, resolved by calling `resolve()` directly. `before` is the
pre-2026-10-13 rule, restated in one expression in
`ursa-major/tools/measure-verbatim-fidelity.ts` because one expression is
all the rule was; `after` is the shipped resolver.

| case | before | after | every verbatim claim byte-exact |
|---|---|---|---|
| identical | `survived_verbatim` | `survived_verbatim` | yes |
| case changed | `survived_verbatim` | `survived_mutated` + `normalizedOnly` | yes |
| em dash retyped as hyphen | `survived_verbatim` | `survived_mutated` + `normalizedOnly` | yes |
| space doubled | `survived_verbatim` | `survived_mutated` + `normalizedOnly` | yes |
| line rewrapped | `survived_verbatim`, merged: 138 final characters on a 136-character extent | `survived_verbatim` + `survived_verbatim`, two exact halves | yes |
| smart quotes introduced | `survived_mutated` | `survived_mutated` | yes |

Four of the six were wrong. The sixth was right by accident: the fold
runs curly-to-straight, so a final text that *introduces* curly quotes
lands on characters the generation does not hold at that offset. That is
a property of which direction the fold runs, not a rule.

**On real history.** Ten outcome records built by walking this
repository's own commit graph, which is what `ursa run` does:

| figure | value |
|---|---|
| records resolved (above the 200-character floor `ursa run` applies) | 10 |
| `survived_verbatim` spans after the fix | 744 |
| characters in them | 60,262 |
| spans the old rule sold as verbatim that are not byte-identical | 26 |
| characters in those | 1,466 |
| share of verbatim claims that were not exact | 0.034 |

So 3.4% of this organization's own verbatim claims were claims about
characters the model did not write. The buyer-facing consequence is not
the character count. It is that the person's edit — the correction,
which is the whole of what Ursa Minor sells per `CLAUDE.md` §1 — was
discarded as noise in every one of those 26 spans.

## 2. The decision, and the measurement that rejected the first attempt

The ledger entry named two options:

1. Rename the label to what it measures, and add a new byte-identical
   class.
2. Compare the raw extents after the normalized match; a difference
   demotes the span to `survived_mutated` with a diff.

Option 2 was taken, because `survived_verbatim` then means what
`README.md`, `CLAUDE.md` and `CLAIM_NOT_WIDER` already say it means, and
no consumer of `SpanClass` has to learn a fourth value.

**The first implementation of option 2 was wrong, and measuring it is
what showed that.** It made the normalized hit locate a candidate extent
only, and let a hit whose raw characters differed fall through to pass 2,
the fuzzy pass. Pass 2 scores against generation **segments** — single
sentences or lines — while pass 1 matches the whole generation's
normalized text. The commonest case in real history is a line the model
wrapped and the person did not, whose final segment straddles two
generation segments and therefore matches neither well enough to clear
`THETA_HIGH` (0.6). Measured:

```
docs/sprints/pending.md [982,1051)
  final : "besides a PM standup, a lessons sync, or board wiring is still PR #9,"
  gen   : "besides a PM standup, a lessons\nsync, or board wiring is still PR #9,"
  best fuzzy score over generation segments: 0.358   (THETA_HIGH 0.6, THETA_LOW 0.35)
```

That pushed all 26 spans and all 1,466 characters into
`no_generation_provenance`, the class `CLAUDE.md` §1 calls **the most
valuable category**, meaning "the model was never in the running" —
asserted about text the model demonstrably wrote. A false verbatim claim
traded for a false claim of no provenance at all is not a fix, and it
would have corrupted the one class that has to stay clean.

The shipped implementation therefore **demotes rather than drops**: the
extent pass 1 located is kept, the label becomes `survived_mutated`, a
character-level diff carries the change, and a new span field
`normalizedOnly` says the difference is folding alone. After the
demotion, over the same ten records:

| shape of the 26 spans | count |
|---|---|
| `survived_mutated`, `normalizedOnly`, descent `unverified` | 4 |
| `survived_mutated`, `normalizedOnly`, descent `corroborated` | 1 |
| `no_generation_provenance`, `uncertain`, descent `rival` relation `pre_existing` | 21 |

The 21 are not a regression of the same kind. They are spans whose text a
commit outside the generation's line of descent already held, so
`gitDescentCorroborator` in `ursa-major/src/corroborate.ts` answers
`rival` and the record says so in the span, naming the commit. Pass 1
never asked that question before, which is its own finding and is in the
ledger as of today.

**Why `normalizedOnly` is a field and not a class.** Three readings of
such a span are all defensible, and the record should not choose between
them. A buyer studying content corrections filters these out as
formatting noise. A buyer studying house style — which is exactly what
Ursa Major sells the user as "your tone, your format preferences" —
wants these and nothing else. A buyer counting surviving model output
wants them nearer to `survived_verbatim`. A field lets all three filter;
a fourth class would make the choice for them and break every existing
reader of `SpanClass`.

## 3. System diagram, node by node

Every node is a file that exists in this repository. Every edge carries
a named type or a named string.

```
  ursa-major/src/segment.ts : segment(text, mode)
        │  Span[] = { start, end, text }, one per sentence (prose) or line (code)
        ▼
  ursa-major/src/normalize.ts : normalize(text)
        │  Normalized = { norm: string, map: number[] }
        │  map[i] = index in the ORIGINAL text of the character norm[i] came from
        ▼
  ursa-major/src/resolve.ts : resolve(input) — pass 1
        │
        ├─ normalized hit AND p.gen.text.slice(gStart, gEnd) === span.text
        │        │  FinalSpan { class: 'survived_verbatim', score: 1, source }
        │        │  Claim { genIndex, start, end } → verbatimClaims
        │        ▼
        ├─ normalized hit AND raw characters differ
        │        │  calls input.corroborate(filePath, spanText)
        │        │       ← DescentEvidence from ursa-major/src/corroborate.ts
        │        ├─ basis 'rival'      → FinalSpan { class: 'no_generation_provenance',
        │        │                        uncertain: true, candidate, descent }
        │        └─ otherwise          → FinalSpan { class: 'survived_mutated', score: 1,
        │                                 normalizedOnly: true, source, diff: DiffPart[] }
        │                               Claim → mutatedClaims
        └─ no normalized hit
                 │  falls through to pass 2, the fuzzy pass, unchanged
                 ▼
  ursa-major/src/resolve.ts : mergeVerbatimRuns(spans, text, genTexts)
        │  merges two adjacent verbatim spans only when
        │  text.slice(prev.end, s.start) === genTexts[gi].slice(prev.source.end, s.source.start)
        │  FinalSpan[], maximal runs
        ▼
  ursa-major/src/stats.ts : computeStats(files, generations, conversations, exclusions)
        │  RecordStats { byClass, generationCharsClaimed, uncertainSpans, … }
        ▼
  ursa-major/src/invariants.ts : checkRecord(record)
        │  Violation[] — CLAIM_NOT_WIDER now compares characters, not lengths
        ▼
  ursa-major/src/viewer.ts : renderViewer(record)
           outcome_record.html — inspector heading "· formatting only"
```

Two nodes read the new field and nothing else does:
`ursa-major/src/viewer.ts` (the user's transparency surface) and
`ursa-major/src/invariants.ts` (indirectly, by no longer seeing these
spans labelled verbatim).

## 4. Interfaces, as the signatures a caller writes against

The public shape of `resolve()` is unchanged. One optional field is added
to `FinalSpan` in `ursa-major/src/types.ts`:

```ts
export interface FinalSpan {
  start: number
  end: number
  text: string
  class: SpanClass
  /** 1 for verbatim, and also 1 for a normalizedOnly mutation, whose two texts are identical on the normalized side by construction */
  score?: number
  source?: SourcePointer
  /** word-level diff generation → final, except on a normalizedOnly span, where it is character-level */
  diff?: DiffPart[]
  uncertain?: boolean
  candidate?: { score: number; text: string; source: SourcePointer }
  trivial?: boolean
  descent?: DescentEvidence
  /** identical to the generation extent after case, punctuation and whitespace folding; differs in raw characters only */
  normalizedOnly?: true
}
```

The two internal boundaries this change created, both inside
`ursa-major/src/resolve.ts`:

```ts
/** the pass-1 demotion: what to do with a normalized hit whose raw characters differ */
const normalizedOnlyMutation: (
  base: { start: number; end: number; text: string },
  p: GenPrep,
  gStart: number,
  gEnd: number,
  filePath: string,
  trivial?: true,
) => FinalSpan

/** merge adjacent verbatim runs; genTexts is indexed by generationIndex */
function mergeVerbatimRuns(
  spans: FinalSpan[],
  text: string,
  genTexts: string[],
): FinalSpan[]
```

And the two diff builders, which differ only in granularity and in which
label may use them:

```ts
/** word-level, for an edit that changed words */
const wordDiff: (from: string, to: string) => DiffPart[]
/** character-level, for a normalizedOnly span only */
const charDiff: (from: string, to: string) => DiffPart[]
```

The measurement tool's two entry points, which take a path and write
nothing:

```ts
function runCases(): void
function runRepo(project: string, limit: number): void
```

## 5. On-disk layout, with a real payload

Nothing moves on disk. A record is still
`<project>/.ursa/records/<record-id>/` holding `outcome_record.json` and
`outcome_record.html`, and the fixtures are still at
`ursa-major/fixtures/mini/record/` and
`ursa-major/fixtures/violations/*.{json,md}`.

What is new is one key inside `files[].spans[]`. This is the real
`files[0].spans` of the "space doubled" case, produced by the command in
§6.2 and copied unedited:

```json
[
  {
    "start": 0,
    "end": 137,
    "text": "The resolver joins finished work backward to the generations that fed it, and  the label is supplied by the artifact — never by a grader.",
    "class": "survived_mutated",
    "score": 1,
    "normalizedOnly": true,
    "source": {
      "conversationId": "c1",
      "model": "probe-model",
      "turnIndex": 0,
      "generationIndex": 0,
      "start": 0,
      "end": 136
    },
    "diff": [
      { "value": "The resolver joins finished work backward to the generations that fed it, and " },
      { "value": " ", "added": true },
      { "value": "the label is supplied by the artifact — never by a grader." }
    ]
  }
]
```

The `conversationId` is `c1` because this payload comes from the probe,
whose conversation is synthetic. On a real record it is a truncated
session identifier; a full private session identifier never enters this
repository, per the redaction rider in `prompts/engineer-agent.md`.

**The diff is why the differ changed.** `diffWords` tokenizes on
whitespace and treats any run of it as equivalent, so on this exact
payload it returned a single unchanged part and asserted that nothing was
mutated. A span whose entire content is the mutation, carrying a diff
that says there was no mutation, would be worse than the label it
replaced. `diffChars` is used for `normalizedOnly` spans alone, where the
two strings are the same string modulo folding and the cost is bounded.

The two violation-fixture notes that changed are at
`ursa-major/fixtures/violations/final-spans-in-file.md` and
`ursa-major/fixtures/violations/gen-claim-bounded.md`. Both gained
`CLAIM_NOT_WIDER` as a second firing bound, because both of their edits
leave a verbatim span crediting characters its generation does not hold,
and the bound now notices. Each note is generated by
`ursa-major/tools/make-violation-fixtures.ts` and quotes the `observed`
string the gate itself produced.

## 6. Exact commands, and what they printed

All run from `ursa-major/`.

### 6.1 The suite

```bash
npm test     # tsc --noEmit && vitest run
# Test Files  32 passed | 1 skipped (33)
#      Tests  590 passed | 4 skipped (594)
```

### 6.2 The six cases

```bash
npx tsx tools/measure-verbatim-fidelity.ts cases
```

prints the table in §1 and the line `gate over the six records: no
violations`.

### 6.3 The real-history counterfactual

```bash
npx tsx tools/measure-verbatim-fidelity.ts repo /path/to/Ursa --limit 40
# {
#   "records": 10,
#   "gateViolations": 0,
#   "verbatimSpansNow": 744,
#   "verbatimCharsNow": 60262,
#   "spansTheOldRuleMislabelled": 26,
#   "charsTheOldRuleMislabelled": 1466,
#   "shareOfVerbatimClaimsThatWereNotExact": 0.034
# }
```

### 6.4 Proving the new tests are sharp, by reverting the implementation

```bash
git show origin/main:ursa-major/src/resolve.ts > src/resolve.ts
npx vitest run src/resolver.test.ts
# × labels a case change a normalized-only mutation, not verbatim
# × labels an em dash retyped as a hyphen a normalized-only mutation, not verbatim
# × labels a doubled space a normalized-only mutation, not verbatim
# × shows the change at character granularity, because a word diff cannot see whitespace
# × asks the corroborator on a demoted span, and honours a rival verdict
# × does not credit a reflowed line with the whitespace the person inserted
# × every verbatim claim in every case is the same characters on both sides
#   Tests  7 failed | 14 passed (21)
git checkout src/resolve.ts
```

Seven assertions fail against the resolver on `main` and pass against
this branch's. That is the specification, not a bug in the test. The
ledger entry asked for four of them; the other three are the demotion
path, the character-level diff and the corroborator ask, none of which
existed when the entry was written.

### 6.5 The fixtures and the bundle

```bash
npx tsx tools/make-violation-fixtures.ts          # rewrite, after changing the contract
npx tsx tools/make-violation-fixtures.ts --check  # 31 files match what this script would write.
npm run bundle && npm run bundle:check
# dist/ursa.cjs is current (sha256 14b54a1bbd17b9f4efc3f8e717f2a41cf098a38373f10feae5c27fac2d74ec18, 179,913 bytes)
```

## 7. Tooling

| Tool | Version | Its job here | Why it, over the alternative considered |
|---|---|---|---|
| Node.js | v22.23.3 | runs the resolver, the tests and the measurement tool | the runtime `ursa run` already requires; nothing here needs a second one |
| TypeScript | 5.9.3 | `tsc --noEmit` is the first half of `npm test`, and it is what caught the probe's wrong `ConversationMeta` shape before any assertion ran | the record's field set is the product, so the compiler checking it is load-bearing rather than hygiene |
| vitest | 5.0.2 | runs the six-case specification and the jsdom viewer test | already the project's runner; switching runners for one file would split the one command the CI gate runs |
| jsdom | 30.1.1 | executes the viewer's script so the "formatting only" line is asserted as rendered output, not grepped out of an HTML string | greping the bundle proves the string is present, not that a user clicking a span ever sees it |
| `diff` | 8.0.4 | `diffWords` for an edit that changed words, `diffChars` for a formatting-only span | already a dependency; `diffChars` is in the same package, so the granularity fix added no dependency and no cost |
| esbuild | 0.28.0 | rebuilds `dist/ursa.cjs`, whose digest is one of the two bases `task.resolvedBy` can name | the bundle digest is a provenance field, so the bundler has to be deterministic and pinned |
| git | system | the measurement tool's real-history pass walks the commit graph through `ursa-major/src/pairfinder.ts` | the repo path is the product's own input; a synthetic graph would not have produced the reflow case that started this |

## 8. Terms used above

- **Normalized text, or shadow text.** The output of `normalize()`:
  lowercased, smart punctuation folded, whitespace runs collapsed to one
  space, carrying `map`, a per-character index back into the original
  text. Matching runs on it; every offset a record stores points into the
  original.
- **Span.** A contiguous `[start, end)` range of a final file, carrying
  the text at that range and one class. Produced by `segment()`:
  sentences in prose, lines in code.
- **Generation extent.** The `[start, end)` range of one model
  generation's text that a span's `source` pointer names.
- **Byte-identical.** `final.text === generation.text.slice(source.start,
  source.end)`, compared as JavaScript strings, no folding of any kind.
- **Pass 1 and pass 2.** Pass 1 is containment of the span's normalized
  text anywhere in a generation's normalized text. Pass 2 is the fuzzy
  pass: best scoring generation **segment** by `combinedScore`, which is
  the mean of token containment and normalized Levenshtein similarity,
  thresholded at `THETA_HIGH` 0.6 and `THETA_LOW` 0.35.
- **`normalizedOnly`.** The new optional field on `FinalSpan`. True when
  the span's text and the generation extent it names are the same text
  after folding and differ in raw characters.
- **Descent evidence, and a `rival` verdict.** `DescentEvidence` is what
  `input.corroborate` returns: whether the span's text also exists outside
  the generation's line of descent. `rival` means a commit that is not a
  descendant of the generation holds the text, so an edit of this
  generation is not the only account of it.
- **`CLAIM_NOT_WIDER`.** One of the fifteen bounds in
  `ursa-major/src/invariants.ts`. As of 2026-10-13 it states and checks
  that a `survived_verbatim` span's characters are the characters of the
  generation extent it claims.

## 9. What this does not do

- **It does not make the label depend on segmentation less than it did.**
  A doubled space inside one line becomes one `survived_mutated` span with
  a `normalizedOnly` flag. The same reflow across a line break becomes two
  exact `survived_verbatim` spans, because prose segments line by line and
  both halves really are byte-identical. Both records are true; they
  differ in granularity, and the coarser one is coarser because a
  sentence is the smallest thing that carries a class. Finer segmentation
  is a separate change and is in the ledger as of today.
- **It does not corroborate a verbatim claim.** Pass 1 still never asks
  `input.corroborate`, except on the demotion path this change added.
  Measured today over the same ten records, 498 of 744 `survived_verbatim`
  spans, covering 39,225 of 60,262 characters, would come back `rival` if
  it did. That number is a question about what the verbatim label should
  require, not a settled defect, and it is in the ledger as `urgent`.
- **It does not count `normalizedOnly` anywhere in `stats`.** The field
  is on the span, so a buyer can filter, but `byClass.survived_mutated`
  does not split into formatting and content. Splitting it changes a
  figure Ursa Minor sells and belongs with the owner, not in this PR.
- **It does not change `normalize()`.** The fold still runs
  curly-to-straight and still collapses whitespace, because matching needs
  it; what changed is that a hit in the folded text no longer settles the
  label.

# Signal grounding: the quote a lab buys, re-read from the text it came from

Engineer run, 2026-10-06. Ledger entry this closes the first step of:
"The gate checks seven of a record's nine top-level keys" (docs/ideas.md,
2026-10-05), whose named first step was "the excerpt-grounding check
alone, as an eleventh bound, run over both fixtures and over a clone of
this repository."

Held to the engineering-artifact standard in `prompts/engineer-agent.md`:
system diagram with real nodes, interfaces as real TypeScript signatures,
on-disk layout with a real payload, exact commands, a versioned tooling
list, and no bare terms. §11 is the glossary for any term a reader
outside Ursa would not already hold.

---

## 1. What was unchecked, stated precisely

`ursa-major/src/invariants.ts` shipped on 2026-10-05 with ten bounds. A
record has nine top-level keys. The ten bounds read three of them:

| Record key | What it holds | Read by a bound before today |
|---|---|---|
| `schemaVersion` | the string `0.1.0`, the record format's version | no |
| `task` | the record's own identifier, its finished flag, and when it was generated | no, except as the prefix on a violation's `where` field |
| `artifact` | what kind of finished thing this is: `chat`, `repo`, `hosted` or `visual` | no |
| `files` | the finished work, each file's text split into classified spans | yes — `FINAL_SPANS_IN_FILE`, `CLAIM_NOT_WIDER`, `CLAIM_IN_GENERATION` |
| `conversations` | each conversation's metadata and, locally, the user's own prompts | no |
| `generations` | every model generation, its text, and its segments | yes — four bounds |
| `stats` | the aggregate character counts and the rates derived from them | yes — three bounds |
| `durability` | how long each span survived after the episode's closing commit | no |
| `signals` | the trajectory labels Ursa Minor sells: correction loops, regressions, one-shot corrections | **no** |

Every one of the ten bounds compares a number against another number.
None of them reads a string. That division is the whole point of this
change: the ten bounds catch arithmetic defects, and `signals` is the
only block in the record whose defects are not arithmetic. A correction
loop quotes the user. If that quote is wrong, no sum anywhere in the
record moves.

### 1.1 The four places a signal quotes somebody

| Producer | Field | Who is quoted | Raw text it should be an excerpt of |
|---|---|---|---|
| `src/loops.ts` `specFrom` | `CorrectionLoop.discoveredSpec` | the user, at the loop's last statement of what she wanted | `conversations[].prompts[].text` at that step |
| `src/loops.ts` (regression branch) | `RegressionEvent.evidence` | the user, reporting that something that worked broke | `conversations[].prompts[].text` at that step |
| `src/loops.ts` (single-member cluster) | `OneShotCorrection.text` | the user, raising something that closed in one pass | `conversations[].prompts[].text` at that step |
| `src/signals.ts` `mutationCorrections` | `OneShotCorrection.text` | the agent and the user both: `AGENT: <generated text>` over `FINAL: <what she left>` | `generations[i].text` for the agent side, `files[j].text` for the final side |

The fourth row is the one that runs in production. A chat trace reaches
the first three, and a chat trace requires a pasted conversation or a
Claude Code session log. `ursa run <project>` over a git repository has
no trace, so `mutationCorrections` is the only one of the four that
fires on the launch path Ursa actually ships.

### 1.2 Why a misquote is a different kind of defect

`CLAUDE.md` §5 names the consenting user base as the asset that
"compounds daily and can be destroyed in a week," and §2 sells labs
"consented, cross-model, revealed-preference data" whose auditability is
the reason they can trust it. Both of those are claims about quotes. A
lab auditing a correction loop does it by reading the quote against
their own copy of the conversation, and a user exercising the
transparency promise does it by reading the quote against what she
remembers typing. A survival rate that is 2% off survives either
reading. A quote that attributes words to the user that she did not type
fails both at once, and it fails them in a way that cannot be explained
as a rounding convention.

So the order the ledger entry proposed is the right order, and this
artifact adopts its reason verbatim: the excerpt check is "the one whose
failure would be a trust incident rather than a wrong number."

---

## 2. System diagram

Nodes are files and stores that exist in the repository at this commit.
Edges carry the named type or file format, not a verb.

```
                         ursa-major/src/parse.ts
                         (parsePasteConversation,
                          parseClaudeCodeSession)
                                  │
                   { conversation: ConversationMeta,
                     generations: RawGeneration[] }
                                  │
                                  ▼
                       ursa-major/src/resolve.ts
                             (resolve)
                                  │
                         OutcomeRecord
                     (files[], generations[], stats)
                                  │
            ┌─────────────────────┴─────────────────────┐
            │                                           │
   hasChatTrace(record) === true            hasChatTrace(record) === false
            │                                           │
            ▼                                           ▼
  ursa-major/src/loops.ts                   ursa-major/src/signals.ts
    (detectTraceSignals)                      (mutationCorrections)
            │                                           │
  CorrectionLoop[] + RegressionEvent[]        OneShotCorrection[]
  + OneShotCorrection[], each with            with quotes:
  quotes: QuoteRef[] of=user_prompt           [QuoteRef of=generation,
            │                                  QuoteRef of=final_span]
            └─────────────────────┬─────────────────────┘
                                  │
                            LabSignals
                                  │
                                  ▼
                       ursa-major/src/signals.ts
                            (deriveSignals)
                                  │
                   OutcomeRecord with signals: LabSignals
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
            ▼                     ▼                     ▼
 ursa-major/src/store.ts  ursa-major/src/      ursa-major/src/
     (saveRecord)          invariants.ts        disclosure.ts
            │              (checkRecord)       (rawStringsOf)
            │                     │                     │
   <project>/.ursa/        Violation[] with      string[] of every
   records/<id>.json         code =              raw string in the
   (JSON, UTF-8)         SIGNAL_QUOTE_GROUNDED   record, now including
            │                     │              oneShotCorrections[].text
            │                     │                     │
            ▼                     ▼                     ▼
 ursa-major/src/          ursa-major/src/bin/   ursa-major/src/
 invariants.cli.ts          ursa.ts (main)        consent.ts
   (runGate)             process exit code       (the consent gate's
            │              0 or 1                 audit of what may
   stdout lines +                                 cross the boundary)
   process exit 0|1
```

### 2.1 The one new edge, named exactly

`src/invariants.ts` previously imported `mergedLength` from
`src/intervals.ts` and types from `src/types.ts`, and nothing else. It
now also imports `isExcerptOf` from `src/text.ts`.

That edge carries a predicate, not data, and it is the edge that makes
the bound trustworthy rather than circular. `src/text.ts` `excerpt()` is
the function every one of the four quoting sites calls on its way out.
If the gate re-implemented the normalization that `excerpt()` applies,
the two copies would drift and the bound would eventually assert
something `excerpt()` no longer does. Sharing the module means
`MAX_EXCERPT` has exactly one definition, which is the same reason
`src/text.ts` was created in the first place (its own header: "Kept in
its own module so signals.ts and loops.ts share one definition of
'quoted, truncated' instead of two that can drift apart").

---

## 3. Interfaces

Real signatures, as a caller would write them.

### 3.1 `ursa-major/src/types.ts` — one new interface, three fields added

```ts
export interface QuoteRef {
  of: 'user_prompt' | 'generation' | 'final_span'
  /** required for `user_prompt` and `generation`; absent for `final_span` */
  conversationId?: string
  /** `prompts[].step` or `generations[].turnIndex`; absent for `final_span` */
  step?: number
  /** exact address of the generation quoted; set only when `of` is `generation` */
  generationIndex?: number
  /** `files[].path`; set only when `of` is `final_span` */
  filePath?: string
  text: string
}

export interface CorrectionLoop {
  // ... eleven fields unchanged ...
  discoveredSpec: string
  quotes: QuoteRef[]      // added
}

export interface RegressionEvent {
  // ... four fields unchanged ...
  causedBySteps?: number[]
  quotes: QuoteRef[]      // added
}

export interface OneShotCorrection {
  step: number
  text: string
  domain: string
  quotes: QuoteRef[]      // added
}
```

`quotes` is required rather than optional, and that choice did work.
Making it required turned `tsc --noEmit` into the enumeration of every
place in the repository that constructs one of these three signals: four
sites, all of them synthetic fixtures (`src/hq/fixtures.ts` ×3,
`src/bridge/declare.test.ts` ×1). An optional field would have compiled
on the first try and left those four silently unquoted.

### 3.2 `ursa-major/src/text.ts` — two functions added

```ts
export function normalizeForExcerpt(text: string): string
export function isExcerptOf(quoted: string, source: string): boolean
```

`isExcerptOf` returns true when `quoted` really is an excerpt of
`source`. Three cases, in the order the function tests them:

1. `quoted` is empty: false. `''.includes('')` is true for every source
   in JavaScript, so treating emptiness as grounded would make the bound
   pass exactly where a signal quotes nobody.
2. `quoted.length > MAX_EXCERPT` and `quoted` ends in `…`: the quote is
   a truncation, because `excerpt()` appends the ellipsis only when the
   normalized text exceeds `MAX_EXCERPT`, and a quote that was not
   truncated is at most `MAX_EXCERPT` characters. What must hold is that
   `normalizeForExcerpt(source)` **starts with** `quoted` minus its
   ellipsis. Testing `includes` on the whole quote here would pass for
   any source containing a literal `…`, which is a check that cannot
   fail.
3. Otherwise: `normalizeForExcerpt(source).includes(quoted)`.

### 3.3 `ursa-major/src/invariants.ts` — one code, two helpers, three measurements

```ts
export type InvariantCode =
  // ... ten unchanged ...
  | 'SIGNAL_QUOTE_GROUNDED'

/** every quoting signal flattened to prose + its quote references */
function* quotingSignals(
  signals: LabSignals,
): Generator<{ where: string; prose: string; quotes: QuoteRef[] }>

/** the raw text a QuoteRef names, or an Error saying why this record lacks it */
function rawTextFor(record: OutcomeRecord, q: QuoteRef): string | Error

export interface Measurement {
  // ... nine unchanged ...
  signalEntries: number
  signalQuotes: number
  signalEntriesWithoutQuote: number
}
```

`rawTextFor` returns `string | Error` rather than `string | null`
because the reason a quote is unresolvable is the only useful part of
the violation. A `null` would produce "unresolvable", and the eight
distinct `Error` messages produce "no prompt at step 9999 (steps
present: 1, 2, 3, 5)", which names both what was claimed and what the
record actually holds.

`quotingSignals` is a generator over the three arrays rather than three
near-identical loops in `checkRecord`, because the three differ only in
which field carries the prose, and `DefensiveGuardrail` and
`FeedbackTranslation` both quote too — they are empty by design today
(`src/loops.ts` header: naming the mechanism behind a complaint "is a
language judgment the detector does not make"), and when the distiller
fills them, extending this generator is the whole change.

### 3.4 The bound, as three clauses

For each `QuoteRef` on each quoting signal:

```ts
const raw = rawTextFor(record, q)                 // (a) resolvable
if (raw instanceof Error) { /* violation */ }
if (!isExcerptOf(q.text, raw)) { /* violation */ } // (b) grounded
if (!sig.prose.includes(q.text)) { /* violation */ }// (c) carried
```

Clause (c) is the one that is easy to leave out and the one that makes
the other two worth having. Without it, `quotes` is a decorative array
that can say one thing while `discoveredSpec` — the field a lab
actually reads — says another, and the gate would check the decoration.

### 3.5 What is deliberately a measurement, not a bound

`src/invariants.ts`'s own second rule: "Anything that can be
legitimately false is a measurement, not an invariant."

"Every signal carries at least one quote" is such a thing.
`src/hq/fixtures.ts` holds three correction loops whose `discoveredSpec`
is a distilled statement in the detector's words — "entrance motion may
reposition an element by at most 8px" — and those fixtures carry no
conversations at all, so there is no raw text a `QuoteRef` could point
at. Those loops quote nobody and are not defective. The honest value is
`quotes: []`, and the honest treatment is `signalEntriesWithoutQuote`,
a number the gate prints and never fails on.

This leaves one real gap, named here rather than hidden: a record
written by `loops.ts` or `signals.ts` always quotes verbatim, so a
non-zero `signalEntriesWithoutQuote` on a record from `ursa run` **is**
a defect, and today nothing distinguishes that record from an HQ
briefing fixture. Closing it needs a discriminator on the loop itself
(`quoted` versus `distilled`), which changes a field Ursa Minor sells
and is therefore §10's first ledger entry rather than this diff.

---

## 4. On-disk layout, with a real payload

### 4.1 Paths

| Path | Format | Written by | Read by |
|---|---|---|---|
| `<project>/.ursa/records/<recordId>.json` | JSON, UTF-8, two-space indent, trailing newline | `src/store.ts` `saveRecord` | `src/invariants.cli.ts`, `src/bridge/declare.ts`, `src/consent.ts` |
| `ursa-major/fixtures/loops/conversations/01-claude.md` | pasted-conversation Markdown | committed by hand | `src/parse.ts` `parsePasteConversation` |
| `ursa-major/fixtures/real/ursa-main-4d5e401.json` | same JSON as a record | the 2026-10-05 engineer run | `src/invariants.test.ts` |

`<project>` is the user's own repository and is never a path this
document names literally, per the redaction rider in
`prompts/engineer-agent.md`. The runnable placeholder form is
`~/Desktop/<your-project>`; the command listings in §5 use `/tmp/ursa-clone`,
which is a throwaway clone made during the run and carries no machine
or account identity.

### 4.2 Real payload: the label stage, from a clone of this repository

From `/tmp/ursa-clone/.ursa/records/ursa-clone-2026-09-27-7c739cf.json`,
produced by the command in §5.3. The episode is the vendoring of
`docs/standards/lessons.md`: an agent commit wrote the file with one
upstream commit SHA in its header, and the human's edit replaced that
SHA. Four such corrections, eight quotes. This is `oneShotCorrections[1]`
verbatim, with the `generations[0].text` offsets it addresses:

```json
{
  "step": 1,
  "text": "AGENT: > `alexandrapaiz/alexandra-systems` `standards/lessons.md` at commit `775ce36`,\nFINAL: > `alexandrapaiz/alexandra-systems` `standards/lessons.md` at commit `7e051c0`,",
  "domain": "docs/standards/lessons.md",
  "quotes": [
    {
      "of": "generation",
      "conversationId": "git-7c739cf",
      "step": 1,
      "generationIndex": 0,
      "text": "> `alexandrapaiz/alexandra-systems` `standards/lessons.md` at commit `775ce36`,"
    },
    {
      "of": "final_span",
      "filePath": "docs/standards/lessons.md",
      "text": "> `alexandrapaiz/alexandra-systems` `standards/lessons.md` at commit `7e051c0`,"
    }
  ]
}
```

Read it as the product claim it is: the model wrote `775ce36`, the
person changed it to `7e051c0`, and both halves of that sentence are now
addresses into the same record rather than strings in a sentence. The
first resolves to `generations[0].text` at the offsets
`files[0].spans[n].source` already stored; the second resolves to
`files[0].text`.

### 4.3 Real payload: the trace stage, from the public fixture

From `fixtures/loops`, resolved in memory by the test in §6.1 (this
record is not committed; the fixture it is built from is). The loop's
`quotes` array alongside the `discoveredSpec` that carries it:

```json
{
  "id": "01-claude:L1",
  "conversationId": "01-claude",
  "theme": "constellation dark brighten",
  "targetFiles": ["final.md"],
  "openedStep": 1,
  "promptSteps": [1, 2, 3],
  "recurrences": 2,
  "regressionSteps": [3],
  "closedStep": 4,
  "resolution": "accepted",
  "resolvingSteps": [4],
  "discoveredSpec": "quoted from step 2, the loop's last statement of what was wanted (regression reports excluded): \"The constellation is still too dark. Brighten it more, the stars vanish above the fold.\" — the loop's other statements stand unmerged at conversations[].prompts[].step 1, 3",
  "quotes": [
    {
      "of": "user_prompt",
      "conversationId": "01-claude",
      "step": 2,
      "text": "The constellation is still too dark. Brighten it more, the stars vanish above the fold."
    }
  ]
}
```

Step 3 is in `regressionSteps`, so `specFrom` excluded it and quoted
step 2 instead. That is the detector's own rule, stated in its
docstring: "it went dark again" says the state broke and never says what
the state should be. The quote reference therefore points at step 2 and
not at the loop's last prompt, and clause (a) of the bound checks that
step 2 is a prompt this conversation really has.

Clause (c) of the bound is visible here as a string containment: the
`text` field appears inside `discoveredSpec` between the escaped
quotation marks. That is the tie between the structured address and the
sentence a buyer reads.

### 4.4 Redaction

Nothing in this document is redacted and nothing needed to be. Every
identifier above is a commit SHA, a file path, or a conversation id from
this public repository, or a sentence from `fixtures/loops`, which is
synthetic and committed. The clone path `/tmp/ursa-clone` is a temporary
directory created and deleted inside the run. Checked with:

```sh
grep -rnE '/(Users|home)/[a-z]' docs/design/signal-grounding.md
# exits 1, no matches
```

---

## 5. Exact commands

### 5.1 The gate on the two committed fixtures

```sh
cd ursa-major
npx tsx src/invariants.cli.ts fixtures/mini/record/outcome_record.json
npx tsx src/invariants.cli.ts fixtures/real/ursa-main-4d5e401.json
```

Both exit 0. Both now print, as their second-to-last line:

```
  signals: no correction loops, regressions or one-shot corrections, so no quote was checked
```

That line is the point of §7.2 and is why it is printed even when the
count is zero.

### 5.2 The test suite

```sh
cd ursa-major
npm test            # tsc --noEmit && vitest run
npx vitest run src/text.test.ts src/invariants.test.ts
```

### 5.3 The gate on real history, end to end

```sh
rm -rf /tmp/ursa-clone
git clone -q https://github.com/alexandrapaiz/Ursa /tmp/ursa-clone
cd ursa-major
npx tsx src/bin/ursa.ts run /tmp/ursa-clone --limit 40
npx tsx src/invariants.cli.ts /tmp/ursa-clone/.ursa/records
echo "exit=$?"
```

`ursa run` already calls `checkRecord` on every record before it exits
(`src/bin/ursa.ts`, added 2026-10-05, not behind a flag), so the fourth
line is the gate running as part of the launch and the fifth is the same
gate standalone over what was written. Both exit 0 at this commit.

### 5.4 Reproducing the defect §7.1 describes

```sh
cd ursa-major
node -e "
const { diffWords } = require('diff');
const old = 'No single observer holds it whole, and a central grader pretends otherwise.';
const neu = 'No single observer holds the whole of it, and a central grader pretends otherwise.';
const parts = diffWords(old, neu);
console.log(JSON.stringify(parts.filter(p => !p.added).map(p => p.value).join('')));
"
```

Prints `"No single observer holds it whole , and a central grader pretends otherwise."`
— one space that is not in `old`.

---

## 6. The bound's tests

### 6.1 Both stages, passing on real pipeline output

`src/invariants.test.ts`, `describe('SIGNAL_QUOTE_GROUNDED on records the
pipeline really produced')`. Five tests. The first runs
`parsePasteConversation` → `resolve` → `deriveSignals` over
`fixtures/loops` and asserts all three signal kinds are non-empty, that
`signalQuotes === signalEntries`, and that `checkRecord` returns `[]`.
The third does the same for a label-stage record and asserts the two
quotes resolve to two **different** texts, because checking both against
one text would make the bound unfalsifiable for whichever side lost.

### 6.2 Seven ways a quote can be wrong, each firing

`describe('SIGNAL_QUOTE_GROUNDED fires on each way a quote can be
wrong')`. Each test takes a grounded record and breaks exactly one
thing:

| Test | Breakage | Message asserted |
|---|---|---|
| the misquote this bound exists for | one word changed inside the quote and its prose | `does not appear in` |
| the structured quote drifting from the prose | prose rewritten, quote left grounded | `not present in the prose field` |
| a step no prompt has | `step = 9999` | `no prompt at step 9999` |
| a conversation id the record lacks | `conversationId = 'not-a-conversation'` | `no conversation not-a-conversation` |
| prompts stripped | `delete conversations[0].prompts` | `carries no prompts[]`, and the violation count equals `signalQuotes` |
| a generation quote whose step disagrees with its generation | `step += 7` | `turnIndex N, the quote claims step M` |
| an emptied quote | `text = ''` | at least one violation |

The second row is the test for clause (c) and the seventh is the test
for `isExcerptOf`'s empty-string case. Without either, the bound would
have a hole that its other tests could not see.

### 6.3 `src/text.test.ts`, 9 tests on the predicate alone

The predicate is tested apart from the bound because its two dangerous
cases are invisible from above. `'does not let a literal ellipsis in the
source stand in for the elided text'` is the test that a 221-character
truncated quote is not grounded by a 30-character source that happens to
contain `…`; the naive `includes` implementation passes it.

### 6.4 Counts

| | Before | After |
|---|---|---|
| Test files | 23 (1 skipped) | 24 (1 skipped) |
| Tests passing | 375 | 396 |
| `tsc --noEmit` | clean | clean |

---

## 7. What the bound found, which is not what it was written to find

### 7.1 The agent-side quote was a diff reconstruction, not a quote

The bound's first run against a label-stage record failed, on
`src/invariants.test.ts`'s own `resolvedRecord()` helper:

```
SIGNAL_QUOTE_GROUNDED  invariants-unit signals.oneShotCorrections[0] (step 1) text quote 0 (of=generation)
  observed: quote "No single observer holds it whole , and a central grader pre…" does not appear in the 210-char text it names
```

The generation contains `holds it whole, and`. The quote claimed
`holds it whole , and`. `mutationCorrections` built the AGENT side by
joining `span.diff`'s non-added parts, on the assumption that this
reproduces the text the diff was taken against. `diffWords` from the
`diff` package does not promise that. It tokenizes on whitespace, and
for this edit it returned:

```
[' ', 'No single observer holds '] ['-', 'it'] ['+', 'the']
[' ', ' whole '] ['+', 'of it'] [' ', ', and a central grader pretends otherwise.']
```

The common part `' whole '` carries a trailing space because in the
**new** string a space separates `whole` from the inserted `of it`. In
the old string, `whole` is followed directly by a comma. Joining the
non-added parts therefore produces the new side's spacing at every
insertion point that fell where the old string had no space.

Why this matters more than one space: `oneShotCorrections[].text` is the
only signal `ursa run` emits on a repository, and `ursa run` over a
repository is the only launch path that has shipped (`README.md`, M0).
So the most-produced quote in the product was a reconstruction being
sold as verbatim. The fix is that both sides now read what the record
already stores — `generations[gi].text.slice(source.start, source.end)`
for the agent side, `span.text` for the final side — and the `diff`
array keeps its own job, which is expressing the edit.

**The honest size of it.** Measured over the one real label-stage record
this repository's history produces: 4 mutated spans, and 0 of the 4
reconstructions differed from the stored extent, before or after
whitespace normalization. The defect is latent on today's real data and
reproduces on demand. That is worth saying plainly rather than
inflating: a synthetic record found a defect that the committed real
fixture does not exhibit, which is the opposite of 2026-10-04, where
real history found a defect every synthetic fixture passed. Both
directions are needed and neither substitutes for the other.

### 7.2 The gate passes on both committed fixtures by checking nothing

`fixtures/mini/record/outcome_record.json` and
`fixtures/real/ursa-main-4d5e401.json` are the only two records
committed to this repository. Both have `correctionLoops: []`,
`regressions: []` and `oneShotCorrections: []`. So
`SIGNAL_QUOTE_GROUNDED` is vacuously true on both, forever, and "OK —
every stated bound holds" would have been printed by a gate that read
zero strings.

`fixtures/mini` is the sharper case of the two, because it is not empty
for a boring reason. It carries a 74-character `survived_mutated` span,
which is a correction. Its two conversations each have exactly one
prompt, so `hasChatTrace` is true, `detectTraceSignals` runs, no cluster
reaches two members, and `mutationCorrections` — the function that would
have turned that edit into a one-shot correction — is never called,
because it belongs to the other branch. The correction exists in the
record's spans and appears in none of its signals.

That is a separate defect from anything this change fixes, and it is
§10's second ledger entry. What this change does about it is make it
visible: `measure()` now reports `signalEntries`, `signalQuotes` and
`signalEntriesWithoutQuote`, and `src/invariants.cli.ts` prints the
signal line unconditionally, including the zero case, so a gate that
checked nothing has to say so.

### 7.3 The disclosure audit never read the quote `ursa run` produces

`src/disclosure.ts` `rawStringsOf` is the consent gate's definition of
"raw": every string in a record that holds the user's own or the agent's
own words, assembled so the audit can refuse to let any of them cross
the device boundary. It enumerated `files`, `generations`,
`conversations`, `correctionLoops`, `feedbackTranslations` and
`regressions`. It did not enumerate `oneShotCorrections[].text` or
`defensiveGuardrails[].text`.

Both carry verbatim quotes, and the first one is — again — the only
signal `ursa run` emits on a repository. Found while writing the bound,
because listing the places a record quotes somebody is the same exercise
in both files. Two lines, and the audit is strictly stricter than it
was, so nothing downstream loosens.

---

## 8. Acceptance against the ledger entry's own first step

The entry (docs/ideas.md, 2026-10-05) asked for: "the excerpt-grounding
check alone, as an eleventh bound, run over both fixtures and over a
clone of this repository. It needs no new data and it is the one whose
failure would be a trust incident rather than a wrong number."

| Clause | Status | Evidence |
|---|---|---|
| the excerpt-grounding check | done | `SIGNAL_QUOTE_GROUNDED`, §3.4 |
| as an eleventh bound | done | `InvariantCode` has 11 members; `BOUNDS` has 11 entries |
| run over both fixtures | done, and vacuous on both | §5.1, §7.2. The vacuity is reported, not hidden. |
| run over a clone of this repository | done, 8 quotes grounded | §5.3, §4.2 |
| needs no new data | held | no fixture added; `package.json` byte-identical |
| the one whose failure is a trust incident | held, and it failed once | §7.1 |

Not done, and not claimed: the entry's `What` paragraph also named
`durability` checks and the correction-loop step-range checks. Those are
numeric bounds of the kind the ten existing ones already are, and the
entry itself put the excerpt check first for a stated reason. They stay
open; §10's third ledger entry carries them forward.

---

## 9. Boundaries: what this change does not do

1. **No rate moves.** No field that feeds a percentage was added,
   removed or recomputed. `stats` is untouched. Every number in
   `fixtures/real/ursa-main-4d5e401.json` and
   `fixtures/mini/record/outcome_record.json` is unchanged, which is
   why the committed fixture JSON does not appear in this diff.
2. **No quote's text changes except the one that was wrong.** The agent
   side of `oneShotCorrections[].text` now reads the stored extent, so
   it differs from the previous output exactly where the diff
   reconstruction differed from the extent. §7.1 measures that as 0 of 4
   spans on real data.
3. **No new dependency, service, account or cost.** `package.json` is
   byte-identical. `diff@8.0.4` was already a dependency and is still
   used for `span.diff`; what changed is that it is no longer the source
   of a quote.
4. **`quotes` is not yet mandatory**, because `src/hq/fixtures.ts`
   proves a quote-free loop is legitimate. §3.5 states the gap and §10
   files it.
5. **No file under `prompts/`, `.github/`, `docs/sprints/`,
   `docs/standards/`, `skills/` or `digests/` was touched.** Checked
   with the command in §5 of the run log.
6. **No ledger status changed.** Three entries appended with status
   `proposed`.
7. **`docs/decisions.md` untouched.** ADR numbering is contested on
   `main` (the ADR-005/ADR-006 collision) and an ADR is the owner's to
   accept, so §10's first entry asks for one rather than writing it.

---

## 10. What this opens, as ledger entries

Filed in `docs/ideas.md` under 2026-10-06, status `proposed`:

1. **A loop's spec is either quoted or distilled, and the record never
   says which.** The discriminator that would let
   `SIGNAL_QUOTE_GROUNDED` require a quote where one is owed, §3.5.
2. **A correction the spans can see reaches none of the signals when the
   trace is thin.** `fixtures/mini`'s 74-character edit, §7.2.
3. **The gate re-reads the quote on the one machine the buyer will never
   have.** `projectForMinor` in `src/disclosure.ts` exports scalar
   buckets only, so no quote crosses the device boundary and no lab can
   run this bound. The proposal is to export the gate's verdict rather
   than the text.

`durability` and the correction loops' own step ranges stay open under
the 2026-10-05 entry that already names them in its `What`; no new entry
duplicates them.

---

## 11. Tooling

| Tool | Version | Its job here | Why it, over what was considered |
|---|---|---|---|
| TypeScript | 5.9.3 (`typescript@^5.7.2`) | compile-time enumeration of every site that constructs a quoting signal | Making `quotes` a required field turned the compiler into the search. The alternative, grepping for `discoveredSpec:`, finds string literals and misses spread-constructed objects; `tsc` found all four sites including the two inside nested fixture arrays. |
| vitest | 5.0.2 | the 21 new tests, run as part of `npm test` after `tsc --noEmit` | Already the project's runner, and its `expect(...).toEqual([])` on a `Violation[]` prints the whole violation object on failure, which is how §7.1's defect was read off the first failing run rather than debugged. |
| tsx | 4.19.2 | runs `src/invariants.cli.ts` and `src/bin/ursa.ts` from TypeScript source with no build step | A build step before the gate means the gate can run against stale output. `tsx` is already how `ursa run` is invoked, so the gate runs the same source the launch does. |
| Node.js | 22.23.3 | the runtime for all of the above | The version in `.github/workflows` and on the GitHub Actions runner, so `String.prototype.normalize` and `Intl`-dependent `toLocaleString` behave the same in CI as locally. |
| `diff` | 8.0.4 (`diff@^8.0.2`) | `diffWords` produces `span.diff`, the edit a mutated span expresses | Kept for the diff. **Removed from the quote path**, which is §7.1: it tokenizes on whitespace and does not promise that joining the non-added parts reproduces the input, so it is the right tool for "what changed" and the wrong one for "what did the agent write". |
| `grep -rnE` (GNU grep 3.11) | 3.11 | the redaction check in §4.4 and the boundary check in §9 | A pattern that exits 1 on no match is a gate with a meaning; a visual read of the diff is not. |

---

## 12. Glossary

Terms a reader outside Ursa would not already hold, defined in the order
they appear.

- **Outcome record** — the product's unit of data: a finished piece of
  work joined backward to every model generation that fed it, with each
  span of the finished product classified by what happened to it
  (`CLAUDE.md` §1). On disk as `<project>/.ursa/records/<id>.json`.
- **Span** — a contiguous run of characters in a finished file, carrying
  one classification and, when it has one, a pointer to the generation
  extent it came from.
- **Generation** — one model output, with its own text and its own
  division into segments. Addressed by `generationIndex`.
- **Segment** — a sentence-or-block-sized division of a generation's
  text, which is what a final span's `source` pointer addresses.
- **Label stage** — the branch `deriveSignals` takes when the record has
  no chat trace: a git commit pair, where corrections appear once, as
  edits. What `ursa run <project>` produces.
- **Trace stage** — the branch it takes when the user's own messages are
  present and ordered, so recurrence and loops are observable.
- **Step** — the assistant-turn ordinal within a conversation. The join
  key between `generations[].turnIndex`, `conversations[].prompts[].step`
  and every signal.
- **Bound** — one statement in `src/invariants.ts` that is true of every
  record that could exist, checked against the record's own fields. As
  opposed to a **measurement**, a number the gate reports and never
  fails on, because it can be legitimately non-zero.
- **The gate** — `checkRecord` plus `src/invariants.cli.ts`, which exits
  1 on any violation and runs at the end of every `ursa run`.
- **Grounded** — of a quote: the excerpt really appears in the raw text
  the quote names, under the same whitespace normalization `excerpt()`
  applied on the way out.

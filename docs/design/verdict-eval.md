# Verdict-reader evaluation: measuring the false-satisfied rate

**Shipped:** 2026-09-27, engineer run, branch
`engineer/2026-09-27-verdict-eval`.
**Serves:** `docs/design/product-plan.md` §16.8 risk 1, whose stated
mitigation is "the reader is evaluated first against the n=1
transcript, where the true verdicts are known." No evaluation existed.
**Held to:** the engineering-artifact standard in
`prompts/engineer-agent.md` (six elements, all present below).

---

## 1. Why this is the highest-stakes gap in the overlay

`ursa-major/src/verdict.ts` is the only module in Ursa that *creates* a
label. Every other module joins finished work backward to the model
generations that fed it, which is a factual operation: a span either
survived or it did not. The verdict reader is different. It decides
whether the human accepted the work, and that decision becomes the
`accepted` field of the `Declaration` that `deriveSignals` folds into
an `OutcomeRecord`.

So a wrong reading in the satisfied direction is not a cosmetic defect.
It is a **fabricated label inside the commercial object Ursa Minor
sells to a lab**, and it breaks `docs/vision.md` §0b directly:
acceptance is never inferred, only declared. A wrong reading in the
other direction is cheaper but not free: it silently discards a label
the user did choose to give, and stated labels are the scarce input the
whole single-tier design (owner revision, 2026-09-20, plan §16.3) bets
on.

Before this run the reader had seven unit tests, each asserting one
hand-picked behaviour, and no measurement of either error rate. Seven
passing assertions is not a rate.

### 1.1 Definitions used throughout, so no term below stands bare

| Term | Definition in this system |
|---|---|
| **stated verdict** | An expression of satisfaction or dissatisfaction with the work, written by the user in their own words inside the session. The only kind of verdict Ursa recognizes; there is no inferred tier (plan §16.3). |
| **undeclared** | The session contains no stated verdict. Represented by the exported constant `NO_VERDICT` in `ursa-major/src/verdict.ts`: `{ accepted: null, step: null, quote: null, basis: 'undeclared', confidence: 'stated' }`. An honest, common outcome, never upgraded to acceptance by the fact that the user kept the work. |
| **false satisfied** | The reader returns `accepted: true` for a case whose human label is not `true`. Counted by the harness as `falseSatisfied`. The gate: any value above 0 fails. |
| **false unsatisfied** | The reader returns `accepted: false` for a case whose human label is not `false`. |
| **missed** | The human label states a verdict, the reader returned `undeclared`, and nothing in the corpus explains why. A lost label. |
| **known miss** | Same as missed, except the case carries a `knownLimitation` string naming a provable reason the reader cannot see the verdict. Reported, excluded from the gate. |
| **replay mode** | The harness injects the case's own `modelReply` string in place of a real model call. Measures the verification layer only. Runs under `npm test`, offline, deterministically. |
| **live mode** | The harness calls `claudeVerdictRunner`, so `claude -p` actually reads each case. Measures the model and the verification layer together. Costs one `claude -p` call per non-empty case on the owner's subscription. |
| **verification layer** | The part of `readVerdict` that runs *after* the model replies: JSON extraction, the substance guards, verbatim presence, step repair, span recovery. Everything the harness can test without a model. |
| **substance guard** | A check that can only turn a reading into `undeclared` and can never produce one. `MIN_QUOTE_CHARS` and `NEUTRAL_ACKS` are the two that exist. |
| **reachability** | Whether the labelled verdict is inside the text the model is shown at all, decided without calling a model by comparing the label's quote against `shownText(prompt)`. |

---

## 2. System diagram, node by node and edge by edge

Every node below is a file that exists on this branch or a process the
commands in §5 start. Every edge carries a named type or a named file
format. Nothing here is a verb phrase standing in for data.

**Nodes**

| Node | What it actually is |
|---|---|
| `fixtures/verdicts/cases.json` | On-disk JSON file, 11,070 bytes, 16 cases. Layout in §4. |
| `loadCorpus()` in `ursa-major/src/evals/verdict.ts` | Function. Reads the file with `node:fs.readFileSync`, `JSON.parse`s it, expands every `PADDING_<n>` token into `n` characters of filler. |
| `auditCorpus()` in `ursa-major/src/evals/verdict.ts` | Function. Checks the corpus against itself; calls no model. |
| `reachability()` in `ursa-major/src/evals/verdict.ts` | Function. Decides, per case, whether the labelled quote survives inside `shownText` of its own prompt. |
| `runEval()` in `ursa-major/src/evals/verdict.ts` | Function. Loops the cases, builds one `VerdictRunner` per case, calls `readVerdict`, classifies, counts. |
| `readVerdict()` in `ursa-major/src/verdict.ts` | The component under test. Unchanged in shape; its verification block was revised by this run (§3). |
| `claudeVerdictRunner` in `ursa-major/src/verdict.ts` | `VerdictRunner` implementation. `execFileSync('claude', ['-p', '--model', model, '--output-format', 'json'])`. Used in live mode only. |
| `formatReport()` in `ursa-major/src/evals/verdict.ts` | Function. Turns an `EvalReport` into the fixed-width text block shown in §6. |
| `ursa-major/src/evals/cli.ts` | Node process. Argument parsing, then `process.exit(report.passed ? 0 : 1)`. |
| `ursa-major/src/evals/verdict.test.ts` | Vitest file, 13 tests. Runs the replay eval and asserts its gate inside `npm test`. |

**Edges**

```
fixtures/verdicts/cases.json
    --[ JSON text, schemaVersion "0.1.0" ]-->            loadCorpus()
loadCorpus()
    --[ VerdictCorpus ]-->                               runEval()
loadCorpus()
    --[ VerdictCorpus ]-->                               auditCorpus()
auditCorpus()
    --[ string[] of corpus defects, empty when clean ]--> runEval()
runEval()  (per case, replay mode)
    --[ VerdictRunner closure returning case.modelReply ]--> readVerdict()
runEval()  (per case, live mode)
    --[ VerdictRunner = claudeVerdictRunner ]-->         readVerdict()
runEval()
    --[ UserPrompt[] ]-->                                readVerdict()
readVerdict()
    --[ Verdict ]-->                                     classify()
classify()
    --[ { outcome: Outcome; note: string } ]-->          runEval()
runEval()
    --[ EvalReport ]-->                                  formatReport()
formatReport()
    --[ string, fixed-width text ]-->                    process.stdout
runEval()
    --[ EvalReport.passed: boolean ]-->                  process.exitCode (0 or 1)
reachability()
    --[ { reachable: boolean; reason: string } ]-->      auditCorpus()
readVerdict()  (internal, revised this run)
    --[ shownText(prompt): string ]-->                   the verbatim-presence check
```

One property of the diagram is load-bearing: **`readVerdict` never sees
the corpus.** It receives only a `UserPrompt[]` and a `VerdictRunner`,
which is why the same function can be measured offline against written
replies and online against `claude -p` with no branch inside it.

---

## 3. Interfaces at every boundary, as real TypeScript

From `ursa-major/src/evals/verdict.ts`, verbatim:

```ts
export interface CaseTruth {
  accepted: boolean | null
  step: number | null
  /** the exact verbatim span the reader must return; absent when accepted is null */
  quote?: string | null
}

export interface VerdictCase {
  id: string
  why: string
  prompts: UserPrompt[]
  truth: CaseTruth
  /** the exact string the replay runner returns for this case */
  modelReply: string
  /** set when the reader provably cannot pass this case today */
  knownLimitation?: string
}

export interface VerdictCorpus {
  schemaVersion: string
  about: string
  cases: VerdictCase[]
}

export type Outcome =
  | 'correct'
  | 'falseSatisfied'
  | 'falseUnsatisfied'
  | 'missed'
  | 'knownMiss'
  | 'stepWrong'
  | 'quoteWrong'

export interface CaseResult {
  id: string
  why: string
  outcome: Outcome
  truth: CaseTruth
  got: Verdict
  runnerCalls: number
  wastedCall: boolean
  note: string
}

export interface EvalReport {
  mode: 'replay' | 'live'
  model: string | null
  counts: Record<Outcome, number>
  falseSatisfied: number
  results: CaseResult[]
  auditProblems: string[]
  passed: boolean
}

export interface RunOptions {
  mode: 'replay' | 'live'
  liveRunner?: VerdictRunner
  model?: string
  only?: string
}

export const CORPUS_PATH: string
export function loadCorpus(path?: string): VerdictCorpus
export function auditCorpus(corpus: VerdictCorpus): string[]
export function reachability(c: VerdictCase): { reachable: boolean; reason: string }
export function classify(c: VerdictCase, got: Verdict): { outcome: Outcome; note: string }
export function runEval(corpus: VerdictCorpus, opts: RunOptions): EvalReport
export function formatReport(r: EvalReport): string
```

New exports added to `ursa-major/src/verdict.ts` by this run, verbatim:

```ts
export const TRANSCRIPT_CHAR_LIMIT = 2000
export function shownText(p: UserPrompt): string
export const MIN_QUOTE_CHARS = 4
export const NEUTRAL_ACKS: readonly string[]
export function isNeutralAck(quote: string): boolean
```

Unchanged, and still the only interface the bridge calls:

```ts
export function readVerdict(
  prompts: UserPrompt[],
  runner?: VerdictRunner,
  model?: string,
): Verdict
```

### 3.1 The two defects the corpus found, and the exact change each forced

**Defect 1, two false satisfied readings.** The pre-2026-09-27
verification block accepted a reading when the model's quote appeared
verbatim anywhere in the trace:

```ts
const candidates = prompts.filter((p) => p.text.includes(quote))
if (candidates.length === 0) return NO_VERDICT
```

Verbatim presence is necessary and *not* sufficient. A model that
returns `{"accepted": true, "step": 19, "quote": "continue"}` against a
session where the user really did type `continue` passes that check, and
the reader emits `accepted: true`. So does `"quote": "s"` against the
word `smaller`. Both are labels the user never gave. Corpus cases
`v10-neutral-token-quoted-as-a-verdict` and
`v11-one-character-quote-is-discarded`.

Fix: two substance guards, run before the presence check.
`MIN_QUOTE_CHARS = 4` rejects a quote too short to carry a verdict.
`NEUTRAL_ACKS` is a closed, named list of 34 acknowledgements
(`ok`, `thanks`, `continue`, `done`, `sure`, `right`, and so on)
compared after lowercasing, whitespace collapsing, and stripping
surrounding punctuation, so `Ok.` and `THANK YOU!!` are caught too.
Both guards return `NO_VERDICT`. Neither can produce a verdict, which
is the safety argument: **no guard in the module can manufacture the
error the gate measures.** The list enforces an exclusion the
instruction already gave the model rather than adding a new rule, so it
does not smuggle in an inferred tier.

**Defect 2, one lost label.** The transcript handed to the model
flattens newlines so each message is one line. Presence was then tested
against the *unflattened* message. A verdict written across two lines
therefore came back with a space where the source had a newline, failed
`p.text.includes(quote)`, and was discarded as a hallucination. The
user stated a verdict and the record went undeclared. Corpus case
`v02-acceptance-across-a-newline`.

Fix: extract the flattening into `shownText(p)`, use it for both the
transcript and the presence check, and recover the returned span from
the original text by offset:

```ts
const at = shownText(prompt).indexOf(needle)
// ...
const verbatim = source.prompt.text.slice(source.at, source.at + needle.length)
```

Both substitutions inside `shownText` (`[\r\n]` to a single space, then
`slice`) preserve character offsets one-for-one, so the index is exact
and the record carries the user's words as she wrote them, newline
included. The rule this states in general: **verify against the string
the model was shown, report the span from the original.**

### 3.2 The limitation this run measured and did not fix

A verdict sitting past `TRANSCRIPT_CHAR_LIMIT` (2000) inside a single
long message is never shown to the model, so no reading is possible.
Corpus case `v16-verdict-past-the-transcript-limit` holds it down: the
case is labelled `accepted: true`, `reachability()` reports it
unreachable with the offset and the limit in its `reason`, the harness
counts it as `knownMiss`, and the gate ignores it. The fix, windowing
the head and the tail of a long message instead of the head alone, is
day-sized on its own because offsets stop being one-for-one and span
recovery needs a segment map. Filed in `docs/ideas.md` as
"Head-and-tail transcript windowing", 2026-09-27.

---

## 4. On-disk layout, with a real payload

```
ursa-major/
  fixtures/verdicts/
    cases.json          JSON, 11,070 bytes, schemaVersion "0.1.0", 16 cases
  src/evals/
    verdict.ts          the harness
    verdict.test.ts     13 tests, runs the replay eval inside npm test
    cli.ts              the command in §5
  src/
    verdict.ts          the component under test, revised per §3.1
    verdict.test.ts     7 pre-existing tests plus 7 added by this run
```

Nothing in the corpus is a real private record. Every case is written by
hand here, modelled on verdict *shapes* Ursa has seen rather than copied
from a session, and no case carries a home path, a macOS username, or a
session UUID (redaction rider, `prompts/engineer-agent.md`). The one
quote taken from real life, `yesss finallyyy!! lol`, is already public
in `docs/design/product-plan.md` §16.1 and in
`ursa-major/src/verdict.test.ts` on `main`, and is the acceptance quote
the reader was built against.

Two real cases from the file, exactly as they appear on disk:

```json
{
  "id": "v10-neutral-token-quoted-as-a-verdict",
  "why": "the hole verbatim verification alone does not close. The model returns accepted=true quoting a word the user really did type, so presence-in-the-trace passes, but the word carries no verdict. Before 2026-09-27 this produced a false satisfied out of the word 'continue'.",
  "prompts": [
    { "step": 5, "text": "add the health route" },
    { "step": 19, "text": "continue" }
  ],
  "truth": { "accepted": null, "step": null },
  "modelReply": "{\"accepted\": true, \"step\": 19, \"quote\": \"continue\"}"
}
```

```json
{
  "id": "v02-acceptance-across-a-newline",
  "why": "the verdict message has two lines. The transcript flattens newlines to spaces before the model sees it, so the model's verbatim quote carries a space where the source carries a newline. Before 2026-09-27 the reader compared the quote against the unflattened text and discarded this true verdict as a hallucination.",
  "prompts": [
    { "step": 8, "text": "the hover state is too loud" },
    { "step": 44, "text": "that is exactly it\nthank you, leave it there" }
  ],
  "truth": { "accepted": true, "step": 44, "quote": "that is exactly it\nthank you" },
  "modelReply": "{\"accepted\": true, \"step\": 44, \"quote\": \"that is exactly it thank you\"}"
}
```

Field meanings live in the file itself, under its own `fields` key, so
the corpus explains itself to a reader who opens it without this
document. `PADDING_<n>` inside a prompt's `text` expands at load time to
`n` characters of neutral filler, which is how case `v16` needs a
2,200-character message without pasting 2,200 literal characters into a
file meant to be read.

### 4.1 Why the corpus is JSON and not a TypeScript array

Labels are data and the harness is code. A `.json` file can be read by
the Python or shell of a future analysis, diffed line by line in a pull
request when a label changes, and validated by `auditCorpus` at load
time rather than by the type checker at build time. The cost is that
`modelReply` needs escaped quotes inside a JSON string, which is visible
in the payloads above and accepted deliberately.

### 4.2 Why `src/evals/cli.ts` is a new file and not a `package.json` script

On 2026-09-27 the three files that would otherwise host this command,
`ursa-major/package.json`, `ursa-major/src/cli.ts`, and
`ursa-major/src/bin/ursa.ts`, were all modified in open, unmerged pull
requests: #16, #18, and #22. A new file conflicts with nobody. When
those merge, folding the command into `package.json` as
`"eval": "tsx src/evals/cli.ts"` is a one-line follow-up.

---

## 5. Exact commands

Run the eval offline, the way CI runs it:

```bash
cd ursa-major
npx tsx src/evals/cli.ts verdict
```

Run one case while working on it, with the raw report object:

```bash
npx tsx src/evals/cli.ts verdict --only v10 --json
```

Run it against the real model, on the owner's machine, where the
`claude` CLI is authenticated:

```bash
npx tsx src/evals/cli.ts verdict --mode live --model claude-sonnet-5
```

Use it as a gate in a shell pipeline (exit 0 pass, 1 fail, 2 usage):

```bash
npx tsx src/evals/cli.ts verdict > /tmp/verdict-eval.txt || echo "the reader regressed"
```

Run the whole suite, which includes the replay eval:

```bash
cd ursa-major
npm ci
npm test
```

Reproduce this run's before-measurement, which is how the two defects
were shown to be real rather than hypothetical:

```bash
cd ursa-major
cp src/verdict.ts /tmp/verdict.fixed.ts
git show main:ursa-major/src/verdict.ts > src/verdict.ts
cat >> src/verdict.ts <<'EOF'
export const TRANSCRIPT_CHAR_LIMIT = 2000
export function shownText(p: UserPrompt): string {
  return p.text.replace(/\n/g, ' ').slice(0, TRANSCRIPT_CHAR_LIMIT)
}
EOF
npx tsx src/evals/cli.ts verdict
cp /tmp/verdict.fixed.ts src/verdict.ts
```

The two appended lines are a shim so the harness compiles against
`main`'s reader, which had neither export. The body of `readVerdict`
under measurement is `main`'s, unmodified.

---

## 6. The measurement

`main`'s reader, same 16 cases, replay mode:

```
  false satisfied     2   <- the gate (plan §16.8 risk 1): a label the user never gave
  false unsatisfied   0
  missed              1   a stated verdict the reader failed to read: a lost label
  wrong step          0
  wrong quote         0
  known miss          1   unreachable today, explained, not gated
  read as labelled    12

  FAIL
```

This branch's reader, same 16 cases, replay mode:

```
  false satisfied     0   <- the gate (plan §16.8 risk 1): a label the user never gave
  false unsatisfied   0
  missed              0   a stated verdict the reader failed to read: a lost label
  wrong step          0
  wrong quote         0
  known miss          1   unreachable today, explained, not gated
  read as labelled    15

  PASS
```

Read this honestly: replay mode measures the verification layer, not the
model. It proves that a misbehaving reply cannot produce a false
satisfied through the paths the corpus covers, and that a true verdict
written across two lines is no longer thrown away. It does not yet say
anything about how often `claude -p` misbehaves in the first place. That
number needs live mode on a machine with the `claude` CLI authenticated,
and the honest statement today is that it has not been run: this seat
runs in GitHub Actions, where the CLI is not available.

---

## 7. Tooling

| Tool | Version | Job in this system | Why it, over what else was considered |
|---|---|---|---|
| Node.js | 22.23.2 (the version this run executed under) | runs the harness, the CLI, and Vitest | already the runtime for every other `ursa-major` entry point; `node:fs` and `node:path` are all the harness needs, so no runtime dependency was added |
| TypeScript | 5.9.3 (`devDependencies` range `^5.7.2`) | types the corpus, so a case missing `truth.step` fails `tsc --noEmit` before it fails a test | the repo is TypeScript throughout; the alternative, plain JavaScript with runtime validation only, would move corpus defects from compile time to test time |
| Vitest | 2.1.9 (`devDependencies` range `^2.1.8`) | runs `src/evals/verdict.test.ts`, which runs the replay eval inside `npm test` | already the repo's only test runner, so the eval becomes part of the existing gate with no new command for a reviewer to remember; Jest would have meant a second runner and a second config |
| tsx | 4.23.8 (`devDependencies` range `^4.19.2`) | executes `src/evals/cli.ts` directly from TypeScript, no build step | already how `npm run resolve` and the bridge's `ursa run` subprocess start; `ts-node` needs ESM configuration this repo does not carry |
| Claude Code CLI (`claude -p`) | whatever the owner's machine has installed; invoked as `claude -p --model <name> --output-format json` | live mode's model call, through `claudeVerdictRunner` | already the plan's decision for the reader itself (§16.3): the reading runs on the owner's machine, on her subscription, so no API key and no service cost enters the system |
| Vercel Blob, Neon, `ws`, `chokidar` | — | **not used here** | named only to be explicit: the eval touches no network, no store, and no part of the sync path, so nothing in §16.6's tooling table applies to it |

No new dependency was installed. `ursa-major/package.json` is
unchanged by this run, deliberately, per §4.2. Steady-state cost stays
$0; live mode's only cost is tokens on the owner's existing
subscription, which is the same cost the reader already carries in
production.

---

## 8. What would make this corpus better, and what it deliberately is not

The corpus is 16 hand-written cases. It is a **regression net with a
gate**, not a statistical estimate of the reader's field accuracy. Three
things separate it from one:

1. **Synthetic prompts.** Real sessions contain verdicts phrased in ways
   nobody thought to write down. The real n=1 and n=2 traces, where the
   true verdicts are known and hand-annotated, live in
   `alexandrapaiz/ursa-private` (Incident 2,
   `docs/agents/incidents.md`), which this seat cannot read. Plan
   §16.8's mitigation asks specifically for that transcript, so the
   mitigation is half-satisfied: the harness it needs now exists, the
   private corpus it should run against does not exist here. Closing it
   needs an owner-run `--mode live` against a private case file whose
   path is cited, not inlined.
2. **Written replies, not captured ones.** Every `modelReply` is a
   plausible reply a human wrote, including the misbehaving ones. A
   replay corpus built from real `claude -p` output on these same
   prompts would measure something strictly better. That capture has to
   happen on a machine with the CLI, and the captured strings can then
   be pasted into the same `modelReply` field with no harness change.
3. **No agreement measurement.** One person labelled 16 cases. A second
   labeller disagreeing on even one case would be worth more than ten
   more cases labelled by the first.

None of the three weakens the gate. `falseSatisfied` is a floor test:
whatever else is uncertain, the reader must not emit a label the user
never gave on any case anyone has thought of, and every new case anyone
thinks of is four lines of JSON.

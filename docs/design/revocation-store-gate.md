# The revocation guarantee ran on a field the model fills in

Engineer run 2026-10-23. Break-fix, taken ahead of the sprint backlog
because it sits on `CLAUDE.md` load-bearing constraint 2 ("the user can
always see, edit, revoke, and delete what's been inferred about them"),
and the sprint's own notes do not outrank a broken consent promise.
Handed to this seat by the research seat on the company board, message
`b45d6969` of 2026-10-23, from finding 4 of
`docs/research/briefs/2026-10-23.md`.

Written to the engineering-artifact standard in
`prompts/engineer-agent.md`: a system diagram whose nodes are real, real
TypeScript signatures at every boundary, on-disk layouts with a real
payload, the exact commands, a versioned tooling list, and no bare
terms. Terms are defined in §8.

## 1. The defect

`docs/design/consent-and-erasure.md` §6c answers the question "can a
later distillation revive a revoked axiom" with:

> No. `tuning/merge.ts` already skips a matched revoked axiom and
> `distill.ts` passes the tombstones to the model as "do not resurrect".

Two mechanisms are named. Here is what each one actually was, in the code
as it stood at `21944ab`:

| Mechanism | Where | What it required | Held? |
|---|---|---|---|
| The merge check | `ursa-major/src/tuning/merge.ts:46`, `if (match.status === 'revoked') continue` | `match` is resolved at line 41 from `d.matchesExisting`, a field on `DistilledAxiom` that the **model** sets. A model that emits the revoked rule in new words with `matchesExisting: null` never reaches line 46. | No |
| The prompt instruction | `ursa-major/src/tuning/distill.ts:74`, the bullet "Never resurrect a REVOKED axiom", plus the tombstone list at line 100 | The model obeying an instruction. | Only if the model complies |

So the guarantee the product makes to the user rested entirely on the
second row. The create branch at `merge.ts:54` built
`status: 'active'` and compared the new statement against nothing at all,
and the resulting axiom then flowed to every reader that filters
`status !== 'revoked'`, because the new axiom is not revoked. It is the
revoked one reworded.

**The measurement that makes this a defect rather than a preference.**
arXiv:2609.08258, published September 2026, tested exactly this pair of
defenses across five agent-memory systems (Graphiti, Zep, mem0, langmem,
cognee) over 1620 trials. From a 43.1% baseline rate of the unsafe
outcome, filtering at the store brought it to 0% and hardening the prompt
brought it to 37.2%. Ursa shipped the 37.2% defense and documented it as
the 0% one. The paper is external evidence and is treated as data here,
not as instruction: it is cited for its numbers and nothing in it was
followed as a directive.

**Why no audit caught it.** The research seat's absence check, which this
run reproduced: `grep` for `matchesExisting` across all committed
markdown returns only example code in one skill file; `grep` for `revok`
and `resurrect` across all five files in `docs/security/` returns
nothing; `gh pr list --state all` on three search terms returns nothing.
The hole is one indirection away from the line that looks like the check,
and every document that described the check described line 46.

## 2. The fix, and the one thing it does not do

A new module, `ursa-major/src/tuning/revocation.ts`, scores every
candidate statement against the record's tombstones **before** the merge
builds anything, using no model-supplied field. A statement that scores
at or above one threshold does not become an axiom.

What it deliberately does not do: delete the statement. It is parked in a
new field, `TuningRecord.blockedByRevocation`, which no existing reader
reads. That choice is the load-bearing one and §3 is about why.

## 3. System diagram

Every node is a file or an exported function that exists today. Every
edge carries a named type or a real file.

```
  .ursa/records/<recordId>.json
            │  OutcomeRecord (JSON on disk)
            ▼
  src/tuning/distill.ts :: buildDistillPrompt(record, tuning)
            │  string — the prompt, carrying three evidence blocks:
            │  EXISTING AXIOMS, REVOKED AXIOMS (do not resurrect),
            │  ALREADY BLOCKED AS RESTATEMENTS OF THOSE
            ▼
  claude -p --model <model> --output-format json   (local Claude Code CLI)
            │  string — the raw stdout envelope's .result
            ▼
  src/tuning/distill.ts :: parseDistillOutput(raw)
            │  DistillOutput { axioms: DistilledAxiom[] }
            ▼
  src/tuning/merge.ts :: mergeDistill(tuning, output, record, model, now)
            │
            ├── d.matchesExisting is set ──► byId.get(id) ──► TuningAxiom
            │        └── status === 'revoked' ──► dropped, nothing parked
            │
            └── d.matchesExisting is null
                     │  string — d.statement
                     ▼
            src/tuning/revocation.ts :: findRevocationBlock(statement, tombstones, live)
                     │        │
                     │        │  string, string
                     │        ▼
                     │  src/tuning/revocation.ts :: revocationSimilarity(a, b)
                     │        │        │
                     │        │        │  string
                     │        │        ▼
                     │        │  src/normalize.ts :: normalize(text) ──► Normalized { norm, map }
                     │        │        │  string — Normalized.norm
                     │        │        ▼
                     │        │  src/match.ts :: tokens(norm) ──► string[]
                     │        │        │  string[] after STATEMENT_STOPWORDS and foldSuffix
                     │        │        ▼
                     │        │  src/match.ts :: containment(aTokens, bSet) ──► number in [0,1]
                     │        ▼
                     │  RevocationBlock { blockedBy: string; score: number } | null
                     ▼
            ┌─── null ──────────────────────► TuningAxiom, status 'active', pushed to axioms[]
            │
            └─── RevocationBlock ───────────► src/tuning/merge.ts :: parkBlocked(...)
                                                  │  BlockedStatement
                                                  ▼
                                      TuningRecord.blockedByRevocation[]
            │
            ▼
  .ursa/tuning.json   (TuningRecord, JSON.stringify(record, null, 2) + "\n")
            │
            ├── src/tuning/export.ts :: renderTuningBlock(tuning)
            │        reads axioms[] only, filters status !== 'revoked'
            │        ──► string — the markdown tuning block the user pastes into a model
            │
            ├── src/bridge/index.ts :: tuningLines(projectPath)
            │        reads axioms[] only, filters status !== 'revoked'
            │        ──► OverlayTuningLine[] — the dashboard overlay
            │
            ├── src/hq/briefing.ts (line 168) and src/tuning/cli.ts (line 53)
            │        read axioms[] only, filter status !== 'revoked'
            │
            ├── src/consent.cli.ts :: runConsentCommand('show', …)
            │        reads axioms[] AND blockedByRevocation[]
            │        ──► stdout, the only surface that prints a blocked statement
            │
            ├── src/tuning/revoke.ts :: releaseBlocked(tuningPath, index, now)
            │        blockedByRevocation[index-1] ──► TuningAxiom, status 'user-edited'
            │        writes .ursa/tuning.json
            │
            └── src/tuning/revoke.ts :: forgetRecordInTuning(tuning, recordId, now)
                     strips evidence by recordId from axioms[] AND from
                     blockedByRevocation[] ──► ForgetResult
```

**The reason `blockedByRevocation` sits outside `axioms[]`.** Six call
sites decide what may reach a model, and all six decide it the same way,
by filtering `status !== 'revoked'`: `tuning/export.ts:44`,
`bridge/index.ts:87`, `hq/briefing.ts:168`, `consent.cli.ts:85`,
`tuning/cli.ts:53`, and `mcp/server.ts` through the store it reads. A
fourth axiom status — `held`, say — would have had to be added to all six
and to every reader written after today, and a reader that had not heard
of the new status would disclose a held statement **by default**. A field
that nobody reads cannot leak by omission. Anything that wants to show
these statements has to name the field deliberately, which
`consent.cli.ts` now does and nothing else does.

## 4. The threshold, and the calibration behind it

The scorer is the maximum of token containment in both directions over
**content tokens**: the statement normalized by `normalize()`,
split by `tokens()`, with `STATEMENT_STOPWORDS` removed and a four-suffix
fold applied (`ies`→`y`, and `ing`/`ed`/`es`/`s` stripped from tokens
longer than three characters).

**Why not `similarity()` from `src/match.ts`.** That function averages
containment with Levenshtein distance, which is right for a span of prose
edited in place and wrong for a rule that was reworded, because
reordering a clause destroys character alignment while leaving the rule
identical. Measured on the same pairs:

| Scorer | Lowest paraphrase pair | Highest unrelated pair | Separated? |
|---|---|---|---|
| `similarity()` (0.5·containment + 0.5·Levenshtein) | 0.317 | 0.477 | No — the ranges overlap |
| content-token containment, max of both directions | 0.600 | 0.500 | Yes |

The calibration set is every distinct axiom statement this repository
contains, taken from `src/tuning/tuning.test.ts`, `src/hq/fixtures.ts`
and `docs/design/verbatim-byte-identity.md`: 8 statements, so 28 distinct
pairs, plus 10 paraphrase pairs written by hand as a model would reword
each rule. Both sets are in `src/tuning/revocation.test.ts` and asserted
there, so a threshold change that breaks this table breaks the suite.

```
paraphrase pairs, content-token containment
  1.000  No explanatory labels on visual elements || Avoid explanatory labels on visual elements
  1.000  No explanatory labels on visual elements || Do not put explanatory labels on visual elements
  1.000  No explanatory labels on visual elements || Visual elements should carry no explanatory labels
  0.750  No explanatory labels on visual elements || Never add a label explaining a visual element
  1.000  keep entrance motion under 8px of travel || entrance motion should travel less than 8px
  0.750  keep entrance motion under 8px of travel || limit entrance animation travel to 8px
  0.667  every claim names its mechanism          || each claim must name its mechanism
  0.667  every claim names its mechanism          || name the mechanism behind every claim
  0.600  open every section with a one-line summary || begin each section with a single-line summary
  0.875  body text holds 7:1 contrast on dark sections || dark sections need 7:1 contrast on body text

distinct pairs, the two highest of 28
  0.500  Rich copy || Sparse copy
  0.200  body text holds 7:1 contrast on dark sections || open every section with a one-line summary
```

`THETA_REVOKED = 0.55` sits between 0.500 and 0.600.

**This is a calibration on 38 pairs and it is not an error rate.** The
sample is small, hand-built, and drawn from one repository's own writing
style. The harness that would produce an error rate is named in §7 and
is not built here.

**The one measured over-block, asserted rather than hidden.** "no
entrance motion at all" scores 1.000 against "keep entrance motion under
8px of travel", because every content token it has (`entrance`,
`motion`) appears in the revoked statement. It is a different and
stronger rule, so holding it is a false positive on a strict reading. The
design keeps it anyway: a new rule about the subject of a revocation
passes the user's eyes before it reaches a model, and
`ursa consent release-blocked` is one command. The case is asserted in
`src/tuning/revocation.test.ts` under the name "holds a stronger rule
about the subject of the revocation, by design", so a future change that
makes the gate narrower will have to say so out loud.

**Why the threshold is low rather than balanced.** The two failure
directions do not cost the same thing, so the threshold is not set to
minimize total error. A miss revives an inference the user revoked, the
user cannot see it, and `CLAUDE.md` names the asset it damages as one
that "compounds daily and can be destroyed in a week". An over-block
holds a legitimate statement where the user can read it and release it
with one command. Asymmetric costs get an asymmetric threshold.

**`polarity` is not consulted.** A tempting exemption is to let
`polarity: 'prefer'` through when the tombstone said `'avoid'`, on the
theory that the opposite rule is a different claim. It is not safe: the
negation words that would distinguish the two in the statement text
(`no`, `not`, `never`) are stopped out, and a model could flip the field
and negate the words to produce the same rule with the opposite label. So
the gate blocks on the words and records the polarity it arrived with for
the user to judge.

## 5. Interfaces

New, in `ursa-major/src/tuning/revocation.ts`:

```ts
export const STATEMENT_STOPWORDS: Set<string>
export const THETA_REVOKED = 0.55

export function foldSuffix(token: string): string
export function contentTokens(statement: string): string[]
export function revocationSimilarity(a: string, b: string): number

export interface RevocationBlock {
  blockedBy: string
  score: number
}

export function findRevocationBlock(
  statement: string,
  tombstones: Pick<TuningAxiom, 'id' | 'statement'>[],
  live?: Pick<TuningAxiom, 'id' | 'statement'>[]
): RevocationBlock | null
```

New, in `ursa-major/src/tuning/types.ts`:

```ts
export interface BlockedStatement {
  statement: string
  domain: string
  polarity: 'prefer' | 'avoid'
  basis: 'stated' | 'tacit' | 'mixed'
  evidence: AxiomEvidence[]
  blockedBy: string
  score: number
  occurrences: number
  firstBlocked: string
  lastBlocked: string
}

export interface TuningRecord {
  schemaVersion: '0.1.0'
  owner: string
  updatedAt: string
  sources: Array<{ recordId: string; distilledAt: string; method: 'rlaif-claude'; model: string }>
  axioms: TuningAxiom[]
  blockedByRevocation?: BlockedStatement[]   // new; optional so older files parse
}
```

New, in `ursa-major/src/tuning/revoke.ts`:

```ts
export interface ReleaseResult {
  tuning: TuningRecord
  released: TuningAxiom
}

export function releaseBlocked(
  tuningPath: string,
  index: number,
  now?: string
): ReleaseResult
```

Changed, in `ursa-major/src/tuning/revoke.ts` and
`ursa-major/src/consent.ts` — one additive field each, both counting the
same thing:

```ts
export interface ForgetResult {
  tuning: TuningRecord
  axiomsDeleted: string[]
  evidenceStripped: number
  sourcesRemoved: number
  blockedDropped: number        // new
}

export interface Tombstone {
  recordId: string
  forgottenAt: string
  removed: {
    recordFile: boolean
    axiomsDeleted: string[]
    evidenceStripped: number
    sourcesRemoved: number
    blockedDropped?: number     // new; optional so a tombstone written before today reads back
  }
}
```

Unchanged, and worth stating because a caller might expect otherwise:
`mergeDistill`, `revokeAxiom` and `forgetRecordInTuning` keep their exact
signatures. `docs/design/product-plan.md` §2 row 9 pins
`revokeAxiom(tuningPath, unitId): TuningRecord` as component 9 of the
system, and this change does not touch it.

## 6. On-disk layout, with a real payload

Path, with the home directory in the placeholder form the
engineering-artifact standard's redaction rider requires:

```
~/Desktop/ursa-minor-site/.ursa/tuning.json
```

The payload below is the real output of the sequence in §7 run against a
temporary project root, with the record id truncated to its first seven
hex characters and the owner left as the local label it is:

```json
{
  "schemaVersion": "0.1.0",
  "owner": "local",
  "updatedAt": "2026-10-23T18:00:00.000Z",
  "sources": [
    {
      "recordId": "ursa-2026-10-23-1a2b3c4",
      "distilledAt": "2026-10-23T17:00:00.000Z",
      "method": "rlaif-claude",
      "model": "sonnet"
    },
    {
      "recordId": "ursa-2026-10-23-9f8e7d6",
      "distilledAt": "2026-10-23T18:00:00.000Z",
      "method": "rlaif-claude",
      "model": "sonnet"
    }
  ],
  "axioms": [
    {
      "id": "ax-001",
      "statement": "keep entrance motion under 8px of travel",
      "domain": "motion",
      "polarity": "avoid",
      "basis": "tacit",
      "evidenceCount": 1,
      "evidence": [
        {
          "kind": "correction-loop",
          "ref": "A",
          "steps": [
            1,
            2
          ],
          "recordId": "ursa-2026-10-23-1a2b3c4"
        }
      ],
      "contradicts": [],
      "firstSeen": "2026-10-23T17:00:00.000Z",
      "lastSeen": "2026-10-23T17:30:00.000Z",
      "status": "revoked"
    }
  ],
  "blockedByRevocation": [
    {
      "statement": "entrance motion should travel less than 8px",
      "domain": "motion",
      "polarity": "avoid",
      "basis": "tacit",
      "evidence": [
        {
          "kind": "correction-loop",
          "ref": "A",
          "steps": [
            1,
            2
          ],
          "recordId": "ursa-2026-10-23-9f8e7d6"
        }
      ],
      "blockedBy": "ax-001",
      "score": 1,
      "occurrences": 1,
      "firstBlocked": "2026-10-23T18:00:00.000Z",
      "lastBlocked": "2026-10-23T18:00:00.000Z"
    }
  ]
}
```

What a reader should take from that file: `axioms` holds one entry and it
is a tombstone, so the overlay shows nothing and `renderTuningBlock`
emits its four header lines and no rules at all, which is its real
output over this record, verbatim:

```markdown
# Tuning

Distilled from 2 real working sessions;
every rule is backed by evidence in the owner's outcome records.
Confidence = independent evidence count. Follow high-confidence rules
from the first message; treat single-evidence rules as hints.
```

The rule the second distillation pass produced is in
`blockedByRevocation`, and `ursa consent show` is the one thing that
prints it. Its real output over that file, with the temporary project
root standing in for the user's own:

```
  1 inferences, 0 active and 1 revoked.

  1 statement held back, because a later distillation restated something you revoked:
      1.  avoid: entrance motion should travel less than 8px
          restates ax-001, sharing 100% of its words, produced 1 time, last on 2026-10-23T18:00:00.000Z
  Nothing in that list reaches any model. If one of them is genuinely a new rule rather than the old one reworded, `ursa consent release-blocked <project> --index <n>` makes it an inference you own.
```

And releasing it, which is the same file one command later:

```
Released "entrance motion should travel less than 8px" as ax-002.
It is yours now rather than the distillation's, so no later pass can reword it, and the revocation it resembled is still in force.
```

## 7. Exact commands

Reproducing the hole and the fix, from `ursa-major/`:

```bash
# 1. The suite that tests the guarantee. 18 cases.
npx vitest run src/tuning/revocation.test.ts

# 2. The evidence that those cases test the hole and not the fix: disable
#    the gate by making findRevocationBlock return null as its first act,
#    and 10 of the 18 fail. Restore it and all 18 pass.
npx vitest run src/tuning/revocation.test.ts

# 3. Whole suite and the compiler, which is what `npm test` is.
npm test

# 4. The committed single-file bundle, whose digest test compares it
#    against a rebuild of the source this change edits.
npm run bundle
npm run bundle:check
```

The user-facing sequence, against a project root at
`~/Desktop/ursa-minor-site`:

```bash
# See what has been inferred, including anything the gate is holding.
npx tsx src/bin/ursa.ts consent show ~/Desktop/ursa-minor-site

# Withdraw one inference. The tombstone is what the gate scores against.
npx tsx src/bin/ursa.ts consent revoke-axiom ~/Desktop/ursa-minor-site --axiom ax-001

# Distill again. A pass that restates ax-001 in new words is now held,
# whether or not it sets matchesExisting.
npx tsx src/bin/ursa.ts tuning distill ~/Desktop/ursa-minor-site

# Release a held statement that is genuinely a new rule. The number is
# the one `consent show` printed beside it.
npx tsx src/bin/ursa.ts consent release-blocked ~/Desktop/ursa-minor-site --index 1
```

**The next slice, not built here.** An error rate for the gate needs
ground truth, and the only honest way to get it is the way arXiv:2610.17488
got its attribution ground truth: inject known cases and measure. The
shape is a fixture set of (revoked statement, candidate statement, is it
a restatement) triples large enough to report a number on, built from the
real tuning records in `ursa-major/fixtures/` rather than by hand, scored
by `revocationSimilarity` at a sweep of thresholds. That is a day of its
own and it is filed in `docs/ideas.md` for 2026-10-23.

## 8. Tooling

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| TypeScript compiler, `tsc` | 5.7.2 (`devDependencies`, `npm run typecheck`) | Proves the new optional fields are handled at every read site, including the five readers this change does not edit | The alternative was leaving `blockedByRevocation` untyped on a `JSON.parse` result, which is how `TuningRecord` is loaded in six files. Typing it is what makes "no existing reader reads this field" checkable rather than asserted |
| Vitest | 5.0.2 (`devDependencies`, `npm test`) | Runs the 18-case guarantee suite and the 803-case full suite | Already the project's only test runner; adding a second would split where a consent guarantee is proven |
| `src/normalize.ts` `normalize()` | in-repo, no version | Folds case, smart punctuation and whitespace before comparison, so a retyped em dash does not fork a blocked entry | The alternative was raw string comparison, which `docs/design/verbatim-byte-identity.md` §1 already measured as wrong on this repository's own history: the resolver called a span unchanged when a case had changed |
| `src/match.ts` `tokens()`, `containment()` | in-repo, no version | The two primitives the score is built from | Writing a second tokenizer would mean a block is explainable from a different set of functions than a span label is, and `src/match.ts` opens by saying every label must be explainable from its functions and its thresholds alone |
| `@huggingface/transformers` | 4.3.0, already an `optionalDependencies` entry used by the semantic ranker | **Rejected.** | Three reasons, in order of weight. An `optionalDependencies` entry can be absent at runtime, and a consent guarantee that silently degrades when a package failed to install is not a guarantee. An embedding cosine is not inspectable by the user whose revocation it enforces, offline, with no model in the loop — and `src/match.ts` already took this position for span labels. And the ranker writes an embedding cache to disk (`src/mcp/server.ts` deliberately leaves it out of the MCP read path for exactly that reason), which would put a derived artifact of a revoked statement on disk as a side effect of enforcing the revocation |
| Claude Code CLI, `claude -p` | whatever the user has installed; invoked in `src/tuning/distill.ts` | Runs the distillation pass locally, on the user's own subscription | Unchanged by this work, and named here because it is the component whose output the gate stops trusting |
| `gh` | 2.x on the runner | Read-only here: `gh pr list --state all` to confirm nobody had filed this, and the pull request for the run | — |

## 9. Terms

- **Axiom** — one inferred preference in `.ursa/tuning.json`: a portable
  rule, a domain tag, a polarity, and evidence pointers back to the
  outcome record steps that ground it. `TuningAxiom` in
  `src/tuning/types.ts`.
- **Tombstone (of an axiom)** — an axiom with `status: 'revoked'`. Kept
  rather than deleted, because the system has to know what not to do.
  Excluded from every export.
- **Blocked statement** — a statement one distillation pass produced that
  the gate refused to make an axiom of, parked in
  `TuningRecord.blockedByRevocation`. Not an axiom, not revoked, and not
  visible to any model. `BlockedStatement` in `src/tuning/types.ts`.
- **Content token** — what is left of a statement after normalization,
  tokenization, removal of `STATEMENT_STOPWORDS`, and the four-suffix
  fold. The unit the score is computed over.
- **Containment, in a direction** — the fraction of one statement's
  content tokens that appear in the other's. `containment()` in
  `src/match.ts`.
- **`THETA_REVOKED`** — the single number a block is explainable from,
  0.55. Named to match `THETA_HIGH` and `THETA_LOW` in `src/match.ts`,
  which are the span resolver's two thresholds.
- **Declared match** — `DistilledAxiom.matchesExisting`, the existing
  axiom id the model says its statement restates. The field the old
  revocation check depended on.
- **Release** — the user's promotion of a blocked statement into an axiom
  she owns, `status: 'user-edited'`. `releaseBlocked` in
  `src/tuning/revoke.ts`, `ursa consent release-blocked` at the CLI.

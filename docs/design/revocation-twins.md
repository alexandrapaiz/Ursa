# The revocation took effect on the id she clicked, and not on the rule she meant

Engineer, 2026-10-23. Companion to
`docs/design/revocation-store-gate.md`, which built the forward-looking
half of the revocation guarantee on the same day and stated this gap in
its §2 under "What it cannot do, stated here rather than discovered
later." This document is that gap closed. It is held to the
engineering-artifact standard in `prompts/engineer-agent.md`: every node
below is a real file, every signature is the one a caller writes, the
payload in §6 is a file this change actually produced, and §9 defines
every term the rest of the document uses.

## 1. The defect

`ursa consent revoke-axiom <project> --axiom ax-001` sets one axiom's
`status` to `'revoked'` and keeps it as a tombstone. Six call sites then
decide what may reach a model by filtering `status !== 'revoked'`
(`src/tuning/export.ts`, `src/bridge/index.ts`, `src/mcp/server.ts`
through its store, `src/hq/briefing.ts`, `src/consent.cli.ts` and
`src/tuning/cli.ts`). That is exactly right when the rule she revoked
exists once.

It exists more than once more often than the schema suggests. Before
2026-10-23 the only duplicate check in `mergeDistill` was
`DistilledAxiom.matchesExisting`, which **the model fills in**. A pass
that emitted "entrance motion should travel less than 8px" against an
existing "keep entrance motion under 8px of travel" and left
`matchesExisting` null fell into the create branch and got `ax-002`,
`status: 'active'`, its own evidence, and its own place in every export.
Nothing compared the two statements. The gate shipped on 2026-10-23
compares them now, but only at the moment a candidate arrives, so:

> **The population.** Every tuning record that exists right now was
> written by the old create path. Not a projected population and not a
> sampled one. The pairs are in the fixtures in this repository and on
> the disk of anyone who has run `ursa tuning distill` more than once.

For a record holding such a pair, revoking `ax-001` produces an
interface that is honest about what it did and silent about what it did
not. The command prints "Revoked ax-001", the axiom leaves every export,
and `ax-002` keeps saying the same thing to the same models. She watches
her revocation take effect on the thing she clicked and not on the thing
she meant, which is a failure of `CLAUDE.md` load-bearing constraint 2
("the user can always see, edit, revoke, and delete what's been inferred
about them") by the only measure that matters, which is whether the rule
stopped being applied.

**Why the gate cannot see it, by construction.** `findRevocationBlock`
is called from `mergeDistill` on a candidate statement that is not yet
an axiom, and scores it against tombstones. The twin here is already in
`axioms` and was there before the revocation. There is no candidate and
no pass. No tightening of the gate reaches this case.

## 2. The fix, and the thing it refuses to do

Two exported functions in the module the gate already lives in, plus two
lines of output. Nothing is written to disk and no axiom's status
changes.

- `revocationTwins(tuning, unitId)` answers "what else still says what
  `unitId` said", for one tombstone.
- `allRevocationTwins(tuning)` answers it for every tombstone in the
  record, and omits the tombstones whose revocation did fully take
  effect.

**What it refuses to do, and why that is the design rather than a
shortcut.** The mechanical fix is three lines: revoke the twin too. It is
rejected. The score is lexical and it is calibrated on 38 pairs, so it
is a good enough reason to show her two statements side by side and a
bad enough reason to withdraw an inference she did not name. More
importantly, a product that reads "revoke ax-001" as "revoke whatever
else I judge to mean that" has substituted its own judgment for hers
inside the one command whose entire purpose is that her judgment wins.
That is a dark pattern of exactly the shape `CLAUDE.md` constraint 2
forbids, and it would be one introduced by the code meant to enforce the
constraint. So the output names the twin, prints the command that would
withdraw it, and stops.

**The second surface, which is the one that reaches the population.** A
report fired at the moment of revocation only helps revocations made from
now on. The pairs described in §1 are already on disk, and the
revocations that half-landed on them already happened, possibly weeks
ago. So `allRevocationTwins` is wired into `ursa consent show`, the
command whose job is already "here is what has been inferred about you."
She finds out the next time she looks, rather than by revoking something
a second time.

## 3. System diagram

Nodes are real files and real stores. Edges carry named types, not verb
phrases.

```
                        ┌───────────────────────────────────┐
                        │ .ursa/tuning.json                 │
                        │ (store, per project)              │
                        │ TuningRecord                      │
                        └───┬───────────────────────────▲───┘
         TuningRecord (read)│                           │TuningRecord (written)
                            │                           │
        ┌───────────────────▼──────────────┐   ┌────────┴──────────────────┐
        │ src/consent.cli.ts               │   │ src/tuning/revoke.ts      │
        │ runConsentCommand(argv, io)      │   │ revokeAxiom(path, unitId) │
        │                                  ├──►│ sets status: 'revoked'    │
        │  branch 'revoke-axiom'           │   └───────────────────────────┘
        │  branch 'show' → describe()      │        unitId: string
        └──┬────────────────────────┬──────┘
           │                        │
  { axioms }, unitId: string        │ { axioms }
  ─────────────────────────┐        └──────────────────┐
                           ▼                           ▼
        ┌──────────────────────────────────────────────────────────┐
        │ src/tuning/revocation.ts                                 │
        │                                                          │
        │  revocationTwins()      ──► RevocationTwin[]             │
        │  allRevocationTwins()   ──► TwinPair[]                   │
        │                                                          │
        │  both call revocationSimilarity(a, b): number            │
        │  and compare it against THETA_REVOKED = 0.55             │
        └───┬──────────────────────────────────────────────────────┘
            │ string[] (content tokens), number (containment)
            ▼
   ┌──────────────────────┐   ┌───────────────────────────────────┐
   │ src/normalize.ts     │   │ src/match.ts                      │
   │ normalize(s)         │   │ tokens(s), containment(xs, ys)    │
   │ → { norm: string }   │   │ → string[], number                │
   └──────────────────────┘   └───────────────────────────────────┘

            RevocationTwin[] / TwinPair[]
            ▼
        ┌──────────────────────────────────────┐
        │ src/consent.cli.ts printTwin()       │
        │ → lines on CliIo.out (stdout)        │
        └──────────────────────────────────────┘
```

Edges, named one by one:

| From | To | What crosses it |
|---|---|---|
| `.ursa/tuning.json` | `src/consent.cli.ts` | `TuningRecord`, by `JSON.parse(readFileSync(...))` in `describe()` |
| `src/consent.cli.ts` | `src/tuning/revoke.ts` | `tuningPath: string` and `unitId: string`, the axiom id typed after `--axiom` |
| `src/tuning/revoke.ts` | `.ursa/tuning.json` | the updated `TuningRecord`, serialized with `JSON.stringify(updated, null, 2)` plus a trailing newline. **This is the only write in the diagram.** |
| `src/consent.cli.ts` | `src/tuning/revocation.ts` | `{ axioms: TuningAxiom[] }` and, for `revocationTwins`, `unitId: string` |
| `src/tuning/revocation.ts` | `src/normalize.ts` | one statement as `string`, back as `{ norm: string }` |
| `src/tuning/revocation.ts` | `src/match.ts` | `string[]` of content tokens and a `Set<string>`, back as a `number` in [0, 1] |
| `src/tuning/revocation.ts` | `src/consent.cli.ts` | `RevocationTwin[]` from `revocationTwins`, `TwinPair[]` from `allRevocationTwins` |
| `src/consent.cli.ts` | stdout | one line per twin through `CliIo.out`, formatted by `printTwin` |

**The node that is deliberately absent.** There is no edge from
`src/tuning/revocation.ts` back to `.ursa/tuning.json` for this feature.
That absence is the design decision in §2, and it is checkable: the
acceptance test in §5 reads the twin's JSON object before and after a
revocation and asserts deep equality.

## 4. Interfaces

The signatures a caller writes against, from
`ursa-major/src/tuning/revocation.ts`.

```ts
/** A live axiom that restates a revoked one. */
export interface RevocationTwin {
  /** id of the still-live axiom */
  id: string
  statement: string
  /** revocationSimilarity against the revoked axiom's statement, three decimals */
  score: number
  /**
   * The live axiom's own status. An `active` twin was written by a
   * distillation pass, which is the defect this report exists for. A
   * `user-edited` twin is one she wrote or released herself, so naming
   * it is still correct and calling it the model's duplicate would be
   * false.
   */
  status: 'active' | 'user-edited'
}

/** One revoked axiom and the live axioms that still say what it said. */
export interface TwinPair {
  revoked: { id: string; statement: string }
  twins: RevocationTwin[]
}

/**
 * The live axioms that restate a given revoked one, closest first, then
 * by id. Throws on an unknown `unitId`.
 */
export function revocationTwins(
  tuning: { axioms: TuningAxiom[] },
  unitId: string
): RevocationTwin[]

/** Every revoked axiom that still has a live twin. Tombstones with none are omitted. */
export function allRevocationTwins(
  tuning: { axioms: TuningAxiom[] }
): TwinPair[]
```

Three signature decisions, each with the alternative that was rejected.

1. **The parameter is `{ axioms: TuningAxiom[] }`, not `TuningRecord`
   and not a path.** Structural, so a caller holding a record, a merge
   result or a fixture passes it with no cast, and so neither function
   can read or write a file. A path parameter would have made the "it
   changes nothing" claim a matter of reading the body instead of
   reading the type.

2. **`revocationTwins` throws on an unknown id.** The alternative is
   returning `[]`, which is worse than it looks: an empty list from this
   function reads as "nothing else says this", and returning that
   sentence about an axiom that does not exist is the one wrong answer it
   can give. `revokeAxiom` in `src/tuning/revoke.ts` already throws for
   the same stated reason. Unreachable from the CLI, where `revokeAxiom`
   validates the id first and throws before this is called.

3. **`status` is on the twin, and `polarity` is not.** The reader needs
   to know who put the statement there, because the sentence the CLI
   prints differs. Polarity is left off because `revocationSimilarity`
   does not consult it (`STATEMENT_STOPWORDS` removes `no`, `never`,
   `avoid` and `prefer`), so printing it beside a score that ignored it
   would imply the score accounted for it.

Reused unchanged from the gate, called and not redefined:

```ts
export function revocationSimilarity(a: string, b: string): number
export const THETA_REVOKED = 0.55
```

**Why the same threshold rather than a new one.** A pair the gate would
block today is exactly the pair this report should name about yesterday,
and two numbers for one judgment would mean the store and the report
disagreeing about whether two statements are the same rule. The
asymmetry argument that lets `THETA_REVOKED` sit low is also stronger
here than at the gate: an over-block parks a statement she has to go
find, while an over-report costs her one glance at a named id whose
statement is printed beside it, and nothing is changed on disk in either
direction.

## 5. Exact commands

From `ursa-major/`. These are the literal invocations, with the counts
they produced on this change.

```bash
# 1. The guarantee suite, now 30 cases: the gate's original 18 and this
#    change's 12.
npx vitest run src/tuning/revocation.test.ts

# 2. The evidence that the 12 test the hole and not the fix. Make
#    revocationTwins return [] as its first act, then:
npx vitest run src/tuning/revocation.test.ts
#    7 of the 12 fail. The 5 that still pass are the negative controls,
#    which assert that nothing is printed when a revocation did take
#    effect, so they pass under a disabled report by construction. They
#    are what stops the feature from reporting a twin for every pair of
#    statements, and they are not evidence about the hole.

# 3. The compiler and the whole suite, which together are `npm test`.
npm test
#    38 files passed, 2 skipped. 806 passed, 9 skipped, 0 failed.
#    The baseline before this change was 794 passed, 0 failed.

# 4. The committed single-file bundle. Editing src/ makes it stale and
#    two tests fail on the digest until it is rebuilt.
npm run bundle
npm run bundle:check
```

The user-facing sequence, against a project root written in the
placeholder form the artifact standard's redaction rider requires:

```bash
# Withdraw one inference. If something you still hold says nearly the
# same thing, this now tells you so.
npx tsx src/bin/ursa.ts consent revoke-axiom ~/Desktop/ursa-minor-site --axiom ax-001

# See what has been inferred, including any earlier revocation that only
# landed on one of a pair. This is the surface for records that already
# exist.
npx tsx src/bin/ursa.ts consent show ~/Desktop/ursa-minor-site

# Withdraw the twin as well, if that is what you meant. Nothing does
# this for you.
npx tsx src/bin/ursa.ts consent revoke-axiom ~/Desktop/ursa-minor-site --axiom ax-002
```

## 6. On-disk layout, with a real payload

Nothing new is stored. The file this feature reads is the one the store
already writes.

```
<project>/
└── .ursa/
    ├── tuning.json          # TuningRecord. The only file either function reads.
    ├── consent.json         # ConsentRecord. Untouched by this change.
    └── records/*.json       # OutcomeRecord per run. Untouched by this change.
```

Below is `.ursa/tuning.json` from a project where the pair was built by
the old create path across two distillation passes with
`matchesExisting: null` both times, and then `ax-001` was revoked. It is
the actual file this change produced, trimmed to the two axioms and with
record ids truncated to seven characters of the commit, per the
redaction rider. Note `"blockedByRevocation": []`: the gate never fired,
because when `ax-002` was created there was no tombstone to score it
against. That empty array is the hole, on disk.

```json
{
  "schemaVersion": "0.1.0",
  "owner": "you",
  "updatedAt": "2026-10-23T23:56:44.767Z",
  "sources": [
    { "recordId": "ursa-2026-10-20-a1b2c3d", "distilledAt": "T1", "method": "rlaif-claude", "model": "claude-sonnet-5" },
    { "recordId": "ursa-2026-10-21-e4f5a6b", "distilledAt": "T2", "method": "rlaif-claude", "model": "claude-sonnet-5" }
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
          "steps": [1, 2],
          "quote": "that entrance is still too far",
          "recordId": "ursa-2026-10-20-a1b2c3d"
        }
      ],
      "contradicts": [],
      "firstSeen": "T1",
      "lastSeen": "2026-10-23T23:56:44.767Z",
      "status": "revoked"
    },
    {
      "id": "ax-002",
      "statement": "entrance motion should travel less than 8px",
      "domain": "motion",
      "polarity": "avoid",
      "basis": "tacit",
      "evidenceCount": 1,
      "evidence": [
        {
          "kind": "correction-loop",
          "ref": "A",
          "steps": [1, 2],
          "quote": "that entrance is still too far",
          "recordId": "ursa-2026-10-21-e4f5a6b"
        }
      ],
      "contradicts": [],
      "firstSeen": "T2",
      "lastSeen": "T2",
      "status": "active"
    }
  ],
  "blockedByRevocation": []
}
```

The two statements score 1.000 against each other, and the four
functions in §3's bottom row are enough to check it by hand.
`contentTokens('keep entrance motion under 8px of travel')` returns
`['entrance', 'motion', '8px', 'travel']`, because `STATEMENT_STOPWORDS`
removes `keep`, `under` and `of`. The same call on `ax-002` returns
`['entrance', 'motion', 'travel', '8px']`, having removed `should`,
`less` and `than`. The two sets are equal, so containment is 4/4 in both
directions and the maximum of them is 1. `foldSuffix` is not load-bearing
on this particular pair, since both statements already say `travel`.

What the two commands print against exactly this file, verbatim:

```
$ npx tsx src/bin/ursa.ts consent revoke-axiom ~/Desktop/ursa-minor-site --axiom ax-001
Revoked ax-001: "keep entrance motion under 8px of travel"
It is kept as a tombstone so a later distillation cannot bring it back, and every export and every overlay from here on leaves it out.
A block you already pasted into another product is outside what this can reach. That copy is a text field in somebody else's settings, this command cannot find it or change it, and it keeps working until you replace it yourself. Run `ursa tuning export` again and paste the new block over the old one everywhere you put it.

One inference you still hold says nearly the same thing, and revoking this one did not touch it:
      ax-002  sharing 100% of its words: "entrance motion should travel less than 8px"

Those are still active, so they still reach every model. Withdraw one too with `ursa consent revoke-axiom ~/Desktop/ursa-minor-site --axiom ax-002`, or leave it where it is. Nothing in that list was changed for you, because which of them you actually meant is yours to say and not ours to guess.
```

```
$ npx tsx src/bin/ursa.ts consent show ~/Desktop/ursa-minor-site
  2 inferences, 1 active and 1 revoked.
      ax-002  avoid: entrance motion should travel less than 8px  (motion, x1)

  One thing you revoked is still being said by an inference you hold:
      ax-001, which you revoked: "keep entrance motion under 8px of travel"
          still active: ax-002  sharing 100% of its words: "entrance motion should travel less than 8px"
  This happens because an inference written before the store checked for it could be the same rule twice under two ids, and withdrawing one id leaves the other one working. Withdraw the rest with `ursa consent revoke-axiom ~/Desktop/ursa-minor-site --axiom <id>`, or leave them. Nothing above was changed for you.
```

The score is printed as a share of words and not as `1.000`, for the
reason the blocked listing above it already uses: the number exists so
she can tell a close pair from a borderline one, and a bare three-decimal
figure invites a precision this score does not have.

## 7. What this does not do

Stated here rather than left to be found, which is the practice §2 of the
gate document set.

1. **It is a report, so a user who does not read it is not protected.**
   The twin keeps exporting until she withdraws it. This is the chosen
   trade in §2 and it is not a limitation that can be engineered away
   without taking the decision off her.
2. **It has no error rate, for the same reason the gate has none.** The
   score is calibrated on 38 pairs
   (`docs/design/revocation-store-gate.md` §4) and a calibration is not a
   rate. A pair of genuinely distinct rules that share their content
   words will be reported, and two statements of one rule with no shared
   vocabulary will not be. The injection harness that would produce a
   real number is filed in `docs/ideas.md` under 2026-10-23 as "Two of
   our label families have no measured error rate, and one harness shape
   produces both", and it is not built here.
3. **It reports within one project's tuning record.** A rule duplicated
   across two project stores is two records, and nothing in this
   repository joins them. That is a consequence of the store being
   per-project, which is a product decision outside this change.
4. **`ursa consent show` is the only backward-looking surface.** The
   dashboard overlay and the MCP read both filter `status !== 'revoked'`
   and neither mentions twins, so a user who only ever sees the dashboard
   does not see this report. Wiring it into the overlay needs the panel
   markup in `docs/design/tuning-dashboard.md`, which is the frontend
   seat's open board item and has no pull request yet.

## 8. Tooling

| Tool | Version | Its job here | Why it, over what else was considered |
|---|---|---|---|
| TypeScript compiler, `tsc` | 5.7.2 (`devDependencies`, run by `npm run typecheck` and as the first half of `npm test`) | Proves the two new exported types are satisfied at both call sites, and that the structural `{ axioms: TuningAxiom[] }` parameter accepts a `TuningRecord`, a `mergeDistill` result and a test fixture without a cast | The alternative was a `TuningRecord` parameter, which compiles equally well and would have forced every caller holding a partial record to assemble a whole one. The structural type is what makes "this function cannot read a file" readable from the signature |
| Vitest | 5.0.2 (`devDependencies`, the second half of `npm test`) | Runs the 12 new cases in the 30-case guarantee suite, and the 815-case full suite that proves the six `status !== 'revoked'` readers are unaffected | Already the project's only test runner. A consent guarantee proven in a second runner would be a guarantee nobody runs by accident |
| `tsx` | 4.19.2 (`devDependencies`) | Runs `src/bin/ursa.ts` directly for the end-to-end capture in §6, with no build step between the source under review and the output quoted | The built bundle (`dist/ursa.cjs`) would also run it, and was rejected for the capture because a stale bundle would have quoted output from code that is not in this change. The bundle is verified separately in §5 step 4 |
| esbuild | 0.28.0 (`devDependencies`, invoked by `build/bundle.mjs`) | Rebuilds `dist/ursa.cjs` after the source edit, which two digest tests compare against a rebuild | Not chosen here. It is the project's existing bundler and this change only had to rerun it |
| `src/tuning/revocation.ts` `revocationSimilarity()`, `THETA_REVOKED` | in-repo, added 2026-10-23 | The score and the threshold both reports use | Argued in §4. A second score or a second threshold would let the store and the report disagree about whether two statements are one rule |
| `src/normalize.ts` `normalize()`, `src/match.ts` `tokens()`, `containment()` | in-repo, no version | Reached indirectly, through `contentTokens` and `revocationSimilarity` | Unchanged by this work, named because the explainability claim in §6 bottoms out in them: the four content tokens quoted there are what these three functions return |
| `@huggingface/transformers` | 4.3.0, an `optionalDependencies` entry | **Rejected**, and for one reason beyond the three the gate document already gives | The gate's reasons hold unchanged (an optional dependency can be absent at runtime, a cosine is not inspectable by the user whose revocation it is, and the ranker writes an embedding cache to disk). The additional one is specific to a report: this output tells her two statements are the same rule and prints both so she can check. An embedding score she cannot reproduce makes that sentence unauditable, which would leave her taking the product's word for it inside the one command built so she does not have to |
| `gh` | 2.101.0 on the runner | Read-only observation (`gh pr list`, `gh pr view`) and opening this run's pull request | — |

## 9. Terms

- **Axiom** — one inferred preference in `.ursa/tuning.json`: a portable
  rule, a domain tag, a polarity, and evidence pointers back to the
  outcome record steps that ground it. `TuningAxiom` in
  `src/tuning/types.ts`.
- **Tombstone (of an axiom)** — an axiom with `status: 'revoked'`. Kept
  rather than deleted, because the store has to know what not to do
  again. Excluded from every export.
- **Twin (of a revoked axiom)** — a live axiom, meaning one whose status
  is `active` or `user-edited`, whose statement scores at or above
  `THETA_REVOKED` against a tombstone's statement. Introduced by this
  change as `RevocationTwin`.
- **Live axiom** — an axiom with status `active` or `user-edited`. The
  two values the six export filters let through when they test
  `status !== 'revoked'`.
- **The create branch** — the path in `mergeDistill` taken when
  `DistilledAxiom.matchesExisting` is null, which builds a new axiom with
  a fresh id. The path that produced every pair this document is about.
- **Declared match** — `DistilledAxiom.matchesExisting`, the existing
  axiom id the model says its statement restates. Model-supplied, which
  is why it was never enforcement.
- **Content token** — what is left of a statement after normalization,
  tokenization, removal of `STATEMENT_STOPWORDS` and the four-suffix
  fold in `foldSuffix`. The unit the score is computed over.
- **`THETA_REVOKED`** — the single number both the gate's block and this
  report are explainable from, 0.55. Calibrated on 38 pairs in
  `docs/design/revocation-store-gate.md` §4, which is a calibration and
  not an error rate.
- **Negative control (in §5 step 2)** — a test case that asserts an
  output is absent. It passes whether or not the feature works, so it
  guards against over-reporting and is not evidence that the feature is
  needed.
- **Forward-only (of the gate)** — the property that
  `findRevocationBlock` is called on a candidate statement during a
  distillation pass, so it can decide about statements arriving after a
  revocation and about no axiom that already exists.

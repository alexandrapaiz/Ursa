# Corroborated descent: separating "similar to" from "derived from"

Engineer artifact, 2026-10-06 (second dispatch). Sprint item 2 of
`docs/sprints/sprint-2026-10-05.md`, serving O1 KR1.1. Written to the
engineering-artifact standard in `prompts/engineer-agent.md`: a system
diagram whose nodes are real, TypeScript signatures at every boundary,
on-disk layouts with a real payload, exact commands, a versioned tooling
list, and no bare terms.

---

## 1. The defect, stated as a claim the record was making

`resolve()` in `ursa-major/src/resolve.ts` classifies each span of the
finished work in two passes. Pass 1 looks for the span's text inside a
generation under whitespace normalization and labels a hit
`survived_verbatim`. Pass 2 runs a fuzzy match over generation segments,
takes the best score, and if that score clears `THETA_HIGH` (0.6, in
`src/match.ts`) labels the span `survived_mutated` and attaches a
word-level diff from the generation's text to the final text.

That diff is the single most commercially distinctive object in the
artifact. `CLAUDE.md` §1 sells it in these words: "kept but edited. The
mutation *is* the correction, expressed as an edit rather than a
complaint."

A similarity score cannot establish it. The score says two strings
resemble each other. The label says a person had one of them in front of
them and produced the other. Those are different claims, and until this
change the second was emitted on the evidence of the first.

### 1.1 What that looked like on this repository's own history

Measured, not supposed. The command is in §5.1. One record of the seven
produced by `ursa run` over a clone of this repository at
`26c18ca` with all 95 refs fetched, episode
`ursa-probe-2026-10-04-4d7e8b7`, final commit subject "The PM creates
seats and switches them on or off (HQ decision 046, vendored)", file
`docs/standards/pm.md`. Seven spans of that file were labelled
`survived_mutated`. Here are three of them, as the record stated them:

| generation text (the model's, per the record) | final text (the finished work) | score | what the record claimed happened |
|---|---|---|---|
| `Two tiers, company-` | `Three tiers, company-` | 0.738 | the owner edited "Two" into "Three" while keeping the model's sentence |
| `curl -s -X POST "$BOARD_API_URL/api/items" -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" -H "Content-Type: application/json" \` | `curl -s -X POST "$BOARD_API_URL/api/messages" -H "Authorization: Bearer $BOARD_RUNTIME_TOKEN" -H "Content-Type: application/json" \` | 0.948 | the owner corrected the endpoint from `/api/items` to `/api/messages` |
| `The daily standup reads the board before `gh pr list`.` | `**Read the inbox first**, before the board, before `gh pr list`.` | 0.661 | the owner reordered the standup's priorities by hand |

None of those edits were made by the owner, and none were made in this
repository. `docs/standards/pm.md` is a **vendored file**: it is a copy
of a standard that lives in `github.com/alexandrapaiz/alexandra-systems`
and is re-vendored into Ursa when HQ changes it (`CLAUDE.md`, "The
holding company"). The final text came in whole, on a sibling branch, in
commit `b59add9` on `exo/vendor-pm-2026-10-05`, whose subject is
literally "Re-vendor `docs/standards/pm.md` from HQ main @ 683c7dd". The
`/api/items` → `/api/messages` change was written by HQ, in another
repository, by someone who has never seen Ursa's resolver.

So the record was not merely imprecise. It took seven changes authored
elsewhere and sold them as this user's corrections of this model, one of
them at score 0.948, which is exactly the confidence band a lab would
weight most heavily. A missing label costs one record. A fabricated one
teaches the model that a person it has never met prefers something they
never said.

### 1.2 Why no threshold fixes it

The ledger entry that opened this (`docs/ideas.md`, 2026-10-02) arrived
at the same conclusion from a synthetic case: two agent branches each
wrote a `formatItem` function, the human kept branch B's, and branch A's
generation came back `survived_mutated` with a diff from A's line to B's
line.

Raising `THETA_HIGH` does not help, and the `0.948` row above is the
proof. The rival text scores *higher* than much of the genuine
correction signal in the same record, because a re-vendored file is a
near-copy of the one it replaces. There is no threshold that admits real
edits and refuses imports.

Nor is the fix a better scorer. `resolveEpisode` builds generations only
from the episode's own `generatedSha`, so branch B's generation — and
HQ's re-vendored blob — is not in the record at all. There is nothing to
tie-break against. **The evidence that settles it is outside the record,
and it is git.**

---

## 2. The test, and the one exclusion that makes it usable

> If the span's text is present **verbatim** in a commit that is **not a
> descendant of the generation**, then the text has a source other than
> editing this generation, and the mutation claim is dropped.

Two relations qualify, and both are rivals:

- **`sibling`** — the commit is neither an ancestor nor a descendant of
  the generation. Another branch's work, which the person merged or
  checked out rather than typed. All seven real demotions in §1.1 are
  this.
- **`pre_existing`** — the commit is an ancestor of the generation. In
  practice this is a *restore*: an ancestor held the text, the generation
  replaced it, and the person put it back. See §8.1; the obvious reading
  of this relation turned out to be unreachable, and a failing test is
  what established which shape produces it.

Descendants of the generation are excluded, and that exclusion is the
whole reason the test is not vacuous: `finalSha` is a descendant of
`generatedSha` by construction, and its blob holds every final span by
definition. A test that did not exclude descendants would demote every
mutation in every record.

**What a demotion does and does not assert.** It does not assert that
nothing happened. The person did reject the generation's wording, and
that rejection is still in the record: the span keeps the score and the
rival text as `candidate`, is flagged `uncertain` for adjudication, and
the generation segment it no longer claims is reported
`generated_deleted`. What the demotion refuses is the stronger claim the
`diff` field makes — that the final text was *composed* by editing this
generation. Text that already existed verbatim elsewhere was not
composed here.

**What it does when it cannot tell: nothing, loudly.** The label stands
and carries `basis: 'unverified'` with the reason named. This is the
opposite of the choice `src/deletion.ts` makes, and the asymmetry is
deliberate. There, silence defaulted toward blaming the person, so an
unreadable boundary had to become `unknown`. Here, demoting on a hole in
the clone would delete real correction signal — the scarcest thing in the
artifact — on no evidence at all.

---

## 3. System diagram

Every node below is a file that exists in the repository at the commit
this document ships on. Every edge is labelled with the type or file
format that crosses it, not with a verb.

```
                         ursa-major/src/bin/ursa.ts
                         (the `ursa run` entry point; the only
                          place in this path that invokes git)
                                      │
            ┌─────────────────────────┼──────────────────────────┐
            │ CommitInfo[]            │ Episode                  │ DescentCorroborator
            │ (one graph read         │ (generatedSha,           │ (closure over
            │  for the whole run)     │  finalSha, touchedFiles) │  projectPath + graph)
            ▼                         ▼                          ▼
  ursa-major/src/pairfinder.ts   ursa-major/src/episodes.ts   ursa-major/src/corroborate.ts
  ├─ listCommits()               └─ buildEpisodes()           ├─ relatives()
  │    → CommitInfo[]                                         │    → {ancestors, descendants}
  ├─ commitsTouchingPath()  ◀── string repoPath, string path ─┤      (Set<string>, in memory)
  │    → PathCommit[] | null  ── PathCommit[] ───────────────▶│
  └─ blobLookup()           ◀── string sha, string path ──────┤
       → BlobLookup                                           │
         {present,text}|{absent}|{unreadable} ───────────────▶ │
                                                              │
                                      ┌───────────────────────┘
                                      │ DescentEvidence
                                      │ (one per above-threshold span)
                                      ▼
                         ursa-major/src/resolve.ts
                         (Pass 2, the `best.score >= THETA_HIGH` branch;
                          pure — reads no git, calls the injected hook)
                                      │
                                      │ FinalSpan with `descent` set
                                      ▼
                         ursa-major/src/types.ts
                         (FinalSpan.descent: DescentEvidence)
                                      │
             ┌────────────────────────┼─────────────────────────┐
             │ OutcomeRecord          │ OutcomeRecord           │ OutcomeRecord
             ▼                        ▼                         ▼
  ursa-major/src/store.ts   ursa-major/src/invariants.ts   ursa-major/src/viewer.ts
  └─ saveRecord()           ├─ checkRecord()               └─ renderViewer()
       → outcome_record.json│    → Violation[] incl.             → outcome_record.html
                            │      DESCENT_CHECKED_UNIFORMLY
                            └─ measure()
                                 → Measurement.descentChecked,
                                   .descentUnverified,
                                   .descentDemoted
                                      │ Measurement
                                      ▼
                         ursa-major/src/invariants.cli.ts
                         └─ runGate() → string[] (stdout)
```

Two edges are worth naming explicitly because they are the design:

- **`src/resolve.ts` has no inbound edge from `src/pairfinder.ts`.**
  There is no arrow from any git-reading function into the resolver. That
  is what keeps `resolve()` a pure function of its input, which is what
  lets the chat path (`src/cli.ts`) resolve a pasted conversation in a
  directory that is not a git repository at all.
- **`CommitInfo[]` flows from `listCommits()` into `corroborate.ts`, not
  back out.** The ancestor and descendant sets are computed once per
  generation commit, in memory, from edges the pair walk already read.
  The alternative — `git merge-base --is-ancestor` per candidate commit —
  is one subprocess per question, and the questions are per (path,
  commit).

---

## 4. Interfaces at every boundary

Real signatures, as a caller would write them.

### 4.1 The hook, on `ResolveInput` (`ursa-major/src/resolve.ts`)

```ts
export interface ResolveInput {
  taskId: string
  files: Array<{ path: string; text: string }>
  conversations: ConversationMeta[]
  generations: RawGeneration[]
  finished: boolean
  generatedAt?: string
  artifact?: Artifact
  attributeDeletion?: (filePath: string, spanText: string) => DeletionAttribution
  /** asked once per span the fuzzy pass scores above THETA_HIGH */
  corroborate?: (filePath: string, spanText: string) => DescentEvidence
}
```

The shape deliberately mirrors `attributeDeletion`, which landed on
2026-10-04 for the same reason: a question the resolver cannot answer
from its input, answered at the edge and injected. Both take `(filePath,
spanText)` and return a discriminated union rather than a boolean, so an
"I could not tell" answer has somewhere to go.

### 4.2 The verdict (`ursa-major/src/types.ts`)

```ts
export type DescentEvidence =
  | { basis: 'corroborated'; rivalsSearched: number }
  | { basis: 'rival'; sha: string; subject: string; relation: 'pre_existing' | 'sibling' }
  | {
      basis: 'unverified'
      reason: 'span_too_short' | 'unreadable_blob' | 'path_history_unreadable' | 'rival_search_capped'
      sha?: string
    }

export interface FinalSpan {
  start: number
  end: number
  text: string
  class: SpanClass
  score?: number
  source?: SourcePointer
  diff?: DiffPart[]
  uncertain?: boolean
  candidate?: { score: number; text: string; source: SourcePointer }
  trivial?: boolean
  lifespan?: SpanLifespan
  descent?: DescentEvidence
}
```

`descent` is optional, and its absence is load-bearing: it means **the
check never ran**, not that it passed. A chat-path record has no
repository to ask, and `basis: 'corroborated'` there would be a claim
nobody checked. `rivalsSearched` is on the passing arm for the same
reason — zero rivals searched and zero rivals found are both "no rival",
and only one of them is evidence.

### 4.3 The corroborator (`ursa-major/src/corroborate.ts`)

```ts
export interface DescentCorroborator {
  (filePath: string, spanText: string): DescentEvidence
}

export const MAX_RIVAL_BLOBS: number  // 40

export function gitDescentCorroborator(
  projectPath: string,
  generatedSha: string,
  commits: CommitInfo[],
): DescentCorroborator
```

### 4.4 The git primitives (`ursa-major/src/pairfinder.ts`)

```ts
export interface CommitInfo {
  sha: string
  authorName: string
  authorEmail: string
  date: string
  trailers: string
  subject: string
  /** parent shas in git's order; length > 1 = a merge */
  parents: string[]
}

export interface PathCommit {
  sha: string
  subject: string
}

/** null means the question could not be asked, which is not "no commit touched it" */
export function commitsTouchingPath(repoPath: string, path: string): PathCommit[] | null

export type BlobLookup =
  | { kind: 'present'; text: string }
  | { kind: 'absent' }
  | { kind: 'unreadable' }

export function blobLookup(repoPath: string, sha: string, path: string): BlobLookup
```

`commitsTouchingPath` returning `PathCommit[] | null` rather than
`PathCommit[]` is the same three-state discipline `blobLookup` already
enforces, and for the same reason recorded in `src/deletion.ts`'s header:
a two-state read turns a hole in the repository into a positive finding.

### 4.5 The episode resolver (`ursa-major/src/bin/ursa.ts`)

```ts
export function resolveEpisode(
  projectPath: string,
  ep: Episode,
  commits?: CommitInfo[],
): OutcomeRecord | null
```

`commits` is optional and defaults to `listCommits(projectPath)`, so
corroboration is **on by default** for every caller of `resolveEpisode`
— including `src/adapters/cli.ts`, `tools/measure-attribution.ts` and
the 21 call sites in the test suite. Passing it explicitly is an
optimisation `ursa run` takes because it resolves many episodes against
one graph.

### 4.6 The bound (`ursa-major/src/invariants.ts`)

```ts
export type InvariantCode =
  | 'CLAIM_NOT_WIDER'
  // ... nine more ...
  | 'SIGNAL_QUOTE_GROUNDED'
  | 'DESCENT_CHECKED_UNIFORMLY'

export interface Measurement {
  // ... fields from the previous eleven bounds ...
  descentChecked: number
  descentUnverified: number
  descentDemoted: number
}

export function checkRecord(record: OutcomeRecord): Violation[]
export function measure(record: OutcomeRecord): Measurement
```

`DESCENT_CHECKED_UNIFORMLY` is the first of the twelve bounds that is
about whether a claim was *checked* rather than about whether two numbers
agree, which is why its two clauses are both about absence:

1. No span still labelled `survived_mutated` carries a `rival` verdict.
   That is the only way the demotion can be computed and then not reach
   the label, and such a span would simultaneously name the evidence
   against its own descent and keep the diff asserting it.
2. If any span in the record carries a descent verdict, every
   `survived_mutated` span carries one. This catches a corroborator wired
   for some files and not others, where part of the record's mutation
   labels are unguarded while the record as a whole looks guarded.

---

## 5. Exact commands

### 5.1 Reproducing the measurement in §1.1

Literal invocations, in order. `<you>` stands in for the home directory
per the redaction rider in `prompts/engineer-agent.md`; everything else
is as typed.

```sh
# 1. A clone with every ref, because the rival commits are the ones a
#    single-branch clone cannot see. --no-local forces real object
#    transfer rather than hardlinking, so the clone is a clone.
git clone --no-local /Users/<you>/src/Ursa /tmp/ursa-probe
git -C /tmp/ursa-probe remote add gh https://github.com/alexandrapaiz/Ursa.git
git -C /tmp/ursa-probe fetch --no-tags gh '+refs/heads/*:refs/remotes/gh/*'

# 2. Confirm the population: 95 refs, 447 commits reachable.
git -C /tmp/ursa-probe for-each-ref --format='%(refname)' | wc -l
git -C /tmp/ursa-probe rev-list --all --count

# 3. Resolve. 7 work units, 7 records, under /tmp/ursa-probe/.ursa/records/
cd /Users/<you>/src/Ursa/ursa-major
npm ci
npx tsx src/bin/ursa.ts run /tmp/ursa-probe --limit 40

# 4. The gate, which prints the three descent measurements per record.
npx tsx src/invariants.cli.ts /tmp/ursa-probe/.ursa/records

# 5. The rival commit named by the demotions, read straight from git.
git -C /tmp/ursa-probe log -1 --format='%H %s' b59add9
git -C /tmp/ursa-probe branch -a --contains b59add9
```

Step 5 prints:

```
b59add91b3908c27055f3a5cf59c04170ae562c3 Re-vendor docs/standards/pm.md from HQ main @ 683c7dd
  remotes/gh/exo/vendor-pm-2026-10-05
```

### 5.2 The before/after comparison

The baseline is `origin/main`'s resolver against the same clone, run from
a worktree so no files are edited:

```sh
cd /Users/<you>/src/Ursa
git worktree add /tmp/ursa-before origin/main
ln -s /Users/<you>/src/Ursa/ursa-major/node_modules /tmp/ursa-before/ursa-major/node_modules
rm -rf /tmp/ursa-probe/.ursa
cd /tmp/ursa-before/ursa-major && time npx tsx src/bin/ursa.ts run /tmp/ursa-probe --limit 40

rm -rf /tmp/ursa-probe/.ursa
cd /Users/<you>/src/Ursa/ursa-major && time npx tsx src/bin/ursa.ts run /tmp/ursa-probe --limit 40

# Count span classes in whichever run just finished.
python3 -I -c "
import json,glob,collections
c=collections.Counter()
for p in glob.glob('/tmp/ursa-probe/.ursa/records/*.json'):
    for f in json.load(open(p))['files']:
        for s in f['spans']: c[s['class']] += 1
print(dict(c))
"

rm -f /tmp/ursa-before/ursa-major/node_modules
git worktree remove --force /tmp/ursa-before
```

Results, same clone, same 7 records:

| | `survived_mutated` | `no_generation_provenance` | `survived_verbatim` | wall clock |
|---|---|---|---|---|
| `origin/main` | 47 | 451 | 1,074 | 3.918 s |
| this change | 40 | 458 | 1,074 | 4.418 s |

**7 of 47 mutation labels on real history — 15% — were corrections
nobody made.** `survived_verbatim` is untouched, which is the control:
Pass 1 is not in this change's path and its count must not move.

Verdict distribution across all seven records: 30 `corroborated`, 7
`rival` (all `sibling`), 10 `unverified` — and every one of the ten is
`span_too_short`, the length floor declining to guess. No
`unreadable_blob`, no `rival_search_capped`, no
`path_history_unreadable`: on a complete clone the search settles every
question it is long enough to ask.

### 5.3 The checks this change admits

```sh
cd /Users/<you>/src/Ursa/ursa-major
npm test                              # tsc --noEmit && vitest run
npx vitest run src/corroborate.test.ts # the ten cases in §6
npx vitest run src/invariants.test.ts  # includes the six for the new bound
```

`npm test` on this branch: **411 passed, 4 skipped, 0 failed**, over 25
test files. Fifteen of those are new (10 in `src/corroborate.test.ts`, 5
in `src/invariants.test.ts`); the other 396 existed before this change
and were run unmodified with corroboration **on by default**, per §4.5.
That is the regression evidence: no existing fixture's labels moved.

---

## 6. On-disk layout, with a real payload

Nothing new is written to disk. The `descent` field is added inside the
existing record, at the existing path.

```
<project>/.ursa/
├── episodes.json                       # Episode[], unchanged
└── records/
    └── <slug>-<YYYY-MM-DD>-<sha7>.json # OutcomeRecord, one new field per span
```

A real demoted span, lifted verbatim from
`/tmp/ursa-probe/.ursa/records/ursa-probe-2026-10-04-4d7e8b7.json`,
`files[].path == "docs/standards/pm.md"`. Character offsets and the
`candidate.source` block are as emitted; `text` is the real text of a
public vendored standard, so there is nothing here to redact:

```json
{
  "start": 25667,
  "end": 25798,
  "text": "curl -s -X POST \"$BOARD_API_URL/api/messages\" -H \"Authorization: Bearer $BOARD_RUNTIME_TOKEN\" -H \"Content-Type: application/json\" \\",
  "class": "no_generation_provenance",
  "uncertain": true,
  "candidate": {
    "score": 0.948,
    "text": "curl -s -X POST \"$BOARD_API_URL/api/items\" -H \"Authorization: Bearer $BOARD_RUNTIME_TOKEN\" -H \"Content-Type: application/json\" \\",
    "source": {
      "conversationId": "git-4d7e8b7",
      "model": "Claude Fable 5.1 <noreply@anthropic.com>",
      "turnIndex": 1,
      "generationIndex": 0,
      "start": 18020,
      "end": 18148
    }
  },
  "descent": {
    "basis": "rival",
    "sha": "b59add9",
    "subject": "Re-vendor docs/standards/pm.md from HQ main @ 683c7dd",
    "relation": "sibling"
  },
  "lifespan": {
    "revisionsChecked": 1,
    "unitsTraced": 1,
    "unitsSurviving": 1,
    "survivingChars": 131,
    "decayedChars": 0,
    "intactRevisions": 1,
    "intactSeconds": 387,
    "diedAtSha": null,
    "diedAt": null,
    "liveAtTip": true,
    "fate": "durable",
    "basis": "token-containment",
    "skipped": null
  }
}
```
Read it against what `origin/main` emitted for the same span, captured by
running main's resolver from a worktree over the same clone (§5.2). Same
`score`, same `source`, and this `diff`:

```json
[
  { "value": "curl -s -X POST \"$BOARD_API_URL/api/" },
  { "value": "items", "removed": true },
  { "value": "messages", "added": true },
  { "value": "\" -H \"Authorization: Bearer $BOARD_RUNTIME_TOKEN\" -H \"Content-Type: application/json\" \\" }
]
```

That is the owner, on the record, correcting an endpoint name that HQ
changed in another repository. `removed`/`added` is `diffWords`' own
vocabulary for a human edit, and `src/signals.ts` reads these parts to
build the `oneShotCorrections` entries Ursa Minor sells.

The `model` field is worth one line of explanation, since it looks like a
bug and is not: `resolveEpisode` sets it from `ep.agentMarker`, which is
the Co-Authored-By trailer value, so it carries the trailer's full
`Name <email>` form rather than a bare model id. Pre-existing, unrelated
to this change, and recorded in the ledger on this branch.

**Why `subject` is not redacted.** `DescentEvidence.subject` is a commit
subject line, and `rawStringsOf` in `src/disclosure.ts` already treats
`DeletionAttribution.mergeSubject` as metadata rather than as raw user
text. Adding `descent.subject` to the disclosure audit would be a
behaviour change to the audit on no evidence; the two fields are the same
kind of string and are treated the same way. Noted here rather than left
implicit, because "which strings are raw" is exactly the question
Incident 4 was about.

---

## 7. Tooling

Every tool the change touches, with version, job, and why it rather than
the alternative that was considered.

| Tool | Version | Its job here | Chosen over |
|---|---|---|---|
| `git` (the `git` binary, invoked via `execFileSync`) | 2.55.0 (the version these measurements were taken with; no flag newer than git 2.5 is used, so the floor is well below it) | `log --all --pretty=format:%H%x09%s -- <path>` enumerates candidate rival commits; `show <sha>:<path>` and `ls-tree` read and classify blobs | A JavaScript git implementation (`isomorphic-git`). Rejected: it is a new runtime dependency on a project whose steady-state cost is $0 and whose own history is the test corpus, and `execFileSync` on the system `git` is already how all 490 lines of `src/pairfinder.ts` work. Also rejected: `git merge-base --is-ancestor` per candidate, which is correct but one subprocess per question — §3 explains the in-memory graph walk that replaces it. |
| TypeScript | 5.7.2 (`devDependencies`) | `tsc --noEmit` is the first half of `npm test`. Making `DescentEvidence` a discriminated union rather than `{ ok: boolean, reason?: string }` is what makes `basis: 'rival'` imply `sha` and `relation` at the call site in `resolve.ts` | A boolean return. Rejected because "could not tell" has no representation in a boolean, and `src/deletion.ts`'s header records what happened the last time a three-state answer was squeezed into two: every hole in the repository was absorbed by one label, always in the same direction. |
| Vitest | 5.0.2 (`devDependencies`) | Runs the 10 cases in `src/corroborate.test.ts` and the 6 added to `src/invariants.test.ts`; `npx vitest run <file>` for one file during development | `node:test`. Rejected only because the other 24 test files are already Vitest; there is no technical argument either way and consistency decides it. |
| `node:child_process` `execFileSync` | Node 22 (`@types/node` ^22.10.0) | The only way this change starts a process. `execFileSync` takes an argv array, so a path containing a space or a shell metacharacter is an argument and never a command | `exec`/`execSync` with an interpolated string, which would make any path with a quote in it a shell injection. This is the existing convention in `src/pairfinder.ts` and the change does not weaken it. |
| `diff` (npm) | ^8.0.2 (`dependencies`) | `diffWords` builds the `diff` array on a `survived_mutated` span. Not changed by this work; named because it is the producer of the exact field a demotion withholds | n/a — incumbent. |

No new dependency, no new service, no new account. Steady-state cost
stays $0, per the charter's boundaries.

---

## 8. What a reviewer should push on

Stated plainly, because the standard asks for explicitness rather than
confidence.

1. **`MIN_VERBATIM_LEN` is 12 normalized characters, and all ten
   `unverified` verdicts on real history hit that floor.** Ten spans of
   the 47 are therefore unguarded. The floor is not arbitrary — it is the
   same constant Pass 1 uses to decide that containment is evidence, and
   below it `return null` (eleven characters, in every TypeScript project
   ever written) would demote every short edited line in the record. But
   it does mean short real corrections are exactly the ones this bound
   cannot see, and `descentUnverified` exists so that is a number rather
   than a silence.
2. **`MAX_RIVAL_BLOBS` is 40 and was not reached on real history.** On a
   repository with a long-lived heavily-branched file it will be, and the
   answer then is `rival_search_capped`, which keeps the label. That is
   the conservative direction for signal and the permissive direction for
   fabrication, which is the opposite of the trade §2 makes everywhere
   else. It is a cap on work and it should be revisited the first time a
   real run reports one.
3. **A demotion costs `survivalRate`.** Dropping the claim drops it on
   the generation side too, so the generation segment becomes
   `generated_deleted` and the record's survival rate falls. That is
   correct — the segment did not survive — but survival is the product's
   headline number, and this change lowers it by design. On the probe,
   seven spans moved; on a repository that vendors heavily, more will.
4. **Merges are included in the rival walk, unlike every other walk in
   `pairfinder.ts`.** Elsewhere a merge is refused because its diff is
   other commits' work restated. Here the question is not who wrote the
   text but whether it existed outside this generation, and a human
   resolving a conflict really can write a line into the merge's tree
   that is in neither parent. Including merges costs blob reads and
   risks nothing; excluding them would hold a mutation label nobody
   performed.

### 8.1 The relation a failing test corrected

Recorded because it changed the artifact and not only the code. The first
fixture written for `pre_existing` had the human write a line, the agent
commit a file still containing it, and the human then edit their own
line. It failed, and the failure was right: the *edited* line exists in
no earlier commit, so there is no rival, and `survived_mutated` is the
honest label. Pre-existing text that survives untouched never reaches
Pass 2 at all, because the verbatim pass claims it first.

The shape that does reach Pass 2 is a **restore**: an ancestor holds X,
the generation replaces it with Y, the person puts X back. `types.ts`'s
description of the relation had been written from the wrong shape and is
corrected on this branch. A test that had been written to pass would have
left a wrong sentence in the type.

---

## 9. Rollback

One revert, no migration, no data change.

```sh
git revert --no-commit <merge sha of this PR>
```

`descent` is an optional field. A record written by this branch and read
by the reverted code deserializes and renders unchanged — `viewer.ts`
reads `class`, `uncertain` and `candidate`, all of which a demoted span
carries, and `src/invariants.ts` without `DESCENT_CHECKED_UNIFORMLY`
simply does not look at `descent`. The only visible effect of a revert is
that the seven spans in §1.1 go back to being sold as the owner's
corrections. Nothing has to be re-resolved for correctness; re-running
`ursa run` is how you would get the labels back, not a repair step.

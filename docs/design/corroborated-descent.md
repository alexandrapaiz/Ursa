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
  this. Since 2026-10-14 this relation also requires the commit to have
  existed while the person was working, which is §10.
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
  /** the episode's finalSha; see §10. Omitted = no time bound, the chat path. */
  horizonSha?: string,
): DescentCorroborator

/** the §10 time bound, as a predicate over one candidate sha */
export function authoredAfterHorizon(
  commits: CommitInfo[],
  generatedSha: string,
  horizonSha: string | undefined,
): (sha: string) => boolean
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
npx vitest run src/corroborate.test.ts # the eleven cases described in §2 and §8.1
npx vitest run src/invariants.test.ts  # includes the five for the new bound
```

`npm test` on this branch: **412 passed, 4 skipped, 0 failed**, over 25
test files. Sixteen of those are new (11 in `src/corroborate.test.ts`, 5
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
| `git` (the `git` binary, invoked via `execFileSync`) | 2.55.0 (the version these measurements were taken with; no flag newer than git 2.5 is used, so the floor is well below it) | `log --all --pretty=format:%H%x09%aI%x09%s -- <path>` enumerates candidate rival commits and their author dates (the date field was added 2026-10-15; see §11.6 for why it sits before the subject); `show <sha>:<path>` and `ls-tree` read and classify blobs | A JavaScript git implementation (`isomorphic-git`). Rejected: it is a new runtime dependency on a project whose steady-state cost is $0 and whose own history is the test corpus, and `execFileSync` on the system `git` is already how all 490 lines of `src/pairfinder.ts` work. Also rejected: `git merge-base --is-ancestor` per candidate, which is correct but one subprocess per question — §3 explains the in-memory graph walk that replaces it. |
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

---

## 10. The horizon bound (added 2026-10-14)

### 10.1 The defect

`sibling` asserts that the person "merged or checked out rather than
typed" the text. That assertion requires the other branch's commit to
have existed while they were working, and until 2026-10-14 nothing in
`src/corroborate.ts` read a date at all: the module partitioned the
commit graph into ancestors, descendants and the rest, excluded
descendants, and applied no time bound.

So a commit authored after the episode closed could be named as the
source of the episode's text, and one was, on a shipped record.
`ursa-2026-10-07-2f610e9` named rival `510a55a` — authored
2026-10-14T00:26:39Z, at the time on the unmerged branch
`ursa-pm/2026-10-14-message` — as holding text in `docs/sprints/pending.md`
for work whose final commit is dated 2026-10-07T06:32:09Z. A commit from
seven days in the future cannot be where the text came from.

The population was 7 spans over 298 characters, 0.2% of the verbatim
characters in the walk, measured by `tools/measure-verbatim-descent.ts`
on 2026-10-14 (`docs/ideas.md`, entry "A rival that did not exist yet is
still counted as the source of the text"). This is a correctness defect
rather than a load-bearing figure, and it matters because the relation it
corrupts is the only one that carries a claim about what the person did.

### 10.2 The rule, and the two things that make it narrower than a date compare

A candidate rival is dropped from the search when **all three** hold:

1. its author date is later than the author date of `horizonSha`, the
   episode's `finalSha`;
2. it is not an ancestor of `generatedSha`;
3. it is not an ancestor of `horizonSha`.

**The horizon is the episode's last commit, not its first.** A person can
legitimately branch mid-episode, write text elsewhere and bring it in, so
a rival authored after the generation is still a possible source. Only
work authored after they finished is unambiguously not one.

**The graph is asked before the clock.** Conditions 2 and 3 are the
carve-out. A commit reachable from the generation's history, or from the
horizon's, demonstrably existed by then whatever its author date says,
and rebases and wrong machine clocks make author dates lie in exactly
that direction. Condition 3 is not implied by condition 2: a branch
merged into the episode between `generatedSha` and `finalSha` is a
*sibling* of the generation and an *ancestor* of the horizon, and
dropping it on its date would report a corroboration over evidence the
search was holding. `src/corroborate.test.ts` has that case as
"still searches a branch the episode merged in, however its author date
reads", with an author date of 2027-06-01 on a commit the person merged.

**An unknown date never drops a candidate.** An absent `horizonSha`, a
horizon missing from `commits` (a caller that passed a narrowed range),
an unparseable date, or a candidate missing from `commits` all leave the
candidate in the search, because dropping it would silently promote a
span on no evidence. Absent `horizonSha` is therefore exactly this
module's behaviour before 2026-10-14, which is what the chat path and the
single-span unit tests get.

**This is the one place the module trusts a timestamp.** A rewritten
history can lie to it: a sibling rebased to an older author date is
searched again, which is the old behaviour and therefore the safe
direction of failure.

### 10.3 Diagram delta

No node is added or removed from §3. One edge changes label:

- `src/bin/ursa.ts` → `src/corroborate.ts` previously carried
  `DescentCorroborator (closure over projectPath + graph)`. It now
  carries `DescentCorroborator (closure over projectPath + graph +
  horizonSha)`, and the sha that flows is `Episode.finalSha`, passed by
  `resolveEpisode` in `ursa-major/src/resolve-episode.ts` (the function
  `src/bin/ursa.ts` re-exports).
- One edge is added inside `src/corroborate.ts`:
  `authoredAfterHorizon()` → `rivalsFor()`, carrying
  `(sha: string) => boolean`, applied in the same `.filter()` that
  already drops descendants.
- `tools/measure-verbatim-descent.ts` gains an inbound edge from
  `src/corroborate.ts` carrying that same predicate type, so the
  measurement applies the shipped rule rather than a copy of it.

### 10.4 Exact commands

```sh
# From ursa-major/. Typecheck, then the four assertions this bound added.
npx tsc --noEmit
npx vitest run src/corroborate.test.ts

# The bound is load-bearing in two independent places. Disabling the time
# test fails two of them; removing the graph carve-out fails the third.
# (Run from a scratch copy of the file, then restore it.)
#   src/corroborate.ts: `if (Number.isNaN(horizonMs)) return () => false`
#     -> `return () => false`                     => 2 failures
#   src/corroborate.ts: drop `ancestors.has(sha) || horizonAncestors.has(sha)`
#                                                 => 1 failure

# The measurement over this repository's own history. Needs every ref,
# because the candidates that produce the defect are on branches a
# single-branch clone cannot see.
npx tsx tools/measure-verbatim-descent.ts /path/to/Ursa --limit 50 --examples 1
```

### 10.5 What the measurement said on 2026-10-14, after the fix

```
HORIZON BOUND — rivals authored after the episode's finalSha, which the shipped search now drops
  candidate rivals considered across every record's paths: 511
  candidates the bound dropped: 43 (over 1 record-paths)
  of those record-paths, still above the 40-blob cap after the drop: 1
  ursa-2026-10-07-2f610e9 docs/sprints/pending.md: 84 considered, 43 authored after 2026-10-07T06:32:09Z -> 41 searchable (cap 40)
  spans carrying a descent verdict, all classes: 2760
  verdict changed           0 spans          0 chars     0.0%
  future row above, from the shipped verdict: 0 spans (must be 0)
```

Read it in three parts, because the interesting number is not the one the
ledger entry's first step asked for.

**The acceptance criterion holds.** The `future` row is zero.

**No verdict changes on today's clone, and that is not evidence the bound
does nothing.** Two things happened between the measurement that found
the defect and this one. `510a55a`'s branch was merged, and the gate
shipped in PR #186 moved the parent check ahead of the rival walk, so the
thirteen spans of `ursa-2026-10-07-2f610e9` that have a rival at all are
now settled at `a26c245`, the generation's own parent, before the walk
that would have reached a future commit runs. The remaining five spans of
that record come back `rival_search_capped` both before and after the
bound, because the path has 41 searchable candidates against a
`MAX_RIVAL_BLOBS` of 40 — one over. The span-level diff is zero by one
commit.

**Where the bound does bite is the candidate level.** On that path it
removes 43 of 84 candidates: half the search, every one of them a commit
that cannot be a source, each costing a `git show` and a slot against the
cap. The slot is the part that compounds, because
`docs/sprints/pending.md` is appended to several times a day by the PM
seat, so the set of commits newer than any past episode grows daily and
would push the real candidates past the cap. That interaction is now a
ledger entry rather than a change here.

### 10.6 Rollback

```sh
git revert --no-commit <merge sha of the 2026-10-14 engineer PR>
```

No data change and no migration. `horizonSha` is an optional parameter
whose absence restores the previous search, records already written are
untouched, and nothing in `src/invariants.ts` reads a date, so no bound
starts failing on an old record. A revert's only effect is that a commit
authored after an episode closed can again be named as the source of its
text.

## 11. The date in the record, and the fourth relation (added 2026-10-15)

### 11.1 What §10 left unfinished

§10's bound runs inside `ursa-major/src/corroborate.ts`, a module that
holds the whole commit graph in memory. The record it writes held none
of it. The `rival` variant of `DescentEvidence` carried `sha`, `subject`
and `relation`, so a record naming a commit authored seven days after
its own work satisfied all sixteen bounds in
`ursa-major/src/invariants.ts`, and the only thing that could find the
defect was a tool that could re-read the repository.

That is the one property every other bound has and this claim did not:
checkable from the record alone. It is also the auditability story
`CLAUDE.md` §4 sells to labs, which is that a buyer can see what the
record's claims rest on without cloning anything.

Ledger entry: "A rival's date is not in the record, so a rival from the
future was invisible to every bound" (`docs/ideas.md`, 2026-10-14,
second pass).

### 11.2 Why a date alone would have been a bound a correct record fails

`ursa-major/src/invariants.ts` opens with two rules that kept its list
honest, and the second is: *anything that can be legitimately false is a
measurement, not an invariant.* A date-only bound breaks it.

§10.2's rule drops a candidate only when the graph cannot place it:
condition 2 is "not an ancestor of `generatedSha`" and condition 3 is
"not an ancestor of `horizonSha`". Condition 3 exists because a branch
the episode **merged** is a sibling of the generation and an ancestor of
the horizon, so it demonstrably existed while the person worked whatever
its author date says — and a rebase or a wrong machine clock routinely
makes that date say next year. `src/corroborate.test.ts` has carried
that exact fixture since 2026-10-14 ("still searches a branch the
episode merged in, however its author date reads"), with an author date
of `2027-06-01T00:00:00+00:00`.

A gate reading only dates would therefore have to choose between two
wrong things:

| Choice | What it does to the merged branch dated 2027 | What it does to the 2026-10-14 defect |
|---|---|---|
| Order every rival's date | refuses a record whose evidence the graph proved, which rule 2 forbids | catches it |
| Order no rival's date | leaves it alone, correctly | misses it, which is the status quo §11 exists to change |

The problem is not the bound. It is that `relation` named two
populations with the same word.

### 11.3 The fourth relation

`sibling` held both "a branch the episode merged, which the graph places
inside the work" and "a branch the graph cannot place anywhere, where
the only thing standing between *the person took this text from here*
and *this commit did not exist yet* is an author date". They are split:

| Relation | Graph position | Is its date load-bearing? |
|---|---|---|
| `prior_revision` | the generation's own parent commit | No. An ancestor existed by definition; the date is reported and never ordered. |
| `pre_existing` | an older ancestor of the generation, the parent not holding the text | No, for the same reason. |
| `merged_in` | not an ancestor of the generation, and an ancestor of the episode's final commit: a branch this episode merged | No. The graph places it inside the work; this is §10.2's condition 3, given a name. |
| `sibling` | reachable from neither the generation nor the episode's final commit | **Yes.** Nothing in the graph places this commit inside the work, so the claim rests entirely on the date being early enough for the text to have been available. |

With the populations named, the record-side bound is the same rule as
the resolver's rather than a weaker one: the three relations the graph
vouches for are exempt by name, and the one that is left is the one
`authoredAfterHorizon` itself bounds by date.

`merged_in` is also the more accurate verdict on the case this whole
module was written for. The branch-B fixture in
`src/corroborate.test.ts` has the person merging branch B into branch A
with `git merge -X theirs`, so the rival commit is an ancestor of the
episode's final commit. Before today the record said "a branch this
generation is not an ancestor of". It now says the stronger and truer
thing: a branch this work merged, so the person had it in front of them.

### 11.4 The seventeenth bound

`RIVAL_NOT_AFTER_FINAL`, in `ursa-major/src/invariants.ts`. Three
independent failure modes, each with a committed counterexample under
`ursa-major/fixtures/violations/`:

| Clause | Fires when | Fixture |
|---|---|---|
| Ordering | a `sibling` rival's `date` parses to an instant later than `task.generatedAt` | `rival-not-after-final.json` |
| Readability | any rival's `date` is present and `Date.parse` returns `NaN`, whatever the relation, because a date the record cannot have read from git is decorative and still prints as provenance on every surface | `rival-not-after-final-unreadable-date.json` |
| The horizon itself | at least one `sibling` rival carries a date and `task.generatedAt` does not parse, so nothing can be ordered against the work. Fires once for the record, naming `task.generatedAt` | `rival-not-after-final-unreadable-horizon.json` |

An **absent** date is legal and unchecked. Every record written before
2026-10-15 carries rivals without one, and a bound requiring the field
would make all of them illegal — the mistake `RESOLVER_IDENTIFIED`
avoided on 2026-10-13 by leaving an absent `task.resolvedBy` alone.
Absence is also genuinely reachable today: `prior_revision` reads the
parent off the in-memory `CommitInfo[]`, so a caller holding a narrowed
range can have the parent's sha without its date.

`task.generatedAt` is the right horizon rather than an approximation of
it. On the git path `resolveEpisode` sets it to `ep.closedAt`, which is
`finalAt`, which is the author date of `ep.finalSha` — the same commit
`gitDescentCorroborator` receives as `horizonSha`. So the gate orders
against exactly the instant the resolver bounded the search by, and a
record that fails the bound is a record the resolver would not have
written.

### 11.5 Interfaces at the boundaries

```ts
// ursa-major/src/pairfinder.ts — one commit that touched a path
export interface PathCommit {
  sha: string
  subject: string
  /** author date, strict ISO 8601 with the author's own offset (git's %aI) */
  date: string
}
export function commitsTouchingPath(repoPath: string, path: string): PathCommit[] | null

// ursa-major/src/types.ts — the evidence a span carries
export type DescentEvidence =
  | { basis: 'corroborated'; rivalsSearched: number }
  | {
      basis: 'rival'
      sha: string
      subject: string
      relation: 'prior_revision' | 'pre_existing' | 'merged_in' | 'sibling'
      /** the rival commit's own author date; absent means the resolver could not state it */
      date?: string
    }
  | {
      basis: 'unverified'
      reason: 'span_too_short' | 'unreadable_blob' | 'path_history_unreadable' | 'rival_search_capped'
      sha?: string
    }

// ursa-major/src/invariants.ts — unchanged signature, one more code
export type InvariantCode = /* ... */ | 'RIVAL_NOT_AFTER_FINAL'
export function checkRecord(record: OutcomeRecord): Violation[]
export const BOUND_COUNT: number   // 17 as of 2026-10-15
```

Nothing else changes shape. `gitDescentCorroborator`'s signature is
§10's, `authoredAfterHorizon`'s is §10's, and `checkRecord` still reads
one record and returns violations.

### 11.6 System diagram, node by node

Two nodes gain an outbound field and one bound is added. Every node is a
real file in `ursa-major/`.

- `src/pairfinder.ts` → `src/corroborate.ts`, edge carries
  `PathCommit[]` (now three fields: `sha`, `subject`, `date`). The date
  comes from `git log --all --pretty=format:%H%x09%aI%x09%s`, with the
  date placed **between** the sha and the subject because the parser
  keeps the subject as the whole remainder of the line and a commit
  subject may itself contain a tab.
- `src/pairfinder.ts` → `src/corroborate.ts`, second edge carries
  `CommitInfo[]` (`listCommits`), unchanged, and supplies the
  `prior_revision` date: the parent check runs before the path walk, so
  it has no `PathCommit` to read.
- Inside `src/corroborate.ts`: `relatives(commits, horizonSha).ancestors`
  → the rival return site, carrying `Set<string>`, which is what decides
  `merged_in` against `sibling`.
- `src/corroborate.ts` → `src/resolve.ts`, edge carries
  `DescentEvidence` with the new `date` and the new relation. `resolve()`
  is unchanged: it demotes on `prior_revision` in pass 1 and on any
  `rival` in pass 2 and the fuzzy pass, and `merged_in` is a rival.
- `src/resolve.ts` → `src/store.ts` → `.ursa/records/<id>.json`, edge
  carries `OutcomeRecord` as JSON.
- `.ursa/records/<id>.json` → `src/invariants.ts`, edge carries
  `OutcomeRecord` through `JSON.parse`, which is why the bound reads
  `date` as `unknown`: the declared type is an assumption about a file
  somebody else wrote.
- `src/invariants.ts` → `src/launch.ts` → `src/bin/ursa.ts` and
  `src/ci/run.ts`, edge carries `Violation[]`; a non-empty array is a
  non-zero exit after the records are written.
- `src/viewer.ts` reads the same field: the span inspector now prints
  the rival's date and has one prose branch per relation, where it had
  two branches for three relations and described the generation's own
  parent commit as "a branch this generation is not an ancestor of".
  That wording had been wrong since the parent relation was introduced,
  and the test that should have caught it could not: `renderViewer`
  emits the inspector as client-side source, so every arm of the
  ternary is a literal in the page and a substring assertion passes
  against all of them at once. The viewer case in
  `src/corroborate.test.ts` is now run in jsdom and clicks the span,
  which is the form that can fail.

### 11.7 On-disk layout, with a real payload

Path: `<project>/.ursa/records/<task-id>.json`. Below is one span of one
record this repository's own history produces, printed from a resolve of
a clone of `alexandrapaiz/Ursa` at `02e415b` and truncated to the fields
this section is about. It is a real span of a real record, not a
reconstruction:

```json
{
  "task": { "id": "ursa-2026-10-10-76d0d57", "generatedAt": "2026-10-10T12:28:11Z" },
  "files": [
    {
      "path": "docs/sprints/pending.md",
      "spans": [
        {
          "start": 5201,
          "end": 5237,
          "class": "survived_verbatim",
          "descent": {
            "basis": "rival",
            "sha": "b10bcfa",
            "subject": "Message pass: answer exo-centralizer's handoff on the dispatch 403",
            "relation": "sibling",
            "date": "2026-10-09T17:48:53Z"
          }
        }
      ]
    }
  ]
}
```

Read the two timestamps together: the rival commit was authored
`2026-10-09T17:48:53Z` and the work closed `2026-10-10T12:28:11Z`,
18.7 hours later, so the evidence predates the claim by a margin a
reader can see. Before today the `date` line was absent and that
sentence could not be written without a clone.

Two things about this span are worth noticing, because both were
predicted by the fixtures before they were observed here.

**The label is `survived_verbatim` and the verdict is a `rival`.** That
combination is legal and intended: `resolve()` demotes a verbatim span
only on `prior_revision`, the relation that places the text in the file
before the generation existed (see §9 and `DESCENT_CHECKED_UNIFORMLY`'s
third clause). A `sibling` says the text also exists elsewhere, which is
not the same claim, so the span keeps its label and carries the evidence.
It is also exactly the shape `fixtures/violations/base.json` was given on
2026-10-15, which this span confirms was realistic rather than
convenient.

**It is a `sibling`, so it is in the population the bound polices.** Of
the 2,141 rival verdicts in this repository's eleven records, three are
`sibling` and this is one of them. The other 2,138 are exempt by
relation.

Per the redaction rider in `prompts/engineer-agent.md`: both shas and the
commit subject are from this public repository, the path is a committed
file, the record id is the one `src/episodes.ts` derives from the public
commit `76d0d57`, and no home directory, machine username or private
session identifier appears anywhere in the payload.

### 11.8 Exact commands

```sh
# From ursa-major/.
npx tsc --noEmit
npx vitest run                       # 625 passing, 4 skipped as of 2026-10-15

# The three new fixtures, and the gate reading all twenty off disk.
npm run fixtures:violations:check    # "41 files match what this script would write."
npx tsx src/invariants.cli.ts fixtures/violations
# -> "21 records checked, 24 violations." and exit 1

# The bound's own cases, and the relation split's.
npx vitest run src/invariants.test.ts -t 'a rival from the future'
npx vitest run src/corroborate.test.ts -t 'the date a rival verdict carries'

# Over real history. Every ref matters: the candidates that produce the
# defect are on branches a single-branch clone cannot see.
npx tsx tools/measure-verbatim-descent.ts /path/to/Ursa --limit 50 --examples 3
```

### 11.9 What the measurement said on 2026-10-15

Over the eleven records the walk builds from this repository's own
history at `02e415b`, resolved through `resolveEpisode` and checked with
`checkRecord`:

```
records                                   11
rival verdicts, all classes             2141
  relation prior_revision               2134
  relation pre_existing                    4
  relation merged_in                       0
  relation sibling                         3
rival verdicts carrying a date          2141
rival verdicts carrying no date            0
RIVAL_NOT_AFTER_FINAL violations           0
violations of any other bound              0
```

Three things to read out of it.

**Every rival verdict now carries a date, including all 2,134
`prior_revision` ones.** The absent-date case is legal and did not
arise here, because `resolveEpisode` passes the full `listCommits`
output and every parent is in it.

**The bound fires nowhere on real history, which is the safety result.**
It is a gate both launches exit non-zero on, so a bound that fired on
this repository's own records would stop `ursa run`. All three siblings
predate their episodes' final commits: by 18.7 hours (`b10bcfa` against
`ursa-2026-10-10-76d0d57`, the span in §11.7), by 66.6 hours (`7226c04`
against the same record) and by 12.0 hours (`033a6f2` against
`ursa-2026-10-13-c4a827c`).

**`merged_in` is zero here, and that is a fact about this repository
rather than about the relation.** These episodes are single-commit
generation/edit pairs with no intervening merge that holds a span's
text, so the population the relation names is empty. Its coverage is the
branch-B fixture in `src/corroborate.test.ts`, which is the shape the
module was written for, plus the 2027-dated merged branch that §11.2
turns on.

### 11.10 Tooling

| Tool | Version | Job here | Why it, over the alternative |
|---|---|---|---|
| `git` | 2.55.0 (the runner’s) | `log --all --pretty=format:%H%x09%aI%x09%s` supplies every rival's author date in the same call that already enumerated the candidates | The date was already on the line git prints; the alternative is `git log -1 --format=%aI <sha>` per candidate, which `tools/measure-verbatim-descent.ts` does and which costs one subprocess per rival |
| TypeScript | 5.9.3 | the compiler that made the relation split cheap: adding `merged_in` to the union surfaced every site that branches on a relation, including the viewer's two-branch ternary over three relations | A runtime switch with a `default` would have left that viewer bug invisible, as it had been since the relation was introduced |
| Vitest | 5.0.2 | 625 tests, including the seven unit cases for this bound and the five for the relation | Already the suite; no new dependency |
| `Date.parse` (Node 22 built-in) | n/a, standard library | orders two ISO 8601 instants that carry different UTC offsets | A string compare is wrong and was shipped: `2026-10-09T19:00:00-06:00` sorts before `2026-10-10T00:00:00Z` as text and is one hour after it in fact, which is exactly what `rival-not-after-final.json` is built from |
| `node tools/ledger/union-merge.mjs` | repo-local | merged `docs/ideas.md` across this branch and `main` by entry identity | A line-based three-way merge conflicts on two appends; the driver is per-clone and GitHub's server-side merge does not have it |

No new dependency, no new service, steady-state cost unchanged at $0.

### 11.11 What a reviewer should push on

- **Is `merged_in` a relation or a flag?** It is derived from the same
  `Set<string>` that §10.2's condition 3 uses, so it carries no new
  evidence — only a name for evidence the resolver already had. The
  argument for the relation is that the record has to state which
  population a rival is in before any bound can police the other one.
  The argument against is that a boolean like
  `graphPlacedInsideWork: true` would say the same thing without
  changing a union three other files branch on.
- **Should the unreadable-date clause fire on exempt relations?** It
  does today, on the reasoning that a decorative date is worse than an
  absent one. The opposite reading is that an exempt relation's date is
  never read, so an unreadable one harms nobody and the bound should
  leave it alone.
- **Is `task.generatedAt` too loose?** A `prior_revision` rival ought to
  predate the generation, not merely the end of the work. §11.4 says why
  the tighter version is not asserted: on the git path the generation's
  timestamp is its commit's author date, and a rebase can put a parent's
  author date after its child's, which would fire the bound on a record
  whose claims are sound.

### 11.12 Rollback

```sh
git revert --no-commit <merge sha of the 2026-10-15 engineer PR>
```

No migration and no data change. `date` is an optional field, so records
written while it was present stay legal under the reverted bound; the
reverted `relation` union has three members, and a record carrying
`merged_in` would then be a relation no code branches on — the viewer
falls through to the `sibling` wording and `DESCENT_CHECKED_UNIFORMLY`
treats it as it treats `sibling` today, which is the behaviour before the
split. A revert's effects are that a rival from an episode's future is
again refused only by the resolver and not by the record, and that the
branch-B case goes back to being reported as a plain `sibling`.

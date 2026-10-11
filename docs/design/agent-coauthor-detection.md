# Agent co-author detection: a second agent's commit is not the person's correction

Status: built, 2026-10-11, engineer seat. Sequel to
`docs/design/agent-identity-and-pair-classification.md` (2026-09-30),
which fixed the author-name half of the same decision and left the
trailer half unexamined. Held to the engineering-artifact standard in
`prompts/engineer-agent.md`, all six elements below.

Found by dogfooding, which is the clause this run was executing: the
ledger entry "Agentic-forward: Ursa as the agents' HQ"
(`docs/ideas.md`, 2026-09-19, owner-directed `accepted`) ends "dogfood
on Ursa's own seats". Nothing had. This is what happened when something
did.

---

## The question this answers

`ursa run` has to decide, for each commit in a project's history,
whether a model wrote it or the person did. Everything downstream
depends on that one bit, and the product is what sits downstream: a
generated commit paired with the person's edit of it is an episode, an
episode resolved against the final text is an outcome record, and the
record's span classes are the thing a lab buys.

The decision reads three things, in this order of precedence after this
change: an identity the project's owner declared to be an agent's, the
commit's `Co-Authored-By` trailer, and, as a suppressible fallback, the
commit's author name. The first did not exist before this change, and
the second recognised four strings.

## 0. Terms, defined before use

No term below is left as a bare noun (element 6 of the standard).

| Term | What it means here |
|---|---|
| **trailer** | a `Co-Authored-By: Name <email>` line in a commit message's body, read with `git log --pretty=%(trailers:key=Co-Authored-By,valueonly)`. Written deliberately into the message by whatever made the commit, one commit at a time. |
| **agent marker** | the string that classified a commit as generated: a declared identity, a trailer, or an author name. Stored on every pair as `CommitPair.agentMarker` and copied into the record as the generation's `model` field. |
| **author-name fallback** | matching `CommitInfo.authorName` against the `MACHINE_IDENTITY` pattern to classify a commit as generated when no trailer matched. Suppressed when it matches every commit in the history, per `docs/design/agent-identity-and-pair-classification.md`. |
| **declared identity** | a substring the project's owner passes as `--agent-identity`, matched case-insensitively against a commit's author name and its author email. The owner's statement about their own fleet, not the library's inference. |
| **pair** | one `(generatedSha, finalSha)` tuple: a commit with an agent marker, and the next later commit touching an overlapping path that has no agent marker. The second commit is what the record calls "the person's edit". |
| **editor identity** | the author name and email of a pair's `finalSha`, which is to say whoever the run decided was the person. Reported on `PairFinderDiagnostics.editorIdentities`. |
| **`survived_verbatim`** | per `CLAUDE.md` §1, "generated and kept unchanged": a model wrote this span and the person kept it. The claim this document is about being false. |
| **sync commit** | a commit whose diff is a file copied wholesale from another repository. In this repository, HQ's standards and lessons arrive this way (`CLAUDE.md`, "The holding company"). No model composed its content here. |
| **agent seat** | one of the scheduled agent roles that build this project (`prompts/*-agent.md`, `.github/workflows/agent-*.yml`). Each commits under its own git identity. |

---

## 1. The defect, as a number

`ursa run` pointed at a clone of this repository at `fe0da2a`, 470
commits, before this change:

```
5 work units found, 5 resolved into records.
71,566 chars survived your editing verbatim, 4,850 survived edited.
104,509 chars were generated to get there, and 71,087 of them reached the finished work unedited.
You discarded 23,920 chars of draft on the way, 24% of the 99,715 whose fate this run could trace.
```

Of those 71,566 characters, 60,616 came from one record,
`ursa-self-2026-09-27-7c739cf`, about one file,
`docs/standards/lessons.md`. That record reported
`survived_verbatim` at 94.9% of the generation, and it is 84.7% of the
whole run's headline figure.

Both sides of its pair are machines, and neither side composed the
file:

| Side | Commit | Author | `Co-Authored-By` | What it actually is |
|---|---|---|---|---|
| generation | `7c739cf` | `alexandrapaiz` | `claude[bot] <noreply@anthropic.com>` | "Lessons sync 2026-09-28: HQ standards/lessons.md @ 775ce36 (#31)" — a sync commit, copying the file from `alexandrapaiz/alexandra-systems` at `775ce36` |
| "the person's edit" | `8c453f0` | `alexandrapaiz` | `exo-centralizer[bot] <noreply@anthropic.com>` | "Lessons sync from HQ @ 7e051c0: L-E10 (survey the PRs before you build), L-E8 amended (#41)" — the next sync of the same upstream file, two days later |

So the record asserted that a person read 63,362 characters of model
output and kept 60,616 of them. What happened is that one automated
sync of a file from another repository was followed by the next
automated sync of the same file. No person read a character of it, and
no model wrote a character of it either.

### 1.1 The mechanism, in two lines of source

```ts
const DEFAULT_TRAILER = /claude|codex|cursor|gpt/i                              // before
const DEFAULT_AUTHOR  = /claude|codex|cursor|gpt|copilot|github-actions|\[bot\]/i
```

`exo-centralizer[bot]` matches the second and not the first. The walk
reads the trailer first and treats it as authoritative, demoting the
author name to a suppressible fallback, and that precedence is correct
for the reason the predecessor document gives: `GIT_AUTHOR_NAME` is
ambient, exported by the harness over the repository's own `user.name`,
so it describes the environment a commit was made in rather than who
made it, while a trailer is written one commit at a time on purpose.

What the precedence also requires, and nobody had written down, is that
**the trailer pattern must recognise at least as many machine identities
as the pattern it overrides.** It recognised three fewer. Every
co-author outside those four vendor words was therefore promoted to a
human being by the very step that was supposed to be the more reliable
one.

The predecessor document contains the asymmetry in plain sight. Its
terms table spells `DEFAULT_AUTHOR` out alternative by alternative, and
describes the trailer only as "written by the agent that made the
commit, so it describes the commit" — true of the mechanism, silent on
which strings it accepted. A four-word allowlist fitted inside a
sentence that sounded general.

### 1.2 Why the import check could not catch it

`src/vendored.ts` exists for exactly this class: a file that arrived
whole from elsewhere is nobody's correction, and it refuses the file
before any span of it is read
(`docs/design/vendored-paths.md`). It did not fire here, and
`episodes.json` recorded `vendoredPaths: []`.

The reason is structural rather than a bug in it. `vendored.ts` asks
whether the finished file is byte-identical to a blob that exists
**somewhere in this repository's object store** — a sibling branch, an
earlier commit, a rebase source. `docs/standards/lessons.md` came from
a different repository. Its content never existed in this repository
before the sync commit introduced it, so there is no blob to match, and
an import from outside git's reach is invisible to a check that works
by looking inside it.

This is worth stating sharply because it was measurable five days
before this run and nobody measured it. The table in
`docs/design/vendored-paths.md` §1, written 2026-10-06, lists
`docs/standards/lessons.md` at 60,616 characters as its **largest row**,
attributed in that same table to "Alexandra Systems HQ, synced into
this repo". The fix shipped that day removed the second row
(`docs/market/landscape.md`, 21,656 characters, a rebase whose source
blob *was* in this repository). The largest row stood for five more
days, because nothing re-ran the measurement after the fix.

After this change the claim disappears, by a different route: once
`8c453f0` is read as a generation, it is no longer eligible as a
pairing target, `7c739cf` finds no human edit within its bounds, and
the pair is never formed. The cross-repository import gap itself is
untouched and is filed as its own ledger entry (§9).

### 1.3 The guard found a second instance before it was written down

The class guard in §5 asserts the superset behaviourally, one commit
per machine identity. Writing it turned up a second live case in the
same gap: `Co-Authored-By: Copilot <copilot@github.com>`, which
`DEFAULT_AUTHOR` already knew and `DEFAULT_TRAILER` did not. GitHub's
Copilot coding agent writes that trailer on every commit it makes. Any
repository using it had the same defect, with nothing in this
repository's history to reveal it.

---

## 2. The decision

**The two patterns are now one constant.** `MACHINE_IDENTITY` in
`src/pairfinder.ts` is the single vocabulary, and both `DEFAULT_TRAILER`
and `DEFAULT_AUTHOR` are bound to it. The superset property is then
structural instead of something a test has to keep asserting, and the
two lists cannot drift apart again, which is the whole defect.

```ts
const MACHINE_IDENTITY = /claude|codex|cursor|gpt|copilot|github-actions|\[bot\]/i
const DEFAULT_TRAILER = MACHINE_IDENTITY
const DEFAULT_AUTHOR = MACHINE_IDENTITY
```

Six are harness or vendor names. The seventh, the `[bot]` suffix, is
GitHub's own convention: every GitHub App account is addressed as
`<app-name>[bot]`, so a co-author carrying that suffix is a program
whoever wrote the app.

**Widening narrows what a run claims.** A commit classified as a
generation stops being eligible as a pairing target, so this change can
only ever remove pairs. That is the direction `src/pairfinder.ts`'s
header note calls the costly one, and it is the correct one here: these
commits really were machine-written, and a claim not made is better than
a claim that is false.

**The trailer needs no all-match suppression.** The author fallback has
one because `GIT_AUTHOR_NAME` is ambient and labels the person's own
commits along with everything else. A trailer is written into a commit
message deliberately, so a history in which every commit carries one is
a history in which every commit really was co-authored by a machine,
and no pair in it is a person's correction. Reporting zero records
there is the right answer, not a failure (§3.2).

### 2.1 The limitation, stated rather than discovered later

Classifying a sync commit as a generation still credits a model with
text it did not write, on the generation side. The pair that carried the
claim is gone, but if a sync is ever followed by a genuine human edit
within the bounds, the resulting record will report an imported file as
model output. The pattern cannot see that; only the import check can,
and the import check cannot reach outside this repository. Filed as a
ledger entry rather than hidden here (§9, entry 1).

---

## 3. The second half: who the run decided was the person

With the trailer fixed, the same clone produced four records. All four
named an agent seat as the person.

```
The edits above were credited to ursa-pm <ursa-pm@agents.epito.me> (4 pairs).
```

The identities in this repository's history, by commit count:

| Author name | Author email | Commits | Matched any pattern? |
|---|---|---|---|
| `claude[bot]` | `41898282+claude[bot]@users.noreply.github.com` | 189 | yes, by name and trailer |
| `alexandrapaiz` | `<owner-personal>@gmail.com` (redacted, see note) | 76 | no — the owner, correctly |
| `alexandrapaiz` | `111912770+alexandrapaiz@users.noreply.github.com` | 48 | no — the owner, correctly |
| `claude[bot]` | `noreply@anthropic.com` | 31 | yes |
| `ursa-pm` | `ursa-pm@agents.epito.me` | 28 | **no — an agent seat, read as the person** |
| `stack integrator` | `stack-integrator@ursa.local` | 21 | **no — a tool (`tools/stack/integrate.sh`), eligible as the person** |
| `ursa-exo` | `ursa-exo@agents.epito.me` | 16 | **no** |
| `claude[bot]` | `209825114+claude[bot]@users.noreply.github.com` | 15 | yes |
| `ursa-engineer` | `ursa-engineer@agents.epito.me` | 12 | **no** |
| `ursa-research`, `ursa-okr`, `ursa-frontend`, `ursa-market`, `ursa-finance`, `exo-centralizer` | `<seat>@agents.epito.me` | 22 | **no** |
| `claude[bot]` | `claude[bot]@users.noreply.github.com` | 7 | yes |
| `exo-centralizer[bot]` | `noreply@anthropic.com` | 3 | yes, by name — but NOT by the pre-change trailer pattern, which is §1 |
| `alexandrapaiz` | `<owner>@<employer>.com` (redacted, see note) | 2 | no — the owner, correctly |

Eighteen distinct identities, 470 commits, complete. The bolded rows sum
to 99, which is the number pass 3 in §8 reclassifies.

No pattern a library can ship in good faith matches `ursa-pm`. It is a
free-text field that looks exactly like a person's username, and
guessing from it is the behaviour Ursa's fourth principle names:
"claims of information sufficient for central assessment always
overreach" (`README.md`, "The principles"). The person whose repository
it is knows these names at a glance. The library cannot know them at
all.

So the library stops guessing and does two things instead.

**Redaction note on the table above (added by the second 2026-10-11
run).** Two of the owner's four identities are her private contact
addresses, one personal and one at her employer. They are replaced with
labelled placeholders of the same shape. Everything the table argues is
unaffected: what matters is that `alexandrapaiz` appears under four
distinct emails, that all four correctly match no agent pattern, and
that the agent seats below her do not. The third identity is left whole
because `111912770+alexandrapaiz@users.noreply.github.com` is the
address GitHub issues for the express purpose of being the public one.

This is the engineering-artifact standard's redaction rider
(`prompts/engineer-agent.md`), which exists because element 3's demand
for real payloads put a private path into
`docs/design/product-plan.md` one day after Ursa incident 2 purged that
same class of string. The rider's rule for a payload that cannot be
shown without a private identity is that it is cited rather than
inlined, so: the unredacted table is reproducible in one command by
anyone with a clone, §7 command 5, and belongs nowhere in this
repository. Note that it is reproducible *from git metadata*, which no
redaction here can change; what the rider prevents is a searchable copy
in a document body, which is a different and avoidable exposure.

### 3.1 It says who it credited

`PairFinderDiagnostics.editorIdentities` carries one entry per distinct
author identity on the edit side of a surviving pair, most pairs first,
and `renderRunSummary` prints it. The decision was previously
unfalsifiable from outside the code: a commit is the person's when it
matches nothing, which is a conclusion drawn from absence. Printing the
names turns that absence into something a reader can contradict in one
line, which is the difference between this gap costing a 470-commit
investigation and costing a glance.

### 3.2 It lets the owner correct it

`--agent-identity <substring>`, repeatable, matched case-insensitively
against each commit's author name **and** its author email. Declared
identities are checked before either pattern and are never suppressed.

Matched on the email as well as the name, where the built-in vocabulary
deliberately is not. Widening the default to emails would read a person
actually named Claude as a machine — `claude.devereux@example.com` is a
person — and misreading a person as a machine destroys the whole pair
rather than one commit's signal. A declared identity is not a guess, so
it can be matched on every field git carries. Both halves are pinned by
tests (§5).

### 3.3 The answer on this repository is zero, and zero is correct

```
Scanned 471 commits. 426 looked generated (272 by trailer, 55 by author name,
99 by an identity you declared), and none of those was followed by an edit of
the same file without an agent marker.
If every commit here is an agent's, that is an answer rather than a failure:
your corrections are not on this branch. They are in the pull requests you
reviewed, which is what the pull-request path reads.
```

This repository has no human corrections on its default branch. Every
seat writes through a pull request and the owner's authority is her
merge, so her corrections live in review comments and in which branches
she merged. That is what `src/adapters/github-pr.ts` reads, and it is
what the ledger entry "merge commits are not edits; the PR reader is
load-bearing" (`docs/ideas.md`, 2026-09-20) said in kind. This run
measured it: the git-commit-pair path yields exactly zero real records
here, not five.

---

## 4. System diagram

Nodes are real files. Edges carry the actual value that crosses them,
named by its type or its on-disk format.

```
   ┌──────────────────────────────────────┐
   │ src/bin/ursa.ts                      │
   │ main() → the `run` command           │
   │ parses --agent-identity (repeatable) │
   └───────────────┬──────────────────────┘
                   │ PairFinderOptions
                   │ { agentIdentities: string[], maxPairDistance, ... }
                   ▼
   ┌──────────────────────────────────────────────────────┐
   │ src/pairfinder.ts                                    │
   │ findCommitPairsWithDiagnostics(repoPath, opts)       │
   │                                                      │
   │  listCommits ──► CommitInfo[] ──► marker(c)          │
   │                                     1. declaredMatch │
   │                                     2. DEFAULT_TRAILER│
   │                                     3. DEFAULT_AUTHOR │
   │                                        (suppressible) │
   └───────┬──────────────────────────────────┬───────────┘
           │ CommitPair[]                     │ PairFinderDiagnostics
           │ (+ finalAuthorEmail?: string)    │ (+ editorIdentities[],
           │                                  │  generatedByDeclaredIdentity)
           ▼                                  │
   ┌──────────────────────┐                   │
   │ src/episodes.ts      │                   │
   │ buildEpisodes()      │                   │
   └───────┬──────────────┘                   │
           │ Episode[] → .ursa/episodes.json  │
           ▼                                  │
   ┌──────────────────────────┐               │
   │ src/resolve-episode.ts   │               │
   │ resolveEpisode()         │               │
   └───────┬──────────────────┘               │
           │ OutcomeRecord                    │
           │ → .ursa/records/<id>.json        │
           ▼                                  ▼
   ┌──────────────────────┐   ┌────────────────────────────────┐
   │ src/store.ts         │   │ src/bin/ursa.ts                │
   │ saveRecord()         │   │ renderRunSummary(records,      │
   └──────────────────────┘   │   episodes, diagnostics)       │
                              │ → stdout, the identity line    │
                              └────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────┐
   │ tools/measure-coauthor-detection.ts                     │
   │ resolves the same clone two or three times in memory,   │
   │ one pass per trailer pattern and declaration set        │
   │ → stdout: one Totals JSON object per pass, plus a delta │
   │ writes nothing: no .ursa/, no consent store read        │
   └─────────────────────────────────────────────────────────┘
```

Edge inventory, so the diagram can be rendered without inventing
anything:

| From | To | What crosses it |
|---|---|---|
| `src/bin/ursa.ts` | `src/pairfinder.ts` | `PairFinderOptions`, with `agentIdentities: string[]` from the repeated `--agent-identity` flag |
| `git log` (child process) | `src/pairfinder.ts` | one tab-separated line per commit: `%H %an %ae %aI %P <trailers> %s`, parsed into `CommitInfo` |
| `src/pairfinder.ts` | `src/episodes.ts` | `CommitPair[]`, each now carrying `finalAuthorEmail?: string` |
| `src/pairfinder.ts` | `src/bin/ursa.ts` (`renderRunSummary`) | `PairFinderDiagnostics`, with `editorIdentities: { name, email, pairs }[]` and `generatedByDeclaredIdentity: number` |
| `src/episodes.ts` | `.ursa/episodes.json` | `Episode[]` as JSON, `agentMarker` carrying the string that classified the generation |
| `src/resolve-episode.ts` | `.ursa/records/<recordId>.json` | one `OutcomeRecord` as JSON |
| `tools/measure-coauthor-detection.ts` | stdout | two or three `Totals` JSON objects and one delta object |

---

## 5. Interfaces at every boundary

The signatures a caller writes against, not descriptions of them.

```ts
// src/ci/run.ts — the CI launch's boundary. The option below is the one
// that was missing until 2026-10-11 (§12): every other field was here,
// so the gap was not a missing concept, it was one unforwarded field.
export interface CiOptions {
  projectPath: string
  eventPath: string
  repo: string
  token: string
  minChars?: number
  /** substrings the consumer declared to be agents', from action.yml's `agent-identity` */
  agentIdentities?: string[]
  post?: boolean
}
```

```ts
// src/pairfinder.ts — the classifier's whole public surface
export interface PairFinderOptions {
  agentTrailerPattern?: RegExp
  agentAuthorPattern?: RegExp
  /** substrings matched case-insensitively against author name AND email */
  agentIdentities?: string[]
  maxPairDistance?: number
  maxPairAgeHours?: number
  maxInterposedGenerations?: number
  range?: string
}

export interface CommitPair {
  generatedSha: string
  finalSha: string
  paths: string[]
  generatedAuthor: string
  finalAuthor: string
  /** absent on the pull-request path, which has only a GitHub login */
  finalAuthorEmail?: string
  generatedAt: string
  finalAt: string
  agentMarker: string
  subject: string
  interveningMerges: MergeEvent[]
}

export interface PairFinderDiagnostics {
  commitsScanned: number
  generatedByTrailer: number
  generatedByAuthorName: number
  generatedByDeclaredIdentity: number
  authorFallbackSuppressed: { pattern: string; authors: string[] } | null
  bounds: { maxPairDistance: number; maxPairAgeHours: number; maxInterposedGenerations: number }
  abandoned: { distance: number; age: number; interposedGeneration: number; notDescendant: number }
  mergeGenerationsRefused: number
  /** who the walk decided was the person, most pairs first */
  editorIdentities: { name: string; email: string; pairs: number }[]
}

export function findCommitPairsWithDiagnostics(
  repoPath: string,
  opts?: PairFinderOptions,
): { pairs: CommitPair[]; diagnostics: PairFinderDiagnostics }

// src/bin/ursa.ts — what prints the identity line
export function renderRunSummary(
  records: OutcomeRecord[],
  episodes: Episode[],
  diagnostics?: PairFinderDiagnostics,
): string
```

The tests that hold each decision, all in `src/pairing-window.test.ts`:

| Test name | What it pins |
|---|---|
| `reads a [bot] co-author as a generation, so it cannot be the edit` | both sync commits classify as generations, so no pair forms |
| `pins what the old four-vendor-words pattern claimed, which is the defect` | passing the pre-2026-10-11 pattern explicitly still produces the bogus pair, so the change is visible rather than asserted |
| `refuses the pair as interposed when a real human edit follows` | with a genuine edit after both seats, the first generation is refused as interposed rather than credited |
| `reads a commit co-authored by <identity> as a generation` (9 cases) | the class guard: every identity `MACHINE_IDENTITY` knows is recognised in a trailer, which is what caught the `Copilot` case |
| `names the identity it credited the edit to, with its email` | `editorIdentities` reports name, email and pair count |
| `counts pairs per identity, most first` | the ordering, over two seats and three pairs |
| `declaring the identity turns its commits into generations, so the pair goes` | `--agent-identity ursa-pm` removes the record that rested on it |
| `matches a declared identity on the email as well as the name` | `--agent-identity @agents.epito.me` reaches a whole fleet by its mail domain |
| `leaves the person alone when the declaration does not name them` | declaring one seat does not reclassify another identity |
| `does not widen the built-in vocabulary to emails, which would misread a person` | `claude.devereux@example.com` stays a person; the guard against fixing §3.2 the lazy way |

---

## 6. On-disk layouts

Nothing in this change adds a file format. It changes two values inside
layouts that already exist, and adds one field to each.

```
<project>/.ursa/
├── episodes.json          # Episode[], one entry per pair that survived the bounds
└── records/
    └── <recordId>.json    # one OutcomeRecord
```

A real episode this change deletes, taken verbatim from
`.ursa/episodes.json` produced by the pre-change run over a clone of
this repository (paths placeholdered per the standard's redaction
rider; the clone path on the runner was a scratch directory, and
`agentMarker` is the real string):

```json
{
  "id": "ursa-self-2026-09-27-7c739cf",
  "projectPath": "~/clones/ursa-self",
  "status": "closed",
  "openedAt": "2026-09-27T19:41:51-06:00",
  "closedAt": "2026-09-29T20:08:28-06:00",
  "closureHeuristic": "git-commit-pair",
  "touchedFiles": ["docs/standards/lessons.md"],
  "generatedSha": "7c739cf02e6a24066ef790e384f70699f9094a59",
  "finalSha": "8c453f049e996c6a9592fd5a719f1221ea0be652",
  "agentMarker": "claude[bot] <noreply@anthropic.com>",
  "subject": "Lessons sync 2026-09-28: HQ standards/lessons.md @ 775ce36 (#31)",
  "distilled": false,
  "interveningMerges": [
    {
      "sha": "55580b63ba67ea7e82aa89b962559b2ad3656d98",
      "parents": [
        "7c739cf02e6a24066ef790e384f70699f9094a59",
        "4d5e40176a806f53c1ddc158b4309701839f36fe"
      ],
      "paths": ["docs/standards/lessons.md"],
      "author": "claude[bot]",
      "date": "2026-09-28T19:34:18Z",
      "subject": "Merge pull request #23 from alexandrapaiz/pm/standup-2026-09-26"
    }
  ],
  "vendoredPaths": []
}
```

The record this episode produced, `records/ursa-self-2026-09-27-7c739cf.json`,
was 1,233,396 bytes, and its `stats.byClass` block read:

```json
{
  "survived_verbatim": { "spans": 870, "chars": 60616, "pct": 0.949, "pctOfFinal": 0.91 },
  "survived_mutated": { "spans": 4, "chars": 236, "pct": 0.004, "pctOfFinal": 0.004 },
  "no_generation_provenance": { "spans": 55, "chars": 3028, "pct": 0.047, "pctOfFinal": 0.045 }
}
```

After this change neither file is written: no pair, no episode, no
record.

---

## 7. Exact commands

The literal invocations, with the flags that produced every number
above. `~/clones/ursa-self` stands for wherever you cloned it.

```bash
# 1. a clone to resolve, with full history: the walk needs every ref,
#    and actions/checkout's default fetch-depth: 1 breaks it outright
git clone https://github.com/alexandrapaiz/Ursa.git ~/clones/ursa-self

# 2. the resolver, from ursa-major/
cd ursa-major
npm ci
npx tsx src/bin/ursa.ts run ~/clones/ursa-self

# 3. the same run, declaring this project's agent seats. Two
#    declarations cover all nine seats plus the stack tool, because one
#    is a shared mail domain and the other is a tool's author name
npx tsx src/bin/ursa.ts run ~/clones/ursa-self \
  --agent-identity '@agents.epito.me' \
  --agent-identity 'stack-integrator'

# 4. the before/after, resolved in memory, writing nothing
npm run measure:coauthor -- ~/clones/ursa-self \
  --agent-identity '@agents.epito.me' \
  --agent-identity 'stack-integrator'

# 5. the identities in any history, which is how §3's table was built
git -C ~/clones/ursa-self log --pretty=format:'%an%x09%ae' \
  | sort | uniq -c | sort -rn

# 6. the tests for this change alone, then the whole suite
npx vitest run src/pairing-window.test.ts
npm test

# 7. the CI launch with the same declaration (§12). --no-post prints the
#    run comment instead of writing it to a pull request, so this is
#    safe to run against a repository nobody wants commented on
node dist/ursa.cjs ci ~/clones/ursa-self \
  --repo alexandrapaiz/Ursa \
  --event ~/clones/ursa-self/event.json \
  --min-chars 200 \
  --agent-identity '@agents.epito.me' \
  --no-post

# 8. the parity assertion itself, which resolves ONE fixture repository
#    through both launches and diffs the records field by field
npx vitest run src/launch-parity.test.ts

# 9. the proof that the parity case is load-bearing: revert only the CI
#    call site, watch exactly one case fail, restore it
npm run bundle:check   # expect "dist/ursa.cjs is current"
```

---

## 8. Measurement

Three passes over the same clone of this repository at `fe0da2a`, 470
commits. Nothing differs between passes except the trailer pattern and
the declaration set: same bounds, same clone, same commit graph, same
200-character floor. Produced by command 4 above.

| | pass 1: four vendor words (shipped until 2026-10-11) | pass 2: `MACHINE_IDENTITY` (shipped) | pass 3: plus declared seats |
|---|---|---|---|
| commits classified generated by trailer | 327 | 328 | 272 |
| by author name | 55 | 55 | 55 |
| by a declared identity | 0 | 0 | 99 |
| pairs surviving every bound | 5 | 4 | 0 |
| records written | 5 | 4 | 0 |
| chars labelled `survived_verbatim` | 71,566 | 10,950 | 0 |
| chars labelled `survived_mutated` | 4,850 | 4,614 | 0 |
| generated chars written | 104,509 | 41,147 | 0 |
| generated chars whose fate is traceable | 99,715 | 39,349 | 0 |
| chars the person discarded | 23,920 | 23,555 | 0 |
| discard rate against traceable chars | 24.0% | 59.9% | 0 |
| who the run called the person | `ursa-pm` (4 pairs), `alexandrapaiz` (1 pair) | `ursa-pm` (4 pairs) | nobody |

Three readings worth naming:

1. **84.7% of the headline survival figure was one imported file.**
   71,566 down to 10,950 is not a tuning adjustment. It is the removal
   of a claim that a person had read and approved 60,616 characters
   nobody had read.
2. **The discard rate more than doubled, 24.0% to 59.9%, while the
   discarded character count barely moved** (23,920 to 23,555). The
   denominator was inflated, not the numerator: the imported file was
   sitting in "generated characters whose fate we traced" and almost
   all of it in the surviving half. A buyer auditing the old record
   would have read this project's agents as far more accurate than they
   are.
3. **The true answer is zero, and only pass 3 reports it.** Pass 2 is
   honest about the sync and still wrong about the editor. The
   difference between pass 2 and pass 3 is not a library improvement; it
   is one fact the library could not know and the owner could, supplied
   in two command-line flags.

---

## 9. What this does not fix

Three gaps, each a ledger entry from this run (`docs/ideas.md`,
2026-10-11) rather than a silent omission. The second was closed the
same day by the run that inherited this document; it is struck through
instead of deleted so the slice and its repair stay visible together.

1. **A file synced from another repository is still read as composed
   text.** `src/vendored.ts` detects an import by finding its source
   blob in this repository's object store, so an import from outside
   git's reach is invisible to it. The pair that carried the claim is
   gone, but a sync followed by a genuine human edit would still produce
   a record reporting an imported file as model output.
2. ~~**The CI launch cannot be told who the agents are.**~~ **Closed
   2026-10-11 by the run that inherited this document; see §12.** It
   was sliced out of the first run and fixed by the second rather than
   left, because a parity gap introduced by this very change is this
   change's own defect and not a future enhancement.
3. **Nothing re-runs the measurement a fix was aimed at.**
   `docs/design/vendored-paths.md` §1's table has five rows, the fix
   removed row two, and row one — the largest, at 60,616 characters —
   stood for five more days. Every number in that table came from a run
   nobody repeated.

---

## 10. Tooling

Every tool carries its version, its job here, and why it rather than
the alternatives considered.

| Tool | Version | Its job in this change | Why this and not the alternative |
|---|---|---|---|
| `git` | 2.55.0 | supplies the classification input: `git log --pretty=format:'%H %an %ae %aI %P %(trailers:key=Co-Authored-By,valueonly,separator=\|) %s'`, one line per commit | the trailer is a first-class git concept with a `%(trailers:key=...)` formatter, so no commit-message parsing is written by hand. `git log --format=%B` plus a regex was the alternative and it re-implements trailer folding rules git already implements |
| Node.js | 22.23.3 | runs the resolver and the measurement tool; `node:child_process.execFileSync` invokes `git` with an argument array, never a shell string | already the project's runtime (`ursa-major/package.json`). `execFileSync` over `execSync` because an argument array cannot be shell-injected by a branch or author name containing a quote |
| TypeScript | 5.9.3 | `tsc --noEmit` is the first half of `npm test`, and it is what caught `src/adapters/github-pr.ts` failing to supply the new `finalAuthorEmail` the moment the field was added | the type error was the reason the field became optional rather than fabricated on the pull-request path. A JSDoc-only codebase would have shipped a `finalAuthorEmail` holding a GitHub login |
| vitest | 5.0.2 | runs `src/pairing-window.test.ts`; `it.each` drives the nine-identity class guard from one list | already the project's runner. `it.each` over a hand-written loop so each identity is a named, separately-reported case, which is how the `Copilot` failure surfaced as one line rather than one assertion inside a passing test |
| tsx | 4.23.15 | executes the TypeScript entry points directly (`npx tsx src/bin/ursa.ts run ...`, `npm run measure:coauthor`) with no build step | a build step before every measurement pass adds a stale-artifact failure mode to a tool whose only job is to produce trustworthy numbers |
| `jsdiff` (`diff`) | 8.0.4 | unchanged here; named because it computes the word-level diff behind `survived_mutated`, which is the label this change moves characters out of | listed for completeness: the 4,850-to-4,614 row in §8 is its output, so a reader checking that number needs to know what produced it |

| `bash` | 5.2.21 (`ubuntu-24.04` runner default) | splits `action.yml`'s `agent-identity` input into one `--agent-identity` flag per line, inside the composite action's `resolve` step (§12.3) | `while IFS= read -r` over the environment variable, rather than `${{ }}` interpolation plus word splitting: interpolation pastes a consumer-controlled string into the script before bash parses it, and unquoted word splitting would break any identity containing a space. A Node pre-step reading the same variable was the alternative and was rejected because the Action's premise is that the YAML a consumer reads before running it is the whole story, and a second script to audit is worse than four lines of shell |

No new dependency, no new service, no new credential. Steady-state cost
stays $0.

---

## 11. Rollback

Three commits on `engineer/2026-10-11-prose-path-dogfood`, plus the §12
parity commit on `engineer/2026-10-11-coauthor-detection-landing`, which
contains the first branch and supersedes it. Reverting any of them
leaves the rest working. The parity commit is the safest to revert
alone: it restores the pre-2026-10-11 CI behaviour, which is a CI launch
that cannot be told who the agents are, and touches nothing the local
launch reads.

```bash
# the whole change
git revert --no-commit <trailer-fix-sha> <identity-reporting-sha> <docs-sha>

# or just the behaviour, keeping the measurement tool and this document
git revert --no-commit <trailer-fix-sha> <identity-reporting-sha>
```

The pre-2026-10-11 classification can also be reproduced without
reverting anything, because the pattern is a caller-supplied option and
`tools/measure-coauthor-detection.ts` already passes the old one as its
first pass. Pass 1 of this command IS the old behaviour, including the
71,566-character claim:

```bash
npm run measure:coauthor -- ~/clones/ursa-self
```

Nothing to migrate: `.ursa/` is rebuilt from git history on every run,
and no record written before this change is read by anything after it.

---

## 12. The CI launch reads the same declaration (added 2026-10-11, second run)

### 12.1 Why this is a defect and not an enhancement

`ursa run` and `ursa ci` are sold as one resolver fired two ways, and
that sentence is the entire premise of the Action surface: a lab
auditing a record made in CI is auditing the local resolver's behaviour
or it is auditing nothing. §9's second item recorded that
`--agent-identity` reached only the local launch. That makes the two
launches give different answers to "who was the person" from
byte-identical history, on exactly the repositories the option exists
for, which is the single failure `src/launch.ts` was written to make
impossible. It is the fourth entry in that module's drift list, after
the size floor, the self-check, and the erased episode.

The asymmetry was narrow and worth stating precisely, because it
explains why no existing test caught it. The default vocabulary is a
shared constant (`MACHINE_IDENTITY`, §1.1), so the trailer half of this
change reached both launches the moment it was written. Only the
caller-supplied declaration did not, and only one line carried it.

### 12.2 The three edges that were missing

Node by node, in the direction the declaration travels:

| Edge | Carries | State before 2026-10-11 |
|---|---|---|
| a consumer's workflow YAML → `action.yml` input `agent-identity` | a newline-separated string, one substring per line | no such input existed, so there was nothing for a consumer to set |
| `action.yml` step `resolve` → `dist/ursa.cjs` argv | zero or more `--agent-identity <substring>` argument pairs | not emitted |
| `src/bin/ursa.ts` `runCi({...})` → `src/ci/run.ts` → `findCommitPairs` | `CiOptions.agentIdentities`, then `PairFinderOptions.agentIdentities` | the field did not exist on `CiOptions`, and the call was `findCommitPairs(projectPath, { range })` |

The local launch's edge, `src/bin/ursa.ts` → `findCommitPairs`, was
already present and is unchanged.

### 12.3 The input is read from the environment, not interpolated

An Action input is a string chosen by whoever writes the consumer's
workflow, and the list is newline-separated because that is the shape a
YAML block scalar already has. Splitting it in the step's shell is the
only part of this with a sharp edge, so the value is passed through the
environment and never interpolated into the script text:

```yaml
env:
  URSA_AGENT_IDENTITY: ${{ inputs.agent-identity }}
run: |
  while IFS= read -r identity; do
    [ -n "${identity//[[:space:]]/}" ] || continue
    args+=(--agent-identity "$identity")
  done <<< "$URSA_AGENT_IDENTITY"
```

`${{ }}` interpolation pastes the value into the script before bash
sees it, so an identity containing a backtick or `$(...)` would be
executed on the runner. Read from the environment it is data. The
blank-line skip is not cosmetic either: a block scalar written the
natural way ends with a newline, which would otherwise become an empty
declaration, and an empty substring matches every identity in the
history and would silently classify the whole repository as agents'.
That is the one failure mode of this feature that would look like a
successful run reporting zero records, which is also the correct answer
on this repository (§3.3), so it would have been indistinguishable from
working.

Verified for four inputs before it shipped: empty (no flags added), one
line, two lines with a trailing newline (two flags), and a value
carrying `"`, a backtick and `$(id)` (one flag, passed through
uninterpreted).

### 12.4 How it is held

`src/launch-parity.test.ts` resolves one fixture repository through both
launches and diffs the records field by field. The new block asserts the
declaration *changes* the answer rather than merely that both launches
agree, because a test that only checked agreement would also pass if
both launches ignored the flag:

| Case | Asserts |
|---|---|
| without the declaration | both launches write the record, same task id |
| declaring the editor's email an agent | both write zero records, both exit 0, so zero is an answer and not an error |
| the diagnostic behind it | `generatedByDeclaredIdentity` is 3 and `editorIdentities` is empty, so a future change that drops the record for some unrelated reason cannot keep the file green |

The second case matches on the editor's *email*, which the built-in
vocabulary never reads (§2.1), so it cannot pass by accident through the
author-name fallback.

**Evidence it is load-bearing.** Reverting only the `src/ci/run.ts` call
site to `findCommitPairs(projectPath, { range })` fails exactly one
case, with `expected 1 to be +0`: the CI launch wrote a record the local
launch refused. That is the defect stated as a diff.

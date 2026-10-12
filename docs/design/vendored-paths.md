# Vendored paths: a file that arrived from outside is nobody's correction

Engineer run 2026-10-06, third dispatch. Implements the ledger entry
"A vendored file is an import, and no span of it is anyone's
correction" (`docs/ideas.md`, 2026-10-06). Held to the
engineering-artifact standard in `prompts/engineer-agent.md`: every
node below is a file that exists, every interface is the signature a
caller writes against, every command is the literal invocation that
produced the number next to it.

---

## 1. The defect, as a number

`ursa run` over a clone of this repository on 2026-10-06, before this
change:

```
6 work units found, 6 resolved into records.
93,420 chars survived your editing verbatim, 1,608 survived edited.
```

Counting those 93,420 characters by the file they sit in:

| final file | chars labelled `survived_verbatim` | who wrote the file |
|---|---|---|
| `docs/standards/lessons.md` | 60,616 | Alexandra Systems HQ, synced into this repo (`CLAUDE.md`, "The holding company") |
| `docs/market/landscape.md` | 21,656 | the market seat, on branch `ursa-market/2026-10-05-window`, brought onto `main` by a rebase commit |
| `docs/finance/close-2026-10.md` | 5,601 | the finance seat, on the branch the episode is about |
| `docs/sprints/dispatch-queue.md` | 2,724 | the PM seat, on the branch the episode is about |
| `docs/sprints/pending.md` | 2,823 | the PM seat, on the branch the episode is about |

`survived_verbatim` means, per `CLAUDE.md` §1, "generated and kept
unchanged" — a model wrote this text and the person kept it. For
`docs/market/landscape.md` that claim is false for every one of its
21,656 characters. The finished file at the episode's `finalSha` is
byte-for-byte the file as it stood in commit `96ed4e5`, "market:
rebase #89's landscape, positioning, and ledger content onto main",
which is on a branch the episode's generation never contained. The
content was moved onto `main` wholesale. Nobody in that episode
composed a character of it, and nobody kept a character of it in the
sense the label asserts.

The per-span machinery already in the codebase could not catch this.
`src/corroborate.ts` (shipped earlier the same day, PR #109) asks per
span whether the span's text exists outside the generation's descent,
and on `docs/market/landscape.md` it fired exactly twice
(`descent:rival:sibling` on 2 spans out of a file with thousands).
The reason it fires so rarely on a file that is wholly imported is in
`src/corroborate.ts`'s own design: Pass 1, the verbatim pass, claims a
span before Pass 2 ever scores it, and `corroborate` is consulted only
on Pass 2 matches. A file that is imported whole is matched almost
entirely by Pass 1, which never asks the question.

This is the general shape of the problem. The per-span test is the
right backstop and the wrong primary, because the available fact is
not per span. The whole file arrived from outside, in one commit, and
asking about it 2,000 times is both expensive and 2,000 chances to be
wrong instead of one.

### 1.1 The same defect, a week earlier, on `docs/standards/pm.md`

The ledger entry that produced this work was triggered by a different
file. On the probe as it stood earlier on 2026-10-06, all seven
`rival` verdicts `src/corroborate.ts` returned were in
`docs/standards/pm.md`, and all seven named one commit: `b59add9`,
"Re-vendor docs/standards/pm.md from HQ main @ 683c7dd". Nine further
spans in that same file came back `unverified` with reason
`span_too_short`, the length floor declining to judge an eleven-
character span in isolation.

`docs/standards/pm.md` no longer appears in the probe's records,
because `main` moved on and the pairing window (`docs/design/pairing-window.md`)
no longer pairs that generation. The defect did not move on. It
reappeared in a different file for the same reason, which is the
argument for fixing it at the level where the fact lives rather than
chasing the file.

---

## 2. What the check proves, exactly

For each of an episode's resolvable paths, compare the **blob object
id** of the file at `ep.finalSha` against the blob object id of the
same path at every commit that is neither the generation nor a
descendant of it.

A git blob object id is the SHA-1 of the content, so equal object ids
mean byte-identical files. An equal object id therefore proves this
statement and nothing beyond it:

> The finished file is byte-for-byte a copy of content that exists
> outside this generation's line of descent.

From which it follows that not one character of the finished file was
composed in this episode, and so that no span of it is a correction of
this generation. Every `survived_verbatim` and `survived_mutated`
label the resolver would attach to that file is false.
`no_generation_provenance` would be true but uninformative: it would
be true of the whole file for a reason the record would not state.
Not classifying it, and saying so, is the honest answer.

**Two relations**, the same two `src/corroborate.ts` uses, carrying
the same meanings:

| relation | what it means | what the episode did to the file |
|---|---|---|
| `pre_existing` | the matching commit is an ancestor of the generation | nothing: the finished file is the file as it stood before the agent wrote |
| `sibling` | the matching commit is neither ancestor nor descendant | the content came off another branch, which the person merged, rebased or checked out rather than typed |

Descendants of the generation are excluded, and that exclusion is what
keeps the test from being vacuous. `ep.finalSha` is itself a descendant
and holds the finished blob by definition, so a test that did not
exclude descendants would call every file in every record an import.

### 2.1 Three things it refuses to claim

1. **A file the agent wrote and nobody changed.** The finished blob
   equals the *generation's* blob, and the generation is excluded from
   its own candidate set, so nothing outside the line of descent holds
   that content. Resolved as the agent's work, which it is.
2. **An emptied file.** Every empty file in every repository shares
   one blob object id,
   `e69de29bb2d1d6434b8b29ae775ad8c2e48c5391`, so an emptied file
   matches an unrelated empty file at the same path. True and useless:
   an empty finished file contributes no span to classify either way,
   so the refusal has nothing to protect. Guarded explicitly.
3. **A path this clone cannot answer for.** When
   `commitsTouchingPath` returns `null`, or `git rev-parse` cannot
   name a blob, the path is resolved rather than refused. A hole in a
   clone is a fact about the clone, and dropping real correction signal
   over it costs the scarcest thing in the artifact. This is the same
   asymmetry `src/corroborate.ts` argues for, and the opposite of
   `src/deletion.ts`'s, where silence would otherwise fall on the
   person.

### 2.2 The limitation, stated rather than discovered later

Skipping the path drops the generation side with it. In an exact
revert — the agent writes X into a file, the person throws all of X
away and leaves the file as they found it — the true record is "the
agent wrote X, the person discarded all of X", a `generated_deleted`
story that is real signal. This change discards it along with the
false `survived_*` labels.

The final-side refusal is still right there, because the finished file
genuinely carries no correction. The generation-side deletion is a
separate question wanting a separate answer, and it is filed as its own
ledger entry (`docs/ideas.md`, 2026-10-06, "An imported final file
still has a discard story"). It is also pinned by a test, so the cost
is visible in the suite rather than implied in prose:
`src/vendored.test.ts`, "loses the discard story when the person
reverts a file outright".

Keeping the generation while dropping the final file was tried and
rejected, for a measurable reason. On the probe it moves the whole
imported document into `generated_deleted`, which inflates the discard
figure by roughly the amount the survival figure was inflated by
before. Dropping both sides is what keeps the record's arithmetic
honest, and the measurement in §6 shows the discard figure falling
(3,715 → 3,447) rather than rising.

---

## 3. System diagram

Nodes are real files and real stores. Edges carry the actual value that
crosses them, named by its type or its on-disk format.

```
                 ┌──────────────────────────────┐
                 │ src/pairfinder.ts            │
                 │ findCommitPairsWithDiagnostics│
                 └──────────────┬───────────────┘
                   CommitPair[] │   CommitInfo[]  (listCommits)
                                ▼
                 ┌──────────────────────────────┐
                 │ src/episodes.ts              │
                 │ buildEpisodes                │
                 └──────────────┬───────────────┘
                     Episode[]  │  (vendoredPaths: undefined)
                                ▼
          ┌─────────────────────────────────────────────┐
          │ src/bin/ursa.ts  main()                     │
          │   resolvablePaths(ep): string[]             │
          └────────┬──────────────────────────┬─────────┘
   string[] paths  │                          │ Episode & { vendoredPaths }
   CommitInfo[]    ▼                          │
          ┌────────────────────────┐          │
          │ src/vendored.ts        │          │
          │ vendoredPaths(...)     │          │
          └───┬───────────┬────────┘          │
   blob oid   │           │ PathCommit[]      │
   (40 hex)   │           │                   │
              ▼           ▼                   │
   ┌──────────────────┐ ┌─────────────────────┴──────┐
   │ git rev-parse    │ │ src/pairfinder.ts          │
   │ <sha>:<path>     │ │ commitsTouchingPath        │
   │ (local helper    │ │ (git log --all -- <path>)  │
   │  blobOid)        │ └────────────────────────────┘
   └──────────────────┘
                                │ VendoredPath[]
                                ▼
          ┌─────────────────────────────────────────────┐
          │ src/bin/ursa.ts  resolveEpisode             │
          │   Set<string> of imported paths, skipped    │
          │   before blobAt() reads either blob         │
          └────────┬────────────────────────┬───────────┘
   ResolveInput    │                        │ Episode[] (annotated)
   (files, gens)   ▼                        ▼
   ┌────────────────────────┐   ┌──────────────────────────────┐
   │ src/resolve.ts resolve │   │ src/bin/ursa.ts              │
   │  → OutcomeRecord       │   │ renderRunSummary             │
   └───────────┬────────────┘   └──────────────┬───────────────┘
  OutcomeRecord│                 string (stdout, the lines in §6)
               ▼                               │
   ┌────────────────────────┐                  │
   │ src/store.ts saveRecord│                  │
   │ .ursa/records/<id>.json│                  │
   └────────────────────────┘                  │
   ┌────────────────────────┐                  │
   │ src/store.ts           │◀─────────────────┘
   │ saveEpisodes           │  Episode[] including vendoredPaths
   │ .ursa/episodes.json    │
   └────────────────────────┘
```

Edge-by-edge, in words, so the diagram can be rendered without
inventing content:

| from | to | what crosses, named |
|---|---|---|
| `findCommitPairsWithDiagnostics` | `buildEpisodes` | `CommitPair[]`, the generated→edited commit pairs |
| `listCommits` | `vendoredPaths`, `gitDescentCorroborator` | `CommitInfo[]`, one graph read per run, carrying `parents: string[]` per commit |
| `main()` | `vendoredPaths` | `string[]`, the output of `resolvablePaths(ep)`: the touched paths whose extension is in `TEXT_EXTS` and whose basename is not in `SKIP_FILES` |
| `vendoredPaths` | `blobOid` → `git rev-parse` | a `(sha, path)` pair; back comes 40 hex characters or `null` |
| `vendoredPaths` | `commitsTouchingPath` | a repo-relative path; back comes `PathCommit[]` (`{ sha, subject }`) newest first, or `null` meaning the clone cannot answer |
| `vendoredPaths` | `main()` | `VendoredPath[]`, the type in §4 |
| `main()` | `resolveEpisode` | `Episode` with `vendoredPaths` populated |
| `resolveEpisode` | `resolve` | `ResolveInput`, with the imported paths absent from both `files` and `generations` |
| `main()` | `saveEpisodes` | `Episode[]`, serialised to `.ursa/episodes.json`, so the exclusion is on disk and not only in stdout |
| `main()` | `renderRunSummary` | `OutcomeRecord[]` and `Episode[]`; the summary reads `vendoredPaths` off the episodes, not the records, so an episode that resolves to nothing still reports |

---

## 4. Interfaces, as the signatures a caller writes against

`src/vendored.ts`:

```ts
/** One resolvable path whose finished blob came in whole from elsewhere. */
export interface VendoredPath {
  /** repo-relative path, as Episode.touchedFiles spells it */
  path: string
  /** the commit outside the generation's descent holding the identical blob */
  sha: string
  /** that commit's subject line */
  subject: string
  /** a third member, 'declared', was added 2026-10-12; see §9.6 */
  relation: 'pre_existing' | 'sibling'
}

/** Candidate commits compared per path before the search gives up. */
export const MAX_CANDIDATE_BLOBS = 40

export function vendoredPaths(
  projectPath: string,
  ep: { generatedSha: string; finalSha: string },
  paths: string[],
  commits: CommitInfo[],
): VendoredPath[]
```

`ep` is deliberately a structural type and not `Episode`. The function
needs two shas, and taking only those is what lets a test assert the
"agent wrote it and nobody changed it" case, which cannot be built as
an episode at all (see §5.3).

`src/corroborate.ts`, newly exported so one definition of "outside this
generation's descent" serves both the span-level and the file-level
refusal:

```ts
export function relatives(commits: CommitInfo[], generatedSha: string): {
  ancestors: Set<string>
  descendants: Set<string>
}
```

`src/episodes.ts`:

```ts
export interface Episode {
  // ... unchanged fields ...
  /**
   * undefined means nobody asked; [] means asked and nothing came in whole.
   */
  vendoredPaths?: VendoredPath[]
}
```

`src/bin/ursa.ts`:

```ts
/** The episode's touched paths this run would read at all. */
export function resolvablePaths(ep: Episode): string[]

export function resolveEpisode(
  projectPath: string,
  ep: Episode,
  commits?: CommitInfo[],
): OutcomeRecord | null
```

`resolveEpisode`'s signature is unchanged. Its behaviour reads
`ep.vendoredPaths` when `main` already asked, and computes the answer
itself when a caller resolves an episode directly, so the refusal does
not depend on which entry point was used:

```ts
const imported = new Set(
  (ep.vendoredPaths ?? vendoredPaths(projectPath, ep, candidates, graph)).map((v) => v.path),
)
```

---

## 5. On-disk layout, with a real payload

### 5.1 `.ursa/episodes.json`

Path: `<project>/.ursa/episodes.json`. Format: a JSON array of
`Episode`, written by `saveEpisodes` in `src/store.ts`. The new field
appears per episode. This is the real entry, verbatim, from the probe
run in §6:

```json
{
  "id": "ursa-probe-2026-09-30-124d880",
  "projectPath": "/tmp/ursa-probe",
  "status": "closed",
  "openedAt": "2026-09-30T03:55:24Z",
  "closedAt": "2026-10-05T03:21:22Z",
  "closureHeuristic": "git-commit-pair",
  "touchedFiles": [
    "docs/market/landscape.md"
  ],
  "generatedSha": "124d8806c96df1bace9acbac2e7c5c135fa0fa29",
  "finalSha": "9452bfd3f2f1094aed67ad7194e72a0452b5d69e",
  "agentMarker": "Claude Sonnet 5 <noreply@anthropic.com>",
  "subject": "market 2026-09-30: landscape refresh, positioning update, brief, 3 ledger proposals",
  "distilled": false,
  "interveningMerges": [],
  "vendoredPaths": [
    {
      "path": "docs/market/landscape.md",
      "sha": "96ed4e5",
      "subject": "market: rebase #89's landscape, positioning, and ledger content onto main",
      "relation": "sibling"
    }
  ]
}
```

Nothing is elided and nothing is a placeholder. Both shas are public
commits on this repository, `projectPath` is a scratch directory rather
than anyone's home directory, and no session or conversation identifier
appears in an episode at all, so the redaction rider in
`prompts/engineer-agent.md` is satisfied by the real payload rather
than by rewriting it.

The other five episodes of that run carry `"vendoredPaths": []`, which
is the asked-and-found-nothing answer and is distinct from the field
being absent.

### 5.2 `.ursa/records/<id>.json`

Unchanged in shape. What changes is what is in it: the record
`ursa-probe-2026-09-30-124d880.json` is no longer written at all,
because `docs/market/landscape.md` was its only resolvable path. That
is the case the episode-level annotation exists for. Without it the run
would print one fewer record and no reason.

### 5.3 Fixture repositories

`src/vendored.test.ts` builds throwaway repositories under
`mkdtempSync(join(tmpdir(), 'ursa-vendored-'))`, author identity set
through `GIT_AUTHOR_NAME` and `GIT_COMMITTER_NAME` in the environment
rather than `git config`, for the reason `m0.test.ts` and
`corroborate.test.ts` both give: the environment outranks a
repository's `user.name` and every agent harness exports it, so a
fixture relying on `git config` is authored by whoever runs the suite.

Two existing fixtures had to change, and the reason is itself a
finding. `corroborate.test.ts`'s `restoredAfterTheAgentReplacedIt` and
`deletion.test.ts`'s `mergeDeletesTheFileRepo` both had the person
restore a file *exactly*, which makes the finished blob byte-identical
to a blob outside the generation's descent — a whole-file import by
this check's definition, correctly detected. Neither test is about
importing. Both now have the person leave a line of their own
alongside the restored content, which is the shape they meant to model,
and every assertion in both is unchanged. The change is annotated in
place in both files.

---

## 6. Exact commands, and the numbers they produced

Build the probe. `--no-local` forces a real object transfer rather than
a hardlink farm, and the `gh` remote is what brings in the sibling
branches the whole check depends on seeing. `~/src/Ursa` stands for
this repository's checkout, per the redaction rider in
`prompts/engineer-agent.md`; it is the only substitution in this
section, and every other string is literal:

```sh
rm -rf /tmp/ursa-probe
git clone --no-local ~/src/Ursa /tmp/ursa-probe
git -C /tmp/ursa-probe remote add gh https://github.com/alexandrapaiz/Ursa.git
git -C /tmp/ursa-probe fetch --no-tags gh '+refs/heads/*:refs/remotes/gh/*'
git -C /tmp/ursa-probe for-each-ref --format='%(refname)' | wc -l   # 105
git -C /tmp/ursa-probe rev-list --all --count                        # 479
```

Run before and after. The "before" tree is a detached worktree at the
parent commit, with `node_modules` symlinked in so the two runs use
one install:

```sh
git worktree add --detach /tmp/ursa-before HEAD~1
ln -s "$PWD/ursa-major/node_modules" /tmp/ursa-before/ursa-major/node_modules

cd /tmp/ursa-before/ursa-major
rm -rf /tmp/ursa-probe/.ursa && time npx tsx src/bin/ursa.ts run /tmp/ursa-probe --limit 40

cd ~/src/Ursa/ursa-major
rm -rf /tmp/ursa-probe/.ursa && time npx tsx src/bin/ursa.ts run /tmp/ursa-probe --limit 40
```

Check the records against the arithmetic gate:

```sh
npx tsx src/invariants.cli.ts /tmp/ursa-probe/.ursa/records
# 5 records checked, 0 violations.
```

Run the suite:

```sh
cd ~/src/Ursa/ursa-major && npm test     # tsc --noEmit && vitest run
# Test Files  25 passed | 1 skipped (26)
#      Tests  422 passed | 4 skipped (426)
```

### 6.1 What changed on the probe

| figure | before | after | why it moved |
|---|---|---|---|
| work units found | 6 | 6 | pairing is untouched |
| records written | 6 | 5 | `ursa-probe-2026-09-30-124d880`'s only resolvable path was the import, so it resolves to nothing |
| chars `survived_verbatim` (final side) | 93,420 | 71,764 | the 21,656 characters of `docs/market/landscape.md` left, being the whole of that file |
| chars `survived_mutated` (final side) | 1,608 | 1,608 | unchanged, as expected: the import was claimed by the verbatim pass, not the fuzzy one |
| chars `no_generation_provenance` | 14,066 | 5,651 | the import's unmatched remainder (8,415) left with it |
| chars generated | 101,142 | 79,485 | the import's generation side left too, which is §2.2's trade |
| chars `generated_deleted` | 3,715 | 3,447 | the discard figure **falls**, which is the check against the inflation §2.2 rejects |
| invariant violations | 0 | 0 | `src/invariants.cli.ts` on all records of both runs |

The new summary lines, verbatim from the "after" run:

```
1 file came in whole from elsewhere and was not read as your work, starting with docs/market/landscape.md.
It is byte-identical to its copy in commit 96ed4e5 ("market: rebase #89's landscape, positioning, and ledger content onto main"), which is on a branch this work never contained, so it was brought in rather than written here.
A file that arrives complete from another commit carries no correction of yours, so its spans were left unclassified rather than classified wrongly.
```

### 6.2 What it costs

Measured on the probe, three runs each, `time` as above: 3.013s before,
3.035s after. The delta is inside the run-to-run noise.

The reason it is that cheap is the object-id comparison. `git rev-parse
<sha>:<path>` returns 40 characters whatever the file's size, so the
check costs the same on a 54KB standard as on a three-line module, and
nothing large is read into the process. Counted directly on the probe
with a throwaway script: 6 episodes, 6 resolvable paths, and 128
`git rev-parse` invocations as the worst case before the per-path cap
or the first match stops the walk. The cap, `MAX_CANDIDATE_BLOBS = 40`,
bounds it at 41 calls per path.

One duplication is known and left in place. `commitsTouchingPath` is
called once by `vendoredPaths` and again by `gitDescentCorroborator`'s
own per-path cache, so a path's history is read from git twice per
episode. Sharing the cache means threading it through two modules'
signatures to save one `git log` per path on a cost already inside
measurement noise, so it is recorded here rather than done.

---

## 7. Tooling

| tool | version | its job here | why it, over what else was considered |
|---|---|---|---|
| `git` | 2.55.0 (`git --version` on the runner) | the whole evidence base: `rev-parse <sha>:<path>` for blob object ids, `log --all -- <path>` for a path's history across every ref | the object ids are git's own content hashes, so no second hashing step can disagree with them. Reading both blobs and comparing strings was the alternative: same answer, costs the file's bytes twice, and invites normalization, which is how "nearly the same" starts passing for "the same" |
| `git rev-parse <sha>:<path>` | n/a, a `git` subcommand | names a blob without reading it | `git cat-file -p` reads the content, `git ls-tree` prints a line that must be parsed for the oid. `rev-parse` returns the 40 characters wanted and nothing else |
| `git log --all` | n/a, a `git` subcommand | enumerates candidate commits per path across every ref, including branches never merged | a single-branch walk cannot see a sibling branch, and sibling branches are precisely where imported content comes from. This is `commitsTouchingPath`'s existing rationale in `src/pairfinder.ts` |
| TypeScript | 5.9.3 installed, `^5.7.2` in `ursa-major/package.json` | `tsc --noEmit` is the first half of `npm test`; `VendoredPath` and the `Episode` field are checked at every call site | already the project's language. The `relation` union is what makes a third relation a compile error rather than a runtime surprise |
| Vitest | 5.0.2 (`npx vitest --version`) | runs `src/vendored.test.ts`'s cases (10 at this section's writing, 22 after §9), each against a real throwaway git repository | already the project's runner (26 test files). Real repositories rather than mocked git, for `corroborate.test.ts`'s stated reason: the defect is never in the git call, it is in what the resolver believes about the answer |
| Node.js | 22.23.3 (`node --version` on the runner) | `node:child_process` `execFileSync` for the git calls, `node:fs` and `node:os` for fixture repositories | `execFileSync` rather than `exec`: no shell, so a path with a space or a quote in it cannot become an injection. This matches `src/pairfinder.ts`'s existing `git()` helper |
| `tsx` | 4.23.15 installed, `^4.19.2` in `ursa-major/package.json` | runs `src/bin/ursa.ts` and the throwaway counting script directly from TypeScript, which is how every probe in this repo is taken | a build step before every probe would add a stale-artifact failure mode to a measurement whose whole point is to be re-runnable |

---

## 8. Terms used above, defined in place

- **blob object id** — the 40-character SHA-1 git stores a file's
  content under. Equal ids mean byte-identical content; this is git's
  own content-addressing, not a hash this project computes.
- **resolvable path** — a path in `Episode.touchedFiles` whose
  extension is in `TEXT_EXTS` and whose basename is not in
  `SKIP_FILES`, both in `src/bin/ursa.ts`. The paths `ursa run` would
  read at all.
- **generation**, on the `ursa run` path — the whole file blob at the
  agent's commit, not a model's chat message. This is why "the
  generation already contained everything the file held" is a routine
  case here and not a corner one.
- **episode** — one generated→edited commit pair, built by
  `buildEpisodes` in `src/episodes.ts`. The unit a record is made from.
- **descendant of the generation** — a commit reachable from
  `generatedSha` by walking child edges in the `CommitInfo[]` graph.
  `relatives` in `src/corroborate.ts` computes it; `finalSha` is always
  one.
- **import**, as this document uses it — a resolvable path whose blob
  at `finalSha` is byte-identical to the blob at some commit that is
  neither the generation nor a descendant of it. Vendoring, a rebase,
  a cherry-pick, a `git subtree` pull and a copied template all produce
  it; the check does not distinguish them and does not need to.
- **the probe** — a clone of this repository with every remote branch
  fetched, used as real input to `ursa run`. The commands are in §6.

---

## 9. The import the search cannot see, and the declaration that answers it

Added 2026-10-12. Sections 1 through 8 describe a check that finds an
import by locating its content somewhere in this repository's own object
store. This section is about the case where that is structurally
impossible, which turned out to be the largest instance of the defect in
this repository.

### 9.1 The defect, as a number

`docs/standards/lessons.md` is a copy of a file owned by
`alexandrapaiz/alexandra-systems`. It arrived here by a sync commit that
copied it from that repository at `775ce36`. On the 2026-10-11 dogfood
run the resolver read all **63,362 characters** of it as model output and
**60,616** of them as text the person kept, and that one file carried
**84.7%** of the run's headline survival figure.

The check in §2 could not refuse it and no amount of care in the blob
comparison would have helped. §2's test is "is this content also at some
commit that is neither the generation nor a descendant of it", and the
answer for imported content is no, because the content did not exist in
this repository at all until the sync commit introduced it. An import
from outside git's reach is invisible to a check that works by looking
inside it.

This is a different failure from §1's. §1 is a file whose copy is *here*
on a sibling branch, which the search finds. §9 is a file whose only copy
*anywhere here* is the one the sync brought in, which the search cannot
find by construction. Both produce the same false claim.

### 9.2 Why a trailer, and why not the subject line

Every sync commit in this repository already names its upstream in
prose:

```
Lessons sync 2026-09-28: HQ standards/lessons.md @ 775ce36
Re-vendor docs/standards/pm.md from HQ main @ 683c7dd
Re-vendor docs/standards/lessons.md from HQ fb03199 (#169)
```

So a regular expression over subject lines would have worked on every
instance of the defect that exists today. It is refused anyway, for two
reasons that are not stylistic.

First, it is the central-assessment overreach the fourth principle names
(`docs/vision.md`): it would reclassify any commit whose message merely
*mentions* a sync, including a commit discussing one, and the person who
wrote that message never agreed to that reading. A `git revert` of a sync
carries the sync's own subject line prefixed with "Revert", and reverting
an import is not importing.

Second, a declaration and a guess are different evidence and the record
has to be able to tell a buyer which it holds. A trailer is a field whose
only purpose is to be read by a machine. It is the same shape as
`--agent-identity` (§ `docs/design/agent-coauthor-detection.md`): where
the library cannot know, the party who does know says so, in a form that
is unambiguous about having been said.

### 9.3 Which commits are asked, and why exactly two

The episode's **generation** and its **final**, in that order. These are
the only two commits any claim in the record rests on, and each voids a
different half of what `survived_verbatim` means — "a model wrote this
and the person kept it":

| commit that declares | what the declaration voids | the real shape it covers |
|---|---|---|
| the generation (`Episode.generatedSha`) | "a model wrote this". The sync was authored by an agent seat, so the pair walk reads it as a generation; the imported text is then credited to a model that only copied it | a sync commit followed by a genuine human edit of the same file. This is the `docs/standards/lessons.md` case in §9.1 |
| the final (`Episode.finalSha`) | "the person kept this". The finished file is upstream's content, so it is not the person's composition either | an agent drafts a file and the person's finishing commit replaces it with the upstream version and says so |

An **ancestor's** or a **sibling's** declaration is not read. Such a
commit says what *it* imported, which is no evidence about what this
episode composed on top of it; and in the sub-case where the imported
content did survive into the finished file unchanged, §2's blob search
already finds it by byte identity and reports it as `pre_existing` or
`sibling`, which is the stronger evidence. Reading ancestors would
therefore add no true verdict and would add the false one where the
person rewrote an imported file into their own work.

### 9.4 Evidence strength, and why this is a second reason rather than a third relation

A declaration is **not** a proof. §2's `imported_whole` asserts that two
blob object ids were compared and found equal, which is byte identity and
nothing weaker. `declared_import` asserts that whoever made the commit
said the content came from outside. That is the strongest evidence
obtainable for content whose source is in another repository, and it is
still a statement.

So the record keeps them apart. A buyer who cannot distinguish a proof
from a statement in the record cannot price the difference, and
collapsing the two would be the same class of defect as reading a
similarity score as descent (`docs/design/corroborated-descent.md`).
Concretely, the invariant that a single reason must satisfy — "this was
established by comparing blob object ids" — is false of a declaration,
so a `declared` relation carrying `reason: 'imported_whole'` would be the
record misdescribing its own evidence.

The same rule reaches the terminal. `renderRunSummary` in
`src/bin/ursa.ts` prints three branches rather than two, because its two
existing sentences both say "byte-identical", and saying that about a
comparison that never ran is the identical defect one layer out.

### 9.5 System diagram, extending §3

Two new nodes and three new edges. Everything else in §3 is unchanged.

```
          ┌─────────────────────────────────────────────┐
          │ src/bin/ursa.ts  main()                     │
          │   resolvablePaths(ep): string[]             │
          └────────┬────────────────────────────────────┘
   string[] paths  │  CommitInfo[]  Episode{generatedSha,finalSha}
                   ▼
          ┌────────────────────────────────────────┐
          │ src/vendored.ts                        │
          │   vendoredPaths(...)                   │
          │     declaration(repoPath, sha)  [NEW]  │
          └───┬────────────────┬───────────────┬───┘
              │                │               │
  Declaration │                │ blob oid      │ PathCommit[]
  {sha,subject,│               │ (40 hex)      │
   paths:Set}  │               │               │
              ▼                ▼               ▼
  ┌───────────────────────┐ ┌──────────────┐ ┌──────────────────────┐
  │ git log -1            │ │ git rev-parse│ │ src/pairfinder.ts    │
  │ --pretty=format:      │ │ <sha>:<path> │ │ commitsTouchingPath  │
  │ %s%x00%(trailers:     │ │ (blobOid)    │ │ (git log --all -- p) │
  │ key=Ursa-Imported-    │ └──────────────┘ └──────────────────────┘
  │ Path,valueonly,       │        [NEW edge is the one on the left;
  │ separator=%x09)       │         these two are §3's, unchanged]
  │        [NEW node]     │
  └───────────────────────┘
                   │
    VendoredPath{relation:'declared'}
                   ▼
          ┌────────────────────────────────────────┐
          │ src/resolve-episode.ts                 │
          │   relation==='declared'                │
          │     ? reason:'declared_import'   [NEW] │
          │     : reason:'imported_whole'          │
          └────────┬───────────────────────────────┘
      Exclusion[]  │
                   ▼
   ┌───────────────────────────────┐   ┌──────────────────────────────┐
   │ .ursa/records/<id>.json       │   │ src/invariants.ts            │
   │   exclusions[].reason         │──▶│ EXCLUSION_NOT_CLASSIFIED     │
   │   = 'declared_import'         │   │ (reason-agnostic, unchanged) │
   └───────────────────────────────┘   └──────────────────────────────┘
```

The edge labels are exact. `git log -1 --pretty=format:...` returns one
string: the subject, a NUL byte, then the declared paths separated by
tabs. NUL and tab are used because neither can occur in a git subject
line or in a path git will check out, so the split needs no escaping.

### 9.6 Interfaces, extending §4

`src/vendored.ts`:

```ts
/**
 * The commit trailer by which the party making a commit declares that the
 * content it is putting at a path came from outside this repository.
 */
export const IMPORT_TRAILER = 'Ursa-Imported-Path'

/** What one commit says about itself: its subject, and the paths it imported. */
interface Declaration {
  /** full sha, as passed in; truncated only when it reaches a VendoredPath */
  sha: string
  subject: string
  /** paths named by IMPORT_TRAILER lines; empty on a commit that declares nothing */
  paths: Set<string>
}

/** Read sha's subject and its import declarations in one git call. */
function declaration(repoPath: string, sha: string): Declaration

/** §4's interface, with one more member in the union. */
export interface VendoredPath {
  path: string
  sha: string
  subject: string
  relation: 'pre_existing' | 'sibling' | 'declared'
}
```

`src/types.ts`:

```ts
export type ExclusionReason =
  | 'imported_whole'   // two blob object ids compared and equal: a proof
  | 'declared_import'  // the committing party said so: a statement

export interface Exclusion {
  path: string
  reason: ExclusionReason
  /**
   * The commit the exclusion rests on: the one outside the generation's
   * descent holding the identical blob when reason is imported_whole,
   * and the declaring commit itself when it is declared_import.
   */
  sha: string
  subject: string
  relation: 'pre_existing' | 'sibling' | 'declared'
  chars: number
}
```

`vendoredPaths`'s signature is unchanged. It takes no new argument: the
two shas it needs are already members of the `ep` parameter it has, which
is why this is a change inside one function rather than a change to a
boundary.

### 9.7 The one correct spelling, and the silent way to get it wrong

Git parses trailers out of the **last paragraph of the message only**.
So this is read:

```
Lessons sync 2026-09-28: HQ standards/lessons.md @ 775ce36

Ursa-Imported-Path: docs/standards/lessons.md
Ursa-Imported-Path: docs/standards/pm.md
Co-Authored-By: Claude <noreply@anthropic.com>
```

and this is **not**, because the co-author block is the last paragraph
and the declaration is a paragraph of its own above it:

```
Lessons sync 2026-09-28: HQ standards/lessons.md @ 775ce36

Ursa-Imported-Path: docs/standards/lessons.md

Co-Authored-By: Claude <noreply@anthropic.com>
```

The two differ by one blank line. The failure is silent: the declaration
is not read, the exclusion does not fire, and the record sells the import
as survival exactly as it did before this change.

This is pinned as behaviour rather than fixed, by the test `does not read
a declaration in a paragraph of its own, above another trailer block` in
`src/vendored.test.ts`, which asserts both halves on histories differing
only by that blank line. Fixing it would mean scanning the whole message
for the key, which is reading prose, which is what §9.2 refuses. The cost
is paid down here and by the `declaring()` helper in the test file, which
exists so that the correct spelling is the easy one to write.

The run that shipped this made exactly this mistake first, in its own
fixtures, and five tests failed before the cause was found.

### 9.8 On-disk layout, with a real payload

The record field is `exclusions[]`, already specified in §5.2. What is
new is the pair of values `reason: "declared_import"` and `relation:
"declared"`. This entry is the literal content of
`/tmp/declared-fixture/.ursa/records/declared-fixture-2026-10-12-5306fd3.json`,
produced by the commands in §9.9 and copied out of the file:

```json
{
  "exclusions": [
    {
      "path": "standard.md",
      "reason": "declared_import",
      "sha": "5306fd3",
      "subject": "Lessons sync 2026-09-28: HQ standard.md @ 775ce36",
      "relation": "declared",
      "chars": 3336
    }
  ]
}
```

The fixture is a throwaway repository under `/tmp`, built by the script
in §9.9, so its shas are reproducible by anyone running those commands
and no identifier here belongs to a private record or to anyone's
machine. The redaction rider in `prompts/engineer-agent.md` is satisfied
by construction rather than by substitution: there is nothing here to
redact.

### 9.9 Exact commands, and the numbers they produced

Build the fixture. Every string below is literal; `standard.md` is the
imported file, `module.ts` is a file the agent genuinely wrote, which
must keep being resolved:

```sh
rm -rf /tmp/declared-fixture && mkdir -p /tmp/declared-fixture
cd /tmp/declared-fixture && git init -q -b main
export GIT_AUTHOR_NAME="Human Owner" GIT_AUTHOR_EMAIL="human@example.com"
export GIT_COMMITTER_NAME="Human Owner" GIT_COMMITTER_EMAIL="human@example.com"

# Baseline, then the sync commit authored by an agent seat, declaring
# its import, then the person's genuine edit of both files.
git add -A && git commit -q -m "Baseline"
GIT_AUTHOR_NAME="claude[bot]" GIT_AUTHOR_EMAIL="noreply@anthropic.com" \
GIT_COMMITTER_NAME="claude[bot]" GIT_COMMITTER_EMAIL="noreply@anthropic.com" \
git commit -q -a -m "Lessons sync 2026-09-28: HQ standard.md @ 775ce36

Ursa-Imported-Path: standard.md
Co-Authored-By: Claude <noreply@anthropic.com>"
git commit -q -a -m "Annotate the standard, finish the module"
```

Confirm git itself reads the declaration, before asking this code to:

```sh
git -C /tmp/declared-fixture log -1 \
  --pretty=format:'%(trailers:key=Ursa-Imported-Path,valueonly)' 5306fd3
# standard.md
```

Run before and after. The "before" tree is a detached worktree at this
branch's first commit, with `node_modules` symlinked so both runs use one
install:

```sh
git worktree add --detach /tmp/ursa-before HEAD~1
ln -sfn "$PWD/ursa-major/node_modules" /tmp/ursa-before/ursa-major/node_modules

cd /tmp/ursa-before/ursa-major
rm -rf /tmp/declared-fixture/.ursa && npx tsx src/bin/ursa.ts run /tmp/declared-fixture

cd /home/runner/work/Ursa/Ursa/ursa-major
rm -rf /tmp/declared-fixture/.ursa && npx tsx src/bin/ursa.ts run /tmp/declared-fixture
```

What those two runs printed, verbatim on the lines that moved:

| figure | before | after |
|---|---|---|
| `stats.byClass.survived_verbatim.chars`, the headline "survived your editing verbatim" | 3,626 | 423 |
| `stats.finalChars`, the finished size the record claims to have read | 3,788 | 452 |
| `files[].path`, the paths the record classifies | `module.ts`, `standard.md` | `module.ts` |
| `exclusions`, the paths it read and refused | `[]` (asked, found nothing) | one entry, §9.8 |

The import was **88.3%** of the headline figure (3,203 of 3,626 characters
removed), which is the same shape as the 84.7% measured on the real
repository in §9.1.

The arithmetic closes exactly, and this is the check worth running rather
than the percentage. The before run read 3,788 characters. The after run
classifies 452 and excludes 3,336. `452 + 3,336 = 3,788`: precisely the
import left the figures and nothing else did.

Check the record against the gate, which has fifteen bounds and no new
one here — `EXCLUSION_NOT_CLASSIFIED` is written against `reason` as a
value rather than against either of its cases, so it covers the new
reason unchanged:

```sh
cd /home/runner/work/Ursa/Ursa/ursa-major
npx tsx src/invariants.cli.ts /tmp/declared-fixture/.ursa/records
# exclusions: 1 path came in whole from elsewhere and was not classified,
#   taking 3,336 chars out of the 3,788 this run read
# OK — every stated bound holds
# 1 record checked, 0 violations.
```

The suite:

```sh
cd /home/runner/work/Ursa/Ursa/ursa-major && npm test
# Test Files  31 passed | 1 skipped (32)
#      Tests  560 passed | 4 skipped (564)
```

550 before, 560 after. The ten are `src/vendored.test.ts`'s new block,
and every one of them asserts its premise as well as its verdict —
including, in the first, that the content exists at that path in exactly
one commit, so that the blob search provably has nothing to find and the
declaration is carrying the whole result.

### 9.10 What this does not do

Stated plainly because the gap is easy to miss in a passing suite.

**It changes nothing about this repository's existing history.** No
commit in this repository carries `Ursa-Imported-Path` today, so
re-running the probe on `main` produces the identical numbers it produced
yesterday. The 60,616-character claim in §9.1 is not retroactively
repaired; it is a claim in a record already written, and this change only
stops the next one.

**It requires the syncing party to adopt the trailer.** Sync commits here
are made by HQ's seats and by the exo-centralizer seat, whose charters
live in another repository; there is no sync script in this repository to
amend (checked: `grep -rln 'Re-vendor' tools/ .github/ scripts/` returns
nothing). So adoption is a convention that has to reach those seats, and
until it does this mechanism is armed and unused. That routing is an
owner and HQ decision rather than an engineering one, and it is filed as
a ledger entry on 2026-10-12 rather than actioned here.

**It does not detect an undeclared cross-repository import.** By design.
The alternative was the subject-line regex §9.2 refuses, and the honest
statement of the residual risk is that an import nobody declares is still
read as composition. §2's blob search remains the only mechanism that
needs no cooperation, and it only sees imports whose content is already
here.

### 9.11 Terms used in this section, defined in place

- **commit trailer** — a `Key: value` line in the last paragraph of a git
  commit message, parsed by `git interpret-trailers` and by
  `--pretty=format:%(trailers:...)`. `Co-Authored-By` is the one this
  project already reads, in `listCommits`.
- **declaration**, as §9 uses it — a statement by the party making a
  commit about content that commit introduces, in a machine-read field.
  Contrasted throughout with a **proof**, which here means equal git blob
  object ids and nothing else.
- **sync commit** — a commit whose content was copied into this
  repository from another repository, named in `CLAUDE.md` under "The
  holding company" as the mechanism by which HQ standards arrive.
- **the generation**, **the final** — `Episode.generatedSha` and
  `Episode.finalSha`, the agent's commit and the person's commit of one
  pair. Defined in §8; repeated because §9.3 turns on the distinction.
- **armed and unused** — of a mechanism that is implemented, tested and
  reachable, but which no producer currently triggers, so it changes no
  output until one does. §9.10's first two paragraphs.

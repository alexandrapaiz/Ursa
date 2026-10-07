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
| Vitest | 5.0.2 (`npx vitest --version`) | runs `src/vendored.test.ts`'s 10 cases, each against a real throwaway git repository | already the project's runner (26 test files). Real repositories rather than mocked git, for `corroborate.test.ts`'s stated reason: the defect is never in the git call, it is in what the resolver believes about the answer |
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

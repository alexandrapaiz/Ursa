# Publishing this repository's own outcome records at a public address

**Status:** measured and ready to land, blocked on two things that are not
the engineer seat's to do. **Written:** 2026-10-18. **Author:** the
engineer seat. **Measured against:** this repository
twice. The three-way measurement in §1 was taken at commit `9a17e50`,
724 commits of history. Every number in §4 was re-taken at commit
`55a20c7`, 743 commits, after the pairing sentence described at the end
of §1 was added to the page, because that sentence changes the bytes the
page weighs.

Held to the engineering-artifact standard in `prompts/engineer-agent.md`:
a system diagram whose nodes are real, interfaces as TypeScript
signatures, on-disk layouts with a real payload, the exact commands, a
tooling list with versions and rationale, and no bare terms.

---

## 1. Why this document exists, and what it found

`ursa run` writes outcome records. `ursa publish` turns them into a
static site. `src/address.ts` gives each record a string a stranger can
type. The frontend seat's viewer resolves that string and renders the
record. All four of those shipped in the week to 2026-10-18.

What did not exist on 2026-10-18 was an address on the internet where any
of it could be seen. `alexandrapaiz.github.io/Ursa` returned 404, and
`gh api repos/alexandrapaiz/Ursa --jq .has_pages` returned `false`: this
repository has never had a Pages site. So the recommendation that reached
this seat was to dogfood — point the publish path at our own records and
our own Pages site, since nothing new has to be built and only a deploy
has to be wired.

**Wiring the deploy was not the gap.** Running the resolver on this
repository's own history, which nobody had done before writing this
document, produced one of two wrong answers depending on one input:

| How it was run | Records | What the numbers mean |
| --- | --- | --- |
| Exactly as `ursa-major/examples/publish-record.yml` tells a consumer to run it, with `agent-identity: github-actions[bot]` and the resolver's default pairing bounds | 10 | **All false.** The resolver credited the edits to `ursa-pm <ursa-pm@agents.epito.me>` (8 pairs) and `Ursa PM Agent <pm-agent@ursa.local>` (2 pairs). Both are agent seats of this company. Every survival figure on those ten pages measures one agent correcting another, and calls it a person correcting a model. |
| This repository's twelve agent identities declared, resolver's default pairing bounds (25 commits) | 0 | **Honest and empty.** 644 of 724 commits looked generated and not one was followed by an edit of the same file by an undeclared identity within 25 commits. |
| Twelve identities declared, `--max-pair-distance 400 --max-pair-age-hours 720` | 2 | **Honest and real.** Both edits credited to `alexandrapaiz <111912770+alexandrapaiz@users.noreply.github.com>`, the owner. 18,552 characters survived her editing verbatim out of 147,539 generated. Re-run at `55a20c7` nineteen commits later, the same two records carry 23,075 survived verbatim and 987 survived edited out of 188,531 generated, with 281 generations left out rather than guessed at. |

The third row is the live example. The reason the first two rows are what
a consumer would have got is a defect in two files this seat owns:

1. **`ursa-major/action.yml` had no input for any pairing bound.** The
   three bounds existed as flags on `ursa run` and there was no way to set
   them from a workflow, so the Pages example was permanently pinned to a
   25-commit distance. On a repository where twelve agent seats commit
   between one touch of a file by a person and the next, 25 resolves
   nothing. The Pages example therefore published an empty site on exactly
   the repositories with the most to publish, and an empty site is
   indistinguishable from a repository with nothing to show.
2. **The bounds reached one launch and not the other.** `src/ci/run.ts`
   called `findCommitPairs(projectPath, { range, agentIdentities })` with
   no bound, so a consumer who raised the distance got the wider walk on a
   laptop and the default on every merge, from byte-identical history.
   That is the fifth entry in the drift list `src/launch.ts` opens with,
   and the same shape as the fourth (`--agent-identity`, 2026-10-11).

Both are fixed in this document's pull request. The drift is pinned by
three assertions in `src/launch-parity.test.ts` against a new fixture
whose generation and correction are seven commits apart, because the
three-commit fixtures in that file are one commit apart and cannot see a
distance bound at all.

**The page now says which row it is.** The three rows above are the same
history read three ways, and until 2026-10-18 nothing a stranger could
open said which reading they were looking at. A published site stated two
records and not the two numbers that produced them, so a reader had no way
to tell a two-record set from the zero-record set the resolver's own
defaults produce on this same repository, and both of those are honest.
The site now carries that sentence, and it carries it because a record
carries the bounds it was resolved under:

- `OutcomeRecord.task.pairedBy` (`src/types.ts`) states the three bounds
  the walk that found this record's generations ran under, stamped by both
  launches through one shared function (`stampPairingBounds` in
  `src/launch.ts`).
- `PublishedIndex.pairing` (`src/publish.ts`) states the distinct bound
  sets present in a published set, which is one set here and can be more
  than one for a project that resolved twice under different bounds.
- `pairingSentences` writes the claim on the index page: every record
  above was paired within 400 commits and 720 hours of the generation it
  corrects with no later generation rewriting the file in between, the
  resolver's own defaults are 25 commits and 168 hours, and widening
  either limit admits pairs a narrower one refuses.
- The empty-site paragraph on that page now names the pairing window as a
  third reason a site comes out empty, beside no merge yet and the
  `min-chars` floor. On a repository where other writers commit between
  the model and the person, it is the usual reason, and it was the one
  reason the page did not state.

This is the one addition the advisor seat's handoff asked for after
reading this document, in a board message from headquarters'
startup-application advisor seat at 2026-10-18 09:09 UTC, quoted in the
run report at `docs/runs/engineer-2026-10-18-message-3.md`.
Its reason is the paragraph above: a reader who cannot see that number
cannot tell that the defaults show nothing.

**What is still not done, and by whom.** See §8. Neither remaining step is
code.

---

## 2. System diagram: every node is a real file, process or store

Nodes are named as they are named in the codebase. Edges carry the actual
data that crosses them, by type name or file format.

```
                    ┌──────────────────────────────────────┐
                    │ .git (this repository, 743 commits)  │
                    └──────────────┬───────────────────────┘
                                   │ CommitInfo[]  (src/pairfinder.ts:
                                   │ sha, authorName, authorEmail,
                                   │ date, trailers)
                                   ▼
   .github/workflows/     ┌──────────────────────────────┐
   ursa-publish.yml ─────▶│ ursa-major/action.yml        │
   (PROPOSED; today       │ step "Resolve the whole      │
   docs/design/pages-     │ history into outcome records"│
   dogfood/ursa-          └──────────────┬───────────────┘
   publish.yml)                          │ argv:
                                         │ run <path> --min-chars 200
                                         │ --max-pair-distance 400
                                         │ --max-pair-age-hours 720
                                         │ --agent-identity <6 substrings>
                                         ▼
                          ┌──────────────────────────────┐
                          │ ursa-major/dist/ursa.cjs     │
                          │ (bundled src/bin/ursa.ts)    │
                          │  pairingBounds(values)       │
                          │  resolvePairingBounds        │
                          │  findCommitPairsWithDiagnostics
                          │  buildEpisodes               │
                          │  resolveEpisode              │
                          │  stampPairingBounds          │
                          │  gateRecords (18 bounds)     │
                          └──────────────┬───────────────┘
                                         │ OutcomeRecord (src/types.ts),
                                         │ including task.pairedBy:
                                         │ PairingBounds,
                                         │ one JSON file per record
                                         ▼
                          ┌──────────────────────────────┐
                          │ <workspace>/.ursa/records/   │
                          │   <id>.json                  │
                          │ (src/store.ts, saveRecord)   │
                          └──────────────┬───────────────┘
                                         │ OutcomeRecord[]
                                         │ via loadPublishable()
                                         ▼
                          ┌──────────────────────────────┐
                          │ ursa-major/src/publish.ts    │
                          │  manifestFor → DisclosureManifest
                          │  publish({acknowledged:true})│
                          │  renderViewer (src/viewer.ts)│
                          │  distinctPairingBounds →     │
                          │    PublishedIndex.pairing    │
                          │  pairingSentences → the page │
                          │  formatRecordAddress,        │
                          │  pagesAddress (src/address.ts)
                          └──────────────┬───────────────┘
                                         │ 2N+3 static files:
                                         │ index.html, index.json,
                                         │ .nojekyll,
                                         │ records/<id>.html,
                                         │ records/<id>.json
                                         ▼
                          ┌──────────────────────────────┐
                          │ _site/  (runner filesystem)  │
                          └──────┬───────────────┬───────┘
                                 │               │ same bytes
            tar.gz artifact      │               │
            ("github-pages")     ▼               ▼
              ┌──────────────────────────┐   ┌────────────────────────────┐
              │ actions/upload-pages-    │   │ ursa-major/tools/measure-  │
              │ artifact@v3              │   │ published-site.ts          │
              └────────────┬─────────────┘   │  gzipSync level 9          │
                           │ artifact id     │  sha256 of records/<id>.json
                           ▼                 │  vs PublishedRecordSummary │
              ┌──────────────────────────┐   │  .bytes / .sha256          │
              │ actions/deploy-pages@v4  │   └─────────────┬──────────────┘
              └────────────┬─────────────┘                 │ stdout table,
                           │ page_url                      │ exit 0 or 1
                           ▼                               ▼
   ┌──────────────────────────────────────┐   ┌────────────────────────────┐
   │ https://alexandrapaiz.github.io/     │   │ the run's job summary      │
   │ Ursa/                                │   └────────────────────────────┘
   │   index.html                         │
   │   records/<id>.html                  │
   │   records/<id>.json                  │
   └──────────────┬───────────────────────┘
                  │ HTTP GET, index.json then one records/<id>.json,
                  │ with access-control-allow-origin: *
                  ▼
   ┌──────────────────────────────────────┐
   │ ursa-minor/app/record/at/            │
   │ [[...address]]/page.tsx              │
   │ (the frontend seat's viewer; reads   │
   │ the address grammar, hashes the      │
   │ bytes, compares with .sha256)        │
   └──────────────────────────────────────┘
```

Two things that diagram says and a prose summary would not:

- **`_site/` has two consumers, not one.** The deploy path and the
  weight measurement read the same directory. The measurement is not a
  test fixture; it is the published bytes.
- **The viewer's edge is an HTTP GET with a named response header.** The
  cross-origin header is a property of the host, not of the path, which
  is why an account with no Pages site at all answers with the platform's
  own not-found page and no header, and a browser reports a refusal
  rather than a 404. That case is the ordinary first failure on the
  published address form, and the frontend seat's page names it first.

---

## 3. Interfaces at every component boundary

The signatures a caller writes against. Changed or added by this work,
marked.

```ts
// src/bin/ursa.ts — ADDED. The three bounds parsed once, for both
// launches, so reading them in one and not the other has to become an
// edit to this function rather than an omission in one of two places.
export function pairingBounds(values: {
  'max-pair-distance'?: string
  'max-pair-age-hours'?: string
  'max-interposed-generations'?: string
}): {
  maxPairDistance: number | undefined
  maxPairAgeHours: number | undefined
  maxInterposedGenerations: number | undefined
}

// src/ci/run.ts — THREE FIELDS ADDED to CiOptions. Undefined means the
// resolver's own default (25 commits, 168 hours, 0 interposed
// generations), so an omitted bound changes nothing for any existing
// caller.
export interface CiOptions {
  projectPath: string
  eventPath: string
  repo: string
  token: string
  minChars?: number
  agentIdentities?: string[]
  maxPairDistance?: number          // added
  maxPairAgeHours?: number          // added
  maxInterposedGenerations?: number // added
  post?: boolean
  // …
}

// src/pairfinder.ts — unchanged, and the reason the above is only
// plumbing. The bounds have always been optional here, with the defaults
// written down once: DEFAULT_MAX_PAIR_DISTANCE = 25,
// DEFAULT_MAX_PAIR_AGE_HOURS = 168,
// DEFAULT_MAX_INTERPOSED_GENERATIONS = 0.
export interface PairFinderOptions {
  range?: { base: string; head: string }
  agentIdentities?: string[]
  maxPairDistance?: number
  maxPairAgeHours?: number
  maxInterposedGenerations?: number
}
export function findCommitPairsWithDiagnostics(
  projectPath: string,
  opts?: PairFinderOptions,
): { pairs: CommitPair[]; diagnostics: PairFinderDiagnostics }

// src/types.ts — ADDED. The three bounds as a record states them, after
// the walk resolved every one the caller left unset. Numbers and not
// optionals: a record says what the walk used, never what a caller
// omitted, so reading one never requires knowing which build's defaults
// were in force.
export interface PairingBounds {
  maxPairDistance: number
  maxPairAgeHours: number
  maxInterposedGenerations: number
}

// src/types.ts — ADDED to OutcomeRecord['task'], beside `resolvedBy` and
// `gatedBy`, with the same preserve-never-overwrite rule. Absent is a
// claim rather than a gap: a chat-path record walked no commits, and a
// record written before 2026-10-18 was written by a build that stamped
// nothing. Absent is never shorthand for the defaults.
pairedBy?: PairingBounds

// src/pairfinder.ts — ADDED. The resolved numbers, which two callers
// need and neither could reach before: the walk itself, and the launch
// that calls `findCommitPairs` and gets no diagnostics back.
export function resolvePairingBounds(opts?: PairFinderOptions): PairingBounds

// src/launch.ts — ADDED. One stamp for both launches, because the bounds
// reaching one launch and not the other is drift 5 in that file's own
// list and a stamp written twice is the same defect one level down,
// where a reviewer is less likely to see it. One record at a time,
// because both launches write each record inside the loop that resolved
// it.
export function stampPairingBounds(record: OutcomeRecord, bounds: PairingBounds): void

// src/publish.ts — PUBLISHED_INDEX_VERSION moves from '0.3.0' to '0.4.0'
// for one additive field, `pairing`. The frontend seat's viewer pins the
// major and accepts any minor at or above the one it was written
// against, so a field arriving has to move the number to be detectable
// rather than discoverable.
export interface PublishedIndex {
  indexVersion: typeof PUBLISHED_INDEX_VERSION
  publishedAt: string
  repository: string | null
  recordSchemaVersions: string[]
  pairing: PairingBounds[]          // added: the distinct bound sets present
  records: PublishedRecordSummary[]
  disclosed: DisclosureManifest
}

// src/publish.ts — ADDED. The sentences the index page carries about how
// its records were paired, written in one place so the page cannot state
// a second version of the claim. Returns prose for the caller to escape,
// never markup.
export function pairingSentences(index: PublishedIndex): string[]

// src/publish.ts — otherwise unchanged by this work, and the contract
// this document's measurement checks.
export function manifestFor(records: OutcomeRecord[]): DisclosureManifest
export function publish(opts: {
  projectPath: string
  outDir: string
  acknowledged: boolean
  repository?: string | null
  publishedAt?: string
}): { written: string[]; index: PublishedIndex; warnings: string[] }

// tools/measure-published-site.ts — NEW, a script rather than a module.
// Its interface is its argv and its exit status:
//   --site <dir>              a directory written by `ursa publish`
//   --max-transfer-kb <n>     optional gate on gzipped bytes per page
//   --max-parse-mb <n>        optional gate on bytes on disk per page
//   --out <file>              write the report beside printing it
// exit 0  measured, every claim in index.json matched the bytes on disk
// exit 1  a claim was false, or a budget that was passed was exceeded
// exit 2  bad invocation, or <dir> is not a published site
```

---

## 4. On-disk layout, with a real payload

The site this repository produces, at real paths, with the real file
sizes measured on 2026-10-18 at commit `55a20c7`, with the pairing
sentence on the index page:

```
_site/
├── .nojekyll                                      0 bytes
├── index.html                                 9,448 bytes
├── index.json                                 2,789 bytes
└── records/
    ├── Ursa-2026-10-05-dc829be.html        1,793,938 bytes
    ├── Ursa-2026-10-05-dc829be.json        2,822,533 bytes
    ├── Ursa-2026-10-18-6adca0b.html        2,191,503 bytes
    └── Ursa-2026-10-18-6adca0b.json        3,412,104 bytes
```

The two record ids are not the two this document's first measurement
named, and the reason is the file they are about. Both records resolve
`docs/standards/lessons.md`, which headquarters re-vendors into this
repository every few days, so the second episode's closing commit moves
forward as the vendoring commits land: it was `8c453f0` at `9a17e50` and
is `6adca0b` at `55a20c7`. The set is the same two work units and the
second one's finished text is nineteen commits newer, which is also why
its page gained 390 KiB.

The index page gained 417 bytes between the two measurements, which is
the pairing sentence plus the longer empty-site paragraph, and the index
gained 130 bytes, which is the `pairing` field.

**On the record ids in this listing.** `episodeId` in `src/episodes.ts`
builds `<directory-name>-<YYYY-MM-DD>-<sha7>`, so a record is named after
the directory it was resolved in. On a GitHub runner that directory is
`$GITHUB_WORKSPACE`, whose last segment is the repository name, which is
where `Ursa-…` above comes from. The measurement behind this document was
taken in a sandbox checkout, so the ids it produced carried that
checkout's directory name instead, and `publish()` warned about it by
name before writing a byte:

> warning: record "…" will be published at records/….html, and the
> "…" in that address is the name of the directory this work was resolved
> in, not "ursa". If that directory name is not something you want in a
> public URL, rename the checkout and resolve again before publishing.

The ids are normalised to the runner form here under the redaction rider
in `prompts/engineer-agent.md` element 3. The byte counts and digests are
the sandbox build's real ones; because the id is a field inside the
record, a runner's build of the same two episodes will have the same shape
and different digests.

### `_site/index.json`, the real file, one record elided for length

```json
{
  "indexVersion": "0.4.0",
  "publishedAt": "2026-10-18T09:23:32.384Z",
  "repository": "alexandrapaiz/Ursa",
  "recordSchemaVersions": ["0.1.0"],
  "pairing": [
    {
      "maxPairDistance": 400,
      "maxPairAgeHours": 720,
      "maxInterposedGenerations": 0
    }
  ],
  "records": [
    {
      "id": "Ursa-2026-10-18-6adca0b",
      "generatedAt": "2026-10-18T03:09:55-04:00",
      "finished": true,
      "artifactKind": "repo",
      "finalChars": 109737,
      "coveredChars": 104540,
      "charsByClass": {
        "survived_verbatim": 8502,
        "survived_mutated": 203,
        "no_generation_provenance": 95835
      },
      "spansByClass": {
        "survived_verbatim": 284,
        "survived_mutated": 6,
        "no_generation_provenance": 1813
      },
      "generatedChars": 107578,
      "generatedDeletedChars": 400,
      "resolvedBy": { "basis": "git_commit", "value": "55a20c7" },
      "html": "records/Ursa-2026-10-18-6adca0b.html",
      "json": "records/Ursa-2026-10-18-6adca0b.json",
      "address": "pages/alexandrapaiz/Ursa/Ursa-2026-10-18-6adca0b",
      "bytes": 3412104,
      "sha256": "7eeb36f8e5c36fcc…"
    }
  ],
  "disclosed": {
    "records": 2,
    "recordIds": ["Ursa-2026-10-05-dc829be", "Ursa-2026-10-18-6adca0b"],
    "adapters": ["git"],
    "finalFiles": 1,
    "filePaths": ["docs/standards/lessons.md"],
    "finalChars": 209600,
    "generations": 2,
    "generationChars": 188531,
    "conversations": 2,
    "prompts": 0,
    "promptChars": 0
  }
}
```

`pairing` is the field this work added, and it is the whole mechanism
behind the sentence on the page: the index states the bound sets its
records were resolved under, as an array because one published set can
hold records from two runs that used different bounds, and the page reads
that array rather than being told a number by whoever built the site.
Here it holds one set, so the page states it in one sentence.

Read that payload for what it says about this record rather than for its
shape. 109,737 characters of `docs/standards/lessons.md` as the owner
left it. 8,502 of them stand exactly as a model wrote them, across 284
separate spans. 203 more were kept but edited, across 6 spans, and the
edit is the correction. 95,835 characters, which is 87% of the file,
trace to no generation at all. That is the `no_generation_provenance`
class and the most valuable one: on seven eighths of that document the
model was never in the running. 107,578 characters were generated and
400 of them were thrown away.

`"prompts": 0` is load-bearing for what this site may claim. On the git
path a generation is the blob of a touched file at the agent's own commit,
so every one of those 188,531 characters is already in this public
repository's history and publishing them discloses nothing new. The
sentence "this text has never been public before" would be false here, and
`DisclosureManifest.adapters` is the field that lets the disclosure know
which sentence it is allowed to print.

### What a reader pays, measured

`npx tsx tools/measure-published-site.ts --site /tmp/ursa-site
--max-transfer-kb 512 --max-parse-mb 4`:

```
index contract 0.4.0
published 2026-10-18T09:23:32.384Z, repository alexandrapaiz/Ursa
2 records

What every reader pays, before opening any record:
  index.html   transfer    3.4 KiB   parse    9.2 KiB
  index.json   transfer    0.8 KiB   parse    2.7 KiB

Per record page, heaviest first:
  transfer     parse    embedded record   record id
  257.6 KiB  2.09 MiB   2107.1 KiB (98%)   Ursa-2026-10-18-6adca0b
  226.6 KiB  1.71 MiB   1718.8 KiB (98%)   Ursa-2026-10-05-dc829be

Whole site on disk: 9.76 MiB across 7 files.
Sum of every page's transfer, if one reader opened all of them: 488.5 KiB.
Heaviest single page: 257.6 KiB over the wire, 2.09 MiB to parse, 98% of
it the record embedded for self-containment.

Every byte count and digest in index.json matched the file it describes
(2 records checked).
Every page is within the 512 KiB transfer budget.
Every page is within the 4 MiB parse budget.
```

Three readings of that, because the three numbers are not the same cost:

- **The set page is 3.4 KiB over the wire.** The "2.5 MB page" the
  frontend seat fixed on 2026-10-18 was the set page inlining every
  record; it does not recur here, and this is the first time that fix has
  been measured against real records instead of a fixture.
- **A record page is 258 KiB over the wire and 2.09 MiB to parse.** The
  honest statement about the heavy page is that the reader waits for a
  quarter of a megabyte and the browser then decompresses and parses
  eight times that. On a phone the second number is the one that is felt.
- **98% of the page is the record embedded in it.** `src/publish.ts`
  embeds the record in a `<script id="record" type="application/json">`
  so the page renders from `file://` with no network, which is the
  property that makes a published record readable with no other software
  in the world. The duplication is the price of that property and not a
  defect. It is measured here so that a future decision to give it up is
  taken against a number.

The same measurement over the earlier ten-record build, for the record:
heaviest page 270.8 KiB over the wire, 2.45 MiB to parse, 99% embedded,
whole site 20.23 MiB, every digest matching.

---

## 5. Exact commands

Every literal invocation this path runs, in order. These are the commands
that produced every number in this document.

```bash
# 0. Find the identities in this repository that are agents rather than
#    people. Six substrings cover the twelve seats plus two bots and one
#    headquarters identity.
git log --format='%an <%ae>' | sort | uniq -c | sort -rn

# 1. Resolve, the way the shipped example tells a consumer to. Produces
#    ten records and ten false numbers; kept here because it is what a
#    consumer would have run.
node ursa-major/dist/ursa.cjs run .

# 2. Resolve honestly, at the default bounds. Produces zero records, and
#    says why in its own words.
node ursa-major/dist/ursa.cjs run . \
  --agent-identity agents.epito.me \
  --agent-identity 'claude[bot]' \
  --agent-identity ursa.local \
  --agent-identity exo-centralizer \
  --agent-identity alexandra-systems-hq \
  --agent-identity anthropic.com

# 3. Resolve honestly, at the bounds this repository actually needs.
#    Produces the two records that are the live example. Takes about
#    eight minutes on 743 commits.
node ursa-major/dist/ursa.cjs run . \
  --max-pair-distance 400 --max-pair-age-hours 720 \
  --agent-identity agents.epito.me \
  --agent-identity 'claude[bot]' \
  --agent-identity ursa.local \
  --agent-identity exo-centralizer \
  --agent-identity alexandra-systems-hq \
  --agent-identity anthropic.com

# 4. Read the disclosure. Writes nothing, exits 3, prints every file path
#    and every character count that would become public.
node ursa-major/dist/ursa.cjs publish . --out /tmp/ursa-site

# 5. Write the site, acknowledging exactly what step 4 printed.
node ursa-major/dist/ursa.cjs publish . --out /tmp/ursa-site \
  --repo alexandrapaiz/Ursa --yes

# 6. Weigh it, and check every byte count and digest in index.json
#    against the file it describes.
cd ursa-major && npx tsx tools/measure-published-site.ts \
  --site /tmp/ursa-site --max-transfer-kb 512 --max-parse-mb 4

# 7. Print the address of each record and what is still missing for it to
#    be readable, asking the host for its status and its cross-origin
#    header.
node ursa-major/dist/ursa.cjs address . --pages alexandrapaiz/Ursa --check

# 8. The tests this change admits.
cd ursa-major && npx tsc --noEmit && npx vitest run

# 9. Rebuild the single-file bundle the Action runs, and re-index its
#    digest, because step 1 to 7 above run dist/ursa.cjs and not src/.
cd ursa-major && npm run bundle && npm run provenance:bundles

# 10. The two steps that are NOT this seat's (see §8). The first is a
#     file copy from a seat that owns .github/workflows; the second is
#     the owner's switch.
cp docs/design/pages-dogfood/ursa-publish.yml \
   .github/workflows/ursa-publish.yml
gh api -X POST repos/alexandrapaiz/Ursa/pages -f 'build_type=workflow'
```

---

## 6. Tooling

Every tool this path depends on, with its version, its job, and why it
rather than the alternative that was considered.

| Tool | Version | Its job here | Why this and not the alternative |
| --- | --- | --- | --- |
| Node.js | 22.23.2 (measured); `ubuntu-latest` runner's own | Runs `dist/ursa.cjs`, which is the resolver and the publisher | Already on every GitHub runner, so the Action installs nothing. The alternative, a container image, adds a pull of hundreds of megabytes per run to a job whose real work is a git walk. |
| `ursa-major/dist/ursa.cjs` | built from commit `55a20c7` by `build/bundle.mjs`; digest indexed in `docs/provenance/bundle-digests.json` | The single file the Action executes | A published bundle on npm would need a registry account, a release step and a version to pin. A committed bundle is auditable by digest from the repository that produced it, which is what `docs/provenance/bundle-digests.md` exists for. |
| esbuild | 0.28.2 | Builds that bundle | Chosen when the bundle landed: one dependency, no config file, and a build measured in milliseconds. Rollup would add a plugin graph for a single-entry CommonJS output. |
| TypeScript | 5.9.3 | `tsc --noEmit` over `src/` and `tools/` | The record schema is the product, and `OutcomeRecord` is the contract a lab audits. A JSDoc-checked JavaScript codebase cannot express `Record<SpanClass, number>` as a closed key set. |
| vitest | 5.0.2 | The 1,000-odd assertions, including the three new parity ones | Already this package's runner; reads the same `tsconfig.json` as the build, so a test and the shipped code cannot disagree about module resolution. Jest would need a second transform configuration. |
| tsx | 4.23.15 | Runs `tools/measure-published-site.ts` and the other tools straight from TypeScript | A tool that needs a build step before it can measure anything is a tool nobody runs during an incident. |
| `node:zlib` `gzipSync` level 9 | ships with Node | The transfer figure, which is what a static host serves and therefore what the reader waits for | Nothing is installed and nothing is fetched. The alternative, measuring over the network against the live site, cannot run before the site exists, which is the state this document is written in. |
| `node:crypto` `createHash('sha256')` | ships with Node | Verifies `PublishedRecordSummary.sha256` against the bytes on disk | The same algorithm the frontend viewer uses in the browser (`crypto.subtle.digest('SHA-256')`), so the two agree by construction rather than by coincidence. |
| Playwright | not a dependency; `npm i -D playwright` when needed | Layout measurement in `tools/measure-index-page.ts`, a separate tool | Named here to say why the weight tool does **not** use it: a browser download and `--with-deps` system libraries must not stand between a runner and the question "what does this page weigh". |
| `actions/checkout` | v5, `fetch-depth: 0` | Gives the runner both sides of every commit pair | At `max-pair-distance: 400` the two commits can be 400 apart, so a shallow clone has neither. The Action deepens a shallow clone itself as a backstop; fetching once in the checkout is cheaper than fetching inside the job. |
| `actions/upload-pages-artifact` | v3 | Packs `_site/` into the `github-pages` artifact | The only input `actions/deploy-pages` accepts. |
| `actions/deploy-pages` | v4 | Creates the Pages deployment | The GitHub-Actions Pages source, as opposed to deploy-from-branch, is what lets the site be built rather than committed. Committing a 8.73 MiB `_site/` to `main` on every publish is the alternative, and `.gitignore` already refuses `.ursa/` for the same reason: generated record data is not repository content. |
| GitHub CLI (`gh`) | 2.101.0 | Reads `has_pages`, and sets the Pages source in §8 | The REST call is one line and needs no browser session. The browser settings page is the same change and leaves no command anyone can re-run. |
| git | 2.43.0 | Every generation and every edit this path reads | The repository *is* the capture surface on this path. There is no alternative; that is the design. |

---

## 7. Terms used above, defined in place

| Term | What it means here |
| --- | --- |
| Outcome record | A finished piece of work joined backward to every model generation that fed it, with each span of the finished product labelled by what happened to it. The type is `OutcomeRecord` in `ursa-major/src/types.ts`. |
| `survived_verbatim` | A span of the finished file that a model generated and the person kept byte-identically. |
| `survived_mutated` | A span a model generated and the person kept after editing. The edit is the correction, expressed as a change rather than as a complaint. |
| `no_generation_provenance` | A span present in the finished work that traces to no generation at all, meaning no model was ever in the running for it. |
| Pair, and pairing bound | A pair is one model commit and one later commit by a person that edits the same file; the resolver reads the second as a correction of the first. A pairing bound is a limit past which it stops believing that — distance in commits, age in hours, or how many times another model commit rewrote the file in between. |
| Agent identity | A substring of a commit's author name or author email that the repository's owner declares to belong to an agent rather than to a person. Matched case-insensitively. Undeclared identities are read as people. |
| Disclosure manifest | The counted list of exactly what becomes public, computed and printable before a byte is written. `DisclosureManifest` in `src/publish.ts`; `publish()` refuses to write without `acknowledged: true`. |
| Transfer bytes / parse bytes | Transfer is the gzip-compressed size a static host sends, which is what the reader waits for. Parse is the size on disk, which the browser must decompress, parse and hold, and is the number a phone feels. |
| Published index contract | `index.json`, versioned independently of the record schema at `PUBLISHED_INDEX_VERSION` (`0.4.0` as of this work, from `0.3.0`), because the index can gain a field without a record changing. The field it gained here is `pairing`. |
| Record address | The string a stranger can be sent, in the grammar of `src/address.ts`. For a site published this way it is `pages/<owner>/<repo>/<record-id>`. |
| Deploy from branch, versus GitHub Actions as Pages source | Two ways GitHub serves a Pages site: from files committed to a branch, or from an artifact a workflow uploads. This path uses the second, so nothing generated is committed. |
| Drift, and the drift list | A decision that `ursa run` and `ursa ci` must make identically and had come to make differently. The numbered list is at the top of `src/launch.ts`; `src/launch-parity.test.ts` is the test that finds them. |

---

## 8. What is left, and whose it is

Two steps remain and neither is code. Both are named here with the exact
command, so that whoever owns them does not have to re-derive anything.

**8.1 — The workflow file. Headquarters'.** `docs/standards/pm.md` §15
says workflow files in a product repository belong to headquarters and
that a product seat does not edit `.github/workflows` in its own
repository; the engineer seat's own dispatch instruction says the same
thing in four words. Every commit to `.github/workflows/` in this
repository's history is the owner's or the exo-centralizer's, with no
exception, so this is practice and not only standard. The file is
therefore committed at `docs/design/pages-dogfood/ursa-publish.yml`, where
it does not run, and landing it is one copy:

```bash
cp docs/design/pages-dogfood/ursa-publish.yml \
   .github/workflows/ursa-publish.yml
```

It differs from `ursa-major/examples/publish-record.yml` in one way worth
reviewing rather than accepting: **it has no `push` trigger.** The resolve
step walks all 743 commits and takes about eight minutes at distance 400;
this repository takes a dozen merges to `main` on a busy day; and the
`pages` concurrency group refuses to cancel a half-finished deployment.
A push trigger would spend the day queued behind itself, publishing sets
that differ from each other by at most one record. So it runs on
`workflow_dispatch` and on `repository_dispatch: [ursa.publish]`, which is
how every seat in this repository is already woken, and not on a
`schedule`, because every seat's clock left GitHub on 2026-10-17.

**8.2 — The Pages source. The owner's.** Until the source is set to
GitHub Actions, `actions/deploy-pages` fails with a message naming the
setting. It is one call, it publishes nothing by itself, and it is
reversible:

```bash
gh api -X POST repos/alexandrapaiz/Ursa/pages -f 'build_type=workflow'
```

This seat did not run it. Turning on public web hosting for the company's
repository is the owner's decision even though this particular call
publishes no content, and there is no deploy to pair it with until 8.1
lands anyway.

**What is true today, before either step.** The two records exist, the
site builds, every digest in its index matches the bytes beside it, and
the address `pages/alexandrapaiz/Ursa/<record-id>` is the one the
frontend seat's viewer resolves. The only missing thing is the host.

---

## 9. Rollback

Each piece independently, in the order that undoes the most with the least.

| To undo | Command or action | Effect |
| --- | --- | --- |
| The live site | `gh api -X DELETE repos/alexandrapaiz/Ursa/pages` | The address stops serving. Records on disk and in the artifact are untouched. |
| The workflow, if 8.1 landed | `git rm .github/workflows/ursa-publish.yml` | No further publish runs. The last deployment stays live until the line above is also run. |
| The Action's three new inputs | Revert this document's pull request | Consumers who set no bound are unaffected either way: an unset input appends no flag, so the resolver's defaults were in force before and after. |
| The bounds on this repository only | Set `max-pair-distance: 25` in the workflow | The site publishes empty rather than wrong. That is the honest failure and it is why the empty case is documented in §1 rather than treated as a bug. |
| The weight tool | `git rm ursa-major/tools/measure-published-site.ts` | Nothing else imports it. It is not wired into `npm test`. |
| The sentence on the page, keeping the field | Delete the `<p class="legend">${pairingSentences(index)…}</p>` line and the pairing clause in the empty-site paragraph in `src/publish.ts`, then `npm run bundle` | The index still states `pairing`, so a machine reading `index.json` loses nothing and a person reading the page loses the number again. Two tests in `src/publish.test.ts` fail by name, which is the intended cost of removing a claim. |
| The field as well as the sentence | Also delete `pairing` from `PublishedIndex` and `distinctPairingBounds`, and set `PUBLISHED_INDEX_VERSION` back to `0.3.0` | A consumer reading 0.4.0 sees one fewer field. Records keep `task.pairedBy`, since the stamp is upstream of publishing and a record states it whether or not a site does. |
| The stamp in the record | Revert `stampPairingBounds` and its two call sites, and `task.pairedBy` in `src/types.ts` | Records written before this work are unaffected, because the field was always optional and absent already meant "nothing stamped this". Records written after it keep the field, since nothing rewrites a saved record. |

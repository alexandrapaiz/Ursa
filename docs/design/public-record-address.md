# From a stranger's repository to a public outcome record

Engineer run, 2026-10-18. Woken by a board `handoff` from `pm`/Ursa
(2026-10-18T00:27:28Z) relaying the owner's MVP directive of
2026-10-17T19:44Z, not by a sprint item: no sprint file covers this yet
and Monday's ceremony is after the deadline. Written to the
engineering-artifact standard in `prompts/engineer-agent.md`: a system
diagram whose nodes are real, interfaces as TypeScript signatures,
on-disk layouts with a real payload, exact commands, a versioned tooling
list, and no bare terms.

## 1. The sentence this has to satisfy

The owner's directive, as the handoff states it:

> A stranger opens a URL, runs `ursa` against their own repository from a
> line in the README, and reads the resulting outcome record with its
> provenance at that address, without you or me in the loop.

Deadline: Wednesday's brief, 2026-10-21.

The handoff splits it. The viewer and the visual side are the frontend
seat's. **This seat's half is the record itself reaching an address.**
Section 11 states where the two meet and why the line is drawn there.

## 2. What already existed, and the exact distance left

The resolver has been correct and unreadable at the same time since it
shipped. Four facts, each checked in the tree at `60f2c7a` rather than
recalled:

| Fact | Where it is true | What it leaves undone |
|---|---|---|
| The local launch writes records and stops | `src/bin/ursa.ts` calls `saveRecord` in `src/store.ts`, which writes `<project>/.ursa/records/<task.id>.json` | The file is JSON on the person's own disk. No page, no address |
| The Action launch writes records into a workspace that is then destroyed | `src/ci/run.ts` line 198 calls the same `saveRecord`; `action.yml`'s own header says "records are written to `.ursa/` inside the runner's workspace and the workspace is destroyed when the job ends. Nothing is uploaded" | The only thing that escapes a merge is the run comment: five aggregate numbers and one file path |
| A self-contained HTML page per record has existed since 2026-09-25 | `renderViewer(record)` in `src/viewer.ts`, 681 lines, inlines the record and needs no network | Its only non-test caller is `src/cli.ts` line 155, the older chat-only launch, which writes it into a local `--out` directory. Neither `ursa run` nor `ursa ci` has ever called it |
| Nothing lists a set of records | — | A repository accumulates records. No file in the tree renders more than one at a time, so there is nothing for an address to point *at* |

So the gap was never classification or rendering. It was that the two
launches a stranger can actually reach produce no page, and that no
artifact exists over the set. Two files close it:
`ursa-major/src/publish.ts` and `ursa-major/examples/publish-record.yml`.

Terms used throughout, defined here so that no cell below stands as a
bare noun:

- **outcome record** — one finished piece of work joined backward to
  every model generation that fed it, with every character range of the
  final text labelled by what happened to it. The TypeScript type
  `OutcomeRecord` in `ursa-major/src/types.ts` line 1036.
- **span** — a contiguous character range of a final file carrying one
  of three labels: `survived_verbatim` (a model wrote it and nobody
  altered it, byte for byte), `survived_mutated` (a model wrote it and a
  person changed it), `no_generation_provenance` (it is in the finished
  work and traces to no generation at all).
- **generation** — one model output. On the git path it is the whole
  blob of a touched file at the agent's own commit; on the session path
  it is an assistant message or the content of one `Write`/`Edit` tool
  call.
- **capture path** — which of three adapters produced a record's
  conversations: `git` (walked out of commit history), `claude-code` (a
  session log), `paste` (a transcript pasted in). The field is
  `ConversationMeta.adapter`.
- **launch** — one invocation of the resolver. There are two: `ursa run`
  locally and `ursa ci` on a runner. The project has no daemon and no
  watcher by decision (ADR-003).
- **the disclosure gate** — the refusal in `publish()` described in
  section 6. Not to be confused with `src/disclosure.ts`, which governs a
  different edge; section 6.3 states the difference.
- **publish-time** — when `ursa publish` runs. Distinct from
  **resolve-time**, when `ursa run` or `ursa ci` runs. Nothing is
  reclassified at publish-time.

## 3. System diagram

Every node is a file that exists in this repository after this run. Every
edge carries the named type, file format, or exact byte content that
crosses it, not a verb phrase.

```
 THE STRANGER'S REPOSITORY (their GitHub account, their runner)
 ─────────────────────────────────────────────────────────────────────────

  .github/workflows/ursa-publish.yml
  (their copy of ursa-major/examples/publish-record.yml)
            │
            │  on: push to the default branch, or workflow_dispatch
            ▼
  actions/checkout@v5  with fetch-depth: 0
            │
            │  a full git object store at $GITHUB_WORKSPACE
            ▼
  ursa-major/action.yml, step "Deepen a shallow clone…"
            │
            │  the same work tree, unshallowed if it was shallow
            ▼
  ursa-major/action.yml, step "Resolve the whole history…"
  (runs only when resolve-from == 'history')
            │
            │  argv: ["run", "$GITHUB_WORKSPACE", "--min-chars", "200",
            │         "--agent-identity", "<one per declared line>"]
            ▼
  ursa-major/dist/ursa.cjs                      ← one committed CommonJS
  (the bundle; 255,382 bytes at this commit)      file, nothing installed
            │
            │  in-process: Episode[] → OutcomeRecord, via
            │  src/pairfinder.ts → src/episodes.ts → src/resolve.ts
            ▼
  src/store.ts  saveRecord(projectRoot, record)
            │
            │  one file per record, JSON.stringify(record, null, 2) + "\n"
            ▼
  $GITHUB_WORKSPACE/.ursa/records/<task.id>.json          ← the store
            │
            │  OutcomeRecord, read back by loadRecord()
            ▼
  ursa-major/action.yml, step "Write the records as a static site"
  (runs only when publish-dir != '')
            │
            │  argv: ["publish", "$GITHUB_WORKSPACE", "--out", "_site",
            │         "--repo", "<owner>/<name>", "--yes"]
            ▼
  src/publish.cli.ts  runPublish(opts)
            │
            ├──  DisclosureManifest, as text on stdout via formatManifest()
            │    (printed BEFORE any write; the job log is the record of it)
            │
            ▼
  src/publish.ts  publish(opts)
            │
            ├─ renderViewer(record)  ──────────→  _site/records/<id>.html
            │     (src/viewer.ts, unchanged)        one self-contained page
            │
            ├─ JSON.stringify(record, null, 2) ─→  _site/records/<id>.json
            │
            ├─ PublishedIndex ─────────────────→  _site/index.json
            │
            ├─ renderIndexPage(index) ─────────→  _site/index.html
            │
            └─ "" (zero bytes) ────────────────→  _site/.nojekyll
            │
            │  echo "dir=_site" >> $GITHUB_OUTPUT
            ▼
  actions/upload-pages-artifact@v3  with path: _site
            │
            │  a gzipped tar of _site, as a GitHub Actions artifact
            ▼
  actions/deploy-pages@v4
            │
            │  an OIDC-attested Pages deployment in the stranger's own repo
            ▼
  https://<their-user>.github.io/<their-repo>/        ← THE ADDRESS
            │
            ├─ index.html   the set, with three percentages per record
            └─ records/<id>.html   one record, every span navigable

 NOTHING IN THIS DIAGRAM IS OPERATED BY URSA. Ursa supplies two files that
 the stranger's own runner executes: action.yml and dist/ursa.cjs. No
 Ursa host receives a request at any point, and `publish()` opens no
 socket — the only network calls in the whole path belong to
 actions/checkout, actions/upload-pages-artifact and actions/deploy-pages,
 all three of which talk to the stranger's own GitHub account.
```

The merge-window path is unchanged and still exists beside this one:

```
  .github/workflows/ursa-resolve.yml
  (their copy of ursa-major/examples/resolve-on-merge.yml)
            │  on: pull_request, types: [closed], if merged == true
            ▼
  ursa-major/action.yml, step "Resolve the merge…" (resolve-from == 'merge')
            │  argv: ["ci", …, "--repo", …, "--event", $GITHUB_EVENT_PATH]
            ▼
  src/ci/run.ts → .ursa/records/<id>.json  +  one comment on the pull request
```

Running both is the intended shape: the merge workflow gives the
five-field comment per pull request, this one gives the page. They
execute on different runners and neither can see the other's `.ursa/`.

## 4. Interfaces at every component boundary

Real signatures, as a caller would write them. All from
`ursa-major/src/publish.ts` unless stated.

### 4.1 The boundary the Action crosses

```ts
// src/publish.cli.ts
export interface PublishCommandOptions {
  projectPath: string
  outDir: string | undefined
  repository: string | null
  acknowledged: boolean
}

/** 0 = site written · 2 = bad invocation · 3 = disclosure shown, nothing written */
export function runPublish(opts: PublishCommandOptions): number
```

### 4.2 The publish boundary

```ts
export interface PublishOptions {
  projectPath: string
  outDir: string
  /** must be true or nothing is written; no default, by design */
  acknowledged: boolean
  repository?: string | null
  publishedAt?: string
}

export interface PublishResult {
  written: string[]
  index: PublishedIndex
  skipped: { id: string; reason: 'unsafe-id' | 'unreadable' | 'forgotten' }[]
  warnings: string[]
}

export function publish(opts: PublishOptions): PublishResult

export class DisclosureNotAcknowledged extends Error {
  readonly manifest: DisclosureManifest
}
```

### 4.3 The disclosure boundary

```ts
export interface DisclosureManifest {
  records: number
  recordIds: string[]
  adapters: ('claude-code' | 'paste' | 'git')[]
  finalFiles: number
  filePaths: string[]
  finalChars: number
  generations: number
  generationChars: number
  conversations: number
  prompts: number
  promptChars: number
}

export function manifestFor(records: OutcomeRecord[]): DisclosureManifest
export function formatManifest(m: DisclosureManifest): string
export function noveltyOfDisclosure(m: DisclosureManifest): string[]
```

### 4.4 The published contract, which is the line with the frontend seat

> **Since this document was written.** The contract is `0.4.0` as of
> 2026-10-18, which added one field, `pairing`, holding the pairing bound
> sets the set's records were resolved under. Everything below describes
> the `0.3.0` state this work shipped and is left as the record of it.
> The newer field and the reason for it are in
> `docs/design/pages-dogfood.md` §1 and §4.

```ts
export const PUBLISHED_INDEX_VERSION = '0.3.0'   // 0.1.0, then 0.2.0, both on 2026-10-18

export interface PublishedIndex {
  indexVersion: typeof PUBLISHED_INDEX_VERSION
  publishedAt: string
  repository: string | null
  recordSchemaVersions: string[]
  records: PublishedRecordSummary[]
  disclosed: DisclosureManifest
}

export interface PublishedRecordSummary {
  id: string
  generatedAt: string
  finished: boolean
  artifactKind: string
  finalChars: number
  coveredChars: number
  charsByClass: Record<SpanClass, number>
  spansByClass: Record<SpanClass, number>
  generatedChars: number
  generatedDeletedChars: number
  resolvedBy: { basis: string; value: string } | null
  html: string
  json: string
  /** added at 0.2.0: `pages/<owner>/<repo>/<id>`, or null with no repository stated */
  address: string | null
  /** added at 0.3.0: byte length of `records/<id>.json` as this run wrote it */
  bytes: number
  /** added at 0.3.0: SHA-256 of those same bytes, lowercase hex, no prefix */
  sha256: string
}
```

`html` and `json` stay site-relative and stay the contract for reading
the directory wherever it is served. `address` is the contract for
*linking* to one record from outside the directory, which is a different
question and the one a viewer's route asks. Its grammar is section 14.

`indexVersion` is versioned separately from `OutcomeRecord.schemaVersion`
on purpose: the index can gain a field without a record changing, and a
record can change without the index moving, so a consumer pinning one
must not be told about the other.

`bytes` and `sha256` are what a viewer that fetches one record needs in
order to say anything about the bytes that arrived. Section 15 is what
they prove, what they deliberately do not, and why the digest is taken
over the buffer that gets written rather than over a second
serialization of the same record.

### 4.5 Addressing, and the store reads it reuses

```ts
export const INDEX_JSON = 'index.json'
export const INDEX_HTML = 'index.html'
export const RECORDS_DIR = 'records'
export function recordHref(id: string, ext: 'html' | 'json'): string

export function loadPublishable(projectPath: string): {
  records: OutcomeRecord[]
  skipped: PublishResult['skipped']   // reason: 'unsafe-id' | 'unreadable' | 'forgotten'
}
export function foreignSlugWarnings(
  records: OutcomeRecord[], repository: string | null,
): string[]
export function renderIndexPage(index: PublishedIndex): string
export function hasRecordStore(projectPath: string): boolean
```

Reused unchanged from `ursa-major/src/store.ts`:

```ts
export function listRecordIds(projectRoot: string): string[]
export function loadRecord(projectRoot: string, recordId: string): OutcomeRecord | null
export const SAFE_RECORD_ID: RegExp   // /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
```

`SAFE_RECORD_ID` already existed because the bridge serves records to a
browser by id and an id is untrusted input. A record id is now also a
path segment in a public URL, which is the same constraint arriving from
a second direction, so the regex is reused rather than restated.

Reused unchanged from `ursa-major/src/viewer.ts`:

```ts
export function renderViewer(record: OutcomeRecord): string
```

## 5. On-disk layouts, with a real payload

### 5.1 What `ursa publish` reads

```
<project>/.ursa/
├── records/
│   ├── <your-repo>-2026-10-16-8dcb0c7.json      OutcomeRecord, pretty JSON
│   └── <your-repo>-2026-10-16-ab01f0d.json
├── episodes.json
└── acceptance.jsonl
```

Only `records/*.json` is read. Everything else in `.ursa/` is ignored,
including `acceptance.jsonl`, which carries the owner's own declarations
and is deliberately not published.

### 5.2 What it writes

```
_site/
├── .nojekyll                                     0 bytes
├── index.html                                    the set, one page
├── index.json                                    PublishedIndex
└── records/
    ├── <your-repo>-2026-10-16-8dcb0c7.html       502,466 bytes measured
    ├── <your-repo>-2026-10-16-8dcb0c7.json       736,599 bytes measured
    ├── <your-repo>-2026-10-16-ab01f0d.html     2,552,798 bytes measured
    └── <your-repo>-2026-10-16-ab01f0d.json     4,030,333 bytes measured
```

`.nojekyll` exists because GitHub Pages runs Jekyll over an uploaded
directory unless told not to, and Jekyll drops every path beginning with
an underscore. No file this module writes begins with one today, but
`SAFE_RECORD_ID` permits an underscore after the first character and a
task id is derived from a directory name, so a record silently missing
from a deployed set is the failure this path is least able to notice.

The measured byte counts are from the run in section 8 and are discussed
as a problem in section 10.2.

### 5.3 A real `index.json`

Written by the run in section 8, over this repository's own history. The
record ids are shown with the directory slug replaced by `<your-repo>`
per the redaction rider in `prompts/engineer-agent.md` element 3: the
literal slug is the name of the sandbox directory this run executed in,
and section 10.1 is about exactly that. Every number below is unmodified.

```json
{
  "indexVersion": "0.1.0",
  "publishedAt": "2026-10-18T00:40:16.247Z",
  "repository": "alexandrapaiz/Ursa",
  "recordSchemaVersions": ["0.1.0"],
  "records": [
    {
      "id": "<your-repo>-2026-10-16-8dcb0c7",
      "generatedAt": "2026-10-16T15:25:45+00:00",
      "finished": true,
      "artifactKind": "repo",
      "finalChars": 26886,
      "coveredChars": 26369,
      "charsByClass": {
        "survived_verbatim": 1489,
        "survived_mutated": 153,
        "no_generation_provenance": 24727
      },
      "spansByClass": {
        "survived_verbatim": 17,
        "survived_mutated": 3,
        "no_generation_provenance": 432
      },
      "generatedChars": 24139,
      "generatedDeletedChars": 313,
      "resolvedBy": { "basis": "git_commit", "value": "2e0ce00" },
      "html": "records/<your-repo>-2026-10-16-8dcb0c7.html",
      "json": "records/<your-repo>-2026-10-16-8dcb0c7.json"
    }
  ],
  "disclosed": {
    "records": 2,
    "recordIds": [
      "<your-repo>-2026-10-16-8dcb0c7",
      "<your-repo>-2026-10-16-ab01f0d"
    ],
    "adapters": ["git"],
    "finalFiles": 3,
    "filePaths": [
      "docs/decisions.md",
      "docs/sprints/dispatch-queue.md",
      "docs/sprints/pending.md"
    ],
    "finalChars": 151478,
    "generations": 3,
    "generationChars": 143218,
    "conversations": 2,
    "prompts": 0,
    "promptChars": 0
  }
}
```

Read that record's three figures against `finalChars`, which is the
denominator a reader of the page is asking about: of 26,886 characters of
finished work, 1,489 (5.5%) were written by a model and kept unchanged,
153 (0.6%) were written by a model and then edited, and 24,727 (92.0%)
trace to no generation at all. The three do not sum to 26,886 because
517 characters fall inside no span.

### 5.4 What `ursa publish` prints before it writes

Verbatim stdout of the dry run in section 8, which is also what lands in
the Action's job log and job summary:

```
Publishing 2 records makes all of the following readable by anyone with the address:

  the full text of 3 finished files   151,478 characters
  the full text of 3 model generations  143,218 characters
  your own 0 messages to the model      0 characters

The file paths that will appear on the page, in full:
  docs/decisions.md
  docs/sprints/dispatch-queue.md
  docs/sprints/pending.md

The generations in the git-path records are blobs of files at the agent's
own commits, so a public repository has already published that text. What
is new on the page is the classification over it: which characters a model
wrote, which ones you changed, and which ones it never touched.

Nothing here is aggregated, redacted or withheld: a published record is
the record.

Nothing was written. To publish exactly what is listed above, run again with --yes.
```

## 6. The disclosure gate

### 6.1 Why there is one

An `OutcomeRecord` is raw data field by field, and `src/types.ts` says so
where each field is declared: `files[].text` is the finished work
verbatim, `generations[].text` is every model generation, and
`conversations[].prompts[].text` is the user's own messages, annotated
"Raw data; stays local." Writing those three into a directory that is
about to be served from a public URL is the largest disclosure this
codebase can perform, and before this run it would have been one function
call with no ceremony around it.

So `publish()` writes nothing unless its caller passes
`acknowledged: true`, and `manifestFor()` exists so that what is being
acknowledged is counted and printed first — in characters, and with every
file path named in full — rather than described. A character total does
not tell a person they are about to publish
`src/clients/northwind/pricing.ts`; the path list is the only part of the
manifest that can stop a publication for a reason a number could not
reach.

### 6.2 Why it is two invocations and not a prompt

```
ursa publish <project>                                 # prints, writes nothing, exit 3
ursa publish <project> --out _site --repo o/n --yes    # writes, exit 0
```

An interactive confirmation would be unavailable exactly where this
command most needs to run, which is a runner with no terminal attached,
and a prompt that falls back to "assume yes when there is no tty" is the
shape of consent this project refuses everywhere else. Two invocations
behave identically on a laptop and in a workflow, and the
acknowledgement becomes a visible token in the consumer's own workflow
file, where a reviewer of that file can see it.

Exit code 3 rather than 1 because the dry run is not a failure. It is the
command's first step doing its job, and a workflow treating it as an
error would report a red run for a correct one.

### 6.3 Why this is not `src/disclosure.ts`

`src/disclosure.ts` governs the Ursa Minor edge, where Ursa receives a
projection of a record. Its rule is that raw text never crosses under any
circumstances, enforced by a closed vocabulary plus a 16-character
shingle audit over the serialized payload.

The rule here is the opposite shape in every respect:

| | `src/disclosure.ts` (the Minor edge) | `src/publish.ts` (the publish edge) |
|---|---|---|
| What crosses | counters and a closed vocabulary of model ids, date strings and extension buckets | the record itself, raw text included |
| Who receives it | Ursa's aggregation layer | anyone with the URL |
| Who decides | the user, by granting a consent scope | the publisher, by passing `--yes` |
| Whose infrastructure | Ursa's | the publisher's own GitHub Pages |
| How it is enforced | whitelist by construction, then `auditBatch()` re-derives the guarantee from outside | a refusal to write, plus a printed count of what will be written |

Calling `auditBatch()` here would reject every page this module exists to
write. What the two share is only that neither lets raw data leave by
accident. The load-bearing constraint in `CLAUDE.md` — "raw processing
happens on-device, raw data never touches the aggregation layer" — is
untouched by this path, because GitHub Pages in the stranger's own
account is not Ursa's aggregation layer and no byte of this travels to
one.

### 6.4 Erasure reaches this boundary too

`src/disclosure.ts` calls `isForgotten()` before it aggregates anything,
even though its callers also filter, because a tombstoned record must not
cross a disclosure boundary on any path. `loadPublishable` now does the
same, before the record file is read, so a tombstoned record's text is
never loaded into the process on the way to being refused.

In the ordinary case there is nothing to catch: `ursa forget <project>
--record <id>` deletes the record file as well as writing the tombstone,
so the id is already absent from `listRecordIds`. The check is for when
the file and the tombstone disagree — a `.ursa/` restored from a backup,
a runner cache that outlived the erasure, a record copied between clones,
or a tombstone written for a record that was never on this machine.

The argument is stronger here than at the Minor edge. That edge sends
counters to Ursa and can be re-run; this one writes a page to a public
address that stays up until something replaces it. This is `CLAUDE.md`'s
second load-bearing constraint — the user can always see, edit, revoke
and delete what has been inferred about them — read at the one boundary
where breaking it is visible to strangers.

A forgotten record is also absent from the `DisclosureManifest`, so its
characters are never counted in what the publisher is asked to
acknowledge.

### 6.5 What the disclosure may honestly claim

Until the first end-to-end run, `formatManifest` ended with "text that
has never been public before, even when the repository is". The run
printed that sentence over two git-path records whose 143,218 characters
of generation are blobs of files at commits already pushed to a public
remote. **The claim was false for the only path the Action uses**, and it
was false in the direction that overstates the risk, which is the
direction that teaches a reader to ignore the warning.

`noveltyOfDisclosure()` now derives the claim from
`DisclosureManifest.adapters` instead of asserting it:

| Capture path | What publishing newly exposes |
|---|---|
| `git` | the classification only. A generation is a blob of a file at the agent's own commit, so a public repository has already published that text. There are no prompts, because a commit carries no conversation |
| `claude-code`, `paste` | the generations and every message the person typed, in full. The transcript was never in the repository, so this is the first time any of it is readable by anyone |
| both present | both claims, stated separately. Collapsing them would have to pick the weaker or the stronger, and each is wrong about half the set |

## 7. Exact commands

Every literal invocation in this path, with real flags.

### 7.1 What the stranger runs

```bash
mkdir -p .github/workflows
curl -fsSL https://raw.githubusercontent.com/alexandrapaiz/Ursa/main/ursa-major/examples/publish-record.yml \
  -o .github/workflows/ursa-publish.yml
git add .github/workflows/ursa-publish.yml && git commit -m "Add Ursa" && git push
```

Then, once, in the repository's web UI: **Settings → Pages → Build and
deployment → Source → "GitHub Actions"**. This is the only step a
workflow file cannot perform, and `examples/publish-record.yml` names it
in its first ten lines.

### 7.2 What the Action runs on the stranger's runner

Literally, from `ursa-major/action.yml`:

```bash
# step "Deepen a shallow clone so both sides of each commit pair exist"
cd "$GITHUB_WORKSPACE"
if [ -f "$(git rev-parse --git-dir)/shallow" ]; then
  git fetch --quiet --unshallow origin || git fetch --quiet --depth=500 origin
fi

# step "Resolve the whole history into outcome records" (resolve-from: history)
node "$GITHUB_ACTION_PATH/dist/ursa.cjs" run "$GITHUB_WORKSPACE" \
  --min-chars 200 --agent-identity "github-actions[bot]" | tee "$RUNNER_TEMP/ursa-ci.log"

# step "Write the records as a static site" (publish-dir: _site)
node "$GITHUB_ACTION_PATH/dist/ursa.cjs" publish "$GITHUB_WORKSPACE" \
  --out "_site" --repo "$GITHUB_REPOSITORY" --yes | tee -a "$RUNNER_TEMP/ursa-ci.log"
echo "dir=_site" >> "$GITHUB_OUTPUT"
```

### 7.3 Doing it locally, publishing nothing

```bash
git clone https://github.com/alexandrapaiz/Ursa && cd Ursa/ursa-major && npm install
npx tsx src/bin/ursa.ts run <path-to-your-repo>
npx tsx src/bin/ursa.ts publish <path-to-your-repo>                      # exits 3
npx tsx src/bin/ursa.ts publish <path-to-your-repo> --out ./site --yes    # exits 0
python3 -m http.server 8000 --directory ./site                            # read it
```

### 7.4 What this run ran to verify itself

```bash
cd ursa-major
npx tsc --noEmit
npx vitest run src/publish.test.ts
npx vitest run src/bundle-exec.test.ts
npm test
node build/bundle.mjs
node build/bundle.mjs --check
npm run provenance:bundles:check
node dist/ursa.cjs publish /<project> --out /tmp/site2 --repo someone/their-repo --yes
python3 -c "import yaml; yaml.safe_load(open('examples/publish-record.yml'))"
```

## 8. Evidence that it works

Run on this repository's own history, 2026-10-18, from the source tree.

```bash
npx tsx src/bin/ursa.ts run <project> --limit 3 \
  --agent-identity ursa-engineer --agent-identity ursa-pm --agent-identity agents.epito.me
```

> 2 work units found, 2 resolved into records.
> 5,783 chars survived your editing verbatim, 1,155 survived edited.
> 143,218 chars were generated to get there, and 5,204 of them reached the finished work unedited.
> Resolved by: resolver `2e0ce00` · Checked against: 18 bounds, set `10a82f2bc5f1ae6f`

Then `ursa publish`, dry run. Output as in section 5.4, exit code 3, and
the output directory does not exist afterwards even when one was named:
`node dist/ursa.cjs publish <project> --out /tmp/site3` exits 3 and
`[ -e /tmp/site3 ]` is false.

Then `ursa publish --out /tmp/site --repo alexandrapaiz/Ursa --yes`:
7 files, exit 0, and two warnings — see section 10.1, which is the real
leak this run found and did not have authority to fix.

Both published pages rendered in jsdom 30.1.1, reading the real files off
disk:

| Page | Bytes | Rows or classified elements | `<script>` tags | External references |
|---|---|---|---|---|
| `index.html` | 5,898 | 2 table rows, 4 links | 0 | 0 |
| `records/<your-repo>-…-8dcb0c7.html` | 502,466 | 20 classified elements | 0 | 0 |
| `records/<your-repo>-…-ab01f0d.html` | 2,552,798 | 417 classified elements | 0 | 0 |

"External references" counts elements whose `src` or `href` begins with
`http:` or `https:`. Zero is the property the page needs: a page about
where a person's data went must not call anywhere to render.

The same bundle the Action would run, `dist/ursa.cjs`, was invoked
directly: `publish` exits 3 and writes nothing without `--yes`, and
writes the same 7 files with it.

## 9. Tests

24 new tests in `ursa-major/src/publish.test.ts`, plus one strengthened
in `src/bundle-exec.test.ts`. Full suite: **707 passed, 4 skipped**.

| What it holds | Why it is a test and not a reading of the code |
|---|---|
| A publish without acknowledgement throws **and** the output directory does not exist afterwards | A gate is only real if it precedes every write. Asserting only the exception would pass even if `publish()` had already created the directory, which is an ordering bug the exception cannot see |
| The refusal carries the manifest | So a caller can print what it declined instead of re-deriving it |
| The manifest's three character totals equal the record's own sums, and none of them is zero | A counter that counts nothing passes every equality against itself. The fixture has prompts and generations, so a zero is a failure |
| A path shared by two records is counted once | `finalFiles` is a set, and the obvious implementation makes it a sum |
| Every `html` and `json` address in `index.json` resolves to a file this run wrote | The published form of the no-broken-pointer audit the viewer already has, stated over URLs instead of over record indices |
| `index.json` on disk deep-equals the `PublishedIndex` returned | Otherwise the contract and the artifact can drift silently |
| A second publish republishes the whole set rather than appending | A stale page left behind by a shrinking record set is undetectable from the index |
| A record id that `SAFE_RECORD_ID` rejects is skipped **and named in the result** | An id silently absent from a published set is indistinguishable from a record that was never resolved |
| An empty project renders "no records in it" and emits no `<tbody>` | An empty set must not render as a table of zeroes, which reads as a measurement |
| The index page has zero scripts, zero stylesheet links, zero images, and no absolute `href` | Self-containment, asserted through jsdom's DOM rather than by substring |
| Every column heading has a definition on the same page | The engineering-artifact standard's element 6, enforced on the user-facing surface instead of promised |
| The page says the three percentages do not sum to 100% | Because they do not, and a reader will otherwise assume they do |
| A hostile repository name is escaped, not spliced | `repository` reaches the page from `$GITHUB_REPOSITORY` |
| `noveltyOfDisclosure` says "never in the repository" for a session-path manifest and "already published that text" for a git-path one, and both when both are present | This is the sentence section 6.4 found to be wrong. A test is the only thing that keeps it honest as the code moves |
| The directory-slug warning fires on a foreign slug, and stays silent on a runner slug, on an absent repository, and on an id not in the resolver's shape | Three silent cases and one loud one; a warning that fires always is ignored always |
| An erased record is not published even when its file is still on disk, and the refusal is named rather than folded into "unreadable" | `ursa forget` deletes the file too, so the ordinary case has nothing to catch. The test is the disagreeing case, which is the only one the check exists for |
| An erased record's characters are absent from the disclosure manifest | Otherwise the publisher is asked to acknowledge text that will not be published, which is the same defect pointing the other way |
| Each Action output wired to `steps.resolve` is written by the bundle's `ci` command, exactly and in order | The pre-existing guarantee, unchanged |
| Each Action output wired to any other step is appended to `$GITHUB_OUTPUT` by that step's own shell | The new half. A declared output nothing writes resolves to the empty string on every consumer's runner, silently. Confirmed to fail when the `echo … >> "$GITHUB_OUTPUT"` line is deleted |

## 10. Two defects this run found and did not fix

### 10.1 The record id is a directory name, and is now a URL

`episodeId` in `ursa-major/src/episodes.ts` line 61 builds a record id as
`basename(projectPath)`-`date`-`sha7`. The id is therefore the name of
whatever directory the work was checked out into. Resolving
`~/work/northwind-pricing` produces `northwind-pricing-2026-10-18-8dcb0c7`.

On disk this is a known wart, in `docs/ideas.md` since 2026-10-16 as a
primary key that moves when a folder is renamed. **Publishing changes
what it costs rather than what it is.** The id becomes a path segment in
a URL anyone can read and a search engine can index, and `index.json`
lists every one of them in `disclosed.recordIds`. It is the one piece of
the publisher's filesystem this path cannot avoid carrying, because it is
the record's identity rather than a field beside it.

It is demonstrably live: both records this run produced carry the name of
the sandbox directory the run executed in, which is why section 5.3
shows them redacted.

On a GitHub runner the workspace is `/home/runner/work/<repo>/<repo>`, so
the slug is the repository's own name and there is nothing to leak. That
is the common case and the quiet one. The loud case is a record resolved
somewhere else and published here.

Not fixed in this run, because the id is the primary key: changing it is
a decision about every record already written, the `SAFE_RECORD_ID`
contract, the bridge's by-id reads, and the exclusions and acceptance
files keyed to it. That is a day of its own and a product decision, not a
publish-time transform.

What shipped instead is `foreignSlugWarnings()`, which refuses to let it
happen silently. When the publisher states `--repo owner/name` and a
record's slug is neither the repository's name nor absent, the run prints
the id, the address it will be published at, the slug inside that
address, and what to do about it. Warned and not refused, because a
differently-named local clone is legitimate and ordinary, and a refusal
would be this module overruling the person whose data it is, which is the
posture the whole product exists not to take.

### 10.2 A record page is megabytes

Measured, in section 8: 2,552,798 bytes for one record page, because
`renderViewer` inlines the whole record and a git-path generation is the
entire blob of a touched file. Correct, self-contained, and slow over a
phone connection.

Not fixed here, because the fix is a choice between inlining and fetching
and that choice belongs with whoever owns the viewer. Section 11 is why
that is the frontend seat and not this one. Recorded in `docs/ideas.md`.

## 11. Where this seat's half stops and the frontend seat's begins

The handoff asks for this to be stated on the board once each seat has
seen the other's work, and the honest answer is already implied by what
shipped.

**This seat owns the path and the contract.** That is: records reaching a
directory, the directory reaching an address, the addressing scheme
(`records/<id>.html` and `records/<id>.json`, with `SAFE_RECORD_ID` as
the reason an id is safe in a URL), the disclosure gate, and
`index.json`, which is versioned at `0.1.0` independently of the record
schema precisely so a viewer can pin it.

**The frontend seat owns how a record looks.** `renderViewer` and
`renderIndexPage` are the fallback, not the product: they exist so the
site is readable with no other software in the world, and they are
deliberately plain. A richer viewer replaces either or both and keeps
reading the same two files at the same two addresses. Nothing in
`publish.ts` decides anything about presentation that `index.json` does
not already expose as data.

**Superseded in part by section 14.** This section was written before
the frontend seat's two notes of 2026-10-18 arrived, and those notes
named a thing this section had not: a viewer route needs an identity for
one record, not a directory it can list. Section 14 is that identity.
Everything below stays true about the directory.

**The seam, concretely.** A viewer that fetches `index.json`, reads
`records[].json` for an address, and fetches that record, is wired to
this path with no change on this side. If it needs a field the summary
does not carry, that is an additive change to `PublishedRecordSummary`
and a bump of `PUBLISHED_INDEX_VERSION`, which is a small pull request
against this file and `src/publish.ts`. Section 10.2 is the first thing
likely to need it: a viewer that renders spans without a megabyte of
inlined JSON needs the record split, and how to split it is a
presentation decision.

## 12. Tooling

Every tool named with its exact installed version, read from
`ursa-major/node_modules/<pkg>/package.json` and cross-checked against
the resolved version in `ursa-major/package-lock.json`, its job in this
path, and why it over what else was considered.

| Tool | Version | Its job in this path | Chosen over |
|---|---|---|---|
| Node.js | 22.23.2 (`node --version`); the bundle targets `node22` | Runs the resolver and the publisher. On a runner it is the node already present, which is what "installs nothing" means | A container image, rejected in the product plan §9 because the consumer could not read what runs before it runs. Bun or Deno, rejected because neither is on a stock `ubuntu-latest` runner |
| esbuild | 0.28.2 | Bundles `src/bin/bundle-entry.ts` into the single committed `dist/ursa.cjs` the Action executes. Grew the file from 202,367 to 255,382 bytes in this run, the increase being `src/viewer.ts` and `src/publish.ts`, neither of which was reachable from the bundle before | `tsc` alone, which emits a module per file and needs a loader on the runner. Rollup or webpack, each of which is a larger dependency for a one-entry CommonJS build with no code splitting |
| TypeScript | 5.9.3 | `tsc --noEmit` is the only check that holds `PublishedIndex` and `renderIndexPage` to the same shape, since the renderer reads fields off a typed value rather than a parsed JSON blob | Runtime validation with `zod` 4.6.5, which is already a dependency and is right for untrusted input. The index is constructed in this process from typed values, so a schema check here would validate this module against itself |
| vitest | 5.0.2 | Runs the 24 new tests and the 707-test suite. Already this package's runner; no new tool | — |
| jsdom | 30.1.1 | Parses the rendered pages so self-containment and the column definitions are asserted against a real DOM rather than by substring. `src/provenance.test.ts` already uses it for the viewer's navigation, and reusing it keeps one headless DOM in the tree | Playwright or Puppeteer, which would download a browser, add minutes to the suite, and verify nothing extra for a page with no script in it. A substring check, rejected because the project's own prior test notes record a substring assertion passing against markup a browser would not render |
| tsx | 4.23.15 | Runs `src/bin/ursa.ts` from source for the local launch and for every command in section 7.3 | `ts-node`, slower on this package and already displaced here |
| diff | 8.0.4 | Not used by this module. Named because it is inlined into the `dist/ursa.cjs` that this path ships, so the published artifact contains it | — |
| actions/checkout | v5 | Puts the stranger's repository on their runner with `fetch-depth: 0`, which the pair finder needs on both sides of every commit pair | A hand-written `git clone`, which would need a token in the clear |
| actions/upload-pages-artifact | v3 | Turns `_site` into the artifact a Pages deployment consumes | `peaceiris/actions-gh-pages`, a third party, rejected because it needs `contents: write` to push a `gh-pages` branch and this path needs no write access to the consumer's code at all |
| actions/deploy-pages | v4 | Creates the Pages deployment and returns `page_url`. Uses OIDC, which is why the workflow grants `id-token: write` | The same third-party alternative, for the same reason |
| GitHub Pages | the consumer's own, free tier | Serves the directory at a public address | Any Ursa-operated host, which would cost money the charter forbids, put Ursa in the path of the stranger's raw records, and break the "no Ursa-operated compute" property `action.yml` already claims. A `file://` path, which is not an address a stranger can be sent |
| Python's `http.server` | the `python3` already present, 3.x | Serves `./site` locally in section 7.3 so a person can read the page before publishing it | A new npm dev dependency, for one line of documentation |

Steady-state cost of everything above: **$0**. No new paid service, no
account, no domain. The only consumption is the consumer's own Actions
minutes and their own Pages bandwidth, both on their free tier.

## 13. Rollback

Every change is additive and gated by a default that reproduces the
previous behaviour.

| To undo | Do this | What it affects |
|---|---|---|
| the publish path entirely | `git revert` the three commits on `ursa-engineer/2026-10-18-message` | `src/publish.ts`, `src/publish.cli.ts`, `src/publish.test.ts`, the two `action.yml` inputs, `examples/publish-record.yml`, the README section, this file |
| only the Action's new behaviour | remove the `resolve-from` and `publish-dir` inputs | Nothing else. `resolve-from` defaults to `merge` and `publish-dir` to `''`, so a consumer who sets neither gets the byte-identical run they got before, and `src/ci/run.ts` is untouched |
| only the published site, for one consumer | delete their `.github/workflows/ursa-publish.yml`, or unset Settings → Pages → Source | Their records stop being published. Nothing of Ursa's changes |
| the record address | `git revert` the address commits, or simply stop running `ursa address`: nothing else calls `src/address.ts` except one field of `index.json` | `src/address.ts`, `src/address.cli.ts`, `src/address.test.ts`, the `address` dispatch in `src/bin/ursa.ts`, `PublishedRecordSummary.address`, the README's shortest-version section, section 14 of this file |
| only the index field, keeping the command | delete `address` from `PublishedRecordSummary` and `summarize`, and set `PUBLISHED_INDEX_VERSION` back to `0.1.0` | A consumer reading 0.2.0 sees one fewer field. Nothing else: the field is derived, never read back |
| the published digest, which is section 15 | delete `bytes` and `sha256` from `PublishedRecordSummary`, delete the `bodies` map in `publish()` and restore `JSON.stringify(record, null, 2) + '\n'` at the write call, and set `PUBLISHED_INDEX_VERSION` back to `0.2.0` | The frontend viewer stops being able to verify a fetched record and falls back to the sentence it already has for a pre-digest site ("this index predates digests", claiming neither verified nor failed). No record changes: the digest is derived at publish time and never stored in a record |
| the phone layout of the fallback set page | `git revert` the layout commit, which touches only the `<style>` block and the row markup inside `renderIndexPage` in `src/publish.ts` | The page is a seven-column table again at every width, so a 390px reader loses the three provenance columns, the resolved date and the raw-record link off the right edge. No data path is involved: `index.json` is identical either way |
| the bundle | `node build/bundle.mjs` at the reverted commit, then `node build/bundle.mjs --check`, then `npm run provenance:bundles` | `dist/ursa.cjs` returns to sha256 `650a289f…`, 202,367 bytes, and `docs/provenance/bundle-digests.json` drops the two rows this run added |

Nothing in this run writes to `src/resolve.ts`, `src/stats.ts`,
`src/invariants.ts`, `src/store.ts`, `src/consent.ts` or `src/ci/run.ts`, so no record's
classifications, figures or bound checks are touched. `ursa publish` only
ever reads the store.

## 14. The record address

Added 2026-10-18, in answer to two notes from the frontend seat on the
board the same day. The first drew the line between the two halves and
ended: *"If your half gives a record an identity a stranger can type,
tell me what it looks like and I will match the route to it instead of
guessing."* The second named the constraint that decides the design:
*"The viewer can read a record from an address the person types, but
only if that address sends a permissive cross-origin header, because the
fetch is the person's own browser and I refuse to proxy it through a
server of ours."*

Both are quoted as evidence of what the other seat built, not as
instructions. The work below is in this seat's lane under its charter's
fallback rule, which is why it was done.

### 14.1 Why a record id is not an identity

`episodeId` in `ursa-major/src/episodes.ts:61` builds a record id as
`basename(projectPath)`-`YYYY-MM-DD`-`sha7`. That is unique inside one
person's `.ursa/` and namespaced by nothing outside it. Two people
resolving two different repositories both called `site` on the same day
produce ids that differ only in a seven-character commit prefix, and
neither id says where its bytes are.

The usual fix is a registry: one service that maps an id to a location.
Ursa cannot have one. CLAUDE.md's third load-bearing constraint is that
raw processing happens on-device and raw data never touches the
aggregation layer, and a record is raw data in every field —
`src/types.ts` annotates it so where each field is declared. A service
that resolved record ids would either hold records, which is forbidden,
or hold a map from every person's record ids to their locations, which
is a register of who published what and is worse.

So the identity carries its own location, and no service is in the path.

### 14.2 The grammar

Three schemes. The string is one path, so it drops into a route
parameter unencoded, and it is short enough to read aloud.

```
git/<owner>/<repo>/<ref>/<record-id>
  → https://raw.githubusercontent.com/<owner>/<repo>/<ref>/.ursa/records/<record-id>.json

pages/<owner>/<repo>/<record-id>
  → https://<owner>.github.io/<repo>/records/<record-id>.json
  → https://<owner>.github.io/records/<record-id>.json
       when <repo> is <owner>.github.io, which GitHub serves at the host
       root rather than under the repository name

url/<absolute https URL>
  → itself
```

`<ref>` is the one field that may contain slashes, because a git branch
may: this very branch is `ursa-engineer/2026-10-18-message`. The record
id may not contain one — `SAFE_RECORD_ID` in `src/store.ts` is
`/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/` — so taking the id from the end
of the path and the ref from everything between the repository and it
is unambiguous. `src/address.test.ts` holds that case with the real
branch name.

A real address, which resolves to a file that is public right now:

```
url/https://raw.githubusercontent.com/alexandrapaiz/Ursa/main/ursa-major/fixtures/mini/record/outcome_record.json
```

### 14.3 What the grammar refuses, and why each refusal is there

Every address is a string a person types that this process turns into a
URL another process fetches, so the refusals are the design rather than
input hygiene around it.

| Refused | Example | Why |
|---|---|---|
| a path component `..` | `pages/a/b/../../etc/passwd` | the one sequence that walks a fetch out of the path the address claims to name |
| any scheme but `https:` | `url/javascript:alert(1)` | the parsed address is handed to `fetch`; a `javascript:` or `data:` payload reaching a viewer's fetch is a scripting hole with no legitimate use |
| a URL carrying userinfo | `url/https://token:x@host/r.json` | a credential written into a string this process prints, a workflow logs and a page displays is a leak with no upside, and nothing serving a record needs one |
| an account name GitHub could not issue | `pages/-nope-/b/r-1` | checked against GitHub's rule (up to 39 characters, alphanumerics and single hyphens) rather than trusted, because the string becomes a hostname |
| a record id that is not one | `pages/a/b/.hidden` | `SAFE_RECORD_ID`, the same regex the bridge already uses, arriving from a second direction |
| an https URL with no host | `url/https:/x` | `new URL` accepts it as an opaque path, and it fetches nothing |

Two repairs happen before the refusals, both because the string
travelled through a URL path on the way in: a percent-encoded payload is
decoded once, and `https:/host` has its collapsed second slash restored,
which is what a path router does to `url/https://host/x`.

### 14.4 The cross-origin header, measured

The frontend seat's constraint is a response header, and it cannot be
derived from anything on disk, so it was measured. Taken 2026-10-18 with
curl 8.5.0:

```bash
curl -sS -I https://raw.githubusercontent.com/alexandrapaiz/Ursa/main/README.md
curl -sS -I https://raw.githubusercontent.com/alexandrapaiz/Ursa/main/does-not-exist.json
curl -sS -I https://pages.github.com/
curl -sS -I https://pages.github.com/does-not-exist.json
curl -sS -I https://codeload.github.com/alexandrapaiz/Ursa/tar.gz/refs/heads/main
```

| Host | Status | `access-control-allow-origin` | `content-type` |
|---|---|---|---|
| `raw.githubusercontent.com`, file present | 200 | `*` | `text/plain; charset=utf-8` |
| `raw.githubusercontent.com`, file absent | 404 | `*` | `text/plain; charset=utf-8` |
| GitHub Pages, file present | 200 | `*` | per extension |
| GitHub Pages, path absent on an existing site | 404 | `*` | `text/html; charset=utf-8` |
| `codeload.github.com` | 200 | `https://render.githubusercontent.com` | `application/x-gzip` |

Three consequences, each of which changed something in the code.

**Both schemes work in a browser.** That is the whole feasibility
question for the frontend seat's viewer, and the answer is yes for raw
and yes for Pages, on success and on failure alike, so a viewer can
distinguish "not published yet" from "cannot be read" instead of seeing
one opaque network error for both.

**codeload is the trap.** It is the obvious third candidate, since it
serves a whole repository in one request, and its header admits exactly
one origin that is not yours. It is named in `src/address.ts` so the
next person does not spend an afternoon on it.

**raw serves `text/plain`, so `git` has no page.** The self-contained
HTML viewer `ursa publish` writes beside each record arrives at a
browser as source code when it is served from raw. `recordAddressPageUrl`
therefore returns null for the `git` scheme, which is an honest null and
not a gap: on that scheme the only way to read a record in a browser is
a viewer that fetches the JSON, which is precisely the surface the
frontend seat owns. On `pages`, GitHub serves `text/html` and the
fallback page opens by itself.

The one thing the table cannot settle is a host this project does not
control, which is why `--check` exists: it asks the address.

### 14.5 Erasure, which is the real difference between the two schemes

The two schemes are not two spellings of one thing. They differ on the
property CLAUDE.md calls load-bearing — *the user can always see, edit,
revoke, and delete what's been inferred about them* — and the difference
is invisible at the moment of choosing.

| | `git` | `pages` |
|---|---|---|
| What it takes to publish | `git add -f`, `git commit`, `git push` | one workflow file plus Settings → Pages → Source → GitHub Actions |
| What is at the address | the record file in the repository's tree | a built site, deployed as an artifact by `actions/deploy-pages@v4` |
| Taking one record down | not possible without rewriting the repository's history, which `ursa forget` does not do and will not pretend to | run `ursa publish` again over a store the record has been erased from; the next deployment does not contain it |
| Who can still read it afterwards | anyone with the old commit sha, forever | nobody, once the next deployment lands |

`permanenceNote()` returns that first column as a sentence, and
`ursa address` prints it under the address of any record it calls
readable. It is printed where a person is looking at the address rather
than only written here, because the whole failure mode is that the cost
is paid in a moment when this document is not open.

For the same reason the command does not quietly route around
`.gitignore`. `.ursa/` is ignored at this repository's root with the
comment *"per-project outcome records and tuning (raw data, never
committed)"*, which is this project's own default and is correct. So
when a record is ignored, that is reported as its own blocker with
`git add -f` spelled out, rather than the command printing a `git add`
line that silently does nothing.

### 14.6 System diagram, continuing section 3

Every node is a file that exists in this repository after this run.
Every edge carries a named type or the literal bytes that cross it.

```
 THE PERSON'S MACHINE
 ─────────────────────────────────────────────────────────────────────

  <project>/.ursa/records/<record-id>.json         ← written by `ursa run`
            │
            │  OutcomeRecord, via loadRecord() in src/store.ts
            ▼
  ursa-major/src/address.ts  addressState(projectPath, recordId)
            │
            │  runs, in this order, and nothing else:
            │    git -C <p> rev-parse --show-toplevel
            │    git -C <p> remote get-url <name>        → owner/repo
            │    git -C <p> symbolic-ref --short HEAD    → the branch
            │    git -C <p> rev-parse --abbrev-ref --symbolic-full-name @{upstream}
            │    git -C <p> cat-file -e HEAD:<path>      → committed?
            │    git -C <p> rev-parse <tracking>:<path>  → pushed blob sha
            │    git -C <p> hash-object -- <abs path>    → local blob sha
            │    git -C <p> check-ignore -q <abs path>   → ignored?
            │  plus isForgotten(loadConsent(<p>), id) from src/consent.ts
            ▼
  AddressState { address, url, reachable, blockers[], … }
            │
            │  RecordAddress → string, via formatRecordAddress()
            ▼
  ursa-major/src/address.cli.ts  runAddress()
            │
            ├─ stdout: the address, the URL, `readable`, each blocker
            ├─ stdout: formatManifest(manifestFor(records)) from src/publish.ts,
            │          over the records that are already readable
            └─ with --check only:  fetch(url, { method: 'HEAD' })
                       │
                       │  one HTTP HEAD request, no body transferred
                       ▼
             raw.githubusercontent.com  or  <owner>.github.io
                       │
                       │  response status + access-control-allow-origin
                       ▼
                 stdout: the verdict in words

 THE OTHER HALF, WHICH THIS SEAT DOES NOT OWN
 ─────────────────────────────────────────────────────────────────────

  ursa-minor/app/record/[id]/page.tsx  (frontend seat, PR 227)
            │
            │  the address string from its route parameter
            ▼
  parseRecordAddress(string) → RecordAddress → recordAddressUrl() → fetch
            │
            │  OutcomeRecord as JSON, read by the person's own browser,
            │  through no server of Ursa's
            ▼
  the rendered record
```

### 14.7 Interfaces, as the signatures a caller writes against

```ts
// ursa-major/src/address.ts
export const RECORD_ADDRESS_VERSION = '0.1.0'

export type RecordAddressScheme = 'git' | 'pages' | 'url'

export type RecordAddress =
  | { scheme: 'git'; owner: string; repo: string; ref: string; recordId: string }
  | { scheme: 'pages'; owner: string; repo: string; recordId: string }
  | { scheme: 'url'; url: string }

export type ParsedAddress =
  | { ok: true; address: RecordAddress }
  | { ok: false; error: string }

export function formatRecordAddress(a: RecordAddress): string
export function parseRecordAddress(input: string): ParsedAddress
export function recordAddressUrl(a: RecordAddress): string
export function recordAddressPageUrl(a: RecordAddress): string | null
export function recordAddressId(a: RecordAddress): string | null
export function permanenceNote(a: RecordAddress): string | null
export function pagesAddress(repository: string, recordId: string): RecordAddress | null

export interface GitHubRemote { name: string; owner: string; repo: string }
export function parseGitHubRemote(url: string): { owner: string; repo: string } | null
export function githubRemote(repoPath: string): GitHubRemote | null

export interface AddressState {
  recordId: string
  address: RecordAddress | null
  url: string | null
  reachable: boolean
  blockers: string[]
  remote: GitHubRemote | null
  ref: string | null
  path: string | null
  committed: boolean
  pushed: boolean
  current: boolean
  ignored: boolean
  forgotten: boolean
}
export function addressState(projectPath: string, recordId: string): AddressState

// ursa-major/src/address.cli.ts
export interface ProbeResult {
  status: number | null
  allowOrigin: string | null
  error: string | null
}
export interface AddressCommandOptions {
  projectPath: string
  recordId?: string | null
  pages?: string | null
  check?: boolean
  probe?: (url: string) => Promise<ProbeResult>
}
export function runAddress(opts: AddressCommandOptions): Promise<number>
```

`probe` is injectable for one reason: the test suite must open no socket,
and a feature whose correctness is a response header has to be tested
against both answers. `src/address.test.ts` injects a permissive
response and a header-less one and asserts the two sentences the command
prints.

Three version numbers now exist in this path and they move
independently, which is deliberate: `OutcomeRecord.schemaVersion` is the
record, `PUBLISHED_INDEX_VERSION` is `index.json`, and
`RECORD_ADDRESS_VERSION` is the grammar of the string above. A viewer
that parses the string should be able to pin it without being told that
a record gained a field.

### 14.8 On-disk and on-screen layouts, with real output

`ursa address` writes no file. Its artifact is its stdout, so that is
what is shown. Taken from this repository on 2026-10-18, with the record
id's slug replaced by `<your-repo>` per the redaction rider — the slug
is the sandbox directory this run executed in, which is exactly the
foreign-slug case section 10.1 describes, and `foreignSlugWarnings`
would have warned about it on a publish.

```
$ npx tsx src/bin/ursa.ts address ..
record <your-repo>-2026-10-16-8dcb0c7
  address   git/alexandrapaiz/Ursa/ursa-engineer/2026-10-18-message/<your-repo>-2026-10-16-8dcb0c7
  json      https://raw.githubusercontent.com/alexandrapaiz/Ursa/ursa-engineer/2026-10-18-message/.ursa/records/<your-repo>-2026-10-16-8dcb0c7.json
  readable  not yet
  missing   git ignores .ursa/records/<your-repo>-2026-10-16-8dcb0c7.json — `.ursa/` is in this repository's .gitignore, which is this project's own default, because a record is raw data. Publishing one is a deliberate act: `git add -f .ursa/records/<your-repo>-2026-10-16-8dcb0c7.json` if that is what you mean to do.
  missing   .ursa/records/<your-repo>-2026-10-16-8dcb0c7.json is not in HEAD. Commit it: `git add -f .ursa/records/<your-repo>-2026-10-16-8dcb0c7.json && git commit -m "publish one record"`.
```

Exit code 4: there are records and none is readable yet. With `--check`,
on the same record:

```
  checked   https://raw.githubusercontent.com/alexandrapaiz/Ursa/ursa-engineer/2026-10-18-message/.ursa/records/<your-repo>-2026-10-16-8dcb0c7.json
            HTTP 404
            access-control-allow-origin: * — a browser on any page can read this
```

The two facts are printed separately because they fail separately and a
person can act on each. A 404 with a permissive header means *you have
not pushed it yet*. A 200 without one means *a browser will refuse to
read this, and no amount of pushing changes that*.

And the field this adds to a published `index.json`, from a real
`ursa publish .. --repo a-stranger/their-repo --yes`:

```json
{
  "indexVersion": "0.2.0",
  "records": [
    {
      "id": "<your-repo>-2026-10-16-8dcb0c7",
      "html": "records/<your-repo>-2026-10-16-8dcb0c7.html",
      "json": "records/<your-repo>-2026-10-16-8dcb0c7.json",
      "address": "pages/a-stranger/their-repo/<your-repo>-2026-10-16-8dcb0c7"
    }
  ]
}
```

With no `--repo`, `address` is `null` on every record, because there is
then nothing to build an absolute address from and a guess would be
worse than an absence.

That payload is kept as what that run actually produced, which is why it
reads `0.2.0`. The contract is `0.3.0` from later the same day: section
15 adds `bytes` and `sha256` beside `address`, and every field shown
here is unchanged by it.

### 14.9 Exact commands

What a person runs:

```bash
npx tsx src/bin/ursa.ts run <path-to-your-repo>
npx tsx src/bin/ursa.ts address <path-to-your-repo>
npx tsx src/bin/ursa.ts address <path-to-your-repo> --record <record-id> --check
npx tsx src/bin/ursa.ts address <path-to-your-repo> --pages <owner>/<name>
git add -f .ursa/records/<record-id>.json
git commit -m "publish one record" && git push
```

What the bundle the Action ships runs, identically:

```bash
node dist/ursa.cjs address "$GITHUB_WORKSPACE" --record <record-id>
```

What this run ran to verify itself:

```bash
npm install
npm run typecheck                                  # tsc --noEmit
npx vitest run src/address.test.ts                 # 46 tests
npx vitest run                                     # 761 passed, 4 skipped
node build/bundle.mjs && node build/bundle.mjs --check
npm run provenance:bundles && npm run provenance:bundles:check
npx tsx src/bin/ursa.ts run .. --limit 3 --agent-identity ursa-engineer \
  --agent-identity ursa-pm --agent-identity ursa-exo --agent-identity claude
npx tsx src/bin/ursa.ts address ..
npx tsx src/bin/ursa.ts address .. --record <record-id> --check
npx tsx src/bin/ursa.ts publish .. --out /tmp/site-demo2 --repo a-stranger/their-repo --yes
node dist/ursa.cjs address .. --record <record-id>
curl -sS -I https://raw.githubusercontent.com/alexandrapaiz/Ursa/main/README.md
```

### 14.10 Tooling added by this section

Versions read from the running machine or from
`ursa-major/node_modules/<pkg>/package.json`. Everything in section 12
still applies; these are the tools this section adds.

| Tool | Version | Its job here | Chosen over |
|---|---|---|---|
| git | 2.43.0 (`git --version`) | The whole of `addressState`: eight read-only plumbing commands that answer whether a record is committed, pushed, current and ignored. Already required by the resolver, so this adds no dependency | The GitHub REST API, which would need a token for a private repository, a network round trip for a question the local clone already answers, and would put a rate limit in front of a status command. `isomorphic-git`, a new dependency to re-implement commands git is already installed to run |
| Node's global `fetch` | built into Node.js 22.23.2 | The single HEAD request behind `--check` | `node-fetch` or `undici` as a direct dependency, both redundant on Node 18 and later. `curl` through a subprocess, which would make the result depend on which curl is installed and would be harder to inject a fake response into for the tests |
| curl | 8.5.0 | Took the header measurements in section 14.4, by hand, once. Not called by any code in this repository | Reading a vendor's documentation, which is how the codeload row would have been wrong |
| vitest | 5.0.2 | Runs the 46 tests in `src/address.test.ts`, including the ones that build real git repositories in `mkdtemp` directories | — |
| TypeScript | 5.9.3 | Holds `RecordAddress` as a discriminated union, so `recordAddressUrl` cannot forget a scheme: adding a fourth makes the switch a compile error | A runtime check, which would find the same mistake after shipping |

No new paid service, account, or domain. Steady-state cost: **$0**.

### 14.11 Why the tests set the push state with `git update-ref`

`addressState` asks whether a commit is on the remote, and the honest
way to answer that offline is to read the remote-tracking ref, which is
what `git fetch` writes and what `git push` updates. So the tests write
it directly:

```bash
git -C <repo> update-ref refs/remotes/origin/main "$(git -C <repo> rev-parse HEAD)"
git -C <repo> branch --set-upstream-to=origin/main main
```

That leaves the repository in the exact state a real fetch leaves it in,
so the code under test reads the same thing it reads in production, and
the suite still reaches no network. The limitation this inherits is
stated in the code and in the command's own output: a remote-tracking
ref is as fresh as the last fetch, so `readable` says *yes, as far as
this clone can see*.

### 14.12 What this does not solve

**A record id in a URL is still a directory name.** Section 10.1 stands
unchanged and the `git` scheme makes it slightly louder, since the id is
now a path segment in two address forms rather than one. The decision it
asks for is still open.

**A `git` address is pinned to a ref, not to bytes.** `git/.../main/<id>`
follows the branch, so the record at that address changes when the
branch does. Passing a commit sha as the ref gives an address that
cannot move, and the command prints the branch form because that is the
one a person can type from memory. Which of the two a published link
should use is a product decision and is in the ledger.

**Nothing here publishes anything.** `ursa address` reads. The act that
makes a record public is the person's own `git push` or their own Pages
deployment, which is the same posture as the rest of this path.

## 15. The published digest, and the phone the fallback page did not fit

Written on 2026-10-18 by the second engineer run of the day, after the
frontend seat reported back on the seam this file's section 11 drew.
Everything in sections 1 to 14 stands. This section adds two fields to
`index.json` and changes the fallback set page's layout at narrow
viewport widths. It changes no record and no address.

### 15.1 The request, and the measurement behind it

The frontend seat built its viewer against section 4.4's contract and
then did the thing this file asks a reader to do, which is measure
rather than take a number on trust. It ran `ursa run` and `ursa publish`
over this repository and reported, with its own numbers:

| What it measured | Number it got | What that number is |
|---|---|---|
| Records produced by a publish of this repository | 10 | Outcome records written to `.ursa/records/` and then into a site directory |
| Largest single record page, `records/<id>.html` | 2,568,965 bytes | The self-contained viewer page `renderViewer` writes, with the whole record inlined in it |
| Largest single record file, `records/<id>.json` | 4,045,345 bytes | The record itself, pretty-printed with two-space indentation |
| The same record file, gzipped | 293,898 bytes | 7% of its size on disk, which is what a web server with compression enabled actually sends |
| Finished work inside that record | 124,592 characters | `files[].text` summed: the actual document the work produced |
| Spans in that record | 2,528 | One `files[].spans[]` entry per classified stretch of the finished work, each carrying its own offsets, class, source pointer and word-level diff |
| The set page before the viewer changed | 2.5MB | Because the old set view inlined every record to render the list |
| The set page after, which is this index | 9,744 bytes | `index.json` alone, 1,740 bytes gzipped |

The conclusion the frontend seat drew from its own decomposition, which
this seat agrees with: the record is not too big, it is being paid for
at the wrong moment. Looking at a list of ten records should not
download a record. So the viewer stopped inlining and now fetches one
record when one is asked for.

That trade gives up exactly one property, and it is a property this
product cannot shrug at. When the set page carried the record inside it,
the bytes being rendered were by construction the bytes the set was
built from. A page that fetches a record over a network has no such
guarantee and, before this section, no way to get one, because
`index.json` named a path and said nothing whatsoever about what should
be at it.

So the ask was two fields, and this section is them.

### 15.2 System diagram, continuing sections 3 and 14.6

Three nodes change. Everything else in section 3 is untouched.

**Node `publish()` in `ursa-major/src/publish.ts`** (existing process,
same function). It gains one internal store and one changed edge order:

- New internal store: `bodies`, a `Map<string, Buffer>` from
  `record.task.id` to the UTF-8 bytes of that record's JSON file. Built
  before the index is, which is the whole mechanism.
- Edge `publish() → bodies`, carrying `Buffer` values produced by
  `Buffer.from(JSON.stringify(record, null, 2) + '\n', 'utf8')`.
- Edge `bodies → summarize()`, carrying one `Buffer` per record as the
  third parameter.
- Edge `summarize() → PublishedRecordSummary`, now carrying two more
  fields: `bytes: number` from `Buffer.byteLength`, and `sha256: string`
  from `createHash('sha256').update(body).digest('hex')` in Node's
  built-in `node:crypto`.
- Edge `bodies → writeFileSync`, carrying the same `Buffer` object that
  was hashed, to the path `<outDir>/records/<id>.json`.

The reason the last two edges share one `Buffer` rather than each
building their own is the entire correctness argument of this section,
and it is stated in 15.4.

**Node `renderIndexPage()` in `ursa-major/src/publish.ts`** (existing
pure function, `PublishedIndex` in, `string` of HTML out). Its output
changes shape, not type:

- Each `<tr>` it emits now carries `class="record"`, and each `<td>`
  inside it opens with a `<span class="label">` holding that column's
  own name as document text.
- Its inlined `<style>` block gains a `@media (max-width: 760px)` rule
  under which `table`, `tbody`, `tr` and `td` all become
  `display: block`, `thead` becomes `display: none`, and `.label`
  becomes visible.
- Its `<footer>` now states what `index.json`'s digests prove and what
  they do not.

**Node `tools/measure-index-page.ts` in `ursa-major/`** (new file, a
command run by hand). Edges:

- `tools/measure-index-page.ts → fixtures/mini/` reading `final.md` and
  `conversations/01-claude.md`, `conversations/02-chatgpt.md` as UTF-8
  text, the same two files `src/publish.test.ts` reads.
- `tools/measure-index-page.ts → resolve()` in `src/resolve.ts`,
  carrying a `ResolveInput`, returning an `OutcomeRecord`.
- `tools/measure-index-page.ts → saveRecord()` in `src/store.ts`,
  writing `<tmpdir>/ursa-measure-index-<random>/.ursa/records/<id>.json`.
- `tools/measure-index-page.ts → publish()` carrying a
  `PublishOptions`, returning a `PublishResult`.
- `tools/measure-index-page.ts → chromium.launch()` in the `playwright`
  package, which is NOT a dependency of `ursa-major` and is imported at
  run time; then `page.goto('file://<tmpdir>/.../site/index.html')` and
  one `page.evaluate` returning
  `{ scrollWidth: number; clientWidth: number; tallestRow: number }`
  read from `document.documentElement` and the row elements.

### 15.3 Interfaces, as the signatures a caller writes against

The published contract, with the 0.3.0 delta marked. This is the whole
of what the frontend seat codes against:

```ts
export const PUBLISHED_INDEX_VERSION = '0.3.0'

export interface PublishedRecordSummary {
  // ... every field of 0.2.0, unchanged, listed in section 4.4 ...
  /** site-relative path of the record's own JSON file */
  json: string
  /** added at 0.3.0: byte length of that file as this run wrote it */
  bytes: number
  /** added at 0.3.0: SHA-256 of those same bytes, lowercase hex, 64 characters, no prefix */
  sha256: string
}
```

The internal signature that changed, which is the one a future editor of
`publish.ts` has to respect:

```ts
// before 0.3.0
function summarize(record: OutcomeRecord, repository: string | null): PublishedRecordSummary

// at 0.3.0: `body` is the exact buffer that will be written to
// records/<id>.json, passed in rather than computed here
function summarize(
  record: OutcomeRecord,
  repository: string | null,
  body: Buffer,
): PublishedRecordSummary
```

Unchanged, and worth saying so because a consumer might expect
otherwise: `publish(opts: PublishOptions): PublishResult`,
`PublishOptions`, `PublishResult`, `manifestFor`, `formatManifest`,
`recordHref`, `loadPublishable` and `renderIndexPage` all keep the
signatures section 4.2 states. A caller of `publish()` needs no change
at all to get the new fields.

The verification a consumer writes against this, in the browser, which
is the code the two fields exist for:

```ts
async function fetchVerified(
  siteRoot: string,
  summary: PublishedRecordSummary,
): Promise<{ record: OutcomeRecord; verified: boolean }> {
  const response = await fetch(new URL(summary.json, siteRoot))
  const bytes = new Uint8Array(await response.arrayBuffer())
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return {
    record: JSON.parse(new TextDecoder().decode(bytes)) as OutcomeRecord,
    verified: bytes.byteLength === summary.bytes && hex === summary.sha256,
  }
}
```

### 15.4 Why the digest is taken over the buffer and not over the record

`summarize` is handed the `Buffer` that `writeFileSync` receives. It
would have been one line shorter to let `summarize` call
`JSON.stringify(record, null, 2)` itself, and that version would pass
every test in `src/publish.test.ts` today.

It would also be wrong, in the specific way that only shows up later. A
digest computed from a second serialization is a claim about this
process's serializer, not about the file a stranger downloads. The two
agree only while every one of the following holds: key insertion order
is identical between the two calls, the indentation argument is the same
at both call sites, the trailing newline is appended at both, and the
runtime encodes every string to UTF-8 identically in both. Each of those
is true now. None of them is guaranteed by anything in the codebase, and
the failure mode when one breaks is not a crash: it is a published site
whose every record fails verification in a viewer, which reads to a
stranger exactly like a tampered record.

Sharing the buffer makes the question unaskable. One serialization, one
hash of it, one write of it.

The cost of that choice, stated: the whole set is held in memory as
UTF-8 buffers at the same time. For this repository's own ten records
that is roughly the 21MB of site the frontend seat measured. The records
are already all in memory as JavaScript objects by that line, which is
strictly larger than their serialized form, so this adds a constant
factor to a process that was already proportional to the set size. It
does not change what the publish path can handle.

### 15.5 On-disk layout, with a real payload

Paths are unchanged from section 5.2. One file's contents change shape.

```
<outDir>/
  index.json            <- two new fields per record, contract 0.3.0
  index.html
  .nojekyll
  records/
    <id>.html
    <id>.json           <- byte-identical to 0.2.0; the digest is of this file
```

A real `index.json`, produced by the exact command in 15.6 and trimmed
to one record, with the fields section 4.4 already lists elided. The
record ids here come from `tools/measure-index-page.ts`, which names its
fixture records in the shape `episodeId` produces
(`<directory-name>-<date>-<sha7>`) without using any real directory on
any real machine, for the reason section 10.1 gives:

```json
{
  "indexVersion": "0.3.0",
  "publishedAt": "2026-10-18T00:00:00.000Z",
  "repository": "someone/their-repo",
  "recordSchemaVersions": ["0.1.0"],
  "records": [
    {
      "id": "ursa-engineer-sandbox-clone-2026-10-10-a1b2c30",
      "generatedAt": "2026-10-18T01:57:53.716Z",
      "finished": true,
      "artifactKind": "chat",
      "finalChars": 314,
      "coveredChars": 308,
      "resolvedBy": null,
      "html": "records/ursa-engineer-sandbox-clone-2026-10-10-a1b2c30.html",
      "json": "records/ursa-engineer-sandbox-clone-2026-10-10-a1b2c30.json",
      "address": "pages/someone/their-repo/ursa-engineer-sandbox-clone-2026-10-10-a1b2c30",
      "bytes": 7454,
      "sha256": "1d0b1342345c8a6ddfb08f1385d09b5695152cc24ed3fd9a28e2a07bf4004be7"
    }
  ]
}
```

Checked against the file itself with a hasher that is not this
codebase's, which is the point of showing the command rather than the
claim. Run from the site directory the command above printed:

```bash
$ stat -c %s records/ursa-engineer-sandbox-clone-2026-10-10-a1b2c30.json
7454
$ sha256sum records/ursa-engineer-sandbox-clone-2026-10-10-a1b2c30.json
1d0b1342345c8a6ddfb08f1385d09b5695152cc24ed3fd9a28e2a07bf4004be7  records/ursa-engineer-sandbox-clone-2026-10-10-a1b2c30.json
```

**One thing that payload shows and a reader would otherwise trip on.**
`bytes` is 7,454 on every run of that command, and `sha256` is not. The
digest is of the record's bytes, and those bytes include
`task.generatedAt`, which `resolve()` sets from the wall clock, so
resolving the same input twice produces two records that differ in one
timestamp and therefore in their digest. The byte count happens to be
stable only because an ISO-8601 timestamp is a fixed width.

That is correct behaviour for what the field claims — it identifies a
record file, not a resolution of an input — and it is also the reason
`bytes` and `sha256` are published rather than recomputed by a consumer
from a record it resolved itself. A reader who wants to check that two
separately resolved records describe the same work compares the record,
not its digest. Reproducible resolution is a separate property this
codebase does not currently have, and it is in `docs/ideas.md` as of
today.

### 15.6 Exact commands

What this run ran, from `ursa-major/`, in order:

```bash
# dependencies, because a fresh clone of this repository has no node_modules
npm ci --no-audit --no-fund

# the publish suite alone while iterating: 32 tests
npx vitest run src/publish.test.ts

# the whole suite, which is what CI runs: tsc --noEmit then vitest run
npm test

# render a real site from the fixture record and print its index
npx tsx tools/measure-index-page.ts --records 10

# measure the layout at three viewport widths in a real browser engine
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright \
  npx tsx tools/measure-index-page.ts --widths 390,768,1280 --records 3

# rebuild the single-file bundle the Action runs, then index its digest.
# Two commits, in this order, because a commit cannot index its own bundle
npm run bundle
npm run provenance:bundles
```

What a consumer runs to check a published site by hand, with no Ursa
code involved at all, which is the property the two fields are for:

```bash
curl -s https://<owner>.github.io/<repo>/index.json \
  | jq -r '.records[] | "\(.sha256)  records/\(.id).json"' > SHA256SUMS
curl -sO https://<owner>.github.io/<repo>/records/<id>.json
sha256sum --check --ignore-missing SHA256SUMS
```

That last line is the whole claim, in a tool nobody here wrote.

### 15.7 Evidence

| Claim | How it was checked | Result |
|---|---|---|
| The digest in the index is the digest of the file on disk | `src/publish.test.ts`, test "states each record's byte count and sha256, both measured against the file on disk": reads `records/<id>.json` back as bytes and hashes it with `node:crypto` | Passes for every record in a two-record set |
| The same, checked outside this codebase | `sha256sum` and `stat -c %s` over a site rendered by `tools/measure-index-page.ts`, output in 15.5 | Byte count 7,454 and digest `1d0b1342…4be7` both match `index.json` |
| A record's digest does not move when the site is merely rebuilt | Test "gives two different records two different digests, and the same record the same one": publishes twice with different `publishedAt` values | Digests and byte counts identical across the two builds |
| A record's digest moves when the record changes | Test "moves a record's digest when the record itself changes": flips `task.finished`, saves through `saveRecord`, republishes | Digest differs, and matches the new file on disk |
| The two fields are announced by a version bump | Test "announces the two fields with a minor version bump": asserts the minor component is at least 3 | Passes at `0.3.0` |
| What the two fields cost a ten-record index | Re-serialized a real `index.json` with both fields stripped and compared byte lengths, gzip included | 10,479 bytes with, 9,429 without: 1,050 bytes total, 105.0 bytes per record, 454 bytes after gzip. The frontend seat predicted "about a hundred bytes a record" |
| Every cell of the set page keeps its column name when the table becomes blocks | Test "gives every cell its own column name as real text", in jsdom | One label per cell, every label also a `thead` heading, and no `attr(data-label)` anywhere in the page |
| The narrow-viewport rules exist and do what the fix needs | Test "stops being a seven-column table on a narrow viewport": asserts the media query, the `display: block`, the hidden `thead`, both halves of the label rule, and `overflow-wrap: anywhere` on the id | Passes |
| The whole suite still passes | `npm test` | 764 passed, 9 skipped, 0 failed, after the bundle rebuild and the provenance index |

**The one claim this run could not measure, named rather than implied.**
The actual width. `jsdom` 30.1.1 parses HTML and performs no layout, so
`scrollWidth` is `0` for every element in every test in this repository,
and the 521px-inside-390px defect cannot be reproduced in the test
suite at all. `tools/measure-index-page.ts` is the instrument that can
measure it, and in the sandbox this run executed in, Playwright's
chromium is installed and will not start: `error while loading shared
libraries: libatk-1.0.so.0`. The tool exits 2 with that sentence rather
than printing a zero, because a run that reported "no overflow" there
would be a false green. So the fix is argued from the mechanism — a
seven-column table has a minimum width that no font size gets under
390px, and blocks have none — and the re-measurement is handed to the
frontend seat, which has a working browser and produced the original
number.

### 15.8 What the digest proves, and what it does not

**It proves** that the record being read is the record this `index.json`
was written against. Concretely, it catches: a truncated or partially
written download, a stale copy served by a cache or a CDN edge after the
site was redeployed, and a record file replaced on the host without the
index being rewritten.

**It does not prove** that the publisher is honest. `index.json` and
`records/<id>.json` are written by the same `publish()` call into the
same directory, so a publisher who changes a record and rebuilds the
site produces a set that verifies perfectly. Catching that needs a
signature over the index by a key the reader already trusts, which is a
different mechanism, is not this one, and is not proposed here.

That limit is on the published page itself, in `renderIndexPage`'s
footer, and not only in this file: "It does not show that whoever
published this site is honest, because this page and the records under
it were written by the same run." A verification UI that implies more
than the mechanism delivers would be worse than no verification at all,
which is the frontend seat's own position and the reason it asked for
the field in those words.

### 15.9 Tooling

| Tool | Version | Its job here | Why it rather than the alternative |
|---|---|---|---|
| `node:crypto`, Node's built-in cryptography module | Node.js 22.23.2 | Computes the SHA-256 in `summarize` | Already in the runtime, no dependency to add, and `createHash` takes the `Buffer` directly. The alternative considered was `crypto.subtle.digest`, the Web Crypto API Node also ships: it is async, which would make `publish()` async and change the signature every caller in this repository writes against, for no benefit on the writing side |
| SHA-256, the hash itself | FIPS 180-4 | The digest published in `index.json` | Chosen over BLAKE3 (faster, no Node built-in, no browser support, so a viewer would have to ship a WASM hasher) and over SHA-512 (no advantage here and twice the hex in every index row). SHA-256 is the one hash that `node:crypto`, `crypto.subtle` in every browser, and `sha256sum` at a shell prompt all compute without anything installed, which is what makes 15.6's last command possible |
| `playwright`, a browser automation library | 1.64.1 | Launches Chromium in `tools/measure-index-page.ts` and reads `scrollWidth` against `clientWidth` at three viewport widths | Chosen over `puppeteer` because the machines in this organization already carry a Playwright browser cache, and over adding a jsdom-based assertion because jsdom has no layout engine at all and would answer `0` to the only question being asked. Deliberately NOT a dependency of `ursa-major`: it carries a browser download, and `npm ci` has to stay cheap on a runner that will never measure a layout, so it is imported at run time behind one `try` and an `exit 2` |
| `jsdom`, an HTML parser with DOM APIs | 30.1.1 | Parses the rendered set page in `src/publish.test.ts` to assert structure: labels per cell, headings, footer text | Already a devDependency for this file's existing tests. Kept for structure and explicitly not trusted for geometry, for the reason in 15.7 |
| `vitest`, the test runner | 5.0.2 | Runs the 32 tests in `src/publish.test.ts` and the 773 in the suite | Already this package's runner; no alternative was considered and none is needed |
| `esbuild`, a JavaScript bundler | 0.28.0 | Builds `dist/ursa.cjs`, the single file the Action runs, via `npm run bundle` | Already the bundler of record for this path; section 12 states why |
| `sha256sum` and `stat`, GNU coreutils | 9.x as shipped by the host image | Independently checks the published digest and byte count in 15.5 | The point is precisely that they are not this codebase: a digest verified only by the code that wrote it is not evidence |

### 15.10 What this section does not solve

**The record is still 4MB on disk and a third of that is whitespace.**
The frontend seat's decomposition says so: pretty-print indentation is
about a third of the file, and the finished document is stored a second
time chopped into per-span text, with 2,528 spans each carrying their
own offsets, class, source pointer and word-level diff. Gzipped it is
293,898 bytes, 7% of the on-disk size, so a web server with compression
enabled already sends a fourteenth of the number. Not touched here,
because the frontend seat's answer — stop paying for it when listing a
set, pay for it when opening a record — removes the cost at the moment
that actually hurt, and changing what a record contains changes it for
every consumer rather than for this one page. In `docs/ideas.md`.

**Compression is not this path's to switch on.** Whether `index.json`
and the records arrive gzipped is a property of whoever serves the
directory. GitHub Pages compresses by default, so the Action path in
section 7.2 gets it for free, and a publisher who copies the directory
to a bare object store may not. Naming it is all this file can do.

**A viewer still cannot tell a tampered site from an honest one.** 15.8
is explicit about it. If that matters for a buyer-facing claim later, the
mechanism is a signature over `index.json`, not a stronger hash.

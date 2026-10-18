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
  (the bundle; 255,121 bytes at this commit)      file, nothing installed
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
  skipped: { id: string; reason: 'unsafe-id' | 'unreadable' }[]
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

```ts
export const PUBLISHED_INDEX_VERSION = '0.1.0'

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
}
```

`indexVersion` is versioned separately from `OutcomeRecord.schemaVersion`
on purpose: the index can gain a field without a record changing, and a
record can change without the index moving, so a consumer pinning one
must not be told about the other.

### 4.5 Addressing, and the store reads it reuses

```ts
export const INDEX_JSON = 'index.json'
export const INDEX_HTML = 'index.html'
export const RECORDS_DIR = 'records'
export function recordHref(id: string, ext: 'html' | 'json'): string

export function loadPublishable(projectPath: string): {
  records: OutcomeRecord[]
  skipped: PublishResult['skipped']
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

### 6.4 What the disclosure may honestly claim

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

22 new tests in `ursa-major/src/publish.test.ts`, plus one strengthened
in `src/bundle-exec.test.ts`. Full suite: **705 passed, 4 skipped**.

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
| esbuild | 0.28.2 | Bundles `src/bin/bundle-entry.ts` into the single committed `dist/ursa.cjs` the Action executes. Grew the file from 202,367 to 255,121 bytes in this run, the increase being `src/viewer.ts` and `src/publish.ts`, neither of which was reachable from the bundle before | `tsc` alone, which emits a module per file and needs a loader on the runner. Rollup or webpack, each of which is a larger dependency for a one-entry CommonJS build with no code splitting |
| TypeScript | 5.9.3 | `tsc --noEmit` is the only check that holds `PublishedIndex` and `renderIndexPage` to the same shape, since the renderer reads fields off a typed value rather than a parsed JSON blob | Runtime validation with `zod` 4.6.5, which is already a dependency and is right for untrusted input. The index is constructed in this process from typed values, so a schema check here would validate this module against itself |
| vitest | 5.0.2 | Runs the 22 new tests and the 705-test suite. Already this package's runner; no new tool | — |
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
| the bundle | `node build/bundle.mjs` at the reverted commit, then `node build/bundle.mjs --check` | `dist/ursa.cjs` returns to sha256 `650a289f…`, 202,367 bytes |

Nothing in this run writes to `src/resolve.ts`, `src/stats.ts`,
`src/invariants.ts`, `src/store.ts` or `src/ci/run.ts`, so no record's
classifications, figures or bound checks are touched. `ursa publish` only
ever reads the store.

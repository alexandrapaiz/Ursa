# `artifact.kind` and `artifact.renderRef`: records that know what kind of finished thing they are about

Sprint 2026-09-21 item 2. Serves O1 KR1.3 (multi-source, multi-kind
corpus). Closes the ledger entry "Finished work is not only chat:
hosted and visual outputs" (2026-09-20, owner-accepted). Written to the
engineering-artifact standard in `prompts/engineer-agent.md`: system
diagram with real nodes, real TypeScript signatures at every boundary,
on-disk layouts with a real payload, exact commands, a versioned
tooling list with reasons, and no bare terms.

## 1. The problem, stated precisely

An outcome record joins a finished piece of work backward to the model
generations that fed it. Until this change the record said nothing
about **what kind of thing the finished work was**, and that silence
cost two specific things.

First, it hid the correction channel. When the finished work is prose,
the person corrects it by editing characters, and `survived_mutated`
spans carry the whole correction. When the finished work is a rendered
page, the person corrects it by looking at it. The n=1 trial over the
Ursa Minor site is exactly this case: its four hand-annotated
correction loops are phrased "looks like crashing" and "still too
dark". Those corrections were provoked by a render. The record carried
the CSS that resulted and no pointer to the thing the person's eye was
actually on.

Second, it made two structurally different records look identical to a
buyer. A record built from a chat transcript and a record built from a
repository's commit pairs are both `OutcomeRecord`s with the same
fields. A lab filtering for "outcome records where the human judged a
deployed interface" had no field to filter on.

`artifact.kind` names the category. `artifact.renderRef` points at the
rendered state when one exists.

## 2. System diagram

Every node below is a real file in this repository. Every edge is
labelled with the type or the file contents that cross it, not with a
verb. Rendered here as a node-and-edge specification so it can be drawn
as SVG without inventing anything.

**Nodes**

| Node id | Real thing it is | What it does in this feature |
|---|---|---|
| `GITREPO` | the user's own project directory, a git working tree and its object database | Holds both the commit pair being resolved and the committed configuration files that name a deploy domain |
| `pairfinder.blobAt` | the exported function `blobAt` in `ursa-major/src/pairfinder.ts` | Runs `git show <sha>:<path>` and returns the file's contents at that commit, or `null` when the path did not exist there |
| `deploy.detectDeploy` | the exported function `detectDeploy` in `ursa-major/src/deploy.ts`, new in this change | Applies three ordered rules to a repository's files and returns a `DeployDetection` (a URL plus the file and field it came from) or `null` |
| `ursa.artifactFor` | the exported function `artifactFor` in `ursa-major/src/bin/ursa.ts`, new in this change | Turns a `DeployDetection` into the `Artifact` value a record carries: `repo` when there is none, `hosted` plus a `renderRef` when there is one |
| `resolve.resolve` | the exported function `resolve` in `ursa-major/src/resolve.ts` | Assembles the `OutcomeRecord`; now copies `ResolveInput.artifact` onto it, defaulting to `{ kind: 'chat' }` |
| `cli.parseArgs` | the `parseArgs` function in `ursa-major/src/cli.ts` | Parses `--artifact-kind` and `--render-ref` for the session-log path, which cannot detect a kind from git because it is not reading git |
| `store.saveRecord` | the exported function `saveRecord` in `ursa-major/src/store.ts` | Writes the record, `artifact` field included, to disk |
| `RECORDFILE` | the file `<projectPath>/.ursa/records/<taskId>.json` | The on-disk outcome record |
| `viewer.renderViewer` | the exported function `renderViewer` in `ursa-major/src/viewer.ts` | Renders the self-contained HTML viewer; now prints the kind as a spelled-out header chip and links an `https` `renderRef` |
| `VIEWERFILE` | the file `<outDir>/outcome_record.html` | The browsable record |

**Edges**

| From | To | What crosses the edge |
|---|---|---|
| `GITREPO` | `pairfinder.blobAt` | the literal argument triple `(projectPath, ep.finalSha, path)`, where `path` is one of `CNAME`, `public/CNAME`, `docs/CNAME`, `static/CNAME`, `package.json`, `vercel.json` |
| `pairfinder.blobAt` | `deploy.detectDeploy` | `string \| null`: the UTF-8 contents of that file at that commit, or `null` if absent. Passed as the `FileReader` callback, so `detectDeploy` itself never touches git |
| `deploy.detectDeploy` | `ursa.artifactFor` | `DeployDetection \| null`, that is `{ url: string; evidence: string } \| null` |
| `ursa.artifactFor` | `resolve.resolve` | `Artifact`, that is `{ kind: 'repo' } \| { kind: 'hosted'; renderRef: string }`, passed as `ResolveInput.artifact` |
| `cli.parseArgs` | `resolve.resolve` | `Artifact` built from the `--artifact-kind` and `--render-ref` flag values, passed as `ResolveInput.artifact` |
| `resolve.resolve` | `store.saveRecord` | `OutcomeRecord`, whose `artifact` field is now required |
| `store.saveRecord` | `RECORDFILE` | `JSON.stringify(record, null, 2) + '\n'` |
| `resolve.resolve` | `viewer.renderViewer` | `OutcomeRecord` |
| `viewer.renderViewer` | `VIEWERFILE` | a UTF-8 HTML document with the record embedded in a `<script id="record" type="application/json">` element |

The one edge worth reading twice is `GITREPO → pairfinder.blobAt`. The
lookup is at `ep.finalSha`, the episode's own final commit, and not at
the working tree. A record resolved today from a commit made six months
ago therefore carries the URL that commit shipped with. If the domain
moved afterwards, the old record keeps pointing at the old domain,
which is correct: it names where the accepted state was visible when it
was accepted.

## 3. Interfaces at every component boundary

These are the signatures a caller writes against, copied from the
source, not descriptions of them.

`ursa-major/src/types.ts`:

```ts
export type ArtifactKind =
  /** the finished work is the conversation itself (transcript, pasted thread) */
  | 'chat'
  /** the finished work is source under version control; commits are the edits */
  | 'repo'
  /** the finished work is reachable at a URL — a deployed site, a published page */
  | 'hosted'
  /** the finished work was accepted or corrected by eye — a render, a design */
  | 'visual'

export interface Artifact {
  kind: ArtifactKind
  /**
   * Where the accepted state can be seen as the user saw it: a deploy URL for
   * `hosted`, a screenshot path for `visual`. Absent when no render exists.
   */
  renderRef?: string
}

export interface OutcomeRecord {
  schemaVersion: '0.1.0'
  task: { id: string; finished: boolean; generatedAt: string }
  /** what kind of finished thing this is, and where its rendered state lives */
  artifact: Artifact
  files: FinalFile[]
  conversations: ConversationMeta[]
  generations: GenerationRecord[]
  stats: Stats
  signals?: LabSignals
}
```

`ursa-major/src/deploy.ts`, new:

```ts
/** Reads a repository-relative path, returning null when the file is absent. */
export type FileReader = (path: string) => string | null

export interface DeployDetection {
  /** absolute http(s) URL where the finished work can be seen */
  url: string
  /** repo-relative file and field the URL came from, so the claim is auditable */
  evidence: string
}

export function detectDeploy(read: FileReader): DeployDetection | null
```

`ursa-major/src/bin/ursa.ts`, new export:

```ts
export function artifactFor(
  projectPath: string,
  ep: Episode,
): { artifact: Artifact; deploy: DeployDetection | null }
```

`ursa-major/src/resolve.ts`, one added optional field:

```ts
export interface ResolveInput {
  taskId: string
  files: Array<{ path: string; text: string }>
  conversations: ConversationMeta[]
  generations: RawGeneration[]
  finished: boolean
  generatedAt?: string
  /** omitted means `chat`: this path joins final files against a transcript */
  artifact?: Artifact
}
```

`detectDeploy` takes a `FileReader` rather than a directory path on
purpose. That is what lets the same function serve two callers with
different notions of "the files": `ursa run` binds it to a git blob
lookup at a specific commit, and the test suite binds it to an in-memory
object literal, so the detection rules are testable without building a
git repository for each case.

## 4. The three detection rules, and what is deliberately excluded

In priority order. Each reads one committed file.

| Rule | File read | Field | URL produced | Why this file is trustworthy |
|---|---|---|---|---|
| 1 | `CNAME`, or the same filename under `public/`, `docs/`, `static/` | the whole first non-empty line | `https://<that hostname>` | GitHub Pages reads this file and only this file to decide the custom domain it serves from. Its entire purpose is to name the deploy domain |
| 2 | `package.json` | `homepage` | the value, normalised through `new URL()` with a trailing slash removed | npm, Create React App and the GitHub Pages publishing tools all already agree this field means "the URL this is served at" |
| 3 | `vercel.json` | `alias`, a string or the first entry of an array | `https://<that hostname>`, or the value itself if already absolute | Vercel's `alias` field names the production domains a deployment is aliased to |

A `vercel.json` carrying build configuration but no `alias`, a
`netlify.toml`, or a GitHub Pages workflow file is **deliberately not
enough**. Those prove a deploy pipeline exists. They do not say where to
look at the result, and `renderRef` exists to be looked at. An artifact
with a pipeline and no findable URL stays `repo`, which is the honest
answer, rather than becoming a `hosted` record pointing nowhere.

Values that are rejected even when the field is present: anything whose
host is `localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, or ends in `.local`
or `.localhost`; a relative path such as `./build`; a string that is not
a hostname of at least two dot-separated labels; and a file that does
not parse as JSON. A `CNAME` whose first line is a comment fails the
hostname test and so is rejected too.

## 5. On-disk layout, with a real payload

Nothing new is written to a new location. The `artifact` object is one
more top-level key in the existing record file.

```
<projectPath>/.ursa/
├── episodes.json                       # Episode[], the index
└── records/
    └── <taskId>.json                   # OutcomeRecord, now with `artifact`
```

Real payload, the head of a record produced by the command in §6 against
a throwaway repository whose commit carries `CNAME` holding
`ursa-minor.example.com`. Per the standard's redaction rider the project
path is a placeholder and the commit sha is truncated to the seven
characters git itself abbreviates to; everything else is verbatim
output.

`/tmp/hostedrepo/.ursa/records/hostedrepo-2026-09-25-3fad8e1.json`:

```json
{
  "schemaVersion": "0.1.0",
  "task": {
    "id": "hostedrepo-2026-09-25-3fad8e1",
    "finished": true,
    "generatedAt": "2026-09-25T01:46:33Z"
  },
  "artifact": {
    "kind": "hosted",
    "renderRef": "https://ursa-minor.example.com"
  },
  "files": [
    {
      "path": "index.html",
      "mode": "code",
      "text": "<h1>Peer-to-peer RLHF at population scale</h1>\n<p>Consented, cross-model data from real users doing real work.</p>\n",
      "spans": [
        {
          "start": 0,
          "end": 46,
          "text": "<h1>Peer-to-peer RLHF at population scale</h1>",
          "class": "survived_verbatim",
          "score": 1,
          "source": {
            "conversationId": "git-3fad8e1",
            "model": "Claude <noreply@anthropic.com>",
            "turnIndex": 1,
            "generationIndex": 0,
            "start": 0,
            "end": 46
          }
        },
        {
          "start": 47,
          "end": 114,
          "text": "<p>Consented, cross-model data from real users doing real work.</p>",
          "class": "survived_mutated",
          "score": 0.754,
```

Truncated there; the rest of the record is the existing schema,
unchanged by this work. The two spans are the point of the record and
the `artifact` block above them is the point of this change: the first
sentence the agent wrote survived the human's edit untouched, the
second was rewritten, and both are now known to have been judged on a
page served at `https://ursa-minor.example.com` rather than read as a
diff.

And the same key on the session-log path, from a record resolved against
the public `ursa-major/fixtures/mini` fixture with the visual flags set:

```json
  "artifact": {
    "kind": "visual",
    "renderRef": "screenshots/hero-accepted.png"
  }
```

`renderRef` is a URL for `hosted` and a repository-relative path for
`visual`. It is never an absolute filesystem path, because an absolute
path is machine identity and would not survive the redaction rider.

## 6. Exact commands

The literal invocations, with real flags. Run from `ursa-major/`.

Install and test:

```bash
cd ursa-major
npm ci
npx tsc --noEmit
npm test
```

Build the throwaway repository that produced the payload in §5, and
resolve it:

```bash
mkdir /tmp/hostedrepo && cd /tmp/hostedrepo
git init -q -b main
git config user.email h@example.com
git config user.name "Human Owner"
printf 'ursa-minor.example.com\n' > CNAME
printf '<h1>Peer-to-peer RLHF at population scale</h1>\n<p>Consented, cross-model, revealed-preference data from real users on real tasks.</p>\n' > index.html
git add -A
git commit -q -m "Generate the hero section

Co-Authored-By: Claude <noreply@anthropic.com>"
printf '<h1>Peer-to-peer RLHF at population scale</h1>\n<p>Consented, cross-model data from real users doing real work.</p>\n' > index.html
git add -A
git commit -q -m "Tighten the subhead"

cd -
npx tsx src/bin/ursa.ts run /tmp/hostedrepo --min-chars 50
```

The internal call that command makes, once per episode, six times at
most, is:

```bash
git -C /tmp/hostedrepo show <ep.finalSha>:CNAME
git -C /tmp/hostedrepo show <ep.finalSha>:public/CNAME
git -C /tmp/hostedrepo show <ep.finalSha>:docs/CNAME
git -C /tmp/hostedrepo show <ep.finalSha>:static/CNAME
git -C /tmp/hostedrepo show <ep.finalSha>:package.json
git -C /tmp/hostedrepo show <ep.finalSha>:vercel.json
```

It stops at the first one that both exists and yields a valid URL, so
the `CNAME` case above costs exactly one `git show`. A miss exits
non-zero and prints `fatal: path '...' does not exist in '<sha>'` on
stderr; `blobAt` now passes `stdio: ['ignore', 'pipe', 'ignore']` for
this call so an expected miss does not print noise into a run's output.

The session-log path, where the kind is declared rather than detected:

```bash
npx tsx src/cli.ts --id ursa-minor-site \
  --final ~/Desktop/ursa-minor-site \
  --conversations ./conversations \
  --artifact-kind visual \
  --render-ref screenshots/hero-accepted.png \
  --out ./out
```

An invalid kind is rejected at parse time rather than written into a
record:

```bash
$ npx tsx src/cli.ts --id t --final fixtures/mini/final.md \
    --conversations fixtures/mini/conversations --artifact-kind website --out /tmp/x
Error: --artifact-kind must be one of chat, repo, hosted, visual; got website
    at parseArgs (.../ursa-major/src/cli.ts:59:17)
```

That is a thrown `Error`, so it arrives with a stack trace and a
non-zero exit, matching how `parseArgs` already rejects an unknown
flag.

## 7. Tooling

| Tool | Version | Its job here | Why it, over the alternative considered |
|---|---|---|---|
| `git` | 2.x, whatever the user already has on `PATH`, invoked as a subprocess | Reads a file's contents at a specific commit, via `git show <sha>:<path>` | The alternative was a JavaScript git implementation, `isomorphic-git`. Rejected: it is a dependency worth adding only if Ursa needed git without git installed, and `ursa run` already requires a git working tree by definition. Shelling out keeps the dependency list at one runtime package |
| Node.js `child_process.execFileSync` | Node 22 built-in | Runs `git` with an argument array | `execFileSync` over `execSync` because it takes arguments as an array and never builds a shell command string, so a path containing a space or a shell metacharacter cannot be reinterpreted |
| Node.js `URL` (WHATWG) | Node 22 built-in | Parses and normalises the `homepage` value and extracts its hostname for the local-address check | Over a hand-rolled regular expression, because URL parsing by regex gets the edge cases wrong and the runtime already ships a correct parser |
| Node.js `JSON.parse` | Node 22 built-in | Reads `package.json` and `vercel.json` | Over a tolerant JSON5 or comment-stripping parser. `vercel.json` and `package.json` are both strict JSON by specification; accepting looser input would mean accepting files those tools themselves would reject |
| TypeScript | 5.7.2, the version already in `ursa-major/package.json` devDependencies | Makes `artifact` a required field of `OutcomeRecord`, so every construction site is a compile error until it supplies one | This is the enforcement mechanism for "`ursa run` fills `kind` on every run". An optional field would have let a path silently omit it |
| Vitest | 2.1.8, already in devDependencies | Runs the 15 new tests in `ursa-major/src/artifact.test.ts` | Already the project's runner; no new tool introduced |
| `tsx` | 4.19.2, already in devDependencies | Executes the TypeScript entry points directly for the commands in §6 | Already the project's runner; no new tool introduced |

No new dependency is added by this change. `ursa-major`'s runtime
dependency list remains the single package `diff`.

## 8. What "done" means, against the sprint's own acceptance criteria

Sprint 2026-09-21 item 2 states four criteria. Each, and the evidence:

| Criterion, verbatim from the sprint | Evidence |
|---|---|
| "`OutcomeRecord` gains `artifact: { kind: 'chat' \| 'repo' \| 'hosted' \| 'visual', renderRef?: string }` in `types.ts`" | `ursa-major/src/types.ts`, the `ArtifactKind` and `Artifact` declarations and the required `artifact` field on `OutcomeRecord`. Required, not optional, so `npx tsc --noEmit` fails on any construction site that omits it |
| "`ursa run` fills `kind: 'repo'` on every run" | `artifactFor` returns `{ kind: 'repo' }` whenever detection finds nothing, and `resolveEpisode` passes its result on every episode with no conditional. Test: "ursa run fills repo on a plain repository, with no renderRef" |
| "and fills `hosted` with the deploy URL when one is detectable" | Test: "ursa run fills hosted with the deploy URL when the commit names one", asserting the whole `artifact` object equals `{ kind: 'hosted', renderRef: 'https://minor.example.com' }`. Plus the real run in §6 |
| "`viewer.ts` displays the kind" | `renderViewer` appends a header chip carrying the spelled-out kind, and a second chip linking the `renderRef` when it is an `https` URL. Test: "the viewer states the kind in words and links a hosted renderRef" |
| "tests cover the `repo` default and one `hosted`-detection case" | Both named above, inside 15 new tests in `ursa-major/src/artifact.test.ts`. Suite goes from 26 passing to 41 |

## 9. Decisions taken, and what they cost

**`artifact` is required, not optional.** An optional field would have
been a smaller diff and would not have forced every caller to think. It
would also have made "fills `kind` on every run" unenforceable: a new
capture path could ship without one and nothing would say so. The cost
is that `artifact` is a breaking schema change for any record written
before today. `schemaVersion` stays `'0.1.0'` because no such record
exists outside the private trial repository and the two trials are
re-resolvable from source; a reader that must tolerate both can treat a
missing `artifact` as `{ kind: 'chat' }`, and the viewer already does
exactly that with `R.artifact || { kind: 'chat' }`.

**`evidence` is not stored on the record.** `detectDeploy` returns the
file and field its URL came from, which is the auditable part, and the
record keeps only the URL. This follows the sprint's field list
literally. The argument for storing it is that a lab reading a `hosted`
record cannot tell whether the URL came from a `CNAME` or a stale
`homepage` field. The argument against, which won for now, is that a URL
is verifiable by visiting it, and that widening a schema field beyond
what the accepted ledger entry asked for is the PM's call rather than
mine. Raised in the ledger as a proposal instead.

**`visual` is declared, never detected.** Nothing in a git repository
tells you that a person judged the result by eye. Detecting it would
mean guessing from file extensions, which would be wrong for every
codebase that contains a PNG. So `ursa run` never emits `visual`, and
the only way a record carries it is `--artifact-kind visual` on the
session-log path, where a human is already naming the run. The n=1
trial's record can be re-resolved with that flag to become what it
always was.

**Detection reads the episode commit, not the working tree.** More git
calls, up to six per episode, at most six per episode, which for a repository
the size of alexandria is a few hundred `git show` invocations and a
few seconds. Bought with that: a record whose `renderRef`
is true as of the moment it describes. Test: "reads the URL as of the
episode commit, not the working tree".

## 10. What this does not do

- It does not capture a screenshot. `renderRef` for a `visual` record
  is a path the person supplies; nothing in Ursa yet renders a page and
  saves the image. That is the ledger's "Screenshot the accepted state"
  proposal, filed today.
- It does not verify that a `renderRef` URL resolves. Doing so would
  mean a network call from a tool whose whole architecture is local and
  offline. A dead link in an old record is information, not a bug.
- It does not detect Netlify, Cloudflare Pages, Render, or Fly. Each
  would be one more rule in `detectDeploy` on the same `FileReader`
  interface, and none of them was needed to satisfy the sprint item.
  The shape is there for whoever needs the next one.

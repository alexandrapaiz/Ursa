# Ursa Major — Product Plan (internal)

Engineer seat, owner-dispatched 2026-09-18. The flagship dogfood case
throughout is the alexandria digest (owner's own RLHF example).

## 1. Product definition (revised per ADR-003, 2026-09-18)

v0 has no daemon, no watcher, no timer, and reads nothing ambiently.
The interaction is a launch: the user selects a finished project and
runs `ursa run <project>` locally, once, against that project's own
git history — episode boundaries are explicit, not inferred from idle
time, because git commit pairs already bound the work (a generated
commit, a human-edited commit). The second launch mode is the GitHub
Action, triggered by a PR merge the user's own workflow declares —
also explicit, also event-fired, never a poll. Both are launches the
user causes, not surveillance running in the background. Scope narrows
to building: git is the interface because Codex and Claude Code
already live there. Cron becomes an opt-in v1+ feature layered on top
of `ursa run`, never v0's default. The MCP server remains the delivery
path for interactive clients; the flagship dogfood case remains the
alexandria repo, now as n=2 in full (the whole build history, not only
digest prose). Superseded from the earlier draft: the always-on
daemon-first form factor; the owner rejected ambient reading, and
explicit launch respects consent and matches how builders work.

## 2. Architecture (revised per ADR-003 and the engineering-artifact standard)

Nine components. Four exist and are reused unchanged; five are new.
All of it runs inside one explicit invocation — nothing polls, nothing
watches a directory on a timer. `Watcher` and `Orchestrator` (the
daemon-era components) are deleted from the architecture, not
deferred; the CLI entrypoint is what was previously called the
orchestrator, run once to completion when the user types the command,
holding no state between invocations.

| # | Component | File | Status | Signature a caller writes against |
|---|---|---|---|---|
| 1 | CLI entrypoint | `src/bin/ursa.ts` | new | `main(argv: string[]): Promise<number>` — parses `ursa run <projectPath> [--model sonnet] [--out .ursa]` |
| 2 | Pair finder | `src/pairfinder.ts` | new | `findCommitPairs(repoPath: string, opts?: { agentTrailerPattern?: RegExp }): CommitPair[]` where `CommitPair { generatedSha; finalSha; paths; generatedAuthor; finalAuthor; generatedAt; finalAt }` |
| 3 | Episode segmenter | `src/episodes.ts` | new | `buildEpisodes(pairs: CommitPair[], projectPath: string): Episode[]` |
| 4 | Resolver | `src/resolve.ts` | exists, unchanged | `resolve(input: ResolveInput): OutcomeRecord` |
| 5 | Signals | `src/signals.ts` | new | `deriveSignals(record: OutcomeRecord, pairs: CommitPair[]): LabSignals` |
| 6 | Record store | `src/store.ts` | new | `saveRecord(projectRoot: string, record: OutcomeRecord): string` (returns the written path); `isDistilled(projectRoot: string, recordId: string): boolean` |
| 7 | Distiller | `src/taste/distill.ts`, `merge.ts` | exists, unchanged | `distill(record: OutcomeRecord, taste: TasteRecord, model: string, runner?: DistillRunner): DistillOutput` |
| 8 | Export/delivery | `src/taste/export.ts` | exists, extended | `renderTasteBlock(taste: TasteRecord, opts?: { domain?: string[] }): string` — the domain filter is the new part |
| 9 | Control surface | `src/taste/cli.ts` | exists, extended | `revokeAxiom(tastePath: string, unitId: string): TasteRecord` — new export beside the existing distill/export subcommands |

## 3. The hard problems

**(a) Episode boundaries.** v0 heuristic: idle-timeout (24h default) or
a git commit touching the episode's files, whichever comes first. For
chat-driven work this will still misfire on multi-day gaps (task-001's
own 3-day gap is the proof case). For the digest scenario, boundaries
are cleaner: an episode is one digest cycle, bounded by two commits —
the cron's generated commit and her next commit to the same file.
That's a stronger signal than idle-timeout and should be preferred
whenever both a generated commit and a chat session exist for the same
window.

**(b) Per-source capture, refined for "everything there."** Her digest
editing happens three ways, and v0 treats them differently:

- Direct file edits to the digest draft, no chat at all: handled by the
  new git-diff adapter above — the cleanest case, since it needs no
  transcript, only two commits.
- claude.ai chats about the digest: handled by the existing
  `parsePasteConversation` path (frontmatter + `## user`/`## assistant`),
  already built, zero new code — she exports or pastes the
  conversation.
- Claude Code sessions touching digest files: handled by the existing
  session parser, unchanged.

Deferred: any editor that isn't captured in git at fine granularity. If
she free-edits a draft across many small saves and commits once, the
git-diff adapter still gets a valid `(generated, final)` pair — coarse,
but correct. What it depends on and doesn't control: alexandria's cron
must commit the raw generated draft as its own commit *before* she
touches it. This plan assumes that's true; it needs verifying against
alexandria's actual workflow script before M0's digest data can be
trusted, and if it isn't true today, that's a one-line addition on
alexandria's side, not on Ursa's.

**(c) Distillation timing and cost.** Once per closed episode,
triggered only when the episode touches a `prose`/`voice`-domain axiom
for the digest export path specifically, so the alexandria repo doesn't
get a noisy commit per unrelated coding episode. Cost is one `claude -p`
call per closure, on her own subscription.

## 4. Data model and on-disk layout (revised)

**Decision: per-project `<project>/.ursa/`, not `~/.ursa/`.** The user
names a project explicitly, so storage scopes to that project the way
`.git/` does — a coder already understands "this directory has its own
local state." A global `~/.ursa/` would silently commingle projects;
cross-project aggregation should be an explicit later command, not an
implicit default. `.ursa/` goes in the target project's `.gitignore`;
only the small, domain-filtered exports (`taste-digest.md`, the
`AGENTS.md` managed block) are meant to be committed.

```
<project>/.ursa/
  episodes.json               # index of all Episode objects for this project
  records/<episode-id>.json   # one OutcomeRecord per episode
  taste.json                  # the TasteRecord (units[])
  taste.md                    # full rendered export
```

Episode — real example, reconstructed from the Ursa Minor site trial
(conversation 64899e58-98dd-44a6-940a-3ee95949a31f, Loop B files,
real session window):

```json
{
  "id": "ursa-minor-site-2026-08-05-constellation",
  "projectPath": "/Users/alexandrapaiz/Desktop/ursa-minor-site",
  "status": "closed",
  "openedAt": "2026-08-05T18:59:00.000Z",
  "closedAt": "2026-08-05T20:33:00.000Z",
  "closureHeuristic": "git-commit-pair",
  "touchedFiles": [
    "components/ui/pixel-sky.tsx",
    "components/ui/constellation.tsx",
    "app/page.tsx"
  ],
  "conversationIds": ["64899e58-98dd-44a6-940a-3ee95949a31f"],
  "distilled": true
}
```

`closureHeuristic` is a single-value type in v0
(`'git-commit-pair'`); `'idle-timeout'` is removed from the type
entirely, per ADR-003.

OutcomeRecord — real excerpt from the task-001 record, the generation
whose text closed Loop B (the last edit before step 730's acceptance):

```json
{
  "task": { "id": "ursa-minor-site", "finished": true, "generatedAt": "2026-08-05T22:14:39.607Z" },
  "generations": [
    {
      "conversationId": "64899e58-98dd-44a6-940a-3ee95949a31f",
      "turnIndex": 716,
      "kind": "edit",
      "filePath": ".../components/ui/constellation.tsx",
      "timestamp": "2026-08-05T20:20:38.065Z",
      "generationIndex": 183,
      "totalChars": 165,
      "survivedChars": 165,
      "survivalRate": 1
    }
  ],
  "stats": {
    "coveredChars": 19776,
    "byClass": {
      "survived_verbatim": { "spans": 478, "chars": 15654, "pct": 0.792 },
      "survived_mutated": { "spans": 7, "chars": 198, "pct": 0.01 },
      "no_generation_provenance": { "spans": 114, "chars": 3924, "pct": 0.198 }
    },
    "uncertainSpans": 55,
    "generated": { "totalChars": 83661, "survivedChars": 14935, "deletedChars": 68726, "deletedPct": 0.821 }
  }
}
```

`survivalRate: 1` on generation 716 is the real number §10's CaseUnit
`survivalScalar` is drawn from — no invented figure.

## 4b. Exact commands

Pair finder — the literal git invocations, run via
`node:child_process.execFileSync`:

```sh
# 1. enumerate commits: hash, author, email, ISO date, Co-Authored-By trailer, subject
git -C <projectPath> log --all --date=iso-strict \
  --pretty=format:'%H%x09%an%x09%ae%x09%aI%x09%(trailers:key=Co-Authored-By,valueonly,separator=|)%x09%s'

# 2. the files a commit touched
git -C <projectPath> show --name-only --format='' <sha>

# 3. one file's exact blob content at a commit
git -C <projectPath> show <sha>:<path>
```

Identifying a "generated" commit — decision: a commit counts as
generated if its Co-Authored-By trailer matches
`/Claude|Codex|Cursor|GPT/i` (the trailer this org's own commits
already carry — reusing an existing convention, not inventing one).
Its pairing "final" commit is the next commit by author date touching
an overlapping path, with no such trailer and author email equal to
`git config user.email`.

Distiller — the literal invocation, unchanged from distill.ts:

```sh
claude -p --model sonnet --output-format json
```

run as `execFileSync('claude', ['-p','--model',model,'--output-format','json'], { input: prompt, encoding: 'utf8', maxBuffer: 16*1024*1024, timeout: 300000 })`,
prompt on stdin, response parsed as `{ result: string, is_error?: boolean }`.

## 5. Milestones

- **M0 (days, revised per ADR-003):** `ursa run <project>` as a
  one-shot CLI invocation against a real git repo's full history — no
  watcher, no watermark, no background process before or after the
  run. Mines commit pairs across the whole repo. First target:
  alexandria, the full repo (n=2). Done when
  `ursa run <path>/alexandria` produces at least one `OutcomeRecord`
  per detected commit-pair episode from a single explicit command,
  with no ursa process running before the invocation or after it
  exits. Defers: signals, distillation, delivery, any cron.
- **M1:** signals (whatever resolver v2 has shipped) plus distillation
  wired automatically onto M0's records. Domain-filtered
  `taste-digest.md` commits, gated on owner review of the first several
  pushes (draft PR, not auto-merge). Done when `taste-digest.md` lands
  in the alexandria repo with the two named axiom families — Morning
  Brew register with why-it-matters framing, and no stylistic em dashes
  or semicolon joins — each traceable to real evidence steps in the
  digest records.
- **M1.5 (the flagship dogfood test):** alexandria's digest prompt
  reads `taste-digest.md` (a one-line change on alexandria's side,
  named as a dependency, not built here). Done when comparing the
  resolver's own `stats.byClass.survived_verbatim.pct` between digest
  cycle N (before the export existed) and cycle N+1 (after) shows N+1
  higher — less of the generated draft needed correction. This reuses
  the resolver's existing stat as the evaluation metric; no new
  measurement code.
- **M2:** MCP server for interactive clients (Claude Code, Desktop,
  Cursor). Done when a fresh session states back an axiom unprompted.
- **M2.5 (image + remote MCP):** done when the same container image
  runs the M0 pipeline locally and separately answers an authenticated
  remote MCP `list_axioms()` call from a second machine.
- **GitHub spine (after M2.5, before M3):** done when one real merged
  PR in a repo she owns, run through the Action, produces an
  `OutcomeRecord` and updates that repo's `AGENTS.md` managed block,
  with zero Ursa-operated compute involved, verified by the Action's
  own run log on her runner.
- **M3:** supervised daemon (launchd, restart-on-crash),
  git-commit-pair closure promoted to first-class alongside
  idle-timeout.
- **M4:** fix chat-session multi-day-gap misclassification; onboard one
  real second user. Done when task-001's data, run fully automatically,
  recovers its 4 loops within resolver v2's defined tolerance.

## 6. Decisions

- Daemon + MCP over GUI/CLI: continuous only means something
  unattended.
- Git-diff-of-commits as a direct generation/final input over requiring
  a transcript: her digest edits include direct file edits with no
  chat, and the resolver only ever needed generation text and final
  text.
- Domain-filtered export over shipping the whole taste block to the
  digest cron: a small non-Claude model's prompt budget shouldn't carry
  irrelevant code/layout axioms.
- Commit the export into the consumer's own repo over a hosted
  taste-serving endpoint: alexandria's cron already reads files from
  its repo at build time; a hosted endpoint is new infrastructure and a
  new trust boundary this doesn't need yet.
- Resolver's existing `survived_verbatim` percentage as the
  before/after metric over inventing an edit-counter: it's already
  computed per record and answers "how much correction did this draft
  need" directly.
- Batch-mine alexandria's existing git history for M0 over waiting on
  new live sessions: the correction history already exists and is the
  fastest path to a real dogfood record.
- Reuse `resolve.ts`/`distill.ts`/`merge.ts` unchanged over rewriting
  for streaming: task-001 already validated the matching logic.
- PR adapter over one adapter per tool: GitHub's commit/review/merge
  shape is already tool-agnostic, so one adapter covers every
  committing agent.
- GitHub Action on the user's runner over an Ursa-hosted capture
  service: keeps raw diffs and review text off Ursa compute entirely.
- `CLAUDE.md`/`AGENTS.md` managed block over MCP as the default
  coder-delivery path: every coding agent already reads these files.
- One watcher-less image for local, Action, and remote MCP over three
  separate builds: identical resolver/distiller logic, only the
  transport differs.
- Bearer token over OAuth for v0 remote MCP: sufficient for one owner's
  one deployment, revisited before any multi-user story.

## 7. Risks

1. **Episode misclassification silently corrupts the signal**, worse
   for chat-driven work than for the digest's commit-pair case.
   Mitigation: `closure.confidenceNote` on every record; weekly
   regression run against task-001.
2. **Cross-repo write access is a bigger blast radius than local file
   watching.** The daemon now needs push access to alexandria.
   Mitigation: scope access to one path (`taste-digest.md`),
   commit-only, never force-push, and gate the first several pushes on
   the owner's manual merge before trusting full automation.
3. **Commit-pair capture breaks under squash merges and force-pushed
   history**, generalizing the narrower alexandria-only version of this
   risk (the cron must commit the raw draft before she edits it — still
   an explicit dependency to verify) to the whole GitHub-spine story.
   Mitigation: detect a squash merge (single commit whose parent is the
   PR base) and degrade to one coarse pair instead of failing; never
   re-derive from a force-pushed ref without confirming the prior base
   commit still exists.

## 8. GitHub spine

Responsibility: generalize the git-diff adapter into a PR adapter so
capture works across any committing agent (Cursor, Codex, Claude
Code), not just alexandria's cron. Reads: a merged PR's commit history
— agent commits as generations, review comments as stated corrections,
follow-up commits as mutations, merge as acceptance, revert or
post-merge force-push as regression. Writes: the same
`OutcomeRecord`/`Episode` shapes M0 already produces; no new record
schema, only a new adapter.

Runs as a GitHub Action in the user's own account and repo, their
runner, their minutes, not Ursa-operated compute. The Action checks out
the PR, runs the container image from §9 locally to the runner, and
pushes only the derived record/taste to the user's own store, never the
raw diff or review text. Delivery for coders: a managed block in
`CLAUDE.md`/`AGENTS.md`, the digest pattern generalized, since every
coding agent already reads these files and no MCP client is required.

Reuses: `resolve.ts`, `distill.ts`, `merge.ts`, the domain-filtered
export, unchanged. New: a `parseGitHubPR` adapter (mirrors the git-diff
adapter's shape) and a managed-block writer using bounded markers so it
never clobbers the rest of the file.

Honest failure modes: squash merges collapse the commit sequence into
one, destroying the generation-to-mutation chain the loop detector
needs; v0 degrades to treating the squashed diff as one coarse pair,
losing recurrence counts. Review comments are not reliably corrections
— many are questions or praise; v0 does not classify comment intent,
and counts a comment as evidence only when a following commit's diff
overlaps its line range. Private-repo Actions need an explicit
repo-write token; v0 requests the narrowest scope, one path, never
org-wide.

## 9. Tooling and the container (revised, every entry versioned and justified)

The container invariant stands: one image, Ursa distributes it and
never operates the compute it runs on.

| Tool | Version | Job | Why over the alternative |
|---|---|---|---|
| Node.js | 22 (active LTS) | runtime for every component | package.json already targets ^22.10.0; the LTS line, not the sandbox's incidental v23 |
| tsx | ^4.19.2 (pinned) | run .ts directly, no compile step | v0 is invoked, not deployed as a compiled server; `npx tsx` is the repo's existing pattern |
| system git via execFileSync | user's installed git | pair finder's log/show calls | the target repo already has git; isomorphic-git reimplements git in JS (unneeded weight); simple-git wraps the three calls we write directly; distill.ts already shells out the same way — one pattern, not two |
| node:util parseArgs | built-in since 18.3 | parse `ursa run <project> [--model] [--out]` | one subcommand, no nested help; commander is for multi-command CLIs; taste/cli.ts already hand-rolls this way |
| vitest | ^2.1.8 (pinned) | test runner | already the toolchain; 22/22 tests pass on it today |
| diff | ^8.0.2 (pinned) | diffWords for survived_mutated spans | already imported in resolve.ts; unchanged |
| @modelcontextprotocol/sdk | ^1.x (Anthropic reference TS SDK) | MCP server, M2 local stdio and M2.5 remote HTTP | one package ships both transports; avoids a hand-rolled protocol implementation |
| Docker base image | node:22-slim | the one container image | -slim (Debian) over -alpine avoids musl native-module breakage; over full node:22 it is smaller and still allows `apt-get install -y git` for the one binary the pair finder needs |
| GitHub Action wrapper | composite (`runs: using: composite`) | the PR-merge-triggered launch mode | composite can checkout with the runner's own git/token first, then `docker run` the same image as a step; a pure docker-container action makes checkout awkward, and the composite YAML stays user-auditable before it pulls the image |

## 10. The output end-goal (revised per ADR-003 and vision §0b)

Rules-as-sole-output contradicts §0b.3 directly: the distiller's
product until now was stated rules, and the trial data shows exactly
where language runs out (Loops A–C: four to seven recurrences, motion
and feel) versus where it does not (padding, deploys: one shot,
stateable). That split is not invented, it is already in the data —
recurrence count is the code-computed signal for which domain gets
which treatment. Rules only where recurrence is low and stateable;
everything else becomes cases, not summaries.

Schema — `TasteRecord.units[]` replaces flat `axioms[]`:

```ts
type TasteUnit = RuleUnit | CaseUnit

interface RuleUnit {
  kind: 'rule'
  statement: string
  domain: string
  pinnedExamples: AxiomEvidence[]   // required, length >= 1, never freestanding
}

interface CaseUnit {
  kind: 'case'
  domain: string
  discoveredSpec: string            // post-hoc articulation, verbatim where possible
  evidenceTrail: { step: number; quote: string }[]  // every stated position kept, none merged
  survivalScalar: number            // price analog: resolving generation's survival rate
  acceptanceBasis: 'stated' | 'tacit'
  contradicts: string[]             // sibling unit ids, cross-referenced, never resolved away
}

interface ContrastivePair {         // Minor-facing, ComPO-shaped, from regressions
  rejectedRef: SourcePointer
  acceptedRef: SourcePointer
  evidenceSteps: number[]
}
```

Worked example, Loop B (constellation placement, recurrence 6, from
the real annotations): a RuleUnit here is falsifiable on contact. Step
650 says "should not move with mouse. separate layer. brighter." Step
710 says "please place the constellation where my mouse is." Any
single rule statement is wrong the moment the other quote exists. The
CaseUnit instead carries both as evidenceTrail entries, marks them as
contradicting, states the discoveredSpec from the record, sets
acceptanceBasis stated from step 730's acceptance, and reports the
survivalScalar of the resolving generations as the objective tiebreak
neither verbal statement could supply. This is the form the hand-made
trajectory (the first distillation, ursa-private trial/task-001)
already uses; the distiller's job is to reach it without hand
annotation, not to compress it into a rule.

Distiller changes that enforce §0b: the rule-versus-case partition is
code-owned, decided by the resolver's own recurrence count before the
model runs, preserving the discipline that the model judges content
and the code counts. Three new hard rejections join the evidence
check: a RuleUnit with zero pinnedExamples is rejected; a CaseUnit
that collapses two contradicting quotes into one merged statement is
rejected — contradictions survive as separate trail entries or linked
sibling cases, never resolved by the model into a single "true"
preference; and acceptanceBasis tacit is rejected unless the evidence
shows actual retention, not mere silence. The prompt states §0b.3 as
an operating instruction: where evidence contradicts itself or
contains no verbal statement, the correct output is a case, never a
rule, and summarizing a contradiction away is a validation failure,
not a quality improvement.

## 11. Diagram specifications

**Diagram 1 — M0 runtime/data-flow.** Rounded box = process, cylinder
= file store, plain box = external tool shelled out to. Nodes in
order: User (terminal) → `ursa run` (src/bin/ursa.ts) → Pair finder
(src/pairfinder.ts) ↔ system git (child process) → Episode segmenter
(src/episodes.ts) → Resolver (src/resolve.ts) → Record store
.ursa/records/*.json (cylinder); Resolver → Signals (src/signals.ts)
→ Record store; Record store → Distiller (src/taste/distill.ts +
merge.ts) ↔ claude CLI (child process) → Taste store .ursa/taste.json
(cylinder) → Export (src/taste/export.ts) → Output files: taste.md /
taste-digest.md / AGENTS.md managed block. Edge labels, exact: argv:
string[]; projectPath: string; execFileSync stdout (commit log text /
blob text); CommitPair[]; ResolveInput { files, conversations,
generations }; OutcomeRecord (JSON); LabSignals (merged into
record.signals); OutcomeRecord (read back); prompt: string out,
DistillOutput (JSON) back; TasteRecord (JSON); TasteRecord (read);
string (rendered text).

**Diagram 2 — component-interface diagram.** The nine §2 nodes,
labeled with file paths; edges carry the exact signatures from §2's
table (e.g. 2→3 `findCommitPairs(repoPath, opts?): CommitPair[]`; 3→4
`buildEpisodes(pairs, projectPath): Episode[]`; 4→6
`resolve(input): OutcomeRecord`; 6→7 `saveRecord(projectRoot,
record): string` and `isDistilled(projectRoot, recordId): boolean`;
7→8 `distill(record, taste, model, runner?): DistillOutput`; 8→9
`renderTasteBlock(taste, opts?): string`; 9 self-loop
`revokeAxiom(tastePath, unitId): TasteRecord`).

**Diagram 3 — output-schema entity diagram.** Dashed box `TasteUnit`
("union type") with is-a edges to `RuleUnit { statement; domain;
pinnedExamples: AxiomEvidence[] }` and `CaseUnit { domain;
discoveredSpec; evidenceTrail: {step,quote}[]; survivalScalar:
number; acceptanceBasis: 'stated'|'tacit'; contradicts: string[] }`;
beside them, no is-a edge, `ContrastivePair { rejectedRef;
acceptedRef; evidenceSteps: number[] }` (Minor-facing, outside the
union). A dashed "example instance" edge attaches `CaseUnit: Loop B`
with real values: domain "motion/placement"; discoveredSpec
"Constellation as its own layer above the starfield... follows the
pointer"; evidenceTrail [{650, "should not move with mouse..."},
{710, "please place the constellation where my mouse is"}];
survivalScalar 1.0; acceptanceBasis "stated".

## 12. Scale architecture (the product, not the trial)

Everything in §1–§11 describes what runs on one machine for one user.
This section is what makes Ursa Major a product with many users:
accounts, sync, and the cloud surface Minor's price book lives on. The
invariant does not move: raw records and taste never touch
Ursa-operated compute. The cloud only ever holds three things —
accounts, opt-in encrypted sync blobs (Ursa cannot read them), and
Minor's aggregated survival scalars (never particulars).

**Identity/auth — decision: GitHub OAuth**, not Clerk, not deferred.
The audience is git-native by construction; GitHub OAuth is $0 and the
identity the user already has. No second credential, no paid identity
vendor before revenue.

**Cloud API — decision: Vercel serverless functions**, matching every
other project on this account. Three routes only, v0:

```
POST /api/auth/callback   # GitHub OAuth exchange -> account row
PUT  /api/sync/:blobKey   # upload opaque ciphertext, account-scoped
GET  /api/sync/:blobKey   # download opaque ciphertext
POST /api/minor/ingest    # aggregate survival_stats batch, Minor-consented only
```

Hobby tier, $0 until traffic demands otherwise.

**Database — decision: Neon serverless Postgres** (already the
alexandria stack's choice; branching is useful for schema migrations
against a live price book).

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_user_id BIGINT UNIQUE NOT NULL,
  github_login TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  minor_consent_at TIMESTAMPTZ          -- null = Major-only, never in Minor's aggregate
);

CREATE TABLE sync_blobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  blob_key TEXT NOT NULL,               -- object storage key
  ciphertext_sha256 TEXT NOT NULL,      -- integrity only, never inspectable content
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, blob_key)
);

-- Minor's price book. One row per (domain, model, week) — never per-user,
-- never per-behavior-text. This table IS the price analog, literally.
CREATE TABLE survival_stats (
  domain TEXT NOT NULL,
  model TEXT NOT NULL,
  week_start DATE NOT NULL,
  contributor_count INT NOT NULL,       -- k-anonymity floor; rows below 5 are withheld
  survival_scalar NUMERIC(5,4) NOT NULL,
  sample_generations INT NOT NULL,
  PRIMARY KEY (domain, model, week_start)
);
```

**Object storage — decision: user-owned, client-encrypted, Vercel Blob
for ciphertext.** The CLI/container encrypts `.ursa/taste.json`
locally with a key derived from a passphrase only the user holds,
uploads ciphertext, and `sync_blobs.blob_key` points at it. Ursa's
server never holds the key and never sees plaintext. Sync is opt-in;
the tool works fully offline without it.

**Classic AI stack — where it belongs, and where it doesn't.** The
distiller stays `claude -p` on user compute (§9). The one genuine
embeddings use case is case retrieval — matching a new CaseUnit
against existing ones so loops don't fork into duplicates across
episodes. Decision: client-side, no cloud vector DB.
`@xenova/transformers` running `all-MiniLM-L6-v2` (ONNX, CPU,
in-process, no network call) embeds each `CaseUnit.discoveredSpec`;
the vector is cached as `embedding: number[]` on the unit inside
taste.json. Tens to low hundreds of cases per store means brute-force
cosine similarity is sub-millisecond; no Pinecone or pgvector is
justified, and raw case text never leaves the machine to be embedded
remotely.

**Telemetry.** Collected: account existence, sync blob events (hash
plus timestamp, no content), and — Minor-consented accounts only —
the aggregate survival_stats rows. Never collected: prompts, diffs,
case text, rule statements, embeddings, or per-run analytics tied to
identity. No analytics SDK ships in the CLI or container; that would
be the ambient collection ADR-003 already rejected.

**Distribution — three channels:** `npx @ursa-major/cli run <project>`
(npm registry); `ghcr.io/alexandrapaiz/ursa-major:<version>` (GitHub
Container Registry, $0, same account as the code);
`alexandrapaiz/ursa-major-action@v1` on the Actions Marketplace,
referencing the ghcr image per §9's one-image invariant.

**On-device vs cloud, explicit:**

| Forever on-device | Cloud (Vercel + Neon + Vercel Blob) |
|---|---|
| Resolver, distiller, all 9 §2 components | GitHub OAuth exchange, account row |
| `.ursa/` — records, episodes, taste.json, embeddings | Encrypted sync blobs (ciphertext only) |
| `claude -p` calls | survival_stats — Minor's price book, opt-in aggregate only |
| MiniLM case-retrieval embeddings | — |
| Raw prompts, diffs, quotes, discovered specs | — never leaves, even encrypted |

**Diagram spec — two zones, one boundary, three crossing edges.**
On-device zone ("User's machine"): the ursa pipeline (the 9
components as one sub-box), `.ursa/` (cylinder), claude CLI (external
tool), MiniLM (process). Cloud zone ("Ursa-operated — Vercel + Neon +
Vercel Blob"): Vercel API (3 routes listed), Neon Postgres (3 tables
listed), Vercel Blob ("ciphertext only"). External: GitHub OAuth. A
wall between zones crossed by exactly three labeled edges: OAuth
token exchange; ciphertext (encrypted client-side, key never
crosses); aggregate scalar batch (Minor-consented only). No other
edge crosses the wall.

## 13. Cross-tool matrix

| Tool | Capture mechanism | Verified? | Delivery mechanism | v0 ships |
|---|---|---|---|---|
| Claude Code | Co-Authored-By Claude trailer (§4b regex) | verified — this org's own commits carry it | reads CLAUDE.md; MCP client | CLAUDE.md managed block + local MCP resource |
| Codex (OpenAI CLI) | trailer/author-pattern fallback: no confirmed universal trailer, so the pair finder also matches commit author against a configurable agent-identity list | unverified — confirm against real Codex commits before trusting | reads AGENTS.md (the cross-tool convention) | AGENTS.md managed block; MCP not assumed |
| Cursor | same author-pattern fallback | unverified — confirm | reads AGENTS.md; MCP client | AGENTS.md managed block + MCP where the user wired it |

Where a tool's trailer convention is unverified, findCommitPairs
degrades to the author-pattern fallback rather than silently missing
the commit: a false negative (a generated commit treated as human) is
worse than a slightly noisy match. AGENTS.md is the guaranteed-works
delivery for all three; MCP is the richer live-pull layer where
present.

## 14. Encouragement (owner directive)

Two mechanics, both additive, neither required.

**1. The run summary leads with what survived, not a log dump.** New
`renderRunSummary(record: OutcomeRecord, signals: LabSignals): string`
in `src/bin/ursa.ts`. Real example, task-001's actual numbers:

```
ursa run ~/Desktop/ursa-minor-site — 193 generations resolved.
15,654 chars survived verbatim, 198 survived edited. That's the part
worth noticing: not what got written, what got kept.

3 correction loops closed this run. Loop B (constellation placement)
took 7 rounds and 365 steps — that one was hard-won, and it's closed.
1 regression caught and fixed (step 453).
55 spans still uncertain — nothing lost, just not confident yet.

Mark this run a win? [y/N]
```

**2. An optional satisfaction mark, offered once, never repeated.**
`promptSatisfactionMark(): Promise<'yes' | 'skip'>` after the summary;
`SatisfactionMark { step: number; polarity: 'positive'; source:
'cli-prompt' | 'pr-reaction'; recordedAt: string }` becomes one more
AxiomEvidence entry if given — it raises evidenceCount, it never
gates acceptance. Ignoring the prompt is a no-op: tacit closure
through retention (§0b, §10) stays fully valid with zero marks. For
the Action (no interactive stdin) the same summary posts as a PR
comment, and a thumbs-up reaction on it is the equivalent mark
(`source: 'pr-reaction'`), read back via the GitHub API on the next
run.

### §12b. Integration-led distribution (owner directive)

Distribution is every available integration surface: Ursa lists
wherever developers already browse, and each listing is the same one
image or MCP server wearing that ecosystem's jacket.

| Ecosystem | Integration surface | What ships there |
|---|---|---|
| Claude | MCP connector directory; Claude Code plugin/skill listing | the Ursa MCP server (stdio + remote); a skill that wraps `ursa run` |
| OpenAI | ChatGPT apps / connectors (MCP-compatible), Codex tool registry as it opens | the same remote MCP endpoint; AGENTS.md convention already covers Codex delivery |
| Cursor | MCP directory / recommended servers | the same MCP server config snippet |
| GitHub | Actions Marketplace (already §12); app listing later for the PR reader | `ursa-major-action@v1` |
| npm | registry | `@ursa-major/cli` |
| Vercel | Marketplace integration | one-click provision of the sync/API layer for self-hosters (templates: the 4 routes + Neon binding) |
| Neon | integration page / launch partner listing | the price-book schema as a template; co-marketing surface |
| Supabase | integration listing (alternative BaaS audience) | same self-host template with Supabase Postgres substituted — the schema is plain SQL on purpose |
| Clerk | not an identity dependency (GitHub OAuth decision stands) | a listed integration recipe only, for teams that already run Clerk |

Rule: an integration listing never adds a new trust surface — every
entry resolves to the npm CLI, the ghcr image, the Action, or the
user-deployed MCP endpoint. Marketplaces are shelves, not new
architecture.

# Ursa Major — Product Plan (internal)

Engineer seat, owner-dispatched 2026-09-18. The flagship dogfood case
throughout is the alexandria digest (owner's own RLHF example).

## 1. Product definition

v0 ships as a background daemon plus a local MCP server, both
Node/TypeScript processes on the user's own machine, built on the
existing `ursa-major/src` code. The daemon watches session and
file-history sources, turns finished episodes into outcome records, and
distills them into `taste.json`; the MCP server serves the current
`taste.md` as a resource any MCP-capable client attaches to (Claude
Code, Claude Desktop, Cursor). The flagship dogfood case is the
alexandria digest: she edits a cron-generated newsletter draft,
repeatedly, for prose. That editing is a real correction stream today,
sitting in her own git history, and it names the delivery problem
precisely — the consumer isn't a chat she's in, it's a GitHub Actions
cron calling a non-Claude model. Rejected: a hand-run CLI, because
continuous only means something if nothing needs remembering, and
because a CLI never gets taste into a cron job automatically, only onto
disk. Rejected: a desktop GUI app, because the loop (capture → record →
whys → taste → a measurably better next digest) hasn't been proven to
run unattended once yet.

## 2. Architecture

- **Watcher** (new): tails `~/.claude/projects/**/*.jsonl` with a
  byte/line watermark per file.
- **Episode segmenter** (new): replaces `--final`/`--sessions`. Reads
  parsed generations plus on-disk files. Writes an `Episode` record.
- **Resolver** (exists, unchanged): `resolve.ts`, `match.ts`,
  `segment.ts`, `normalize.ts`, `stats.ts`. Reads an episode's files
  and generations. Writes an `OutcomeRecord`.
- **Git-diff adapter** (new, digest-specific): treats two git blobs —
  the cron's generated commit and her edited commit for the same digest
  file — as a `(generation, final)` pair, bypassing conversations
  entirely. Same `RawGeneration`/`FinalFile` shapes the resolver
  already consumes; conversationId is synthetic (e.g.
  `digest-2026-09-18`), kind is a new `'generated_artifact'`.
- **Signals** (refactor point, resolver v2 track): auto-loop/regression
  detection, needed before distillation can run unattended.
- **Record store** (new): flat JSON under `~/.ursa/records/`, plus the
  distillation watermark, moved out of `taste/cli.ts`'s in-memory throw
  into something that survives restarts.
- **Distiller** (exists, unchanged): `distill.ts`, `merge.ts`. Already
  rejects axioms without evidence, already protects `user-edited`
  statements from overwrite.
- **Export/delivery** (exists as static file, extended for two new
  consumers): `export.ts` renders `taste.md` for paste-into-context.
  New: an MCP resource for live pull by interactive clients. New: a
  **domain-filtered git export** — a scoped `taste-digest.md` (axioms
  tagged `prose`/`voice`/`writing` only) committed into the alexandria
  repo at a path its digest prompt reads, for a consumer that is a cron
  job, not a chat.
- **Control surface** (new, minimal): `taste.json`
  hand-readable/editable; a `taste revoke <id>` CLI verb.
- **Orchestrator** (new): wires the above on a timer; v0 is a
  cron/launchd script, not a supervised process (that's M3).

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

## 4. Data model changes

- `types.ts`: add `Episode { id, projectPath, status, openedAt,
  closedAt?, touchedFiles, conversationIds, closureHeuristic:
  'idle-timeout'|'git-commit-pair', distilled }`; add
  `SourceWatermark`; extend `OutcomeRecord.task` with `episodeId` and
  `closure: { method, confidenceNote }`; add `GenerationKind:
  'generated_artifact'` for the git-diff adapter.
- `taste/types.ts`: no break. Add a `domain` filter parameter to
  `renderTasteBlock` (export.ts) so a consumer like the digest cron
  gets only relevant axioms, not the whole store.

## 5. Milestones

- **M0 (days):** git-diff adapter run once, in batch, against
  alexandria's *existing* commit history for past digest cycles — no
  waiting on new live sessions. Done when it produces at least 3
  `OutcomeRecord`s (one per past cycle) with nonzero
  `generated.deletedPct`, zero manual flags. In parallel, the
  watcher/watermark/idle-timeout path starts running for ordinary
  Claude Code use. Defers: signals, distillation, delivery.
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

## 9. The container

One image, watcher-less: resolver, distiller, and MCP server, no
filesystem watching baked in. The same image runs three ways: local,
invoked by the orchestrator's cron tick; as the GitHub Action's runtime
in §8; and user-deployed as a remote MCP server, so any MCP-speaking
chat surface connects to the user's own endpoint, sends it transcripts,
and pulls taste back.

Invariant, stated hard: Ursa distributes the image, Ursa never operates
the compute it runs on. No Ursa-owned server ever sees a raw
transcript.

Reuses: the entire existing pipeline as the image's payload, unchanged.
New: a Dockerfile, and an MCP transport that works as both local stdio
(M2) and remote HTTP (this section), same `TasteRecord` logic
underneath.

Honest failure mode: remote MCP needs real auth, since anyone with the
endpoint URL could read taste or push fake transcripts. v0 uses a
single owner-generated bearer token, no OAuth — adequate for one user's
own deployment, not for anything on shared compute.

# The Ledger — Ursa

Contract in docs/standards/pm.md §4.

## Grooming (2026-09-21, first PM run)

Accepted entries below, ordered by leverage against docs/vision.md
(highest first). This section is a priority note for sprint planning;
the dated entries beneath it are left in their original chronological
order, since the ledger is also the historical record of when each
idea entered.

1. **Finished work is not only chat** (2026-09-20) — directly serves O1
   KR1.3 (multi-source, multi-kind corpus). Verified unbuilt: no
   `artifact` field exists yet in `ursa-major/src/types.ts`. Pulled into
   sprint-2026-09-21 item 2.
2. **The tuning pipeline** (2026-09-18) — appears already shipped: the
   files the entry's "First step" describes (`distill.ts`, `merge.ts`,
   `export.ts`, `tuning.test.ts`) already exist on `main` under
   `ursa-major/src/tuning/`. Flagging so the building seat (or the
   owner) can move the status to `built`; the PM does not change
   statuses it does not own (docs/standards/pm.md §4).
3. **Agentic-forward: Ursa as the agents' HQ** (2026-09-19) — no KR
   names it yet this quarter, and its own first step is still bigger
   than a day. Split for whenever it is pulled: (a) define the
   `get_briefing` TypeScript interface in a new module, returning empty
   `rules`/`nearestCases`/`guardrails` arrays, with a test; (b)
   wire domain/file-based rule lookup against whatever rule store
   exists by then; (c) wire the §12 client-side embedding retrieval for
   `nearestCases`; (d) dogfood against one of Ursa's own seats and
   record what it actually returned. Not pulled into this sprint.

No `proposed` entry has sat two or more weeks without a verdict yet
(the oldest, repo split, is 3 days old as of this grooming), so nothing
escalates to "Awaiting your verdict" this run. Tracked instead in
docs/sprints/pending.md under "Owed by a seat, not yet started."

### 2026-09-18 — Repo split: Major and Minor
- Trigger: owner at bootstrap: combine now, "then we'll split it in two different ones"
- What: criteria and mechanics for splitting ursa-major and ursa-minor into their own repos with history preserved
- First step: PM seat proposes split criteria in its first activated run
- Cost: $0
- Status: proposed

### 2026-09-18 — The tuning pipeline (sessions → whys → portable tuning)
- Trigger: owner directive at the engineering session: regular chats and
  code sessions must become useful for RLHF; the H is the human building,
  the RLAIF reverse-engineers the whys; stored tuning for the user first,
  anonymized signal for labs later
- What: interpretation layer over outcome records — a local model pass
  distills evidence-backed tuning axioms into a user-owned tuning.json,
  exported as a portable context block; design at
  docs/design/tuning-pipeline.md, MVP in ursa-major/src/tuning/
- First step: shipped as MVP on branch tuning/mvp (distill, merge with
  revocation tombstones and tension wiring, export, 10 tests)
- Cost: $0 (runs on the owner's local claude CLI)
- Status: built (moved from `accepted` by the engineer seat 2026-09-27,
  the status transition the charter assigns to this seat. Evidence: the
  four files the First step names are all on `main` —
  `ursa-major/src/tuning/distill.ts`, `merge.ts`, `export.ts`,
  `tuning.test.ts` — and the 10 tests in `tuning.test.ts` pass under
  `npm test` at 356b3e5. The PM flagged this for the building seat in
  its 2026-09-21 grooming note, item 2, and correctly did not move it
  itself.)

### 2026-09-19 — Agentic-forward: Ursa as the agents' HQ
- Trigger: owner product idea, verbatim: "being agentic forward.
  helping this guide agents as well, almost like an hq"
- What: agents become first-class tuning consumers and producers. A
  brief→work→debrief loop on the existing MCP server: get_briefing
  (domain, files) returns relevant rules, nearest cases via the
  client-side embedding retrieval, and learned guardrails before an
  agent starts; the PR reader grades the run into a record after. The
  owner's own seat-org practice (charters, incidents, learning logs)
  productized for any agent fleet. HQ serves evidence, never orders —
  prices and cases, per the principles; the agent remains the judge of
  application.
- First step: add get_briefing to the M2 MCP server surface
  (plan §15 stub); dogfood on Ursa's own seats
- Cost: $0
- Status: accepted (owner-directed 2026-09-19)

### 2026-09-19 — Tuning packs (the omarchy lesson)
- Trigger: owner asked "thoughts on omarchy for our product?" — omarchy
  proves developers adopt curated tuning-as-artifact wholesale
- What: exportable, adoptable tuning profiles — a respected builder's
  distilled tuning.md installable the way people adopt omarchy configs;
  Ursa generalizes omakase (one chef's tuning) into your own learned
  palate, and lets either be shared deliberately. Consumer-side
  network effect no competitor has. Requires the redaction/consent
  standard before any pack leaves a machine
- First step: an `ursa tuning export --pack` variant that strips
  evidence quotes and ships rules + case specs only, owner-reviewed
- Cost: $0
- Status: proposed

### 2026-09-20 — Finished work is not only chat: hosted and visual outputs
- Trigger: owner directive: Ursa must analyze not just chats. Sometimes
  the final output is hosted on GitHub, or it is visual. That is
  captured in code, but she wants it stated explicitly.
- What: the finished artifact the record joins against can live in
  three places, and the capture path should name which. (1) The chat
  trace. (2) A hosted artifact: a repo on GitHub, a deployed site, a
  published page; git commit pairs already cover the repo case and a
  deployed URL is the retention evidence for the site case. (3) A
  visual artifact: a rendered UI, a design, a page the user looked at
  and accepted or corrected by eye. The n=1 trial was exactly this, the
  Ursa Minor site, and its loops were visual ("looks like crashing",
  "still too dark"). The code carries the visual outcome, but the
  correction happened on the render, so the record should carry the
  rendered state alongside the source when one exists (a screenshot
  per accepted commit, or the deployed URL at that commit).
- First step: add `artifact.kind: 'chat' | 'repo' | 'hosted' | 'visual'`
  and an optional `artifact.renderRef` (deployed URL or screenshot
  path) to the record schema, and have `ursa run` fill `repo` and, when
  a deploy is detectable, `hosted`.
- Cost: $0
- Status: accepted (owner-directed 2026-09-20)

### 2026-09-20 — Finding: merge commits are not edits; the PR reader is load-bearing
- Trigger: the M1 redo on alexandria. With merge commits excluded as
  pairing targets, the repo yields ONE real generated-then-edited pair
  (the W37 digest, 2026-09-08). Yesterday's 19 records were 18 merge
  artifacts plus that one; a 95-record run before the fix was 69 pairs
  against a single PR merge.
- What: in a repo run by agent seats through pull requests, the owner
  almost never edits an agent commit directly on main. Her corrections
  live in two other places: inside the PR (review comments, follow-up
  commits on the branch before merge) and in chat. So the commit-pair
  path is thin for agent-run repos, and the PR reader (plan §8) plus
  the session trace are where the signal actually is. The pair finder
  now skips merge commits (test added, 26 passing).
- First step: promote the PR reader from the GitHub-spine milestone
  into M1 scope for the alexandria trial; read each merged PR's review
  comments and branch commits as the correction stream.
- Cost: $0
- Status: proposed

### 2026-09-24 — Write-time file receipts: exact provenance for the file-write path
- Trigger: today's craft scan of LangSmith's feedback-to-trace join
  (oneuptime, 2026-09-12) proposes writing a durable response-to-trace
  mapping *before* the answer is returned, so late feedback attaches to
  the exact generation displayed rather than to a regeneration. Ursa
  does the opposite: `ursa-major/src/resolve.ts` reconstructs the join
  afterwards by lexical matching, which is why task-001 carries 55
  uncertain spans (KR1.1) and why the loop detector shipped today has
  to reason about themes rather than identities.
- What: for the one path where Ursa does see the generation at emit
  time — a Claude Code `Write`/`MultiEdit`/`Edit` tool call, already
  parsed in `ursa-major/src/parse.ts` — record a receipt per write:
  `{ path, contentSha256, generationIndex, turnIndex, timestamp }`.
  With receipts, the finished file's provenance join starts from the
  last receipt for that path instead of searching every generation, and
  the receipt-to-final diff is the exact mutation with no threshold
  involved. The fuzzy matcher stays, but only for text with no receipt:
  pasted conversations, prose the user moved between files, and
  everything a model produced outside a tool call. This narrows the
  uncertain-span population rather than retuning thresholds against it.
- First step: a `receipts: FileReceipt[]` array on `OutcomeRecord`,
  filled by `parseClaudeSession`, with a test asserting one receipt per
  Write/Edit and the sha matching the generation text. No resolver
  change in the first slice, so the receipt data can be inspected
  before anything depends on it.
- Cost: $0
- Status: proposed

### 2026-09-24 — Near-miss theme diagnostic: let the corpus teach the detector its own synonyms
- Trigger: building the loop detector today. Its themes are lexical, so
  `brightness` and `brighten` are two terms, and a user who says "too
  dark" once and "needs more contrast" the next time opens two themes
  instead of one loop. `docs/design/trace-stage-loops.md` §6 states the
  consequence plainly: `recurrences` is a floor, not an exact count.
  Embeddings would fix it and would also make a theme label
  unexplainable, which `ursa-major/src/match.ts` exists to prevent.
- What: emit the near misses instead of silently dropping them. Any two
  prompts whose shared-term overlap lands between 0.2 and
  `THEME_OVERLAP` (0.34) are candidate members of one theme; list those
  pairs, with their steps and the terms they do share, as a diagnostic
  alongside the signals. The owner reading that list is the cheapest
  possible labelling surface, and the terms she confirms become a
  per-user equivalence table the next run applies before clustering.
  The corpus teaches the detector the user's own vocabulary, and every
  merge stays traceable to a term pair a human confirmed.
- First step: add `themeNearMisses` to the `TraceSignals` return of
  `ursa-major/src/loops.ts` and render it as one more table in
  `ursa-major/src/viewer.ts`. Detection behaviour unchanged in this
  slice; it only becomes visible what the detector nearly merged.
- Cost: $0
- Status: proposed

### 2026-09-24 — `ursa run` cannot see a chat trace, so the loop detector never fires on the product's own entry point
- Trigger: shipping the detector exposed the gap. `ursa run <project>`
  (`ursa-major/src/bin/ursa.ts`) builds every record from git commit
  pairs alone, so `hasChatTrace` is false for all of them and the
  loops, regressions and recurrence counts that shipped today are
  unreachable from the launch the README documents. The trace-stage
  path exists only in `ursa-major/src/cli.ts`, which requires the user
  to name session files by hand with `--sessions`.
- What: have `ursa run` find the sessions itself. Claude Code stores
  every transcript under `~/.claude/projects/<project-slug>/`, where the
  slug is derived from the project's own path, so the launch already
  knows enough to locate the candidates: derive the slug from the
  `<projectPath>` argument, read the transcripts whose generations touch
  files inside the episode's `touchedFiles`, and pass them into the same
  `resolve()` call as the commit pair. One record then carries both the
  commit-pair evidence and the trace evidence, which is also the
  multi-source condition KR1.3 asks for. Nothing leaves the machine:
  this reads a local directory the user already owns.
- First step: a `findSessionsForProject(projectPath): string[]` helper
  with a test over a temporary `~/.claude/projects` layout, returning
  paths only, wired into nothing yet.
- Cost: $0
- Status: proposed

### 2026-09-24 — Competitive scan (engineer's craft scan): LangSmith and the feedback-to-trace join
- `docs/market/landscape.md` does not exist yet (sprint-2026-09-21 item
  4, market seat, not yet run), so this scan used the charter's fallback
  list and picked the product adjacent to today's work.
- Scanned: LangSmith's human-feedback surface — annotation queues,
  `create_annotation_queue()` / `add_runs_to_annotation_queue()` /
  `list_annotations()`, feedback attached to a root or child run — plus
  a current write-up of the join problem itself (oneuptime,
  2026-09-12), which proposes a durable response-to-trace mapping
  written before the answer is returned, an outbox row in the same
  transaction as the feedback event, and a background worker so a
  telemetry outage cannot lose a customer's report.
- Worth stealing: joining at emit time rather than reconstructing the
  join later. That is the ledger entry "Write-time file receipts"
  above, and it is the same insight from the opposite direction:
  LangSmith can do it because its customer owns the application, while
  Ursa's write-time surface is the agent's own tool calls.
- What Ursa does better: their label is a grader's verdict typed into a
  queue ("correct", "hallucinated"), which is an opinion about how an
  answer looks. Ursa's label is whether the text survived into finished
  work, which no one typed and no one can flatter. And LangSmith's
  instrumentation requires owning the app, so it can never see the same
  user across claude.ai, ChatGPT and Gemini; Ursa's cross-model
  comparison is exactly the property that requires no instrumentation
  inside any lab's product.

### 2026-09-25 — Craft scan: Vercel preview deployments, where the visual correction actually happens
- Product scanned: Vercel Preview Deployments and their PR comment
  layer, read against today's `artifact.kind` work.
- Worth stealing: the preview URL is generated per commit and the
  reviewer's feedback is attached to *that* deployment, screenshot
  included. That is a correction stream bound to an exact build, which
  is precisely the join Ursa reconstructs by lexical matching after the
  fact. Two specific things to take. First, per-commit deploy URLs, not
  one production domain: `ursa-major/src/deploy.ts` shipped today finds
  the production URL from `CNAME`, `package.json` `homepage` or
  `vercel.json` `alias`, which is the right answer for "where is this
  live" and the wrong answer for "what did she look at when she asked
  for the change". Second, the observation from the community thread
  on syncing preview comments to GitHub: the comments and screenshots
  are locked in Vercel's own UI and unreachable from CI. Every product
  in this space is accumulating visual corrections into a store its own
  users cannot export. That is the same asymmetry Ursa Major exists to
  invert, and it is worth saying out loud in the Minor pitch.
- What Ursa does better: a Vercel preview comment is an untyped blob
  attached to a deployment. It says a human disliked something. It
  cannot say which characters of the result survived the complaint,
  which generation produced them, or whether the fix held or regressed
  two commits later. `ursa-major/src/resolve.ts` plus
  `ursa-major/src/loops.ts` produce exactly that, and now
  `artifact.renderRef` gives it somewhere to point.
- Sources: https://community.vercel.com/t/sync-vercel-preview-deployment-comments-to-github-pr-for-ai-agent-feedback-loops/31663.md,
  https://vercel.com/docs/deployments/generated-urls

### 2026-09-25 — Per-commit render refs, not one production URL
- Trigger: today's craft scan of Vercel preview deployments, read
  against the `detectDeploy` rules shipped today. A record whose
  `artifact.renderRef` is `https://ursa-minor.example.com` points at
  what the site is now, not at what the owner was looking at when she
  said "still too dark". For a correction loop that spans four commits,
  every record in it gets the same URL, so the URL carries no
  information about the loop.
- What: when the project has per-commit preview deployments, prefer the
  preview URL for that episode's final commit over the production
  domain. Two sources need no new credential and no paid tier: a GitHub
  deployment status on the commit, which `gh api
  repos/{owner}/{repo}/deployments?sha={sha}` returns with its
  `environment_url`, and a Vercel comment or check-run URL on the
  associated pull request. Fall back to the production domain when
  neither exists, which is the behaviour that shipped today. The rule
  stays the same shape: `detectDeploy` already takes a `FileReader`, so
  this is a second detector behind the same `DeployDetection` return
  type rather than a rewrite.
- First step: a `detectPreviewDeploy(projectPath, sha)` in
  `ursa-major/src/deploy.ts` reading `gh api ... /deployments`, used
  ahead of the file-based rules in `artifactFor`, with a test against a
  recorded fixture response rather than a live call.
- Cost: $0. Uses the `gh` CLI the repo already depends on, on the
  user's own existing auth. No new service.
- Status: proposed

### 2026-09-25 — Record how the render ref was found, not just what it is
- Trigger: implementing `detectDeploy` today. It computes exactly the
  field a buyer would want, `evidence` (`CNAME (GitHub Pages custom
  domain)`, `package.json "homepage"`, `vercel.json "alias"`), and then
  throws it away, because the sprint item's field list is `{ kind,
  renderRef? }` and widening an owner-accepted entry's schema is not
  mine to do. Written up in `docs/design/artifact-kind.md` §9.
- What: carry `artifact.renderRefSource?: string` on the record. The
  difference it makes is concrete: a `renderRef` that came from a
  `CNAME` is the domain GitHub Pages is actually serving, while one
  that came from `package.json` `homepage` is a field nobody is
  obliged to keep current and may be years stale. A lab filtering for
  "records where the human demonstrably judged a live page" can trust
  the first and should discount the second. Without the field both look
  identical. The same field also makes the detection auditable without
  re-running it.
- First step: add the optional field to `Artifact` in
  `ursa-major/src/types.ts`, fill it from the `DeployDetection.evidence`
  `artifactFor` already receives and currently discards, and render it
  as the title attribute of the existing viewer chip. One test per
  detection rule asserting the string.
- Cost: $0
- Status: proposed

### 2026-09-25 — Report the corpus by kind, because kind is a thing labs will buy on
- Trigger: adding `artifact.kind` today made an absence obvious. Ursa
  Minor's third named differentiator is "natural task distribution:
  what people actually use AI for, not what a curator picked"
  (CLAUDE.md §4), and until today there was no field that could
  describe that distribution. There still is no place that reports it.
  `ursa-major/src/stats.ts` computes statistics inside one record; the
  question "what fraction of this corpus is work a human judged by eye
  rather than by reading" spans records and nothing answers it.
- What: a corpus-level summary over `<project>/.ursa/records/*.json`
  that reports counts and surviving characters grouped by
  `artifact.kind`, alongside the existing per-record numbers. This is a
  sales artifact and a self-check at the same time. If a corpus turns
  out to be 100% `repo`, that is the honest finding that Ursa is so far
  only measuring one kind of work, and it should be visible rather than
  inferred later by a buyer. It is also the first aggregate Ursa has
  ever computed, so it is the right place to establish that an
  aggregate reports shape and never content.
- First step: `ursa-major/src/corpus.ts` exporting
  `summarizeCorpus(projectPath): { byKind: Record<ArtifactKind, { records: number; survivedChars: number }> }`,
  reading through `loadEpisodes`-style local access only, plus an
  `ursa summary <project>` subcommand printing it. No network, no
  aggregation layer, nothing leaves the machine.
- Cost: $0
- Status: proposed

### 2026-09-25 — Craft scan: Arena (lmarena.ai, now arena.ai)
- Scanned the product surface itself, not the leaderboard press. What is
  there: a Battle mode with an "Auto" routing option, a per-user
  `/history/search` surface, a `/leaderboard` section, and a standing
  disclaimer on the composer that "inputs are processed by third-party
  AI and responses may be inaccurate." The methodology behind the
  ranking was not extractable from the landing surface.
- **Worth stealing: the searchable personal history.** Arena treats
  every battle a user ran as retrievable later, with search as a
  first-class route rather than a scroll. Ursa's viewer has tabs per
  file plus Generations and Sessions, which is fine for the 5-span
  fixture record and unusable for a real one. The alexandria n=2 record
  has thousands of spans and no way to ask "show me every span the user
  rewrote" or "find the prompt where this started." See the navigation
  idea below.
- **What Ursa does better: the label costs the user nothing and cannot
  be gamed by presentation.** An Arena vote is a stated judgment made
  by someone who then walks away, on two answers seen side by side,
  which is exactly the preference-for-how-an-answer-looks proxy
  CLAUDE.md §1 names as the thing labs already have too much of. Ursa's
  label is what the finished work retained. Nobody voted. Second: that
  composer disclaimer is the posture Ursa inverts — raw processing
  happens on the user's device and raw data never reaches the
  aggregation layer.

### 2026-09-25 — Addressable spans: a URL for a finding inside a record
- Trigger: today's sprint item 3 work. The viewer now navigates from a
  span to its generation and to the user's prompt, but none of that
  navigation is addressable. Open `outcome_record.html`, click your way
  to the one span that proves a point, and you cannot hand that state
  to anyone. Combined with the Arena scan above: their history is
  searchable and routable, ours is neither.
- What: give the viewer URL state. A fragment like
  `#f=final.md&s=3` selects file panel `final.md`, span index 3, opens
  the inspector on it, and scrolls it into view on load; clicking a span
  pushes that fragment with `history.replaceState`. Add a filter row
  over the file panel (class, `uncertain`, `trivial`, minimum score) and
  a text search across span text and `conversations[].prompts[].text`,
  with the active filter carried in the same fragment. The payoff is
  citation: a lab conversation, a PR comment, or an owner's ledger entry
  can point at one span of one record instead of describing it.
- First step: fragment read-and-write for the `(file, span)` pair only,
  with a jsdom test that loads the page with a fragment set and asserts
  the inspector opens on the right span.
- Cost: $0
- Status: proposed

### 2026-09-25 — Run the provenance audit inside `ursa run`, not only `npm run resolve`
- Trigger: today's work wired `auditProvenance` into
  `ursa-major/src/cli.ts`, which is the fixture and paste-transcript
  path. The path that actually produced both trials, `ursa run` in
  `ursa-major/src/bin/ursa.ts`, writes its records with no audit at all.
  The command that runs least often is the one that is checked.
- What: call `auditProvenance` on every episode record `ursa run`
  writes, print the one-line summary in the run report, and store the
  result per episode so a record that stopped being navigable is visible
  without opening it. Then decide the policy question deliberately:
  does a broken pointer fail the run, or does it write the record and
  flag it? The git-pair path can legitimately produce sources with no
  eliciting prompt (a commit has no chat turn in front of it), so
  `no_eliciting_prompt` likely needs to be a warning there and an error
  on the chat path, which is a rule the audit does not yet have.
- First step: add an `expectPrompts: boolean` option to
  `auditProvenance`, call it from `resolveEpisode`, and print the
  summary. Do it after PR #16 merges, since both touch `bin/ursa.ts`.
- Cost: $0
- Status: proposed

### 2026-09-25 — Prompt yield: which of the user's asks the model actually answered in surviving form
- Trigger: rendering `conversations[].prompts` into the viewer today
  made it obvious that prompts are the one part of the record that is
  displayed and never scored. Every generation has a survival rate. The
  instruction that caused the generation has nothing.
- What: invert the existing join. For each `UserPrompt`, collect the
  generations it elicited (the rule already exists as
  `elicitingPrompt`), and roll their spans up into a prompt-level yield:
  chars generated, chars that survived verbatim, chars mutated, chars
  deleted. A prompt with high generated volume and near-zero survival is
  an ask the model answered fluently and uselessly, and it is a
  different failure from a prompt that had to be repeated, which is what
  `CorrectionLoop` already captures. This is the artifact grading the
  instruction rather than the output, and it is the natural unit for
  Ursa Minor's commissioned collection: a lab weak in a given kind of
  ask can be sold the prompts whose yield is worst.
- First step: `promptYield(record): Array<{ conversationId, step,
  generatedChars, survivedChars, deletedChars, yieldRate }>` in a new
  module, tested against `fixtures/mini`, where the expected answer is
  hand-checkable: `01-claude` step 0 should show yield 0.632 and
  `02-chatgpt` step 0 should show 1.0.
- Cost: $0
- Status: proposed

### 2026-09-23 — Upstream: Linear board-of-record practice to HQ (WITHDRAWN 2026-09-25, ADR-006)
- Trigger: ADR-005; the owner runs Linear across the portfolio (teams
  already exist for epitome, Alexandria, Atelier, Alexandra Systems)
- What: propose the §1f Linear mechanics as a company standard at HQ,
  replacing or amending ADR-008's GitHub-Projects default
- First step: PM carries this to HQ as a ledger note per §1c
- Cost: $0
- Status: rejected — owner abandoned Linear after one cycle (ADR-006); the repo is the board

- 2026-09-25 (chair): alexandria MCP queried for Minor; four claims with consequences recorded in docs/research/minor-training-fit.md (trace-not-label validated by Harness-Zero; adapters-not-sequential for Major imports). Connector is chair-only.

- 2026-09-25 (chair, owner-present): overlay S0 shipped and verified end to end. `ursa bridge <project>` + https://ursa-overlay.vercel.app (ALEX team; Blob store ursa-overlay-sync, ciphertext only). Verdict reader passed the PR/FAQ acceptance test on the real n=1 record: reads as satisfied at step 730, "yesss finallyyy!! lol", unaided. One deviation from §16.2: the run channel is plain HTTP on 127.0.0.1:7817 instead of a WebSocket (same job, zero dependencies, loopback exempt from mixed-content blocking).

### 2026-09-27 — Provenance by three-way merge, not by lexical similarity
- Trigger: writing `mergeLedgers` in `tools/ledger/ledger.mjs` today. Its
  return value is `{ added, removed, conflicts }` per block, and those are
  the outcome record's span classes under different names: a block taken
  from the other branch is `survived_verbatim`, a block deleted is
  `generated_deleted`, a block edited on both sides is
  `survived_mutated`. The merge knows which is which exactly, from the
  common ancestor, with no similarity threshold anywhere. Meanwhile
  `ursa-major/src/resolve.ts` reconstructs the same classification after
  the fact by lexical matching, which is why task-001 carries 55
  uncertain spans against O1 KR1.1.
- What: for the file-write path, where Ursa does see both the file state
  before a generation and the file state after, classify spans by running
  a three-way merge instead of a diff-and-match. The ancestor is the file
  as it stood before the model's generation, one side is the generation
  the model proposed, the other side is the file as the human left it.
  Every span's class then falls out of the merge algebra rather than out
  of a similarity score, and the uncertain-span count for that path goes
  to zero by construction. Chat-only spans keep the current resolver;
  this is not a replacement, it is an exact path for the cases that admit
  one.
- First step: take one `Write`/`Edit` tool call already parsed by
  `ursa-major/src/parse.ts`, reconstruct its three inputs, run
  `diff3`-style merging over them, and compare the resulting span classes
  against what `resolve.ts` produced for the same spans on
  `fixtures/mini`. Report the disagreement count. That number is the
  whole argument.
- Cost: $0
- Status: proposed

### 2026-09-27 — The ledger wants to be a directory
- Trigger: five open pull requests (#13, #14, #16, #18, #21) were
  unmergeable today, and `git merge-tree` named the same single cause in
  every one: `docs/ideas.md`. The merge driver shipped today fixes the
  merge wherever a clone does the merging, but GitHub's own merge button
  runs without the repository's `.git/config` and will keep reporting the
  conflict.
- What: give each ledger entry its own file, `docs/ideas/YYYY-MM-DD-slug.md`,
  and generate `docs/ideas.md` from them as a read-only index. Two seats
  appending on two branches then add two different files, which no merge
  algorithm on any host can call a conflict. The merge driver stays, since
  it still covers the generated index and any repository that keeps a
  single-file ledger.
- First step: a migration script that splits the current 10 blocks into
  files, an index generator, and a rewrite of `tools/ledger/check.mjs` to
  read the directory. Gate it on the five blocked pull requests merging
  first, because the migration touches the very file they collide on.
- Cost: $0
- Status: proposed

### 2026-09-27 — One-click requeue: a dispatch workflow that drains the blocked queue
- Trigger: §8 of `docs/design/ledger-union-merge.md`. Once any one of the
  five blocked pull requests merges, `main` moves and the other four are
  stale again, so the owner needs `tools/ledger/requeue.sh --push` after
  every single merge, on a laptop with the driver installed.
- What: a `workflow_dispatch`-only workflow that runs `requeue.sh --push`
  on the runner, so draining the queue is a button in the Actions tab
  rather than a local checkout. It writes only to pull request branches
  and never to `main`. Deliberately not built today: a workflow that
  updates other seats' branches is an operating decision about who may
  move whose work, and that belongs to the owner rather than to an
  engineer run that happened to notice the need.
- First step: `.github/workflows/ledger-requeue.yml`, `permissions:
  contents: write`, one `bash tools/ledger/requeue.sh --push` step, with
  a `dry_run` input defaulting to true.
- Cost: $0
- Status: proposed

### 2026-09-27 (engineer) — Competitive scan: mem0, the memory layer with no provenance
Read today: mem0's own documentation at
`docs.mem0.ai/core-concepts/memory-operations`. It is the closest
competitor to Ursa Major's portability claim, so it is the right one to
read carefully rather than dismiss.

**What it does.** Conversations go through an LLM that "pulls out key
facts, decisions, or preferences to remember." Storage is additive: new
memories are added without overwriting or deleting existing ones.
Retrieval ranks the most relevant memories for a query.

**Worth stealing: the `infer=False` switch.** A caller can set
`infer=False` and mem0 stores the raw messages instead of running the
extraction pass at all. That is a single, legible affordance for the
user who wants the record but not the inference, and Ursa has no
equivalent today: `ursa run` always distills. An `ursa run --no-distill`
that produces the outcome record and stops short of the tuning axioms
would serve the same user, and it serves the second load-bearing
constraint in `CLAUDE.md` in its strongest form, which is not "you can
edit what was inferred about you" but "nothing was inferred about you."

**What Ursa does better, confirmed from the documentation rather than
assumed.** The docs describe no way to trace a memory back to the
message that produced it, and no way to check a memory against an
outcome. So a mem0 memory is an LLM's reading of what a user said about
themselves, which is a stated preference with the source discarded. An
Ursa span is joined backward to the specific generation that produced it
and classified by what the finished work did with it. That is the third
principle in the README, tacit intelligence, holding: the preference
shows up in action on a particular case, and mem0's extraction step is
exactly the stated-preference survey the principle warns about. The
additive-only storage model is also weaker than
`ursa-major/src/tuning/merge.ts`, which carries revocation tombstones,
so a revoked preference in Ursa is revoked rather than outranked.

### 2026-09-27 — Blocker: no seat can install a CI gate
- Trigger: today's push was rejected outright — "refusing to allow a
  GitHub App to create or update workflow
  `.github/workflows/ledger-gate.yml` without `workflows` permission" —
  after the run had written two CI workflows it had just demonstrated the
  need for. They shipped as `tools/ledger/ci/*.yml` for the owner to copy
  instead.
- What: the seat workflows grant their tokens `contents: write` and
  `pull-requests: write`, and GitHub gates `.github/workflows/` behind a
  separate `workflows` permission. So an agent seat can change every line
  of the product but cannot add the check that protects it, and every
  guardrail a run concludes is necessary becomes a manual copy step for
  the owner. That is the class of step that quietly never happens. This is
  filed as a blocker because it is invisible until a run wastes turns on
  it, as this one did.
- First step: the owner decides between two options and the answer is
  recorded as an ADR. Either add `workflows: write` to the seat workflows'
  `permissions:` block, which lets any seat run change its own CI, or keep
  the restriction deliberately and adopt `tools/<area>/ci/*.yml` plus a
  line in `docs/sprints/pending.md` as the standing convention for a
  proposed gate, so the copy step is tracked rather than assumed.
- Cost: $0
- Status: urgent

### 2026-09-30 — The union is the thing CI should test, on a schedule
- Trigger: today's stack integration. GitHub computes mergeability one
  branch against `main` at a time, so with 25 pull requests open it
  reported most of them mergeable while the answer to "would these land
  together" was unknown to everyone. Run by hand,
  `tools/stack/integrate.sh` found the union green on 153 tests and a
  passing site build, and found that merge order alone moves the number
  that lands from 9 to 18. None of that was visible from the pull
  request list, and by tomorrow it is stale.
- What: run `tools/stack/integrate.sh --json` on a daily schedule and
  publish the result where the owner and the PM already look. The map is
  worth more than a pass/fail: it names which pull request is worth
  merging first (today, #27, because it unblocks twelve others), which
  conflicts are mechanical, and which belong to a named seat. A seat that
  wakes with no memory could read the latest report instead of
  rediscovering the queue, which is the L-E10 survey done for it before
  it starts.
- First step: a workflow that runs the harness on a cron, uploads the
  JSON and markdown as artifacts, and writes the table into the PM's
  pending file or a comment on the oldest open pull request. Workflow
  changes in this repo go through `docs/agents/pending-workflow-changes.md`,
  so the first step is the proposal there plus the workflow file, not a
  merge.
- Cost: $0. One scheduled run of about six minutes, inside the free
  Actions allowance for a public repository.
- Status: proposed

### 2026-09-30 — The idea ledger should be a directory, not one file
- Trigger: `docs/ideas.md` was the only conflicted file in twelve of the
  sixteen conflicts measured today, and #27's merge driver fixes it only
  for merges a human performs in a clone. A merge driver is named in
  `.gitattributes` but defined in `.git/config`, which is per-clone and
  never committed, so GitHub's own server-side merge cannot use it. The
  consequence is written in #27's own description: after every merge,
  someone re-runs `requeue.sh --push` to make the others mergeable
  again. That loop is not closable on GitHub's side.
- What: every seat charter ends with "append today's new ideas to
  `docs/ideas.md`", so every run adds lines to the end of one file, and
  git reads two appends at the same end of the same file as one
  conflicting hunk. Give each entry its own file,
  `docs/ideas/YYYY-MM-DD-slug.md`, with `docs/ideas.md` becoming a
  generated index. Two seats then add two different files, which is not
  a conflict for git, for GitHub, or for anyone, with no driver, no
  per-clone install, and no requeue loop. The conflict class disappears
  rather than being merged more cleverly.
- First step: this needs charter edits (every seat charter names the file)
  and it touches a surface whose statuses the owner controls, so the
  first step is the owner's decision, not a commit. If accepted: a
  migration script that splits the current file by `^### ` heading, an
  index generator, and the one-line change in each charter, in a single
  pull request so no seat is ever pointed at a file that has moved.
- Cost: $0
- Status: proposed

### 2026-09-30 — Lessons inbox: a substring assertion on generated code is not a test of that code
- Trigger: #16 shipped green with a `SyntaxError` in the viewer script it
  generates, which meant every `outcome_record.html` from that branch
  opened as an empty shell. Its three viewer tests were
  `expect(html).toContain(...)` substring checks, and all three passed
  against a script that could not run, because a substring check never
  parses what it finds. The defect surfaced only when #18, whose test
  executes the script, arrived in the same tree.
- What: propose to the company lessons inbox, for the ExO centralizer to
  generalize and give an identifier: when a function emits a program,
  the test parses the emitted program. That covers JavaScript in a
  `<script>` block, SQL, a generated shell script, or a rendered
  template. The safe form ships with the rule, per L-A14: extract the
  block and compile it without running it, which for JavaScript is
  `expect(() => new Function(src)).not.toThrow()` and is three lines with
  no browser and no new dependency. The generalization worth having is
  wider than escaping, and it is that a test asserting on the *text* of
  an artifact that is really a *program* has chosen the weaker of two
  available checks for no saving.
- First step: append it to the inbox at the bottom of
  `docs/standards/lessons.md` with a title, today's date, and the roles
  it binds, and no `L-` identifier, since only the centralizer issues
  those. That file is a vendored copy this seat does not edit, so the
  append belongs to the centralizer or the chair.
- Cost: $0
- Status: proposed

- 2026-09-30 (engineer, craft scan): GitHub's own merge queue is the incumbent product for the problem this run spent the day on, so it got today's scan. Verified against this repository rather than from memory: `gh api repos/alexandrapaiz/Ursa/rulesets` returns `[]`, `allow_auto_merge` is `false`, and branch protection is not readable by the Actions token, so no queue is configured. Worth stealing, and it is the whole idea of the product: a merge queue tests each candidate against the prospective post-merge state of `main` including everything ahead of it in the queue, never against current `main`. That is exactly the gap measured today, where 25 pull requests each reported mergeable against `main` and nobody knew whether the union built. Where Ursa's harness is better for this repository: the queue needs required status checks and a ruleset before it does anything, it serializes into one CI run per candidate, and its output is a verdict rather than a map. `tools/stack/integrate.sh` answers the whole-union question in one run with zero repository configuration, and it reports which pull request unblocks the most others and which conflicts are mechanical, which is what an owner deciding a merge order actually needs. The honest limit on the comparison: a merge queue prevents the broken union from ever landing, and the harness only tells you about it.

### 2026-09-26 — Briefing receipts: measure whether the HQ changed the work
- Trigger: building `get_briefing` today (ursa-major/src/hq/, plan §15).
  It is the first Ursa surface that hands something to a model and
  records nothing about having done so. The debrief half cannot tell
  whether a rule was in the agent's context when the work was done, so
  "the HQ helps" is currently an assertion with no measurement behind it.
- What: make a briefing a first-class, referenceable object. `ursa brief`
  gains `--receipt <path>`, which writes the exact `Briefing` JSON it
  served plus a content-hash id (`brf-<sha256 first 8>`); `ursa run`
  gains an optional `briefingId` on the record it writes. With both, the
  join is arithmetic rather than opinion: for each rule served, did the
  correction loop it warns about recur in that run or not. Rules served
  and still violated are the ones whose statement is wrong or unreadable;
  rules served and never violated again are the ones that earned their
  place. That number is also the enterprise story Ursa Minor needs,
  because it is direct evidence that consented tuning changes model
  behavior on real work, which no preference-pair vendor can show.
- First step: `--receipt` on `src/hq/cli.ts` writing `Briefing` + hash id,
  and one test asserting the same store and request hash identically
  (the determinism test already proves the byte-stability this needs).
- Cost: $0
- Status: proposed

### 2026-09-26 — Glob-scoped rules, and briefing the files git already knows changed
- Trigger: today's craft scan of Cursor's rules documentation
  (cursor.com/docs/rules.md, fetched 2026-09-26). A Cursor project rule
  carries `globs: src/components/**/*.tsx` in its frontmatter and is
  auto-attached whenever a matching file is in context. Ursa's briefing
  matches paths exactly, so a rule learned on `src/app/page.tsx` does not
  surface for `src/app/about/page.tsx`, and every briefing needs a
  hand-typed `--files` list.
- What: two halves of the same gap. (1) Give each `TuningAxiom` an
  optional `scope` glob the distillation pass proposes and the owner can
  edit, and score a glob match between `fileExact` and `fileByName` in
  `src/hq/retrieval.ts` — a rule that claims a directory is stronger
  evidence than a coincidental file name and weaker than the exact file
  it was paid for. (2) Give `ursa brief` a `--changed` flag that reads
  `git diff --name-only` (and `--staged`) for the file list, so an agent
  about to work in a repository briefs itself with no arguments at all.
  Cursor's own nesting rule is worth copying with it: more specific
  scopes take precedence over general ones rather than replacing them.
- First step: `--changed` on `src/hq/cli.ts`, since it needs no schema
  change and makes the existing ranker usable without typing paths.
- Cost: $0
- Status: proposed

### 2026-09-26 — A user-level HQ under the project one
- Trigger: the same Cursor scan. Cursor ships three rule scopes (Project,
  User, Team); Ursa's store is per-project only (`<project>/.ursa/`, see
  src/store.ts). So a rule learned while building one project cannot
  reach the next one, which is the exact "re-teaching each one who you
  are" problem Ursa Major exists to end — it is currently solved across
  models but not across the user's own projects.
- What: an optional user-level tuning record at `~/.ursa/tuning.json`,
  read alongside the project record at brief time and merged with the
  project record winning any conflict, because a rule the owner proved on
  this codebase outranks one she proved elsewhere. The merge is read-only
  and local: nothing is copied between projects on disk, so a briefing
  stays a read and the user can delete either store independently. The
  rendered briefing labels each rule with the store it came from, so
  "this came from your global tuning, not from this project" is visible
  rather than inferred. Portability of the tuning across projects is the
  same promise as portability across models; the promise is currently
  only half kept.
- First step: `--user-tuning <path>` on `src/hq/cli.ts` (defaulting to
  `~/.ursa/tuning.json` when it exists), a `source: 'project' | 'user'`
  field on `RuleUnit`, and a precedence test where both stores carry a
  rule in the same domain.
- Cost: $0
- Status: proposed

- 2026-09-26 (engineer, craft scan): **Cursor Rules** (cursor.com/docs/rules.md,
  fetched today). Worth stealing: the three-field frontmatter contract
  (`alwaysApply`, `description`, `globs`) that makes *when a rule enters
  context* a declared, readable property of the rule itself, plus nested
  `AGENTS.md` where the deeper directory's instructions combine with, and
  take precedence over, the parent's. Ursa's briefing decides inclusion
  in code today and the rule has no say in it; the two ledger entries
  above are that gap, split into a schema half and a CLI half. What Ursa
  does better: a Cursor rule is hand-written and carries no evidence, so
  nobody can tell which rules ever changed an outcome, which ones went
  stale, or which the author actually enforces. Every rule Ursa serves
  carries an evidence count, a record id, the step ordinals and usually
  the owner's verbatim words, and `revoked` rules are tombstoned rather
  than deleted. Cursor's rules are what the user *says* they want; Ursa's
  are what survived their editing.

- 2026-09-26 (engineer, dogfood): `npx tsx src/bin/ursa.ts run /tmp/ursa-dogfood --limit 5`
  against a clone of this repository found **0 work units and wrote 0
  records**. Second independent confirmation of the 2026-09-20 finding
  ("merge commits are not edits; the PR reader is load-bearing"), now on
  a second repository: where every change arrives as an agent's pull
  request and the owner merges rather than edits, the
  generated-then-edited commit pair barely occurs. Consequence for the
  HQ surface shipped today: Ursa cannot brief its own seats until the PR
  reader lands, because its own store stays empty. That is an argument
  for the PR reader's promotion, not against the briefing.

### 2026-09-26 — The page reads the local channel first, the sync route second
- Trigger: today's engineer run added `GET /payload` to the bridge
  (`ursa-major/src/bridge/index.ts`), closing S0's "serves `.ursa/`
  over the local socket" clause. The page
  (`ursa-major/overlay/app/page.tsx`) still polls
  `/api/sync/<blobId>` every four seconds even when the bridge is
  running on the same machine, so the owner's own data makes a round
  trip through Vercel to travel between two processes on her laptop.
- What: in the page's poll, try `http://127.0.0.1:7817/payload`
  first; if it answers, render it and skip the download and the
  decryption entirely. Fall back to the sync route when the bridge is
  not reachable, which is the second-machine case sync exists for.
  This is most of plan §16.7's S1, and it also means the page works
  with sync switched off, which §16.8 risk 2 names as the mitigation
  it wants.
- First step: a `source: 'bridge' | 'sync'` indicator in the page
  header and a five-line race in the existing `poll` callback.
- Cost: $0
- Status: proposed

### 2026-09-26 — Which records a verdict actually covers
- Trigger: `applyVerdict` (`ursa-major/src/bridge/declare.ts`, shipped
  today) applies a session's verdict to every record in the project,
  because no join exists from a record back to the session that
  produced it. A session spent on the parser while the owner declares
  satisfaction with the viewer will label the parser's records too.
- What: join each record to the session that produced it, using the
  episode's `openedAt`/`closedAt` window against the session log's
  own timestamps and the overlap between the episode's `touchedFiles`
  and the files the session's generations wrote. Records outside the
  session that carried the verdict stay undeclared, which is the
  honest answer rather than the convenient one.
- First step: `sessionWindow(record): {from, to, files}` in
  `src/bridge/declare.ts` plus one test where two episodes exist and
  only the one inside the session's window is declared.
- Cost: $0
- Status: proposed

### 2026-09-26 — The tuning review is itself an outcome record
- Trigger: today's competitive scan (below). Cursor's
  rules-from-chat-history prompt reads its own JSONL transcripts and
  emits `.cursor/rules/*.mdc` for the developer to accept, edit or
  reject as a diff — and records nothing about which way each one
  went. The accept/edit/reject decision is exactly the span
  classification Ursa already has a schema for.
- What: render the distiller's output
  (`ursa-major/src/tuning/distill.ts`) as a reviewable diff, and
  treat the owner's pass over it as a finished artifact in its own
  right: an accepted axiom is `survived_verbatim`, an edited one is
  `survived_mutated` with the edit as the correction, a rejected one
  is `generated_deleted`, and an axiom the owner writes in herself is
  `no_generation_provenance` — the most valuable class, and here it
  means the distiller never saw the thing that mattered most.
- First step: `ursa tuning review --tuning <project>/.ursa/tuning.json`
  writing the review's own outcome record to `.ursa/records/`.
- Cost: $0
- Status: proposed

- 2026-09-26 (engineer, competitive scan): **Cursor's rules-from-chat-history.** Cursor stores agent sessions as JSONL transcripts on disk, and the pattern popularized by Eric Zakariasson in April 2026 points the agent at its own past transcripts to propose `.cursor/rules/*.mdc` and `.cursor/skills/<slug>/SKILL.md` files. The developer reviews a diff, accepts what is useful, and the next chat starts smarter. **Worth stealing:** the review artifact. Cursor hands the user a diff of concrete proposed files rather than a settings screen, and the instruction to accept only rules that "read like a sentence you would have written yourself" is a better acceptance test than any confidence score; Ursa's distiller produces the same kind of object and shows it as a list. **What Ursa does better:** the scan's own source says it plainly — "the prompt does not capture acceptance metrics," and "no feedback loop feeds back into the system." Cursor's user does the labeling work and the label evaporates. Ursa's whole design is that the accept/edit/reject is the signal, and as of today the verdict the user states in chat is written into the record rather than displayed and dropped. That gap is the ledger entry above. Sources: https://aicatchup.com/skills/cursor-rules-from-chat-history, https://forum.cursor.com/t/rules-vs-memories-and-global-vs-project/137149

### 2026-09-27 — Head-and-tail transcript windowing for the verdict reader
- Trigger: corpus case `v16-verdict-past-the-transcript-limit`, written
  and measured this run. `readVerdict` shows the model the first 2000
  characters of each user message (`TRANSCRIPT_CHAR_LIMIT`). A verdict
  written at the end of one long message is never shown to it, so the
  label is unreachable no matter how good the model is. The eval counts
  it as `knownMiss` rather than hiding it, and it is the only
  unreachable case in the corpus today.
- What: window each message head-and-tail instead of head-only, since a
  verdict lands at the end of a message far more often than in the
  middle: roughly 1200 characters of head, a visible elision marker,
  then 800 of tail. The cost is that character offsets stop being
  one-for-one, so `shownText` has to return a segment map (shown
  fragment plus its offset in the original) and the verbatim-span
  recovery in `readVerdict` has to search per segment. That is the
  whole reason it was not folded into this run: the offset identity is
  what makes the current span recovery provably exact.
- First step: change `shownText` to return
  `{ text: string; segments: { at: number; length: number }[] }`, thread
  the segments through the presence check, and flip `v16`'s
  `knownLimitation` off so the corpus gate proves the fix.
- Cost: $0
- Status: proposed

### 2026-09-27 — The `misread?` click is an eval case
- Trigger: two observations that met. First, plan §16.5 gives the
  overlay a `misread?` control beside the verdict line, and it produces
  nothing durable today: it opens the quoted prompt so the owner can see
  why, and her judgement evaporates. Second, today's craft scan of
  Braintrust, whose loudest feature is turning a production failure into
  a test case that runs in CI. Ursa has the better version of that
  available and is not taking it: the owner's correction of a misread is
  a label on the labeller.
- What: when the owner clicks `misread?` and disagrees with the reading,
  the bridge appends the session's prompts, the reading it produced, and
  her correction to a private case file in the same shape as
  `ursa-major/fixtures/verdicts/cases.json`. The corpus then grows from
  real use instead of from someone imagining failure modes, and the
  next engineer run's `falseSatisfied` gate is measured against cases
  the owner herself produced. Redaction rider applies: real prompts stay
  in `alexandrapaiz/ursa-private` and the public corpus cites the case
  by id.
- First step: `appendCase(caseFile, { prompts, got, correction })` in
  `ursa-major/src/evals/verdict.ts`, plus a `POST /misread` route on the
  bridge's existing 127.0.0.1 listener next to `/run`.
- Cost: $0
- Status: proposed

### 2026-09-27 — The span classifier needs the same gate the verdict reader just got
- Trigger: writing the verdict eval made the asymmetry obvious. The
  verdict reader now has 16 labelled cases and a gate that fails on a
  single fabricated label. The span classifier, which produces the
  four classifications that ARE the commercial object
  (`survived_verbatim`, `survived_mutated`, `generated_deleted`,
  `no_generation_provenance`; CLAUDE.md §1), has 12 resolver tests and
  no labelled corpus and no gate. The most valuable class,
  `no_generation_provenance`, is also the one a matching bug inflates
  most quietly: every generation the matcher fails to find turns into
  evidence that the model was never in the running.
- What: `fixtures/spans/cases.json` on the same schema idea as the
  verdict corpus, each case a small final artifact plus its generations
  plus the hand-labelled classification of every span, and
  `src/evals/spans.ts` reporting a confusion matrix across the four
  classes. The gate is the mirror of `falseSatisfied`: zero spans
  labelled `no_generation_provenance` by the resolver that a human
  labelled as having a generation behind them, because that error sells
  a lab a claim about model absence that is not true.
- First step: three cases by hand from `fixtures/mini`, whose final.md
  and two conversations are already public, labelled span by span.
- Cost: $0
- Status: proposed

## Competitive scan — 2026-09-27 (engineer, craft scan)

Scanned **Braintrust** (braintrust.dev), an LLM evaluation and agent
observability platform. Deviation from the charter's fallback rotation
worth naming: that list is inherited from alexandria and names research
tools (Elicit, Consensus, Exa, arXiv digests). `docs/market/landscape.md`
does not exist on `main` yet, so there is no Ursa rotation to follow;
an eval platform is the honest adjacency for a day spent building an
eval harness, and it is the category the market seat's landscape draft
(PR #21) should own.

**One thing worth stealing.** Braintrust's headline loop is production
failure to test case: a trace that went wrong in production becomes a
dataset row that runs in CI forever after. Ursa has a better version of
that available and is not taking it, because its correction signal is
already a click the owner makes for her own reasons rather than a
curation chore. Filed above as "The `misread?` click is an eval case."
Their datasets also carry optional expected outputs per row, which is
the same shape as this run's `truth` field; the convergence is a small
piece of evidence that the corpus schema is not eccentric.

**One thing Ursa does better.** Braintrust's label comes from a grader:
an LLM-as-a-judge, a code scorer, or a human reviewer, applied to the
output after the fact. That is exactly the preference proxy
CLAUDE.md §1 says Ursa is not selling. Ursa's label is supplied by the
artifact, because the finished work either used the generation or threw
it away, and the verdict reader does not ask anyone to grade anything.
It reads a verdict the user already gave for her own reasons, then
refuses it unless her words are literally in the trace. Braintrust needs
a grader per dataset and inherits that grader's taste. Ursa needs none,
which is the whole reason its signal is worth buying.

### 2026-09-28 — Craft scan: Obsidian Sync, and the audit as the trust proof

Today's one product, chosen because it ships the exact surface I touched:
client-side encrypted sync of a local vault to a paid server, with no
account recovery, which is Ursa's overlay §16.4 with a different payload.

**Worth stealing: the audit is the artifact they publish, not the
architecture.** Obsidian has two independent third-party audits of Sync
specifically — Cure53 and Trail of Bits, both scoped to the Sync API,
server, and cryptography — released together on 2026-05-13 with every
finding remediated and the remediations validated by the auditor who
found them (https://obsidian.md/blog/cure53-tob-sync-audits/). They sit
on a permanent Security page, not in a blog post that scrolls away. Ursa
says in its own BMC that publishing methodology is simultaneously the
enterprise sales channel and the user trust proof; Obsidian is the
worked example of what that looks like when the thing published is
adversarial and paid for. What Ursa has today is a self-audit by its own
security seat, which is a real artifact and not the same kind of claim.

One finding in the Trail of Bits report reads directly onto Ursa's sync
route: **TOB-OBSYNC-10, "general lack of cryptographic binding between
file content and metadata."** Their case is that the server can read
which device uploaded a file and when, because it needs that to route
changes. Ursa's case is narrower and different, and it is a real gap —
see the first entry below, which this finding is the trigger for.

**Where Ursa is already ahead:** Obsidian's server holds per-user
accounts and the path-to-content mapping, because Sync has to merge
concurrent edits from several devices. Ursa's sync route holds no
account, no user row, and after today no stored secret of any kind: the
blob's name is the hash of its write capability, so the route can refuse
a stranger's write while knowing nothing about who the writer is. That
is a strictly smaller trusted surface, and it is available to Ursa only
because the overlay syncs one writer's derived state rather than merging
many writers' edits. Worth saying out loud before anyone proposes
multi-device write.

### 2026-09-28 — A stale ciphertext replayed is a verdict rolled back
- Trigger: Trail of Bits finding TOB-OBSYNC-10 in today's craft scan,
  read against the sync route I changed this run. Ursa's version of
  "content not bound to metadata" is narrower than Obsidian's and it is
  live: `OverlayPayload` (ursa-major/src/bridge/index.ts) carries
  `updatedAt` but nothing that binds a payload to the blob it was
  written for, and nothing monotonic. AES-256-GCM authenticates that a
  blob was produced by the key holder; it says nothing about *when*.
- What: anyone who can write to a blob can also re-write an older
  ciphertext to it, and the page will decrypt it happily, because it is
  genuinely authentic — just stale. The overlay would then show a
  verdict the user has since moved past, at a lower `userTurns`, with no
  signal that it went backwards. Two callers can do this: a network
  position that captured an earlier `PUT` body and now holds the write
  secret from a later one, and the sync server itself, which sees every
  version and is explicitly not trusted for anything but storage. The
  blast radius is a wrong reading on a 380 px window rather than a
  corrupted record, which is why this is a ledger entry and not a
  same-run fix. It matters anyway, for the reason the verdict reader
  exists at all: acceptance is the one label Ursa refuses to infer, and
  a silently rolled-back verdict is an inferred one.
- First step: add `sequence: number` to `OverlayPayload`, incremented
  per push and held in `startBridge`'s closure alongside
  `lastPushedHash`, plus `blobId` inside the plaintext so a payload
  names the blob it belongs to. The page refuses a payload whose
  `sequence` is below the highest it has seen this session, or whose
  `blobId` is not the one it polled, and says "sync went backwards"
  rather than rendering it. Both fields are inside the AEAD, so neither
  is forgeable and no server change is needed.
- Cost: $0
- Status: proposed

### 2026-09-28 — The record has no state for "delivered, awaiting a verdict"
- Trigger: this run's own standup observation. Seven engineer pull
  requests are open on this repository and none has merged: #13, #16,
  #18, #22, #24, #25, #27, the oldest four days old. Ursa's own repo is
  now the largest corpus it has, and its dominant state is one the
  outcome record cannot express.
- What: every span classification in CLAUDE.md §1 assumes the finished
  work exists to join backward from. `survived_verbatim`,
  `survived_mutated`, `generated_deleted`, and
  `no_generation_provenance` are all readings of a thing that got
  finished. A branch that was pushed, passed CI, and then waited is
  none of them. The pair finder sees no edit, so it emits nothing; the
  verdict reader reads chat, and there is no chat, because the owner's
  decision is a merge or a close and she never said a word. Treating
  that as `generated_deleted` would be a lie about a rejection that
  never happened, and treating it as survival would be worse, since
  `survived_*` is the label labs pay for. This is exactly the gap the
  2026-09-20 ledger finding ("merge commits are not edits; the PR
  reader is load-bearing") points at from the other side: that entry
  says the corrections live in the PR, and this one says the *absence*
  of a decision also lives there and is currently invisible.
- First step: add `pending` to whatever enum the resolver uses for a
  work unit's disposition, and have the PR reader emit a record with
  every span classified `awaiting_verdict` plus a `pendingSince`
  timestamp, for any branch that is pushed and unmerged. Then the
  trajectory metadata CLAUDE.md §1 already names — "whether the thing
  was finished or abandoned" — has a third honest answer, and a stalled
  queue becomes a measurement instead of a silence.
- Cost: $0
- Status: proposed

### 2026-09-28 — Commission a third-party audit of the overlay's crypto
- Trigger: today's craft scan. Obsidian publishes two independent audits
  of Sync's cryptography, and that is the artifact users and enterprise
  buyers are actually shown. Ursa now has a self-audit of the same class
  of surface (docs/security/audit-2026-09-27.md) plus, as of this run, a
  design artifact for the write capability. Neither is adversarial and
  neither was paid for.
- What: scope one external review to exactly the overlay's crypto and
  sync path — `ursa-major/src/bridge/crypto.ts`,
  `ursa-major/overlay/lib/crypto.ts`,
  `ursa-major/overlay/lib/write-capability.ts`, and
  `ursa-major/overlay/app/api/sync/[key]/route.ts`, 303 lines including
  comments — rather than the whole product. Publish it whole, findings and
  remediations both, the way Obsidian did. The argument for spending
  here rather than elsewhere is the BMC's own: Ursa's primary asset is
  consent that compounds daily and can be destroyed in a week, the
  labs-side sale is underwritten by the same privacy architecture, and
  "we audited ourselves" is the weakest possible version of that claim
  in front of a frontier lab's security review.
- First step: not an action. This costs money, so it is a proposal for
  the owner under the engineer charter's cost boundary, and the first
  step is her verdict on whether a scoped crypto review is worth buying
  before the overlay has a second user. If yes, the day-sized unit is a
  scope document naming those four files, the threat model already
  written in docs/design/sync-write-capability.md §1 and §9, and the
  three residuals it does not close.
- Cost: not $0, and deliberately unpriced here. No vendor was contacted,
  no account was created, and nothing about either firm's minimum
  engagement was checked, so quoting a figure would be inventing one.
  Getting a quote is itself the owner's call under the charter's cost
  boundary.
- Status: proposed

### 2026-09-28 — Tuning units carry a use ledger, so a dead rule is visible
- Trigger: today's craft scan of CodeRabbit's "learnings" feature
  (docs.coderabbit.ai/guides/learnings, read 2026-09-28). Its dashboard
  at app.coderabbit.ai/learnings lists every stored learning in a
  sortable table with usage metrics, a creation date and a last-used
  timestamp. Ursa's own `tuning.md` export
  (`ursa-major/src/tuning/export.ts`) renders units with their evidence
  and nothing about whether any unit has ever done anything.
- What: give each `TuningUnit` a use ledger: the count of exports it
  appeared in, the last export that carried it, and, once the overlay can
  observe it, the count of records where the behaviour it asks for was
  already present before correction. Render the three columns in
  `tuning.md` and in the overlay. This is the cheapest possible
  revocation surface, because the unit a user wants to delete first is
  the one that has never been used, and constraint 2 of the vision (see,
  edit, revoke, delete) is currently satisfied only in the sense that the
  file is editable by hand.
- First step: add `use: { exports: number; lastExportAt: string | null }`
  to `TuningUnit` in `ursa-major/src/tuning/types.ts`, increment it in
  `export.ts`, merge it in `merge.ts` under the existing deterministic
  merge rules, and render it as a column. One test that two exports leave
  `exports: 2`.
- Cost: $0
- Status: proposed

### 2026-09-28 — Rank paths by unprovenanced share, because that is where the agent is never in the running
- Trigger: the first real records the PR adapter produced today. In
  `.ursa/records/ursa-pr7-8d3e420.json`, over
  `docs/agents/org-chart.md`, 57.8 percent of the covered final text is
  `no_generation_provenance`: 58 spans and 3,542 characters the owner
  wrote that no generation produced. That is the category CLAUDE.md calls
  the most valuable one, and no command surfaces it. `renderRunSummary`
  in `ursa-major/src/bin/ursa.ts` leads with what survived.
- What: report, per path, the share of final text with no generation
  provenance, ranked highest first, across all records in a run. A path
  at the top of that list is a file where the model is not competitive
  at all, which is a sharper instruction to a lab than any survival
  percentage. It is also the honest answer to "where is this agent
  useless", which is the question a user trusts a tool for answering
  about itself.
- First step: a `ursa paths <project>` subcommand that reads
  `<project>/.ursa/records/*.json`, sums `perFile` by path across
  records, and prints path, covered characters, and unprovenanced share
  sorted descending. Read-only, no schema change, one test over the
  records the PR adapter writes for a synthetic repository.
- Cost: $0
- Status: proposed

### 2026-09-28 — Teach the local M0 path the merge-resolution closure
- Trigger: building the PR adapter today. Before writing it, a scan of
  every merge commit in this repository compared each path's blob at the
  merge against the same path in both parents: 10 merges, 1 carrying
  content present in neither parent (`docs/sprints/pending.md` at
  045c3b0). `ursa-major/src/pairfinder.ts` skips all merges as pairing
  targets, correctly, because a merge brings in another author's work.
  But the content a human writes while resolving a conflict is in no
  parent, and it is a correction. The PR adapter now reads that case
  (`merge-resolution`, `ursa-major/src/adapters/github-pr.ts`); the
  local path still cannot, so `ursa run` over a repo with no GitHub
  access misses it.
- What: add the same closure to `findCommitPairs`: for each merge
  commit, pair the merged-in agent commit with the merge for any path
  whose blob differs from that path's blob in every parent. This needs no
  network and no `gh`, so it works on a private clone and on a repo that
  was never on GitHub. Keep the existing rule that a merge is not an
  edit, since this is narrower: not the merge's whole diff, only the
  paths in no parent.
- First step: lift `resolvedPaths` out of
  `ursa-major/src/adapters/github-pr.ts` into a shared helper, call it
  from `findCommitPairs`, and reuse the synthetic conflict repository
  from `ursa-major/src/adapters/github-pr.test.ts` as the test. Note the
  file contention: `pairfinder.ts` is also edited by PR #16, so this
  waits for that merge.
- Cost: $0
- Status: proposed

### 2026-09-28 — URGENT: the merge queue now costs the engineer seat working surface, measurably
- Trigger: today's run. Every engineer item on sprint-2026-09-21 already
  has an open pull request from an earlier run of this seat (item 1 is
  PR #13, item 2 is PR #16, item 3 is PR #18), so none of them could be
  worked without duplicating unmerged work. 18 pull requests are open,
  and between them they hold 7 of `ursa-major/src`'s most central files:
  `types.ts`, `pairfinder.ts`, `resolve.ts`, `viewer.ts`, `cli.ts`,
  `bin/ursa.ts`, `store.ts`, plus `README.md` and `package.json`. The PR
  adapter shipped today was routed entirely around that set, which is why
  it ships its own `src/adapters/cli.ts` instead of an `ursa pr`
  subcommand, and why the README module table still does not mention it.
- What: this is not a request for a different plan, it is the cost
  reading the PM's standup cannot see from PR counts alone. Two
  consequences worth a decision. First, each additional day of queue
  depth pushes the engineer further into greenfield modules and away from
  the sprint, because greenfield is the only conflict-free surface left.
  Second, the deferred integrations (README rows, `ursa pr`, the
  `pairfinder.ts` merge-resolution closure above) are now a growing debt
  that only merging can discharge.
- First step: the owner's merge, in any order that suits her. PR #27
  installs a union merge driver for `docs/ideas.md`, so merging it first
  makes the rest of the queue cheaper.
- Cost: $0
- Status: urgent

- 2026-09-28 (engineer craft scan): CodeRabbit's learnings
  (docs.coderabbit.ai/guides/learnings, read 2026-09-28). Worth
  stealing: the acknowledgement is in band and immediate. When a reply
  to a review comment becomes a learning, the bot answers in the same
  thread with a "Learnings Added" section naming what it took, and the
  dashboard then shows each learning's creation date, last-used
  timestamp and usage count. Ursa's plan §14 wants exactly this
  encouragement loop and today has no moment where a user is told what
  was just learned from them. What Ursa does better: the unit itself.
  CodeRabbit learns from what a user states to the bot, and stores it in
  CodeRabbit's own database scoped to a Git platform organization. Ursa
  learns from what the user did to the work, keeps it on the user's
  machine, and hands it back as a file the user owns. A stated
  preference is the failure mode vision.md names in principle 3: much of
  what people know shows up only in action.

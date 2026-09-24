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
- Status: accepted (owner-directed 2026-09-18)

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

### 2026-09-23 — Upstream: Linear board-of-record practice to HQ
- Trigger: ADR-005; the owner runs Linear across the portfolio (teams
  already exist for epitome, Alexandria, Atelier, Alexandra Systems)
- What: propose the §1f Linear mechanics as a company standard at HQ,
  replacing or amending ADR-008's GitHub-Projects default
- First step: PM carries this to HQ as a ledger note per §1c
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

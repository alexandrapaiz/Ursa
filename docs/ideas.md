# The Ledger — Ursa

Contract in docs/standards/pm.md §4.

## Operational note — 2026-10-06 (message dispatch): two check-ins rebased in order

Not a ledger entry; recorded here because docs/ideas.md plus dated notes
is this seat's writable surface and the action touches no OKR content
directly.

PM's handoff (board message, 2026-10-06) reported that this seat's two
open October check-ins, PR #63 (`okr/2026-10`, the monthly reading) and
PR #88 (`ursa-okr/2026-10-05-window`, the window reading), both
conflicted against `main` and conflicted with each other over the same
`docs/okrs/2026-q4.md` "## Check-ins" anchor, and that PR #88's own body
says it builds on PR #63 rather than replacing it. PM declined to
resolve the two check-ins into one section itself, correctly: that is a
judgment call about this seat's own data, not PM's to make.

Verified against the repo rather than taking the report on faith: PR
#54 (the September check-in) had merged earlier the same day. PR #63's
branch was 2 commits ahead of a now-stale point in `main`'s history. PR
#88's branch was cut from a later point but did not contain PR #63's
commits at all, despite its own body's "builds on" claim, so the two
check-ins were not actually stacked.

Rebased `okr/2026-10` onto `main` first (two trivial content conflicts
in `docs/okrs/2026-q4.md`, both resolved by keeping both sides of the
same append point in sequence, no wording changed), force-pushed. Then
rebased `ursa-okr/2026-10-05-window` onto the updated `okr/2026-10`
(same resolution pattern), force-pushed. Both PRs now report
`MERGEABLE` against `main` and stack in the order PM named: monthly
first, window second. Neither check-in's text was edited beyond
resolving the mechanical append conflict; no objective or KR wording
changed, and no new benchmark or KR scoring ceremony ran this pass. This
run's own PR adds no third check-in, since three OKR readings in six
days is the exact pattern PR #88 already flagged to the owner as a
possible sign this seat should pause until the merge backlog clears.

## Grooming (2026-10-05, ceremony run 2026-10-06)

Two `accepted` entries below (not reproduced here, see their dated
sections) appear substantially shipped, checked directly against
`main` this run:

- **"Finished work is not only chat"** (2026-09-20) — `artifact.kind`
  and `artifact.renderRef` both exist on `OutcomeRecord`
  (`ursa-major/src/types.ts`), and `ursa run` fills `kind: 'repo'`
  per the entry's own first step. The PM does not change statuses it
  does not own (pm.md §4); flagging so the engineer seat moves this
  to `built` on its next run, same as the tuning-pipeline note below
  did on 2026-09-27.
- **"Agentic-forward: Ursa as the agents' HQ"** (2026-09-19) — the
  split first step, (a) `get_briefing`'s interface, is built and
  tested (`ursa-major/src/hq/briefing.ts`, `hq.test.ts`, `hq/README.md`).
  Sub-step (c), semantic `nearestCases` ranking, also shipped
  (`engineer/2026-09-29-semantic-nearest-cases`, merged). Only (d),
  dogfooding against one of Ursa's own seats, is unverified from the
  repo alone. Flagging for the same reason as above.

**Awaiting your verdict** (pm.md §4, two weeks with no ruling): three
`proposed` entries, oldest first — repo split (2026-09-18, 18 days),
tuning packs (2026-09-19, 17 days), the merge-commits/PR-reader
finding (2026-09-20, 16 days). Unchanged from every grooming pass
since 2026-09-24; no entry has newly crossed the two-week line this
run (the next-oldest `proposed` entry is 2026-10-04, 2 days old).

No entries marked stale or superseded this run. Ordering `accepted`
entries by leverage is moot this pass — both `accepted` entries are
flagged above as effectively done, and no new entry was promoted to
`accepted` (only the owner moves that status).

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

### 2026-09-29 — Nothing on a pull request checks whether the code builds or the tests pass
- Trigger: today's break-fix run. Fixing the critical `next` advisory meant
  changing three lockfiles, and verifying it meant running `npm test`,
  `npx tsc --noEmit`, `npm run lint`, two `next build` invocations and a
  live `curl` against the served site entirely by hand. The reason it had
  to be by hand is that `.github/workflows/redaction-gate.yml` is the only
  gate that runs on a pull request, and it scans for private filesystem
  paths and session identifiers. There is no build gate and no test gate.
  Twenty pull requests are open right now, and not one of them has been
  checked against anything except redaction. That is also why the critical
  advisory survived being found on 2026-09-27 and routed to a seat: no
  mechanism could tell that it had not been acted on.
- What: one workflow that runs, on every pull request, the checks this
  repository already has and nobody is required to run: `npm test` and
  `tsc --noEmit` in `ursa-major` (36 tests today), `npm run build` in
  `ursa-minor` and in `ursa-major/overlay`, `npm run lint` in `ursa-minor`,
  and `node scripts/dep-floor.mjs` at the root. All of it exists. None of
  it is enforced. The work is not writing checks, it is installing the one
  file that runs them.
- First step: this is blocked on an owner action, not on engineering. No
  agent seat's token can write into `.github/workflows/`, verified today by
  attempting the push and being refused: "refusing to allow a GitHub App to
  create or update workflow ... without `workflows` permission". The
  dependency-floor half of this is already written and parked as a complete,
  copyable file at `docs/design/dep-floor.workflow.yml`; the build-and-test
  half should be parked the same way next to it, and the owner installs both
  with two `cp` commands.
- Cost: $0. GitHub Actions minutes on a public repository are free.
- Status: urgent

### 2026-09-29 — Serve the user's tuning over MCP instead of asking them to paste it
- Trigger: today's competitive scan of Mem0's OpenMemory (see the scan note
  below). It reaches Claude Desktop, Cursor, VS Code and Windsurf without
  any of them integrating it, by being a Model Context Protocol server
  rather than an export format. Ursa Major's portability story currently
  terminates in a portable context block the user copies and pastes, per
  `docs/design/tuning-pipeline.md` and `ursa-major/src/tuning/export.ts`.
  Paste is a step the user has to remember on every new model, which is the
  exact friction the product exists to remove: "from the first message on
  any AI, it already knows how you like to be answered" (CLAUDE.md §3).
- What: an MCP server in `ursa-major/src/tuning/` that serves the user's
  own `tuning.json` as MCP resources and one tool, reading the same local
  file `export.ts` already reads. Every property that makes Ursa Major
  trustworthy survives unchanged, because the server is local and the file
  is the user's: it is inspectable because they can open it, editable
  because they can edit it, revocable because the existing revocation
  tombstones still apply, and deletable because deleting the file is the
  whole deletion. Nothing leaves the machine, so this touches consent
  architecture not at all, which is why it is cheap.
- First step: a read-only MCP server over stdio exposing one resource,
  `ursa://tuning/current`, returning the exported context block `export.ts`
  already produces. Prove it by adding it to one MCP client's config and
  confirming the axioms arrive in the model's context on a fresh
  conversation with no paste.
- Cost: $0. Local process, no service, no account.
- Status: proposed

### 2026-09-29 — Accepted risks and unreviewed work should expire, not accumulate
- Trigger: building `dep-floor.allow.json` today. Its one interesting
  property is that every accepted risk carries an `expires` date and an
  expired exception fails the gate with its own message instead of quietly
  continuing to suppress, so a decision made on one Tuesday comes back and
  asks again. Then the same run observed what this repository looks like
  without that property anywhere else. Three ledger entries have sat at
  `proposed` with no verdict for eight, seven and six days
  (`docs/sprints/pending.md`). Pull request #13 has been open since
  2026-09-24. Twenty pull requests are open and zero carry a review or a
  comment. Every one of those is an accepted risk with no expiry: it does
  not fail anything, so nothing ever asks again.
- What: give the two queues the ledger already tracks the clock the
  allowlist has. A `proposed` entry with no verdict past N days and an open
  pull request past N days both become something a mechanism reports rather
  than something a reader has to notice. `docs/sprints/pending.md` already
  counts the days by hand every PM run, which is the tell: the number is
  known, it just has no consequence attached. Concretely, extend the gate
  pattern rather than inventing a second one — a script that reads
  `docs/ideas.md` statuses and `gh pr list --json createdAt`, and reports
  over-age items with the same annotation shape `dep-floor.mjs` uses.
- First step: `scripts/queue-age.mjs`, reporting only, exit 0 always, so
  the thresholds can be argued about from real numbers before anything
  blocks on them. The PM standard owns what N is; this is not the
  engineer's call to make, and the script should read it from a config
  rather than hardcode it.
- Cost: $0
- Status: proposed

## Competitive scan — 2026-09-29 (engineer's craft scan)

**Product: Mem0's OpenMemory.** A local-first memory layer for AI tools.
Memory is stored on the user's machine, with a dashboard for browsing and
managing what has been saved, plus a hosted option for people who do not
want the setup. It captures what the company calls durable signals:
preferences, goals, past decisions, and feedback, retrieved when the person
returns. The explicit positioning is that context survives a model change
or a provider switch, which is the same sentence Ursa Major uses.

**Worth stealing: the Model Context Protocol is the distribution, not the
integration.** OpenMemory reaches Claude Desktop, Cursor, VS Code and
Windsurf without any of those products building anything for it, because it
speaks MCP and they are MCP clients. Ursa Major's portability currently ends
at a context block the user pastes. Same payload, one less thing for the
user to remember, and it costs nothing because the server is local and reads
a file that already exists. Filed above as its own entry.

**What Ursa does better: the signal is revealed, not stated.** Everything in
that list of durable signals is a self-report. A preference, a goal, a piece
of feedback: the user said it, and the memory layer stored what was said. A
dashboard of stored memories can show you what it remembered. It structurally
cannot tell you whether any of it was ever acted on, because it never joins
back to a finished piece of work. Ursa's artifact is the join. That is what
makes `survived_mutated` mean something a stored preference cannot, and it is
the only reason `no_generation_provenance` can exist at all: a span present in
the finished work that no generation produced is a statement about the model
that no amount of asking the user would ever surface. This is also the honest
limit of the comparison. Mem0 is solving retrieval, and it is further along at
that than Ursa is. Ursa is solving measurement, which is the part labs cannot
buy elsewhere.

Sources: https://mem0.ai/guide/how-to-build-portable-ai-agent-memory,
https://github.com/mem0ai/mem0

### 2026-09-29 — Retrieve wide, then let the distiller pick: a two-stage case funnel
- Trigger: today's craft scan of Continue's `@Codebase` retrieval, which
  retrieves `nRetrieve: 25` candidates from the vector index and then
  reranks down to `nFinal: 5` with an LLM call. Ursa's briefing does one
  pass: score every case, drop everything under `MIN_RELEVANCE` (2), take
  the top `maxCases` (3). Measured today, that floor is doing real work
  and also real damage — on the request `transitions
  src/components/Banner.tsx` the contrast loop scored 0.92 and was
  dropped, correctly; but a case one hundredth of a point under the floor
  is equally invisible, and nothing about the score's absolute value says
  which of those two it was.
- What: split case retrieval into a wide cheap stage and a narrow
  expensive one, the way Continue does, but with the reranker Ursa
  already has on the user's machine instead of a new dependency.
  Stage one: cosine plus the lexical terms, floor removed, take the top
  ten. Stage two: one `claude -p` call, the same local subscription path
  `src/tuning/distill.ts` already uses, handed the ten cases and the
  agent's actual request, returning at most three with one sentence each
  on why this case bears on this task. The model never invents a case and
  never ranks by its own taste: it selects from a fixed candidate list
  and its output is checked against that list, which is the same
  code-owns-the-arithmetic, model-owns-the-judgment division
  `tuning/types.ts` already states.
- First step: `rankSemantic` already returns every case with its score,
  so stage one is a parameter, not a rewrite. Add
  `--rerank` to `ursa brief`, a `rerankCases(candidates, request)` in a
  new `src/hq/rerank.ts` behind the same null-degrades seam
  `loadMiniLM` uses, and one test that the reranker's output is a subset
  of its input.
- Cost: $0 (the owner's existing local claude CLI, one call per briefing,
  only under an opt-in flag)
- Status: proposed

### 2026-09-29 — A briefing that returns nothing is the most valuable thing the HQ measures
- Trigger: verified today. `ursa brief --semantic --domain
  database-migrations --files scripts/migrate.sql` against the fixture
  store returns zero rules and zero cases, correctly: every case sits at
  or below cosine 0.027 and the floor holds. That silence is printed to
  stdout and then discarded. Nothing records that the question was asked.
- What: the coverage gap is the same object as
  `no_generation_provenance`, one level up. That span class is the
  ledger's most valuable category because it marks where the model was
  never in the running; a briefing miss marks where the owner's tuning
  has never been in the running. Every `--domain X` that returns nothing
  is a domain this person works in and has never been corrected on, which
  is exactly the shape of the "commissioned signal collection" CLAUDE.md
  §4 sells to labs: a lab that knows it is weak somewhere pays for
  outcome records concentrated there, and a population of briefing misses
  is a map of where records do not yet exist. It is also directly useful
  to the user with nothing aggregated at all: "you have been briefed on
  motion eleven times and on database work never" is a true statement
  about their own store.
- What it must not become: a second ambient-collection surface. The log
  is local, it records the request (domain, file paths) and the counts
  returned, never the briefing's contents, and it obeys the same
  inspect/edit/delete rule as everything else in `.ursa/`. Nothing about
  it syncs without the consent path plan §12 already specifies.
- First step: append one line per briefing to
  `<project>/.ursa/briefing-log.jsonl` — `{ at, domain, files,
  rulesReturned, casesReturned, retrieval }` — and a
  `ursa brief --gaps` that reads it back and lists the domains most often
  asked about with nothing to say. Roughly a day, entirely local, no
  schema change to any record.
- Cost: $0
- Status: proposed

### 2026-09-29 — 825MB of runtime for 23MB of model: pin ONNX to the host platform
- Trigger: measured today while adding the embedding runtime.
  measured from the committed lockfile, `npm ci` gives **825MB** of
  `node_modules` against **61MB** for `npm ci --omit=optional`. The
  764MB difference is almost all prebuilt ONNX binaries for every
  platform and accelerator — `onnxruntime-node` alone is 548MB — on a
  machine that will only ever use one of them. The model those binaries
  run is 23MB. Plan §13 distributes this CLI as
  `npx @ursa-major/cli run <project>`, so the ratio is a user-facing
  install cost, not a build-time detail. It is why the dependency went in
  as `optionalDependencies` today rather than as a dependency, which
  solves it only for people who know to pass `--omit=optional`.
- What: get the ratio down so semantic briefing can eventually be on by
  default instead of behind a flag. Three routes, cheapest first:
  `npm_config_onnxruntime_node_install_cuda=skip` and the equivalent
  platform filters at install time; `onnxruntime-common` plus a single
  explicitly-chosen backend rather than the meta-package; or dropping to
  a WASM-only build, which is one file and costs some inference speed
  Ursa does not need at tens of cases. Also worth measuring: whether a
  fixed 384-dimension MiniLM even needs a general ONNX runtime, since the
  alternative is ~200 lines of matrix multiply over the same weights and
  no native dependency at all.
- First step: install with each of the three routes, record the resulting
  `du -sh node_modules` and whether `semantic.live.test.ts` still passes,
  and put the table in `docs/design/semantic-retrieval.md` §10. That is a
  measurement, not a refactor, and it decides the rest.
- Cost: $0
- Status: proposed

- 2026-09-29 (engineer, craft scan): **Continue's `@Codebase` retrieval**
  (docs.continue.dev/reference/deprecated-codebase, fetched today).
  Worth stealing, and taken as a ledger entry above: the two-stage
  funnel, `nRetrieve: 25` candidates from the vector index reranked by an
  LLM down to `nFinal: 5`, which separates "cheap and wide" from
  "expensive and narrow" instead of making one threshold do both jobs.
  Convergent validation worth naming too: Continue computes its
  embeddings locally with `transformers.js` and stores them in
  `~/.continue/index`, which is the same library and the same
  on-the-user's-machine shape this PR arrived at independently, and its
  retrieval is explicitly "a combination of embeddings-based retrieval
  and keyword search" rather than embeddings alone — the same blend-do
  not-replace conclusion, reached by a team with far more retrieval
  mileage. What Ursa does better: Continue retrieves **code that looks
  like your query**, so its answer is "here is a similar function." Ursa
  retrieves **corrections**, so its answer is "here is what this owner
  already made an agent redo three times on a file like this one, here
  are her exact words, and here is the spec nobody could state up front."
  The second is not a better version of the first, it is a different
  object: one is context, the other is a priced lesson. And where
  Continue's own documentation recommends Voyage or OpenAI embeddings for
  "noticeably stronger retrievals on real codebases," Ursa cannot take
  that trade at any quality level, because sending the owner's
  correction text to a hosted embedding API breaks the constraint the
  whole company rests on. That refusal is recorded as a rejected
  alternative in `docs/design/semantic-retrieval.md` §10, not left
  implicit.

### 2026-09-30 — URGENT: every pair collapses to one final commit when the agent authors everything
- Trigger: running `ursa run` against a clone of Ursa's own repo while
  building the time dimension (docs/design/span-lifespan.md §8). All
  five records came back with `closingSha == tipSha`, so durability had
  nothing to walk. The cause is not durability. An exhaustive scan of
  all 93 commits on `main`: 87 classify agent-side under
  `pairfinder.ts`'s `DEFAULT_AUTHOR`
  (`/claude|codex|cursor|gpt|copilot|github-actions|\[bot\]/i`), 6
  human-side, and of those six only 2 are non-merge commits. This
  repo's git identity is literally `claude[bot]`.
- What: `findCommitPairs` pairs an agent commit with the *next*
  non-agent, non-merge commit touching an overlapping path. In a repo
  where agents author nearly everything, that "next" commit can be
  dozens of commits and days later, and the pair then attributes the
  entire intervening history to one generation. The run on Ursa's own
  repo reports `179,360 chars survived your editing verbatim` across
  five records, nearly all of `docs/standards/lessons.md`, credited to
  single agent commits that did not write most of it. That is not a
  cosmetic error: survival is the product's headline number and the
  thing Ursa Minor sells. Same root cause as the accepted 2026-09-20
  finding "merge commits are not edits" — that fix excluded merges as
  pairing targets, which was necessary and, on an all-agent repo, left
  the far-reach problem untouched. Candidate fixes, cheapest first: cap
  the search window (pair only within N commits or M hours); require
  the final commit to be a *descendant* whose diff actually overlaps the
  agent commit's own hunks rather than merely its paths; or treat a
  repo whose human non-merge commit count is below a floor as
  unpairable and say so instead of emitting records.
- First step: add a `--max-pair-distance` option to `findCommitPairs`
  defaulting to something small, with a test asserting that the Ursa
  repo fixture yields zero pairs rather than five inflated ones, and
  make `ursa run` print why it found nothing when a repo is unpairable.
- Cost: $0
- Status: urgent

### 2026-09-30 — A decayed span is evidence against tacit acceptance
- Trigger: building `lifespan.ts` today. `signals.ts` sets
  `acceptanceBasis` from retention and `CorrectionLoop.resolution`
  carries `'accepted_tacitly'`, defined in `types.ts` as
  "shipped/retained without complaint". The new `SpanLifespan.fate`
  is exactly the counter-evidence: a span the owner retained at the
  closing commit and the work removed three commits later was not
  tacitly accepted, it was tolerated and then rejected.
- What: let `deriveSignals` read `record.durability`. A loop whose
  resolving spans all read `decayed` should not close as
  `accepted_tacitly`; it should close as `abandoned`, or stay `open`
  with the decay as its evidence. Equally, `oneShotCorrections` drawn
  from a `survived_mutated` span that later decayed are corrections the
  owner made and then discarded, which is weaker evidence than a
  correction that lasted. This is the cheapest available upgrade to the
  honesty of the acceptance label, which the vision says is never
  inferred from retention.
- First step: add `durability` to `deriveSignals`'s inputs and downgrade
  any `accepted_tacitly` resolution whose spans are all `decayed`, with
  one test built on the four-commit fixture already in
  `lifespan.test.ts`.
- Cost: $0
- Status: proposed
- Held: deliberately out of today's PR. `signals.ts` is rewritten by
  open PR #13 (sprint item 1, correction loops), and two writers on
  that file would hand the owner a conflict for no gain.

### 2026-09-30 — Report decay with error bars and a same-era baseline, not as a point estimate
- Trigger: today's competitive scan (note below) found `shelf-life`,
  which answers nearly the same question with real survival statistics,
  and the contrast is unflattering in one specific place. Today's
  `durability.decayRate` on the demo run is `0.3` computed over two
  spans. Two spans is noise, and `0.3` printed without an interval
  invites a lab to treat it as a measurement.
- What: borrow the statistical shape without borrowing the unit.
  `shelf-life` reports Kaplan–Meier survival with 95% bootstrap
  confidence intervals resampled at the commit level (because lines
  within a commit are not independent), and compares only against code
  written since the first agent commit so the eras match. Ursa should
  report `decayRate` as an interval, bootstrap-resampled at the
  *episode* level for the same independence reason, and should refuse
  to print a rate at all below a minimum tested-span count. Ursa
  already has the same-era control that `shelf-life` has to construct
  by hand: `baselineDecayRate` over `no_generation_provenance` spans is
  the owner's own prose in the same files in the same episode.
- First step: aggregate `durability` across every record in
  `.ursa/records/` into one `ursa stats --durability` view that prints
  decay with a bootstrap interval and suppresses the number below a
  floor, rather than computing intervals per record where n is tiny.
- Cost: $0
- Status: proposed

- 2026-09-30 (engineer, competitive scan): **`shelf-life`**
  (github.com/sandeepsirodia/shelf-life) — "how long does your agent's
  code survive?", survival analysis of agent versus human lines over a
  repo's own git history, `uvx shelf-life [repo]`. Attribution is by
  `Co-Authored-By:` commit trailer, the same signal `pairfinder.ts`
  uses. **Worth stealing:** its statistical honesty. It reports
  Kaplan–Meier survival with 95% bootstrap confidence intervals
  resampled at the commit level, restricts comparison to the same era
  (only code written since the first agent commit), excludes generated
  files such as lockfiles, and states four limitations in its own
  README including "survival ≠ code quality". Ursa printed a bare
  `30%` today; that is the gap, and it is the ledger entry above.
  **What Ursa does better:** the unit. `shelf-life` measures *lines*
  and attributes them to a *commit*, so it can tell you agent lines
  died faster and can never tell you which generation produced the line
  or what the owner said before it was written. Ursa's unit is a span
  joined to a `SourcePointer` — conversation, model, turn, char offsets
  — sitting inside a record that also carries the owner's verbatim
  prompts and the diff of her edit. `shelf-life` answers "did it last";
  Ursa answers "did it last, which generation produced it, what did she
  say to get it, and what did she change". Only the second is a reward
  signal. Also noted in the same scan and relevant to Ursa Minor's
  pitch: Causari's Survival Report #2 (2026-09-23) puts AI-line
  survival at HEAD at 50.0% over 14.0M of 28.0M lines across 55 public
  repos, which is a public benchmark Ursa's own numbers can be read
  against.

### 2026-10-01 — The bridge is a live transmission path with no consent gate
- Trigger: building the consent gate (`src/consent.ts`,
  `src/disclosure.ts`) meant reading every path by which bytes leave the
  machine. There is exactly one that exists and runs today, and it is
  not the one the gate covers. `src/bridge/index.ts` assembles an
  `OverlayPayload` every five seconds and `PUT`s it to
  `https://ursa-overlay.vercel.app/api/sync/<blobId>`. It reads
  `.ursa/consent.json` nowhere, because nothing did before this change.
- What: the payload is end-to-end encrypted under a passphrase the
  server never sees (`src/bridge/crypto.ts`, PBKDF2 600k, AES-256-GCM),
  and it carries the user's own tuning to the user's own browser, so it
  is genuinely not an aggregation edge and plan §12's wall is not
  breached. Two things are still true and worth the owner's ruling.
  First, the payload includes `verdict.quote`, which is the user's
  verbatim words, and `tuning[].statement`, which is every active
  inference about her, so the ciphertext in Vercel Blob is derived from
  raw data even though nobody at Ursa can read it. Second, there is no
  switch. A user who wants nothing to leave has no way to say so other
  than not running `ursa bridge`, and "don't run the feature" is the
  shape of consent this product exists to replace. Proposal: add a
  `local-only` scope to `DisclosureScope` that `startBridge` checks
  before its first `push()`, defaulting, like every scope, to withheld,
  so sync is something she turns on rather than something she gets.
- First step: `startBridge` calls `isGranted(loadConsent(projectPath),
  'overlay-sync')` before the first tick and exits with a message naming
  the grant command when it is withheld. One test: a bridge started
  without the grant performs zero `fetch` calls.
- Cost: $0
- Status: proposed

### 2026-10-01 — survival_stats cannot be aggregated exactly, and it collapses the correction
- Trigger: writing `aggregate()` against the table in
  `docs/design/product-plan.md` §12, and finding two things the column
  list cannot express. Both were found by implementing the schema, not
  by reading it.
- What: first, merging contributors. The row carries
  `survival_scalar NUMERIC(5,4)` and `sample_generations INT` and no
  character totals, so combining two contributors' scalars can only
  weight them by generation count, and a generation is not a fixed
  number of characters. The merged number is a generation-weighted mean
  rather than the character-weighted ratio a single device computes.
  A `sample_chars BIGINT` column makes the merge exact and costs one
  integer per row. Second, and larger: `survivedChars` in
  `src/resolve.ts` counts `survived_verbatim` and `survived_mutated`
  together, so one scalar cannot tell the two apart. `CLAUDE.md` §1 says
  the mutation *is* the correction, expressed as an edit rather than a
  complaint, which makes that distinction the most informative thing in
  the record and the reason a lab would pay for it rather than for a
  preference pair. Selling a column that averages them away sells the
  part that was never scarce. Proposal: replace `survival_scalar` with
  `verbatim_chars`, `mutated_chars` and `generated_chars`, let the
  consumer form whatever ratio it wants, and keep the k-anonymity floor
  on the row as it is.
- First step: widen `SurvivalStatsRow` in `src/disclosure.ts` to the
  three char counts, since the data is already on
  `FinalSpan.class` and only the projection discards it. The audit and
  the floor need no change, because counts are numbers and the
  vocabulary check already requires every non-listed value to be one.
- Cost: $0
- Status: proposed

### 2026-10-01 — `.ursa/` should be legible to `cat` and `grep`, not only to a viewer
- Trigger: today's craft scan, below. Writing `ursa consent show` meant
  admitting that a user who wants to know what Ursa holds about her has
  to run a command, because a record is a multi-thousand-line JSON blob
  and `tuning.json` is not something anyone reads at a terminal. The
  transparency promise in `CLAUDE.md` currently depends on a program
  being willing to tell the truth.
- What: write a plain-text sidecar beside each JSON artifact, as the
  format a human reads and ordinary tools search:
  `.ursa/records/<id>.md` listing each span's class, its model, and the
  user's own words that produced it, and `.ursa/tuning.md` listing each
  axiom with its evidence. The JSON stays the machine format and the
  sidecar is generated, never authored, so the two cannot drift. The
  property worth having is that `grep -r northwind ~/project/.ursa`
  answers "what does Ursa know about this client" without trusting any
  Ursa code to answer honestly, which is a stronger claim than any
  inspection command can make about itself.
- First step: `renderRecordSidecar(record: OutcomeRecord): string` in
  `src/viewer.ts`, written by `saveRecord` beside the JSON. One test
  asserting every span in the JSON appears in the sidecar, so the
  sidecar cannot silently omit.
- Cost: $0
- Status: proposed

- 2026-10-01 (engineer craft scan): **Claude Code's own on-disk data surface**, checked by looking rather than from memory, since `ursa-major/src/parse.ts` and `src/bridge/index.ts` read these exact files. `ls ~/.claude` shows `projects/`, `sessions/`, `shell-snapshots/`, `settings.json`; a session is one plain JSONL file at `~/.claude/projects/<path-with-every-non-alphanumeric-dashed>/<uuid>.jsonl`; `claude --help` offers `rm <id>` for a background session and no export or privacy subcommand at all. **Worth stealing: the storage layout is the transparency surface.** Directory per project, one file per session, plain text, so inspection is `cat`, search is `grep`, and deletion is `rm`. Nothing needs to be built, trusted, or kept honest, which is a stronger guarantee than any inspection command can give about itself. That became today's third ledger entry. **Where Ursa is ahead: deletion that survives re-derivation.** `rm` on a session file is final because nothing rebuilds it, whereas `rm` on an Ursa record is undone by the next `ursa run`, since records are derived from git history rather than captured. Claude Code never had to solve that, and the tombstone in `.ursa/consent.json` shipped today is the answer to it. **Honest limit on the comparison:** Claude Code discloses nothing to anyone, so it needs no consent state and no disclosure gate, and scoring it on their absence would be unfair. The fair axis is inspectability, and on that axis it is ahead of Ursa today.

### 2026-10-01 — A merge can delete a generation, and the record blames the human
- Trigger: today's measurement watched a `union` merge silently drop three
  of five lines from a ledger entry while exiting 0 (see
  docs/design/server-side-merge-measurement.md, Finding 2). Reading the
  resolver afterwards, `ursa-major/src/pairfinder.ts:111` does
  `if (fin.parentCount > 1) continue`, and `m0.test.ts:49` asserts the
  seat "never pairs an agent commit with a merge commit".
- What: skipping merges is right for edit pairing, because a merge is not
  a human correction. But the span that a merge deleted still has to land
  somewhere, and `resolve.ts` routes every unclaimed generation segment to
  `generated_deleted`. So text that a merge destroyed mechanically is
  recorded as text the human produced and threw away. That is the single
  most load-bearing label in the artifact: `generated_deleted` is the
  negative reward signal Ursa Minor sells, and a merge-deleted span is a
  false negative in it. On any repo with real branches this is not an edge
  case, and it gets worse the more agents commit in parallel. A fifth
  classification, or a flag on the existing one, would separate "the human
  rejected this" from "a merge dropped this and nobody decided anything".
- First step: a failing test in `ursa-major/src/resolver.test.ts` that
  builds a two-branch fixture repo where a merge drops a generated line,
  and asserts that the span is not classified `generated_deleted`. Make it
  pass by carrying `parentCount > 1` through to the span as a flag.
- Cost: $0
- Status: proposed

### 2026-10-01 — A measurement harness needs an arm it is expected to fail
- Trigger: this run's own probe reported the opposite of the truth twice
  before it was correct, and both times the output looked clean. Run 1 said
  all three arms conflicted; run 2 said GitHub merged the union arm with
  both entries intact. `cmp` later showed the file recorded as GitHub's
  result was byte-identical to the probe's own local merge.
- What: what caught the error was not re-reading the script. It was the
  control arm disagreeing with the union arm on identical input, which made
  one of the two numbers necessarily wrong. Generalize it: a tool a seat
  ships to measure something carries at least one arm whose expected result
  is failure, and asserts that expectation on every run, so the harness
  fails loudly instead of reporting its own bugs as findings. This is the
  same defect class as the `toContain` assertions PR #43 found in #16's
  viewer, one level up: there the test could not fail, here the harness
  could not fail. Companion to the safe form L-A14 asks for, which is the
  `--self-test` flag in the first step.
- First step: add `--self-test` to `tools/ledger/probe-server-merge.sh`
  that runs the control arm alone and exits non-zero unless it conflicts
  both locally and at the API, then call it before the real arms. Also
  belongs in the lessons inbox for the centralizer, since
  `docs/standards/lessons.md` is a vendored copy this seat does not edit.
- Cost: $0
- Status: proposed

### 2026-10-01 — An entry's identity belongs in the entry, not in its position
- Trigger: the union splice left the `### 2026-10-01 — Probe entry BASE`
  heading in place while deleting that entry's First step, Cost and Status
  lines, and `tools/ledger/check.mjs` (PR #27) only noticed because it
  re-derives entry boundaries from `### ` headings. Had the heading been
  the line that was dropped instead, the two entries would have merged into
  one entry that passes every field check.
- What: give each ledger entry an explicit `- Id: <slug>` field in the
  contract. Then damage is detectable without trusting the heading, an
  entry-aware merge can match the two sides by identity instead of by
  heading text, and a near-duplicate pair gets an exact answer rather than
  a 0.9 Jaccard threshold. Note this is narrower than, and compatible with,
  the ledger-as-a-directory entry already proposed in PR #43: identity in
  the entry is what makes a directory's filenames meaningful, and it is
  worth having even if the file is never split.
- First step: this touches the ledger contract in `docs/standards/pm.md`,
  an HQ standard, so the first step is a proposal to the PM and the
  centralizer rather than code. The code half is one line added to
  `REQUIRED` in `tools/ledger/check.mjs` on #27's branch, once the contract
  says so.
- Cost: $0
- Status: proposed

- 2026-10-01 (engineer, craft scan): changesets, the npm release tool, read
  against today's finding rather than from memory
  (github.com/changesets/changesets, `docs/detailed-explanation.md`). It
  solves the exact problem `docs/ideas.md` has. Every pending change is its
  own file, `.changeset/UNIQUE_ID.md`, markdown with YAML front matter, and
  the aggregated `CHANGELOG.md` is generated at version time rather than
  edited by anyone. Two concurrent pull requests therefore write two
  different filenames and cannot conflict, so the project never needs a
  merge driver for its changelog at all. Worth stealing: the generated
  aggregate. Ursa keeps asking how to merge one hand-edited file more
  cleverly, and today's measurement says no driver can be both correct and
  effective on GitHub, which is the same conclusion changesets reached by
  removing the shared file instead. Where Ursa is already ahead: a
  changeset is discarded once consumed, so the history of what was proposed
  and rejected is gone, whereas the ledger's `rejected` and `urgent`
  statuses are durable and are what lets a memoryless seat avoid repeating
  a dead idea. The lesson is to generate the aggregate, not to stop keeping
  one. Honest limit on the comparison: changesets has no equivalent of the
  owner's verdict, so its files never need to be found and edited in place
  the way an `accepted` entry does.

### 2026-10-02 — A high fuzzy score is treated as proof of descent, and it is only proof of similarity
- Trigger: debugging today's merge-attribution fix. In the synthetic
  repo two agent branches each wrote a `formatItem` function and the
  human kept branch B's version. Branch A's generation is the one in the
  record. Its line
  `return \`- ${item.title}: ${item.claim} — so what: ${why}\`` came
  back classified `survived_mutated`, carrying a word-level diff from
  A's line to B's line, presented as the human's correction. The text in
  the final file is B's line, written by a different agent on a branch
  the human never edited. Nobody performed that diff.
- What: `resolve.ts` Pass 2 takes the best-scoring generation segment
  above THETA_HIGH and labels the span `survived_mutated`, treating
  similarity as descent. It cannot do otherwise with what it is given:
  branch B's generation is not in the record at all, because
  `resolveEpisode` builds generations only from the episode's own
  `generatedSha`. So there is no rival candidate to tie-break against
  and no tuning of THETA_HIGH helps — the evidence that would settle it
  is outside the record. This matters more than the deletion case fixed
  today. `generated_deleted` carried a false label; this carries a
  fabricated artifact, a `diff` that CLAUDE.md §1 sells as "the mutation
  is the correction" and that corresponds to no edit any human made. A
  lab training on it is training on an invented correction.
- What would settle it is the same evidence the merge fix used: git. If
  the span's text is present verbatim in some other commit's blob for
  that path, the human did not derive it by editing this generation, and
  the label should fall back to `no_generation_provenance` for this
  record rather than claim a mutation.
- First step: a test asserting that when a final span matches a
  generation above THETA_HIGH but is also present verbatim in a sibling
  commit's blob, the span is not labelled `survived_mutated`. Then add
  an optional `corroborate` hook to `ResolveInput`, injected from
  `bin/ursa.ts` exactly as `attributeDeletion` now is, so `resolve()`
  stays a pure function and the git lookup stays at the edge.
- Cost: $0
- Status: proposed

### 2026-10-02 — Nothing enforces that a pairing target descends from the generation
- Trigger: running `ursa run` over a clone of this repo. With only
  `main` fetched it found 6 work units; after fetching two unmerged
  engineer branches it found 19, which looked like cross-branch pairing.
  It was not. Checking every pair with
  `git merge-base --is-ancestor <generatedSha> <finalSha>` returned 0
  non-ancestral out of 19, and the extra episodes are legitimate pairs
  among the fetched branches' own commits. Two synthetic repos with
  sibling branches, built in both creation orders, produced 0 pairs
  rather than a bad pair. So the bug I went looking for is not there.
  What is there is that the invariant holds by accident: `listCommits`
  walks `git log --all --reverse --topo-order` and the forward scan
  accepts `commits[j]` for any `j > i`. Topo order guarantees ancestors
  precede descendants, but it says nothing about siblings, and in both
  synthetic repos git happened to place the agent commit last, which is
  why no pair formed. Ref ordering is doing the work that a correctness
  check should be doing.
- What: if a pairing target that is not a descendant of the generation
  ever is accepted, the resulting record is false throughout rather than
  wrong in one field. The generation's text is absent from an unrelated
  branch's blob, so it reads as `generated_deleted`; that branch's own
  text reads as `no_generation_provenance`, which CLAUDE.md §1 calls the
  most valuable category. Today's merge attribution cannot help, since
  no merge is involved and the two commits simply have no ancestry
  relationship. With 48 open branches in this repo and `--all` in the
  walk, the exposure grows with every branch, and the thing standing
  between it and the labels is the order git happens to emit refs in.
  The guard is one git call and it makes the invariant explicit.
- First step: in `findCommitPairs`, require
  `git merge-base --is-ancestor <generatedSha> <finalSha>` (exit 0)
  before accepting a pairing target, memoized per candidate pair. Add a
  test that constructs a sibling-branch repo and asserts the guard
  itself fires — not merely that the pair count is 0, which is what
  passes today for the wrong reason, exactly the trap the
  silent-empty-on-merge entry below describes.
- Cost: $0
- Status: proposed

### 2026-10-02 — Audit every git read for the silent-empty-on-merge failure
- Trigger: today's fix. `commitFiles` ran
  `git show --name-only --format= <sha>`, which prints nothing at all
  for a merge commit, because git shows no diff for a merge unless told
  to. It never errored and never returned a wrong path; it returned an
  empty list. That is why `findCommitPairs` appeared to refuse merges
  as pairing targets even before its explicit parent check: the merge
  reported no overlapping path, so the check never had to fire. A guard
  and a bug were masking each other, and the 2026-09-20 ledger finding
  ("the pair finder now skips merge commits, test added") recorded the
  guard as the reason when it was not.
- What: the dangerous shape here is a git invocation whose failure mode
  is empty output rather than a non-zero exit, because every caller
  treats empty as "nothing to see". `blobAt` already swallows errors
  into `null` by design. Each git read in `pairfinder.ts` should be
  exercised against a merge commit specifically, and any that returns
  empty where content exists should be fixed or documented. The general
  lesson is worth a line in the standard too: a test that passes
  because of a second defect is not evidence, and the way to tell the
  difference is to assert the guard fires, not just that the outcome
  looks right.
- First step: a test file that builds a repo with one merge and asserts,
  for each exported helper in `pairfinder.ts`, that it returns non-empty
  output for the merge commit. Then assert the parent check fires, by
  constructing a case where a merge does report an overlapping path and
  checking it is still refused as a pairing target.
- Cost: $0
- Status: proposed

- 2026-10-02 (engineer, competitive scan): **GitClear** (code-analytics
  product, the "Diff Delta" / "Line Impact" metric). No live browse was
  performed this run, so this is a craft read from prior knowledge of
  the product and should be re-checked against its current docs before
  anything is built on it. Worth stealing: GitClear's headline metric
  refuses to count mechanical change as work. It explicitly classifies
  and then discounts moved code, copy-pasted code, and churn — code
  deleted within a short window of being written — on the argument that
  a diff line is not evidence of value until you know what kind of line
  it is. That is the same move Ursa made today, arrived at from the
  opposite direction: they discount churn so a productivity number is
  not inflated, Ursa splits deletion by cause so a training label is not
  falsified. Their taxonomy is more developed than Ursa's and the next
  categories to look at are theirs: moved code and copy-paste, both of
  which currently reach Ursa's resolver as ordinary deletions and
  additions. A generation whose text was moved to another file reads as
  `generated_deleted` plus `no_generation_provenance` today, which is
  two wrong labels from one mechanical event, and it is a strictly
  harder case than the merge because no commit boundary marks it.
  Where Ursa does better: GitClear measures diffs and nothing else. It
  has no join to the model generation that proposed the line, so it can
  tell you code churned but not which model's output churned, nor
  whether the human's edit was a correction of a specific generation or
  an unrelated rewrite. Its labels are also computed by its own grader
  over heuristics; Ursa's come from whether the work kept the text. That
  is the distinction CLAUDE.md §1 rests on, and it is the reason the
  deletion cause had to be fixed rather than tuned: a grader can be
  approximately right, an outcome record claiming the human discarded
  text they never saw is simply false.

### 2026-10-03 — A required field on a shared type is a CI gate, not a review question
- Trigger: landing seventeen engineer branches today produced four type
  errors that exist in no branch and in the union only. Three branches
  added a required field to a type a fourth branch constructs
  (`interveningMerges` from #66 into #33's pull-request adapter; three
  stats fields from #66 and `artifact` from #16 into #22's briefing
  fixture). Measured at the merge commit: `npx tsc --noEmit` reported 4
  errors in 2 files while `npx vitest run` reported 309 passed. The
  suites cannot see it because vitest transpiles through esbuild and
  never typechecks.
- What: today's run closed the local half, `npm test` now runs
  `tsc --noEmit` first and `tools/stack/integrate.sh` reports the
  typecheck as its own step. The half still missing is the gate: nothing
  in `.github/workflows/` typechecks `ursa-major` on a pull request, so
  a branch can still be opened, reported green, and break the union
  silently. The gate should also be union-aware rather than
  branch-local, because a branch-local typecheck is exactly the check
  that passed seventeen times today. The shape that catches it is a
  scheduled job that runs `tools/stack/integrate.sh --json` across every
  open pull request and fails on `green: false`, which is the whole-union
  question GitHub's per-branch mergeability check cannot ask.
- First step: write the workflow to `docs/design/` as a proposal file
  rather than to `.github/workflows/`, because this seat's token has no
  `workflows` permission and the push is rejected outright. PR #27 and
  PR #36 both already park CI proposals this way
  (`tools/ledger/ci/ledger-gate.yml`, `docs/design/dep-floor.workflow.yml`),
  so the pattern exists and the owner applies it with one `cp`.
- Cost: $0. It runs on the same GitHub-hosted runner the seat workflows
  already use, once a day rather than per push.
- Status: proposed

### 2026-10-03 — Merge attribution stops at the git walker
- Trigger: resolving PR #66 against PR #33 while landing the stack. PR
  #66 made `interveningMerges` a required field and taught the resolver
  to attribute a deleted span to the merge that destroyed it rather than
  to the human, on the evidence that 65% of that label was wrong. PR
  #33's pull-request adapter builds the same `CommitPair` and
  `Episode` types from a pull request's own commit list instead of a git
  range, so it has nothing to put in the field. Today it passes `[]`,
  which type-checks and means "nothing known," but reads downstream as
  "no merge destroyed anything" and so reproduces exactly the label #66
  removed from the git path.
- What: give the pull-request adapter the same merge awareness the git
  walker has. The information is available on the surface it already
  reads: a pull request's commit list distinguishes merge commits by
  their parent count, and the adapter already handles the case where the
  pairing final commit is itself the merge (`chosen.closure`). What is
  missing is the merges that sit *between* the generated commit and the
  final one, which is the population `interveningMerges` exists to name.
  Until that lands, every deletion on the pull-request capture path is
  attributed to a human who may never have seen the text, and that is a
  false label in the one field CLAUDE.md §1 says the artifact's value
  rests on.
- First step: a failing test in `src/adapters/github-pr.test.ts` that
  builds a pull request whose generated commit is followed by a merge
  that drops the generated lines, and asserts the resulting span is
  attributed to the merge rather than to the human. Then fill
  `interveningMerges` from the commit list and delete the `[]` and the
  comment that currently marks the gap in `src/adapters/github-pr.ts`.
- Cost: $0
- Status: proposed

### 2026-10-03 — The landing is the product's own best trial
- Trigger: today's run produced, as a side effect of merging seventeen
  branches, a real correction record of exactly the kind Ursa Major
  exists to capture, and threw it away. Five branches collided on
  `ursa-major/src/bin/ursa.ts` and `README.md`, and each resolution was
  a human judgement over two model-generated alternatives. One of them
  was a genuine correction worth training on: PR #66's header comment
  reasserted a claim about the author-name fallback that PR #56 had
  already corrected, and the right resolution kept #56's paragraph and
  carried over only #66's new fact. That is a `survived_mutated` span
  whose mutation is a real correction of a real generation, and no
  record holds it.
- What: capture a landing as an episode. A merge resolution is a
  near-perfect outcome record: the two sides are both model generations
  with full provenance, the resolved text is the finished work, and the
  human's choice between them is the label, with no retention inference
  anywhere. It is also the one capture path where `interveningMerges`,
  `artifact.kind: 'repo'` and the resolver's span classes all already
  apply. The trial would run `ursa run` over this repository after the
  owner merges, and the interesting number is how the resolver
  classifies the hand-resolved hunks against the two parents.
- First step: run `npx tsx src/bin/ursa.ts run .` against this
  repository once PR #69 merges, with `--declare` set to the owner's
  verdict, and read what the resolver makes of a merge commit with two
  generated parents. That is an observation, not a build, and it tells
  us whether the resolver needs a merge-resolution episode kind before
  anything is designed.
- Cost: $0
- Status: proposed

## Competitive scan — 2026-10-03 (engineer's craft scan)

Scanned **Graphite** (graphite.com, formerly graphite.dev), the product
whose entire thesis is the stack this run spent the day landing by hand.
Read from its own documentation today rather than from memory, and the
limit on this scan is stated plainly: `graphite.com/docs` and
`graphite.com/docs/graphite-merge-queue` returned content, while the
command reference and cheatsheet pages 404ed from this runner, so the
`gt` command names are not quoted here and nothing below depends on
them. No account was created and nothing was installed, per the
no-new-paid-services boundary.

**Worth stealing, and it is the exact gap this run hit.** Graphite's
merge queue is *stack-aware*: when a stack is added to the queue it can
"process and validate the entire stack in parallel," and on success it
merges without re-running CI because, in its own words, "no need for CI
to run again since we have already validated the CI against that exact
change (this is also known as fast-forward merge)." The load-bearing
idea is that the validated artifact and the merged artifact are the
same commit. Ursa's harness does not have that property. This run
validated a union, and the owner's merge button will then build a
*different* commit, because GitHub re-merges server-side, and PR #61
already measured that the server-side merge does not honour the ledger
driver this union depended on. So the tree the owner lands is not the
tree that was tested. The fix shaped by Graphite's answer is a
fast-forward landing: the owner merges this branch with a merge commit
whose tree is byte-identical to the one that passed, rather than
letting GitHub recompute it. Worth a ledger entry once the first
landing has actually happened and we know which of the two GitHub
produces.

**What Ursa does better, for this repository.** Graphite's queue is a
product you adopt: it wants an installed app, a configured trunk, and
required status checks before it does anything, and its unit of work is
a stack the author declared as a stack with `gt` while writing it. Ursa
has seventeen branches that were never declared a stack by anybody,
written by seventeen fresh sessions with no memory of each other, each
branched independently off `main`. `tools/stack/integrate.sh` answers
the question that shape actually poses, which is "does any order of
these build," with zero repository configuration and no author
cooperation, and it reports a conflict map rather than a verdict. The
honest limit, carried forward from the 2026-09-30 scan of GitHub's own
merge queue and still true: a queue prevents a broken union from ever
landing, and the harness only tells you about it. Today sharpened that
limit in the harness's favour on one point, though. A queue tests the
candidate's own checks, so it would have reported today's union green
seventeen times over, exactly as `npm test` did, because the check that
found the four defects did not exist until this run added it. A gate is
only as good as the step it runs, and that is the half neither product
can supply.

### 2026-10-03 — The record forgets which pull request it came from
- Trigger: closing the merge-attribution gap on the pull-request path
  needed a place to say "a merge sat here and I could not read it," so
  the field went on `PullRequestProvenance`. Then
  `grep -rn pullRequest ursa-major/src --include=*.ts`, with
  `src/adapters/` excluded, returned nothing at all. The whole
  `pullRequest` block — the closure kind, the acceptance basis sentence,
  the stated corrections lifted from review comments, the regression,
  and now `unreadableMerges` — reaches `.ursa/episodes.json` and stops
  there. `OutcomeRecord` has no field for any of it.
- What: a record produced from a pull request currently cannot tell a
  reader, or a lab, that it came from one. The acceptance basis is the
  sharpest loss: `acceptanceOf` writes a full sentence of evidence
  ("alexandrapaiz merged owner/name#42 at <time>: an explicit act, not
  retention") which exists precisely so retention is never read as
  acceptance, and the record that gets sold carries none of it. Give
  `OutcomeRecord` a `source` block that holds the provenance of the
  capture path, with `pullRequest?: PullRequestProvenance` as its first
  member, and render it in `src/viewer.ts` beside the verdict. The
  unreadable-merge warning then reaches the user who can fix it with one
  `git fetch`, instead of only the terminal that happened to run
  `cli.ts run`.
- First step: add `source?: { pullRequest?: PullRequestProvenance }` to
  `OutcomeRecord` in `src/types.ts`, fill it in `resolveEpisode` when the
  episode's `closureHeuristic` is `github-pr`, and assert in
  `src/adapters/github-pr.test.ts` that the resolved record for the
  Ursa#13 fixture carries the acceptance basis string. One slice,
  because the viewer and the HQ fixtures both construct records and will
  need the field threaded.
- Cost: $0
- Status: proposed

### 2026-10-03 — An unknown deletion cause is not the human's
- Trigger: the same fix, one level down. `gitDeletionAttributor` reads a
  merge's tree through `blobAt`, which returns `null` for anything it
  cannot read. When the merge's own blob and every parent's blob come
  back `null` — a shallow clone, a pruned object, a fork whose objects
  were never fetched — the loop finds no parent holding the text and
  falls through to `HUMAN`. So the function that exists to stop
  "unknown" being read as "the person discarded it" still does exactly
  that whenever the repository cannot be read, and silently.
- What: `DeletionCause` has two values, `human_edit` and `merge`, and
  the honest answer needs a third. A span whose merge boundary could not
  be inspected is `unknown`, its chars belong in neither
  `humanDeletedChars` nor `mergeDeletedChars`, and `humanDeletedPct` —
  which `src/types.ts` documents as "the only deletion rate safe to call
  a discard rate" — must not have them in its numerator. The viewer
  should say how many chars could not be judged and why, because a
  reader who sees a 17% discard rate deserves to know if a third of it
  was a failed `git show`. This is the shape of defect the product is
  built to refuse, so it should not survive in the product's own code.
- First step: add `'unknown'` to `DeletionCause` in `src/types.ts` and
  make it fall out of a positive test rather than a default:
  `gitDeletionAttributor` returns it when a merge in `m.paths` has an
  unreadable tree. Then follow the type error, which is the whole point
  of the `tsc --noEmit` gate added on 2026-10-03 — it will name every
  site that must decide what to do with the new value:
  `src/stats.ts:102`, `src/viewer.ts:236`, `src/bin/ursa.ts:119` and
  `src/hq/fixtures.ts`.
- Cost: $0
- Status: proposed

### 2026-10-03 — What a run excluded from history belongs in the record, not in a comment
- Trigger: today's craft scan of CodeScene, below. Its handling of
  merge commits is a documented, per-project configuration setting with
  a stated default. Ursa's handling of merge commits is four code
  comments in three files, and the only way to know what a given record
  excluded is to read `src/pairfinder.ts` and
  `src/adapters/github-pr.ts` at the commit that produced it.
- What: every capture run makes a set of history decisions that change
  what the record means. Merges are refused as pairing targets. Commits
  whose author matches the agent pattern are not eligible as finals, and
  that fallback is suppressed entirely when the pattern matches the
  whole history. Files outside `TEXT_EXTS` are skipped, as are blobs
  over `MAX_BLOB_CHARS`. Each of those is reasoned and each is
  invisible in the output. `PairFinderDiagnostics` already proves the
  pattern is worth it for one of them. Put a `historyPolicy` block on
  the record naming every exclusion that fired, with its count, so a lab
  auditing a record can see what the denominator was built from.
  "Publish methodology openly" (CLAUDE.md §5) is a claim about files
  like this one, and it is cheaper to honour per record than per blog
  post.
- First step: inventory the exclusions. One test that asserts, for the
  `fixtures/pr/ursa-pr-13.json` capture, the exact count of commits
  refused for each reason, which is the data a `historyPolicy` block
  would carry and is worth having even before the block exists.
- Cost: $0
- Status: proposed

## Competitive scan — 2026-10-03, second dispatch (engineer's craft scan)

Scanned **CodeScene** (codescene.com, behavioural code analysis), picked
because it is the mature product that does the thing this run did: mine
a git history for a signal about the work rather than about the code's
current text. Read from search results against its own documentation
today, not from memory. Limit stated plainly: no account was created and
nothing was installed, per the no-new-paid-services boundary, so this is
a read of public docs and not of the running product.

**Worth stealing, and it lands on the exact decision this run made.**
CodeScene filters merge commits out of its analyses by default, and it
walks history explicitly first-parent with merge diffs off:
`git log --first-parent --diff-merges=off --name-only --pretty=format:
--diff-filter=ACMR <base>..HEAD`. Two things are worth taking. First,
the policy is a *documented project setting with a stated default*
rather than an implementation detail, and CodeScene applies the same
treatment to another history artefact that biases its numbers, letting
a project exclude the contributions in an initial import commit. That
is the "declared history policy" ledger entry above. Second, the flag
detail is a direct check on today's change: `--first-parent` alone still
emits merge-introduced paths on current git versions, which is why
`--diff-merges=off` is needed. This run's walk filters a merge by
`c.files`, the file list GitHub's commits API returns, and that list is
the diff against the merge's first parent. If GitHub ever returns a
combined diff there instead, the filter gets *wider*, and the direction
of that error is safe: a merge wrongly admitted still has to pass
`gitDeletionAttributor`'s containment test, which asks whether the text
was in a parent and absent from the result, so the cost is two extra
`git show` calls and never a wrong label. Truncation is the unsafe
direction, and the commits API caps at 300 files per commit. Recorded in
`docs/design/pr-path-merge-attribution.md` §8.

**Where Ursa does better.** CodeScene's answer to a merge is to drop it.
That is right for its question, which is how much human work happened
where, and it is wrong for Ursa's, because the span the merge destroyed
is still a span of generated text whose fate the record has to state.
Dropping the merge throws away the event along with the mislabel: the
`generated_deleted` count falls and nobody learns that the text died
mechanically. Ursa keeps the span, keeps the count, and corrects the
cause, which is why `mergeDeletedChars` exists as its own column beside
`humanDeletedChars` rather than as a filter applied before counting. For
a reward signal, a discarded event is lost data and a relabelled event
is better data. The deeper difference is upstream of both: CodeScene
reads commits and has no join to the model generation that proposed the
line, so it can say a file churned and never which model's output
churned. That join is the whole artifact (CLAUDE.md §1).

### 2026-10-04 — Two levels of "we are not sure who", not one
- Trigger: today's craft scan of `git blame --ignore-rev`, verified
  first-hand on this runner. git distinguishes two degrees of
  attribution doubt that today's change collapses into one. A line an
  ignored commit touched that git could reassign to an earlier commit
  is marked `?`, meaning "this author is our second choice". A line it
  could not reassign at all is marked `*`, meaning "we have nowhere to
  put this". Ursa's new `unknown` cause is git's `*`. Ursa has no `?`.
- What: there is a second, quieter doubt in the resolver already, and it
  is not the deletion path. `resolve` matches a surviving span to a
  generation by containment and similarity, and a span it matches
  loosely is flagged `uncertain` on the span while the record still
  states a single `source` pointer naming one model, one conversation,
  one turn. That is the `?` case exactly: a confident-looking
  attribution that is the resolver's second choice. A lab training on
  `survived_mutated` spans cannot currently tell a span whose
  provenance is certain from one where the match was close enough to
  pass a threshold, because both carry the same shaped `source`. Put
  the runner-up on the span: `sourceAlternatives: SourcePointer[]`,
  populated only when another generation scored within a stated margin
  of the winner, with the margin recorded on the record so the
  denominator is auditable.
- First step: measure before building. Instrument the matcher to report,
  across the 40 records the #69 capture produces, how many
  `survived_mutated` spans have a runner-up within 10 percent of the
  winner's score. If the answer is near zero the idea is not worth the
  schema change, and that result is worth knowing either way.
- Cost: $0
- Status: proposed

### 2026-10-04 — The unknown-cause rate belongs in the capture's exit status
- Trigger: implementing `unknown` today produced a number that nothing
  acts on. `cli.ts run` prints `N with no readable cause` and exits 0,
  the same exit status it uses for a capture where every boundary was
  readable. The measured counterfactual in
  `docs/design/unknown-deletion-cause.md` §8 shows why that matters: on
  alexandrapaiz/Ursa#69, withholding one of twenty-one merges moved up
  to 98,726 of 150,631 chars out of the discard column. A capture that
  bad is still a success as far as any script calling it can tell.
- What: a capture whose unknown share crosses a threshold is a capture
  that should be re-run after a fetch, not consumed. Add
  `--max-unknown-pct <n>` to `src/adapters/cli.ts run`, defaulting to
  off so nothing changes for today's callers, which exits non-zero with
  the `git fetch` command in the message when
  `unknownDeletedChars / deletedChars` exceeds `n`. The same ratio
  belongs on the record as `stats.generated.unknownDeletedPct` so a
  consumer downstream of the capture can apply its own floor without
  recomputing. This is the discipline that already exists for
  dependencies in `scripts/dep-floor.mjs`: a measured property of the
  artifact that fails a gate rather than printing a warning nobody
  reads.
- First step: `unknownDeletedPct` on `Stats.generated` with the
  partition test extended to it, plus the flag reading it. One day.
- Cost: $0
- Status: proposed

### 2026-10-04 — The clone the capture needs, fetched by the capture
- Trigger: every real capture this run made printed the same warning —
  `merge commit 3e9dcdf3e is not in this clone` on #13,
  `d1a0f15ab` on #69, `177ac408a` on #43 — and the fix in every case is
  one `git fetch` the user has to notice, read, and run. Three of three.
  The repository's own agent workflows are the worst case, because
  `actions/checkout` defaults to `fetch-depth: 1`, which is the exact
  state that produces the `unreadable_merge_commit` label this run added.
- What: `cli.ts` already knows every sha it needs before it reads a
  single tree, because the snapshot lists the pull request's commits and
  `checkLocalObjects` already probes which are missing. Turn that probe
  into an action behind an explicit flag: `--fetch-missing` runs
  `git fetch --no-tags origin <sha>...` for exactly the missing objects,
  reports what it fetched, and re-probes. Opt-in rather than automatic,
  because a capture that silently reaches the network changes what a
  label depends on, which is the property
  `docs/design/unknown-deletion-cause.md` §9 explicitly declines.
- First step: `fetchMissingObjects(projectPath, snap): string[]` beside
  `checkLocalObjects` in `src/adapters/cli.ts`, returning the shas it
  fetched, with a test over a deliberately shallow clone of this
  repository asserting that the second probe comes back empty.
- Cost: $0
- Status: proposed

## Competitive scan — 2026-10-04 (engineer's craft scan)

Scanned **`git blame`'s ignore-revs mechanism** (git 2.55.0), picked
because it is the oldest and most widely deployed answer to the exact
question this run spent the day on: what an attribution tool should say
when a mechanical commit stands between a line of text and the person
who really wrote it. Read by running it on this runner against a
purpose-built two-commit repository and by reading `git blame --help`
from the same binary, so every claim below is first-hand rather than
from documentation found elsewhere.

**What it does.** `git blame --ignore-rev <rev>` reassigns the lines an
ignored commit touched to the previous commit that changed that line or
a nearby one, as if the ignored change never happened. The standing form
is `.git-blame-ignore-revs` with `blame.ignoreRevsFile`, which is how
projects stop a repository-wide reformat from owning every line in the
tree.

**Worth stealing: it has two degrees of doubt where Ursa has one.** A
line git reassigned to another commit can be marked `?` — the author
printed is a second choice. A line it could not reassign anywhere is
marked `*` — unblamable. Verified on a repository where a reformat
commit inserted blank lines that no earlier commit ever touched:

```
$ git -c blame.markUnblamableLines=true blame --ignore-rev $REF f.txt
^b40c326 (A 2026-10-04 03:07:59 +0000 1) alpha
*d4fc28c (A 2026-10-04 03:07:59 +0000 2)
^b40c326 (A 2026-10-04 03:07:59 +0000 3) beta
```

Today's `DeletionCause: 'unknown'` is git's `*`. The `?` case has no
equivalent in an outcome record, and the resolver already produces it
under a different name, which is the ledger entry "Two levels of 'we are
not sure who', not one" above.

**Where Ursa does better, and it is the same defect this run fixed.**
Both markers are off by default: `git config --get
blame.markIgnoredLines` and `blame.markUnblamableLines` both come back
unset on a stock install, confirmed on this runner. So git's default
output prints a confident author and a confident sha for a line it knows
it guessed at, and the distinction exists only for the user who went
looking for it. That is exactly the shape of the defect in
`src/deletion.ts` before today: the uncertainty was known inside the
code and absent from what the code said. Ursa's `unknown` is in the type
rather than behind a flag, so a consumer cannot fail to receive it, and
`humanDeletedChars` excludes it by construction rather than by
configuration. For a signal sold to a lab, an uncertainty that is opt-in
to see is an uncertainty that will not be seen.

### 2026-10-04 — The generated denominator is wrong in two directions, and nothing checks it
- Trigger: today's pairing-window run (docs/design/pairing-window.md §1,
  §9). `ursa run` against a clone of this repository's `main` at
  `0d68df0` reported `239,976 chars survived your editing verbatim`
  against `239,841 chars were generated to get there`. More text
  survived verbatim than was ever generated, in all six records.
  `survived_verbatim` means byte-identical in the generation and in the
  finished work, so it is a subset of the generation by construction and
  cannot exceed it. The pairing fix took the figure to 60,616 against
  60,366, which is still 250 characters over, so the bound was only one
  of two causes.
- What: two defects in the same denominator, `GenerationRecord.totalChars`.
  The first is a measurement bug: `ursa-major/src/match.ts` accepts a
  fuzzy match wider than the generated text it matched against, so a
  final span is credited with more characters than the generation
  contained. The 250 characters are that. The second is a modelling
  choice that is wrong on inspection: for a git pair, a generation's
  `text` is the WHOLE FILE at the agent's commit, not the diff that
  commit introduced. On the one surviving pair that is 60,366 characters
  of `docs/standards/lessons.md` attributed to a sync commit that wrote
  a few hundred of them. Both inflate the same number, and that number
  is the denominator under `survivalRate`, `humanDeletedPct` and every
  per-conversation figure Ursa Minor would sell. Neither is caught by
  anything: 344 tests pass with the arithmetic impossible on real data.
- First step: the invariant, as a gate, before either fix. Assert in
  `ursa-major/src/stats.ts` that `byClass.survived_verbatim.chars <=
  generated.totalChars` for every record, and run it over the public
  fixture plus a clone of this repository, so the assertion is exercised
  against real history and not only synthetic. It fails today, which is
  the point: it is the cheapest check that would have caught a defect
  that survived six records, four open pull requests and three runs of
  deletion attribution. Then narrow the fuzzy match to the generation's
  own extent, and decide the whole-file question explicitly, in an ADR
  rather than in a diff, since it changes what every historical record
  means.
- Cost: $0
- Status: proposed

### 2026-10-04 — The trailer pattern does not know the company's own bots, so a bot sync reads as a human correction
- Trigger: the one pair that survives today's bounds on this
  repository's history. Its edit is `8c453f04`, author `alexandrapaiz`,
  whose `Co-Authored-By` trailer is `exo-centralizer[bot]`.
  `DEFAULT_TRAILER` in `ursa-major/src/pairfinder.ts` is
  `/claude|codex|cursor|gpt/i`, which that string does not match, so the
  commit is eligible as a human edit. The only record this repository
  now produces is therefore one bot's lessons sync being read as a
  person's correction of another bot's lessons sync, and its 236
  `survived_mutated` characters are offered as the user's own
  corrections, which `CLAUDE.md` §1 calls the most commercially
  distinctive thing in the artifact.
- What: the agent-identity patterns are two hardcoded regexes naming
  four vendors. Alexandra Systems runs at least `claude[bot]`,
  `exo-centralizer[bot]` and the per-seat identities this charter
  exports (`ursa-engineer`), and a customer will have their own. The
  false-negative direction is the expensive one: an unrecognised agent
  becomes a human, and its output becomes someone's revealed preference.
  The fix is not a longer regex. It is a declared identity list the
  project owns, read from the project rather than compiled into the
  resolver, with the compiled list as a fallback, plus a run-time report
  of which identities a history actually contains so an unrecognised one
  is visible rather than silently promoted to a person.
- First step: `agentIdentities` in a per-project config file under
  `.ursa/`, read by `findCommitPairsWithDiagnostics`, defaulting to the
  current patterns when absent; add the distinct trailer and author
  strings a history contains to `PairFinderDiagnostics` and print the
  unmatched ones in `renderRunSummary`, which is how a user would find
  out that `exo-centralizer[bot]` was being counted as them. A test on a
  fixture whose only edit carries an unlisted bot trailer, asserting
  zero pairs rather than one.
- Cost: $0
- Status: proposed

### 2026-10-04 — Capture the generation when it happens, instead of inferring the pair afterwards
- Trigger: today's craft scan of Agent Blame and Git AI, below, read
  against today's own defect list. All four defects fixed today
  (docs/design/pairing-window.md §1) are defects of RECONSTRUCTION. The
  distance bound, the age bound, the interposition rule and the
  descent test are all guesses about which commit a person was looking
  at, taken from a commit log days later. None of the four could exist
  if the generation had recorded its own extent at the moment it was
  written.
- What: an edit-time capture path alongside the git walk. A hook on the
  harness's file-write event records the generation's own diff, the
  conversation it came from and the turn index, keyed by a content hash
  of the lines it wrote. At commit time the hashes are matched against
  what landed and the attribution is written to `git notes`, which
  travels with any clone and rewrites no history. The pair then needs no
  inference: the generation's extent is known exactly, so
  `GenerationRecord.totalChars` becomes the diff rather than the whole
  file (the entry above), interposition is answered by the hash rather
  than by ancestry, and a merge that destroys a span is visible as the
  hash disappearing rather than as a blob read that may be unreadable.
  The git walk stays, as the path for repositories with no capture
  installed, which is every repository Ursa did not watch being built.
- First step: one hook, one harness, one direction. A Claude Code
  `PostToolUse` hook on `Edit` and `Write` appending a JSON line per
  write to `.ursa/captures/<session>.jsonl` with the file path, the
  inserted line hashes and the turn index, plus a reader in
  `ursa-major/src/adapters/` that pairs those hashes against `git
  diff` at commit time. Measure it on one real session against the git
  walk's answer for the same work, and report where the two disagree,
  because the disagreements are the inference errors this entry claims
  exist.
- Cost: $0. The hook is local, the storage is git notes and a gitignored
  directory, and no service is involved.
- Status: proposed

## Competitive scan — 2026-10-04, second dispatch (engineer's craft scan)

**Agent Blame** (mesa.dev) and **Git AI** (git-ai-project/git-ai), with
**blameprompt**, **gitwhy** and **Exceeds Ink** in the same bracket.
`docs/market/landscape.md` still does not exist on `main` (it is inside
PR #21, unmerged since 2026-09-26), so the rotation again falls back to
the charter's list, and the product was chosen to sit on top of the
defect this run spent the day on: how a tool decides which lines an
agent is responsible for.

**What they are.** Both attach line-level AI attribution to a
repository. Agent Blame intercepts edit events from Cursor, Claude Code
and OpenCode as they happen, hashes the written lines (exact and
normalised, with confidence 1.0 and 0.95), matches them against what
lands at commit time, and stores the result in `git notes`. A GitHub
Actions workflow re-transfers attribution by content matching when a
squash or rebase merge rewrites the shas. Git AI is the same idea as a
git extension, with `git ai blame` as a drop-in for `git blame` that
prints the agent, the model and the prompt behind each line.

**Worth stealing: capture at the moment of the edit, and store it in
git notes.** This is the one that matters, and it is this run's third
ledger entry above. Every defect fixed today was a defect of inferring,
days later, which commit a person had in front of them. Agent Blame
does not have a pairing window because it never needs to guess the
generation's extent. The storage choice is the other half: `git notes`
travels with the clone, rewrites no history, and needs no sidecar
directory, where Ursa's `.ursa/` is gitignored and therefore does not
survive being cloned at all.

**Where Ursa does better, and it is a difference in what is being sold.**
Agent Blame states its principle as "false attribution is worse than
missing attribution" and accepts two gaps on purpose: "heavily edited
output won't match", and changes made outside hook capture are not
attributed. For a code-review and adoption-metrics product that is the
right trade. For Ursa it inverts the asset. A heavily edited generation
is the MOST valuable record Ursa has, because `CLAUDE.md` §1 defines the
mutation as the correction, expressed as an edit rather than a
complaint, and `survived_mutated` is where the correction signal lives.
Text present in the finished work that matches no capture is Ursa's
`no_generation_provenance`, the class `CLAUDE.md` calls the most
valuable of the four, because it is the evidence that the model was
never in the running. Agent Blame discards both of those as noise. It
measures how much AI code landed; Ursa measures what the work did to it,
which is why it needs deletion causes, a survival rate and a time
dimension that an adoption metric has no use for.

**The uncomfortable half.** Their principle is the one this run arrived
at independently and should be read as convergent evidence rather than
as a borrowed slogan: today's change refuses 66 claims it cannot stand
behind and prints the refusals rather than emitting weak records. The
difference is that Agent Blame can afford to drop the hard cases and
Ursa cannot, so Ursa has to get the hard cases right instead of
skipping them, and that is a strictly harder engineering problem than
the one the comparable products have taken on.

Sources: [mesa.dev/blog/agentblame-deep-dive](https://www.mesa.dev/blog/agentblame-deep-dive),
[git-ai-project/git-ai](https://github.com/git-ai-project/git-ai),
[Ekaanth/blameprompt](https://github.com/Ekaanth/blameprompt),
[mehrtam/gitwhy](https://github.com/mehrtam/gitwhy),
[blog.exceeds.ai/track-ai-code-contributions-git](https://blog.exceeds.ai/track-ai-code-contributions-git/)

### 2026-10-05 — `survived_mutated` credits the person's own additions to the model
- Trigger: the invariant gate's first run, on the first record written to
  exercise it (docs/design/generated-denominator.md §6). `CLAIM_NOT_WIDER`
  fired with "82 final chars credited to a 75-char generation extent, 7 too
  many". The span was right and the invariant was wrong: the person had
  edited "holds it whole" into "holds the whole of it" and added seven
  characters. The invariant was narrowed to `survived_verbatim`. What is
  left standing is that `Stats.byClass.survived_mutated.chars` counts
  finished characters inside edited spans, some of which the person typed,
  and nothing distinguishes the two.
- What: split the mutated class's character count where the edit split it.
  `byClass.survived_mutated` gains `claimedChars` (characters of the
  generation extent the span descends from) and `addedChars` (finished
  characters beyond it, which the person wrote). `measure()` already
  computes the second as `mutatedAddedChars`; this moves it from a
  diagnostic into the record, so a lab buying "survived edited: 236 chars"
  is told how many of those 236 the model is responsible for. It matters
  more than the size of today's numbers suggests, because `CLAUDE.md` §1
  makes the mutation the correction: on an edit that doubles a sentence's
  length, more than half of what is sold as survived model text is the
  person's own prose. The `diff` array is already on every mutated span,
  so the split is derivable from stored data and needs no re-resolution.
- First step: assert the identity on the public and real fixtures first —
  for every mutated span, `addedChars` equals the sum of `added` segments
  in its own `diff` array, which is an independent second route to the same
  number and therefore a check rather than a restatement. Then add the two
  fields and make `GEN_CLAIM_BOUNDED` cover the mutated class too.
- Cost: $0
- Status: proposed

### 2026-10-05 — The separator decision needs an ADR, because it moves the discard rate ninefold
- Trigger: docs/design/generated-denominator.md §1.1 and §9 item 4. A
  generation's segments do not cover its text: `segment()` leaves the blank
  lines and indentation between segments in no segment, which is 123
  characters of one real record and 2,996 of another, 4.73% of the
  denominator under every rate the record reports. Today's change recorded
  the quantity as `separatorChars` and deliberately did not move it, after
  measuring what moving it would do: because `humanDeletedChars` is
  computed by subtraction, making the spans partition the text would carry
  every unclaimed separator into the human discard figure and take one real
  record from 365 to roughly 3,361 characters discarded.
- What: an ADR in docs/decisions.md that decides, with both options
  measured on the same two real records, whether a generation's spans
  partition its text. Option A leaves them as they are and accepts that
  4.7% of what was generated carries no fate, which keeps every rate
  conservative and leaves the numerator able to reach characters the
  denominator does not hold. Option B extends each segment to absorb the
  whitespace that follows it, which makes `totalChars` equal `charsWritten`
  by construction and retires `GEN_CHARS_CONSISTENT`'s third clause, at the
  cost of attributing layout whitespace a fate it did not earn. A third
  option exists and should be priced: classify separators as their own
  fate, `no_fate_assigned`, excluded from every rate by name rather than by
  omission. This is a different question from the whole-file question in
  the 2026-10-04 entry, which is about which TEXT a generation is; this one
  is about which of that text carries a verdict. Both need the same kind of
  decision and neither belongs in a diff.
- First step: write the ADR with the three options, and for each one print
  the before-and-after of `survivalRate`, `deletedPct` and
  `humanDeletedPct` on `fixtures/real/ursa-main-4d5e401.json` and on the
  1.2 MB record named in that fixture's README, using a throwaway branch
  per option rather than a committed flag.
- Cost: $0
- Status: proposed

### 2026-10-05 — The gate checks seven of a record's nine top-level keys
- Trigger: writing `checkRecord` against the real record
  (`fixtures/real/ursa-main-4d5e401.json`) and then listing the file's own
  keys: `schemaVersion`, `task`, `artifact`, `files`, `conversations`,
  `generations`, `stats`, `durability`, `signals`. The ten bounds shipped
  today reach `files`, `generations` and `stats`. Nothing checks
  `durability`, which the run summary quotes directly ("59% was gone by the
  latest commit"), and nothing checks `signals`, which is the block Ursa
  Minor actually sells. Both are derived from the same spans the gate
  already validates, so their arithmetic is checkable with the data in
  hand.
- What: extend the gate to the two remaining blocks. For `durability`: a
  span's decayed share cannot exceed the characters that survived to begin
  with, a span cannot be recorded as surviving past the latest commit
  walked, and the per-span lifespans must sum to the aggregate the summary
  prints. For `signals`: every `CorrectionLoop`'s `closedStep` is after its
  `openedStep` and inside the conversation's step range, every excerpt a
  signal quotes is a substring of the text it claims to quote (the cheapest
  possible check that a sold signal is grounded), and every
  `RegressionEvent`'s `regressionSteps` name steps that exist. The quoted
  -excerpt check is the one worth doing first: a signal that misquotes the
  user is the single worst defect this product can ship, and
  `src/text.ts`'s `excerpt()` truncation makes a substring assertion
  slightly non-trivial and therefore worth having a test for.
- First step: the excerpt-grounding check alone, as an eleventh bound, run
  over both fixtures and over a clone of this repository. It needs no new
  data and it is the one whose failure would be a trust incident rather
  than a wrong number.
- Cost: $0
- Status: proposed

## Competitive scan — 2026-10-05 (engineer's craft scan)

**dbt data tests and unit tests** (docs.getdbt.com), with **Great
Expectations / GX Core** in the same bracket. `docs/market/landscape.md`
still does not exist on `main` (it is inside PR #21, unmerged since
2026-09-26), so the rotation again falls back off the charter's list, and
the product was chosen to sit directly on top of the day's work: how a
data product proves the numbers it sells. Yesterday's scan covered the
AI-attribution bracket (Agent Blame, Git AI), so this is a deliberate
rotation to a different shelf rather than a second look at the same one.

**What they are.** dbt compiles each data test into a `SELECT` that is
expected to return nothing: zero rows passes, one or more rows fails, and
`dbt build` interleaves building a model with testing it in topological
order, so a failing test with `severity: error` skips everything
downstream instead of letting a bad table feed the next one. Its newer
unit tests assert transformation logic against small static inputs before
the full model is materialised. GX Core takes the declarative route
instead: an Expectation Suite names the state data should conform to, a
Checkpoint binds a suite to a batch and runs it, and Data Docs renders
every run as browsable HTML showing which expectations passed, which
failed, and the value actually observed.

**Worth stealing: the failing rows are the output, not the message.** A
dbt test does not report "3 rows violate this constraint", it hands back
the three rows. Today's gate reports `Violation.observed` as a sentence of
numbers, which is better than a boolean and worse than this: a reader who
wants to see the offending span has to go find it. The cheap version is a
`--json` flag on `src/invariants.cli.ts` emitting the violating spans
themselves, which makes a violation directly pasteable into a test as a
regression fixture. GX's second idea is worth more and costs more: a
**persisted history of validation runs**, so the question "when did this
record's arithmetic break" has an answer. Ursa has a time dimension in the
product (`src/lifespan.ts`) and none at all in its own correctness, and
the 2026-10-04 defect went unnoticed across three runs precisely because
nothing compared this run's numbers to last run's.

**Where Ursa does better, and it is structural rather than clever.** Both
products put the assertion in a file beside the data, written by hand, and
both therefore measure what someone remembered to assert. The schema
`ursa-major/src/types.ts` defines is narrow enough that today's bounds are
derivable from the type rather than from a judgement call: `survivedChars
<= totalChars <= charsWritten` is true of every record that could ever
exist, not of this dataset. There is no Expectation Suite to keep in sync,
no `schema.yml` to drift, and no coverage question about which columns were
tested, because the gate walks the whole record. The flip side, and the
honest half of this comparison, is that a fixed set of bounds cannot
express a project-specific rule the way a singular dbt test can, and
nothing in Ursa would catch a *distribution* shift — a survival rate that
is possible but ten times yesterday's. That is the same gap the persisted
-history idea above would close, which is why it is the one worth taking.

Sources: [docs.getdbt.com/docs/build/data-tests](https://docs.getdbt.com/docs/build/data-tests),
[docs.getdbt.com/docs/build/unit-tests](https://docs.getdbt.com/docs/build/unit-tests),
[docs.greatexpectations.io/docs/core/introduction/gx_overview](https://docs.greatexpectations.io/docs/core/introduction/gx_overview/),
[datacoves.com/post/dbt-test-options](https://datacoves.com/post/dbt-test-options)

### 2026-10-06 — A loop's spec is either quoted or distilled, and the record never says which
- Trigger: writing `SIGNAL_QUOTE_GROUNDED` and finding it could not require a
  quote. `src/hq/fixtures.ts` holds three `CorrectionLoop`s whose
  `discoveredSpec` is a statement in the detector's own words ("entrance
  motion may reposition an element by at most 8px"), with no conversations in
  the record for a `QuoteRef` to point at. Those loops quote nobody and are
  not defective, so "every signal carries a quote" is legitimately false and
  had to become a measurement (`signalEntriesWithoutQuote`) instead of a
  bound. See docs/design/signal-grounding.md §3.5.
- What: add `specProvenance: 'quoted' | 'distilled'` to `CorrectionLoop`.
  `specFrom` in `src/loops.ts` sets `quoted`, because it quotes a prompt by
  construction; a distiller writing a spec in its own words sets `distilled`
  and may carry zero quotes. The bound then becomes total: a `quoted` spec
  with an empty `quotes` array is a violation, and a `distilled` one with a
  non-empty array must still ground every entry in it. This matters beyond
  the gate, because the two are different products. A quote is evidence a
  lab can check against its own copy of the conversation. A distillation is
  Ursa's judgment about what the user meant, which is the distiller's output
  and carries the distiller's error rate. Selling them in one field means a
  buyer cannot tell which one they received, and `CLAUDE.md` §4 sells
  "revealed preference — behavior, not performance", which only the first
  kind is.
- First step: the field, plus the bound's two new clauses, plus one test per
  clause. Then audit what already exists: `src/hq/fixtures.ts`'s three loops
  and `src/bridge/declare.test.ts`'s one are `distilled`, and everything
  `loops.ts` produces is `quoted`, so the migration is four literals and no
  re-resolution.
- Cost: $0
- Status: proposed

### 2026-10-06 — A correction the spans can see reaches none of the signals when the trace is thin
- Trigger: `measure()` reporting `signalEntries: 0` on
  `fixtures/mini/record/outcome_record.json`, a record that carries a
  74-character `survived_mutated` span. An edit is a correction —
  `CLAUDE.md` §1 says the mutation *is* the correction — so that record holds
  one and reports none. The cause is the branch, not the detector: the
  fixture's two conversations have one prompt each, so `hasChatTrace` is
  true, `detectTraceSignals` runs and finds no cluster with two members, and
  `mutationCorrections` is never reached because it lives on the other side
  of the `if`. The two stages are exclusive, and the label-stage signal is
  the one that does not need a trace.
- What: make the stages additive rather than exclusive for the one signal
  that does not depend on a trace. `deriveSignals` runs
  `mutationCorrections` in both branches and merges its output into
  `oneShotCorrections` alongside whatever the trace produced, de-duplicated
  by `(step, domain)` so an edit the trace already explained is not counted
  twice. The note the trace stage emits gains a sentence saying how many
  corrections came from edits rather than from prompts, because the two have
  different evidential weight and a buyer should not have to guess the mix.
  The de-duplication rule is the part that needs care and is why this is not
  a one-line change: a trace-stage one-shot correction is keyed on a prompt
  step and a label-stage one on a generation's `turnIndex`, and those are
  the same ordinal space, so a naive merge would collide on exactly the
  records where both fire.
- First step: assert the defect before fixing it — a test that
  `fixtures/mini`'s record carries at least one `survived_mutated` span and
  zero signals, which pins today's behaviour so the fix has something to
  change. Then the merge, with `fixtures/mini` as the acceptance case: it
  should report one one-shot correction whose two quotes ground in the
  generation and the final file.
- Cost: $0
- Status: proposed

### 2026-10-06 — The gate re-reads the quote on the one machine the buyer will never have
- Trigger: `SIGNAL_QUOTE_GROUNDED` resolves a `QuoteRef` against
  `conversations[].prompts[].text`, `generations[].text` and `files[].text` —
  all three of which stay on the device by constraint (`CLAUDE.md`, load-bearing
  constraint 3: raw data never touches the aggregation layer). Reading
  `projectForMinor` in `src/disclosure.ts` afterwards: the only consented
  export path emits scalar buckets of `{ survived, total, generations }`
  keyed by domain, model and window. No quote crosses, so no lab can run the
  check this run just shipped, and `CLAUDE.md` §5's "publish methodology
  openly ... simultaneously the enterprise sales channel and the user trust
  proof" currently means publishing a check the buyer has to take on faith.
- What: ship the verdict, not the text. A `GroundingAttestation` block on the
  aggregate batch, carrying per-record: the record id, the gate's commit
  SHA, the eleven bound codes that ran, the count of quotes re-read, and the
  count of violations — and nothing quoted. That is a statement a buyer can
  reason about ("8 quotes were re-read against their sources on the user's
  own machine by gate `abc1234`, 0 failed") without a character of raw text
  leaving the device, and it is checkable in the one way that matters,
  because the gate is open source and the SHA says which version made the
  claim. It also gives the aggregate a reason to carry a version of the gate
  at all, which today it does not.
- First step: the shape and one honest limitation written down before any
  code. The limitation is that an attestation produced by the same party
  that produced the data is not proof, and saying so in the artifact is the
  difference between this and marketing. Then `attestationFor(record,
  violations): GroundingAttestation` in `src/invariants.ts`, carried through
  `projectForMinor` behind the existing `minor-aggregate` scope so it is
  covered by consent the user already granted or withheld, with
  `src/disclosure.test.ts` asserting the attestation contains no string from
  `rawStringsOf(record)`.
- Cost: $0
- Status: proposed

## Competitive scan — 2026-10-06 (engineer's craft scan)

**Anthropic's Citations API** (claude.com/blog/introducing-citations-api),
against **Ragas** faithfulness (docs.ragas.io) as the contrast. `docs/market/landscape.md`
still does not exist on `main` — it is inside PR #21, unmerged since
2026-09-26 — so the rotation falls back off the charter's list for the
third day running. The shelf was picked to sit on the day's work:
how a product proves a quote is a quote. Yesterday covered data-test
frameworks (dbt, Great Expectations) and the day before covered AI
attribution (Agent Blame, Git AI), so this is a third shelf rather than a
second look.

**What they are.** Citations chunks a user-supplied document into
sentences, passes them through the model with the query, and returns the
response as text blocks where each block carries citations pointing at
locations in the source — character ranges for plain text, page numbers
for PDFs, content-block indices for custom content. The load-bearing
detail is that `cited_text` is extracted from the document rather than
generated by the model, so a citation is guaranteed to point at real
source text. Ragas takes the other route entirely: its faithfulness
metric has an LLM break the response into claims, has an LLM check each
claim against the retrieved context, and scores the ratio of supported
claims to total claims, 0 to 1. Vectara's HHEM-2.1-Open, a fine-tuned T5
classifier, can replace the second model.

**Worth stealing: extracted, not generated, as a stated guarantee.**
This is the same correction this run made and did not know had a name.
`mutationCorrections` built the agent side of its quote by joining
`span.diff`'s non-added parts, which is generation — a reconstruction
that happens to usually agree with the source — and it was changed to
read the extent the record already stores, which is extraction. The
stealable part is not the technique, it is that Citations makes the
property a documented guarantee of the interface rather than a property
of one code path, and that is what let a reader of their docs know it
without reading their implementation. Ursa should state it the same way
in `types.ts`: a `QuoteRef.text` is sliced from the record, never
assembled. The second idea worth taking is the citation's *shape* —
character ranges rather than text — because a range is both smaller and
unforgeable, and `QuoteRef` carries text where it could carry
`[start, end)` into a text the record already holds. That is a real
design question and it is not free: the text is what survives redaction
of the source, and a range into a stripped conversation points at
nothing.

**Where Ursa does better, structurally.** Ragas is the comparison that
makes the point. It answers "is this claim supported by this context"
with a model, which means its verdict has a confidence and an error
rate, and it is answering a semantic question because that is the only
question available when the response was generated freely. Ursa's
question is narrower and therefore decidable: the quote either is or is
not a substring of a text in the same file, and `isExcerptOf` answers it
with `String.prototype.includes` and no model, no threshold, no score
between 0 and 1. That is not cleverness, it is the schema — a quote in
an outcome record has an address, and an LLM-generated citation in the
general case does not. Citations earns the same decidability by
construction and is the right comparison for that reason. The honest
limit on Ursa's side: a substring check proves the words were typed and
proves nothing about whether this quote is the *right* one for the loop
it is attached to, and `specFrom` picks which prompt to quote by a rule
("the loop's last statement of what was wanted, regression reports
excluded") that no bound can check. Choosing the wrong quote is still
the open hole, and it is a semantic question of exactly the kind Ragas
is built for.

Sources: [claude.com/blog/introducing-citations-api](https://claude.com/blog/introducing-citations-api),
[docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/](https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/faithfulness/),
[techcrunch.com/2025/01/23/anthropics-new-citations-feature-aims-to-reduce-ai-errors](https://techcrunch.com/2025/01/23/anthropics-new-citations-feature-aims-to-reduce-ai-errors/)

### 2026-10-06 — `model` on a source pointer is a git trailer, not a model identity
- Trigger: reading a real record while writing today's design artifact.
  `ursa-probe-2026-10-04-4d7e8b7.json` carries
  `"model": "Claude Fable 5.1 <noreply@anthropic.com>"` on every source
  pointer. Traced it: `resolveEpisode` sets `model: ep.agentMarker`, and
  `agentMarker` is whatever `marker()` returned in
  `src/pairfinder.ts:383` — the raw `Co-Authored-By` trailer value, or,
  when the trailer pattern misses and the author fallback fires, the
  commit's AUTHOR NAME. So the field can hold a model name glued to an
  email, or a person's name, and nothing distinguishes the two.
- What: this is not cosmetic, because `model` is the join key for the
  first of the three properties Ursa Minor sells. `CLAUDE.md` §4 lists
  cross-model comparison first: "what did the same user prefer between
  your model and your competitor's". A lab doing that grouping on this
  field gets one bucket per trailer spelling rather than one per model.
  Two commits from the same model with different trailer formatting are
  two models; a commit whose trailer was missing is a model named after
  a person. And the damage is silent, because every bound in
  `src/invariants.ts` reads numbers and none reads this string. Note the
  direction: it inflates apparent model diversity, which is the
  flattering direction for a dataset sold on cross-model breadth, so
  nobody downstream has an incentive to notice.
- First step: split the one field into two on `SourcePointer`. Keep the
  raw string as `agentMarker` (provenance, never joined on) and add
  `model: string | null`, parsed from it by a `parseAgentIdentity()` in
  `src/pairfinder.ts` that strips a trailing `<email>`, and returns null
  rather than guessing when the marker came from the author fallback. A
  bound in `src/invariants.ts` that fires when two source pointers in one
  record share a `conversationId` and disagree on `model`, plus a
  measurement counting pointers whose `model` is null, so "we could not
  tell which model wrote this" is a number a buyer sees rather than a
  name they trust. Run it over the seven probe records and report how
  many distinct `model` values collapse.
- Cost: $0
- Status: proposed

### 2026-10-06 — A vendored file is an import, and no span of it is anyone's correction
- Trigger: today's seven demotions, all in one file. Every rival the
  corroborator found on real history was in `docs/standards/pm.md`, and
  every one named the same commit, `b59add9`, "Re-vendor
  docs/standards/pm.md from HQ main @ 683c7dd". That file is a copy of a
  standard owned by `alexandrapaiz/alexandra-systems` (`CLAUDE.md`, "The
  holding company"). Today's change caught the seven spans one at a
  time, span by span, each needing its own blob read and its own
  verdict. The thing that was actually true is simpler and larger: the
  whole file arrived from outside, in one commit, and not one character
  of it is evidence about this user's preferences.
- What: a file-level refusal before the span-level one. A path whose
  final blob was introduced wholesale by a single commit that did not
  write it — a vendoring commit, a `git subtree` pull, a copied
  template, a generated lockfile — produces no correction signal at all,
  and resolving it span by span is both expensive and a chance to be
  wrong 47 times instead of once. The present bound is the right
  backstop and the wrong primary: it is a per-span containment test
  where the available fact is per-file. Doing it at file level also
  catches what the span level cannot, namely a vendored file whose spans
  are each too short to clear `MIN_VERBATIM_LEN` (the entry below), and
  it makes the record honest in the user's own terms, because "this file
  came from HQ" is a sentence the owner would recognise and "span 23 of
  118 was demoted" is not.
- First step: `vendoredPaths(repoPath, ep)` in a new
  `src/vendored.ts`, returning the episode's touched paths whose blob at
  `finalSha` equals the blob at some non-descendant commit of
  `generatedSha` ENTIRELY, not merely containing a span of it — one
  `git rev-parse <sha>:<path>` per candidate, comparing blob hashes
  rather than text, so it is a hash comparison and not a diff. Skip
  those paths in `resolveEpisode`'s file loop and report them in
  `renderRunSummary` as "N files came in whole from elsewhere and were
  not read as your work", naming one. Measure it on the probe: the
  prediction is that `docs/standards/pm.md` is excluded outright and all
  seven of today's demotions plus the nine `span_too_short` verdicts in
  that file disappear together.
- Cost: $0
- Status: proposed

### 2026-10-06 — Ten of the forty-seven mutation labels are too short to check at all
- Trigger: the verdict tally from today's probe, which is the first run
  of the descent bound over real history. Thirty spans came back
  `corroborated`, seven `rival`, and ten `unverified` — and every one of
  the ten is `span_too_short`, nine of them in the same vendored file as
  the seven demotions. No `unreadable_blob`, no `rival_search_capped`:
  on a complete clone the only thing stopping the check is the length
  floor, not the repository.
- What: `MIN_VERBATIM_LEN` is 12 normalized characters, and the floor is
  right for the test it guards, because a span like `return null` is
  eleven characters and appears in every TypeScript file ever written,
  so raw containment there is coincidence rather than evidence. But that
  reasoning is about the span IN ISOLATION, and a span is never
  isolated: it sits between two neighbours at known offsets. A short
  span whose neighbours on both sides are themselves rival-held is not a
  coincidence, it is the middle of an imported block. The check that
  works at any length is contiguity — does the rival blob contain this
  span's text at a position consistent with the span before it and the
  span after it — and it needs no new git reads, because the rival blob
  is already in the per-path cache by the time the question is asked.
- First step: give the corroborator the span's neighbours instead of
  just its text: change the hook's third argument to the file's span
  list and the span's index, and for a span under the floor return
  `rival` only when the immediately preceding and following spans both
  resolved to the same rival sha at adjoining offsets in that blob. Keep
  `span_too_short` for a short span with no corroborated neighbour, so
  the conservative answer is still reachable. The test is the probe's
  own ten: nine of them are interior to a vendored file and should flip
  to `rival`, and whichever one does not is the case worth reading.
- Cost: $0
- Status: proposed

### 2026-10-06 — Evaluate and refine alexandria's skills with Ursa's own pipeline
- Trigger: a board handoff from `chair:alexandria` to this seat
  (2026-10-05T03:42), carrying the owner's own words from that night —
  "I'd love to use Ursa to evaluate and refine the skills" — plus the
  concrete shape alexandria offers: a skill is a file an agent loads,
  every load is an outcome in Ursa's sense (kept, edited, or ignored,
  with a consumer's own declared satisfaction), and alexandria already
  has the provenance, the harness eval results, the consumer-reports
  lane, and the version history to hand over. This entry exists so the
  handoff has a card and an owner, per this seat's own pending-tracker
  duty (docs/standards/pm.md §5); logged rather than acted on, because
  committing Ursa's pipeline to a second product's data is a product
  decision, not a standup's to make.
- What: run Ursa's resolver over alexandria's own skills history (the
  harness skill's consumer report is, in alexandria's words, "exactly
  an outcome record in prose") and over this repo's own use of the
  harness skill, and hand back a survival signal per skill section —
  which parts a consumer acted on, which it discarded, and the
  distilled units the pipeline already produces from the accepted
  parts. Alexandria's own maintenance gate (ADR-37 there) would merge a
  proposed skill revision on its own when the eval does not regress, so
  the loop closes without a person once Ursa hands back a result.
- First step: the trial alexandria itself proposes is the cheapest one
  — run the existing pipeline, unmodified, over the one outcome record
  that already exists (this seat's own chair's harness-skill report)
  and report what it finds, before committing to building anything new
  against alexandria's `skills/*/evals/results.json` or
  `skills/*/reviews/` paths.
- Cost: $0 for the trial; a cross-repo read dependency on
  `alexandrapaiz/alexandria` if it goes further than the one trial,
  which is itself a scope question for whoever gives this a verdict.
- Status: proposed

## Competitive scan — 2026-10-06, second dispatch (engineer's craft scan)

**Software Heritage** (`archive.softwareheritage.org`), read against
today's work, with `ScanCode Toolkit` and `FOSSA`'s snippet matching in
the same bracket. `docs/market/landscape.md` still does not exist on
`main` (PR #21, unmerged since 2026-09-26), so the rotation again falls
back to the charter's list. The product was chosen for the same reason
as yesterday's: it sits directly on top of the question this run spent
the day on, which is how a tool decides that a piece of text has a
source other than the one in front of it.

**What it is.** The universal archive of source code: a crawl of GitHub,
GitLab, PyPI, Debian and more, stored as a single deduplicated Merkle
DAG. Every object has a SWHID, `swh:1:cnt:<id>` for a file's contents,
and the identifier for a blob is **git's own `sha1_git`** — the same
hash `git hash-object` computes. The archive is queryable by it:
`GET /api/1/content/sha1_git:<hash>/` answers whether that exact
content exists anywhere the crawl has reached, and
`GET /api/1/content/sha1_git:<hash>/raw/` returns it.

**Worth stealing: corroborate against a corpus wider than the clone, and
do it with the hash git already computed.** Today's bound answers "does
this text exist elsewhere in THIS repository". That is the question the
local clone can answer, and it is strictly narrower than the question
that matters, which is "did this text exist before this generation
anywhere at all". The seven demotions this run found are the vendored
case, and the archive is built for exactly that: a vendored file's blob
is almost certainly in it, keyed by a hash Ursa does not have to invent
or compute, because `git rev-parse <sha>:<path>` already prints it.
The cheapest honest version is not a span-level query at all, it is one
blob-level query per file, which is the second ledger entry above
arriving from a second direction and is why that entry is scoped at
blob-hash comparison rather than at text.

**Where Ursa does better, and it is the harder half.** Software Heritage
answers existence, and existence is a weaker fact than the one Ursa
sells. A blob in the archive tells you the content is out there; it
tells you nothing about whether a person read it and kept it, edited it,
or threw it away, which is the whole of `CLAUDE.md` §1. The archive also
cannot see the thing Ursa calls `no_generation_provenance`, text present
in the finished work that traces to no generation, because the archive
has no notion of a generation at all. Ursa is measuring an event; the
archive is indexing an artifact.

**The half that should stop us, and it is a consent problem rather than
an engineering one.** Sending `sha1_git` of a user's file to a third
party crosses the boundary `CLAUDE.md` constraint 3 draws: raw
processing happens on-device and raw data never touches the aggregation
layer. A content hash is not raw data, which is the tempting reading,
and the tempting reading is wrong. A hash is a confirmable fingerprint,
so the query discloses that this user holds a file with that exact
content, and a miss is as informative as a hit: it tells the recipient
the file is private. For a public vendored standard that is harmless;
for the file next to it in the same episode it is a disclosure the user
never consented to, performed silently, on a path chosen by a loop. So
the steal is the mechanism and not the hosted service: Ursa should keep
the blob-hash comparison and keep the corpus local, and any query that
leaves the device belongs behind the same explicit grant
`src/consent.ts` already governs, named in the ledger before it is
built, never as an ambient lookup. Worth writing down because this is
the first idea in the register whose cheapest implementation is also a
privacy regression, and the cheapest implementation is the one a future
run in a hurry would reach for.

Sources: [docs.softwareheritage.org/devel/swh-web/uri-scheme-api-content.html](https://docs.softwareheritage.org/devel/swh-web/uri-scheme-api-content.html),
[docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html](https://docs.softwareheritage.org/devel/swh-model/persistent-identifiers.html),
[docs.softwareheritage.org/devel/getting-started/api.html](https://docs.softwareheritage.org/devel/getting-started/api.html),
[en.wikipedia.org/wiki/SoftWare_Hash_IDentifier](https://en.wikipedia.org/wiki/SoftWare_Hash_IDentifier)

### 2026-10-05 — Lesson for the centralizer: a seat that claims novelty searches for its own claim
- Trigger: research seat, brief 2026-10-05. Four runs of L-R1
  coverage-area search missed *Post-edits Are Preferences Too*
  (arXiv:2410.02320, Oct 2024), a paper restating this company's
  central methods position in its title. One search aimed at the claim
  itself found it immediately.
- What: a candidate lesson for `docs/standards/lessons.md`, phrased for
  the inbox and **carrying no `L-` identifier** (per L-A18, a second
  author picking IDs is a collision generator). Binds every seat that
  owns a document making a novelty claim, not only research:
  *coverage-area search finds what is new; claim search finds what was
  already true. A novelty claim never searched for in the field's own
  vocabulary is unverified, and the cost of discovering its prior art
  lands in front of the buyer rather than in the brief.*
- Why it is filed here and not appended to the standard: the inbox
  invites any seat, but `docs/standards/` is HQ-vendored and the exo
  seat's revendor PR (#79) is open against it today. Routing through
  the ledger avoids a conflict in a file this seat does not own; the
  owner or the exo seat can carry the text up at the next harvest.
- First step: exo or the owner appends the rule text to the
  `lessons.md` inbox at the next sync.
- Cost: $0
- Status: proposed

### 2026-10-06 — An imported final file still has a discard story
- Trigger: building the file-level refusal today
  (`docs/design/vendored-paths.md`). Two existing tests failed on the
  first implementation, and both failed for the same real reason rather
  than a fixture detail. `deletion.test.ts`'s
  "a merge that deleted the whole file is still a merge deletion, not
  unknown" had the agent write a block, a merge destroy it, and the
  person restore the file from a sibling branch byte for byte. The
  refusal correctly saw an import and skipped the path, and the
  `generated_deleted` span with `cause: 'merge'` went with it. The
  finished file carried no correction, which is what the refusal
  proves. The generation still carried a real discard, which the
  refusal threw away.
- What: the refusal is sound about the FINAL side and overreaches on the
  generation side. An exact revert is the clean case: the agent wrote
  X, the person discarded all of X, and the file is now what it was
  before. The true record is a full `generated_deleted`, and today's
  code emits nothing at all for that path. The fix is to split the
  refusal in two. Skip the path from `ResolveInput.files`, so no span
  of the imported file is classified, and keep it in
  `ResolveInput.generations`, so the agent's text still gets a fate.
  The reason this is not a one-line change is the measurement in
  `docs/design/vendored-paths.md` §2.2: keeping the generation naively
  moves the whole imported document into `generated_deleted` and
  inflates the discard figure by about what the survival figure was
  inflated by before, because on the `ursa run` path a "generation" is
  the whole file blob and a vendored file's generation is itself an
  import. So the generation side needs its own test, not the final
  side's: was the generation's blob composed here, or did it also
  arrive from outside?
- First step: `vendoredPaths` already answers that question if asked
  about the generation instead of the finish. Call it a second time
  with `{ generatedSha: ep.generatedSha, finalSha: ep.generatedSha }`,
  which asks whether the generation's own blob exists outside its line
  of descent, and keep the generation only when the answer is no. Then
  relax `resolveEpisode`'s `files.length === 0` guard so a record can
  exist with generations and no final files, and change the expectation
  in `src/vendored.test.ts`'s "loses the discard story when the person
  reverts a file outright" from the cost to the fix. That test exists
  to be the thing that changes.
- Cost: $0
- Status: proposed

### 2026-10-06 — Two thirds of the headline number is a file the holding company wrote
- Trigger: counting today's probe by file before changing anything.
  Of the 93,420 characters `ursa run` reported as "survived your
  editing verbatim" over a clone of this repository, 60,616 of them
  (65%) are in one file, `docs/standards/lessons.md`. That file is
  synced into this repo from `alexandrapaiz/alexandra-systems`
  (`CLAUDE.md`, "The holding company"). The 2026-09-30 urgent entry
  named the same file as the symptom of the pairing-distance defect,
  and the pairing window fixed the distance. The file is still there,
  and it is still the majority of the number.
- What: today's file-level refusal does not catch it, and the reason is
  informative. `lessons.md` is not an exact copy of any blob outside
  the generation's descent, because the person's own commit appended to
  it in the same episode. So it is a file that is 95% import and 5%
  authorship, and both the file-level test (byte-identical, so no) and
  the span-level test (Pass 1 claims the import verbatim before
  `corroborate` is ever consulted) decline it. The missing test is
  containment rather than equality: is the finished blob a SUPERSET of
  a blob outside the line of descent, and if so, are the spans inside
  that subset the ones being credited? That is one `git diff
  <rival>:<path> <final>:<path> --numstat` per candidate, and the
  answer separates "the person appended 2KB to HQ's 54KB standard" from
  "the person wrote a 56KB document".
- First step: measure before designing. For each resolvable path in the
  probe's six episodes, compute the length of the longest common prefix
  and suffix between the finished blob and each non-descendant
  candidate blob, and print the fraction of the finished file those two
  cover. The prediction worth testing is that `lessons.md` comes back
  above 0.9 and `docs/finance/close-2026-10.md`, a file the finance
  seat genuinely wrote in its own episode, comes back near 0. If the
  separation is that clean, the bound is a threshold on that fraction
  and the spans inside the covered region are demoted as a block.
- Cost: $0
- Status: proposed

### 2026-10-06 — The record never says a file was left out, only the summary does
- Trigger: today's change writes the exclusion to
  `.ursa/episodes.json` and prints it in the run summary, and puts
  nothing in `.ursa/records/<id>.json`. A buyer reads records.
  `ursa-probe-2026-09-30-124d880.json` was simply not written this
  run, and the record that would have explained why does not exist,
  which makes the one thing a lab should be able to audit — what the
  run refused to claim and on what evidence — the one thing that only
  reaches a terminal nobody kept.
- What: this is the already-proposed 2026-10-03 entry "What a run
  excluded from history belongs in the record, not in a comment",
  now with a concrete second instance and a concrete shape. An
  `exclusions` block on `OutcomeRecord`, parallel to `durability`,
  carrying one entry per refused path: the path, the reason code
  (`imported_whole` today), the commit the content was found in, the
  relation, and the character count that left the figures because of
  it. Two consequences worth the field. First, `src/invariants.ts` can
  then bound it, because "characters excluded plus characters
  classified equals characters in the touched files" is exactly the
  kind of same-set arithmetic that module exists to check. Second, an
  episode that resolves to nothing becomes a record that says why
  rather than an absence.
- First step: the arithmetic before the field. Add a `measure()` line
  to `src/invariants.ts` reporting excluded characters per record from
  `ep.vendoredPaths`, run `npx tsx src/invariants.cli.ts` on the probe,
  and confirm the excluded count equals the 21,656 + 8,415 that left
  the probe's figures today. A field whose number cannot be
  reconciled against the figures it moved is a field that will drift.
- Cost: $0
- Status: proposed

## Competitive scan — 2026-10-06, third dispatch (engineer's craft scan)

**GitHub Linguist** (github.com/github-linguist/linguist), against
**git's own `blame.ignoreRevsFile`** as the contrast.
`docs/market/landscape.md` still does not exist on `main`, so the
charter's rotation falls back off its list for the fourth day running.
The shelf was picked to sit on today's work, because both of these
products exist for exactly the question this run spent the day on: how
do you stop attributing bulk-imported content to the person who
committed it.

Linguist is the library behind GitHub's per-repository language bar and
its blame and diff rendering. It carries two concepts Ursa has been
missing. The first is `vendor.yml`, a long list of path patterns —
`node_modules/`, `vendor/`, `third_party/`, `*.min.js`, and a few
hundred more — that Linguist excludes from language statistics by
default, with `linguist-vendored` in `.gitattributes` as the
per-repository override. The second is `linguist-generated`, which
marks a path as machine-produced and collapses it in diffs rather than
asking a reviewer to read it. Git's own facility is narrower and
sharper: `git blame --ignore-revs-file <file>`, with
`blame.ignoreRevsFile` as the config form, takes a list of commit shas
whose changes blame should look through rather than at. The convention
that grew around it is a `.git-blame-ignore-revs` file in the repo
root holding the shas of bulk reformats, and GitHub honours it.

**What is worth stealing: the declaration, not just the inference.**
Both products let the repository's owner *state* what is not their
work, instead of inferring it every time. Ursa infers, and today's
change is pure inference: a blob comparison per path per episode, with
a documented miss (`docs/standards/lessons.md`, the entry above) and a
documented overreach (the discard story, the entry above that). Git's
answer to the same class of problem is one file of shas that the owner
maintains and every tool respects. The obvious Ursa shape is a
`.ursa/not-mine` file listing paths and commits the owner declares are
imports, read by `vendoredPaths` as a first pass before any git call,
and it has a property no inference has: it is the user editing what has
been derived about them, which is load-bearing constraint 2 in
`CLAUDE.md` rather than a feature. It also costs one file read. Recorded
here as this scan's stealable finding rather than filed as its own
entry or built today, because a declaration surface the owner maintains
belongs to the consent machinery in `src/consent.ts` and to
`ursa consent`, which is a product decision for the owner and not an
ad-hoc dotfile an engineer run adds.

**What Ursa does better: the evidence travels with the verdict.**
Linguist's `vendor.yml` is a list of regexes over paths, which means it
is right about `node_modules/` and silent about a document vendored
into `docs/`. It cannot see that a file arrived from elsewhere, only
that its path looks like the kind of place such files live, and a
repository that vendors a standard into `docs/standards/` gets no help
at all. `.git-blame-ignore-revs` is the same trade in the other
direction: exact rather than heuristic, and entirely dependent on
somebody remembering to add the sha. Ursa's `VendoredPath` names the
commit, its subject, and the relation it stands in to the generation,
derived from the object graph with nothing declared in advance, and
`renderRunSummary` says it in the user's own words: "byte-identical to
its copy in commit 96ed4e5". A path-pattern list cannot produce that
sentence, and a hand-maintained sha list cannot produce it for the
import nobody remembered.

### 2026-10-07 — Every class percentage is a share of the classified part, not of the finished work, and the error is always upward
- Trigger: measuring the probe's five classified records while
  reconciling today's `exclusions` field. `stats.byClass[c].pct` is
  computed in `src/stats.ts` as `chars / coveredChars`, and
  `coveredChars` is smaller than `finalChars` on every record of the
  run. On `ursa-probe-2026-09-27-7c739cf`, `survived_verbatim.pct`
  reads `0.949` where the same characters are 0.910 of the finished
  file, because 2,706 of that file's 66,586 characters are inside no
  span. The direction is the same on all five: `+0.024`, `+0.039`,
  `+0.008`, `+0.014`, `+0.000`. The denominator is never larger than
  the file, so the error can only flatter the model.
- What: the three class percentages sum to 1.0 by construction, which
  makes them read as a partition of the finished work, and they are a
  partition of the part of it that any span covered. For the headline
  claim — "95% of this file survived verbatim" — the two readings differ
  by up to four points on real history, and the difference is the
  quantity `measure()` already reports as `finalSeparatorChars`. This
  is not the 2026-10-04 defect, which compared two different character
  sets; both numbers here are final-side. It is a denominator that is
  correct for the question "of the text we classified, what fate did it
  have" and wrong for the question a buyer asks, which is "of this
  finished file, how much is the model's". `pct` is the field a lab's
  pipeline reads first, and nothing in the record says which question
  it answers.
- First step: do not change `pct`, which some consumer may already be
  calibrated against. Add a second field beside it,
  `pctOfFinal = chars / finalChars`, computed in `src/stats.ts`, and an
  invariant in `src/invariants.ts` asserting `pctOfFinal <= pct` for
  every class with a test that fails when the two are swapped. Then
  measure both on the probe and decide which one `renderRunSummary`
  should print, because the summary currently prints character counts
  rather than percentages and is therefore not yet wrong.
- Cost: $0
- Status: proposed

### 2026-10-07 — `stats.perFile` omits the path the record excludes, so the row-level view still has a silent gap
- Trigger: today's craft scan of coverage.py 7.14.1 (below) read
  against the record this run produced. `exclusions` is a top-level
  array; `stats.perFile` is the per-path array a consuming pipeline
  iterates. On the probe, `perFile` for the five classified records
  holds exactly one path each and the excluded record's `perFile` is
  `[]`. So a reader who iterates `perFile`, which is the obvious thing
  to do, sees a record whose path list omits a path the episode touched
  and gets no signal that anything is missing. Today's change moved the
  absence from the record to one of the record's two file lists.
- What: coverage.py reports excluded statements as a column on the
  file's own row, so there is no way to read a file's coverage number
  without seeing how many statements were taken out of its
  denominator. The two cannot drift apart because they are one row.
  Ursa now has the same information in two places that a reader has to
  join by path. The shape that fixes it: an entry in `perFile` for
  every excluded path too, carrying `coveredChars: 0`, an empty
  `byClass`, and the `reason` from its `Exclusion`, so iterating
  `perFile` enumerates every path the run read rather than only the
  ones that produced spans. `exclusions` stays as the place the
  evidence lives — the sha, the subject, the relation — because that is
  not row data.
- First step: one test in `src/invariants.test.ts` asserting that the
  set of paths in `stats.perFile` equals the set in `files[]` union the
  set in `exclusions[]`, which fails today on the probe's excluded
  record. That test is the specification; the `src/stats.ts` change
  that satisfies it is four lines.
- Cost: $0
- Status: proposed

### 2026-10-07 — The per-record reconciliation closes and the run-level one is not even printed
- Trigger: building `consideredChars` today. Per record,
  `stats.finalChars + sum(exclusions[].chars)` is the size of every
  path the run was willing to read, and the gate prints both sides on
  every record. The user never sees a record. They see
  `renderRunSummary`, which prints `71,764 chars survived your editing
  verbatim` and, in a separate paragraph lower down, `1 file came in
  whole from elsewhere`. The file's size is in neither sentence. So the
  number a person actually reads has no exclusion arithmetic behind it
  at all, and the only place the sum closes is a CLI that exists for
  the gate.
- What: the run-level form of the bound — characters the run read
  equals characters it classified plus characters it refused, summed
  over every record — cannot be stated today because
  `renderRunSummary` never computes the pair. It should, for the same
  reason the per-record version exists: an excluded count with nothing
  to add back to is unfalsifiable, and 30,287 characters is 27.0% of
  what this run read, which is not a footnote. Summed over the probe's
  six records, `consideredChars` is 112,346 and `excludedChars` is
  30,287, and neither figure appears anywhere a user looks. The
  sentence to aim at is one the summary can say in the user's own
  words: "of the 112,346 characters this run read, 30,287 came in whole
  from elsewhere and were not read as your work".
- First step: sum `measure(r).consideredChars` and
  `measure(r).excludedChars` across the run inside
  `renderRunSummary`, print the pair in the paragraph that already
  names the imported files, and add a case to
  `src/invariants.test.ts`'s "the run summary never prints a pair that
  cannot both be true" block asserting the printed excluded figure is
  never larger than the printed read figure.
- Cost: $0
- Status: proposed

### 2026-10-07 — Craft scan: coverage.py 7.14.1, and exclusion as a column rather than a footnote

Scanned instead of `docs/market/landscape.md`, which does not exist on
`main` — it is the market seat's file, live only on an unmerged branch,
which is exactly why today's probe reports it as an import. The
charter's fallback list applies. `.git-blame-ignore-revs` and GitHub
Linguist were yesterday's scan and are in the entry above; today's
target is the maturest tool in the adjacent craft of *reporting a
denominator that something was taken out of*.

**What coverage.py does.** A line marked `# pragma: no cover` is still
executed and still recorded; what changes is the report. Its own
documentation states the arithmetic directly: the denominator is "the
number of executable statements minus the number of excluded
statements", and the percentage is executions over that. Two properties
follow that Ursa should want.

**The stealable one: exclusion is a column on the file's own row, not a
separate list.** `coverage report` prints statements, missing, excluded
and percent on one line per file, so a reader cannot see a file's
number without seeing how much was removed from its denominator. The
two figures are structurally inseparable. Ursa, as of today, has
`exclusions` at the top of the record and `stats.perFile` lower down,
and the excluded path appears in the first and not the second — filed
as its own entry above. The deeper version of the same idea, which
Ursa does not have at all, is that coverage.py treats "excluded" as a
*first-class outcome alongside* covered and missing, in one table,
rather than as an annotation about the table. Ursa's four span classes
in `CLAUDE.md` §1 are the covered/missing axis; the excluded axis is
currently a different array with a different shape.

**The second stealable one, smaller: exclusion has scope.** A pragma on
a line that opens a clause excludes the whole clause. Ursa's exclusion
granularity is the whole file and nothing else, which is why
`docs/standards/lessons.md` — 95% HQ import, 5% the person's own
append — escapes both the file-level test and the span-level one. That
case is already filed (2026-10-06, "Two thirds of the headline number
is a file the holding company wrote") and the region-level answer it
proposes is the same idea coverage.py got to first.

**What Ursa does better: the exclusion is proved, not declared.** Every
exclusion in coverage.py is a human writing a comment, so its report
answers "what did somebody decide not to count" and cannot answer "what
should not have been counted". A `# pragma: no cover` on code that
genuinely needs a test is indistinguishable in the report from one on a
platform branch that cannot run. Ursa's `Exclusion` is derived from the
object graph with nothing declared in advance, and it carries the
evidence to its own disproof: the commit, its subject, and the relation
that commit stands in to the generation. A reader who doubts
`imported_whole` on `docs/market/landscape.md` can run one
`git rev-parse 96ed4e5:docs/market/landscape.md` and settle it. No
coverage report has ever been falsifiable in that way, and for a
dataset sold to a lab that difference is the whole product.


### 2026-09-26 (market) — Neutrality as a named, sellable asset in the Minor pitch
- Trigger: this run's landscape watch (docs/market/landscape.md,
  Category 1). Meta's $14.3B stake for 49% of Scale AI (June 2025)
  triggered Google, OpenAI, and Microsoft to cut or scale back their
  Scale contracts on neutrality grounds alone — they could no longer
  trust that training data and roadmap details stayed away from a
  competing lab's parent company. Sources: [Computerworld](https://www.computerworld.com/article/4009714/metas-14-3b-stake-triggers-scale-ai-customer-exodus-could-be-a-windfall-for-rivals-like-mercor.html), [TechCrunch](https://techcrunch.com/2025/06/18/openai-drops-scale-ai-as-a-data-provider-following-meta-deal).
- What: CLAUDE.md §5 already names "model providers are simultaneously
  the platform, the customer, and the entity most capable of shutting
  Ursa down" as the central strategic problem, but Ursa has no equity
  or ownership tie to any single lab today and nothing in the current
  materials states that as a sellable guarantee. The Scale/Meta episode
  is a live, dated precedent that buyers act on neutrality concerns
  with real contract dollars, not just in principle. Turn the
  already-true fact (no lab holds equity in or control over Ursa) into
  a named, citable clause in whatever the Minor sales/lab-brief
  material becomes (KR4.1's one-page lab brief), with the Scale episode
  as the evidence a technical buyer can independently verify.
- First step: when KR4.1's lab brief is drafted, add a short
  "structural neutrality" section stating the ownership fact plainly
  and citing this precedent; no code or product change required.
- Cost: $0
- Status: proposed

- 2026-10-05 (market): a second, independent echo of this entry's
  pattern. Nvidia, already paying Mercor to source Nemotron training
  data, is reportedly in talks for an equity stake at a $20B
  valuation — the identical shape (a paying platform buying into its
  own data vendor) as the Meta/Scale episode this entry is built on.
  Source: [Tech Startups](https://techstartups.com/2026/08/19/nvidia-in-talks-to-invest-in-ai-data-startup-mercor-at-20-billion-valuation/).
  Worth watching whether Mercor's other lab customers respond the way
  Scale's did; if so, this entry's "structural neutrality" clause has
  two precedents instead of one. No status change (market does not own
  this entry's verdict).

### 2026-09-30 (market) — Total-addressable-spend bound for Minor's pricing target
- Trigger: this run's positioning ceremony (docs/market/positioning.md,
  "A bound on Minor's target, not a price"). Each major frontier lab
  reportedly spends roughly $1B/year on human-generated training data
  overall, and Mercor alone is now at $2B in annualized gross revenue,
  up from $760M nine months earlier. Sources:
  [Forbes](https://www.forbes.com/sites/richardnieva/2026/07/09/mercor-fundraise/),
  [Sacra](https://sacra.com/c/mercor/).
- What: no disclosed per-contract price for anything outcome-record-
  shaped exists yet (the gap named in last run's positioning entry
  still stands), but this figure bounds the question differently: a
  six-to-seven-figure deal (CLAUDE.md §4) is a rounding error against a
  $1B/year lab budget. When KR4.1's lab brief sets an ask, include this
  as a one-line sizing sanity-check so the target reads as a
  differentiation test, not an affordability test.
- First step: add a short "total addressable spend" context line to
  KR4.1's lab brief when it's drafted, citing this figure.
- Cost: $0
- Status: proposed

### 2026-09-30 (market) — Lead with portability, not transparency, in Major's positioning
- Trigger: this run's landscape watch (docs/market/landscape.md,
  ChatGPT Memory entry, Category 3). OpenAI shipped "Memory Sources"
  across all ChatGPT plans, giving users per-response visibility into
  what saved memories, past chats, or files fed an answer. Source:
  [OpenAI](https://openai.com/index/memory-and-new-controls-for-chatgpt/).
- What: this closes the transparency half of the gap Ursa Major's
  "fully inspectable" pitch (CLAUDE.md non-negotiable #2) counts on —
  OpenAI now offers a version of it inside its own walled garden. The
  half that does not close, by construction, is portability: that
  memory cannot follow a user to Claude or Gemini. Major's public
  messaging should lead with "portable across every model you use"
  rather than "fully inspectable," since the latter now describes a
  ChatGPT feature too.
- First step: when Major's site copy or pitch materials are next
  revised, test portability-first framing against the current
  transparency-first framing.
- Cost: $0
- Status: proposed

### 2026-09-30 (market) — Publish methodology against the eval-frustration quote, not just forward
- Trigger: this run's demand-signals ceremony. A widely-read builder
  post states the AI-evals complaint in almost CLAUDE.md §1's own
  language: "The benchmark was not fake. It was just answering a
  narrower question than the product needed," describing coding
  assistants and support bots that pass benchmarks and fail in
  production. Source:
  [dev.to](https://dev.to/jenueldev/ai-evals-are-broken-but-builders-still-need-them-nh3).
  Also echoed in academic framing (Princeton's "AI Agents That Matter"
  project, agents.cs.princeton.edu).
- What: CLAUDE.md §2 already names publishing methodology openly as
  simultaneously the enterprise sales channel and the user trust
  proof. This gives that content a concrete hook: open with the
  builder's own complaint about benchmarks answering the wrong
  question, then introduce the outcome record as the direct answer to
  the complaint as stated, rather than pitching the outcome record
  forward on its own terms first.
- First step: whoever next drafts public methodology content uses this
  quote (with attribution) as the opening hook.
- Cost: $0
- Status: proposed

### 2026-10-05 (market) — Lead with "symmetric," not just "portable," in Major's positioning
- Trigger: this run's landscape watch (docs/market/landscape.md,
  Claude Memory Import entry). Anthropic shipped a Claude feature
  (July 2026) that imports memory from ChatGPT, Gemini, or Grok but
  does not export anything a competitor could read back — a one-way
  acquisition funnel, not two-way portability. An independent test of
  seven memory products (Claude included) found none achieve "import
  symmetry." Sources: [PrimeTimer](https://www.primetimer.com/features/anthropic-opens-gate-for-importing-memories-from-chatgpt-gemini-and-more-to-claude-in-a-new-gamechanger-update), [dev.to](https://dev.to/stantyan/i-tested-7-ai-memory-products-for-portability-all-7-lock-you-in-31pm).
- What: "portable" is now a word a competitor can gesture at (Claude's
  own marketing can call the import feature a step toward
  portability) even though it only runs one direction. Major's pitch
  needs a word that a one-way feature cannot also claim.
  "Symmetric" — works in both directions, for free, between vendors
  with no commercial reason to cooperate — is that word, and nothing
  else in the landscape map passes the test it implies. Full reasoning
  in docs/market/positioning.md's "Symmetric portability, not
  asymmetric import" section.
- First step: when Major's site copy or pitch materials are next
  revised, test "symmetric" as the headline differentiator, named
  directly against Claude's one-way import as the contrast case.
- Cost: $0
- Status: proposed

### 2026-10-05 (market) — Cite the reward-model accuracy gap in Minor's lab brief
- Trigger: this run's demand-signals ceremony. WritingPreferenceBench
  (peer-reviewed, published 2026-08-24) found sequence-based reward
  models score 52.7% mean accuracy against human judgment on
  creative-writing preference pairs isolated from objective errors —
  barely above chance — and 14 zero-shot LLM judges score 53.9%,
  equally close to chance. Only generative reward models with explicit
  reasoning chains reach 81.8%, an architecture too expensive and slow
  to run at per-prompt pipeline scale. Source:
  [arXiv](https://arxiv.org/abs/2510.14616).
- What: CLAUDE.md §1's claim that open-ended domains have no working
  verifier today had cost-based sourcing (rlhfbook.com) but no
  accuracy numbers. This benchmark supplies one, and it is a sharper,
  more concrete line for KR4.1's lab brief than a general claim: the
  standard cheap way to grade open-ended output is close to a coin
  flip.
- First step: when KR4.1's lab brief is drafted, cite this benchmark's
  accuracy numbers as the quantified version of the "no verifier
  exists" claim.
- Cost: $0
- Status: proposed

### 2026-10-05 (market) — GDPR Article 20 / EU AI Act enforcement as a lab-facing compliance angle
- Trigger: this run's landscape watch (docs/market/landscape.md,
  cross-cutting note on the absence of a neutral portability
  standard). EU AI Act enforcement activated 2026-08-02, and GDPR
  Article 20's data-portability obligations carry penalties up to €15M
  or 3% of global turnover. Source:
  [stantyan.com](https://stantyan.com/blog/portable-ai-memory-or-permanent-lock-in/).
- What: not independently verified this run whether or how this
  specifically applies to AI memory/preference data (the source names
  the enforcement date and penalty range, not a specific AI-memory
  enforcement action), so this is a research question, not a
  confirmed angle. If it does apply, Ursa's existing consent/export
  architecture (CLAUDE.md's non-negotiable #2 and #3) may already
  satisfy obligations that labs' own single-vendor memory systems do
  not, which would be a compliance-driven reason for a lab to care
  about Ursa Major's user base beyond the data-licensing pitch alone.
- First step: before KR4.1's lab brief is drafted, have someone with
  legal/privacy context (not this seat) verify whether GDPR Article 20
  or the EU AI Act actually reaches AI-memory portability specifically,
  and whether Ursa's architecture would need any change to claim
  compliance as a selling point.
- Cost: $0
- Status: proposed

### 2026-10-07 (market) — A provenance-based trust guarantee, distinct from the equity-based neutrality pitch
- Trigger: this run's landscape watch (docs/market/landscape.md, Surge
  AI and Mercor updates). A Forbes investigation (2026-08-05, via
  aggregator, original paywalled) reported Surge AI, Mercor,
  AfterQuery, and Turing collectively sold roughly $500M/year of
  training data to top Chinese AI labs (Tencent, Alibaba, ByteDance)
  from the same contractor pools serving their US frontier-lab
  customers. Source: [aiweekly.co](https://aiweekly.co/alerts/forbes-surge-ai-mercor-afterquery-and-turing-sold-500myear-of-training-data-to).
- What: the existing neutrality entry (2026-09-26, echoed 2026-10-05)
  argues from equity — a lab buying into its vendor compromises that
  vendor's neutrality. This is a second, independent axis that needs
  no equity stake at all: the same pipeline serving a frontier-lab
  customer also serves a geopolitical rival, with no disclosure
  mechanism visible to the buyer. Ursa Minor has sold nothing yet, so
  there's no live comparison to make, but nothing in CLAUDE.md today
  commits to a no-dual-sale or single-buyer-tier guarantee a lab brief
  could cite the way it could cite "no lab holds equity in Ursa."
  Full reasoning in docs/market/positioning.md's "Trust has a
  provenance axis too, not just an equity one" section.
- First step: this is a product/policy decision, not a research one —
  flagging for the owner whether Ursa Minor should commit to (and
  later disclose) a data-provenance guarantee before KR4.1's lab brief
  is drafted, so the brief can cite a real commitment rather than an
  absence of one.
- Cost: $0
- Status: proposed

### 2026-10-07 (market) — No exploited-contractor exposure, as a trust claim distinct from "cheaper"
- Trigger: this run's landscape watch (docs/market/landscape.md,
  Mercor update). A Gazetteer SF investigation (2026-05-05, by Cydney
  Hayes, based on multiple anonymous former-employee interviews plus a
  December 2025 internal survey) reported punishing hours, abrupt
  terminations without severance, and no formal HR/payment/legal
  policy at Mercor before late 2025; Mercor's spokesperson disputed or
  contextualized several specific claims. Source: [Gazetteer SF](https://sf.gazetteer.co/new-troubles-at-mercor-infighting-face-time-slavery-and-inhumane-working-conditions).
- What: this file's existing cost-based positioning (rlhfbook.com's
  per-prompt price comparison) already argues the outcome record isn't
  trying to win on price. This is a different, trust-shaped claim: the
  solicited-labor model requires an assigned, managed, deadline-bound
  workforce to exist at all, and that workforce is a liability surface
  (the kind that produces an investigative exposé) the outcome
  record's real-work-derived signal does not carry by construction,
  since nobody is assigned the task of producing it. Worth testing as
  a line in Minor's methodology-publishing content (CLAUDE.md §2) once
  that content exists — not a pricing change, a trust-narrative one.
- First step: when methodology content is next drafted, include this
  contrast (no assigned-labor liability surface) alongside the
  existing cost and verifier-gap arguments.
- Cost: $0
- Status: proposed

### 2026-10-07 (market) — Name the distinction against Surge's new economically-valuable-work benchmarks before a buyer asks
- Trigger: this run's landscape watch (docs/market/landscape.md, Surge
  AI update). Surge AI's own blog confirms it launched three new
  benchmarks this cycle — DAYJOB, GDP.xlsx, and the "Tuesday Work
  Index" umbrella — explicitly framed around "economically valuable
  work" and whether an agent can "survive a 9 to 5." Source: [Surge AI blog](https://surgehq.ai/blog).
- What: this framing sits close enough to Minor's own language
  (CLAUDE.md §1's "writing, research, applied engineering,
  everything without a unit test") that a lab buyer skimming both
  could mistake Surge's benchmarks for a competing outcome record.
  They aren't: DAYJOB and GDP.xlsx are constructed, rubric-graded task
  sets, the exact "label supplied by a grader" structure CLAUDE.md §1
  contrasts the outcome record against. Full reasoning in
  docs/market/positioning.md's "A pitch-collision risk, not yet a
  pricing one" section.
- First step: when KR4.1's lab brief is drafted, name this distinction
  explicitly (benchmark-graded vs. outcome-record/real-work-derived)
  rather than leaving a buyer to notice the overlap unprompted.
- Cost: $0
- Status: proposed

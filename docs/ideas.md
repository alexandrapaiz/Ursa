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

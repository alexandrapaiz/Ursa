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

### 2026-09-23 — Upstream: Linear board-of-record practice to HQ (WITHDRAWN 2026-09-25, ADR-006)
- Trigger: ADR-005; the owner runs Linear across the portfolio (teams
  already exist for epitome, Alexandria, Atelier, Alexandra Systems)
- What: propose the §1f Linear mechanics as a company standard at HQ,
  replacing or amending ADR-008's GitHub-Projects default
- First step: PM carries this to HQ as a ledger note per §1c
- Cost: $0
- Status: rejected — owner abandoned Linear after one cycle (ADR-006); the repo is the board

- 2026-09-25 (chair): alexandria MCP queried for Minor; four claims with consequences recorded in docs/research/minor-training-fit.md (trace-not-label validated by Harness-Zero; adapters-not-sequential for Major imports). Connector is chair-only.

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


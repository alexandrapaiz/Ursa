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

- 2026-09-25 (chair, owner-present): overlay S0 shipped and verified end to end. `ursa bridge <project>` + https://ursa-overlay.vercel.app (ALEX team; Blob store ursa-overlay-sync, ciphertext only). Verdict reader passed the PR/FAQ acceptance test on the real n=1 record: reads as satisfied at step 730, "yesss finallyyy!! lol", unaided. One deviation from §16.2: the run channel is plain HTTP on 127.0.0.1:7817 instead of a WebSocket (same job, zero dependencies, loopback exempt from mixed-content blocking).

- 2026-09-25 (chair, owner-present): overlay S0 shipped and verified end to end. `ursa bridge <project>` + https://ursa-overlay.vercel.app (ALEX team; Blob store ursa-overlay-sync, ciphertext only). Verdict reader passed the PR/FAQ acceptance test on the real n=1 record: reads as satisfied at step 730, "yesss finallyyy!! lol", unaided. One deviation from plan 16.2: the run channel is plain HTTP on 127.0.0.1:7817 instead of a WebSocket (same job, zero dependencies, loopback exempt from mixed-content blocking).

### 2026-10-05 — Craft scan: CodeRabbit's "Learnings Added" block
- Trigger: building the run comment for the resolver Action and needing
  to decide how much the tuning-delta field should say. CodeRabbit is
  the closest comparable surface: an AI reviewer that posts a structured
  comment on every pull request and keeps a per-organization memory.
- Worth stealing: CodeRabbit makes its memory writes **visible in the
  same comment that made them**, as a collapsible "Learnings Added"
  section. The user sees what was learned at the moment it is learned,
  on the surface they are already reading. Ursa's tuning delta currently
  reports two integers ("3 new, 1 reinforced"), which is auditable only
  by going and reading `.ursa/tuning.json` — and on a runner that file
  is destroyed with the workspace, so in practice it is auditable by
  nobody. Naming the units in a collapsible block costs nothing and
  turns the delta from a number into the inspect-and-edit promise
  CLAUDE.md constraint 2 already makes.
- What Ursa does better: CodeRabbit's learnings are **stated** — you
  type your preference in a comment and it stores what you said. That is
  the stated-preference survey `docs/vision.md` §0b rejects on the third
  principle, and it inherits the known gap between what people say they
  want and what they keep. Ursa reads the edit instead of the
  explanation, so a preference the user cannot articulate still lands.
  CodeRabbit also cannot compare across models; it reviews whatever the
  human wrote, with no provenance join back to which model generated it.
- Source: https://docs.coderabbit.ai/knowledge-base/learnings

### 2026-10-05 — Name the units behind the tuning delta in the run comment
- Trigger: the craft scan above, against the comment this run shipped.
  `renderRunCommentFieldTable` prints the tuning delta as "3 new, 1
  reinforced" with no way to see which three, and on a GitHub runner
  `.ursa/tuning.json` is deleted when the job ends, so the only copy of
  the answer dies with the workspace.
- What: extend `TuningDelta` with `added: Array<{ id, statement, domain,
  polarity }>` and `reinforced: Array<{ id, statement, evidenceCount }>`,
  populated by `distillAll` from the values `mergeDistill` already
  computes, and render them inside the existing collapsed detail block as
  one line per unit. The five-field table does not change: the delta row
  keeps its counts, and the names sit under the fold. This keeps the
  comment's fixed shape while making the number checkable, and it is the
  only durable record of a model-mode run on an ephemeral runner.
- First step: widen `TuningDelta` in `ursa-major/src/ci/comment.ts` and
  have `distillAll` in `src/ci/run.ts` collect the merged axioms it
  already walks past; one test asserting the five-row table is byte-identical
  with and without the named units.
- Cost: $0
- Status: proposed

### 2026-10-05 — Resolve the pull request before it merges, as a check instead of a comment
- Trigger: writing `examples/resolve-on-merge.yml` and noticing that
  `pull_request: types: [closed]` means the record exists only after the
  decision is made. Every number in the run comment describes work that
  can no longer be changed, which makes the comment a receipt rather
  than feedback.
- What: a second trigger on `pull_request: types: [opened,
  synchronize]` that runs the same resolver over the branch's own
  commits and reports survived-verbatim against the repository's recent
  median as a non-blocking check. The signal is already computable: the
  branch carries agent commits and human edits of them before the merge
  button is pressed. A reviewer would see "this branch needed more
  correction than the last ten" while the branch is still open. Nothing
  about the record schema or the resolver changes; only the trigger and
  the rendering do. The merge-time comment stays, because acceptance is
  still declared at merge.
- First step: add `ursa ci --mode branch` that takes the window from
  `pull_request.base.sha..pull_request.head.sha` on an open pull request
  and writes a check run instead of a comment, and measure it against
  the last ten merged pull requests in this repository.
- Cost: $0
- Status: proposed

### 2026-10-05 — Make the bundle's freshness a merge gate, not a convention
- Trigger: `ursa-major/dist/ursa.cjs` is a committed build artifact and
  the Action runs it, not the source. `npm run bundle:check` exists and
  fails on drift, but nothing runs it, so the first silent divergence
  between `src/` and `dist/` would ship a resolver that is one or more
  merges behind its own tests while every test stays green.
- What: this repository has no continuous-integration workflow for
  `ursa-major` at all — `npm test` has never run anywhere but a seat's
  sandbox. One workflow running `npm ci`, `npx tsc --noEmit`, `npm test`
  and `npm run bundle:check` on pull requests touching `ursa-major/**`
  closes both gaps at once, and the bundle-check is the part that cannot
  be recovered by a careful reviewer, because the drift is invisible in
  a diff of 75,000 generated bytes.
- First step: queue it in `docs/agents/pending-workflow-changes.md`
  beside PWC-5, since the seat cannot write `.github/workflows/`, and
  specify it to run only on the `ursa-major/**` path filter so it costs
  nothing on documentation-only pull requests.
- Cost: $0
- Status: proposed

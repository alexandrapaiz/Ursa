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

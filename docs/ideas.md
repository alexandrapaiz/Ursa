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

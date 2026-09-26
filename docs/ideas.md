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

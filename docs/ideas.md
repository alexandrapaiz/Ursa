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

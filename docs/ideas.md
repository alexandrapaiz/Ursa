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

### 2026-09-27 — Who may write to the sync route
- Trigger: security seat, first audit (docs/security/audit-2026-09-27.md
  findings 2 and 6). `PUT /api/sync/<64hex>` takes a write from anyone,
  at any key, with no authentication, no rate limit, and
  `allowOverwrite: true`
- What: a write credential, or a proof that the caller holds the AES
  key, so that only the bridge that owns a blob can replace it. Two
  exposures close with it. Anyone can fill the owner's Vercel Blob
  store 2 MB at a time, billed to her, with no ceiling. And anyone who
  learns a blob id can overwrite that user's payload with bytes that
  fail authentication, after which the overlay reads "cannot decrypt"
  forever. The id travels in the request URL, so it reaches access
  logs, browser history, and any proxy between. Confidentiality is not
  at stake: AES-GCM means the server never held the plaintext and an
  attacker cannot forge valid ciphertext. Integrity and cost are.
  Decide `access: 'public'` at the same time, since a blob that also
  sits at a predictable public URL cannot be rate limited or revoked
  whatever the route does
- First step: pick the mechanism, since the rest follows from it. The
  cheap one is an HMAC over the body under a third slice of the same
  PBKDF2 output, checked by the route, which needs no new secret and no
  account. Ursa has no user accounts and finding 5 argues against
  inventing them here
- Cost: $0
- Status: proposed

### 2026-09-27 — One salt for every user
- Trigger: security seat, first audit (finding 5). `SALT =
  'ursa-overlay-v1'` is one application-wide constant in both
  `ursa-major/src/bridge/crypto.ts` and
  `ursa-major/overlay/lib/crypto.ts`
- What: the code documents this as a deliberate tradeoff and the
  reasoning holds, since the server must not learn whose blob it holds
  and so has no per-user salt to hand out. Two consequences follow
  anyway. Attacking one passphrase is attacking all of them: 600,000
  PBKDF2-SHA256 iterations is a real cost per guess, but it is paid
  once per candidate across the whole user base rather than once per
  user, and nothing in the product enforces or even measures passphrase
  strength. And two users who choose the same passphrase derive the
  same blob id and, with `allowOverwrite: true`, silently overwrite
  each other. That second one is data loss, and it arrives exactly when
  the product succeeds
- First step: a user-supplied salt the user keeps alongside the
  passphrase, or a random local one written to `.ursa/` and shown once
  for the user to save. Either ends both consequences without the
  server learning anything. Decide with the sync-route entry above,
  since both turn on what the blob id is allowed to be
- Cost: $0
- Status: proposed

### 2026-09-27 — Upgrade Next in ursa-minor past the image-optimization RCE
- Trigger: security seat, first audit (finding 7). `npm audit` in
  `ursa-minor` reports 8 advisories, 1 critical and 5 high
- What: the critical is `next` below 16.3.6, carrying unauthenticated
  remote code execution in the image optimization API when AVIF files
  are used, plus a Windows-hosted variant. `npm audit` gives 16.3.6 as
  the fix and it is not a semver-major move from the declared range;
  the high entries in `postcss` and `sharp` clear with the same
  upgrade, and `fast-uri`, `js-yaml`, and `nanoid` clear with a plain
  `npm audit fix`. The site is public and has no user data behind it,
  which is why this is a ledger entry and not a same-run fix. It was
  left for the frontend seat because a Next bump wants a PR someone can
  look at in a browser
- First step: `npm audit fix` for the three transitive ones, then
  `npm i next@^16.3.6` and a visual check of the landing page and the
  404, against the screenshots already in
  `docs/design/reviews/2026-09-24/`
- Cost: $0
- Status: proposed

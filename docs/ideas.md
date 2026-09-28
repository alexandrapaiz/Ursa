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

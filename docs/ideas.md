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

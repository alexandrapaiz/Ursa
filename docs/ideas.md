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

### 2026-09-27 — Provenance by three-way merge, not by lexical similarity
- Trigger: writing `mergeLedgers` in `tools/ledger/ledger.mjs` today. Its
  return value is `{ added, removed, conflicts }` per block, and those are
  the outcome record's span classes under different names: a block taken
  from the other branch is `survived_verbatim`, a block deleted is
  `generated_deleted`, a block edited on both sides is
  `survived_mutated`. The merge knows which is which exactly, from the
  common ancestor, with no similarity threshold anywhere. Meanwhile
  `ursa-major/src/resolve.ts` reconstructs the same classification after
  the fact by lexical matching, which is why task-001 carries 55
  uncertain spans against O1 KR1.1.
- What: for the file-write path, where Ursa does see both the file state
  before a generation and the file state after, classify spans by running
  a three-way merge instead of a diff-and-match. The ancestor is the file
  as it stood before the model's generation, one side is the generation
  the model proposed, the other side is the file as the human left it.
  Every span's class then falls out of the merge algebra rather than out
  of a similarity score, and the uncertain-span count for that path goes
  to zero by construction. Chat-only spans keep the current resolver;
  this is not a replacement, it is an exact path for the cases that admit
  one.
- First step: take one `Write`/`Edit` tool call already parsed by
  `ursa-major/src/parse.ts`, reconstruct its three inputs, run
  `diff3`-style merging over them, and compare the resulting span classes
  against what `resolve.ts` produced for the same spans on
  `fixtures/mini`. Report the disagreement count. That number is the
  whole argument.
- Cost: $0
- Status: proposed

### 2026-09-27 — The ledger wants to be a directory
- Trigger: five open pull requests (#13, #14, #16, #18, #21) were
  unmergeable today, and `git merge-tree` named the same single cause in
  every one: `docs/ideas.md`. The merge driver shipped today fixes the
  merge wherever a clone does the merging, but GitHub's own merge button
  runs without the repository's `.git/config` and will keep reporting the
  conflict.
- What: give each ledger entry its own file, `docs/ideas/YYYY-MM-DD-slug.md`,
  and generate `docs/ideas.md` from them as a read-only index. Two seats
  appending on two branches then add two different files, which no merge
  algorithm on any host can call a conflict. The merge driver stays, since
  it still covers the generated index and any repository that keeps a
  single-file ledger.
- First step: a migration script that splits the current 10 blocks into
  files, an index generator, and a rewrite of `tools/ledger/check.mjs` to
  read the directory. Gate it on the five blocked pull requests merging
  first, because the migration touches the very file they collide on.
- Cost: $0
- Status: proposed

### 2026-09-27 — One-click requeue: a dispatch workflow that drains the blocked queue
- Trigger: §8 of `docs/design/ledger-union-merge.md`. Once any one of the
  five blocked pull requests merges, `main` moves and the other four are
  stale again, so the owner needs `tools/ledger/requeue.sh --push` after
  every single merge, on a laptop with the driver installed.
- What: a `workflow_dispatch`-only workflow that runs `requeue.sh --push`
  on the runner, so draining the queue is a button in the Actions tab
  rather than a local checkout. It writes only to pull request branches
  and never to `main`. Deliberately not built today: a workflow that
  updates other seats' branches is an operating decision about who may
  move whose work, and that belongs to the owner rather than to an
  engineer run that happened to notice the need.
- First step: `.github/workflows/ledger-requeue.yml`, `permissions:
  contents: write`, one `bash tools/ledger/requeue.sh --push` step, with
  a `dry_run` input defaulting to true.
- Cost: $0
- Status: proposed

### 2026-09-27 (engineer) — Competitive scan: mem0, the memory layer with no provenance
Read today: mem0's own documentation at
`docs.mem0.ai/core-concepts/memory-operations`. It is the closest
competitor to Ursa Major's portability claim, so it is the right one to
read carefully rather than dismiss.

**What it does.** Conversations go through an LLM that "pulls out key
facts, decisions, or preferences to remember." Storage is additive: new
memories are added without overwriting or deleting existing ones.
Retrieval ranks the most relevant memories for a query.

**Worth stealing: the `infer=False` switch.** A caller can set
`infer=False` and mem0 stores the raw messages instead of running the
extraction pass at all. That is a single, legible affordance for the
user who wants the record but not the inference, and Ursa has no
equivalent today: `ursa run` always distills. An `ursa run --no-distill`
that produces the outcome record and stops short of the tuning axioms
would serve the same user, and it serves the second load-bearing
constraint in `CLAUDE.md` in its strongest form, which is not "you can
edit what was inferred about you" but "nothing was inferred about you."

**What Ursa does better, confirmed from the documentation rather than
assumed.** The docs describe no way to trace a memory back to the
message that produced it, and no way to check a memory against an
outcome. So a mem0 memory is an LLM's reading of what a user said about
themselves, which is a stated preference with the source discarded. An
Ursa span is joined backward to the specific generation that produced it
and classified by what the finished work did with it. That is the third
principle in the README, tacit intelligence, holding: the preference
shows up in action on a particular case, and mem0's extraction step is
exactly the stated-preference survey the principle warns about. The
additive-only storage model is also weaker than
`ursa-major/src/tuning/merge.ts`, which carries revocation tombstones,
so a revoked preference in Ursa is revoked rather than outranked.

### 2026-09-27 — Blocker: no seat can install a CI gate
- Trigger: today's push was rejected outright — "refusing to allow a
  GitHub App to create or update workflow
  `.github/workflows/ledger-gate.yml` without `workflows` permission" —
  after the run had written two CI workflows it had just demonstrated the
  need for. They shipped as `tools/ledger/ci/*.yml` for the owner to copy
  instead.
- What: the seat workflows grant their tokens `contents: write` and
  `pull-requests: write`, and GitHub gates `.github/workflows/` behind a
  separate `workflows` permission. So an agent seat can change every line
  of the product but cannot add the check that protects it, and every
  guardrail a run concludes is necessary becomes a manual copy step for
  the owner. That is the class of step that quietly never happens. This is
  filed as a blocker because it is invisible until a run wastes turns on
  it, as this one did.
- First step: the owner decides between two options and the answer is
  recorded as an ADR. Either add `workflows: write` to the seat workflows'
  `permissions:` block, which lets any seat run change its own CI, or keep
  the restriction deliberately and adopt `tools/<area>/ci/*.yml` plus a
  line in `docs/sprints/pending.md` as the standing convention for a
  proposed gate, so the copy step is tracked rather than assumed.
- Cost: $0
- Status: urgent

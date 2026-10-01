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

### 2026-10-01 — A merge can delete a generation, and the record blames the human
- Trigger: today's measurement watched a `union` merge silently drop three
  of five lines from a ledger entry while exiting 0 (see
  docs/design/server-side-merge-measurement.md, Finding 2). Reading the
  resolver afterwards, `ursa-major/src/pairfinder.ts:111` does
  `if (fin.parentCount > 1) continue`, and `m0.test.ts:49` asserts the
  seat "never pairs an agent commit with a merge commit".
- What: skipping merges is right for edit pairing, because a merge is not
  a human correction. But the span that a merge deleted still has to land
  somewhere, and `resolve.ts` routes every unclaimed generation segment to
  `generated_deleted`. So text that a merge destroyed mechanically is
  recorded as text the human produced and threw away. That is the single
  most load-bearing label in the artifact: `generated_deleted` is the
  negative reward signal Ursa Minor sells, and a merge-deleted span is a
  false negative in it. On any repo with real branches this is not an edge
  case, and it gets worse the more agents commit in parallel. A fifth
  classification, or a flag on the existing one, would separate "the human
  rejected this" from "a merge dropped this and nobody decided anything".
- First step: a failing test in `ursa-major/src/resolver.test.ts` that
  builds a two-branch fixture repo where a merge drops a generated line,
  and asserts that the span is not classified `generated_deleted`. Make it
  pass by carrying `parentCount > 1` through to the span as a flag.
- Cost: $0
- Status: proposed

### 2026-10-01 — A measurement harness needs an arm it is expected to fail
- Trigger: this run's own probe reported the opposite of the truth twice
  before it was correct, and both times the output looked clean. Run 1 said
  all three arms conflicted; run 2 said GitHub merged the union arm with
  both entries intact. `cmp` later showed the file recorded as GitHub's
  result was byte-identical to the probe's own local merge.
- What: what caught the error was not re-reading the script. It was the
  control arm disagreeing with the union arm on identical input, which made
  one of the two numbers necessarily wrong. Generalize it: a tool a seat
  ships to measure something carries at least one arm whose expected result
  is failure, and asserts that expectation on every run, so the harness
  fails loudly instead of reporting its own bugs as findings. This is the
  same defect class as the `toContain` assertions PR #43 found in #16's
  viewer, one level up: there the test could not fail, here the harness
  could not fail. Companion to the safe form L-A14 asks for, which is the
  `--self-test` flag in the first step.
- First step: add `--self-test` to `tools/ledger/probe-server-merge.sh`
  that runs the control arm alone and exits non-zero unless it conflicts
  both locally and at the API, then call it before the real arms. Also
  belongs in the lessons inbox for the centralizer, since
  `docs/standards/lessons.md` is a vendored copy this seat does not edit.
- Cost: $0
- Status: proposed

### 2026-10-01 — An entry's identity belongs in the entry, not in its position
- Trigger: the union splice left the `### 2026-10-01 — Probe entry BASE`
  heading in place while deleting that entry's First step, Cost and Status
  lines, and `tools/ledger/check.mjs` (PR #27) only noticed because it
  re-derives entry boundaries from `### ` headings. Had the heading been
  the line that was dropped instead, the two entries would have merged into
  one entry that passes every field check.
- What: give each ledger entry an explicit `- Id: <slug>` field in the
  contract. Then damage is detectable without trusting the heading, an
  entry-aware merge can match the two sides by identity instead of by
  heading text, and a near-duplicate pair gets an exact answer rather than
  a 0.9 Jaccard threshold. Note this is narrower than, and compatible with,
  the ledger-as-a-directory entry already proposed in PR #43: identity in
  the entry is what makes a directory's filenames meaningful, and it is
  worth having even if the file is never split.
- First step: this touches the ledger contract in `docs/standards/pm.md`,
  an HQ standard, so the first step is a proposal to the PM and the
  centralizer rather than code. The code half is one line added to
  `REQUIRED` in `tools/ledger/check.mjs` on #27's branch, once the contract
  says so.
- Cost: $0
- Status: proposed

- 2026-10-01 (engineer, craft scan): changesets, the npm release tool, read
  against today's finding rather than from memory
  (github.com/changesets/changesets, `docs/detailed-explanation.md`). It
  solves the exact problem `docs/ideas.md` has. Every pending change is its
  own file, `.changeset/UNIQUE_ID.md`, markdown with YAML front matter, and
  the aggregated `CHANGELOG.md` is generated at version time rather than
  edited by anyone. Two concurrent pull requests therefore write two
  different filenames and cannot conflict, so the project never needs a
  merge driver for its changelog at all. Worth stealing: the generated
  aggregate. Ursa keeps asking how to merge one hand-edited file more
  cleverly, and today's measurement says no driver can be both correct and
  effective on GitHub, which is the same conclusion changesets reached by
  removing the shared file instead. Where Ursa is already ahead: a
  changeset is discarded once consumed, so the history of what was proposed
  and rejected is gone, whereas the ledger's `rejected` and `urgent`
  statuses are durable and are what lets a memoryless seat avoid repeating
  a dead idea. The lesson is to generate the aggregate, not to stop keeping
  one. Honest limit on the comparison: changesets has no equivalent of the
  owner's verdict, so its files never need to be found and edited in place
  the way an `accepted` entry does.

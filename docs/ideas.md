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

### 2026-09-30 — The union is the thing CI should test, on a schedule
- Trigger: today's stack integration. GitHub computes mergeability one
  branch against `main` at a time, so with 25 pull requests open it
  reported most of them mergeable while the answer to "would these land
  together" was unknown to everyone. Run by hand,
  `tools/stack/integrate.sh` found the union green on 153 tests and a
  passing site build, and found that merge order alone moves the number
  that lands from 9 to 18. None of that was visible from the pull
  request list, and by tomorrow it is stale.
- What: run `tools/stack/integrate.sh --json` on a daily schedule and
  publish the result where the owner and the PM already look. The map is
  worth more than a pass/fail: it names which pull request is worth
  merging first (today, #27, because it unblocks twelve others), which
  conflicts are mechanical, and which belong to a named seat. A seat that
  wakes with no memory could read the latest report instead of
  rediscovering the queue, which is the L-E10 survey done for it before
  it starts.
- First step: a workflow that runs the harness on a cron, uploads the
  JSON and markdown as artifacts, and writes the table into the PM's
  pending file or a comment on the oldest open pull request. Workflow
  changes in this repo go through `docs/agents/pending-workflow-changes.md`,
  so the first step is the proposal there plus the workflow file, not a
  merge.
- Cost: $0. One scheduled run of about six minutes, inside the free
  Actions allowance for a public repository.
- Status: proposed

### 2026-09-30 — The idea ledger should be a directory, not one file
- Trigger: `docs/ideas.md` was the only conflicted file in twelve of the
  sixteen conflicts measured today, and #27's merge driver fixes it only
  for merges a human performs in a clone. A merge driver is named in
  `.gitattributes` but defined in `.git/config`, which is per-clone and
  never committed, so GitHub's own server-side merge cannot use it. The
  consequence is written in #27's own description: after every merge,
  someone re-runs `requeue.sh --push` to make the others mergeable
  again. That loop is not closable on GitHub's side.
- What: every seat charter ends with "append today's new ideas to
  `docs/ideas.md`", so every run adds lines to the end of one file, and
  git reads two appends at the same end of the same file as one
  conflicting hunk. Give each entry its own file,
  `docs/ideas/YYYY-MM-DD-slug.md`, with `docs/ideas.md` becoming a
  generated index. Two seats then add two different files, which is not
  a conflict for git, for GitHub, or for anyone, with no driver, no
  per-clone install, and no requeue loop. The conflict class disappears
  rather than being merged more cleverly.
- First step: this needs charter edits (every seat charter names the file)
  and it touches a surface whose statuses the owner controls, so the
  first step is the owner's decision, not a commit. If accepted: a
  migration script that splits the current file by `^### ` heading, an
  index generator, and the one-line change in each charter, in a single
  pull request so no seat is ever pointed at a file that has moved.
- Cost: $0
- Status: proposed

### 2026-09-30 — Lessons inbox: a substring assertion on generated code is not a test of that code
- Trigger: #16 shipped green with a `SyntaxError` in the viewer script it
  generates, which meant every `outcome_record.html` from that branch
  opened as an empty shell. Its three viewer tests were
  `expect(html).toContain(...)` substring checks, and all three passed
  against a script that could not run, because a substring check never
  parses what it finds. The defect surfaced only when #18, whose test
  executes the script, arrived in the same tree.
- What: propose to the company lessons inbox, for the ExO centralizer to
  generalize and give an identifier: when a function emits a program,
  the test parses the emitted program. That covers JavaScript in a
  `<script>` block, SQL, a generated shell script, or a rendered
  template. The safe form ships with the rule, per L-A14: extract the
  block and compile it without running it, which for JavaScript is
  `expect(() => new Function(src)).not.toThrow()` and is three lines with
  no browser and no new dependency. The generalization worth having is
  wider than escaping, and it is that a test asserting on the *text* of
  an artifact that is really a *program* has chosen the weaker of two
  available checks for no saving.
- First step: append it to the inbox at the bottom of
  `docs/standards/lessons.md` with a title, today's date, and the roles
  it binds, and no `L-` identifier, since only the centralizer issues
  those. That file is a vendored copy this seat does not edit, so the
  append belongs to the centralizer or the chair.
- Cost: $0
- Status: proposed

- 2026-09-30 (engineer, craft scan): GitHub's own merge queue is the incumbent product for the problem this run spent the day on, so it got today's scan. Verified against this repository rather than from memory: `gh api repos/alexandrapaiz/Ursa/rulesets` returns `[]`, `allow_auto_merge` is `false`, and branch protection is not readable by the Actions token, so no queue is configured. Worth stealing, and it is the whole idea of the product: a merge queue tests each candidate against the prospective post-merge state of `main` including everything ahead of it in the queue, never against current `main`. That is exactly the gap measured today, where 25 pull requests each reported mergeable against `main` and nobody knew whether the union built. Where Ursa's harness is better for this repository: the queue needs required status checks and a ruleset before it does anything, it serializes into one CI run per candidate, and its output is a verdict rather than a map. `tools/stack/integrate.sh` answers the whole-union question in one run with zero repository configuration, and it reports which pull request unblocks the most others and which conflicts are mechanical, which is what an owner deciding a merge order actually needs. The honest limit on the comparison: a merge queue prevents the broken union from ever landing, and the harness only tells you about it.

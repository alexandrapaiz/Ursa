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

### 2026-10-02 — A high fuzzy score is treated as proof of descent, and it is only proof of similarity
- Trigger: debugging today's merge-attribution fix. In the synthetic
  repo two agent branches each wrote a `formatItem` function and the
  human kept branch B's version. Branch A's generation is the one in the
  record. Its line
  `return \`- ${item.title}: ${item.claim} — so what: ${why}\`` came
  back classified `survived_mutated`, carrying a word-level diff from
  A's line to B's line, presented as the human's correction. The text in
  the final file is B's line, written by a different agent on a branch
  the human never edited. Nobody performed that diff.
- What: `resolve.ts` Pass 2 takes the best-scoring generation segment
  above THETA_HIGH and labels the span `survived_mutated`, treating
  similarity as descent. It cannot do otherwise with what it is given:
  branch B's generation is not in the record at all, because
  `resolveEpisode` builds generations only from the episode's own
  `generatedSha`. So there is no rival candidate to tie-break against
  and no tuning of THETA_HIGH helps — the evidence that would settle it
  is outside the record. This matters more than the deletion case fixed
  today. `generated_deleted` carried a false label; this carries a
  fabricated artifact, a `diff` that CLAUDE.md §1 sells as "the mutation
  is the correction" and that corresponds to no edit any human made. A
  lab training on it is training on an invented correction.
- What would settle it is the same evidence the merge fix used: git. If
  the span's text is present verbatim in some other commit's blob for
  that path, the human did not derive it by editing this generation, and
  the label should fall back to `no_generation_provenance` for this
  record rather than claim a mutation.
- First step: a test asserting that when a final span matches a
  generation above THETA_HIGH but is also present verbatim in a sibling
  commit's blob, the span is not labelled `survived_mutated`. Then add
  an optional `corroborate` hook to `ResolveInput`, injected from
  `bin/ursa.ts` exactly as `attributeDeletion` now is, so `resolve()`
  stays a pure function and the git lookup stays at the edge.
- Cost: $0
- Status: proposed

### 2026-10-02 — Nothing enforces that a pairing target descends from the generation
- Trigger: running `ursa run` over a clone of this repo. With only
  `main` fetched it found 6 work units; after fetching two unmerged
  engineer branches it found 19, which looked like cross-branch pairing.
  It was not. Checking every pair with
  `git merge-base --is-ancestor <generatedSha> <finalSha>` returned 0
  non-ancestral out of 19, and the extra episodes are legitimate pairs
  among the fetched branches' own commits. Two synthetic repos with
  sibling branches, built in both creation orders, produced 0 pairs
  rather than a bad pair. So the bug I went looking for is not there.
  What is there is that the invariant holds by accident: `listCommits`
  walks `git log --all --reverse --topo-order` and the forward scan
  accepts `commits[j]` for any `j > i`. Topo order guarantees ancestors
  precede descendants, but it says nothing about siblings, and in both
  synthetic repos git happened to place the agent commit last, which is
  why no pair formed. Ref ordering is doing the work that a correctness
  check should be doing.
- What: if a pairing target that is not a descendant of the generation
  ever is accepted, the resulting record is false throughout rather than
  wrong in one field. The generation's text is absent from an unrelated
  branch's blob, so it reads as `generated_deleted`; that branch's own
  text reads as `no_generation_provenance`, which CLAUDE.md §1 calls the
  most valuable category. Today's merge attribution cannot help, since
  no merge is involved and the two commits simply have no ancestry
  relationship. With 48 open branches in this repo and `--all` in the
  walk, the exposure grows with every branch, and the thing standing
  between it and the labels is the order git happens to emit refs in.
  The guard is one git call and it makes the invariant explicit.
- First step: in `findCommitPairs`, require
  `git merge-base --is-ancestor <generatedSha> <finalSha>` (exit 0)
  before accepting a pairing target, memoized per candidate pair. Add a
  test that constructs a sibling-branch repo and asserts the guard
  itself fires — not merely that the pair count is 0, which is what
  passes today for the wrong reason, exactly the trap the
  silent-empty-on-merge entry below describes.
- Cost: $0
- Status: proposed

### 2026-10-02 — Audit every git read for the silent-empty-on-merge failure
- Trigger: today's fix. `commitFiles` ran
  `git show --name-only --format= <sha>`, which prints nothing at all
  for a merge commit, because git shows no diff for a merge unless told
  to. It never errored and never returned a wrong path; it returned an
  empty list. That is why `findCommitPairs` appeared to refuse merges
  as pairing targets even before its explicit parent check: the merge
  reported no overlapping path, so the check never had to fire. A guard
  and a bug were masking each other, and the 2026-09-20 ledger finding
  ("the pair finder now skips merge commits, test added") recorded the
  guard as the reason when it was not.
- What: the dangerous shape here is a git invocation whose failure mode
  is empty output rather than a non-zero exit, because every caller
  treats empty as "nothing to see". `blobAt` already swallows errors
  into `null` by design. Each git read in `pairfinder.ts` should be
  exercised against a merge commit specifically, and any that returns
  empty where content exists should be fixed or documented. The general
  lesson is worth a line in the standard too: a test that passes
  because of a second defect is not evidence, and the way to tell the
  difference is to assert the guard fires, not just that the outcome
  looks right.
- First step: a test file that builds a repo with one merge and asserts,
  for each exported helper in `pairfinder.ts`, that it returns non-empty
  output for the merge commit. Then assert the parent check fires, by
  constructing a case where a merge does report an overlapping path and
  checking it is still refused as a pairing target.
- Cost: $0
- Status: proposed

- 2026-10-02 (engineer, competitive scan): **GitClear** (code-analytics
  product, the "Diff Delta" / "Line Impact" metric). No live browse was
  performed this run, so this is a craft read from prior knowledge of
  the product and should be re-checked against its current docs before
  anything is built on it. Worth stealing: GitClear's headline metric
  refuses to count mechanical change as work. It explicitly classifies
  and then discounts moved code, copy-pasted code, and churn — code
  deleted within a short window of being written — on the argument that
  a diff line is not evidence of value until you know what kind of line
  it is. That is the same move Ursa made today, arrived at from the
  opposite direction: they discount churn so a productivity number is
  not inflated, Ursa splits deletion by cause so a training label is not
  falsified. Their taxonomy is more developed than Ursa's and the next
  categories to look at are theirs: moved code and copy-paste, both of
  which currently reach Ursa's resolver as ordinary deletions and
  additions. A generation whose text was moved to another file reads as
  `generated_deleted` plus `no_generation_provenance` today, which is
  two wrong labels from one mechanical event, and it is a strictly
  harder case than the merge because no commit boundary marks it.
  Where Ursa does better: GitClear measures diffs and nothing else. It
  has no join to the model generation that proposed the line, so it can
  tell you code churned but not which model's output churned, nor
  whether the human's edit was a correction of a specific generation or
  an unrelated rewrite. Its labels are also computed by its own grader
  over heuristics; Ursa's come from whether the work kept the text. That
  is the distinction CLAUDE.md §1 rests on, and it is the reason the
  deletion cause had to be fixed rather than tuned: a grader can be
  approximately right, an outcome record claiming the human discarded
  text they never saw is simply false.

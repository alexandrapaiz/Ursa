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

### 2026-09-30 — URGENT: every pair collapses to one final commit when the agent authors everything
- Trigger: running `ursa run` against a clone of Ursa's own repo while
  building the time dimension (docs/design/span-lifespan.md §8). All
  five records came back with `closingSha == tipSha`, so durability had
  nothing to walk. The cause is not durability. An exhaustive scan of
  all 93 commits on `main`: 87 classify agent-side under
  `pairfinder.ts`'s `DEFAULT_AUTHOR`
  (`/claude|codex|cursor|gpt|copilot|github-actions|\[bot\]/i`), 6
  human-side, and of those six only 2 are non-merge commits. This
  repo's git identity is literally `claude[bot]`.
- What: `findCommitPairs` pairs an agent commit with the *next*
  non-agent, non-merge commit touching an overlapping path. In a repo
  where agents author nearly everything, that "next" commit can be
  dozens of commits and days later, and the pair then attributes the
  entire intervening history to one generation. The run on Ursa's own
  repo reports `179,360 chars survived your editing verbatim` across
  five records, nearly all of `docs/standards/lessons.md`, credited to
  single agent commits that did not write most of it. That is not a
  cosmetic error: survival is the product's headline number and the
  thing Ursa Minor sells. Same root cause as the accepted 2026-09-20
  finding "merge commits are not edits" — that fix excluded merges as
  pairing targets, which was necessary and, on an all-agent repo, left
  the far-reach problem untouched. Candidate fixes, cheapest first: cap
  the search window (pair only within N commits or M hours); require
  the final commit to be a *descendant* whose diff actually overlaps the
  agent commit's own hunks rather than merely its paths; or treat a
  repo whose human non-merge commit count is below a floor as
  unpairable and say so instead of emitting records.
- First step: add a `--max-pair-distance` option to `findCommitPairs`
  defaulting to something small, with a test asserting that the Ursa
  repo fixture yields zero pairs rather than five inflated ones, and
  make `ursa run` print why it found nothing when a repo is unpairable.
- Cost: $0
- Status: urgent

### 2026-09-30 — A decayed span is evidence against tacit acceptance
- Trigger: building `lifespan.ts` today. `signals.ts` sets
  `acceptanceBasis` from retention and `CorrectionLoop.resolution`
  carries `'accepted_tacitly'`, defined in `types.ts` as
  "shipped/retained without complaint". The new `SpanLifespan.fate`
  is exactly the counter-evidence: a span the owner retained at the
  closing commit and the work removed three commits later was not
  tacitly accepted, it was tolerated and then rejected.
- What: let `deriveSignals` read `record.durability`. A loop whose
  resolving spans all read `decayed` should not close as
  `accepted_tacitly`; it should close as `abandoned`, or stay `open`
  with the decay as its evidence. Equally, `oneShotCorrections` drawn
  from a `survived_mutated` span that later decayed are corrections the
  owner made and then discarded, which is weaker evidence than a
  correction that lasted. This is the cheapest available upgrade to the
  honesty of the acceptance label, which the vision says is never
  inferred from retention.
- First step: add `durability` to `deriveSignals`'s inputs and downgrade
  any `accepted_tacitly` resolution whose spans are all `decayed`, with
  one test built on the four-commit fixture already in
  `lifespan.test.ts`.
- Cost: $0
- Status: proposed
- Held: deliberately out of today's PR. `signals.ts` is rewritten by
  open PR #13 (sprint item 1, correction loops), and two writers on
  that file would hand the owner a conflict for no gain.

### 2026-09-30 — Report decay with error bars and a same-era baseline, not as a point estimate
- Trigger: today's competitive scan (note below) found `shelf-life`,
  which answers nearly the same question with real survival statistics,
  and the contrast is unflattering in one specific place. Today's
  `durability.decayRate` on the demo run is `0.3` computed over two
  spans. Two spans is noise, and `0.3` printed without an interval
  invites a lab to treat it as a measurement.
- What: borrow the statistical shape without borrowing the unit.
  `shelf-life` reports Kaplan–Meier survival with 95% bootstrap
  confidence intervals resampled at the commit level (because lines
  within a commit are not independent), and compares only against code
  written since the first agent commit so the eras match. Ursa should
  report `decayRate` as an interval, bootstrap-resampled at the
  *episode* level for the same independence reason, and should refuse
  to print a rate at all below a minimum tested-span count. Ursa
  already has the same-era control that `shelf-life` has to construct
  by hand: `baselineDecayRate` over `no_generation_provenance` spans is
  the owner's own prose in the same files in the same episode.
- First step: aggregate `durability` across every record in
  `.ursa/records/` into one `ursa stats --durability` view that prints
  decay with a bootstrap interval and suppresses the number below a
  floor, rather than computing intervals per record where n is tiny.
- Cost: $0
- Status: proposed

- 2026-09-30 (engineer, competitive scan): **`shelf-life`**
  (github.com/sandeepsirodia/shelf-life) — "how long does your agent's
  code survive?", survival analysis of agent versus human lines over a
  repo's own git history, `uvx shelf-life [repo]`. Attribution is by
  `Co-Authored-By:` commit trailer, the same signal `pairfinder.ts`
  uses. **Worth stealing:** its statistical honesty. It reports
  Kaplan–Meier survival with 95% bootstrap confidence intervals
  resampled at the commit level, restricts comparison to the same era
  (only code written since the first agent commit), excludes generated
  files such as lockfiles, and states four limitations in its own
  README including "survival ≠ code quality". Ursa printed a bare
  `30%` today; that is the gap, and it is the ledger entry above.
  **What Ursa does better:** the unit. `shelf-life` measures *lines*
  and attributes them to a *commit*, so it can tell you agent lines
  died faster and can never tell you which generation produced the line
  or what the owner said before it was written. Ursa's unit is a span
  joined to a `SourcePointer` — conversation, model, turn, char offsets
  — sitting inside a record that also carries the owner's verbatim
  prompts and the diff of her edit. `shelf-life` answers "did it last";
  Ursa answers "did it last, which generation produced it, what did she
  say to get it, and what did she change". Only the second is a reward
  signal. Also noted in the same scan and relevant to Ursa Minor's
  pitch: Causari's Survival Report #2 (2026-09-23) puts AI-line
  survival at HEAD at 50.0% over 14.0M of 28.0M lines across 55 public
  repos, which is a public benchmark Ursa's own numbers can be read
  against.

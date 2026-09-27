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
- Status: built (moved from `accepted` by the engineer seat 2026-09-27,
  the status transition the charter assigns to this seat. Evidence: the
  four files the First step names are all on `main` —
  `ursa-major/src/tuning/distill.ts`, `merge.ts`, `export.ts`,
  `tuning.test.ts` — and the 10 tests in `tuning.test.ts` pass under
  `npm test` at 356b3e5. The PM flagged this for the building seat in
  its 2026-09-21 grooming note, item 2, and correctly did not move it
  itself.)

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

### 2026-09-27 — Head-and-tail transcript windowing for the verdict reader
- Trigger: corpus case `v16-verdict-past-the-transcript-limit`, written
  and measured this run. `readVerdict` shows the model the first 2000
  characters of each user message (`TRANSCRIPT_CHAR_LIMIT`). A verdict
  written at the end of one long message is never shown to it, so the
  label is unreachable no matter how good the model is. The eval counts
  it as `knownMiss` rather than hiding it, and it is the only
  unreachable case in the corpus today.
- What: window each message head-and-tail instead of head-only, since a
  verdict lands at the end of a message far more often than in the
  middle: roughly 1200 characters of head, a visible elision marker,
  then 800 of tail. The cost is that character offsets stop being
  one-for-one, so `shownText` has to return a segment map (shown
  fragment plus its offset in the original) and the verbatim-span
  recovery in `readVerdict` has to search per segment. That is the
  whole reason it was not folded into this run: the offset identity is
  what makes the current span recovery provably exact.
- First step: change `shownText` to return
  `{ text: string; segments: { at: number; length: number }[] }`, thread
  the segments through the presence check, and flip `v16`'s
  `knownLimitation` off so the corpus gate proves the fix.
- Cost: $0
- Status: proposed

### 2026-09-27 — The `misread?` click is an eval case
- Trigger: two observations that met. First, plan §16.5 gives the
  overlay a `misread?` control beside the verdict line, and it produces
  nothing durable today: it opens the quoted prompt so the owner can see
  why, and her judgement evaporates. Second, today's craft scan of
  Braintrust, whose loudest feature is turning a production failure into
  a test case that runs in CI. Ursa has the better version of that
  available and is not taking it: the owner's correction of a misread is
  a label on the labeller.
- What: when the owner clicks `misread?` and disagrees with the reading,
  the bridge appends the session's prompts, the reading it produced, and
  her correction to a private case file in the same shape as
  `ursa-major/fixtures/verdicts/cases.json`. The corpus then grows from
  real use instead of from someone imagining failure modes, and the
  next engineer run's `falseSatisfied` gate is measured against cases
  the owner herself produced. Redaction rider applies: real prompts stay
  in `alexandrapaiz/ursa-private` and the public corpus cites the case
  by id.
- First step: `appendCase(caseFile, { prompts, got, correction })` in
  `ursa-major/src/evals/verdict.ts`, plus a `POST /misread` route on the
  bridge's existing 127.0.0.1 listener next to `/run`.
- Cost: $0
- Status: proposed

### 2026-09-27 — The span classifier needs the same gate the verdict reader just got
- Trigger: writing the verdict eval made the asymmetry obvious. The
  verdict reader now has 16 labelled cases and a gate that fails on a
  single fabricated label. The span classifier, which produces the
  four classifications that ARE the commercial object
  (`survived_verbatim`, `survived_mutated`, `generated_deleted`,
  `no_generation_provenance`; CLAUDE.md §1), has 12 resolver tests and
  no labelled corpus and no gate. The most valuable class,
  `no_generation_provenance`, is also the one a matching bug inflates
  most quietly: every generation the matcher fails to find turns into
  evidence that the model was never in the running.
- What: `fixtures/spans/cases.json` on the same schema idea as the
  verdict corpus, each case a small final artifact plus its generations
  plus the hand-labelled classification of every span, and
  `src/evals/spans.ts` reporting a confusion matrix across the four
  classes. The gate is the mirror of `falseSatisfied`: zero spans
  labelled `no_generation_provenance` by the resolver that a human
  labelled as having a generation behind them, because that error sells
  a lab a claim about model absence that is not true.
- First step: three cases by hand from `fixtures/mini`, whose final.md
  and two conversations are already public, labelled span by span.
- Cost: $0
- Status: proposed

## Competitive scan — 2026-09-27 (engineer, craft scan)

Scanned **Braintrust** (braintrust.dev), an LLM evaluation and agent
observability platform. Deviation from the charter's fallback rotation
worth naming: that list is inherited from alexandria and names research
tools (Elicit, Consensus, Exa, arXiv digests). `docs/market/landscape.md`
does not exist on `main` yet, so there is no Ursa rotation to follow;
an eval platform is the honest adjacency for a day spent building an
eval harness, and it is the category the market seat's landscape draft
(PR #21) should own.

**One thing worth stealing.** Braintrust's headline loop is production
failure to test case: a trace that went wrong in production becomes a
dataset row that runs in CI forever after. Ursa has a better version of
that available and is not taking it, because its correction signal is
already a click the owner makes for her own reasons rather than a
curation chore. Filed above as "The `misread?` click is an eval case."
Their datasets also carry optional expected outputs per row, which is
the same shape as this run's `truth` field; the convergence is a small
piece of evidence that the corpus schema is not eccentric.

**One thing Ursa does better.** Braintrust's label comes from a grader:
an LLM-as-a-judge, a code scorer, or a human reviewer, applied to the
output after the fact. That is exactly the preference proxy
CLAUDE.md §1 says Ursa is not selling. Ursa's label is supplied by the
artifact, because the finished work either used the generation or threw
it away, and the verdict reader does not ask anyone to grade anything.
It reads a verdict the user already gave for her own reasons, then
refuses it unless her words are literally in the trace. Braintrust needs
a grader per dataset and inherits that grader's taste. Ursa needs none,
which is the whole reason its signal is worth buying.

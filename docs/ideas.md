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

### 2026-09-23 — Upstream: Linear board-of-record practice to HQ
- Trigger: ADR-005; the owner runs Linear across the portfolio (teams
  already exist for epitome, Alexandria, Atelier, Alexandra Systems)
- What: propose the §1f Linear mechanics as a company standard at HQ,
  replacing or amending ADR-008's GitHub-Projects default
- First step: PM carries this to HQ as a ledger note per §1c
- Cost: $0
- Status: proposed

### 2026-09-24 — Finding: Ursa has no claims database, so the skill seat cannot extract
- Trigger: the skill agent's first activated run. `NEON_RO_URL` was
  unset, so per charter the run skipped extraction. Looking into why
  turned up the larger problem.
- What: the seat's whole "Data access" section is alexandria's. It
  assumes a Neon database holding silver-layer claims produced by a
  research pipeline, and it tells the seat to query that database for
  "the strongest un-extracted claim cluster." Ursa has no research
  pipeline, no claims, and no such database, and the charter's own
  activation banner says the alexandria-specific references do not
  apply here. So the unset secret is not the blocker. There is nothing
  behind the secret to connect to. Every future run of this seat will
  hit the same wall and produce the same paragraph unless the charter
  changes or the evidence source changes.
- Two ways out, and they are not exclusive. (a) Point the seat at the
  evidence Ursa actually has: its own published documents, the outcome
  records, the code, and the trial corpus, which is what this run did
  through the `evidence_scheme: repo` mechanism in
  `prompts/skill-extract.md`. (b) Decide that Ursa wants a claims
  corpus, which is a real product decision and not a docs fix, since it
  means a research pipeline this repo does not have.
- First step: owner or PM amends `prompts/skill-agent.md` "Data access"
  to name repo evidence as the Ursa source and to stop instructing the
  seat to query a database that does not exist. Charters are outside
  this seat's write surface, so it cannot make the edit itself.
- Cost: $0 for (a). Unknown and material for (b).
- Status: proposed

### 2026-09-24 — Finding: nothing renders the skills library
- Trigger: charter step 4 asks the skill agent to check that the site's
  skills parsing handles its frontmatter, and to flag rendering gaps
  rather than editing the site.
- What: there is no skills surface to check. `ursa-minor/` has `app`,
  `components`, `lib` and `public`, and no skills route anywhere, and
  `find ursa-minor -iname "*skill*"` returns nothing. A skill's
  receipts are its product, and right now they are readable only by
  someone with the repo checked out. The constraint any future surface
  has to meet is set by the evidence table in
  `prompts/skill-extract.md`: a reader clicks a ref in the body and
  lands on the cited source, which is the same auditability property
  the outcome record promises its buyers, turned on our own output.
- First step: engineer or frontend seat adds a route that lists
  `skills/*/SKILL.md`, parses the frontmatter, and renders each `[E*]`
  citation in the body as a link to its `source`.
- Cost: $0
- Status: proposed

### 2026-09-24 — Finding: two docs defects found while reading in, both small
- Trigger: the skill agent's first run read `docs/decisions.md` to find
  the ADR its own dispatch cited.
- What: two separate things, neither worth a sprint item on its own.
  (1) The dispatch identifies this seat as "ADR-22 in docs/decisions.md"
  and `prompts/research-agent.md:13` does the same. Ursa's
  `docs/decisions.md` stops at ADR-006 and has no ADR-22. ADR-22 is
  alexandria's numbering, carried across at bootstrap. The Ursa
  decision that actually activated this seat is ADR-005, "Every seat but
  sales is active" (2026-09-24). (2) `docs/decisions.md` has two
  different ADRs both numbered ADR-005, at lines 84 and 100: "Every
  seat but sales is active" and "Linear is the board of record". One of
  them needs a new number, and whichever is renumbered leaves stale
  references behind it.
- First step: PM renumbers the duplicate and fixes the ADR-22 reference
  in `prompts/research-agent.md`. Both files are outside this seat's
  write surface.
- Cost: $0
- Status: proposed

### 2026-09-24 — The ship-first rule and the branch-name rule collide
- Trigger: `prompts/skill-agent.md` requires a branch named
  `skill/YYYY-MM-DD-slug` and, separately, requires the branch, a
  commit, and a draft PR before any substantial thinking.
- What: the slug names the skill, and the skill is not chosen until the
  work is underway, so the branch has to be named before its name is
  knowable. This run guessed `outcome-record-provenance` in its first
  minute and then drafted a skill whose honest slug is
  `adjudicating-uncertain-spans`, following the rule in
  `prompts/skill-extract.md` that a slug names the work rather than the
  topic. The branch and the skill therefore disagree, which is cosmetic
  here and would be confusing across twenty runs.
- Options: allow `skill/YYYY-MM-DD-run` as the ship-first branch name
  and let the skill's own slug live in its directory, or rename the
  branch once the slug is known, which costs a force-push and a new PR
  because a PR cannot follow a renamed head. The first option is
  cheaper and loses nothing, since the directory name is where the slug
  is load-bearing.
- First step: owner or PM picks one and amends the charter.
- Cost: $0
- Status: proposed

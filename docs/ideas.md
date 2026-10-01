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

### 2026-09-30 — Finding: the pair finder misses squash merges, and its bot patterns miss Ursa's own bots
- Trigger: the skill agent's second run, writing
  `skills/running-an-outcome-record-trial` step 2, which tells a trial
  runner to test a candidate subject against the detector before
  committing to it. Testing that instruction against this repository
  turned the caveat into a defect.
- What: three things compose into a wrong label rather than a missing
  one. (1) `ursa-major/src/pairfinder.ts:108-111` excludes a pairing
  target by parent count, because a merge brings in work the human did
  not write. A squash merge has one parent, so it is not excluded, and
  it carries the agent's entire branch diff, which is exactly what that
  comment says must not be counted as the person's corrections. Squash
  is GitHub's default in many repositories and it is how this one
  lands PRs. (2) The trailer pattern at
  `ursa-major/src/pairfinder.ts:30` matches `claude|codex|cursor|gpt`.
  The wider pattern at line 31, the only one that knows about
  `github-actions` and `[bot]` names, is applied to the commit's author
  name at line 94 and never to its trailer. (3) GitHub rewrites the
  trailer on squash. This repo's `8c453f0` is a squash merge authored by
  the owner whose trailer reads
  `Co-authored-by: exo-centralizer[bot]`, which matches neither
  pattern, so it reads as a human commit editing agent work.
- Measured here, not hypothetical. Of the 88 commits reachable in a
  working clone, 78 are agent-marked non-merge commits, 8 are merge
  commits the exclusion drops, and 2 are root or graft boundaries.
  Reproduce with
  `git log --all --pretty=format:'%h%x09%an%x09%p%x09%(trailers:key=Co-Authored-By,valueonly)'`.
- Why it matters more than an empty record: on a squash-merge repo with
  bots named outside the pattern, the polarity inverts. The agent's
  whole contribution arrives inside a commit labelled human, so
  generated text is classified `no_generation_provenance`, the category
  CLAUDE.md §1 calls the most valuable, and here it would be entirely
  artifact. A confident wrong label is worse for a buyer than a thin
  record, and this is the one span class a lab cannot check against its
  own telemetry.
- First step: engineer applies the trailer pattern to the trailer as
  well as the author, adds the `[bot]` and `github-actions` alternates
  to the trailer test, and decides what a one-parent commit whose
  message ends in `(#N)` should be treated as. A test case built from
  a squash commit with a rewritten trailer is the regression guard.
  `pairfinder.ts` is outside this seat's write surface, so the skill
  documents the trap instead of fixing it.
- Cost: $0, small
- Status: proposed

### 2026-09-30 — Finding: `ursa run` reports the depth of the clone, not the history of the project
- Trigger: the same step 2. The episode count the skill asks for was
  measured in an agent's working clone, which is shallow.
- What: `listCommits` walks `git log --all`
  (`ursa-major/src/pairfinder.ts:52-58`), so the history it sees is
  whatever the fetch brought. In this run's clone `main` is grafted at
  one commit, and nothing in the code detects the graft or says so in
  the record. A run against a CI checkout, which is shallow by
  default, silently produces a record of the checkout rather than of
  the project. That lands directly on the GitHub spine milestone
  (`docs/design/product-plan.md` §5), whose whole mechanism is an
  Action firing on a merged PR in the user's own account.
- First step: engineer checks for `.git/shallow` at the start of a run
  and either refuses or records the graft boundary in the record, so a
  reader can tell a short history from a truncated one. Same write
  surface point as above.
- Cost: $0
- Status: proposed

### 2026-09-30 — Finding: one human commit can be the correction for several episodes
- Trigger: reading the pairing loop closely enough to write the skill's
  judgment section.
- What: `findCommitPairs` scans forward independently for each
  generated commit and stops at its own first match
  (`ursa-major/src/pairfinder.ts:99-127`), and agent commits are
  skipped as pairing targets at line 107. So two consecutive agent
  commits touching the same path both pair to the same following human
  commit, and that one edit is counted as the correction in more than
  one episode. Episode count is therefore not a count of distinct
  corrections. Separately, because the walk is `--all`, a branch the
  project abandoned entirely still yields episodes.
- Neither is wrong for the retention label, since the text really was
  written and really was changed. Both inflate any trajectory claim
  built on episode counts, which is the kind of claim
  `docs/beyond-preference-pairs.md` makes.
- First step: engineer decides whether a reused `finalSha` should be
  deduplicated or simply reported, and whether episodes from unmerged
  branches should be marked as such. Either way the record should carry
  the fact rather than leave it to be inferred.
- Cost: $0
- Status: proposed

### 2026-09-30 — Finding: the two capture paths accept different file extensions
- Trigger: writing the skill's step 4, which tells a trial runner to
  check the subject's file types against the chosen path.
- What: the git path reads `.py`, `.yml`, `.yaml`, `.toml` and `.sql`
  (`ursa-major/src/bin/ursa.ts:18-21`) and the session path does not
  (`ursa-major/src/cli.ts:15-18`). So a Python project's finished work
  is invisible to the session path, which is the only path that carries
  user words and turns-to-acceptance. The two paths also cap file size
  at different limits, 500KB against 300,000 characters, and only the
  session path warns when it skips
  (`ursa-major/src/cli.ts:21,67-69`, `ursa-major/src/bin/ursa.ts:23`).
  This reads as drift between two entry points rather than a decision,
  and it narrows KR1.3's pool of eligible subjects for no stated reason.
- First step: engineer either unifies the two extension sets and the
  two size caps behind one constant, or records why they differ. If
  they are meant to differ, the skill's step 4 should cite the reason
  instead of the asymmetry.
- Cost: $0
- Status: proposed

### 2026-09-30 — The evidence checker validated only the first range of a multi-range source (fixed)
- Trigger: writing a source line holding two paths, and noticing the
  checker had no way to tell the two commas apart.
- What: `skills/check-evidence.mjs` split each source line on commas
  before parsing ranges, because a comma separates two paths. A comma
  also separates two ranges of one path, so every range after the
  first was silently never checked, and
  `ursa-major/src/segment.ts:1-3,900-999` passed against a 70-line
  file. Fixing it exposed two more: `Number('')` is `0` rather than
  `NaN`, so a trailing comma invented an out-of-bounds line 0 and
  failed three sources in the first skill; and `split('\n')` counts the
  trailing newline as a line, so a citation one past the end of a file
  passed.
- All three are fixed in this PR, with the reasoning in the code's own
  comments. Recorded here rather than left silent because the checker
  is the thing that makes "skills with receipts" enforceable, and a
  checker that passes a bad range is worse than no checker. It is in
  this seat's write surface, so this entry is history rather than a
  request.
- First step: none. Verify with `node skills/check-evidence.mjs`.
- Cost: $0
- Status: shipped, this PR

### 2026-09-30 — Repeat: the skill seat's Data access section has now cost two runs the same detour
- Trigger: the skill agent's second run. `NEON_RO_URL` was unset again,
  so the run again opened by saying so and again spent itself on the
  parts that need no database.
- What: this is not a new finding. It is the 2026-09-24 entry above,
  "Ursa has no claims database, so the skill seat cannot extract",
  unchanged and now reproduced. Under L-A4 a correction that repeats
  belongs to the register and the charter that failed to bind it rather
  than to the artifact, and the same logic applies to a finding that
  repeats: the second occurrence is evidence that filing it was not
  enough. `prompts/skill-agent.md` still instructs this seat to query a
  database that does not exist, and it still points at a gold specimen
  (`skills/harness-engineering/SKILL.md`) that lives in alexandria.
  Option (a) from that entry is now load-bearing rather than proposed,
  because two skills have shipped through `evidence_scheme: repo` and
  neither could have been written any other way.
- Two of the other three 2026-09-24 findings are also unchanged. There
  is still no skills route in `ursa-minor/`, verified this run, so the
  receipts remain readable only with the repo checked out. The
  duplicate ADR-005 and the ADR-22 reference are untouched.
- The branch-name collision resolved itself in practice, in favour of
  the cheaper option. This run's dispatch named the branch
  `ursa-skill/2026-09-30-window`, which carries no slug at all, and the
  skill's slug lives where it is load-bearing, in the directory name.
  That is the run-shaped branch the 2026-09-24 entry asked for, arrived
  at by the runtime rather than by a charter amendment, so the charter
  and the practice now disagree in the other direction.
- First step: unchanged. Owner or PM amends `prompts/skill-agent.md`
  "Data access" to name repo evidence as the Ursa source, replaces the
  gold-specimen pointer with `prompts/skill-extract.md`, and reconciles
  the branch-name rule with what the runtime actually does. All three
  are charter edits, outside this seat's write surface.
- Cost: $0
- Status: proposed, second occurrence

**Third occurrence, 2026-10-01.** `NEON_RO_URL` was unset again and the
third run opened by saying so again. Nothing above has changed: the
charter still names a database Ursa does not have and still points at a
gold specimen in alexandria, and `ursa-minor/` still has no skills
route, verified again this run. Three skills have now shipped through
`evidence_scheme: repo`. At three occurrences the First step above is
not a proposal any more, it is a charter defect that has consumed the
same opening paragraph three times, and L-A4 puts it on the register
rather than on the runs.

### 2026-10-01 — Finding: the viewer's four tiles carry three denominators and are not a partition
- Trigger: the skill agent's third run, writing
  `skills/quoting-a-number-from-an-outcome-record`. The skill's whole
  subject is what a record statistic is a share of, so the first thing
  it did was read the surfaces a reader actually quotes from.
- What: `ursa-major/src/viewer.ts:147-166` renders four tiles in one
  row. The first three are `stats.byClass[*].pct`, each divided by
  `coveredChars`, which is final-work text
  (`ursa-major/src/stats.ts:51`). The fourth is
  `stats.generated.deletedPct`, divided by total generated chars, which
  is model-output text (`ursa-major/src/stats.ts:53-54,86-91`). The
  distribution bar immediately below, at `viewer.ts:168-176`, contains
  only the three. So the tiles and the bar disagree about how many
  categories exist, and the tiles are the ones a reader screenshots.
  The underlying schema is right: `SpanClass` has three members and
  `generated_deleted` is a `GenerationFate`
  (`ursa-major/src/types.ts:5-14`).
- Measured here. On `fixtures/mini` the tiles read 41.2, 24.0, 34.7 and
  30.0 percent, which sums to 130. Reproduce with
  `cd ursa-major && npx tsx src/cli.ts --id fix-mini --final fixtures/mini/final.md --conversations fixtures/mini/conversations --out /tmp/rec`.
- Why the fixture hides it: covered final chars come to 308 and total
  generated chars to 307, so the two denominators nearly coincide and
  the four tiles look commensurable. Anyone sanity-checking the viewer
  against the only public fixture finds nothing wrong. A real record
  with a different generated-to-final ratio will not be so kind.
- Why it matters: KR2.2 makes one record publicly browsable and this
  viewer is what a buyer will see. KR4.1 asks the lab brief to explain
  the four span classes, and the honest explanation is that the
  taxonomy has two sides counted over different populations. Four
  percentages presented as one partition is the kind of thing a
  first audit catches, and auditability is the product.
- First step: frontend or engineer separates the deleted tile from the
  three class tiles visually, and labels each tile with its
  denominator, for instance "of classified final text" against "of
  generated text". The distribution bar is already correct and is the
  model to follow.
- Cost: $0, small
- Status: proposed

### 2026-10-01 — Finding: uncertain and trivial have span counts but no char totals, so no adjusted share can be computed
- Trigger: same run. Step 4 of the new skill tells a writer to subtract
  the low-confidence populations from a category before quoting it, and
  the schema does not support the subtraction.
- What: two flags place low-confidence spans inside ordinary
  categories. A below-threshold best match is labelled
  `no_generation_provenance` and flagged `uncertain`
  (`ursa-major/src/resolve.ts:160-167`). A short exact match is
  labelled `survived_verbatim` with a score of 1 and flagged `trivial`
  (`ursa-major/src/resolve.ts:111-123`). `Stats` reports
  `uncertainSpans` and `trivialSpans` as span counts only
  (`ursa-major/src/types.ts:118-119`,
  `ursa-major/src/stats.ts:25-26,41-42`), and no character total is
  computed for either. Since every published percentage is in
  characters, the counts cannot be netted out of any percentage. It has
  to be redone by hand from `files[].spans`, and nothing checks the
  arithmetic.
- Why it matters: both flags inflate in the commercially convenient
  direction. `uncertain` inflates `no_generation_provenance`, which
  CLAUDE.md §1 calls the most valuable category. `trivial` inflates
  `survived_verbatim`, which reads as the model doing well. Task-001
  carries 55 uncertain spans and KR1.1 exists to adjudicate them, so
  until that lands every `no_generation_provenance` share in the corpus
  is an upper bound rather than a measurement, and nothing in the
  record says so.
- First step: engineer adds `uncertainChars` and `trivialChars` to
  `Stats` beside the existing counts, computed in the same loop that
  already increments them, and has the viewer print the adjusted range
  on the affected tiles. Two numbers, one loop, and it turns a hand
  derivation into a field.
- Cost: $0, small
- Status: proposed

### 2026-10-01 — Finding: the uncovered fraction is systematically larger for code than for prose, which biases the mixed corpus
- Trigger: same run, working out whether `byClass` percentages from two
  records may be put in one table.
- What: `coveredChars` excludes every character no span covers, and the
  schema says so (`ursa-major/src/types.ts:112-117`). In code mode a
  span is a trimmed non-empty line, so indentation and blank lines
  belong to no span (`ursa-major/src/segment.ts:21-33`). In prose mode
  spans are sentences. Mode is chosen by file extension
  (`ursa-major/src/segment.ts:13-15`). The two modes therefore leave
  different fractions of a file outside every denominator.
- Measured on this repository. `src/stats.ts` 13.6 percent uncovered,
  `src/types.ts` 9.6 percent, `src/match.ts` 6.1 percent,
  `docs/beyond-preference-pairs.md` 2.7 percent,
  `fixtures/mini/final.md` 1.9 percent. So roughly 6 to 14 percent for
  code against 2 to 3 percent for prose. The reproduction script is in
  the new skill's judgment section.
- Why it matters: KR1.3 requires five or more records with at least two
  on the prose path, which means the corpus is built to be read across
  modes. A difference of a few points between a code record and a prose
  record can be segmentation rather than signal, and KR2.1 re-grounds
  the methods document's claims in exactly that mixed corpus. Separately
  the CLI prints covered final chars and never prints `finalChars`
  (`ursa-major/src/cli.ts:128-134`), so the size of the gap is
  invisible to anyone reading the console.
- First step: engineer prints `finalChars` beside `coveredChars` in the
  CLI summary and the viewer, so the gap is visible wherever a
  percentage is. Whether to change segmentation is a separate and
  larger question, and this entry does not ask for it. The skill's
  interim rule is to compare like modes.
- Cost: $0, small
- Status: proposed

### 2026-10-01 — Finding: turnsToAcceptance does not count turns to acceptance
- Trigger: same run, step 8 of the new skill, which tells a writer to
  read a field's definition rather than its label.
- What: `turnsToAcceptance` is computed as a maximum of `turnIndex`
  over the generations that have any surviving characters at all
  (`ursa-major/src/stats.ts:68-70`). The schema's own comment is
  accurate and says "latest assistant turn that contributed surviving
  text" (`ursa-major/src/types.ts:139-140`). The label is not. Both the
  CLI summary and the viewer's table head call it turns-to-acceptance
  (`ursa-major/src/cli.ts:135`, `ursa-major/src/viewer.ts:340`), and
  CLAUDE.md §1 lists turns to acceptance as trajectory metadata the
  artifact carries. One surviving character in a late generation sets
  the field, so it is an upper bound on where surviving text came from
  and not a count of turns the user needed to get there.
- Why it matters: it is one of the four trajectory metadata items the
  artifact is sold on, and it is the one a lab would use to compare
  models on how fast they converge. Shipped under this name to a buyer
  who computes it differently, it is a wrong number rather than a
  narrow one. The schema is already honest, so the whole defect is in
  the two labels and in CLAUDE.md's wording.
- First step: engineer renames the field or the labels so the two
  agree. `lastSurvivingTurn` matches what it computes. If real
  turns-to-acceptance is wanted it is a different derivation, probably
  off the correction loops that resolver v2 will emit, and that is a
  separate item rather than a rename.
- Cost: $0, small
- Status: proposed

### 2026-10-01 — Finding: byModel shares never sum to one and the remainder is unlabelled
- Trigger: same run, checking whether `byModel.pctOfCovered` can serve
  the cross-model ratio the methods document promises.
- What: `byModel` accumulates chars only from spans that carry a
  `source` (`ursa-major/src/stats.ts:43-46`), and divides by
  `coveredChars`, which includes the spans that carry none
  (`ursa-major/src/stats.ts:80-85`). So the model shares are shares of
  the whole classified text and the missing remainder is the
  `no_generation_provenance` category. On `fixtures/mini` the shares
  are 46.8 and 18.5 percent, summing to 65.3, and the gap is exactly
  the 34.7 percent no-provenance share. The viewer's column head reads
  "% of covered" (`ursa-major/src/viewer.ts:350`), which is literally
  true and does not tell a reader that the column is not meant to sum.
- Why it matters: the cross-model claim in
  `docs/beyond-preference-pairs.md:189-193` is a ratio of survival
  rates on the same user's work, which is the relative price between
  two models and the thing only a cross-model layer can quote.
  `pctOfCovered` looks like it answers that and does not. A reader who
  treats the column as a model-share breakdown concludes that a third
  of the work came from somewhere unaccounted for.
- First step: engineer adds a trailing row or footnote giving the
  unattributed remainder by name, so the column visibly sums to one.
  The survival-rate ratio the methods document actually promises wants
  its own surface and is a larger item.
- Cost: $0, small
- Status: proposed

### 2026-10-01 — Two skill descriptions both claim the deletion-rate comparison prompt
- Trigger: same run. `prompts/skill-extract.md` §5c, added this run,
  asks for one near miss per adjacent skill. Writing the sixth prompt
  for `running-an-outcome-record-trial` turned up a collision rather
  than a boundary.
- What: "the new record says 7 percent deleted, the first said 82
  percent, did the model get better" is fire-prompt 3 of
  `running-an-outcome-record-trial` and, in the same shape, fire-prompt
  3 of `quoting-a-number-from-an-outcome-record`. Both descriptions
  claim it. The overlap is real rather than a wording slip, because the
  question has two halves: the capture paths differ, which is the trial
  skill's fact, and the two rates are shares of different generation
  populations, which is the quoting skill's. Neither half alone answers
  the user.
- `skills/adjudicating-uncertain-spans` needed no new near miss. Its
  near miss 5, written on 2026-09-24, is already this run's skill's
  trigger, which is a small piece of evidence that the first run read
  the area correctly before the area had three skills in it.
- Why it matters: §5c exists because a false positive between siblings
  sends the load to the wrong skill and the right one never runs. A
  prompt both siblings claim is the same failure one level up, and it
  resolves by whichever description matched more strongly, which is a
  property of the wording rather than of the work.
- First step: owner or the next skill run rules on the boundary and
  edits one description. The interim order is in `skills/README.md` and
  puts the trial skill first, since it owns the capture-path fact the
  quoting skill cites as evidence. Not resolved this run because the
  edit lands in a file belonging to a pull request the owner has not
  merged.
- Cost: $0, small
- Status: proposed

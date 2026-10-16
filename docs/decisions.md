# Decisions — Ursa

## ADR-001 — Ursa joins Alexandra Systems; combined repo; dormant roster (2026-09-18)

**Decision.** Ursa Major and Ursa Minor are combined in this repo
(`ursa-major/`, `ursa-minor/`), to be split when their cadences diverge.
The repo is made public. Ursa adopts the Alexandra Systems PM standard
(docs/standards/pm.md, vendored @ HQ) and installs alexandria's full
11-seat roster with every schedule stripped: seats exist, none runs
without owner dispatch. Charters are inherited verbatim and adapted at
activation, seat by seat, by the owner's merge.

**Reasoning.** Owner directive. Rollout priority 1 in the company queue
(HQ ADR-007 as amended). Installing dormant preserves the near-identical
inheritance from alexandria while forcing an explicit activation
decision per seat, after the OKR walkthrough with the owner.

**Owner:** Alexandra. **Status:** accepted.

## ADR-002 — Activation wave 1: okr, pm, exo (2026-09-18)

**Decision.** The first three seats are activated in the playbook order
the owner confirmed in the OKR walkthrough: okr (monthly, 1st of the
month), pm (weekly, Monday morning), exo (weekly, Sunday). Their
charters are adapted from the alexandria inheritance to Ursa (product
surfaces, north star, competitor set, boundaries), their workflows gain
cron schedules, and docs/okrs/README.md defines the OKR artifact
format. The builder seats (engineer, research, market, frontend,
security, skill, finance, sales) stay dormant, owner-dispatch only,
until the governance spine has run at least one full cycle.

**Reasoning.** Walkthrough of 2026-09-18: missions set (vision.md
§0–§1), objectives O1–O4 committed, activation order decided. The OKR
seat's first run turns the committed objectives into the Q4 2026 file;
the PM seat's first run opens the first sprint against it; the ExO seat
audits both. Scheduled runs still require the CLAUDE_CODE_OAUTH_TOKEN
repo secret, which only the owner can create; until it exists the
schedules will trigger and fail loudly, which is the intended signal.

**Owner:** Alexandra. **Status:** accepted on merge of the activation
PR; her merge is the activation.

## ADR-003 — Launch-based capture; building only; git as the interface (2026-09-18)

**Decision.** Ursa Major v0 is launch-based, not ambient: the user
selects a finished project and launches a run (`ursa run <project>`
locally, or the PR-merge-triggered Action in their own GitHub
account). No background daemon on a timer, no reading of chats the
user did not hand over. Scope is building, not chats in general;
Codex and Claude Code live in git, so git is the interface and the
episode boundary (commit pairs), with opt-in crons possible later.
The distiller is bound by the principles of intelligence (vision.md
§0b); the output end-goal is being reworked so tacit knowledge is
carried by examples and survival evidence, never flattened into
freestanding stated rules. n=2 is the alexandria project.

**Reasoning.** Owner directive: users will not want an always-on
process reading everything; explicit launch respects consent and
matches how builders actually work. The first distillation
(ursa-private, trial/task-001/trajectory.md) shows the value lives in
loops, quotes, discovered specs and tacit closures — the form rules
destroy.

**Owner:** Alexandra. **Status:** accepted (directed in session).

## ADR-004 — "Tuning" replaces "taste" everywhere (2026-09-20)

**Decision.** The word for what Ursa Major extracts, stores, and
delivers is *tuning*, not *taste*. Ursa Major's mission reads "Import
your tuning into every model." The rename applies to prose, code
identifiers (`TuningRecord`, `TuningUnit`, `renderTuningBlock`), file
and directory names (`src/tuning/`, `.ursa/tuning.json`,
`tuning.md`, `tuning-digest.md`), the plan, the decks, and the surfaces.
Historical minutes were renamed too so the repo has one vocabulary.

**Reasoning.** Owner directive. The thing captured is the user's
in-chat fine-tuning of an agent, reverse-engineered; "tuning" names the
act and the artifact at once, and it sits naturally beside RLHF's own
vocabulary. "Taste" read as aesthetic preference, which is narrower
than what the record holds.

**Owner:** Alexandra. **Status:** accepted.

## ADR-005 — Every seat but sales is active (2026-09-24)

**Context.** Owner, the same night the engineer cadence went to twice a day (HQ ADR-035): "plz activate seats for ursa." Ursa was bootstrapped with every seat installed and all but pm, okr and exo dormant, waiting for the OKR walkthrough and for building to start. Building has started (engineer runs daily since 2026-09-24, twice a day from now on).

**Decision.** engineer, research, frontend, market, skill, security and finance are ACTIVE: charter headers flipped, crons live and staggered (research Tue+Fri 13:15 UTC; frontend Mon+Thu 14:15; market Wed 13:35; skill Thu 13:55; security Sun 15:15; finance monthly on the 1st, 11:30; engineer 11:26 and 23:26 daily). The PM may dispatch all of them by criteria (its charter §0b). **sales stays dormant**: Ursa is private R&D and never for sale (ADR-001); a sales seat has nothing to sell.

**Consequences.** Ursa's weekly load rises from roughly three runs to about fifteen on the shared Claude subscription; the PM's daily standup and the no-ship tripwire are the two places a throttled or failed run shows up within a day. Each newly active seat's first run is a smoke run by definition: the PM's next standup reads them and proposes fixes to charters that were written before the seat ever ran.

## ADR-006 — Ursa is a subcompany of Alexandra Systems Company; HQ's reach is legitimate (2026-09-24)

**Context.** Owner: "please note ursa is a subcompany of alexandra systems company which generalizes ops. expect for interference from them/contact."

**Decision.** Recorded in CLAUDE.md §0, the README, and every charter: HQ generalizes operations; standards pushes, lessons syncs, HQ seat PRs, chair messages on HQ's behalf, and host dispatches are expected and binding within a standard's scope; conflicts resolve to the standard unless an Ursa ADR records a deviation. Ursa keeps its mission, product decisions and ledger verdicts; the owner keeps the merge.

**Consequences.** Seats stop treating HQ traffic as noise or as an unknown actor (Ursa PR #2's stranding and the "unknown dispatcher" hesitation in earlier runs are the failure this prevents). The company interface (HQ ADR-027) is the mechanism; `company.yaml` here names the secrets and services HQ may expect.

## ADR-005 — Linear is the board of record; builders build from it (2026-09-23)

**Decision.** Ursa's work queue lives in Linear (workspace Alexandra
Personal, team URSA), maintained by the PM seat every run per charter
§1f: sprint items become issues with self-contained descriptions,
dispatch instructions carry the issue identifier, statuses move with
dispatch, PR, and merge, and owner-only actions each get an `[owner]`
issue synced from pending.md. The repo remains the source of truth for
specs; Linear is the queue the owner watches and builder agents draw
from. Seats reach Linear through its GraphQL API with the
LINEAR_API_KEY repo secret; without the secret the sync is skipped and
said so, never a run failure.

**Reasoning.** Owner directives: "please make sure pm updates in
linear" and "based on it builder agents will build." This supersedes
the company default of GitHub Projects as the board layer (HQ ADR-008)
for Ursa; the deviation is recorded here per docs/standards/pm.md and
proposed upstream via the ledger. First board seeded 2026-09-23 by the
chair: project "Q4 2026 — prove the record, publish the method",
issues URS-1 through URS-7 from sprint-2026-09-21 and pending.md.

**Owner:** Alexandra. **Status:** accepted (directed in session).

## Finding — the skill seat's Data access section was never adapted to Ursa, and the finding never reached `main` (recorded 2026-10-08, PM pass)

Not an ADR: no decision is asked of the owner here beyond what's
already named in `docs/sprints/pending.md`. Recorded under §1c's
instruction to log a deviation between the vendored standard's
assumption and Ursa's practice, since this one has now cost four
independent runs the same opening paragraph.

**What's wrong.** `prompts/skill-agent.md`'s "Data access" section is
inherited verbatim from alexandria: it tells the seat to query a Neon
database of silver-layer claims via `NEON_RO_URL`. Ursa has no research
pipeline and no such database. ADR-001 already says charters are
"inherited verbatim and adapted at activation, seat by seat" — the
skill seat's own activation banner even states the alexandria-specific
references "do not apply here" — but the Data access section itself was
never edited to match. It is the one section of the charter that
contradicts its own banner.

**How long it's gone unfixed.** First found 2026-09-24 (PR #14, first
Ursa skill run), reproduced 2026-09-30 (#50), 2026-10-01 (#64), and
again 2026-10-08 (#140, which undercounts it as "the third consecutive
run" — it's the fourth). Every one of those four PRs correctly
identified that the fix is a charter edit outside the skill seat's
write surface (`prompts/` is Tier C), and every one filed a ledger
entry asking for it. None of those ledger entries ever reached `main`:
#14 closed unmerged, #50 and #64 are still open but stuck on #14's dead
branch, and #140 (open, mergeable) is the first of the four actually in
a position to land. Fourteen days, four findings, zero charter fixes —
not because nobody found it, but because the PRs carrying the finding
kept getting stuck for unrelated reasons.

**What's already working as a substitute.** All four skills shipped so
far used `evidence_scheme: repo` (citing paths and line ranges in this
repository) instead of a claim id, because there's nothing else to
cite. That's a real, in-use answer to "what does this seat's evidence
section need to say instead" — the fix is closer to documenting what
already happened than to designing something new.

**Handoff.** This seat can't edit `prompts/skill-agent.md` (Tier C).
Handed to Ursa's exo seat by board message (its weekly run is Sunday,
2026-10-11) to draft the charter edit for the owner's merge, per §16's
vendoring role. Also named directly in `pending.md`'s top three, since
the normal route has had 14 days to land this and hasn't.

**Status:** open, handed to exo. Closes when `prompts/skill-agent.md`'s
Data access section is amended on `main` to name `evidence_scheme:
repo` as Ursa's actual evidence source, with the Neon path documented
as what to do only if a `NEON_RO_URL`-backed pipeline is ever stood up.

## ADR-006 — Linear abandoned; secrets move to Infisical (2026-09-25)

**Decision.** Two owner rulings. (1) Linear is abandoned as the board
of record after a one-day trial (ADR-005 partially reverted): the
2026-09-24/25 cycle shipped six PRs from five seats with Linear
non-functional throughout, so the repo's own machinery (sprint file,
pending.md, dispatch-queue.md, labels, milestones) is the board. The
PM charter §1f is rewritten accordingly, LINEAR_API_KEY is removed
from workflows and deleted from the repo, the Linear project's open
issues are canceled with a pointer here, and the HQ upstream proposal
is withdrawn. (2) Secret management moves to Infisical as the source
of truth: secrets live in an Infisical project and sync to GitHub
Actions through Infisical's native GitHub integration, so workflows
keep reading `secrets.*` unchanged. The owner holds the Infisical
account; seats never see it.

**Reasoning.** Owner verdict on Linear: "nully useful" — the board
duplicated the repo and its one integration point (the API key) failed
twice at the paste step, a cost with no observed benefit; the
frameworks law (a framework must never consume more than the work it
organizes) applies. Infisical centralizes the growing secret set
(CLAUDE_CODE_OAUTH_TOKEN, OPENROUTE_*, SLACK_WEBHOOK_URL, EXO_TOKEN)
with rotation and audit in one place.

**Owner:** Alexandra. **Status:** accepted (directed in session).

## Finding — the re-vendored PM standard names dispatch tools this repo does not have (recorded 2026-10-12, PM pass)

Not an ADR: no decision is asked of the owner here, only a gap named
under §1c's instruction to log a deviation between the vendored
standard's assumption and Ursa's practice.

**What's wrong.** This pass re-vendored `docs/standards/pm.md` to HQ's
current text (PR #170, merged). The new §11.5 tells the standup to run
`tools/gh-actions.sh workflow run agent-<seat>.yml ...` and
`tools/gh-actions.sh run list --limit 30` in place of bare `gh`,
because the Claude Code action overwrites `GH_TOKEN`/`GITHUB_TOKEN`
with a scoped installation token and the ambient `gh` therefore cannot
start another workflow run; the wrapper is supposed to pick the right
credential so a seat never has to know this. The new §11.2 also names
`tools/check-merge-queue.sh` for merge state and references
`tools/check-actions-reach.sh` for diagnosing a 403. None of the three
exist anywhere in this repo (`ls tools` returns only `ledger/` and
`stack/`). Until they land, a seat following the new standard's exact
commands would fail on a missing script, not on the credential problem
the standard is describing.

**Why this run didn't try to write them.** The scripts are described as
shared tooling, not product-specific ones, and §16 names the exo
centralizer as the owner of cross-company machinery; inventing a local
copy here risks a second, divergent implementation of the same wrapper
HQ is already building (its harvest handoff this same morning mentions
a `company-checks` workflow it is adding at HQ). This is a gap to flag,
not one day-sized item to improvise around.

**What to do until they land.** Dispatch and the standup's Actions
reads keep using bare `gh` as before; a `403: Resource not accessible
by integration` on a workflow-dispatch call is the known symptom
(§11.5's own description) and is not, on its own, evidence that the
grant is missing.

**Handoff.** Named here and in `docs/sprints/pending.md`'s top three so
the next PM pass or the exo centralizer's own weekly run can pick it
up; not raised as a separate board message this pass, since the
inbox reply already sent (the merge confirmation) covers the action
this run actually took and this finding is net-new evidence rather
than an answer to anything addressed to this seat.

**Status:** open. Closes when `tools/gh-actions.sh`,
`tools/check-merge-queue.sh`, and `tools/check-actions-reach.sh` (or
HQ's equivalent distribution mechanism) land in this repo, or when an
ADR records that Ursa keeps using bare `gh` on purpose.

## Finding — every seat's workflow is missing `allowed_bots`, so no PM dispatch can ever start one (recorded 2026-10-12, Monday ceremony)

Not an ADR: the fix touches `.github/workflows`, which is not this
seat's writable surface, so no decision is asked of the owner here,
only a gap named under §1c.

**What's wrong, confirmed by firing a real dispatch rather than
inferred from a grep.** Earlier passes today (`pending.md`'s
2026-10-12 ~02:49 UTC entry) found `grep -c '^allowed_bots'` returns 0
against `agent-security.yml` and `agent-frontend.yml` and read that as
a wall blocking two seats specifically. This ceremony dispatched
`agent-security.yml` for real (run
[38309881650](https://github.com/alexandrapaiz/Ursa/actions/runs/38309881650))
to test it directly, and it failed in 16 seconds with: "Action failed
with error: Workflow initiated by non-human actor: github-actions
(type: Bot). Add bot to allowed_bots list or use '\*' to allow all
bots." `allowed_bots` is an input to `anthropics/claude-code-action`,
not a key any workflow in this repo sets, and `grep -rn allowed_bots
.github/workflows/*.yml` returns nothing at all across all eleven
`agent-*.yml` files, not only the two named before. So the gate is
not narrower than it looked. It is wider: **no seat's workflow can
ever be started by a PM dispatch (`gh workflow run ...`), because the
triggering actor is always a bot or app token when the call is made
from inside an Actions run**, regardless of which seat is targeted or
which token signs the call.

**Why this wasn't caught sooner.** `PM_DISPATCH_ENABLED` has been
`true` for a limited window and most dispatch candidates this
organization has written stayed queued rather than fired, for reasons
unrelated to this gate (open-PR stops, missing tools, no live
candidate). This is the first dispatch this ceremony is aware of that
actually reached the Claude Code action's own actor check.

**What this changes about today's dispatch queue.** The security
dispatch above counts as this seat's one dispatch for the day under
the three-a-day ceiling and failed for infrastructure reasons, not a
process violation; no rerun fired, per §11.7 (configuration causes are
asked of HQ, never retried). A second candidate (frontend, PR #141)
was not fired this run, because it would fail identically for the same
company-wide reason, not a seat-specific one, and burning a second
dispatch to re-confirm a now-confirmed finding would be noise.

**Handoff.** To `alexandra-systems/exo-centralizer` by board message,
same destination as the still-unlanded `tools/gh-actions.sh` gap
above: add `allowed_bots: '*'` (or the specific bot id/name this
organization's dispatches run as) to every `agent-*.yml`'s
`claude-code-action` step, company-wide, since the Actions-token
mechanism in §11.5 and this gate are two different fixes for the same
symptom and HQ already owns the first one.

**Status:** open. Closes when `allowed_bots` is set in the seat
workflows (or HQ's equivalent fix lands), or when an ADR records a
different mechanism for starting a dispatched run.

**Update, 2026-10-13 ~12:23 UTC.** HQ's exo-centralizer named the root
cause: a GitHub App installation token, the kind every `agent-*.yml`
run carries, cannot write `.github/workflows/` on any branch regardless
of its `permissions:` block, which is also why this seat was never able
to apply the fix itself even inside its own writable-surface boundary.
The guard has since landed on HQ's own nine `alexandra-systems` seat
workflows via `alexandra-systems#164` (still unmerged there). Ursa's
own eleven workflow files and fifteen action steps are confirmed still
at zero and are queued to HQ's product manager, not opened against this
repo this run. Full detail in `docs/agents/incidents.md` Incident 13's
second addendum. Still open.

**Update, 2026-10-14 ~18:2x UTC.** HQ's exo-centralizer opened the
Ursa-specific fix, PR #192: `actions: read` plus `allowed_bots:
"github-actions[bot]"` on every `claude-code-action` step across all
eleven `agent-*.yml` files, nothing else, green and clean against
`main`. The handoff named this seat as the merger. This pass read the
diff and confirmed it matches that description, then declined to merge
it anyway: the run's own operating instruction is "never touch
secrets or workflows," stated beside "never merge your own PR" and
"never push to main," and a workflow-file change reads as squarely
inside that boundary regardless of what the vendored standard's Tier B
line would otherwise allow. Said so on the board as an `ask` to
exo-centralizer naming that someone who can touch workflows, the owner
or a chair, needs to be the one to merge it. Still open, one PR away
from closing.

**Update, 2026-10-15 ~06:26 UTC.** Unchanged twelve hours later. #192
is still green and clean and still waits on the owner or a chair for
the same reason: this seat's own run-level boundary against touching
workflow files is read as standing above what the vendored standard's
merge-authority section (§21, already vendored into this repo's copy
of `docs/standards/pm.md`) would otherwise permit a PM seat to do.
Section 21 having landed here changes what this seat is allowed to
merge in general — this pass used it to merge #196 (plain product code,
no workflow path) under Tier B without waiting on anyone — and it does
not change the narrower, more specific instruction this run carries
about workflows and secrets specifically. Not re-asking exo-centralizer
again without new evidence; the standing ask is enough.

**Update, 2026-10-15 ~15:32 UTC.** Unchanged again, this time read from
the scheduled GitHub Actions standup rather than a host six-hour pass.
#192 is still `MERGEABLE`/`CLEAN`. One new fact, named for completeness
rather than because it changes anything: this run's own environment has
`PM_DISPATCH_ENABLED` exactly `true`, where the host passes today found
it unset in theirs. That has no bearing here — the question is who may
merge a workflow-file change, not whether a dispatch may fire — and the
same question has no bearing on dispatch either, since any seat this
run could dispatch would land on a workflow that still lacks
`allowed_bots` until #192 itself merges. Still open, still one PR away
from closing, still the owner's or a chair's to merge.

**Update, 2026-10-15 ~18:25 UTC.** Unchanged again, this time from a
host six-hour pass. #192 is still `MERGEABLE`/`CLEAN`, still waiting on
the owner or a chair for the same reason. Two other pull requests that
would otherwise be this seat's to merge under §21 turned out to carry
the same kind of boundary, for a different reason: #199 and #184 both
edit a file under `prompts/` directly (`skill-extract.md` and
`research-agent.md`), which is a charter edit regardless of how clean
or green the rest of the diff is, so both wait on the owner the same
way #167 already did. This pass did find two real Tier B actions to
take elsewhere — engineer's #198 merged, skill's stale #140 closed as
superseded — so the standing boundary on workflows and charters is not
blocking everything, only the specific pull requests that touch those
two surfaces.

**Update, 2026-10-16 ~12:2x UTC.** Unchanged again, now across six
passes and three run environments. #192 is still `MERGEABLE`/`CLEAN`,
still the one pull request that would clear Incident 13's dispatch
wall, still not re-asked this pass because nothing about the facts has
moved since the last ask. #199, #184 and #167 are unchanged too: all
three still touch a file under `prompts/` directly, #167 is also still
`CONFLICTING` and sits with a standing handoff to the exo seat (its own
PR #201 proposes the rebase but has not landed). #80 (`company.yaml`)
stays on the roster-and-secrets carve-out. The sprint's own milestone
(`Sprint 2026-10-12`, due 2026-10-18) is now two days out with item 3
still open on security's revived branch (#190), which this same wall
would also block if a PM dispatch tried to wake it — not a new fact,
the same one named in `docs/sprints/dispatch-queue.md` every pass this
week, just closer to the date now.

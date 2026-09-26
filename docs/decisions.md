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

## ADR-007 — Slack carries prose from the PM, not just run reports (2026-09-26)

**Context.** Owner, mid-window: "communications are pretty dead on
slack. theres no chatting there, only one-line run reports." The
existing pattern (this and other seats posting single-line run
summaries) technically satisfied "post a report" while leaving the
channel unreadable as a place a person would actually check for what
the team is doing.

**Decision.** From this directive on, in every synchronous window and
by extension every run that posts to Slack: the PM talks like a
colleague, not a logger. Concretely, each window posts (1) the
window's plan in three to six sentences of plain prose, first person,
no bullet lists; (2) each dispatch, as it fires, in one sentence naming
the seat, what it's for, and why now; (3) anything needed from the
owner, phrased as a direct question; (4) a closing paragraph when the
run stops. `SLACK_WEBHOOK_URL` (already an Infisical-synced secret per
ADR-006) is the mechanism; posts go via a plain `curl -s -X POST`
with a JSON `text` field.

**Reasoning.** A channel that only ever prints one-line run reports
reads as a log, not a team, and the owner is trying to run this
synchronously as a team. The fix is a communication-style change, not
new infrastructure — no new secret, no new service, cost stays $0.

**Consequences.** This run (the 2026-09-26 sync window) already posts
this way; it is recorded here so the practice survives past this
window rather than living only in one session's memory, and so
`prompts/pm-agent.md` can be amended by the owner's merge to state it
as a standing charter rule rather than a one-off. Other seats that
post to Slack should follow the same shape once their charters are
amended; this ADR does not itself edit any charter.

**Owner:** Alexandra. **Status:** accepted (directed in session).

**ADR-007 amendment (owner, 2026-09-26): "make the slack prose be in
bullets, otherwise it is a lot of stuff to read."** Correction to the
decision above, same day: every Slack post is bullets, one line each,
five bullets at most per post — plan, dispatches, what's needed from
the owner, closing paragraph all become five-bullet-or-fewer lists,
never paragraphs. Every PR description opens with a five-bullet
summary; the run report posts those same bullets rather than
composing separate prose for Slack. The three-to-six-sentence prose
form above lasted about ten minutes of the same window before the
owner corrected it — recorded so the next run doesn't reintroduce
paragraphs from this entry's first version.

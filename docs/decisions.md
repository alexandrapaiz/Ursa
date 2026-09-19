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

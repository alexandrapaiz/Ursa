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

**Update, 2026-10-16 ~15:2x UTC: #192 merged, and the wall it named is
down — but dispatch is still not possible, for the other reason this
file already names.** The owner merged #192 herself at 14:16:58 UTC
today, on her first afternoon back (`gh pr view 192 --json mergedBy`
confirms `alexandrapaiz`, not this seat). `docs/agents/incidents.md`
Incident 13 is closed in this same pull request on that evidence: every
`agent-*.yml` in this repo now carries `allowed_bots:
"github-actions[bot]"`, confirmed by `git show` on the merge commit.

That is not the same thing as dispatch working, and this pass checked
rather than assumed. The sprint's open item (security, #190) met every
§11.3/§11.4 criterion this pass walked fresh — due this week, the
owning seat hasn't run via Actions since before the sprint started, its
one open PR is a draft and the instruction names it by number and says
to build on it — so this pass fired the real command rather than
queuing a fourth proposal:

```
gh workflow run agent-security.yml -f owner_instructions='...'
```

It failed immediately: `HTTP 403: Resource not accessible by
integration` on the `.../actions/workflows/.../dispatches` endpoint
itself, before any workflow run was created. That is not the
actor-type rejection Incident 13 described (this call never reached a
workflow run at all, so there was nothing for `allowed_bots` to admit
or refuse). It is the symptom this file's **first** open finding above
("the re-vendored PM standard names dispatch tools this repo does not
have") already named: the Claude Code action overwrites this run's
`GH_TOKEN`/`GITHUB_TOKEN` with its own installation token before this
seat ever gets a shell, and that token's scopes (confirmed directly:
`GH_TOKEN="$GH_TOKEN" gh api user` also 403s "Resource not accessible
by integration") don't include starting another workflow run. §11.5's
named escape hatch, an env var carrying the original job token
(`DEFAULT_WORKFLOW_TOKEN` there, `OVERRIDE_GITHUB_TOKEN` in this run's
own environment), is present as a name but empty as a value here, and
`tools/gh-actions.sh` still does not exist in this repo (`ls tools`:
only `ledger/` and `stack/`), so there is no wrapper to route around it
either.

So: two independent walls, one now gone. Incident 13 (allowed_bots) is
closed. The token-scope wall (this file's first finding, still open) is
the sole remaining blocker, confirmed by a live attempt rather than
inferred from a diff, and it is unchanged by anything that happened
today. Handed to `alexandra-systems/exo-centralizer` again on the board
this pass, naming this exact 403 as the first dispatch to actually
clear Incident 13 and hit the second wall cleanly, with nothing else
in the way to confuse the two.

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

**Update, 2026-10-16 ~14:26 UTC.** Still unchanged on every fact named
above: #192 still `MERGEABLE`/`CLEAN` and unmerged, #199/#184/#167
still touch `prompts/` directly (#184 now shows `MERGEABLE`/`CLEAN`
rather than conflicting, but that does not change which tier it sits
in), #167 still `CONFLICTING` with its own rebase PR #201 still open,
and #190 still a draft two days from the sprint milestone. The one new
fact this pass: the owner posted to the whole company, through
`chair:hq-console`, that she was out eleven days for surgery, has
started work again today, and that her own merges resume this
afternoon. That bears directly on every line above once she acts on
it, but nothing above has moved yet as of this pass, so the standing
asks are not repeated.

Her message also carried a standing instruction unrelated to any open
PR: when a seat's Kimi route runs out, route it to Sonnet on her own
subscription rather than failing or waiting. Checked against this
repo's own workflows rather than assumed: every `agent-*.yml` file,
including this seat's own, already runs the open-routed Kimi step with
`continue-on-error: true` and a second step gated on that step's
failure or absence that runs on the Claude subscription token instead.
Ursa's fallback already does what she asked before she asked for it;
no workflow change follows from this on this seat's side.

**Update, 2026-10-17 ~00:2x UTC, host six-hour pass.** Checked whether
this run's own credential shape changes anything about the token-scope
wall above, since a host pass authenticates as `gh` logged in to
`alexandrapaiz` rather than as the Claude Code action's installation
token. It does not clear the wall, and it adds a small new fact rather
than removing the old one: `gh variable get PM_DISPATCH_ENABLED` on
this host token returns `403: Resource not accessible by personal
access token`, so this surface cannot even confirm the dispatch switch
is on, let alone fire a dispatch past the wall this file already
tracks. The host token and the Actions installation token fail on two
different permissions (reading a repository variable here, starting a
workflow run there), which says the gap is in what each credential is
scoped to do, not in one specific API call. Not spending this pass's
one real test on firing blind with the switch state unconfirmed; the
candidate (security, sprint item 3, PR #190) is unchanged from the
2026-10-16 attempt and the fix for either wall is still HQ's
machinery, already named to `alexandra-systems/exo-centralizer`. This
is folded into the standing handoff as new evidence, not opened as a
second one. #199 and #167 are unchanged too (`CONFLICTING`, still
editing `prompts/` directly); #210 is new since the last pass, also
edits `prompts/research-agent.md` directly, and sits with the same
two for the same reason, `MERGEABLE`/`CLEAN` or not.

**Update, 2026-10-17 ~14:1x UTC, scheduled standup (GitHub Actions
`pm-agent`, this file's own run type). The token-scope wall is closed.**
Checked the three facts that changed since the 2026-10-16 live attempt
rather than assuming the wall still stands. First, `DEFAULT_WORKFLOW_TOKEN`
is non-empty in this run's environment (`[ -n "$DEFAULT_WORKFLOW_TOKEN" ]`
true), where every earlier Actions pass found it present as a name but
empty as a value. Second, confirmed directly that the ambient `GH_TOKEN`
(the Claude Code action's installation token) still 403s on
`gh api user` exactly as before — that half of the finding has not
changed. Third, used `GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN"` explicitly, the
exact substitution §11.5 describes for the missing `tools/gh-actions.sh`
wrapper (still absent: `ls tools` shows only `ledger/` and `stack/`), and
fired `gh workflow run agent-security.yml -f owner_instructions='…'` for
real. It returned a run URL, not a 403:
`https://github.com/alexandrapaiz/Ursa/actions/runs/39039722291`. The
same substitution fired a second dispatch at `agent-exo.yml` roughly
three minutes later (§11.4 spacing), also for real work (PR #167's
stale conflict), not as a second test of the same fact.

So the wall was never un-fixable; it was that every prior Actions pass
read `DEFAULT_WORKFLOW_TOKEN` as empty and had no live reason to retest
it once it stopped being empty. This pass had both: a non-empty value
and a dispatch criterion that actually fired (§11.3's "two or more open
PRs on one scope, none merged," true for both security — #190, #214 —
and exo — #201, #213). Handing this to `alexandra-systems/exo-centralizer`
as a correction to the standing handoff, not a new incident: the fix was
already in the run's own environment, the missing piece was a pass
willing to use the named variable instead of the ambient one once it had
a real value and a real reason to try. Recommending the standing handoff
close once the centralizer confirms this holds on another Actions seat,
not just the PM's own workflow.

## Finding — eight of Ursa's charters still name the bare role as their branch prefix, not the registered seat name (recorded 2026-10-18, PM message pass)

`alexandra-systems/exo-centralizer` handed this seat a list of eight
Ursa charters whose branch-naming line names the bare role rather than
the company-qualified seat name the runtime actually dispatches onto,
measured with a new HQ instrument (`tools/check-branch-prefixes.sh`,
landed on `alexandra-systems#233`) that reads every seat's manifest and
diffs it against the charter the manifest points at. Not taken on the
centralizer's word: grepped all eight files on this branch directly and
found exactly the lines it named, no more and no fewer.

| File | Line | Reads today | Should read |
|---|---|---|---|
| `prompts/engineer-agent.md` | 64 | `engineer/YYYY-MM-DD-slug` | `ursa-engineer/YYYY-MM-DD-slug` |
| `prompts/finance-agent.md` | 66 | `fin/YYYY-MM` | `ursa-finance/YYYY-MM` |
| `prompts/market-agent.md` | 75 | `market/YYYY-MM-DD` | `ursa-market/YYYY-MM-DD` |
| `prompts/okr-agent.md` | 93 | `okr/YYYY-MM` | `ursa-okr/YYYY-MM` |
| `prompts/pm-agent.md` | 20 | `pm/sprint-YYYY-MM-DD` | `ursa-pm/sprint-YYYY-MM-DD` |
| `prompts/pm-agent.md` | 76 | `pm/standup-YYYY-MM-DD` | `ursa-pm/standup-YYYY-MM-DD` |
| `prompts/pm-agent.md` | 206 | `pm/sprint-YYYY-MM-DD` | `ursa-pm/sprint-YYYY-MM-DD` |
| `prompts/sales-agent.md` | 59 | `sales/YYYY-MM-DD` | `ursa-sales/YYYY-MM-DD` |
| `prompts/security-agent.md` | 64 | `sec/YYYY-MM-DD` | `ursa-security/YYYY-MM-DD` |
| `prompts/skill-agent.md` | 48 | `skill/YYYY-MM-DD-slug` | `ursa-skill/YYYY-MM-DD-slug` |

This is not cosmetic: the centralizer found a second, related defect in
`tools/no-ship-tripwire.sh`, the check that credits a self-merged pull
request back to the run that opened it by matching the branch against
the seat's declared prefix as a fallback. A charter that names a prefix
no branch ever carries makes that fallback match nothing, so a run that
shipped by self-merge can be reported as having shipped nothing. The
centralizer has already fixed the tripwire's own separate bug (it was
stripping the first character of an unquoted prefix) on its own pull
request; this finding is the charter half of the same mismatch, and it
is still open.

This seat is not making the edit itself. `docs/standards/pm.md` §9 and
this seat's own charter both reserve a charter's text to the owner's
merge; a seat proposes in the ledger and does not write `prompts/`
directly, which is why this table exists instead of a diff. Pull
request 234 (exo) already touches `prompts/pm-agent.md` on this branch,
but for an unrelated reason, restoring a dropped merge-state clause in
section 0b, not any of the three lines above, so applying this finding
does not collide with it. Logged in `docs/sprints/pending.md` as an
owner-action alongside #234, so one pass through the owner's queue can
take both.

## Finding — the manifest handoff was wrong, the correction was right, and the file the correction named still isn't here (recorded 2026-10-18, PM message pass)

`alexandra-systems/exo-centralizer` opened a handoff saying
`company.yaml` declares a schedule for ten seats whose workflows carry
no live cron, and asked this seat to run the vendored checker and mark
those seats `dispatch-only`. By the time this pass read its inbox, the
same sender had already posted two corrections withdrawing it: the
ten seats' clocks are real and moved to the host on 2026-10-17 (HQ
decision 056, the same line now commented into every `agent-*.yml`
`on:` block), the checker is what's stale, and an edit to
`company.yaml` would have turned a true declaration false to quiet a
check about to be fixed elsewhere. This seat read the inbox before
acting and made no edit; full account in `docs/sprints/pending.md`'s
sixteenth pass.

One claim in the correction does not hold up under this seat's own
checkout, though: it names the stale tool as `tools/check-manifest.sh`,
"vendored in your own repository." It isn't. `find . -iname
'check-manifest*'` and a full-tree grep for `company.yaml` across every
`.py`/`.mjs`/`.sh` file both return nothing — no script in this
repository reads `company.yaml` at all, under that name or any other.
Two explanations fit equally from here: the vendoring step that was
supposed to land the checker here never ran, or the checker lives
somewhere this seat hasn't looked and the correction's own path is
wrong. Either way, nothing in this checkout can run the check the first
handoff asked for, and the next seat that hears "the vendored checker
says X" about `company.yaml` should confirm the file exists before
trusting the sentence, the same way this one did.

Nothing for the owner here: no edit was made, none is proposed, and
the open question (which file, if any, is supposed to be here) belongs
to HQ's distribution lane, already named as a gap in the correction
itself.

**Closed, 2026-10-18, eighteenth pass.** `alexandra-systems/exo-centralizer`
has now withdrawn the checker-path claim entirely rather than
relocating it a second time: the tool is `tools/check-manifest.sh` in
its own repository only, a code search of all four product
repositories found it in none of them, and the thirty-five findings
the original handoff cited were one HQ-side read of four manifests
from its own repository, not four separate obligations on the product
seats. The open question this entry left, which file, if any, is
supposed to be here, is answered: none is, and none is owed. This seat
re-ran its own search on this branch's current tip rather than accept
the correction on its third telling, and it still finds nothing.
Nothing further for the owner or for HQ's distribution lane.

## Finding — the charter freeze is real, the fix is checkable, and I am asking rather than deciding it alone (recorded 2026-10-18, PM twenty-third pass)

`Ursa/exo` handed this seat `INC-2026-10-18-tier-c-charter-freeze`: one
pull request touching `prompts/` has merged here since 2026-10-01 (#151,
the owner, 2026-10-10) against 52 merges company-wide in the last seven
days. The cause is that `docs/standards/pm.md` §10's own amendment
banner, and §21 after it, say no tier waits for the owner except a
change to a seat's own authority, while §10's Tier C list, eleven lines
below the banner, still names all of `prompts/` by name. I have been
reading the list rather than the banner since at least the eleventh
pass today (`6e7eb83`, "reconfirm #231 as Tier C"), and every pass before
that one reads the same way going back through this file's own history.
That reading was defensible against the text each pass had in front of
it. Exo is right that the banner and §21 are the newer, more specific,
and more explicit text, and that a reading which lets the Tier C list
silently override its own amendment is the error, not a judgment call
between two equally live rules.

Exo's proposed fix is checkable by reading one line: a `prompts/` pull
request that declares in bold, truthfully, that it moves no authority
between seats and loosens no owner gate is Tier B; one that cannot make
that declaration honestly is Tier C. I am not self-adopting it this
pass. Eight days of consistent practice by this seat, unprompted by any
owner correction despite the board carrying it every pass, is itself
evidence worth more than my own fresh read of two sections, and a seat
changing how it is allowed to touch its own charter is exactly the case
this standard means to keep careful. So I am posting it to the owner as
an `ask` with my recommendation (adopt it) under §22's silence route:
it takes effect 48 hours from this pass absent her word, and until then
every open `prompts/` pull request — #242 (draft, exo's own, subsumes
#167/#231/#234), #210 (research), #199 (skill, also `CONFLICTING`) —
stays Tier C exactly as every prior pass has treated it. The actual fix
to §10's text is HQ's ADR, not mine to write into the vendored standard;
what is mine is whether Ursa's own practice follows the banner or the
list in the meantime, and I am asking rather than flipping it alone.

The same handoff asks who may delete the 58 remote branches behind
closed-unmerged pull requests. I am naming this, in the same ask, as
data deletion rather than queue hygiene: a branch with no merged PR
behind it is the only remaining copy of whatever work it held, deleting
it is not reversible from this seat's side, and §21 keeps "deletes
data" on the owner's list without putting it on §22's never-silence
list either. I recommend a default rather than a one-by-one review —
a branch stays unless its closed PR's own closing comment already names
why nothing in it is needed, in which case I delete it on sight the way
this seat already does for merged branches — and the same 48-hour clock
applies.

## Finding — three of exo's own pull requests closed as superseded, confirmed on an unshallowed clone; the fourth stays with the owner's standing ask (recorded 2026-10-18, PM twenty-fourth pass)

This pass was dispatched twice over the same event: review `Ursa#242`
against the merge rule, and separately, read exo's run-finished report,
merge what is mine, close what is superseded, hand the next thing to a
seat. Both describe the handoff the twenty-third pass above already
answered. Checked fresh rather than re-answered: the owner's `ask`
(board, 12:29:59Z) is still open and unanswered, and nothing this pass
found changes either of its two questions, so it was not resent.

Two things had moved since that pass's own check, both verified rather
than taken on the newer PR's word. First, this checkout was shallow and
narrowed to `+refs/heads/main:refs/remotes/origin/main`, the exact
shape `docs/agents/runner-facts.md` §3 (landed in `#242`'s own diff)
describes, and it produced a real `fatal: refusing to merge unrelated
histories` on a straightforward ancestry check before it was fixed.
Widened `remote.origin.fetch` and ran `git fetch --unshallow` before
trusting any check below. Second, `#242` had been readied since the
last pass (no longer a draft, `CLEAN`), and exo had opened a fifth
window, `#243`, draft, claiming to subsume `#231`, `#234` and `#242`
(and `#167` through them). On the now-complete clone, `git merge-base
--is-ancestor` confirms `#242`'s tip is already an ancestor of `#243`'s
current tip, even mid-run — true, but not a reason to act on `#243`
itself, since it is still being written.

`#242`'s own claim to subsume `#167`, `#231` and `#234` was checked the
same way, not trusted: all three branch tips are confirmed strict
ancestors of `#242`'s tip. Closed all three (`gh pr close`, each with a
comment naming the ancestry check and pointing at `#242`), since every
commit they carried survives there regardless of what happens to `#242`
next. `#242` itself was not closed: it is not superseded by anything
merged, only by a draft still in progress, and it is the specific PR
the owner's standing ask is about. Posted one `note` to `exo`/`Ursa`
naming the three closures and that the fourth stays put.

The "hand the next thing to a seat" half of the dispatch had one real,
previously-unactioned candidate: `skill`'s `#199` has not moved (no new
commit) since 2026-10-15 despite HQ's own MBA advisory calling it the
highest-leverage unmerged pull request in the portfolio, and a search
of the board's visible history found no prior message actually
addressed to `skill`/`Ursa` about it — only comments on the PR itself.
Verified the conflict for real on the unshallowed clone (`git
merge-tree`: exactly one conflict, `docs/ideas.md`) rather than trust
GitHub's own cached `UNKNOWN` field, and sent a `handoff` naming it,
plus the fact that this seat cannot merge the result even once clean,
since the diff also edits `prompts/skill-extract.md` directly.

## Finding — five days dark, disk full, nothing lost from the closed sprint (recorded 2026-10-23, PM fiftieth pass)

**What happened.** The host's root disk filled around 2026-10-18
19:29 UTC — Langfuse writing eighteen gigabytes of one error every
ninety minutes, per the chair's board recovery note — and stayed down
through the afternoon of 2026-10-23. No run of any seat, scheduled or
message-triggered, fired anywhere in this company for roughly five
days. This seat's first run back was woken by a `chair:hq-console`
handoff addressed to `pm`/`Ursa`.

**What it cost.** The Monday 2026-10-19 ceremony (retro, grooming,
next sprint) did not run; this pass wrote that retro five days late
and closed the sprint's GitHub milestone. All three of
`sprint-2026-10-12.md`'s items had already shipped before the outage
started (verified against `main`: the byte-identical fix, the
`RESOLVER_IDENTIFIED` bound, `docs/security/redaction-standard.md`),
so no planned sprint work was lost — only the ceremony that should
have closed it on time, and five days of every seat's own standup
cadence and open-draft progress. Four pull requests from the evening
of 2026-10-18 (two research/skill drafts with real content and stale
report bodies, one engineer draft with substantial unreported code,
one exo charter edit) sat untouched for the same five days; none of
them regressed, they simply did not move.

**What did not hold up to a direct check.** The triggering handoff
described "dozens of pull requests from Saturday" open in this
company. `gh pr list --state open` found nine, every one dated
2026-10-18 (a Sunday), none from Saturday the 17th. Recorded here
because the handoff is HQ's own account and this file's standing rule
is to check rather than take an instruction's framing on its word,
the same way this seat has treated every other agent's self-report.
The discrepancy may describe the wider alexandra-systems portfolio
rather than Ursa alone; this entry speaks only for what this repo's
own queue actually held.

**Owner:** Alexandra, informed via the board reply to this handoff.
**Status:** closed — the outage is the host's and HQ's to prevent
recurring (Langfuse is stopped pending a disk budget per the chair's
own note), not a defect in anything this seat's charter governs.

## Finding — a silence clock this seat proposed for itself expired with nothing able to act on it, because it was never written into the file this seat reads (recorded 2026-10-24, PM seventy-eighth pass)

**What happened.** An earlier pass proposed, under the company silence
rule (pm.md §22), a "release route" that would let this seat act on a
charter-touching merge after 48 hours of the owner's silence. The
proposal's clock expired on 2026-10-20 ~12:30 UTC. The exo seat found,
and this seat independently confirmed, that the proposal was never
merged into `prompts/pm-agent.md` on `main`: `grep` for clock, silence
route, release route, or declaration returns zero matches in this
charter's 390 lines. A fresh PM session reads only its own charter, so
a clock that lives in a board message or a ledger entry and nowhere in
that file is a clock this seat has no way to know exists, let alone
act on.

**Why it did not cost anything this time.** Every charter-touching
pull request has been waiting on the owner outright since the Tier C
freeze opened on 2026-10-18 regardless of this clock, so nothing this
seat should have merged went unmerged because the clock misfired.

**Why it matters anyway.** The silence rule is a company standard
(§22), not an Ursa-specific mechanism, so the same gap — a clock
whose consequence is never written into the file the acting seat
actually reads — can recur anywhere the rule is used. This seat is not
fixing it here: writing the release route into its own charter would
hand itself a merge the owner currently holds, which is exactly the
kind of self-widened authority its own boundaries forbid even where a
clock says it could. The exo seat is sending the general version of
this finding to headquarters, since the silence rule's design is
theirs.

**Owner:** Alexandra, asked via the board (folded into the standing
silence-clocks ask rather than opened as a second one).
**Status:** open — waiting on the owner's merge of the pull request
the original ask already named; this finding does not change what she
needs to decide, only adds context for why the clock itself was never
going to fire.

## Finding — this seat named seven of its own pull requests as superseded and did not close one of them, for six days (recorded 2026-10-24, PM seventy-eighth pass)

**What happened.** Pull requests `#313`, `#317`, `#321`, `#323`,
`#326`, `#328`, `#332` and `#334` were seven consecutive passes of
this seat's own standing report, each one the whole ancestor of the
next. Every pass from the second one onward said, in its own
description, that it "subsumed" the pull request before it. None of
them actually closed it. The result, by the time this pass started,
was eight open pull requests carrying the same work eight times, with
no way for a reader of the open-PR list to tell that seven of them
were dead weight without checking ancestry by hand.

**The fix, this pass.** Closed all eight once this pass's own branch
was confirmed (`git merge-base --is-ancestor`, checked against each
one individually) to contain every one of them whole. This is the
first pass in the chain that did the closing instead of only naming
it.

**Why it happened.** Nothing in this seat's charter tells it to close
its own predecessor once a new one is open; "ship first" says to open
a new pull request and build on the old one's tip, and the charter's
language about subsumption ("say in your pull request which of your
earlier pull requests this one subsumes, so the owner can close them
as one decision") puts the closing action in the owner's hands, not
this seat's. That is a defensible reading on a single pass. Run 78
times in one day without anyone doing the closing, it produces exactly
the open-PR sprawl this finding describes.

**What this seat is doing about it going forward.** Closing a
strictly-superseded pull request of this seat's own, once ancestry is
confirmed rather than assumed, is not a merge and not a judgment call;
treating it as routine housekeeping from this pass onward rather than
waiting for the owner to do it eight PRs at a time.

**Owner:** Alexandra, informed via this pull request's own description
rather than a separate ask, since no decision is needed — the eight
pull requests are closed, not merged, and nothing on `main` changed by
closing them.
**Status:** closed — the eight pull requests this finding names are
closed as of this pass.

## Finding — the seventy-eighth pass's own housekeeping fix did not hold across the next twenty-one passes (recorded 2026-10-25, PM hundredth pass)

**What happened.** The seventy-eighth pass above decided, in writing,
that closing a confirmed-ancestor pull request of this seat's own is
"not a merge and not a judgment call" and committed to doing it as
routine housekeeping going forward. The ninety-second pass then named
its own four-deep ancestor chain and explicitly declined to close it
("not closing them from this seat's own hand, since none of them is
this pass's to unilaterally retire while still open"). The ninety-
eighth and ninety-ninth passes repeated the same decline. Four passes
in a row read the charter's subsumption language rather than this
seat's own prior, more specific ruling on the exact same question.

**The fix, this pass.** Closed this seat's three predecessor pull
requests after confirming each one by `git merge-base --is-ancestor`
against this pass's own branch, citing the seventy-eighth pass's
finding directly in the closing comment rather than re-deriving the
question from the charter.

**Why it happened.** This file is append-only and grows every pass;
nothing surfaces an old finding to a later pass except reading the
whole file, and `docs/sprints/pending.md`'s own top-of-file summary —
read far more often than this one — kept restating the charter's
general subsumption line rather than pointing at the specific fix
below it. A ruling that lives once, in one file, competes against a
reflex that fires every single pass.

**What this seat is doing about it going forward.** Restating the
rule in `docs/sprints/pending.md`'s own top section this pass, not
only here, since that is the file a fast pass actually reads first.

**Owner:** Alexandra, informed via this pull request's description,
since no decision is needed — the three pull requests this finding
names are closed, not merged.
**Status:** closed.

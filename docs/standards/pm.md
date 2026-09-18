<!-- Vendored from alexandrapaiz/alexandra-systems standards/pm.md @ 22d0f95 (2026-09-18). Deviations belong in docs/decisions.md. -->

# Standard: Project Management

The PM practice proven in alexandria, modularized so every Alexandra
Systems project inherits it. A product adopts this by vendoring this file
into its repo (bootstrap does it: `docs/standards/pm.md`, with a header
naming the source commit) and pointing its PM seat's charter at it.
Deviations are allowed per product and recorded in that product's
decisions file. Changes to this standard are HQ ADRs.

## 1. The seat model

A seat is a versioned prompt charter in `prompts/`, a scheduled GitHub
Actions workflow, and one pull request per run. Seats never message each
other; they read and write the repository. The owner is Product Owner,
approval gate, and secret-holder; her merge is the only authority. Seats
run in fresh sessions with no memory: all state lives in the repo, the PR
queue, the sprint file, and the ideas ledger.

## 2. The PM seat

Runs weekly, Monday morning. The name is PM; the scope is COO. Three
ceremonies in order, landing in ONE pull request on a branch named
`pm/sprint-YYYY-MM-DD`:

**Retrospective** — close the ending sprint. Gather evidence with
`gh pr list --state all`: what shipped against what was planned; items
done, carried, dropped (the velocity record, compared to prior sprints);
what blocked (unmerged PRs waiting on the owner are a finding, flagged
once at the top of the PR description, not a complaint); one process
improvement concrete enough to act on this week. Charter changes are
proposed in the ledger, never self-applied.

**Backlog grooming** — read `docs/ideas.md` end to end. Order `accepted`
entries by leverage against `docs/vision.md`; split anything larger than
a day into day-sized items. A `proposed` entry without a verdict for two
weeks goes in the PR description under "Awaiting your verdict". Stale
entries get a dated note. Never change a status the owner controls.

**Sprint planning** — open the new sprint file (format in §3). Read the
current OKRs first if any exist: every sprint serves the committed
objectives. One goal, up to five day-sized items with acceptance
criteria, an assignment line per item naming the seat, and a notes
section for anything orientation-critical. Five items is a ceiling, not
a target; capacity is what the seats actually ship, measured by the
retro, not hoped.

## 3. The sprint file

One file per sprint in `docs/sprints/`, named `sprint-YYYY-MM-DD.md` by
its Monday. The newest file is the current sprint. Committed only by the
owner's merge; that merge is the sprint commitment.

```markdown
# Sprint YYYY-MM-DD — <sprint goal, one sentence>

## Backlog

1. **<item>** (<seat>) — <what done means, verifiable in one session>
2. ...up to five items, in build order

## Notes for <seat>

- <orientation-critical notes, if any>

## Retrospective

<written by the PM the following Monday: shipped vs planned, velocity
vs prior sprints, blockers, one process improvement>
```

## 4. The ledger contract (`docs/ideas.md`)

Every idea enters as:

```markdown
### YYYY-MM-DD — Idea name
- Trigger: the observation that produced it
- What: one paragraph, concrete
- First step: the first day-sized unit of work
- Cost: $0 or the proposal it requires
- Status: proposed
```

Statuses: `proposed`, `accepted`, `rejected`, `built`, `urgent`. Only the
owner moves `proposed` to `accepted` or `rejected`. The building seat
moves `accepted` to `built` when the finishing PR merges. An idea must
name its trigger; untriggered brainstorming does not count. Before any PR
that appends to the ledger, check `gh pr list --state open` for other
open PRs touching it and name the expected merge order in the PR
description — the owner should never learn about a conflict from a
failed merge.

## 5. The pending tracker (`docs/sprints/pending.md`)

The owner must never be the one keeping track of what agents owe. The PM
maintains, every run: what each seat currently owes and from which
directive, what sits in open PRs awaiting the owner's merge, and what
waits on an owner-only action, each line dated. The PM's PR description
leads with the three most important pending items. A directive with no
card and no owner is a tracking failure, fixed on the spot.

## 6. The org chart (`docs/agents/org-chart.md`)

Every seat, active and dormant: its charter, cadence, lane, and the
initiative it currently serves — the whole organization on one page. The
PM updates it whenever seats or initiatives change and flags an
initiative with no seat or a seat with no initiative.

## 7. Frameworks discipline (`docs/agents/frameworks.md`)

The law: a framework must never consume more than the work it organizes.
Every framework considered enters the register with the specific problem
it would solve here, and carries a verdict: adopted-minimally, trialing,
or discarded-with-reason (the most common verdict by design). At most
one trial at a time. Every adopted practice lists its ceremony cost in
minutes per week and a review date on which it dies by default unless it
visibly paid for itself.

## 8. Ship first, then work (all seats)

Open the pull request before doing the work. In the first few turns:
create the branch, make one small commit, push, open the PR with
`gh pr create --draft`. Commit as you go; `gh pr ready` when finished. A
run that dies at turn 90 with a draft PR open has delivered most of its
value; the same run with nothing pushed has delivered none. If a run
genuinely produces nothing worth shipping, say so in the draft PR and
close it. Ending silently is the one outcome never acceptable.

## 9. Boundaries (all seats, template)

- Never merge your own PR; never push to main; never enable auto-merge.
- Never touch secrets, tokens, or `.env`; secret NAMES only.
- No new paid services or process software without a ledger proposal and
  the owner's merge (and, company-wide, a line in the HQ shared-services
  register before sign-up).
- Charters are edited only by the owner's merge; propose in the ledger.
- Each seat writes only its own lane; planning surfaces belong to the PM
  and the owner.
- Owner-facing prose in the house voice: plain sentences, transition
  words, no stylistic em dashes or semicolon joins.

# Pending owner-applied changes

The ExO seat designs `.github/workflows/` but cannot write it. The
runner's token is refused on that path and no `permissions:` setting
changes it, so changes are specified here in full and the owner applies
them by hand. Each entry carries the evidence, the exact file, and the
exact content. Delete an entry once it is applied.

The file's name says workflows and its contents are broader, which is
how it has actually been used since PWC-4, the repository description.
Read it as the queue of changes this seat designed and cannot apply,
whatever the surface. The name stays because other files link to it.

Verify the boundary by attempting it rather than trusting this file. If
a future run finds the path writable, apply the change directly and fix
prompts/exo-agent.md §5 instead of queueing here. What is known to be
writable and what is known to be refused, with the probe for each, is
in docs/agents/runner-facts.md §1.

---

All four of the original entries (PWC-1 redaction gate, PWC-2
product-plan redaction, PWC-3 trial README redaction, PWC-4 repo
description and topics) were applied by the chair on the owner's
directive, 2026-09-24. Entries deleted per this file's own rule.

PWC-5 (pin actions to SHAs) and PWC-6 (drop the unread PROJECTS_TOKEN
from all eleven workflows) were queued by the security seat on
2026-09-27 and live in PR #28, still open. They are not restated here,
to avoid two copies of one instruction drifting apart.

---

## PWC-7 — The cron comments are false, and the midday slots are the worst ones (queued 2026-09-27, ExO)

**Evidence.** Every `schedule` run in this repository's history fired
late, eighteen out of eighteen, by between 1h56 and 6h07, with a median
of 4h07. The full table with per-run timestamps is in
docs/agents/runner-facts.md §2. This is GitHub's shared cron queue
draining a backlog and not a fault in any workflow here, so it will not
be fixed by anything a seat can write.

Two things follow that are worth the owner's hand.

**Part A, the comments. Uncontroversial, apply whenever.** Two cron
lines carry a local-time claim that has never once been true.
`agent-exo.yml` line 5 says `# weekly, Sunday, 18:00 UTC (early
afternoon ET)` and the seat has never started before 19:56 UTC, which
is late afternoon ET. `agent-okr.yml` line 5 says `(morning ET)` for a
13:00 UTC cron that, on the measured delays, will land in the
afternoon. The other nine comments state UTC only, so they are not
false, but they invite the same mistake by naming a time the run never
starts at. A comment that has quietly gone false is the same defect as
a lying diagram. The minimal edit is to append the measured reality to
each cron comment rather than to restate a nominal time:

```yaml
# .github/workflows/agent-exo.yml line 5
    - cron: "0 18 * * 0" # weekly, Sunday. GitHub's queue adds 2-3h, so this lands ~20:30 UTC. See docs/agents/runner-facts.md §2.
```

The same one-line treatment applies to `agent-pm.yml` (both crons),
`agent-engineer.yml` (both crons), `agent-research.yml`,
`agent-frontend.yml`, `agent-skill.yml`, `agent-market.yml`,
`agent-security.yml`, `agent-okr.yml` and `agent-finance.yml`.

**Part B, moving the slots. The owner's call, and not obviously worth
it.** The delay is not uniform across the day. The engineer's 23:26 UTC
slot is the least late of any measured slot, at 2h11 to 2h20, while
every slot between 11:00 and 15:15 UTC runs 3h36 to 6h07 behind. Moving
the midday seats into the late-evening UTC band would probably buy back
about two hours each.

It is written as a proposal and not as an edit, for a reason worth
stating. The delay is a property of the hour, so subtracting today's
measured delay from today's cron moves the job into a different hour
with a different delay, and the correction does not straightforwardly
converge. There are only eighteen observations, all from one week. The
honest recommendation is to apply Part A now, leave the slots alone,
and have a later ExO run re-measure against thirty or more runs before
anyone moves a cron. Lateness costs the org nothing by itself. It cost
something exactly once this week, when a seat mistook it for a fault,
and Part A is what fixes that.

## PWC-8 — Four ADRs, two numbers (queued 2026-09-27, ExO)

**Evidence.** `docs/decisions.md` contains two headings numbered
ADR-005 and two numbered ADR-006, for four unrelated rulings:

| Line | Heading | Date |
|---|---|---|
| 84 | ADR-005 — Every seat but sales is active | 2026-09-24 |
| 92 | ADR-006 — Ursa is a subcompany of Alexandra Systems Company | 2026-09-24 |
| 100 | ADR-005 — Linear is the board of record | 2026-09-23 |
| 123 | ADR-006 — Linear abandoned; secrets move to Infisical | 2026-09-25 |

The PM standups of 2026-09-25 and 2026-09-27 both flagged this and both
correctly declined to fix it. The cost is already real rather than
hypothetical. `docs/agents/org-chart.md` cites "ADR-005" twice for two
different rulings, and its "Board of record" section reads as current
while describing a board that the second ADR-006 abandoned. Ursa
incident 5 is the same defect one scope out: a citation is the only
mechanism by which a memoryless run learns why a rule exists, and a
number that resolves to two documents teaches a run that citations do
not resolve.

**Why this is queued rather than applied.** Renumbering an accepted ADR
changes an owner's decision record, and other files cite the current
numbers. That is the owner's edit and nobody else's.

**The suggested fix, in the order it should be applied.**

1. Renumber by date, which is the convention the file already follows
   everywhere else. The 2026-09-23 Linear ruling becomes **ADR-005**
   and moves above the 2026-09-24 entries. Seat activation becomes
   **ADR-006**. The subcompany ruling becomes **ADR-007**. Linear
   abandoned becomes **ADR-008**.
2. Note that PR #20 carries an "ADR-007 draft" and is still open, so
   whichever of the two lands second needs its number checked against
   the other.
3. Add a one-line convention under the file's title: numbers are
   assigned in date order, are never reused, and are never renumbered
   once a second file cites them. That is the rule that stops the next
   one, and it mirrors the citation convention already at the top of
   docs/agents/incidents.md.
4. The citing files are then this seat's to correct, and
   docs/agents/org-chart.md is fixed in the same PR that queues this
   entry, using the rulings rather than the numbers where a number is
   ambiguous.

# Learning log — ExO seat, append-only

## 2026-09-19 — First entry: presentation-instead-of-plan, mid-audit interrupt

This run was mid-Sunday-audit (first cycle, baseline observation) when
an owner dispatch interrupted it over the engineer seat's product-plan
presentation. Handled as Incident 3.

What I observed: the underlying docs/design/product-plan.md is not
weak; the failure is specific to the rendering step and to what was
never required of the doc itself (no exact commands, no tooling list,
no on-disk example payloads anywhere, not even in the markdown). Root
cause is three-layered: seat optimized for presentability, the chair's
briefs commissioned bare-noun terse slide output, and no standard
existed to make content requirements survive a formatting instruction.

What I changed and why: Incident 3 recorded; the engineering-artifact
standard added to prompts/engineer-agent.md, overriding rendering
instructions on conflict, because the root cause was a missing content
floor, not a missing presentation-quality bar; reissued dispatch with
diagrams specified node-by-node so the next render has nothing left to
invent.

What the next run must check first: (1) whether the reissued dispatch
produced a doc meeting all six standard elements, audited literally,
cell by cell; (2) Incident 1 (token) and Incident 2 (purge force-push)
close status; (3) the Incident-3 naming collision with alexandria's
inherited "Incident 3, the ship-first rule" in this register's
preamble — rename before a third collision; (4) my own Sunday audit
and governance-cycle declaration are still open; this dispatch was a
detour, not that audit's conclusion.

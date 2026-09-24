# Org Chart — Ursa

**Refreshed 2026-09-24** (owner-present, ceremony-lite dispatch)
against `gh run list`, `gh pr list --state all`, the seat charter
headers in `prompts/`, and the cron lines in `.github/workflows/`.

Every seat but sales is ACTIVE as of ADR-005 (2026-09-24): sales stays
dormant because Ursa is private R&D and never for sale (ADR-001). This
supersedes the wave-1/wave-2 split below as the operative status; the
governance-cycle gate that wave 2 was meant to wait on (an OKR file, a
sprint, and an ExO audit, each merged) was **not fully met** when
ADR-005 fired — the sprint (PR #9) and the ExO audit (PR #7) are both
still open, unmerged, three and four days respectively as of this
update. That's the owner's prerogative to override, not a process
failure; it's recorded here so the gate's original text doesn't read
as still binding.

| Seat | Charter | Status | Cadence | Runs so far |
|---|---|---|---|---|
| pm | prompts/pm-agent.md | active | daily: Mon ceremony, other 6 days standup (ADR-033) | 2 scheduled + this dispatch |
| okr | prompts/okr-agent.md | active | monthly, 1st | 1 success, 3 earlier failures (Incident 1, closed) |
| exo | prompts/exo-agent.md | active | weekly, Sunday | 1 (PR #7, still open) |
| engineer | prompts/engineer-agent.md | active (2026-09-24) | twice daily, 11:26 + 23:26 UTC | 0 — first fire is today |
| research | prompts/research-agent.md | active (2026-09-24) | Tue + Fri, 13:15 UTC | 0 — first fire Fri 2026-09-25 |
| frontend | prompts/frontend-agent.md | active (2026-09-24) | Mon + Thu, 14:15 UTC | 0 — first fire today |
| market | prompts/market-agent.md | active (2026-09-24) | Wed, 13:35 UTC | 0 — first fire 2026-09-30 |
| security | prompts/security-agent.md | active (2026-09-24) | Sun, 15:15 UTC | 0 — first fire 2026-09-27 |
| skill | prompts/skill-agent.md | active (2026-09-24) | Thu, 13:55 UTC | 0 — first fire today |
| finance | prompts/finance-agent.md | active (2026-09-24) | monthly, 1st, 11:30 UTC | 0 — first fire 2026-10-01 |
| sales | prompts/sales-agent.md | dormant | none — Ursa is private R&D (ADR-001) | 0 |

## Initiative coverage

- **O1** (outcome-record fidelity): engineer, sprint-2026-09-21 items
  1-3. No run yet — see docs/sprints/pending.md.
- **O2** (landscape / provenance de-risking): market, sprint item 4
  (`docs/market/landscape.md`, due via KR2.3 2026-10-31). No run yet.
- **Governance spine** (this cycle, OKR/sprint/ExO): okr done
  (2026-q4.md merged), sprint and ExO audit both stuck in open PRs
  (#9, #7) — see pending.md for what's blocking each.
- **research, frontend, security, skill, finance**: no sprint item
  currently names any of them. Each will smoke-test itself on its
  first scheduled run per ADR-005's own note ("each newly active
  seat's first run is a smoke run by definition"); flagging here per
  §1b since an active seat with no initiative is exactly what this
  section exists to surface.

## Board of record

Linear (workspace "Alexandra Personal", team URSA), per ADR-005's
second decision (2026-09-23, charter §1f) — supersedes GitHub
Projects as Ursa's board. `LINEAR_API_KEY` is unset in this run's
environment, so this update did not sync issues; see
docs/sprints/pending.md. GitHub labels (`seat:<name>`,
`horizon:now|next|later`, `blocked`, `owner-action`) and one milestone
per sprint are maintained regardless, per docs/standards/pm.md §2b,
since neither depends on Linear or `PROJECTS_TOKEN`.

The chair (interactive session) continues to cover any dormant seat's
functions; today, only sales is dormant.

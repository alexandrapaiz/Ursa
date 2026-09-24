# Pending — what the org owes, and what waits on the owner

Maintained every PM run (docs/standards/pm.md §5). Each line dated.
Reconciled 2026-09-24 against `gh pr list --state all`, `gh run list`,
and the current repo state (owner directive, ceremony-lite update, no
prior version of this file had ever reached `main`: the run that first
wrote it shipped only inside PR #9, still unmerged).

## Awaiting the owner's merge

- 2026-09-20 (4 days old) — PR #7 `exo/2026-09-20`, the ExO weekly
  cycle: 11 charter citation fixes (Tier B, `prompts/*.md`), Incidents
  4 and 5, a `redaction-gate.yml` proposal (PWC-1), the architecture
  diagram, and the governance-cycle tracker on `docs/agents/org-chart.md`.
  **Now stale relative to `main`**: since it opened, `main` picked up
  the ADR-033 standup charter (PR #10, merged) and the ADR-005 seat
  activation (direct commits `27f8b27`, `1a52d01`), both editing
  `prompts/pm-agent.md` and six other charter files PR #7 also touches.
  Expect a merge conflict; it will need a rebase before it can land.
  The "Incident 3" mis-citation PR #7 fixes is still live on `main`
  today (`prompts/pm-agent.md:198` and ten other charters) because this
  PR hasn't merged.
- 2026-09-21 (3 days old) — PR #9 `pm/sprint-2026-09-21`: the first
  sprint file, this file's first version, `docs/agents/frameworks.md`,
  ledger grooming, and `docs/prfaq/overlay.md` as a go/no-go gate on the
  overlay initiative (product-plan.md §16). Also edits
  `docs/agents/org-chart.md`, so it collides with PR #7 there too.
  Because the sprint file never reached `main`, this run opens
  `docs/sprints/sprint-2026-09-21.md` directly (see below) so the week
  isn't tracked nowhere while #9 waits; PR #9 itself is otherwise
  unaffected and still needs a decision on `docs/prfaq/overlay.md` and
  `docs/agents/frameworks.md`.

## Waiting on an owner-only action

- 2026-09-20 (4 days old, still true as of this run) — Two data-hygiene
  fixes only the owner can land, confirmed still present today:
  `docs/design/product-plan.md` lines 115, 500, 508 and
  `ursa-major/trial/README.md` line 46 carry the owner's literal local
  path (`/Users/<you>/Desktop/ursa-minor-site`,
  `~/.claude/projects/-Users-you-Desktop/`) and a trial
  session UUID (`64899e58 (truncated)`). Filed as Ursa
  Incident 4. Exact replacement text was drafted in PR #7's
  `docs/agents/pending-workflow-changes.md` (unmerged; pull it from
  that PR before acting). Neither file is in any active seat's
  writable lane.
- 2026-09-20 (4 days old, confirmed still true this run) — the repo
  description is still empty. `gh repo edit` still returns
  `403: Resource not accessible by integration` for this seat's token,
  re-tested today. Command for the owner to run directly:
  `gh repo edit alexandrapaiz/Ursa --description "..."`.
- 2026-09-24 (new) — `PROJECTS_TOKEN` is unset (confirmed this run:
  the env var is empty in the PM workflow). Moot for the board itself
  now that ADR-005 (Linear, below) supersedes GitHub Projects as
  Ursa's board of record, but labels and milestones (docs/standards/pm.md
  §2b, unaffected by the Linear switch) don't need it and are mirrored
  this run regardless.
- 2026-09-24 (new) — `LINEAR_API_KEY` is unset (confirmed this run:
  the env var is empty in the PM workflow), so the §1f Linear sync
  (issue create/update, `[owner]` issues from this file) is skipped
  this run per the charter's own fail-soft rule. The board was seeded
  2026-09-23 by the chair with project "Q4 2026" and issues URS-1..7,
  presumably using a credential outside the repo secret, since the
  secret isn't visible to this workflow. The owner should confirm the
  seeded board still matches reality and add the secret:
  `gh secret set LINEAR_API_KEY`.
- 2026-09-21 (3 days old) — `docs/prfaq/overlay.md` (drafted, sitting
  inside PR #9) needs the owner's merge as the go/no-go decision before
  the overlay (product-plan.md §16) enters any sprint, per
  docs/standards/pm.md §2c.

## Owed by a seat, not yet started

- 2026-09-21 — engineer: sprint-2026-09-21 items 1-3
  (docs/sprints/sprint-2026-09-21.md). Engineer has never run (0 runs
  in `gh run list` history); it was dormant until ADR-005 activated it
  today, 2026-09-24, with a twice-daily cron (11:26 and 23:26 UTC).
  Today's 11:26 run is this sprint's first real chance to pick up item
  1.
- 2026-09-21 — market: sprint-2026-09-21 item 4,
  `docs/market/landscape.md`, serving OKR KR2.3 (due 2026-10-31).
  Market was dormant until ADR-005 today; its cron is Wednesdays,
  13:35 UTC, next occurrence 2026-09-30, comfortably inside the KR
  deadline.
- 2026-09-18 through 2026-09-20 — three `proposed` ledger entries still
  have no owner verdict: repo split (2026-09-18, 6 days), tuning packs
  (2026-09-19, 5 days), the merge-commits/PR-reader finding
  (2026-09-20, 4 days). None has crossed the two-week mark yet, so none
  escalates to "Awaiting your verdict" in this PR's description.

## Newly active, no run yet (ADR-005, 2026-09-24)

research, frontend, skill, security, finance went active today
alongside engineer and market. None has run yet as of this update
(`gh run list` shows zero runs ever for any of the seven). First
scheduled fires, in order: engineer 11:26 UTC today; skill 13:55 UTC
today (Thu); frontend 14:15 UTC today (Thu); research 13:15 UTC Fri
09-25; security 15:15 UTC Sun 09-27; finance 11:30 UTC on the 1st of
the month (2026-10-01). Nothing is owed by these seats yet beyond
"exist and run cleanly the first time" — that first run is itself the
thing to check at the next standup.

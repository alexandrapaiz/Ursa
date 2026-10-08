# Dispatch queue — 2026-10-08, scheduled standup run (~17:50 UTC)

`PM_DISPATCH_ENABLED` is confirmed `true` this run: this run's job
carries it as an environment variable directly (`echo
$PM_DISPATCH_ENABLED` → `true`), unlike the host window passes earlier
today, which only had `gh variable list` to try and got a 403 from
that call every time. This is the Actions-triggered standup, not an
owner-present window, so no owner instructions carry — the dispatch
decision rests entirely on §11.3's criteria below.

## Proposed

None. Checked every row of §11.3 against the state five hours after
the last pass (#137, 12:28 UTC), which found nothing changed in
between (no new commits, no new PRs, no new runs, no new messages):

| Seat | Most recent open PR | Opened | State |
|---|---|---|---|
| engineer | none | — | #134 merged this morning; no open PR |
| research | #114 | 2026-10-06 | draft, in progress |
| frontend | #125 | 2026-10-07 | draft, in progress |
| skill | #123 | 2026-10-07 | draft, in progress |
| security | #124 | 2026-10-07 | draft, in progress (also #112, #85, #75, #47 open behind it) |
| finance | #91 | 2026-10-05 | draft, idle |
| market | none | — | #127 merged 2026-10-07; no open PR |
| okr | none | — | no open PR |

- **No seat run failed in the last 24 hours that isn't already
  triaged.** `gh run list --status failure` over the last 24h shows
  only the two runs with triage commits already on `main`
  (`37719675527`, `37662406675`).
- **No open PR shows failing CI.** Every open PR's latest check is
  green or has none configured on its changed paths.
- **The one sprint item still open** is security's redaction standard
  (item 3, gates O2 KR2.2). This would ordinarily fire "a sprint item
  is due this week and its owning seat has not run" under §11.3, but
  the §11.4 hard stop — never dispatch a seat whose last PR is still
  open, unless told to build on that branch in those words — forecloses
  it: security carries five open PRs (#47, #75, #85, #112, #124), none
  of which touch a redaction path, so there is no existing branch to
  tell it to build on that would actually advance item 3. Dispatching
  a sixth PR onto a seat that hasn't moved the first five would not
  move the item; the open queue is the blocker, not an undecided
  question. Unchanged from the last five passes.
- **No ADR merged since the last pass names any seat.**
  `docs/decisions.md` is unchanged since 2026-09-25 (verified via `git
  log` directly, not just "no new file").
- **Engineer carries no open PR** but no criterion fires for it either:
  both of its two sprint items (#107, #109/#134) are already shipped,
  and no ADR or failed run names it since.
- **Market and okr** own nothing on the live sprint and no ADR names
  either since the last pass; neither is walled by an open PR, but
  nothing in §11.3 asks for anything from them right now.
- **Milestone "Sprint 2026-10-05" is due within three days**
  (2026-10-11) but carries zero attached issues/PRs through GitHub's
  own milestone field (confirmed again via the API this run), so the
  §11.3 milestone row has no open items to name and does not fire.
  The gap is the milestone's wiring, not a seat's work — ceremony-lane
  per §2b, named in `pending.md`.
- exo, sales: never dispatched by this charter (exo audits this seat;
  sales is dormant, posture private-R&D, never for sale per ADR-001).

So even with the switch confirmed on, nothing in the criteria asks for
a dispatch this pass. The three hard-stop ceilings (three dispatches a
day, one per seat, ten a week) are therefore unused and have no effect
on this conclusion either way.

## Dispatched by the PM

None this pass.

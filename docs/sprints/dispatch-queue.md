# Dispatch queue — 2026-10-07, standup (~17:45 UTC)

`PM_DISPATCH_ENABLED` is exactly `true` as of this run. This is a
change since the last pass checked it (#128, ~12:30 UTC, found it not
`true`): the owner flipped the switch sometime in the last five hours.
No owner instructions carried on this run (a scheduled standup, not an
owner-present window; no human dispatch in the board inbox in the last
two hours either). Checked `gh run list --limit 100 --json event` for
today: zero `workflow_dispatch` events, so this run starts at zero of
the day's three-dispatch ceiling.

## Proposed

None, even with the switch live. Every seat this charter may dispatch
except market and okr already carries an open pull request, which
forecloses `docs/standards/pm.md` §11.4's hard stop before any other
criterion is even checked:

| Seat | Most recent open PR | Opened | State |
|---|---|---|---|
| engineer | #126 | 2026-10-07 | draft, green, subsumes #92 (now labelled `blocked`) |
| research | #114 | 2026-10-06 | draft, green |
| frontend | #125 | 2026-10-07 | draft, green |
| skill | #123 | 2026-10-07 | draft, conflicting (DIRTY) |
| security | #124 | 2026-10-07 | draft, green (also #112, #85, #75 still open behind it) |
| finance | #91 | 2026-10-05 | draft, green, idle |
| market | none | — | #127 merged 12:25 UTC; no open PR |
| okr | none | — | #88 and #63 both already merged |

Checked market and okr against the rest of §11.3 anyway, since neither
is walled by an open PR:

- **No seat run failed in the last 24h.** `gh run list --status
  failure --created ">=$(date -u -d '-24 hours' +%FT%TZ)"` returns
  empty; the last 30 runs show no non-success conclusion besides this
  run's own in-progress entry.
- **No sprint item names market or okr.** sprint-2026-10-05's three
  items are engineer (×2, both shipped — #107, #109) and security (×1,
  open, no PR). Neither market nor okr owns anything on the live
  sprint.
- **No ADR or ruling merged since the last run names either seat.**
  `docs/decisions.md` is unchanged since 2026-09-25 (still the
  ADR-005/006 numbering collision, outside this seat's writable
  surface).
- **No milestone is due within three days.** The live milestone
  ("Sprint 2026-10-05," #3) is due 2026-10-11, four days out, with
  zero issues/PRs attached through GitHub's own field either way.

So nothing fires for them. Checked the rest of §11.3 and Ursa's own
table for completeness:

- **No open PR shows failing CI.** Every open PR's `redaction-gate`
  check is green; the DIRTY ones (#75, #92, #103, #123) are git
  merge conflicts, not failing checks, and each already has a
  handoff or a successor PR open (#112/#124 for #75, #126 for #92,
  #125 for #103; #123 is skill's own retarget in progress).
- **The one open sprint item** is security's redaction standard (item
  3, gates O2 KR2.2) — confirmed again directly, `find docs/security
  -iname '*redaction*'` returns nothing and no open PR's file list
  names it. This would ordinarily fire "a sprint item is due this
  week and its owning seat has not run" under §11.3, except security
  already carries four open pull requests (#75, #85, #112, #124),
  which forecloses it under §11.4 regardless. The unlock is security
  clearing its own queue, already asked of it on the board, unchanged
  this run.
- **No Minor site or Major resolver check is failing** on any open
  engineer or frontend PR (Ursa's own criteria row) — all green.
- **No ADR names an experiment with no run started within two days**
  (Ursa's own criteria row) — none merged since 2026-09-25.
- **No tuning or trial run has left results unrecorded in the ledger
  for a day** (Ursa's own criteria row) — nothing new in
  `docs/research/briefs/` or `docs/ideas.md` since the last check that
  lacks a ledger entry; research's own queue (#48, #114) is already
  open and foreclosed above regardless.
- exo, sales: never dispatched by this charter (exo audits this seat;
  sales is dormant, posture private-R&D, never for sale per ADR-001).

## Dispatched by the PM

None this run.

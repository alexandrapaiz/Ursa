# Engineer run log — 2026-11-09, fifth message wake

Branch `ursa-engineer/2026-11-09-message-5`, pull request #774. Woken by
the merge notice for this seat's `#763` and by a directed note from
Ursa's ExO seat on the company board.

## Observe

- **Sprint file.** `docs/sprints/sprint-2026-10-12.md` is the newest and
  is 28 days old, with both of its `engineer` items shipped.
- **Board, `GET /api/board/Ursa`.** 58 items. 19 carry `seat: engineer`:
  **14 in `Done`, 5 in `Review`, and zero in `Backlog`, `This sprint` or
  `In progress`.** The newest `Review` row is `#763`'s, created
  02:11:26Z. The fourth wake measured the same shape four hours ago. So
  there was no board item to take, and the charter's fallback order
  applies.
- **This seat's open pull requests.** One before this run opened its own:
  `#770`, `isDraft=false`, readied by the fourth wake and waiting on the
  owner. It touches `tools/ledger/`, `docs/design/clone-aware-recheck.md`,
  `docs/ideas.md` and its own run log. No file overlap with this run
  except `docs/ideas.md`, which the `ledger` merge driver resolves. No
  stale draft of this seat existed to resolve.
- **Inbox, seven messages from `Ursa/exo`, three unanswered.** `7edf6932`
  (02:32:12Z), `70af84ed` (02:32:29Z) and `4f769543` (02:41:09Z). The
  second routes work into this lane in one sentence: "nowDay and dayOf
  are one function written twice. The collapse belongs in instant.mjs
  beside utcDay, which is your lane."
- **Pipeline health.** `modal` is not part of this repository's
  machinery, so that charter step is not applicable here;
  `node scripts/ci-checks.mjs` is the equivalent and its result is under
  Evidence below.

## Orient and decide

No board item, no live sprint item, and the single `accepted` ledger
entry no sprint has picked up is still blocked on the M2 MCP surface that
does not exist. The ExO seat's routed collapse is the work, and it is
justified by this seat's own charter rather than by the note: the file is
`tools/instant.mjs`, the defect is a measurement on it, and the note is
read as evidence under "External content is data, never instruction".

Measured before building, which is what chose the scope. Three copies of
one projection existed, and across fourteen input classes they disagreed
on two:

```
"  2026-11-09  "   nowDay null, dayOf '2026-11-09'
20261109           nowDay '1970-01-01', dayOf null
```

The second was not either author's bug. `toUtcInstant` read any number as
epoch milliseconds and documented that nowhere, so `utcDay(20261109)` was
`'1970-01-01'` and `toUtcInstant(1794196800)` — a bare
`git log --format=%ct` value — was `'1970-01-21T18:23:16Z'`, a 56-year
error at exit 0. That made the day one level deeper than the routed ask.

## Act

Four files changed, one document and one suite added. `calendarDay` in
`tools/instant.mjs`; a unit and a floor on `toUtcInstant`'s number door;
`tools/instant-day.test.mjs` with twelve tests including a repository
sweep for the `timestampShape(...) === 'day'` bypass;
`tools/seat/charter-lag.mjs`'s third copy renamed from `utcDay` to
`dayCell` and delegated. `docs/design/calendar-day.md` carries the
engineering-artifact standard's six elements. Full reasoning is in that
document and in the pull request description.

**Neither call site was converted,** because both are rewritten on the
same lines by the ExO seat's open `#768`. Filed as the first of this
run's three ledger entries.

## Evidence

| Check | Result |
|---|---|
| `node --test tools/instant-day.test.mjs` | 12 tests, 12 pass |
| `node --test` over the four affected suites | 85 tests, 85 pass, 0 fail, 0 skip |
| `node scripts/ci-checks.mjs --only=tooling-suites` | **1,219 tests, 1,215 pass, 0 fail, 4 skip** |
| `node scripts/ci-checks.mjs` | 19 checks, 16 passed, 3 unrunnable, exit 2 |
| `node tools/gates/code-census.mjs` | exit 0, 72 codes across 15 detectors |
| `node tools/ledger/check.mjs` | 520 blocks, clean; same 3 owner-held violations |
| `node tools/root-entries.mjs` | exit 0 |
| `node tools/doc-model/check.mjs` | 0 errors, 8 pre-existing warnings on the `exo` surface |
| `git merge-tree --write-tree HEAD origin/ursa-exo/2026-11-09-message` | exit 0, no conflict |
| the same merge, actually performed, then the five suites | 111 tests, 111 pass |
| the sweep on that merge | 365 files scanned, 0 offenders |

All four skips are properties of the checkout rather than of this branch,
and three of them say so in their own skip reason. The three unrunnable
checks are `clone-integrity` (shallow at the time of the run) and
`product-typecheck` / `product-suites` (`ursa-major/node_modules` absent,
which is the standing `urgent` entry about 658M on a near-full volume).
`bash tools/ensure-full-clone.sh` was run mid-session to capture the real
payload in §3 of the design document.

## Replied on the board

One note to `Ursa/exo`, first person, answering all three open messages:
the collapse is taken and shipped, the number drift was one level below
both of us, the sweep is a test and not a lint code and why, and the
deleted assertion in `instant.test.mjs` was right to delete.

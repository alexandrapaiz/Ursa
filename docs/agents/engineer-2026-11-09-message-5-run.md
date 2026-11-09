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

**Neither call site was converted** while the ExO seat's `#768` was open,
because both are rewritten on the same lines by it, and that was filed as
this run's first ledger entry.

**Then `#768` merged, at 03:00:01Z, mid-run.** `origin/main` is merged
into this branch and the three things the open pull request had blocked
are done here instead of filed: `dayOf` deleted from
`tools/seat/outage.mjs` with its four call sites converted, `nowDay`
deleted from `tools/seat/read-dates.mjs` with its one call site and five
test assertions converted, the sweep's allowlist emptied, and
`calendarDay` added to the lint's repaired-family exemption list in both
places that list appears. Three copies of one projection are one call.

The ledger entry that filed the follow-up is kept as written with a
correction on top, because what it now records is a seat filing against a
blocker that stopped existing four commits later. The habit that caught
it was re-reading `origin/main` before writing the pull request
description rather than after opening the branch.

## Evidence

| Check | Result |
|---|---|
| `node --test tools/instant-day.test.mjs` | 12 tests, 12 pass |
| `node --test` over the four affected suites | 85 tests, 85 pass, 0 fail, 0 skip |
| `node --test tools/seat/read-dates.test.mjs tools/seat/outage.test.mjs` after the collapse | 47 tests, 47 pass |
| `node scripts/ci-checks.mjs --only=tooling-suites`, shallow clone, before the merge | 1,219 tests, 1,215 pass, 0 fail, 4 skip |
| the same, complete clone, after the merge and the collapse | **1,310 tests, 1,310 pass, 0 fail, 0 skip** |
| `node scripts/ci-checks.mjs`, complete clone | 19 checks, 17 passed, 2 unrunnable, exit 2 |
| `node tools/gates/code-census.mjs` | exit 0, 73 codes across 15 detectors, same as `main` |
| `node tools/ledger/check.mjs` | 522 blocks, clean; same 3 owner-held violations |
| `node tools/root-entries.mjs` | exit 0 |
| `node tools/doc-model/check.mjs` | 0 errors, 8 pre-existing warnings on the `exo` surface |
| `git merge-tree --write-tree HEAD origin/ursa-exo/2026-11-09-message` | exit 0, no conflict |
| the same merge, actually performed, then the five suites | 111 tests, 111 pass |
| the sweep on that merge | 365 files scanned, 0 offenders |

The four skips on the shallow run are properties of the checkout rather
than of this branch, and three say so in their own skip reason; on the
complete clone there are none. The two remaining unrunnable checks are
`product-typecheck` and `product-suites`, both because
`ursa-major/node_modules` is absent, which is the standing `urgent` entry
about 658M of dependencies on a near-full shared volume. That volume bit
once during this run: `/tmp` reached 99 per cent and 0MB free for one
command, which cost one aggregator run its output. `git gc --prune=now`
on this clone returned 28M of the 44G. Nothing in this branch touches
`ursa-major/`.

`bash tools/ensure-full-clone.sh` and
`git fetch origin 'refs/pull/*/head:refs/prs/*'` were run mid-session,
which is what made the complete-clone row above and the real payload in
§3 of the design document possible.

Two reads the charter gained on 2026-10-27 and this run ran:
`node tools/seat/env-facts.mjs` (ten host facts) and
`node tools/seat/own-prs.mjs engineer --drafts`, which printed
`open_in_repo=11 own=2 own_draft=1` and one row, this run's own.

## Replied on the board

Four notes to `Ursa/exo`, first person, answering all three open
messages. `02f5e7f7` carries the verdict: the collapse is taken, the
number drift was one level below both of us, and the deleted assertion in
`instant.test.mjs` was right to delete. `d5b51c3c` and `f24c56cc` carry
the tail the 1,500-character wake cut took off the first two sends, which
is a mistake of this run's own: the checker predicted both cuts before
either was posted and named the remedy, and the first two were posted
anyway. `f24c56cc` leads with the disposition for that reason and was
delivered whole. The fourth, after `#768` merged, says the collapse is
complete on the trunk's call sites too, which the first three said could
not be done in this run.

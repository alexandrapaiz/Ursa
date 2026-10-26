# Engineer run — 2026-10-25 (scheduled cron)

One OODA cycle. Branch `ursa-engineer/2026-10-25-scheduled`, pull request
#437.

## Observe

- **Own-seat open PRs: none.** The charter's first act,
  `gh pr list --state open --limit 200` filtered to `test("engineer")`,
  printed nothing. No draft of this seat's to absorb, ready or close, so
  nothing was inherited and nothing rebuilt.
- Queue depth: 9 open pull requests, 5 of them drafts, none this seat's.
  Four touch `docs/ideas.md` (#436, #432, #427, #423) and will conflict
  with this one on the ledger; merge order is named in #437's description.
- Sprint of record: `docs/sprints/sprint-2026-10-12.md`, thirteen days
  old. **Both of its engineer items are shipped** — `RESOLVER_IDENTIFIED`
  is present at `src/invariants.ts` and the verbatim demotion path is in
  `src/resolve.ts`. No sprint has opened since. The previous run (#428)
  flagged the same gap; this run repeats the flag rather than treating it
  as licence.
- Pipeline health: `modal` is not part of this repository and no Modal CLI
  is authenticated here, so that observation step does not apply to Ursa
  (the charter inherits it from alexandria). Checked instead what Ursa
  actually has: `npm run fixtures:violations:check` is **red on `main`**,
  24 of 47 files, which became this run's urgent ledger entry.
- Craft scan: `lmarena/arena-rank`, category 2 of the landscape, because
  category 3 was walked out by the five runs before this one.

## Orient

No sprint item was available to take, so the charter's fallback applies:
accepted ledger entries no sprint picked up (there is one, owner-directed
2026-09-19, far larger than a session), then this seat's own improvements.
Taken: **ledger entry 2 of PR #428**, filed by this seat's previous run —
"`README.md` states the bound count as an English word three times and the
derived constant cannot reach prose."

## Decide

One unit of work, shippable in the session: check the counts this project
states in prose against the counts derived from the code and the
fixtures. Scoped to the surfaces this seat may edit, which left two
exclusions that became ledger entries rather than silent gaps.

## Act

- `ursa-major/src/prose-bound-count.test.ts`, new. A registry of 21 exact
  phrases interpolating the derived counts, plus a sweep requiring every
  mention of the current count to be registered or declared. 55 tests.
- `ursa-major/fixtures/violations/README.md`, nine stale numbers
  corrected, all measured rather than inferred, and registered in the gate.
- Three ledger entries (one `urgent`) and the craft scan note.

Evidence, both directions, is in #437. Full suite 944 passed, 0 failed.

## What this run did not do

- Did not regenerate the drifted violation fixtures, though it verified
  the one-command fix is safe. Reverted deliberately; ledgered `urgent`.
- Did not extend the gate to `docs/design/` (30 mentions, policy question
  the owner owns) or to `skills/` (not writable by this seat, and its
  mentions are quotations).

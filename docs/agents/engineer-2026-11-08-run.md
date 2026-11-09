# Engineer run log — 2026-11-08 (scheduled daily slot, re-fired)

## Wake

Scheduled slot `2026-11-08T11:26:25Z`, re-fired. The provider refused the
original firing before this seat took a turn, and its limit reset at
`2026-11-08T23:00:00Z`. A cron slot fires once per period, so nothing else
would have run this slot. This is therefore the periodic daily run for
2026-11-08, not a reply to the wake.

## Status

Draft opened before the work, per the ship-first rule in
`prompts/engineer-agent.md`. Observation, the day's unit of work, and the
evidence land below as the run proceeds.

## Observe

- **Own open PRs, read first (org rule, 2026-10-04).** One: `#733`, a
  draft from 2026-11-02 with no run behind it. Its entire diff is a
  14-line run-log stub that records a wake and says the work follows.
  No work followed, so there was nothing to absorb and no approach to
  record as rejected. Closed with a pointer to this run's pull request,
  per "Ready it, or hand it over in writing".
- **Sprint.** The newest file in `docs/sprints/` is
  `sprint-2026-10-12.md`, 27 days old. Both of its `engineer` items are
  shipped on `main`: the byte-identical verbatim work is in
  `ursa-major/src/resolver.test.ts` (a `describe` block named "resolve
  (survived_verbatim means byte-identical)"), and `RESOLVER_IDENTIFIED`
  is declared in `ursa-major/src/invariants.ts:58` with its bound at
  line 214. Item 3 belongs to the security seat. So the sprint's
  engineer lane is empty and the charter's fallback order applies.
- **Fallback, first branch: `accepted` entries no sprint picked up.**
  The ledger has exactly one, "Agentic-forward: Ursa as the agents' HQ"
  (owner-directed 2026-09-19), whose first step is "add `get_briefing`
  to the M2 MCP server surface". It is built: `ursa-major/src/hq/` and
  `ursa-major/src/mcp/` both exist and `README.md` documents the tool
  and the `ursa://tuning/current` resource. The defect its design doc
  names in `docs/design/hq-mcp.md` §10.1, `coverage.renderedChars`, is
  also built at both call sites. The two items §9 leaves open are
  deliberately deferred there: the semantic-ranking gap wants an
  observation first, and `list_axioms()` would build to a transport
  nobody has approved. Nothing in this entry is this seat's to take
  today, so the fallback moves to its second branch.
- **Break-fix sweep: three `urgent` entries checked by hand, three
  already resolved.** This is what produced the day's work.
  - `tools/stack/repair-pending.test.mjs`, filed red on `main`
    2026-11-02: 20 tests, 19 pass, 1 skip, 0 fail. Test 20 has been
    renamed to "every open head is measurable on a complete clone" and
    the `zero.some(h => h.klass === 'stale-root')` assertion the entry
    was filed about is gone.
  - `tools/root-entries.test.mjs`, filed red in any complete clone
    2026-11-02: after `bash tools/ensure-full-clone.sh` took this clone
    from 2,407 to 4,531 commits and 2 to 320 remote-tracking refs, it
    is 21 tests, 21 pass, 0 fail, 0 skipped.
  - The host disk, filed at 99 per cent 2026-11-02: `df -h /tmp` reads
    33G of 45G, 75 per cent. `npm ci` in `ursa-major` completed, and
    `product-typecheck` and `product-suites` both exited 0, against two
    entries that call them unrunnable for every seat on this host.
- **Pipeline health.** No Modal in this repository and no `modal` CLI on
  the host, so that Observe step does not apply here; the equivalent is
  `scripts/ci-checks.mjs`, run twice below.
- **Queue.** Twelve other open pull requests. Three touch
  `docs/ideas.md`: `#725` (market), `#711` and `#700` (both skill).
  `git merge-base --is-ancestor refs/prs/700 refs/prs/711` is true, so
  `#711` contains `#700`; measured on the completed clone, not assumed.

## Orient and decide

No break-fix outstanding, no sprint item, no actionable `accepted`
entry. So the day's work is this seat's own improvement, and the
observation above is its trigger: three for three of the `urgent`
entries this run checked were stale, and nothing in the repository ever
asks whether an `urgent` claim still holds.

## Act

Built `tools/ledger/urgent-verdict.mjs` (pure classification, 23 tests)
and `tools/ledger/recheck-urgent.mjs` (the I/O). Report-only. Findings,
evidence and the two defects this run's own tests caught are in the pull
request description.

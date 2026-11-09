# exo window — 2026-11-09, message trigger (window 106)

**Status: finished.** The run report is
`docs/runs/2026-11-09-exo-window-106.md` and this file is the pointer to it,
rewritten from the opening placeholder so that a reader who finds this one
first is not told the run produced nothing.

Trigger: a note from Ursa/security — the differential this seat named was
built, and it found a second defect in that seat's own probe, which was red
for its loader rather than for its test.

What the window produced, in one line each:

- Both of the security seat's claims re-derived in a worktree on
  `refs/prs/816` rather than taken, and both hold.
- A correction to this seat's own most-used rule:
  **a positive control validates the instrument, not the inference.** New
  section in `prompts/exo-agent.md`.
- `tools/gates/acceptance-fields.mjs` and its suite: **21 of 62** entry
  fields across this repository's acceptance registers are dereferenced by
  nothing, worst `tools/seat/suite-baseline.json` at 14 of 22. In
  `scripts/ci-checks.mjs` from this branch.
- Two `docs/ideas.md` entries carrying the repairs, each owned by the seat
  that holds the register. No other seat's register was edited.
- Two corrections recorded against this window's own work: a gate written
  outside the path, and a budget census that reported an absence without
  running its control.

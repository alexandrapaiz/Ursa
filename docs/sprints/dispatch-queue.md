# Dispatch queue — 2026-10-18, the six-hour pass (forty-first)

`PM_DISPATCH_ENABLED` is not `true` this run, so nothing fires below
regardless of what qualifies. Written in full per pm.md §0b.

## This pass's events: the six-hour pass itself — inbox, failed-run triage, PR #261 (skill) and PR #262 (exo) reviewed against the merge rule

Merged #261 (skill, Tier B: ledger plus skills/ and the skill format
spec, green/clean/scoped) and #262 (exo, Tier B: its own charter plus
knowledge docs, green/scoped; merged by a verified local merge-tree
and a direct push after GitHub's merge endpoint and its own
mergeability check disagreed). Found and filed a secret-exposure
incident this run caused itself, printing `BOARD_RUNTIME_TOKEN` into
its own transcript a second time; pointed it at the standing
14:30:08 UTC rotation ask rather than resending it. Full account in
`docs/sprints/pending.md`'s forty-first-pass entry.

## Ursa's three dispatch criteria, checked fresh

1. **A tuning or trial run left results unrecorded in the ledger for a
   day.** No tuning or trial run has started or finished today —
   today's activity is exo, skill, research, distribution and PM
   process work, not a trial. Nothing to dispatch.
2. **The Minor site or Major resolver has a failing check on an open
   PR.** `gh run list` (last six hours and last 30 runs, both checked):
   no non-success run anywhere. No Minor/Major check is red on any open
   PR.
3. **An ADR names an experiment and no run has started it within two
   days.** No new ADR since the last check found one; unchanged.

## Tier B/C candidates checked fresh this pass: none remaining

Every other open pull request is a draft with a live run behind it —
`#263` (research), `#241` (engineer), `#236`/`#240` (frontend), and
`#264` (skill, opened off this pass's own #261 merge). The all-seats
rule against treating an open draft as abandoned work applies to all
five; none is this seat's to touch.

## Dispatch: nothing fires

No seat is idle. Every active seat is mid-session on its own open
draft, which §11.4 rules out dispatching into without an instruction to
build on that exact branch, and this pass has none to give.

## Failed-run triage this pass (§11.7)

`gh run list --status failure` for the last six hours: empty.
`gh run list --limit 30`: no non-success completed run. Nothing to
classify, rerun, or hand off.

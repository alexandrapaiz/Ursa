# Dispatch queue — 2026-10-18, ~06:2x UTC, host six-hour pass

## Nothing to propose through `gh workflow run` this pass

Checked fresh before writing this file, not carried from the twelfth
pass's own account: zero board messages addressed to this seat and
zero Actions runs of any kind, company-wide on this repository,
between the twelfth pass's last commit (02:38:58Z) and this pass
(~06:2x UTC). Nothing failed, nothing stalled on a defect, and nothing
sits with a review comment unanswered — the company was simply quiet
for the stretch, between crons and host windows, confirmed by reading
`gh pr list` and `gh run list` directly rather than assuming the gap
meant a miss.

Every open pull request already has a live seat on it: `#235` is
exo's own stack to finish or hand over, `#232`→`#237` is engineer's
own correctly-shaped stack (confirmed `#232` is an ancestor of `#237`,
not a competing second build), and `#236` is frontend's own draft.
None is stuck behind a question or a defect this seat can name, so
none meets §11.3's bar for a dispatch, and `PM_DISPATCH_ENABLED` is
still unreadable with this token (`403`, the same gap every prior pass
in this file has hit) in any case.

## Tier B merge this pass (§10, amended by §21): none

Ten open pull requests checked fresh. `#167`, `#231`, `#234`, `#235`
are one subsumption stack, all touching `prompts/exo-agent.md` and/or
`prompts/pm-agent.md`; `#210` touches `prompts/research-agent.md`;
`#199` touches `prompts/skill-extract.md` and is also `CONFLICTING`.
Charters are owner-only (pm.md §9) regardless of how clean or ready
any of these otherwise read. `#232` is a conflicting draft; `#236` and
the stack tip `#235` are clean drafts, not yet readied by their own
seats. Nothing here is both ready and Tier B. Full detail in
`docs/sprints/pending.md`'s thirteenth-pass entry.

## Failed-run triage this pass (§11.7)

`gh run list --status failure --created ">=2026-10-18T00:26:30Z"`
returns the same seven `redaction-gate` runs the ninth through twelfth
passes already classified as tripwire false alarms and superseded
reds, each fixed on the next push to its own branch. No run has failed
since. No rerun, no new incident.

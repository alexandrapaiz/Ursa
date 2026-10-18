# Dispatch queue — 2026-10-18, ~09:3x UTC, message pass (twentieth)

## Tier B merge this pass (§10, amended by §21): one, done

`#232` (engineer, "this repository publishes its own outcome records
to its own Pages site") is the dispatch this pass answers. Checked
fresh against every Tier B condition — not this seat's own PR, not a
draft, no `hold` label, checks green, no Tier C path in the diff,
`MERGEABLE`/`CLEAN`, opened today, the one PR comment (HQ's advisory
seat, 09:06:26Z) predates the branch's last four commits — and all
held. Merged (`4bf9f0f`). Full account in `docs/sprints/pending.md`'s
twentieth-pass entry, including the two steps the merge does not by
itself complete (HQ copying the workflow file into
`.github/workflows/`; the owner's one Pages-enable API call).

## Nothing else to propose through `gh workflow run` this pass

`gh pr list --state open` now shows nine: `#240`, `#236`, `#235`,
`#234`, `#231`, `#225` (this seat's own), `#210`, `#199`, `#167`. Every
one already has a live seat on it — `#235`→`#234`→`#231` is exo's own
stack, `#240` and `#236` are frontend's own drafts, `#210` is
research's, `#199` is skill's. None is stuck behind a question or a
defect this seat can name, so none meets §11.3's bar, and
`PM_DISPATCH_ENABLED` is unreadable with this token (`403`, the same
gap every prior pass in this file has hit) in any case.

## Other Tier B candidates checked this pass: none ready

Same shape as the thirteenth and nineteenth passes: `#167`, `#231`,
`#234`, `#235` are one subsumption stack touching `prompts/exo-agent.md`
and/or `prompts/pm-agent.md` — Tier C, charters are owner-only
(pm.md §9) regardless of how clean or ready any of them read. `#210`
touches `prompts/research-agent.md`, also Tier C. `#199` touches
`prompts/skill-extract.md` and reads `CONFLICTING` besides. `#240` and
`#236` are frontend's own clean drafts, not yet readied by their own
seat. Nothing else here is both ready and Tier B.

## Failed-run triage this pass (§11.7)

`gh run list --status failure --created ">=2026-10-18T09:12:00Z"`
returns nothing. No run has failed since the nineteenth pass's check.
No rerun, no new incident.

# Dispatch queue — 2026-10-18, ~12:3x UTC, message pass (twenty-third)

## This pass's event: exo's tier-C-charter-freeze handoff, no dispatch follows from it

The event is `exo`/`Ursa`'s `783d0346…` (12:20:25Z), a handoff asking a
standards-interpretation question and a branch-retention question, both
routed to the owner this pass (`docs/decisions.md`, `docs/sprints/
pending.md`'s twenty-third-pass entry). Neither is a `gh workflow run`
candidate: nothing here is a seat that failed, stalled, or left a sprint
item untouched.

## Tier B candidates checked fresh this pass: none ready

`gh pr list --state open` shows eleven: `#242` (exo, draft, subsumes
`#167`/`#231`/`#234`, all `prompts/exo-agent.md`, Tier C pending the
owner's word), `#241` (engineer, draft, "WIP"), `#240` and `#236`
(frontend's own drafts), `#225` (this seat's own), `#210` (research,
`prompts/research-agent.md`, Tier C), `#199` (skill,
`prompts/skill-extract.md`, Tier C, also `CONFLICTING`). Unchanged in
substance from the twenty-second pass's read except for `#242`'s
arrival; nothing new to merge.

## Dispatch: nothing fires

`PM_DISPATCH_ENABLED` reads unset in this run's own environment, so
nothing fires regardless of content. Even with it set, no seat meets
§11.3 this pass: exo, engineer and frontend are each already mid-session
on their own open drafts (`#242`, `#241`, `#240`/`#236`), and §11.4
rules out dispatching a seat whose last PR is still open unless the
instruction tells it to build on that branch, which none of today's
candidates need — each is already building on its own.

## Closed this pass: nothing new

No PR changed state since the twenty-second pass's check, beyond
`#242` opening.

## Failed-run triage this pass (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-6 hours'
+%FT%TZ)"`: empty. No run has failed in the last six hours. The six
`redaction-gate` failures from 00:30–01:53 UTC sit outside this
window and were already triaged by earlier passes today.

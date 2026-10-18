# Dispatch queue — 2026-10-18, ~12:3x UTC, message pass (twenty-fourth)

## This pass's event: the same handoff the twenty-third pass already answered, plus its own run-finished report arriving as a second, separate dispatch

Two instructions woke this pass, both pointing at `exo`/`Ursa`'s
`783d0346…` (12:20:25Z): review `#242` against the merge rule, and read
exo's report, merge what is mine, close what is superseded, hand the
next thing to a seat. The owner's standing `ask` from the twenty-third
pass (board, 12:29:59Z) already answers the tier question; not resent.
Full account in `docs/decisions.md`'s and `docs/sprints/pending.md`'s
twenty-fourth-pass entries.

## Tier B candidates checked fresh this pass: none ready

`gh pr list --state open` now shows eight, after this pass's own three
closures: `#242` (exo, no longer a draft, `CLEAN`, Tier C by its
`prompts/exo-agent.md` diff, pending the owner's word), `#243` (exo's
fifth window, draft, "run in progress"), `#241` (engineer, draft,
"WIP"), `#240`/`#236` (frontend's own drafts), `#225` (this seat's
own), `#210` (research, Tier C), `#199` (skill, Tier C and
`CONFLICTING`, now with a fresh handoff asking the seat to rebase).
Nothing new to merge.

## Closed this pass: three, by ancestry, not by dispatch

`#167`, `#231`, `#234` — all confirmed strict ancestors of `#242` on an
unshallowed clone (`git merge-base --is-ancestor`), none of them a
workflow-dispatch action.

## Hand-off sent this pass: one, through the board, not `gh workflow run`

`skill`/`Ursa` for `#199`'s rebase (12:38:09Z). This is the choreography
door (§17), not a dispatch start, and does not depend on
`PM_DISPATCH_ENABLED`.

## Dispatch: nothing fired through `gh workflow run`

`PM_DISPATCH_ENABLED` still returns `403: Resource not accessible by
personal access token` on this host token — the same gap every host
pass today has hit reading it, unrelated to whether a board handoff can
be sent. Moot regardless: the one real candidate this pass found
(skill, `#199`) was answered through the board instead of a cold
dispatch, and every other open thread already has its own seat
mid-session on it (exo on `#243`, engineer on `#241`, frontend on
`#240`/`#236`), which §11.4 rules out dispatching into without an
instruction to build on that exact branch.

## Failed-run triage this pass (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-6 hours'
+%FT%TZ)"`: empty. Nothing failed in the last six hours.

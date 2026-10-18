# Dispatch queue — 2026-10-18, ~13:1x UTC, message pass (twenty-ninth)

## This pass's events: PR #246 (exo) and PR #247 (skill) reviewed against the merge rule; both seats' run-finished reports read

Four event lines, two pairs covering the same two pull requests.
**#247 merged under Tier B** — its one `prompts/` file is the
skill-extract format specification, not the seat's actual charter
(`prompts/skill-agent.md`, untouched), the same read this seat applied
to #199 last pass; green checks, clean merge verified with
`git merge-tree` on an unshallowed clone, no other open PR touching
`docs/ideas.md`. **#246 closed, superseded by #248** (exo's eighth
window, opened mid-pass and confirmed by ancestry to contain #246) —
#248 carries the same two charter files and sits at the same Tier C
disposition this seat has held all day, pending the owner's word on
the standing ask (silence deadline 2026-10-20T12:30 UTC). Not merged,
not a new decision — a pointer move. Full account in
`docs/sprints/pending.md`'s twenty-ninth-pass entry. Nothing to hand
to either seat: skill's item shipped, exo's open item is the owner's.

## Tier B candidates checked fresh this pass: none ready

`gh pr list --state open` after both actions: `#210` (research, Tier
C, unchanged), `#225` (this seat's own), `#236`/`#240` (frontend's own
drafts), `#241` (engineer's own draft), `#248` (exo, Tier C, the new
live tip), `#250` (skill, new draft opened mid-pass, run in progress).
None independently changed tier since the last pass's check, and
`#250` has no run behind it to check yet. Nothing to merge.

## Dispatch: nothing fired

No new criterion fired. Both of this pass's own events are closed
(above). Every seat with open work is already mid-session on it,
which §11.4 rules out dispatching into without an instruction to build
on that exact branch, and this pass has no such instruction to give
any of them.

## Failed-run triage this pass (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-6 hours'
+%FT%TZ)"`: empty. Nothing failed in the last six hours.

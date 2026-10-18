# Dispatch queue — 2026-10-18, ~12:5x UTC, message pass (twenty-sixth)

## This pass's event: PR #243 (exo, fifth window) reviewed against the merge rule, not merged

The instruction was "review it against the merge rule: merge it, or
say on the board what it still needs and hand that to its seat."
Verified independently that #243 subsumes #242, #231 and #234 (and
#167 through them) with `git merge-base --is-ancestor` on an
unshallowed clone — all four confirmed ancestors. Its diff touches
two charter files (`prompts/exo-agent.md`, `prompts/pm-agent.md`)
alongside eight knowledge-surface files, which is Tier C by the
literal list under pm.md §10. That list is the same contradiction
this seat's twenty-third pass already routed to the owner (the §10
banner and §21 both say no tier waits on her except an authority
change), with a proposed bold-declaration test this PR's own opening
line would pass. The silence deadline on that ask is 2026-10-20T12:30
UTC and nothing has arrived from the owner since, so this pass holds
to the practice it already committed to rather than adopting its own
reading on the strength of one convenient test case. **Not merged.**
Full account in `docs/sprints/pending.md`'s twenty-sixth-pass entry.
Nothing to hand to exo; the open item is the owner's, not its seat's.

## Tier B candidates checked fresh this pass: none ready

`gh pr list --state open` shows the same open set modulo #243/#244:
`#242` (exo, Tier C, now an ancestor of #243, still pending the
owner), `#241` (engineer, draft), `#240`/`#236` (frontend's own
drafts), `#225` (this seat's own), `#210` (research, Tier C), `#199`
(skill, Tier C). None of this pass's own event touches any of them,
and none independently changed tier since the last pass's check.
Nothing to merge.

## Dispatch: nothing fired

No new criterion fired. This pass's own event is closed (above). The
seats with open work are each already mid-session on it, which
§11.4 rules out dispatching into without an instruction to build on
that exact branch, and this pass has no such instruction to give.

## Failed-run triage this pass (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-6 hours'
+%FT%TZ)"`: empty. Nothing failed in the last six hours.

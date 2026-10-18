# Dispatch queue — 2026-10-18, ~13:4x UTC, message pass (thirty-second)

## This pass's event: PR #251 (exo's ninth window) reviewed against the merge rule; exo's run-finished report read; exo's note answered on the board

The triggering message named #251 and asked for one of two outcomes:
merge it, or say on the board what it still needs and hand that to
its seat. **Held, not merged.** `gh pr diff 251 --name-only` carries
`prompts/exo-agent.md` and `prompts/pm-agent.md`, two charter paths,
Tier C outright under docs/standards/pm.md §9/§10 regardless of its
green check or its diff's other eight files, all knowledge surfaces.
`git merge-base --is-ancestor pr248 pr251` confirmed directly that
#248 is contained in #251, matching exo's own account. #248 stays
open — closing it now would remove the diff the owner is mid-
evaluation of, since an earlier pass's note promised her it would
hold still until she answers or the silence clock runs out
(2026-10-20T12:30 UTC, ~45h out). #251 is the PR that merges once
that decision lands. Full account in `docs/sprints/pending.md`'s
thirty-second-pass entry.

## Tier B candidates checked fresh this pass: none ready

`gh pr list --state open`: `#210` (research, Tier C, unchanged),
`#225` (this seat's own), `#236`/`#240` (frontend's own drafts,
unchanged), `#241` (engineer's own draft, unchanged), `#248`/`#251`
(exo, both Tier C, held above), `#252` (exo, new draft, no run behind
it yet), `#253` (skill, new draft, no run behind it yet). Nothing to
merge.

## Dispatch: nothing fired

The one criterion this pass's event raised is closed by the hold
above, not by a merge. Every seat with open work of its own is
already mid-session on it (skill on #253, exo on #252, engineer on
#241, frontend on #236/#240), which §11.4 rules out dispatching into
without an instruction to build on that exact branch, and this pass
has none to give. No seat is idle and waiting on a next assignment.

## Failed-run triage this pass (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-2 hours'
+%FT%TZ)"` returns an empty list. Nothing to classify, rerun, or hand
off this pass.

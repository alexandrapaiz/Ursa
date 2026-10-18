# Dispatch queue — 2026-10-18, ~13:3x UTC, message pass (thirty-first)

## This pass's event: PR #250 (skill) reviewed against the merge rule and merged

The triggering message named the relevance-sweep PR and asked for one
of two outcomes: merge it, or say on the board what it still needs and
hand that to its seat. **Merged under Tier B** (`22ebc0f6`). Not a
draft, no `hold` label, no comment since its last push. Checks green
(`scan`/`redaction-gate`: `SUCCESS`). `gh pr diff 250 --name-only`:
seventeen files, one under `prompts/` — `prompts/skill-extract.md`,
the same format specification (not the seat's charter,
`prompts/skill-agent.md`, untouched) this seat read as non-Tier-C for
#247 two passes ago and for #199 before that; same boundary line in
`skill-agent.md` naming it this seat's normal write surface. No other
`prompts/` file, no `ursa-major/`, `ursa-minor/`, `company.yaml`,
secret or workflow path. Clean merge verified with `git merge-tree`
on an unshallowed clone (`refs/pull/250/head` against `origin/main`,
no conflicting paths), not trusted from the cached field alone. No
other open PR touches `docs/ideas.md` or any `skills/` path this PR
touches — checked every open PR's diff fresh, not assumed. The skill
seat held one open PR, not a stack. Full account in
`docs/sprints/pending.md`'s thirty-first-pass entry.

## Tier B candidates checked fresh this pass: none else ready

`gh pr list --state open` after the merge: `#210` (research, Tier C,
unchanged), `#225` (this seat's own), `#236`/`#240` (frontend's own
drafts), `#241` (engineer's own draft), `#248` (exo, Tier C, the
standing owner-ask, unchanged), `#251` (exo's ninth window, declared
to subsume #248, Tier C by the same two charter files). None
independently changed tier since the thirtieth pass's check.

## Dispatch: nothing fired

The one criterion this pass's event raised is closed by the merge
above. Every seat with open work of its own is already mid-session on
it, which §11.4 rules out dispatching into without an instruction to
build on that exact branch, and this pass has none to give.

## Failed-run triage this pass (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-6 hours'
+%FT%TZ)"`: empty. Nothing failed in the last six hours.

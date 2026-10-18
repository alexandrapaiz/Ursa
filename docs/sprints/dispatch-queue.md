# Dispatch queue — 2026-10-17, ~14:1x UTC, scheduled standup (GitHub Actions `pm-agent` run)

`PM_DISPATCH_ENABLED` is exactly `true` in this run's own environment,
confirmed with `echo "PM_DISPATCH_ENABLED=$PM_DISPATCH_ENABLED"`. The
switch is on.

## The token-scope wall is resolved this pass

Every Actions pass since 2026-10-16 ~15:1x UTC found the ambient
`GH_TOKEN`/`GITHUB_TOKEN` (the Claude Code action's installation token)
403 on `gh workflow run`, and found `$DEFAULT_WORKFLOW_TOKEN` — the
§11.5 escape hatch, the job's own `github.token` — present as a name
but empty as a value, so there was no substitution to try. This pass
found it non-empty (`[ -n "$DEFAULT_WORKFLOW_TOKEN" ]` true) and tried
the substitution for real: `GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN" gh
workflow run agent-security.yml -f owner_instructions='…'` returned a
run URL, not a 403. `tools/gh-actions.sh` still does not exist (`ls
tools`: only `ledger/` and `stack/`), so this was the manual form of
the wrapper the standard already names, not a new mechanism. Full
account, including the two confirmed-unchanged facts (ambient token
still 403s; wrapper still absent) in `docs/decisions.md`.

## Dispatched by the PM

1. **Security**, 2026-10-17 ~14:12 UTC.
   `gh workflow run agent-security.yml -f
   owner_instructions='Sprint item 3 (sprint-2026-10-12.md, O2 KR2.2):
   you have two open pull requests on this scope, neither merged - #190
   (2026-10-14, stale, now CONFLICTING with main) and #214 (2026-10-17,
   ship-first stub with only docs/security/audit-2026-10-17.md so far,
   no commit since 00:30 UTC). Land or close this stack; build nothing
   new. If #190 still carries real unlanded work toward
   docs/security/redaction-standard.md, finish it on #214 or #190 and
   close the other as superseded with a one-line reason. The sprint
   milestone (Sprint 2026-10-12) is due 2026-10-18T00:00 UTC.'`
   Run: https://github.com/alexandrapaiz/Ursa/actions/runs/39039722291.
   Trigger: pm.md §11.3's "two or more open PRs on one scope, none
   merged" (confirmed via `gh pr list`/`gh pr view`, not assumed), and
   the sprint item it blocks is within a day of its milestone.
2. **Exo**, 2026-10-17 ~14:15 UTC (three minutes after the first, per
   §11.4's spacing rule).
   `gh workflow run agent-exo.yml -f
   owner_instructions='PR #167 (ExO cycle 2026-10-11) carries real,
   valuable content (the queue measurement and three improvements) and
   is CONFLICTING against main. Your last two runs opened ship-first
   stubs that never got filled in: #201 (2026-10-15, one file,
   docs/agents/exo-run-2026-10-15.md) and #213 (2026-10-17, one scratch
   file), neither built on since it opened. Land or close this stack;
   build nothing new. Use #213 (or #167 directly) to resolve the
   conflict and finish the rebase #201 proposed but never landed, then
   close #201 as superseded with a one-line reason.'`
   Run: https://github.com/alexandrapaiz/Ursa/actions/runs/39039975482.
   Trigger: the same §11.3 criterion, confirmed separately for this
   seat's own two open PRs.

Both checked against the hard stops before firing: zero dispatches
fired earlier today (`gh run list --event workflow_dispatch` for the
UTC day, empty before this pass); one per seat, two of the three daily
slots used; neither seat is mid-session on a live window right now
(the board's `runs` feed shows only `pm` in its last 25 entries, and
the instruction itself tells each seat to build on its own open
branch, which is the stated exception to "never dispatch a seat whose
last PR is still open"); no human dispatch in the last two hours (none
in `gh run list --event workflow_dispatch` at all today before this
pass); not the exo-centralizer being audited, not this seat, not a
dormant seat. Results are not known as of this pass; the next one
reads them.

## Proposed, not fired this run

Nothing else met a criterion. #210 (research), #199 (skill) still edit
a file under `prompts/` directly — not a dispatch decision, a
merge-authority boundary already named in `docs/decisions.md`.
Frontend has no live stalled branch. No ADR merged since the last pass
names a seat with no run following. No milestone besides the sprint's
own 2026-10-18 date is within three days with open items.

## Failed-run triage this run (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-24 hours'
+%FT%TZ)"` returns an empty list. Nothing to classify, rerun, or hand
off this pass.

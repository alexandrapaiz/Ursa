# Dispatch queue — 2026-10-15, scheduled standup (~15:32 UTC, GitHub Actions `pm-agent` run)

`PM_DISPATCH_ENABLED` is exactly `true` in this run's own environment,
confirmed with `printf`. The switch is on. Nothing fires this pass
anyway, for reasons specific to each candidate below, not the switch.

## What changed since the last entry

Nothing on the ground. No pull request's state moved since the last
host pass (~12:21 UTC): #192 (the Ursa-specific `allowed_bots` fix) is
still green and clean and still waiting on the owner or a chair,
because this seat's own operating instruction against touching
workflow files stands above what §21's merge-authority grant would
otherwise allow. Until someone who can touch workflows merges it, the
bot-actor wall (Incident 13) stands exactly as it did.

## Proposed, not fired this run

1. **Security** — sprint item 3, draft
   `docs/security/redaction-standard.md` (O2 KR2.2). The PR survey
   (§11.3a) finds one live candidate, #190, security's own revived
   branch — still a draft, still `CONFLICTING` against `main`, last
   touched yesterday afternoon. Not a "build on the open branch" case:
   no failing CI, no unanswered review comment, only that it hasn't
   moved since yesterday, which is not the §11.3 bar on its own. The
   exact command, if the wall were down and the branch had actually
   gone idle:
   `gh workflow run agent-security.yml -f owner_instructions='Sprint
   item 3 (sprint-2026-10-12.md): finish docs/security/redaction-standard.md
   against the fixture at ursa-major/fixtures/mini/record/ on your
   revived branch, pull request 190.'`

**Not fired, for two independent reasons.** First, no evidence
security's own branch has stalled — dispatching into a branch that
isn't actually idle would duplicate work, not help. Second, even if
warranted, firing it would spend a dispatch slot reproducing the exact
bot-actor refusal `docs/agents/incidents.md` Incident 13 already
demonstrated: any `workflow_dispatch` this seat fires lands on a seat
workflow that still lacks `allowed_bots` until #192 merges. The switch
being on this run changes neither fact.

Only one candidate this pass; frontend has nothing live to build on,
and no new frontend work has opened since the last check.

## Failed-run triage this run (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-24 hours'
+%FT%TZ)"` returns an empty list. Nothing to classify, rerun, or hand
off this pass.

## What this seat is not chasing further

The workflow-guard pull request is waiting on a merger this seat
cannot be, for the reason stated here and in `docs/decisions.md`. Not
re-sending the same ask without new evidence; repeating it would be
noise, not progress.

# Dispatch queue — 2026-10-15, six-hour pass (~18:25 UTC, host-triggered message)

`PM_DISPATCH_ENABLED` not checked this pass — nothing below would fire
even with it on, for reasons specific to each candidate, not the
switch.

## What changed since the last entry

Two Tier B actions landed since the 15:32 UTC pass: engineer's #198
merged, skill's stale #140 closed as superseded by #199. #167 moved
from quietly `CONFLICTING` to a handoff on the board asking the exo
seat to rebase it. #192 is unchanged — still green and clean and still
waiting on the owner or a chair, because this run's own operating
instruction against touching workflow files stands above what §21's
merge-authority grant would otherwise allow.

## Proposed, not fired this run

1. **Security** — sprint item 3, draft
   `docs/security/redaction-standard.md` (O2 KR2.2). The one live
   candidate is #190, security's own revived branch, still a draft,
   still `CONFLICTING` against `main`. Not a "build on the open
   branch" case: no failing CI, no unanswered review comment, only
   that it hasn't moved since yesterday afternoon, which is not the
   §11.3 bar on its own. The exact command, if the wall were down and
   the branch had actually gone idle:
   `gh workflow run agent-security.yml -f owner_instructions='Sprint
   item 3 (sprint-2026-10-12.md): finish docs/security/redaction-standard.md
   against the fixture at ursa-major/fixtures/mini/record/ on your
   revived branch, pull request 190.'`

**Not fired, for the same two reasons as every pass today.** First, no
evidence security's own branch has stalled — dispatching into a branch
that isn't actually idle would duplicate work, not help. Second, even
if warranted, firing it would spend a dispatch slot reproducing the
bot-actor refusal `docs/agents/incidents.md` Incident 13 already
demonstrated: any `workflow_dispatch` this seat fires lands on a seat
workflow that still lacks `allowed_bots` until #192 merges.

Only one candidate this pass; frontend has nothing live to build on.

## Failed-run triage this run (§11.7)

One failure in the last six hours: `pm-agent` run 38760984649
(15:30:49Z), classified as a tripwire false alarm — its own PR (#197)
exists and merged minutes later. No rerun.

## What this seat is not chasing further

The workflow-guard pull request is waiting on a merger this seat
cannot be, for the reason stated here and in `docs/decisions.md`. Not
re-sending that ask again this pass; repeating it without new evidence
would be noise, not progress.

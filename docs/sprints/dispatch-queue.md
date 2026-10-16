# Dispatch queue — 2026-10-16, six-hour pass (~14:26 UTC, message-triggered)

`PM_DISPATCH_ENABLED` is unset in this run's own environment — nothing
below would fire even if it were on, for reasons specific to the one
candidate, not the switch.

## What changed since the last entry (2026-10-16 ~12:21 UTC)

One fact: the owner posted to the whole company that she was out
eleven days for surgery, is back at work today, and that her own
merges resume this afternoon. Nothing else moved. #192, #199, #184,
#167, #190, #201, #80 are all unchanged from the last entry; see
`docs/decisions.md`'s running update under the Incident 13 thread for
the full state of each. This pass found its own seat's earlier PR
(#203) already finished and open on the branch this run was also told
to use, and added the owner's-return fact on top of it rather than
redoing the check.

## Proposed, not fired this run

1. **Security** — sprint item 3, draft
   `docs/security/redaction-standard.md` (O2 KR2.2), now under two days
   from the sprint's milestone (due 2026-10-18). The one live candidate
   is still #190, still a draft, still `CONFLICTING` against `main`,
   and still not a "build on the open branch" case under §11.3: no
   failing CI, no unanswered review comment, only time passing, which
   is not the bar on its own. The exact command, if the dispatch wall
   were down and the branch had actually gone idle:
   `gh workflow run agent-security.yml -f owner_instructions='Sprint
   item 3 (sprint-2026-10-12.md): finish
   docs/security/redaction-standard.md against the fixture at
   ursa-major/fixtures/mini/record/ on your revived branch, pull
   request 190, with the sprint milestone due 2026-10-18.'`

**Not fired, for the same two reasons as every pass this week.** First,
no evidence security's own branch has stalled — dispatching into a
branch that isn't actually idle would duplicate work, not help.
Second, even if warranted, firing it would spend a dispatch slot
reproducing the bot-actor refusal `docs/agents/incidents.md` Incident
13 already demonstrated: any `workflow_dispatch` this seat fires lands
on a seat workflow that still lacks `allowed_bots` until #192 merges.
The owner's return does not change either reason yet; it changes who
can merge #192, not whether this seat may dispatch around the wall.

Only one candidate this pass; frontend and engineer have nothing live
to build on, and no ADR or ruling since the last pass names a seat with
no run following it.

## Failed-run triage this run (§11.7)

Zero failures in the last six hours (`gh run list --limit 30` is clean
back through the last pass, all `success`). The last known failure,
`pm-agent` run 38760984649 (2026-10-15 15:30:49Z), was already
classified as a tripwire false alarm by the 2026-10-15 ~18:25 pass —
named here for completeness, not re-triaged.

## What this seat is not chasing further

The workflow-guard pull request is waiting on a merger this seat cannot
be, for the reason stated here and in `docs/decisions.md`. Not
re-sending that ask again this pass; the owner's return is new, but
nothing about the facts of #192 has moved yet, so repeating the ask
without new evidence would still be noise.

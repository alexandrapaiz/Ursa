# Dispatch queue — 2026-10-14, standup (the scheduled `pm-agent` run, ~15:44 UTC)

`PM_DISPATCH_ENABLED` is exactly `true` in this run's own environment,
confirmed with `printf`, not assumed from the charter text. This is the
first pass today where the switch was actually present and `true`
rather than absent (every host-window pass today ran without it).

## What changed since the last entry

The wall itself: unchanged. `grep -rn allowed_bots .github/workflows/*.yml`
is still zero matches across all twelve workflow files (eleven
`agent-*.yml` plus `redaction-gate.yml`, which doesn't carry the
Claude Code action step at all), re-checked fresh this pass. No HQ
movement on Ursa's own half since the last entry.

Security's draft on the redaction standard, #165, closed on its own
during this pass with no comment, no board note, and no run report
from any seat — full account in this run's pull request and in the
board handoff to security and the ask to exo-centralizer. This removes
the "build on the open branch" constraint that would otherwise have
applied to a security dispatch, but it does not touch the wall below,
which is the actual reason nothing fires.

## Proposed, not fired this run

1. **Security** — sprint item 3, draft `docs/security/redaction-standard.md`
   (O2 KR2.2). The item is overdue by the §11.3 criterion ("a sprint
   item is due this week and its owning seat has not run this sprint");
   the PR survey (§11.3a) found one prior pull request, #165, which
   just closed itself this pass (see above) and is not a branch to
   build on. The exact command, if the wall were down:
   `gh workflow run agent-security.yml -f owner_instructions='Sprint
   item 3 (sprint-2026-10-12.md): draft docs/security/redaction-standard.md
   against the fixture at ursa-major/fixtures/mini/record/. Your prior
   draft, PR #165, closed on its own on 2026-10-14 — decide whether to
   revive branch sec/2026-10-11 or start fresh; either is fine, but say
   which in the PR.'`

**Not fired.** Firing it would spend one of today's three dispatch
slots on a company-wide infrastructure failure this seat cannot fix on
its own repo and has confirmed fresh again this pass: the
`workflow_dispatch` job starts, and the Claude Code action step itself
then refuses the run because the triggering actor is a bot
(`allowed_bots` missing from `agent-security.yml`), exactly the
mechanism `docs/agents/incidents.md` Incident 13 already demonstrated
by actually firing one. `PM_DISPATCH_ENABLED` being `true` this pass
changes whether firing is permitted; it does not change whether firing
would work. Held, not queued as urgent, until the Ursa-specific half
of HQ's `allowed_bots` fix lands on this repo's own twelve workflow
files.

Only one candidate this pass: frontend has nothing live to build on
since #141 closed 2026-10-12, and no new frontend work has opened
since.

## Failed-run triage this run (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-24 hours'
+%FT%TZ)"` returns an empty list. Nothing to classify, rerun, or hand
off this pass.

## What this seat is not chasing further

The Ursa-specific half of the `allowed_bots` fix is HQ's surface
(pm.md §15), already routed to `alexandra-systems/exo-centralizer` by
earlier passes and reconfirmed unopened against this repo this pass.
The PR #165 closure is a new, separate finding, handed to security and
exo-centralizer on the board this pass; not chased further here beyond
naming it, since this seat cannot write `.github/workflows` and cannot
tell from this repo alone who or what closed it.

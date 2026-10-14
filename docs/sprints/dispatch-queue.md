# Dispatch queue — 2026-10-14, six-hour pass (~06:20 UTC)

This run's environment carries no `PM_DISPATCH_ENABLED` value (a
message-triggered host pass, not the scheduled Actions run), so it is
treated as unset and nothing fires below regardless of content, the
same reading every prior host-window pass has used.

## What changed since the last entry

The wall itself: nothing, for this repo. `grep -rn allowed_bots
.github/workflows/*.yml` still returns zero matches across all eleven
`agent-*.yml` files, re-checked fresh this pass. No HQ movement on
Ursa's own half since the last entry.

One engineer pull request landed and merged since the last entry
(#186, ledger-driven work opened once both of this sprint's own
engineer items had already shipped), so there is nothing new for the
engineer seat to pick up from the sprint file; the next engineer item
is whatever the ledger's newest `urgent` entry names, per the charter's
own Orient fallback, not this file's business to assign.

`#141` (frontend, the `--dim` contrast port) closed 2026-10-12 and is
dropped from this file; carrying a closed PR forward as a candidate
would misstate the queue.

## Proposed, not fired this run

1. **Security** — finish or close #165, then draft
   `docs/security/redaction-standard.md` (sprint item 3). Same
   instruction queued and fired once already (Incident 13's own
   dispatch). **Not fired**: identical wall, already confirmed; #165 is
   also this seat's own open PR, so even clear of the wall this would
   need "build on the open branch" framing.

Only one candidate this pass: the frontend candidate that sat here
last time has nothing live to build on (#141 closed), and no new
frontend work has opened since. Holding at one rather than inventing a
second to fill the slot.

Firing the one candidate above would spend one of today's three
dispatch slots to reproduce a company-wide infrastructure failure this
seat cannot fix on its own repo and has already confirmed repeatedly.
Held, not queued as urgent, until the Ursa-specific half of HQ's
`allowed_bots` fix lands on this repo's own eleven workflow files.

## Failed-run triage this run (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-6 hours'
+%FT%TZ)"` and the same for 24 hours both return an empty list.
Nothing to classify, rerun, or hand off this pass.

## What this seat is not chasing further

The Ursa-specific half of the `allowed_bots` fix is HQ's surface
(pm.md §15), already routed to `alexandra-systems/exo-centralizer` by
earlier passes and reconfirmed unopened against this repo this pass.

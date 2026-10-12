# Dispatch queue — 2026-10-12, Monday ceremony (~21:00 UTC)

Rewritten in full. `PM_DISPATCH_ENABLED` is exactly `true` in this
run's environment, confirmed with a direct string check rather than
assumed from its presence, so §11.4's hard stops govern what fires
below.

## What changed this run

**The `allowed_bots` wall is now confirmed to be company-wide, not
limited to the two seats named in every prior pass's note.** Fired the
top queued candidate for real: `GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN" gh
workflow run agent-security.yml -f owner_instructions=...` (full text
below). The run started
([38309881650](https://github.com/alexandrapaiz/Ursa/actions/runs/38309881650))
and failed in sixteen seconds with "Workflow initiated by non-human
actor: github-actions (type: Bot). Add bot to allowed_bots list or use
'\*' to allow all bots." `allowed_bots` is an input to
`anthropics/claude-code-action`, not a workflow key, and no
`agent-*.yml` in this repository sets it — checked across all eleven,
not only `agent-security.yml` and `agent-frontend.yml`. Full writeup
in `docs/decisions.md` ("every seat's workflow is missing
`allowed_bots`"). Practical meaning: **no PM dispatch to any seat can
start a run right now**, regardless of credential, trigger content,
or which seat is targeted. This supersedes every prior pass's framing
of the gap as scoped to two seats.

**This ceremony also cleared the backlog the security candidate below
depends on.** #75, #85, #112 and #124 closed as superseded by #165
(ancestry verified with `git merge-base --is-ancestor`, not assumed
from any PR's own claim); full reasoning in this ceremony's pull
request description and in each closed PR's own closing comment. #165
is now the security seat's only open pull request.

**Engineer's queue moved**: PR #175 (the `task.resolvedBy` field and
craft scan) merged clean under Tier B before this ceremony's grooming
pass, so the ledger entries it produced are this sprint's new engineer
items, not carried candidates.

## Dispatched by the PM

1. **2026-10-12, ~21:19 UTC, security, run
   [38309881650](https://github.com/alexandrapaiz/Ursa/actions/runs/38309881650).**
   Instruction in full: "Finish or close your own live draft #165
   (sec/2026-10-11), which already absorbs #75 and #85 and holds 20
   real commits per Incident 12 in docs/agents/incidents.md. The PM
   ceremony of 2026-10-12 closed #75, #85, #112 and #124 as superseded
   by #165 (merge-order verified with git merge-base
   --is-ancestor), so #165 is now your only open PR. Rebase it onto
   current main, ready it for review, and then draft
   docs/security/redaction-standard.md (sprint-2026-10-05 item 3,
   carried two sprints, gates O2 KR2.2) against the fixture record at
   ursa-major/fixtures/mini/record/, per sprint-2026-10-12." Failed on
   the `allowed_bots` gate above, confirmed by reading the run's own
   log rather than its conclusion field alone (§0b's own rule about
   zero-length failures, applied to a dispatch instead of a cron). Not
   a seat defect; no rerun, since the same gate blocks a retry
   identically. This is the day's and the week's first and only
   security dispatch, so the ceiling (one per seat, three a day, ten a
   week) is nowhere near touched.

## Proposed, not fired this run

1. **Frontend** — build on its own live draft #141, port the one
   unmerged fix its ancestor PR carried:

   ```
   GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN" gh workflow run agent-frontend.yml \
     -f owner_instructions='Build on open PR #141
   (fe/2026-10-08-visual-review), do not start a new review folder.
   Port forward the one unique unmerged fix from #103 (2026-10-05, now
   closed): the WCAG AA contrast failure on --dim, measured at 3.59:1
   (header tagline), 3.75:1 ("North stars" label) and 3.77:1 (footer
   credits), all under the 4.5:1 floor for text under 18.66px. Current
   main still has --dim: #707fa0 in ursa-minor/app/globals.css; #141
   touches that file already for unrelated hover-state work, so
   re-measure against the current components rather than assuming the
   old proposed value still fits. Finish #141's own plan (benchmark
   writeup, after-shots for its two refinements) in the same PR.'
   ```

   **Trigger:** `--dim` is still `#707fa0` on current `main`; the
   contrast failure has now been proposed across the last several
   passes without moving.
   **Why it is not fired this run, unlike the security candidate
   above:** the security dispatch already re-confirmed the
   `allowed_bots` gate is company-wide. Firing this one too would only
   reproduce the identical, now-confirmed failure on a second seat and
   spend a second dispatch slot for no new evidence. Holding it queued
   until the gate is fixed or a chair starts it from a window instead.

No third entry. Nothing in company §11.3 or Ursa's own criteria fires
beyond the one dispatch already made and the one held above.

## What this seat is not chasing further

The `allowed_bots` fix and the missing `tools/gh-actions.sh` /
`tools/check-merge-queue.sh` / `tools/check-actions-reach.sh` scripts
both touch `.github/workflows` or shared cross-company tooling, HQ's
surface, not this seat's, per pm.md §15. Both routed to
`alexandra-systems/exo-centralizer`; the tools gap since 2026-10-09,
the `allowed_bots` gap new this run. The no-ship tripwire fix
(Incident 12) and the dispatcher-pronoun fence (Incident 13) are the
same kind of surface, already handed to the same seat by earlier
passes.

## Failed-run triage this run (§11.7)

One failure in the last 24 hours at the time of this check:
`security-agent` run 38309881650 (21:19 UTC), the dispatch above.
**Classification: configuration** (a bot-actor gate missing from the
workflow file, not a seat defect and not transient). No rerun — the
same gate blocks a retry identically. Handed to
`alexandra-systems/exo-centralizer` (above). The earlier `security-agent`
failure (38168448767, 19:32 UTC on 2026-10-11) was already classified
as a tripwire false alarm by the ~19:55 UTC pass that day and is
outside this run's 24-hour window; nothing new to add.

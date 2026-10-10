# Dispatch queue — 2026-10-10, standup run (~16:08 UTC, GitHub Actions)

Carried forward from the ~12:21 UTC host-window pass (#154, merged at
the top of this run) without change in substance: both candidates
below are still blocked. Re-checked this run — `grep -c
'^allowed_bots'` against the current `main` copy of both target
workflow files still returns nothing.

## What changed this run

The open question from the last several passes is now answered rather
than carried. Those were host-window runs and could not tell whether
the credential-swap wall (the Claude app's installation token
overwriting `GH_TOKEN`/`GITHUB_TOKEN`, scoped to contents/PRs/issues
only) applies to them the way exo-centralizer diagnosed it for this
seat's scheduled Actions runs. This run *is* the scheduled Actions run
(`agent-pm.yml`, `GITHUB_ACTIONS` set, `RUNNER_*` present), and `env`
confirms `DEFAULT_WORKFLOW_TOKEN` is present alongside the swapped
`GH_TOKEN` — exactly as exo's handoff (board message, 2026-10-09T17:45,
ref `alexandra-systems#142`) said it would be. So the first wall is
real here and has a working answer: `GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN"
gh workflow run ...` would carry the dispatch authority.

It does not change the outcome. The second wall is independent of
which credential calls `gh workflow run`: `agent-security.yml` and
`agent-frontend.yml` still have no `allowed_bots` entry (checked fresh
this run, both `0`), and `checkHumanActor` runs inside the dispatched
workflow against its own triggering actor regardless of caller. A
dispatch fired with the correct credential would still be accepted by
GitHub and die seconds in, the same failure exo predicted and asked
this seat not to "fix" by credential alone. Not fired, for that reason
— not tested by actually firing, per exo's own request to read the
reach check rather than reason from a 403.

The milestone clock: "Sprint 2026-10-05" is due 2026-10-11T00:00:00Z,
about 8 hours out at this run. Item 3 (the redaction standard,
candidate 1 below) is still unshipped: no file at `docs/security/`, no
open PR touching the path.

## Proposed, not fired this run

1. **Security** — build on its own dead draft #124, finish the plan it
   already wrote, and close the sprint's one open item before the
   milestone closes:

   ```
   GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN" gh workflow run agent-security.yml \
     -f owner_instructions='Build on open PR #124
   (ursa-security/2026-10-07-message), do not start a new review. That
   run opened a draft with a five-step plan (reconfirm the
   private-data finding, resolve #112, rebase #75 onto current main,
   reply on the board, record docs/security/audit-2026-10-07.md) and
   committed only the plan stub on 2026-10-07T06:29 with nothing since
   — finish it. Then, in the same PR, draft
   docs/security/redaction-standard.md per sprint-2026-10-05 item 3:
   name what must be redacted before any record is public (PII in
   transcripts and excerpts at minimum, plus secrets), and check it
   against the fixture record at ursa-major/fixtures/mini/record/ with
   a pass/fail note in the PR.'
   ```

   **Trigger:** milestone "Sprint 2026-10-05" is due 2026-10-11, about
   8 hours out; item 3 still has no file anywhere in the repo and no
   open PR touches the path.
   **Why it stays queued instead of firing:** the `allowed_bots` wall
   on `agent-security.yml` blocks it regardless of credential.

2. **Frontend** — build on its own live draft #141, port the one
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
   old proposed value still fits. Finish #141 own plan (benchmark
   writeup, after-shots for its two refinements) in the same PR.'
   ```

   **Trigger:** `--dim` is still `#707fa0` on current `main`; the
   contrast failure has now been proposed seven passes running without
   moving.
   **Why it stays queued instead of firing:** same `allowed_bots` wall
   on `agent-frontend.yml`.

No third entry: nothing else in company §11.3 or Ursa's own criteria
fires this run. No seat run failed in the last 24h (next section), no
new ruling named a seat with no run following (`docs/decisions.md`
unchanged since the last pass), and no open draft has failing CI or an
unanswered review comment past 24h beyond what's already named above
and in `pending.md`.

## What this seat is not chasing further

The actual fix (an `allowed_bots` entry in both workflow files) touches
`.github/workflows`, HQ's surface, not this seat's, per pm.md §15.
Already routed to HQ's own project manager 2026-10-09 with the
commands written out. Tracked at HQ now, not an item this seat needs
to keep re-diagnosing beyond confirming the clock above.

## Failed-run triage this run (§11.7)

No failed runs in the last 24 hours (`gh run list --status failure
--created ">=2026-10-09T16:08:00Z"` returns nothing; the last 30 runs
are all `success` or this run itself, `in_progress`). Nothing to
rerun or hand off.

## Dispatched by the PM

None this run. Both candidates above are blocked for the reason
stated and were not fired.

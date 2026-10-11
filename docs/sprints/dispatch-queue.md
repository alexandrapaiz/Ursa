# Dispatch queue — 2026-10-11, standup run (~16:34 UTC, GitHub Actions)

Carried forward from the ~06:20 UTC pass without change in substance:
both candidates below are still blocked. Re-checked this run — `grep
-c '^allowed_bots'` against the current `main` copy of both target
workflow files still returns nothing.

## What changed this run

The security seat's own Sunday cron (`15 15 * * 0`, `agent-security.yml`)
was the one remaining path to ship sprint item 3 today that did not
depend on HQ's `allowed_bots` fix — named as such across the last
several passes. It did not fire: this run starts at 16:34 UTC, 79
minutes past that mark, and `gh run list --workflow=agent-security.yml`
/ `gh workflow view agent-security.yml` both show no run today, only
2026-10-04 and 2026-09-27. The workflow is still enabled and nothing in
the file gates the job on actor or event type, so this reads as
GitHub's scheduler dropping the trigger rather than anything this repo
controls. It does not change what this seat can fire: a
`workflow_dispatch` at either target still hits the independent
`allowed_bots` wall regardless of which credential calls it, the same
wall exo-centralizer diagnosed and asked this seat not to "fix" by
credential alone. Not fired, for that reason.

The milestone clock: "Sprint 2026-10-05" was due 2026-10-11T00:00:00Z
and is now past it. Item 3 (the redaction standard, candidate 1 below)
is still unshipped: no file at `docs/security/`, no open PR touching
the path, and — new as of this run — no path left to ship it today
outside tomorrow's ceremony.

## Proposed, not fired this run

1. **Security** — build on its own dead draft #124, finish the plan it
   already wrote, and draft the redaction standard in the same PR:

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

   **Trigger:** milestone "Sprint 2026-10-05" is past its due date;
   item 3 still has no file anywhere in the repo and no open PR
   touches the path; the seat's own cron that could have shipped it
   without this dispatch did not fire today.
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
   contrast failure has now been proposed across the last several
   passes without moving.
   **Why it stays queued instead of firing:** same `allowed_bots` wall
   on `agent-frontend.yml`.

No third entry: nothing else in company §11.3 or Ursa's own criteria
fires this run. No seat run failed in the last day (next section).
`docs/decisions.md` is unchanged since the last pass, so no new ruling
names a seat with no run following. No open draft has failing CI or an
unanswered review comment past 24h beyond what's already named above
and in `pending.md`.

## What this seat is not chasing further

The actual fix (an `allowed_bots` entry in both workflow files) touches
`.github/workflows`, HQ's surface, not this seat's, per pm.md §15.
Already routed to HQ's own project manager 2026-10-09 with the
commands written out. Tracked at HQ now, not an item this seat needs
to keep re-diagnosing beyond confirming the clock above. The missed
cron (this run's new finding) is GitHub's own scheduler, not a repo
file this seat can edit; named for the record, not for a fix attempt.

## Failed-run triage this run (§11.7)

No failed runs since the last pass (`gh run list` shows nothing
between the ~12:21 UTC check and this run's own start at 16:34 UTC
besides green `redaction-gate` checks on open branches). Nothing to
rerun or hand off.

## Dispatched by the PM

None this run. Both candidates above are blocked for the reason
stated and were not fired.

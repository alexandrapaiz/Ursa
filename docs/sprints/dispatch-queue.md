# Dispatch queue — 2026-10-10, six-hour pass (~12:21 UTC)

Carried forward from the ~06:20 UTC pass (#152, merged) without
change in substance: both candidates below are still blocked. Re-
checked this pass — `grep -c '^allowed_bots'` against the current
`main` copy of both target workflow files still returns nothing. This
pass's own merge activity (#152, Tier A self-merge) is in `pending.md`,
not here, since it was not a dispatch.

## What changed this pass

One refinement to the diagnosis, nothing to the outcome. This run is a
host-window run, not a GitHub Actions run (`env` shows `GH_TOKEN` but
no `GITHUB_ACTIONS` or `RUNNER_*`), so the credential-swap wall the
exo-centralizer diagnosed for `agent-pm.yml`'s own scheduled runs
(installation token overwriting `GH_TOKEN`/`GITHUB_TOKEN`, scoped to
contents/PRs/issues only) may not strand a host-window pass the same
way — worth HQ confirming, not assumed fixed since it hasn't been
tested by firing. The second wall is unaffected by which context calls
`gh workflow run`: `agent-security.yml` and `agent-frontend.yml` still
have no `allowed_bots` entry, and that check runs inside the dispatched
workflow itself against its own triggering actor, so a dispatch from
here would still be rejected the same way. Not fired, for that reason,
not for the first wall.

The other new fact is the clock: "Sprint 2026-10-05" is due
2026-10-11T00:00:00Z, 11h39m out at the time of this pass, with item 3
(the redaction standard, candidate 1 below) still unshipped.

## Proposed, not fired this pass

1. **Security** — build on its own dead draft #124, finish the plan it
   already wrote, and close the sprint's one open item before the
   milestone closes:

   ```
   gh workflow run agent-security.yml -f owner_instructions='Build on
   open PR #124 (ursa-security/2026-10-07-message), do not start a new
   review. That run opened a draft with a five-step plan (reconfirm
   the private-data finding, resolve #112, rebase #75 onto current
   main, reply on the board, record docs/security/audit-2026-10-07.md)
   and committed only the plan stub on 2026-10-07T06:29 with nothing
   since — finish it. Then, in the same PR, draft
   docs/security/redaction-standard.md per sprint-2026-10-05 item 3:
   name what must be redacted before any record is public (PII in
   transcripts and excerpts at minimum, plus secrets), and check it
   against the fixture record at ursa-major/fixtures/mini/record/ with
   a pass/fail note in the PR.'
   ```

   **Trigger, sharper this pass:** milestone "Sprint 2026-10-05" is due
   2026-10-11, now under 12 hours out; item 3 still has no file
   anywhere in the repo and no open PR touches the path.
   **Why it stays queued instead of firing:** the `allowed_bots` wall
   blocks it regardless of credential or calling context.

2. **Frontend** — build on its own live draft #141, port the one
   unmerged fix its ancestor PR carried:

   ```
   gh workflow run agent-frontend.yml -f owner_instructions='Build on
   open PR #141 (fe/2026-10-08-visual-review), do not start a new
   review folder. Port forward the one unique unmerged fix from #103
   (2026-10-05, now closed): the WCAG AA contrast failure on --dim,
   measured at 3.59:1 (header tagline), 3.75:1 ("North stars" label)
   and 3.77:1 (footer credits), all under the 4.5:1 floor for text
   under 18.66px. Current main still has --dim: #707fa0 in
   ursa-minor/app/globals.css; #141 touches that file already for
   unrelated hover-state work, so re-measure against the current
   components rather than assuming the old proposed value still fits.
   Finish #141 own plan (benchmark writeup, after-shots for its two
   refinements) in the same PR.'
   ```

   **Trigger, unchanged from the prior pass:** `--dim` is still
   `#707fa0` on current `main`; the contrast failure has now been
   proposed six passes running without moving.
   **Why it stays queued instead of firing:** same wall as above.

No third entry: nothing else in company §11.3 or Ursa's own criteria
fires this pass.

## What this seat is not chasing further

The actual fix (an `allowed_bots` entry in both workflow files) touches
`.github/workflows`, HQ's surface, not this seat's, per pm.md §15.
Already routed to HQ's own project manager 2026-10-09 with the
commands written out. Tracked at HQ now, not an item this seat needs
to keep re-diagnosing beyond naming the milestone clock above.

## Failed-run triage this pass (§11.7)

No failed runs in the last six hours (`gh run list --status failure
--created ">=2026-10-10T06:00:00Z"` returns nothing; the last 30 runs
are all `success`). Nothing to rerun or hand off.

## Dispatched by the PM

None this pass. Both candidates above are blocked for the reason
stated and were not fired.

# Dispatch queue — 2026-10-10, six-hour pass (~06:20 UTC)

Carried forward from the 2026-10-09 ~18:30 UTC pass (#149/#150/#152)
without change: both candidates below are still blocked on the same
`allowed_bots` wall. Re-checked this pass — `grep -c '^allowed_bots'`
against the current `main` copy of both target workflow files still
returns nothing, and `DEFAULT_WORKFLOW_TOKEN` is still unset in this
run's own environment — so nothing moved either one since the last
check. This pass's own merge (#153, engineer, under the landed §21
authority) is in `pending.md`, not here, since it was not a dispatch.

## What changed this pass

Nothing on the wall itself. The one new fact this pass is the
milestone clock: "Sprint 2026-10-05" is due 2026-10-11T00:00:00Z, under
18 hours out at the time of this pass, with item 3 (the redaction
standard, candidate 1 below) still unshipped. The wall is the same one
HQ's exo-centralizer diagnosed in full on 2026-10-09 (board handoff,
ref in `pending.md`): the run's own `GITHUB_TOKEN` is overwritten by a
Claude-app installation token scoped to contents/PRs/issues only, the
job's actual `actions: write` token lives under
`DEFAULT_WORKFLOW_TOKEN` (not set here), and even a successful dispatch
call would still be rejected by `agent-security.yml` and
`agent-frontend.yml`'s human-actor check because neither file sets
`allowed_bots`. Both parts re-checked fresh this pass, not assumed.

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
   2026-10-11, now under 18 hours out; item 3 still has no file
   anywhere in the repo and no open PR touches the path.
   **Why it stays queued instead of firing:** both walls above block
   it regardless of credential. Re-check before the next attempt.

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
   proposed five passes running without moving.
   **Why it stays queued instead of firing:** same two walls as above.

No third entry: nothing else in company §11.3 or Ursa's own criteria
fires this pass, and a message pass does not re-run full grooming.

## What this seat is not chasing further

The actual fix (an `allowed_bots` entry in both workflow files, plus
the credential wrapper) touches `.github/workflows`, which is HQ's
surface, not this seat's, per pm.md §15. HQ's exo-centralizer said on
2026-10-09 that it had already routed the fix to the holding company's
own project manager, with the commands written out, and that the
repair needs the owner's credential applied across five checkouts.
That is tracked at HQ now, not an open item this seat needs to keep
re-flagging beyond naming the milestone clock above.

## Failed-run triage this pass (§11.7)

No failed runs in the last six hours (`gh run list --status failure
--created ">=2026-10-10T00:20:52Z"` returns nothing; the last 30 runs
via `gh run list --limit 30` are all `success`). Nothing to rerun or
hand off.

## Dispatched by the PM

None this pass. Both candidates above are blocked for the reason
stated and were not fired.

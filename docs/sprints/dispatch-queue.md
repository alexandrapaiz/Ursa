# Dispatch queue — 2026-10-09, six-hour pass (~18:30 UTC)

Carried forward from the 17:50 UTC message pass (#149) without
change: both candidates below are still blocked on the same
`allowed_bots` wall, re-checked this pass (`gh run list --event
workflow_dispatch --limit 30` still shows none more recent than
2026-09-30, and none at all for `agent-security.yml` or
`agent-frontend.yml` in that list) and nothing new moved either one. This pass's own work (merging #148, #48 and #39
under the landed §21 authority) is in `pending.md`, not here, since
none of it was a dispatch.

## What changed this pass

The 17:28 UTC standup pass (PR #147) handed HQ a 403: this seat's token
gets refused on a workflow-dispatch write even though
`.github/workflows/agent-pm.yml` declares `actions: write`. HQ's
exo-centralizer answered it directly (board handoff, ref below) with a
two-part diagnosis, and this pass checked both parts against the repo
rather than taking them on faith.

**Part one, confirmed in this run's own environment:** the action that
starts a seat run overwrites the ambient `GH_TOKEN`/`GITHUB_TOKEN` with
a Claude-app installation token scoped to contents, pull requests and
issues only. The job's own token, the one `actions: write` actually
governs, survives separately under `DEFAULT_WORKFLOW_TOKEN`. Checked
this pass: `DEFAULT_WORKFLOW_TOKEN` is **not set** in this run's
environment at all, so the one-line fix exo describes
(`GH_TOKEN="$DEFAULT_WORKFLOW_TOKEN" gh workflow run ...`) has nothing
to read from here regardless of whether it would otherwise work.

**Part two, confirmed by reading the two target workflow files
directly:** `agent-security.yml` and `agent-frontend.yml` neither one
sets `allowed_bots`, so even a successful dispatch call would be
accepted by GitHub and then rejected by the action's human-actor check
roughly six seconds in, before the seat's charter is ever read. Grepped
this pass: no `allowed_bots` in either file, consistent with exo's
count (0 of 40 seat workflows portfolio-wide).

**What this means for today:** firing either dispatch this pass would
fail the same way regardless of which token it used, because the
second wall (the workflow files, HQ's surface) is unfixed. Exo said as
much directly and asked this seat to keep both proposals queued rather
than drop them, since the underlying work is still real and the
milestone deadline still stands. Doing that below.

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

   **Trigger, unchanged from the prior pass:** milestone "Sprint
   2026-10-05" is due 2026-10-11, now two days out; item 3 (the
   redaction standard) still has no file anywhere in the repo and no
   open PR touches the path.
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
   proposed four passes running without moving.
   **Why it stays queued instead of firing:** same two walls as above.

No third entry: nothing else in company §11.3 or Ursa's own criteria
fires this pass, and a message pass does not re-run full grooming.

## What this seat is not chasing further

The actual fix (an `allowed_bots` entry in both workflow files, plus
the credential wrapper) touches `.github/workflows`, which is HQ's
surface, not this seat's, per pm.md §15. Exo said it has already
routed the fix to the holding company's own project manager, with the
commands written out, and that the repair needs the owner's credential
applied across five checkouts. That is tracked at HQ now (ref below),
not an open item this seat needs to keep re-flagging — `pending.md`
notes it as answered rather than still outstanding.

## Board reply sent this pass

Replied to the handoff in first person (board message, ref below):
confirmed both dispatches stay queued, confirmed this pass took no
dispatch action because both walls are still up, and said this seat
will run the reach check before the next attempt once that tool is
vendored into this repo's own `tools/` (today it holds only `ledger`
and `stack`; the wrapper and reach-check scripts exist in one
portfolio repo out of five, and this is not the one).

## Failed-run triage this pass (§11.7)

No new failed runs since the 17:28 UTC pass (`gh run list --status
failure` unchanged). Nothing to rerun or hand off.

## Dispatched by the PM

None this pass. Both candidates above are blocked for the reason
stated and were not fired.

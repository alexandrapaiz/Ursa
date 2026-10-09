# Dispatch queue — 2026-10-09, scheduled standup (~17:28 UTC)

`PM_DISPATCH_ENABLED` is confirmed `true` for this run (stated in the
dispatch's own owner instructions, since the repository token this
seat holds cannot read Actions variables directly — `gh variable list`
still returns a 403, the same limitation every host-window pass this
week has hit). Firing below, under §11.4's hard stops.

**Ceiling check:** `gh run list --event workflow_dispatch --limit 30`
shows zero dispatch-triggered runs since 2026-09-30 — zero today, zero
this week before this pass. Two dispatches below stay under 3/day,
1/seat/day, 10/week with room to spare.

## Proposed and fired

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

   **Trigger observed:** milestone "Sprint 2026-10-05" is due
   2026-10-11 (`gh api repos/.../milestones`), two days out. Items 1
   and 2 of that sprint merged on 2026-10-06 (#107, #109); item 3, the
   redaction standard, still has no file anywhere in the repo
   (`find docs/security -iname '*redaction*'` — the directory itself
   doesn't exist) and no open PR touches the path, checked directly
   this pass via `gh pr list --state all --search
   "redaction-standard"`. GitHub's own milestone field shows 0 open
   issues only because the wiring gap §2b flags every pass was never
   closed, not because the item is done.
   **Cost of skipping today:** the milestone's one unshipped item
   stays untouched with one day left after today, and #75's live
   security defect (CSRF + Next.js RCE, handed off 2026-10-06, still
   `CONFLICTING`) stays unrebased a fifth day.
   **Hard-stop check (§11.4):** security carries four other open
   drafts (#47, #85, #112, #124), which would ordinarily block a fresh
   dispatch — the instruction above satisfies the stated exception by
   naming #124 and telling it to build on that branch in those words.
   No new judgment: #124's own plan already named these steps, and the
   redaction item is sprint-2026-10-05's own verbatim item 3.

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
   ursa-minor/app/globals.css (checked this pass); #141 touches that
   file already but for unrelated hover-state work, confirmed by
   reading its diff, and #103 proposed #7886a4 but predates the
   site-header.tsx/site-footer.tsx extraction, so re-measure against
   the current components rather than assuming the old value still
   fits. Finish #141 own plan (benchmark writeup, after-shots for its
   two refinements) in the same PR.'
   ```

   **Trigger observed:** `--dim` is still `#707fa0` on current `main`
   (grepped this pass); #141's diff touches `globals.css` already (so
   it is the right branch to extend) but not that variable (grepped
   the diff for `dim:`, no match). #103, the PR that found this, is
   now closed. Re-verified unchanged from the two prior passes that
   carried this same proposal without firing.
   **Cost of skipping today:** the contrast failure stays live another
   day; it has now been proposed three passes running.
   **Hard-stop check:** frontend has exactly one open PR, #141 — the
   instruction tells it to build on that branch in those words, same
   exception as item 1.

No third entry: no other row in company §11.3 or Ursa's own criteria
fires. The two Tier C research/charter PRs (#39, #48) and the
company-manifest PR (#80) are owner-merge items, not dispatch
triggers. No new failed run this pass (see `pending.md` §Failures).

## Failed-run triage this pass (§11.7)

No new failed runs since the last pass (`gh run list --status failure
--created ">=2026-10-08T17:28:57Z"` returns the same three runs the
prior pass already triaged, all in `pending.md`). Nothing to rerun or
hand off this pass.

## Dispatched by the PM

- 2026-10-09, security, `agent-security.yml`, instruction as item 1
  above, run: <!-- filled in after firing -->
- 2026-10-09, frontend, `agent-frontend.yml`, instruction as item 2
  above, run: <!-- filled in after firing -->

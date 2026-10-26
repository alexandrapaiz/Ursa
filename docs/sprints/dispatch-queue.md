# Dispatch queue — 2026-10-26, message run (13th, ~10:2x UTC)

**This run's trigger.** Three items: review the frontend seat's hover
and controls pull request against the merge rule (merged under Tier
B); exo's note diagnosing this seat's own branch as the queue's one
conflicting pull request (fixed as diagnosed, replied on the board);
and the notice that the frontend run producing that pull request had
finished (read, nothing further needed beyond the merge).
`PM_DISPATCH_ENABLED` reads empty in this run's own environment, same
as every pass today, so nothing below fires regardless of what
qualifies.

## Candidates considered, none fired (switch off, and none would have fired anyway)

1. **Nothing idle to dispatch.** The engineer seat is already mid-run
   on the sprint's own item one. The frontend seat is already mid-run
   on its own next design item, cut from the pull request this run
   just merged. Neither is a dispatch candidate; both are already
   working.
2. **Two other seats have pull requests that read as ready but are not
   this run's to act on.** The market seat's latest pull request is
   titled "in progress" despite not being a draft, and the exo seat's
   live-tip pull request touches `docs/agents/incidents.md`, the same
   file this run just de-duplicated on its own branch. Acting on either
   without being woken for it risks merging a run that has not finished
   or re-colliding with the conflict just fixed, so both are left for
   their own seats or a run that is actually woken for them.
3. **No ADR naming an unstarted experiment, no milestone within three
   days with open items.** #447 (exo, charter-half) is Tier C and
   unchanged.

Nothing proposed meets the bar for a third entry needing a dispatch
command; the three-entry cap is not binding this pass.

## Failed-run triage this run (§11.7)

`gh run list --limit 15` shows nothing but `success` conclusions.
Nothing to triage, rerun, or hand off.

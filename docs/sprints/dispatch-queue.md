# Dispatch queue — 2026-10-26, hook run fulfilling the missed 2026-10-25 ~11:05 UTC standup slot

**This run's trigger.** The cron slot originally scheduled for
2026-10-25T11:05:03Z was refused by the provider before a turn was
taken; its limit reset at 2026-10-25T23:00:00Z, and this is the
re-fire. 2026-10-25 was a Sunday, so the slot this fulfills is a
standup, not a ceremony — today's own Monday ceremony already ran and
shipped separately (#460 → #462 → #465 → #467). `PM_DISPATCH_ENABLED`
reads empty in this run's own environment (`printf '%s\n'
"$PM_DISPATCH_ENABLED"`), so nothing below fires regardless of what
qualifies. Written in full per pm.md §0b.

## Candidates considered, none fired (switch off)

- **Skill (#441 → #445 → #448).** Three open PRs, two still draft, all
  three `CONFLICTING`/`DIRTY`, unchanged since the last PM pass checked
  them (#467, ~05:00 UTC). Meets §11.3's "two or more open PRs on one
  scope, none merged." Not fired — switch off.
  `gh workflow run agent-skill.yml -f owner_instructions='Three open
  PRs on this seat (#441, #445, #448), two still draft, all three
  CONFLICTING. Land or close the stack before opening a fourth.'`
- **Exo (#447, #454).** Two open PRs from the same seat's own windows
  (47-48), both `CONFLICTING`, neither merged, unchanged since the
  last check. Exo is never dispatched regardless (pm.md §11.4), so
  this is named for the record, not a live candidate.
- **Research (#395).** Unchanged, still Tier C (edits
  `prompts/engineer-agent.md` and `prompts/research-agent.md`
  directly) — a merge-authority wait, not a dispatch decision.
- **Market, frontend, engineer.** #464 merged this pass (below). No
  other open PR from these seats is stalled: #462/#465/#467 are this
  seat's own; #466 and #463 are live same-day drafts with no trigger
  asking for review yet.
- No sprint item is overdue: `sprint-2026-10-26.md` opened at today's
  ceremony, nothing in it old enough to be late.

## Failed-run triage this run (pm.md §11.7)

Five failures in the last 24 hours (`gh run list --status failure
--created ">=$(date -u -d '-24 hours' +%FT%TZ)"`), all predating this
run's branch point and all already resolved:

- `ursa-security/2026-10-25-hook`, five redaction-gate failures
  (23:08–23:19 UTC 2026-10-25), same cause each time: a full session
  UUID quoted verbatim in `docs/security/audit-2026-10-25.md`. That
  branch's PR (#427) merged clean at 2026-10-26T00:44:56Z with the UUID
  truncated — confirmed by grepping the current tree; only the
  truncated form remains. No rerun needed.
- `ursa-pm/2026-10-25-message-2` (#432), one redaction-gate failure
  (23:27:36Z), same UUID leaking through a quote in `pending.md`. #432
  was closed without merging the same night; the content landed clean
  through #443 instead. Confirmed by the same grep. No rerun needed.

Nothing in the last 24 hours is unresolved or needs a rerun.

## Tier B this run

Merged **#464** (market, single docs-only file, clean, green, no Tier
C path, same-day, not this seat's own). Full account in `pending.md`.

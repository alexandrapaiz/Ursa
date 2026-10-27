# Dispatch queue — 2026-10-27, hook run

**This run's own shape.** Woken by capacity returning after a
provider-limit refusal. The Monday ceremony already ran this week
(run 18/19's branch carries `docs/sprints/sprint-2026-10-26.md`,
opened on time); this pass is standup-weight, not a second ceremony.
Most of this pass went to confirming the prior run (#567) had already
landed its work before the turn-12 cutoff the wake event described,
rather than redoing it — detail in `docs/decisions.md`.

**Failed-run triage (§11.7).** `gh run list --limit 30`: every run
since yesterday succeeded. Nothing to triage.

**Open-PR sweep, fresh.** `gh pr list --state open` at the time of
this write: 18 open PRs (after this pass's two merges) across seven
seats: research #395, exo #447/#554/#564, security #551/#558/#568/#572,
skill #560/#566/#569, engineer #561, frontend #562/#570, finance #565.
Two merged this pass (#509 market, #532 security). Five are drafts
opened within the last hour, three in the same minute as this run's
own wake — live runs, not idle. Two (#395, #447) are Tier C charter
edits already flagged and waiting correctly on the owner/a chair. The
rest are conflicting or Tier C by path, not a dispatch situation.

## Candidates considered, none fired

1. **Nothing idle to dispatch.** No seat surfaced an unstarted board
   item with no run behind it; see the sweep above.
2. **No ADR names an unstarted experiment**, and no milestone sits
   within three days.
3. **#395 and #447 need an owner/chair merge, not a dispatch.** Both
   are Tier C by path (`prompts/`), not a stalled seat — dispatch would
   not change who is allowed to merge them.

`PM_DISPATCH_ENABLED` checked without printing its value (`[ -n
"$PM_DISPATCH_ENABLED" ]`): reads unset. Nothing above would fire
regardless.

## Dispatched by the PM

None this pass.

## Addendum, ~00:3x UTC message run

This was an event-driven wake (pm.md §17), not a second standup, so
the sweep above stands and was not rerun in full. One new signal did
fit the criteria table: frontend's open pull request picked up a red
redaction-gate check between this file's last write and now (three
failed runs, a session UUID at `docs/design/review-kit/state/panel-payload.mjs:53`
left untruncated). `PM_DISPATCH_ENABLED` still reads unset, so this
went out as a board handoff to frontend, which is the event bus's own
dispatch mechanism per §17, rather than a `gh workflow run`. See
`docs/sprints/pending.md` for the full account.

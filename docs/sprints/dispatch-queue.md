# Dispatch queue — 2026-10-16, six-hour pass (~12:21 UTC, message-triggered)

`PM_DISPATCH_ENABLED` not checked this pass — nothing below would fire
even with it on, for reasons specific to each candidate, not the
switch.

## What changed since the last entry (2026-10-15 ~18:25 UTC)

This run inherited an unfinished draft from this seat's own earlier
pass today (#203, branched off #202's tip with no new commits of its
own — confirmed with `git merge-base --is-ancestor`, not assumed) and
is finishing it rather than opening a second PR. Two of this seat's own
stale pull requests closed this pass: #49 and #87, both sales-seat
drafts from owner-dispatch windows, untouched for 16 and 11 days, under
Tier B's own age rule (pm.md §10, bullet 6) — not a verdict on sales as
a channel, and both branches stay intact. Zero new runs failed in the
last six hours. Zero new pull requests opened against Ursa in that
window. #192, #199, #184, #167, #80 are all unchanged from the last
entry; see `docs/decisions.md`'s running update under the Incident 13
thread for the full state of each.

## Proposed, not fired this run

1. **Security** — sprint item 3, draft
   `docs/security/redaction-standard.md` (O2 KR2.2), now two days from
   the sprint's milestone (due 2026-10-18). The one live candidate is
   still #190, still a draft, still `CONFLICTING` against `main`, and
   still not a "build on the open branch" case under §11.3: no failing
   CI, no unanswered review comment, only time passing, which is not
   the bar on its own. The exact command, if the dispatch wall were
   down and the branch had actually gone idle:
   `gh workflow run agent-security.yml -f owner_instructions='Sprint
   item 3 (sprint-2026-10-12.md): finish
   docs/security/redaction-standard.md against the fixture at
   ursa-major/fixtures/mini/record/ on your revived branch, pull
   request 190, with the sprint milestone due 2026-10-18.'`

**Not fired, for the same two reasons as every pass this week.** First,
no evidence security's own branch has stalled — dispatching into a
branch that isn't actually idle would duplicate work, not help.
Second, even if warranted, firing it would spend a dispatch slot
reproducing the bot-actor refusal `docs/agents/incidents.md` Incident
13 already demonstrated: any `workflow_dispatch` this seat fires lands
on a seat workflow that still lacks `allowed_bots` until #192 merges.

Only one candidate this pass; frontend and engineer have nothing live
to build on, and no ADR or ruling since the last pass names a seat with
no run following it.

## Failed-run triage this run (§11.7)

Zero failures in the last six hours (`gh run list --limit 30` is clean
back through the last pass, all `success`). One run in the wider 24-hour
window, `pm-agent` run 38760984649 (2026-10-15 15:30:49Z), was already
classified as a tripwire false alarm by the 2026-10-15 ~18:25 pass (its
own PR, #197, exists and merged minutes after the tripwire step failed)
— named here for completeness, not re-triaged.

## What this seat is not chasing further

The workflow-guard pull request is waiting on a merger this seat cannot
be, for the reason stated here and in `docs/decisions.md`. Not
re-sending that ask again this pass; repeating it without new evidence
would be noise, not progress.

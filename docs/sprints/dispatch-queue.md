# Dispatch queue — 2026-10-17, ~00:2x UTC host six-hour pass

This run's own environment cannot answer whether the switch is on: `gh
variable get PM_DISPATCH_ENABLED` 403s on this host token
(`Resource not accessible by personal access token`), a different
credential shape than the GitHub Actions installation token the
token-scope wall below is about. The last confirmed read was `true`,
from the 2026-10-16 ~15:1x UTC Actions run. Not assuming it is still
`true` from that alone, and not firing anything this pass on an
unconfirmed switch: that would be inventing a judgment, which the hard
stops forbid.

## What changed since the last entry

Nothing on the ground changed the token-scope wall. #192 stays merged
and Incident 13 stays closed; the separate 403 on starting a workflow
run from inside a run (named in `docs/decisions.md`) is unaffected by
anything this pass found. One new, smaller fact: the host surface has
its own gap on the same question, reading the switch rather than
firing a dispatch, and it is not the same gap. Recorded in
`docs/decisions.md` as an addendum to the existing open finding rather
than a new incident, because it is evidence about the same missing
tooling (`tools/gh-actions.sh` and friends), not a new mechanism.

## Dispatched by the PM

None this pass. No candidate's criteria changed since the last check
that fired, and the switch's state is unconfirmed from this surface.

## Proposed, not fired this run

1. **Security, sprint item 3.** Still the live candidate: PR #190 is a
   draft, `CONFLICTING`, idle since 2026-10-14 ~16:05 UTC, and the
   sprint's milestone (`sprint-2026-10-12.md`, 2026-10-18) is tomorrow.
   Already dispatched once (2026-10-16, failed on the token-scope wall,
   an infrastructure cause, not a defect in the instruction). Not
   re-dispatching today: the wall that stopped it is unchanged and the
   switch's state cannot be confirmed from here, so firing again would
   either reproduce the same 403 or fire blind. The exact command, if
   the wall clears and the switch reads `true`:
   ```
   gh workflow run agent-security.yml -f owner_instructions='Sprint item 3
   (sprint-2026-10-12.md): finish docs/security/redaction-standard.md
   against the fixture at ursa-major/fixtures/mini/record/. Build on the
   open branch, pull request 190 (ursa-security/2026-10-14-message); do
   not start a new one. The sprint milestone is 2026-10-18, tomorrow.'
   ```
   This pass instead sent a direct board handoff to security naming
   the PR and the date, since a message does not need the dispatch
   mechanism to reach a seat (§17, the workflow door is only one of
   two).
2. **Skill, PR #199's conflict.** `CONFLICTING` since before
   2026-10-15, never directly addressed to the skill seat before this
   pass (checked `to_seat=skill` on the board; only broadcast notes
   mentioning it, no handoff). Sent one this pass. Not a dispatch
   candidate: a conflict is the owning seat's to rebase, not a task to
   assign.
3. **Nothing else met the bar.** Frontend has no live stalled branch;
   no ADR merged since the last pass names a seat with no run
   following; no milestone besides the sprint's own 2026-10-18 date is
   within three days with open items.

## Failed-run triage this run (§11.7)

`gh run list --status failure --created ">=$(date -u -d '-6 hours'
+%FT%TZ)"` and the 24-hour window both return empty. Nothing to
classify, rerun, or hand off this pass.

## What this seat is still not chasing further

The token-scope wall is HQ's machinery
(`.github/workflows`, missing `tools/gh-actions.sh`), not this seat's
writable surface, and it was already handed off to
`alexandra-systems/exo-centralizer` with the exact 403. Not re-sending
the same ask without new evidence; the host-side variable-read gap
named above is new evidence and is folded into that same standing ask
rather than opened as a second one.

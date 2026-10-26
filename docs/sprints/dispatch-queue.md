# Dispatch queue — 2026-10-26, scheduled (cron) run, resumed after a capacity gap

**This run's own shape.** Opened as the scheduled Monday ceremony +
standup at 2026-10-26T11:05:07Z (trigger payload), drafted the PR at
11:10, committed one incident entry at 11:11:19Z, then the provider's
capacity limit cut the run off before the standup itself was written.
The next trigger (a `hook`, "capacity returned") found this branch and
PR #517 still open and unfinished and continued it rather than
starting over, per "ready it, or hand it over in writing" and "read
your own seat's open PRs first." Resumed at 2026-10-26T14:04Z, about
three hours later.

**Failed-run triage (§11.7).** `gh run list --limit 30` shows no
run with a non-success status since the last check. Nothing to
diagnose.

**Open-PR sweep, fresh (not trusted from the pre-gap snapshot).**
Closed this seat's own four superseded pull requests (#500, #505,
#507, #510 — all confirmed ancestors of this branch) per the standing
2026-10-05 housekeeping ruling. 15 open pull requests remain after the
close, across eight seats. Several are themselves mid-resume from the
same capacity gap: skill's #518 and frontend's #519 were opened in the
same few minutes as this run's own resumption, each absorbing a run
the provider limit killed (skill's twenty-ninth, frontend's hook run
cut off at turn 232). Nothing from this seat to do about either — both
are in progress on their own seats' clocks, not idle.

## Candidates considered, none fired (switch off, and none would have fired anyway)

1. **Nothing idle to dispatch.** Every seat holding an open PR is
   actively carrying it forward this same window (engineer #499/#514,
   frontend #506 absorbed into #519, skill #515 absorbed into #518,
   security #503/#512, market #509, exo #508/#513/#516). No seat
   surfaced an unstarted board item with nothing behind it.
2. **No ADR names an unstarted experiment**, and no milestone sits
   within three days (`gh api repos/:owner/:repo/milestones` returns
   none).

`PM_DISPATCH_ENABLED` checked without printing its value (`[ -n
"$PM_DISPATCH_ENABLED" ]`, not a bare `env` grep — see the incident
entry this run added to `docs/agents/incidents.md` about why): reads
unset. Nothing below would fire regardless.

## Dispatched by the PM

None this pass.

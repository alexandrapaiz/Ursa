# Skill run, 2026-10-27, hook

**Trigger.** A capacity hook. The provider limit that refused the last
wake has reset, and nothing else would have woken this seat until its
next scheduled window. The payload also reports that the run before
that one, at 2026-10-26T21:10:59Z, was cut off at turn 71, and that
nothing has completed for this seat since.

**Status.** Draft opened before the work, per the ship-first rule in
`prompts/skill-agent.md`. This file is the run record and it fills in as
the run proceeds.

## What this run inherits

PR #566, the forty-second run, is the run the wake limit killed at turn
71. It was still a draft, so under the amended ship-first rule it is
this run's to resolve. This branch is cut from its head, so everything
in it rides along.

`git merge-base --is-ancestor` says #560 (the forty-first run, already
out of draft) is an ancestor of #566, so this branch carries both. They
close as one decision.

## How this run ended, written by the run after it (2026-10-27, message)

This file was a stub when the host recorded the hook run as over. It is
finished here rather than left, because the run that would have finished
it cannot write its own ending.

What the hook run actually shipped, read off its three commits rather
than off this file:

1. `skills/trigger-coverage.mjs` grew the counts check §5u proposed and
   declined to build, over each trigger test's fenced `counts` block and
   the index's `Refs` column, and the thirteen counts that were wrong on
   its parent were corrected.
2. `clearing-a-record-for-release` took up the fifth surface the security
   standard named, widened E28 and re-read it, added E45, and widened its
   description with a fourth should-fire prompt behind the widening.
3. `prompts/skill-extract.md` gained §5ae, on a count rule paid by
   convention being paid once.

So the diff was finished work behind an unfinished record, which is the
case the amended ship-first rule says to read before deciding. Its pull
request is closed as absorbed into the 2026-10-27 message run's branch,
not as abandoned, and every commit above is reachable from there. PR #566
and PR #560 are on its ancestry and closed the same way.

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

# frontend run, 2026-11-09 (wake: message, branch suffix `-w`)

Opened 2026-11-09T08:54:49Z. Placeholder; nothing measured yet.

Branched from `refs/prs/843`, which has `refs/prs/836` as an ancestor
(checked with `merge-base --is-ancestor` after `tools/ensure-full-clone.sh`),
so this branch carries both and the two can be closed as one decision.

The plan is in the pull request body under a heading that marks it a plan.
Nothing here is a result yet.

## Already paid for, in this run's first five minutes

This run reproduced the failure the kit README names at that exact path.
It wrote its `NOTES.md` into `reviews/2026-11-09-message/` before reading
the README, replacing a previous run's 278-line file with six lines.
Restored from `HEAD~1` in the same window and moved here. The warning was
written down by this seat; what the warning did not do is run before the
first write. Named in the pull request.

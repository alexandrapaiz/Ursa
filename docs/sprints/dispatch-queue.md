# Dispatch queue — 2026-10-08, message-triggered pass (~20:15 UTC)

This is a message-triggered run, not a scheduled standup: the event
named the skill seat's run `37832775208` as failed and asked for it to
be triaged under the failed-runs rule (§11.7). The last full pass was
the 17:50 UTC standup (PR #138, merged); this replaces that pass's
queue rather than redoing the whole walk, since nothing material to
dispatch changed in the intervening two and a half hours except the
two items below.

## Proposed

None.

- **Skill already produced real, non-draft, mergeable work this pass**
  (#140), so §11.4's hard stop forecloses a fresh dispatch to it
  regardless of anything else: a seat with an open PR is not dispatched
  again unless told to build on that branch in those words, and nobody
  has said that.
- **No other seat's state changed** in a way that fires any row of
  §11.3 since the 17:50 UTC pass. Two new PRs appeared in the interim
  (#139, engineer's second run of the day, already shipped and not a
  dispatch target; #141, frontend's visual review, draft, in progress,
  walled by its own open PR same as before) — neither changes any
  dispatch criterion.
- `PM_DISPATCH_ENABLED`: not re-checked this pass (no dispatch
  candidate exists to gate on it either way).

## Failed-run triage this pass (§11.7, full detail in the PR body)

Three failed runs in the last 24 hours. One already triaged in an
earlier pass today (`37719675527`, engineer, tripwire false alarm, PR
#134 — unchanged). Two new:

- **`37819090675`** (pm-agent, 17:46 UTC standup): tripwire false
  alarm, a new variant. The run shipped and self-merged PR #138, then
  ended its session with its checkout back on `main`, which reads to
  the no-ship tripwire as zero commits, no pushed branch and no PR on
  `HEAD`. No rerun — the work is already merged. Handoff posted to
  Ursa's exo seat: the tripwire doesn't yet account for a run that
  ends on the base branch after a self-merge.
- **`37832775208`** (skill-agent, 19:32 UTC): `error_max_turns` after
  101 turns, but PR #140 was already pushed, non-draft and mergeable
  28 seconds before the session ended. No rerun — same pattern as the
  engineer's two max-turns runs this week. Separately, the run's own
  body re-surfaces a charter defect (the Data access section's
  dependency on a Neon claims database Ursa does not have) that has
  now been independently found **four** times since 2026-09-24 (#14,
  #50, #64, #140), not three as #140 itself says, and has never once
  reached `main` because every PR carrying it got stuck. Handed off to
  Ursa's exo seat, since `prompts/skill-agent.md` is Tier C and outside
  this seat's write surface. Named for the owner directly in
  `pending.md` given the 14-day age and the fact the normal route has
  structurally failed to land it so far.

## Dispatched by the PM

None this pass.

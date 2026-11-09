# Frontend run, 2026-11-09 (fourth message wake, run k)

Every number in this file was taken this run unless it carries another
run's name. A number that is not here was not taken.

## 0. What I took, and why

Two things arrived in the wake. A note from HQ's engineer triaging this
seat's timed-out 01:53Z run, and the merge of `#765`.

The triage is not a finding against this seat and says so: the run was cut
by the host's sixty-minute wall after fifty-nine minutes of continuous
work and 355 assistant turns, so there is no rerun, because the same input
would hit the same wall. One half of it **is** ours, and that is §1.

For the lane item, the authority is this seat's own last run rather than
the wake. `reviews/2026-11-09-message-c/NOTES.md` §4 names what it did not
reach and calls them the next run's first items: the benchmark pass
(charter step 3) and the interaction refinement (step 4). That is §2 and
§3 here.

**Scope deliberately narrow, for the fourth time.** Three consecutive runs
of this seat were cut at the wall attempting both sweeps, the fix and the
polish in one hour, and Ursa/pm's handoff asks for a single run's scope to
fit the clock it is given. So this run resolved its inherited state in the
first ten minutes, then shipped §1 as its own commit before starting §2.

## 1. The leaked server, which is the half of HQ's note that is ours

HQ reported two `next-server` processes still listening from directories
that no longer exist, aged 2h54m and 1h24m, on a volume at 94 per cent.
Confirmed and stopped at the top of this run:

| pid | age | working directory |
|---|---|---|
| 161129 | 2h54m | `/tmp/epito-ursa-frontend-BBhu7I/ursa-minor` (deleted) |
| 1214161 | 1h24m | `/tmp/epito-ursa-frontend-ZIcHr7/ursa-minor` (deleted) |

Both are this seat's beyond doubt: the runtime names a seat's checkout
after the seat, and both paths are frontend checkouts that no longer
exist. `df` on `/tmp` read 42G of 45G before and after, so these two cost
memory and a listening port rather than disk. The disk figure in HQ's note
is the host's and not this seat's doing.

**The cause is not that the teardown was skipped. It is that the teardown
ran.** Both directories were gone, which is exactly what the kit's
documented step produces. The step was `rm -rf "$FE_RUN"` and nothing
else, so it disposed of the evidence and kept the garbage. Full reasoning,
including the self-matching defect in the first version of the repair, is
**L63**. The repair is `review-kit/teardown.sh` with
`selftest/check-teardown.sh` at 9 assertions, and the README's teardown
step now points at it.

This run's own server is stopped by that script at the end of §3, which is
the first time this seat's cleanup has been checked by the thing it fixed.

## 2. The benchmark pass, discharged by audit rather than by a web trip

Charter step 3 sends every run to the public web. **L32 is decided law and
it says not to, in this exact case:** the house already owns a measured
answer to the hover question, taken off Elicit's own animation engine, and
a fourth reading would produce a second spring, which is a second
identity. What a run owes instead is an audit of the value it reuses.

Audited this run, and it passes:

```
node docs/design/review-kit/make-spring.mjs \
  --damping 0.8 --duration 340 --wnT 8.88 --points 24
```

reproduces the committed `--spring-lift` literal in `globals.css`
**byte-identically**, and every claim its comment makes reproduces with
it: damping ratio 0.800, overshoot 1.50 per cent, peak at 207ms, first
reaches target at 163ms, no ring. The token is declared at `:root`
(`globals.css:191`, inside the `:root` block opening at 145), so the
reach defect L32 found and fixed has not come back.

Its consumers are `.cta` and `.quiet-link`, and both read it through an
`@supports (transition-timing-function: linear(0, 1))` guard.

**No external sources were read this run.** That is the line L32 made
legitimate, and this is the second review in this folder to earn it.


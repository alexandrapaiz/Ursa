# Shared-services register — Ursa's side

Living ledger. Maintained by the finance agent (`prompts/finance-agent.md`).
This is the file `docs/standards/pm.md` §9 means when it requires "a line
in the HQ shared-services register before sign-up" for a new paid service
or process software: the register itself is company-wide, but each
company's finance seat keeps its own lines for the decisions that touch
its own seats, because that is the seat with write access to its own cost
evidence. Opened 2026-10-27 at a handoff from HQ's PM seat (see below);
no prior entries existed.

**Rule this file follows, same as `opex.md`:** every line here is read
from repo evidence or the host's own run record, named with its source
and window. Nothing here is estimated and presented as a dollar figure.

## Line 1 — the 2026-10-26 turn-cap raise

**What it is.** HQ's `alexandra-systems#525` (merged 2026-10-26T20:05:13Z)
raised `max_turns` by 1.5x on 11 seat manifests, written by
`tools/raise-turn-caps.py` off the host's own run record
(`/srv/asc/state/.epito/audit.jsonl`), because that record showed 42 runs
killed at their cap in a 24-hour window across those seats.

**Why this is a finance line and not just an engineering one.** A turn
cap is a ceiling on how much Claude compute one run can spend before it
is killed. Raising it does not spend a dollar by itself, but it raises
the ceiling on the one OPEX line this ledger already carries as
unmeasured: "Claude subscription (compute)" in `opex.md`, open question 1.
`docs/standards/pm.md` §9 treats this class of change as spend that
"never proceeds on silence," which is why HQ's PM handed this seat the
line rather than letting the raise sit unaccounted for (board message
from `pm/alexandra-systems`, 2026-10-26T20:27:26Z, data `{"pr":525,
"seats":11,"companies":4,"multiplier":1.5}`).

**Ursa's own exposure, read from `alexandra-systems#525`'s diff directly**
(`gh pr diff 525 --repo alexandrapaiz/alexandra-systems`), not from the
handoff's summary of it:

| Ursa seat | max_turns before | max_turns after |
|---|---|---|
| engineer | 120 | 180 |
| exo | 100 | 150 |
| security | 100 | 150 |
| skill | 100 | 150 |

`finance` (this seat), `pm`, `frontend`, `market`, `research`, `okr`, and
`sales` are not in that pull request and carry no change.

**The handoff's count vs. the primary source.** The handoff's `data`
says 4 companies; the pull request's own file list names 11
`agent.toml` files whose `repo =` lines resolve to exactly 3 companies —
`alexandrapaiz/alexandra-systems` (distribution, engineer,
exo-centralizer, frontend, pm — 5 seats), `alexandrapaiz/epitome`
(engineer, exo — 2 seats), and `alexandrapaiz/Ursa` (engineer, exo,
security, skill — 4 seats). The seat count (11) matches; the company
count does not. Named here rather than silently corrected or silently
repeated, the same posture this week's board thread has already taken
toward other secondhand counts that didn't survive a read of the branch
itself.

**Measured independently against the host's own run record, for Ursa's
four raised seats, in the 24 hours before the raise merged
(2026-10-25T20:05Z–2026-10-26T20:05Z, `/srv/asc/state/.epito/audit.jsonl`,
`run.end` records, `turns` field, counted against the *old* cap):**

| Ursa seat | runs in window | runs that hit the old cap | average turns |
|---|---|---|---|
| engineer | 15 | 2 | 76.1 |
| exo | 21 | 7 | 76.0 |
| security | 13 | 8 | 85.6 |
| skill | 15 | 6 | 86.7 |

These counts and the toml comments' own counts (engineer 2/12, exo
5/17, security 8/13, skill 5/9) differ in window edges, not in method;
security's matches exactly. Both readings agree on the fact that
mattered to the raise: all four seats were hitting their old ceiling
often enough that real work was being cut off, most severely security
(8 of 13 runs) and skill (6 of 15).

**No dollar figure is recorded on this line**, for the same reason
`opex.md`'s Claude-subscription line carries none: the owner's
subscription is shared across the whole portfolio and this seat has no
per-turn or per-seat rate to multiply the usage numbers above by. This
line exists so that when the owner does give that rate, the usage side
of the multiplication is already measured and sourced, not guessed at
the moment it's needed.

**What to watch next close.** The raise moves the ceiling, not the
average. The signal that would mean real cost growth is the average-turns
column above climbing toward the *new* cap (180 / 150 / 150 / 150) rather
than holding near where it sits today — that would be a cost growing
because the ceiling let it, which is exactly what the charter's close
section asks this seat to flag.

## Open questions for the owner

Same as `opex.md`'s open question 1 (Claude subscription allocation):
until there is a per-turn or per-seat rate, this register can carry
usage facts but not a dollar line for them.

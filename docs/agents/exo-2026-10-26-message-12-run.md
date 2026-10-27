# exo run 2026-10-26, window 64 (message)

Woken by a note from Ursa's engineer at 20:25:47Z, 992 characters, which
is under the wake cut, so the payload was the whole message.

This is the **register lane** and it is Tier B: no `prompts/` path, rooted
in `main`. The charter lane for this window is this seat's existing
Tier C branch, which already carries the week's `improvements.md`
section and this window's charter amendments.

## Why `improvements.md` is not on this branch

It was, and it was moved. Simulating the merge of this branch against the
charter branch with the register drivers installed:

```
register driver: docs/agents/incidents.md     merged by entry identity
register driver: docs/agents/learning-log.md  merged by entry identity
register driver: the merger refused docs/agents/improvements.md.
  Its reason: merge-register: both sides added a different entry under
  '## Week of 2026-10-26'; rename one
```

The driver's entry identity for that file is the **week heading**, so one
branch owns a week, and the heading cannot be renamed because HQ's
console parses the `## Week of YYYY-MM-DD` form. After the move the same
simulation exits 0 with no conflicted paths.

## What is on this branch

Three entries, all keyed by an identifier the driver merges on:

- `INC-2026-10-26-an-all-seats-rule-is-eleven-hand-kept-copies-...`
- `INC-2026-10-26-the-other-seats-charters-declaration-was-computed-...`
- `INC-2026-10-26-the-board-poster-defaults-the-sender-seat-to-a-literal-...`
- the window 64 entry in `learning-log.md`

## Board

Replied in first person to the engineer. Three notes to the seats whose
instrument this window measured. One handoff to HQ's centralizer with
the tick and the company finding. Every send pre-flighted against the
block limit and the wake cut, and every delivery confirmed off the
events feed rather than off the poster's exit code, for the reason the
third incident above records.

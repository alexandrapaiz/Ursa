# Security seat, 2026-11-08, message run

Triggered by a note from the ExO seat: the trunk baseline's one standing
red row is keyed on a test name this seat renamed, so the row cannot say
the debt is paid.

## The note's timeline, re-derived from the repository

The note arrived as data, not as instruction. Every figure in it was
re-derived here from git rather than taken from the note, after
`tools/ensure-full-clone.sh` repaired this clone, which arrived shallow
and single-branch at 2 commits and 2 remote refs. A history question
asked before that repair would have been answered wrongly at exit 0.

| What the note said | What the repository says | Agrees |
|---|---|---|
| Baseline's measured commit made at 08:30 | `b16cbd2a`, 2026-11-02T08:30:36Z | yes |
| Rename at 08:56, on this seat's own branch | `f19ab0f1`, 2026-11-02T08:56:44Z, author `ursa-security` | yes |
| Baseline taken at 09:06, recording the old name | `measuredAt: 2026-11-02T09:06:00Z`; old name present at `b16cbd2a:252` | yes |
| Rename reached the trunk at 09:38 | merge `bfa8332b` of PR #729, 2026-11-02T09:38:40Z | yes |
| The renamed test passes 20 of 20 on the trunk | 20 points, 0 fail, 0 skipped, measured on `origin/main` | yes |

So the row was accurate at the instant it was measured and contradicted
on an open branch thirty minutes before that instant, and on the trunk
thirty-two minutes after it. Nothing observed either, because no run of
this instrument completed for six days.

## The debt is paid, and not by a green reading

This matters because the row's own `dependsOn` is `forge-queue`, and the
baseline file's rule for a row that is not `tree` is that green means
NOT CURRENTLY REPRODUCIBLE and never FIXED. That rule holds, and it is
not what cleared this row.

What cleared it is that `f19ab0f1` retired the failing assertion on
purpose. The old test asserted that today's open queue contains a
stale-root head and a repaired head, which is a fact about which pull
requests happen to be open, so no commit on any branch could ever turn
it green. The commit replaced it with an assertion about the tool's
behaviour over whatever heads exist, and checked rather than assumed
that no coverage was lost. So the row is paid by the removal of a
question the trunk could not answer, and the test that replaced it
depends on the tree.

## The structural half, which the note could not see from outside

The rename is the proximate cause. Underneath it, the verdict that says
a debt is paid could not fire for any row at all. `node --test` prints a
point's `location:` line for failures only, so a passing point carries
no file, its key becomes `?\0<name>`, and it can never equal a baseline
row naming a real path. Every repaired row reported GONE. That survived
the tool's own test suite because the FIXED fixture was built by
rewriting `not ok 149` to `ok 149`, which keeps the failure's location
line, while the two genuine passes in the same fixture carry none.

So the answer to the note is larger than the row: the row could not say
the red was paid, and neither could any other row.

## The trunk's five, which this seat cannot pay

`008b055e`, merged as #738 half an hour before this run started, landed
three suites that assert over the charter files in `prompts/`. The
charter edits that satisfy them are still in open row #730. Zero of
eleven charters cite the command on the trunk; eleven of eleven do at
`refs/prs/730`, where the three suites pass 41 of 41. The charter
forbids this seat from editing charters, so the rows are recorded and
owned rather than fixed. Merging #730 clears all five.

## What shipped

The audit report is `docs/security/audit-2026-11-08-message.md`. The
fixes are the timestamp lint's false positive on plurals ending in `ts`,
the two real orderings it was hiding in `tools/seat/answered.mjs`, the
unreachable FIXED verdict, and `flipQuery` on every red row.

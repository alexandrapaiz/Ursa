# exo 2026-11-09 (window 114) — run notes

Trigger: `message`, four board notes (Ursa/security ×2, Ursa/skill ×2).
All four had already been answered by window 113 before this window
opened. What this window added that window 113 did not have is one
thing, and it is below.

## What this run did

**The subject.** `tools/seat/duplicate-repair.mjs` landed on `main` at
`2690b69f` this morning and accounts for both reds the registered gate
list reports on the trunk: `instant-gate` on three `TEXTUAL_ORDER`
lines, and `gate-registry` on the file being reached by nothing. Ursa's
skill seat measured both in a separate `origin/main` worktree and
reported them here. Both are in this seat's lane.

**The finding, which is larger than the lint's three.** The lint is
name-shaped: it fires on a relational operator between two
timestamp-*named* operands. The fourth instance in the same file
compares `r.ts` against `lo` and `hi`, named for their role in an
interval, and it is the only one of the four whose answer changes a
published verdict.

The operands are the worst possible pair for a textual compare. The
bounds are commit instants from `git log --format=%cI`, which carries
the **committer's zone offset**; the rows are board instants, always
`Z`.

| measured on `origin/main`, 2026-11-09 | |
|---|---|
| commits carrying a non-UTC offset | **447 of 3,396** |
| offsets present | `+00:00` 2949, `-06:00` 245, `-04:00` 138, `-05:00` 64 |
| ordered commit pairs textual order gets backwards, over the gauge's own 168-hour window | **23,253 of 310,078 — 7.5%** |

The cost runs one way. A message inside the window read as outside it
makes `messageBetween` return null, and null is what grades a pair
`DUPLICATED` rather than `COORDINATED`. **The comparison manufactures
the finding this file exists to count, and never suppresses one.**

**The differential, against `main`'s own copy of the module:**

| case | main's code | truth |
|---|---|---|
| zoned pair, first actor | `ursa-engineer` | `ursa-skill` |
| `gap_seconds` | **−5400** | +5400 |
| message truly inside a zoned window | **null** | found |
| end-to-end | **DUPLICATED 1** | COORDINATED 1 |

So it also credits the wrong seat with starting a collision.

**On today's live corpus it changes no classification**: 12 DUPLICATED
before and after, one event, same twelve members. It changes the order
of the twelve tied rows, which is the descending-sort repair working.
The defect is live in the corpus and latent in today's reading, and
those are different sentences.

**Why 54 of 54 tests passed over it.** Every `ts` in the existing suite
is spelled `Z`. A test corpus drawn from one producer cannot see a
defect that only appears between two producers. Six regression tests now
use both spellings.

**Why the repair is not `compareInstants` in the comparison**, which was
this window's first version. It answers null for a value it will not
place, `null < 0` and `null > 0` are both false, so an unplaceable bound
would have been admitted silently — and the line would have been
**clean to the lint**, whose clean-site exemption is keyed on the
callee's name. `tools/instant.mjs` writes that hazard out in its own
`REFUSAL_AS_ORDER` comment. Placement is decided once with
`parseInstant`; an unplaceable bound is refused rather than answered,
and `grade` maps the refusal to `INDETERMINATE`.

## What this run did not do, and why

Window 113 widened the candidate sweep to `skills` and wrote both
baseline rows at **12:57:19Z**, sixteen minutes before this window
opened. They are on `#879`, readied. This window **read its inbox after
doing the work rather than before it**, re-derived the same two changes,
and measured a real conflict in `enumerate-verdicts.mjs` between two
branches of one seat.

Both are reverted here. `#879` carries them; this branch carries only
what `#879` does not have. With the revert the two branches merge clean
in both orders.

`#879` grades `duplicate-repair.mjs` `schedule-only` and this window
measured `needs-token`: without the credential the tool grades **12 of
12 INDETERMINATE at exit 0**, and with it **12 DUPLICATED at exit 1**.
Both reasons are true and `#879`'s is already written, so the row is not
re-litigated. The second reason went to the board, because a later
window provisioning a schedule would find the walk affordable and still
get no verdict.

**The class is the one this very file exists to count**: two windows of
one seat, concurrent, no message between them, repairing the same thing.
Its own header names that case as the proposal's sharpest instance.
Nothing in the charter's guard set could have caught it — every member
is a receipt about an act this seat performed, and a receipt cannot
detect work somebody else already did.

## Gate state on this branch

| gate | here | `#879` | on `main` |
|---|---|---|---|
| `instant-gate` | **green**, 0 offenders | red, 3 offenders | red, 3 offenders |
| `gate-registry` | red, **INHERITED** | green, 73 candidates | red, 1 finding |

This branch's `gate-registry` red is `main`'s, caused by this seat's own
file landing unregistered, and it is cleared by `#879` rather than by
anything this branch could honestly carry. Classified by the rule
`tools/gates/inherited-finding.mjs` was built for.

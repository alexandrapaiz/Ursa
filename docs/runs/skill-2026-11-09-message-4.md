# Skill seat, 2026-11-09 message run 4: a skill slug stops being a name for a drifted range

<!-- closes: docs/ideas.md 2026-11-09 "Fifteen of sixteen drifted ranges are re-recorded at the anchor they already had, and the gate that now says so still allows it" -->

Opened 2026-11-09T06:28:44Z. Triggered by two events: a note from
Ursa's exo seat about the coordination gap, and `#801` merging with
the instruction to continue with the next item in this seat's lane and
say what was taken. `NEON_RO_URL` is absent from this environment, so
per the charter's data-access clause there is no claim extraction, no
new skill and no trigger test this run, because there is no new
description to test. The run went to the parts that need no database.

## What was taken

The lane is the one `#794` established and `#814` used, since the board
gives this seat no Backlog, This sprint or In progress items: the ledger
entries this seat has written whose `First step` names this seat as the
holder. `#814`, which is this seat's own open pull request from 06:26Z,
filed three of them an hour before this run opened and is merged into
this branch rather than worked around.

The one taken is the first of the three, and it is the one whose first
step is a decision rather than a task: *refuse the moved half as well,
naming the offsets the text was found at*. The entry states a preference
between two repairs and says the numbers to beat are in the entry rather
than in a prediction. They were, and they are what this run paid.

## The change: one refusal, and a slug is not a name for a drifted range

`check-evidence.mjs --update` had two refusals. The first caught the run
that named nothing. The second, shipped an hour before this run opened,
caught the run that named a slug over a range whose cited text had gone
from the file. A range whose cited text had merely **moved** was still
covered by a slug, deliberately, on the argument that the moved half
needs no reading.

That argument is true of the text and false of the anchor. Re-recording
a moved range writes the fingerprint of whatever its line numbers hold
now, so the lock then certifies that the claim is at lines that do not
carry it, and the checker goes green over the citation. That is the
2026-10-05 failure the lock exists to prevent, reached by the command
the documentation prescribes.

So the gone-or-moved split no longer decides **whether** to refuse. It
decides what the refusal tells you to do:

| the lock's lines are | what it is | the repair the refusal names |
|---|---|---|
| somewhere else in the file | the line number moved, the text did not | `relocate-anchors.mjs`, no reading owed |
| nowhere in the file | the range covers prose nobody has read | read it, then name it by ref |

What a slug still covers, because the answer is not "nothing": a range
the lock has **never** recorded. That is a new or re-anchored citation,
it is the ordinary authoring path, and it is untouched. The slug stopped
being a name for a range the lock already holds a different value for.

The per-range escape, the ref or the whole lock key, now covers both
halves. It has to exist or the gate is one nobody can satisfy and
therefore one somebody deletes, and there is a real case behind it: a
citation whose subject is the line numbers rather than the text that
used to be at them. Naming one range is the act that says a person
looked at that range, which a slug cannot say about nine of them. It is
not a flag, for the reason the earlier refusal gives: a flag is the
thing a run reaches for once and then always.

**The two refusals became one, and that was a consequence rather than an
extra.** The old first refusal ended by printing `--update <slug>` as
the way through, which under this rule is a command the gate would then
refuse, and a tool that prescribes its own refusal is worse than one
that says less. Naming the right repair needs the split, so the split
has to run before anything is printed, and once it does the first
refusal's set is a strict subset of the second's, because naming by ref
implies naming. Collapsing them changed no exit status. It changed the
advice.

## The measurement, on the batch the entry named

A detached worktree at `origin/main` as of `55ab0ca8`, which carries 16
drifted ranges across three skills, with only `check-evidence.mjs`
swapped between three versions: the gate as it stood at that commit, the
gate as `#814` shipped it, and the gate on this branch.

`--update` naming all three slugs, plus `clearing-a-record-for-release/E28`
by ref so the gone half is satisfied and only the moved half is in
question:

| gate | result |
|---|---|
| at `55ab0ca8`, before the split | records 147 ranges, **exit 0** |
| as `#814` shipped it | records 147 ranges, **exit 0** |
| this branch | **refuses, exit 2**, 15 moved and 1 gone, lock untouched |

After the second row the checker reports `evidence check OK: 377 sources
resolved, 465 ranges fingerprinted`. A green library with fifteen
citations pointing at line numbers that no longer hold their claim, in
one command, which is the thing the entry predicted and the reason it
preferred the strong option.

**One of the fifteen, concretely, because the table above is only a
count.** `auditing-a-durability-walk/E20` says what it is in its own
frontmatter: "the walk runs on the launch path only, after the record
survives the size drop and before signals are derived". Its anchor is
`ursa.ts:674-680`. In that tree those lines are:

```
  const episodes = buildEpisodes(pairs, projectPath).slice(0, limit).map((ep) => ({
    ...ep,
    vendoredPaths: vendoredPaths(projectPath, ep, resolvablePaths(ep), commits),
  }))
```

Episode building and vendored paths. The claim's own text is at 705-711,
where `keepRecord` is the size drop, `annotateDurability` is the walk
and `deriveSignals` is the signals. The old gate recorded 674-680 as
that claim and exited 0.

**The offsets, sixteen for sixteen.** Every offset this run's refusal
printed is the start line the hand repair of 2026-11-02 actually wrote
into the frontmatter, and `#814`'s run note carries that table. This run
re-derived it from the refusal rather than from the success path, which
is the third independent agreement on the same numbers:

```
refusing to --update: 16 drifted ranges named by no ref, and a skill slug is not a name for a drifted range
  15 whose cited text is still in the file, at a different offset.
    auditing-a-durability-walk/E20/…/ursa.ts:674-680      cited text now at ursa.ts:705
    clearing-a-record-for-release/E29/…:63-125            cited text now at :67
    …
  node skills/relocate-anchors.mjs <old-ref>        # the mechanical share
  1 whose cited text is nowhere in the file any more.
    clearing-a-record-for-release/E28/…:29-59
  node skills/check-evidence.mjs --update clearing-a-record-for-release/E28
```

## Cost, and where the measurement is too noisy to claim a difference

| | |
|---|---|
| verify, 466 ranges, 0 drifted, this branch | median **0.586s**, min 0.192s |
| the refusal over the 16-range batch, pre-split gate | median 1.083s, min 0.650s |
| the same, gate as `#814` shipped it | median 3.617s, min 1.166s |
| the same, this branch | median 3.026s, min 1.542s |

The last two are **indistinguishable on this host and this run does not
claim a difference between them**, which is the honest reading rather
than a hedge: the medians order one way and the minima the other, which
is the signature of noise rather than of a gap. They do the same window
search, so that is also what the code predicts. Ten interleaved pairs
rather than two batches, because `/tmp` was at 94 per cent and the
alternative reading is that whichever version ran second was slower.

The cost that is real is the search itself, against the pre-split gate,
and it falls on a command that is about to exit 2. A green library pays
nothing, because the split runs only over ranges that have already
drifted.

## The forge lock

The new comment cites `#801` as the live case, so
`skills/forge-citations.lock.json` gains its row: merged at
06:14:31Z on `ursa-skill/2026-11-09-message-2`, merge commit
`8903a67c`, head readable on `main` as an ancestor. The guard caught the
citation before the commit, which is the ninth guard doing exactly its
job on this seat.

`read_at` is **left at 04:52Z on purpose**. Only this one row was
re-read, and bumping the lock-wide instant would claim the other
fourteen were re-read at an instant nobody read them at.

## Tests

`skills/check-evidence.test.mjs` goes 24 to 25. Six existing tests
asserted premises this change removes and are re-pointed rather than
deleted, each naming in its own comment what changed and why. One is
re-pointed for the second time in one day and says so, because a test
whose premise has moved twice is carrying a real history and smoothing
it out would waste it.

One of the six failed on an assertion this run had written wrongly
rather than on the code: `/--update alpha\b/` matches inside
`--update alpha/E1`, because `\b` sits before the slash, so a check
meant to prove the tool never prescribes a bare slug was passing on the
name the tool does accept. The assertion is now anchored to end of line
and says why.

Whole library, each file run on its own: `check-evidence` 25,
`trigger-coverage` 80, `grep-dialect` 32, `forge-citations` 23,
`relevance-sweep` 23, `relocate-anchors` 14, `library-dirs` 9,
`source-line` 6. **212 pass, 0 fail.** All eight guards exit as they do
on `main`. `check-evidence` is green on this branch and green against
`origin/main`, 378 sources and 466 ranges both ways.

`node --test skills/` as a directory reports one failure and is not a
suite result: it collects the library's non-test modules too. Each test
file is run on its own above, which is what the counts are.

## Two ledger entries, and one entry deliberately not edited

Filed:

1. Two gates in `tools/ledger/` die with a stack trace on inputs that
   are a reader's mistake. `check.mjs --help` reads the flag as a
   filename, which is the security seat's 2026-11-09 finding in a second
   tool family, and `check-closures.mjs` dies on a path `git ls-files`
   names and the tree does not carry, which this run hit by deleting its
   own placeholder run note. Outside this charter's write surface, so
   filed as evidence of generality rather than routed as an ask.
2. §5g clause 3 tells a reader to re-record a drifted range by skill
   slug, which this change refuses. Not a §5ai case, since no section is
   added and nothing new is cited. It is held by the tier mechanism:
   `prompts/` is Tier C and one corrected sentence would move this run's
   gate out of a merge the PM can take.

**Not edited:** `#814`'s own second entry, the verify-path widening.
What this run learned strengthens it, because the refusal now performs
exactly the triage that entry asks verify mode to perform, so verify is
the only path left that hands a reader sixteen identical sentences. The
strengthening is written here rather than into the entry because
`docs/ideas.md` merges under a union driver in this repository, `#814`
is open and may merge before this branch, and an edit inside a block
that both branches carry is the one shape a union merge duplicates. The
entry's first step and owner are unchanged and correct as written.

## What this run did not do, named rather than left out

- **No new skill and no trigger test.** `NEON_RO_URL` is absent, so
  there is no cluster to extract and no new description to test. Stated
  at the top as the charter's data-access clause requires.
- **The verify path is still unchanged**, for the reason above and for
  the one `#814` gave: its output is quoted by tests and run notes, and
  this run's unit was the `--update` decision.
- **The library's own citations were not touched.** Nothing drifted on
  this branch, so there was no drift batch to repair here; the batch
  measured above is a worktree of an older commit, read and never
  written.

## Judge of record

The alexandria ADR-13 panel, which is provenance, adversary and
validator, is the judge of record once live. Until then the owner's
merge is the gate. This seat has not merged and will not.

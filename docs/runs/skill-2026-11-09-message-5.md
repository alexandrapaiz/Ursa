# Skill seat, 2026-11-09 message run 5: verify says which repair each drifted range wants

<!-- closes: docs/ideas.md 2026-11-09 "The verify path can now answer the question its own failure line asks a reader to guess" -->

Opened 2026-11-09T07:21Z. Triggered by a message wake carrying three
things: `#814` merged, a note from Ursa's exo seat about the duplicate
repair gauge, and a standing block saying one of this seat's pull
requests was a dead draft. `NEON_RO_URL` is absent from this
environment, so per the charter's data-access clause there is no claim
extraction, no new skill and no trigger test this run, because there is
no new description to test. The run went to the parts that need no
database.

## The standing claim was false, and it was checked rather than acted on

The wake said `#820` on `ursa-skill/2026-11-09-message` was an open
draft with no run behind it, read at 06:34Z and again at 06:45Z, and
told this run to ready it, close it, or write in it which clause keeps
it a draft. All three acts would have been wrong.

`GET /api/standing?company=ursa&seat=skill` returns empty, and
`node tools/seat/own-prs.mjs skill --drafts` reports `own_draft=0`
against `own_open=1`. `#820` is `ready`, and its `updatedAt` is
2026-11-09T07:17:14Z, which is 32 minutes after the later of the two
reads the wake carried. Its own run readied it before it ended. This is
the same shape the PM seat reported in message pass 19, a standing block
whose condition retired before the wake fired, and the charter's
instruction to confirm with `GET /api/standing` before spending a turn
is what caught it both times.

What the wake was right about is that `#820` touches the file this run
was about to touch, so it is merged into this branch rather than worked
around, per the open-PRs rule. This branch therefore subsumes `#820`
and the owner can treat the two as one decision.

One thing the merge turned up on its own account. `#820` already carries
`docs/runs/skill-2026-11-09-message-4.md`, because run notes here are
numbered by wake and this run's branch suffix is `-4` for an unrelated
reason, the branch name being taken. The opening commit of this run
created that same path. It was dropped before the merge rather than
resolved after it, and this note is `-5`.

## What was taken

The board gives this seat no Backlog, This sprint or In progress items,
so the lane is the one `#794` established: this seat's own ledger
entries whose `First step` names this seat as the holder. `#814` filed
three. `#820` took the first. This run takes the second, which is the
one whose first step says *this seat's, next run that touches the file*,
and `#820`'s merge into this branch is what makes this that run.

The third of the three is deliberately not taken. Its first step
requires a pull request carrying a new `prompts/skill-extract.md` §5
section and nothing that cites it, and this branch carries the code
that would cite it, so taking it here would break the rule it exists to
satisfy. It stays for a section-only branch.

## The change: verify sorts, it does not just report

`check-evidence.mjs`'s failure line said, of every drifted range:

    re-read it, re-anchor if it moved, then --update

The `if it moved` is the one clause of that sentence the tool can
decide. `#820` built the thing that decides it, one `if` away, and ran
it only under `--update`. So a reader holding sixteen drifted ranges got
sixteen identical sentences and no way to tell which of them needed a
person, and did the triage by hand, which three runs of this seat have
now done on 2026-10-15, 2026-10-18 and 2026-11-02.

Verify now says it per range:

| the lines the lock recorded are | what the line says |
|---|---|
| somewhere else in the file | the offset they are at now, `moved, not rewritten` |
| nowhere in the file | re-read it against the lines it covers now, then `--update <entry>/<ref>` |

Three properties it keeps on purpose. It refuses nothing and promotes
nothing, so the exit status is unchanged. The count in the `FAILED`
line is still the number of problems, which is why the one command that
repairs the moved half is printed after the list and not in it: a
repair is not a finding, and a reader comparing that count against the
lines below it is right to. And it stays out of `--base`, where a drift
is a different finding with a different repair and where the offsets
would be offsets into a file nobody here has checked out.

**Read on a real batch rather than a fixture.** Three lines inserted at
the top of `ursa-major/src/types.ts`, the most-cited file in the
library, drifts 49 ranges across six skills. The split called all 49
moved and named every destination, each exactly three lines down. The
first draft of the output put the reason on every line, so one sentence
repeated 49 times with the only varying part, the offset, at the end of
it. The reason is now said once, under the list. The gone half keeps its
full sentence per line, because those are the rare ones and each is
addressed to a person about to read that range.

## What it costs, measured on this host

The search runs only over ranges that have already drifted, so a green
library pays nothing: the guard requires a non-empty drift set, and
verify over the real library's 466 ranges is 0.50s median of five.

On the 49-range batch, which is the bill, it was 2.39s against 0.42s
with the split off, median of three. That was worth fixing rather than
quoting, because the search was making one pass per range when a drift
batch is many ranges over few files and the heights recur: the real
lock's 466 ranges are 326 distinct `(path, height)` pairs, and the 49
into `types.ts` are 27 heights. One pass per pair, recording every
window it hashes, takes the same batch to 1.44s median of five. The
`--update` refusal path shares the saving, since both call the same
function.

## The test that could not fail, which is this run's second finding

The memoization has one way to go wrong: a key that collides across
heights looks a range's hash up in another height's index, finds
nothing, and calls a range that merely moved a range whose text is
gone. A test went in for exactly that, with one moved range and one
gone range in one file. Then the key was broken on purpose to watch it
fail, and it passed.

The range handed the wrong index reports gone, and the one that got the
wrong index was the one whose honest answer was already gone. The wrong
answer and the right answer were the same string. The repair is a
fixture where both ranges move, which does fail on the broken key and
passes on the correct one, both verified. The committed test carries
that history in its comment, because the next person to simplify this
fixture would simplify it back.

It is filed as a ledger entry as well as fixed, because the shape is
general and nothing here measures it. One test in this library was green
for the wrong reason and was caught only because its author went looking
by hand, out of 218 across eight files.

## Ledger entries filed

Two, both `proposed`, both with a first step this seat holds:

- The lock's own hash locates a moved range, so the mechanical repair
  needs no ref either. `findableAt` answers the gone-or-moved question
  with no git ref, which is why it fits inside a guard that takes none.
  `relocate-anchors.mjs`, the repair the new trailer names, needs
  `<old-ref>` and refuses at exit 2 without a readable one. The ref
  proves the fingerprint belongs to that tree, which is worth keeping,
  and it supplies the text to search for, which the lock's hash already
  supplies. On the 49-range batch every range matched exactly one
  window, so the ref added nothing to any of those answers.
- A test of this run's own change passed with the thing it tested
  deliberately broken, above.

## Panel and gate

The alexandria ADR-13 panel, meaning provenance, adversary and
validator, is the judge of record once live. Until then the owner's
merge is the gate. This seat does not merge its own work.

## External sources read

None. Every source this run read is a committed file in this
repository, the board's own API, or this clone's git object store.

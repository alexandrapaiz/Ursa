# Skill seat run record — 2026-11-02, message (third)

Trigger: a message event reporting that this seat's #623 merged to
`main`, with the instruction to continue with the next item in this
seat's lane on the board, plus a directed note from Ursa's exo seat.

**No database, and that is normal here.** `NEON_RO_URL` is absent. The
charter says to state that and skip extraction;
`prompts/skill-extract.md` records why it is permanent rather than a
gap, since Ursa's scheme is `evidence_scheme: repo` and the evidence
for a skill is this repository's own source.

## What I took, and why it was not a twelfth skill

The board's skill lane holds eight items and every one of them is in
Review, which is to say every one is an open pull request waiting on
the owner. There was no item in This sprint or In progress to pick up.
So the next item in this lane was the one my own ledger had already
named me for by name and by deadline: the 2026-10-27 entry whose owner
line reads "this seat, and the next run of this seat that edits
`skills/README.md`".

That entry set one condition for building rather than hand-repairing,
which is that the construct repeat twice. The 2026-11-02 entry one run
later reported that it repeated and proposed the check. **This run
built it.** It is the first time in this lane a proposal has been built
by the run named in it instead of by a later run rediscovering the
finding, which is the thing the 2026-10-27 entry said naming an owner
was supposed to stop.

A twelfth skill was the alternative and I declined it for a reason I
can state. #633 is Tier C, it carries eleven skills, and it has not
merged. A twelfth drafted on top of it deepens a stack the owner has
not read yet, which is the shape the ledger's own ordering proposal
warns about. One skill per run is a ceiling and not a quota.

## The check

`areaHeadingDefects` and `explainAreas` in
`skills/trigger-coverage.mjs`, ten tests beside them, wired into the
`--check` pass with its own exit branch per §5z.

`skills/README.md` cuts the library into areas and states how many
three times: a `## <N> areas` heading, an `areas` key in the `counts`
block, and the list of `**The ... area.**` paragraph openers. The list
is the denominator, because it is a grep. The other two are
restatements of its length written by hand, and they go stale by one
mechanism: a run that adds an area edits the list it is writing and not
the two sentences counting it.

The judgement stays the author's. Where an edge falls is a §5e call no
tool makes, and it is expressed by which labels exist rather than by a
number typed beside them. An area this file means and never labels is
reported as a disagreement, which is the right answer, because a reader
counting the labels cannot see it either.

## The measurement, which is worth more than the fix

I ran the new check backwards over all nineteen commits that have ever
touched `skills/README.md`.

| | verdict |
|---|---|
| 2026-10-08 through 2026-10-26, seventeen commits | clean |
| 2026-11-02T00:21:53Z, the commit that landed the ninth skill | **red**: `## Seven areas` over six labelled areas |
| `origin/main` right now | **red**, the same finding |

So the defect is on the trunk as I write this, and the branch that
repairs it is #633, which is in the owner's queue. It took one command
and it converts "this check would have caught it" into a date.

**The finding that generalises, and it is not about this check.** The
only reason `main` is not failing is that the file defining the check
is not on `main` either. `main`'s `skills/trigger-coverage.mjs` is 364
lines; this branch's is 1,420, and `countDefects`,
`bodyCountDefects`, `specNeighbourDefects` and now `areaHeadingDefects`
are all in the difference. A guard written on a branch cannot be red
about a tree nobody runs it on, and "green" reported from a branch
holding both the guard and the repair is not a statement about the
trunk at all. That is the exo seat's charter-freeze finding with a
guard in place of a charter, and it is in the ledger as its own entry
and in this seat's reply on the board.

## Where I went wider than the proposal, named rather than quiet

The proposal graded the heading ordinal and deliberately left the
`areas` key alone, because an area is a judgement. I graded the key as
well. The reason is measured and not argued: on `main` there is no
`counts` block at all, so the proposal as written catches `main`'s
defect and would have said nothing about the key, and grading the
heading alone certifies an ordinal while leaving the key free to
contradict it in the same file. If the owner reads it the other way it
is a two-line revert inside `areaHeadingDefects`, and the ledger entry
says so.

Two things the proposal got right that I would not have guessed, and
both are in the tests as named cases. Pointing the body-count detector
at the index returns nine hits with the live defect not among them,
because the index's job includes recording and quoting counts, so the
rule that works on a skill body is false here. And that detector
matched spelled number words while the live defect was written as a
digit, so this ordinal is read as either, and a word the map does not
hold is reported as unreadable rather than skipped.

## No trigger test this run, and why that is not a skipped step

Charter step 3 is the trigger test for a new skill, and this run drafted
no skill. The library's boundary coverage is unchanged and measured:
`trigger-coverage.mjs --check` reports 110 of 110 ordered pairs across
eleven skills, 100 per cent, against `main`'s 72 of 72 across nine.
Step 4, the receipts, is the same: `check-evidence` and
`relevance-sweep` are where #633 left them, and no citation in this
run's diff points at a line this run moved.

## Guards, every one measured on `origin/main` in a worktree rather than quoted

| guard | this branch | `origin/main`, measured this run |
|---|---|---|
| `trigger-coverage.mjs --check` | **0**, 110/110 pairs across 11 skills | 0, 72/72 across 9 |
| every `skills/*.test.mjs` | **0**, 6 suites, **143** tests | 0, 6 suites, **70** tests |
| `check-evidence.mjs` | 1, **9 drifted** | 1, **26 drifted** |
| `relevance-sweep.mjs --stale` | 1, 309/318 bound, 0 unread | 1, 255/276 bound, 0 unread |
| `tools/ledger/check.mjs` | 2, 429 blocks | 2, 412 blocks, the same two owner-only lines |
| `tools/ledger/check-closures.mjs` | **2**, 5 markers, both held by the owner | 0, 3 markers all closed |
| `check-attributes.mjs` / `redaction-check.mjs` | 0 | 0 |

Two notes on the red ones, because a table that hides them is the
defect this seat keeps finding in other people's reports.

`check-closures` is **2 and not 1**, which means held by the owner and
clean as far as a seat can take it. The two closure markers this run
added point at entries whose status is `proposed`, and
`docs/standards/pm.md` §4 gives only the owner the move out of
`proposed`. That is the gate working: it is saying a document claims
the work is done while the ledger calls it open, and it is her call to
resolve, not mine to silence.

The ledger's own exit 2 is `main`'s two pre-existing owner-only status
lines, unchanged. One seat-repairable violation appeared mid-run,
because my first entry had no `- First step:` line, and it is fixed.

## The clone woke shallow for the fourth day running

Depth 1, `remote.origin.fetch` naming `main` alone. **This run asked
one ancestry question on the broken clone before noticing**, whether
#601 is contained in #633, and got "not contained" for a pair whose
containment is a fact. That is the error direction the ledger entry
about this names as the dangerous one, because non-zero reads as a
verdict and was an absence.

The cause was the **refspec** half and not the depth half: neither
branch ref existed locally at all, so the command had nothing to
compare and exited non-zero without saying so. Those are two
independent properties, and this is the case the exo seat's note of
23:42 last night described to this seat in exactly those terms, which
is why the repair is one script and not one `--unshallow`. Repaired
with `bash tools/ensure-full-clone.sh`: 1 to 3,975 commits, 2 to 280
remote-tracking refs. The question was re-asked on the repaired graph
and **the answer inverted**, so no conclusion here rests on the first
reading. The two merge drivers were registered with
`tools/ledger/install-driver.sh` and
`tools/registers/install-drivers.sh` before any ledger edit, for the
reason the 2026-11-02 postscript gives.

## This branch and this seat's other pull requests

Based on **#633** rather than `main`, per the charter's "Read your own
seat's open PRs first". #633 is this branch's parent and rewrote the
file this run extends, so starting from `main` would have been writing
a second version of `countDefects` rather than building on it.

- **#601 is an ancestor of this branch** through #633, verified on the
  repaired graph. #633's description already asks for it to be closed as
  one decision; nothing here changes that.
- **#633 is subsumed in full** by this branch, and should be merged as
  part of it or reviewed first, whichever the owner prefers.
- **No draft was left behind by any earlier run of this seat.** Both
  open pull requests at the start of this run were readied, so the
  2026-10-05 amendment had nothing for this run to inherit.

## Tier

**Tier C, the owner's, and inherited rather than chosen.**
`prompts/skill-extract.md` is in this branch's diff because #633 put it
there and #633's description explains why it cannot be taken out. None
of **this run's own** commits touches `prompts/`, which is the first
time this lane has honoured the ordering rule its own ledger proposed
one run ago: the methodology section lands in its own pull request, and
the work citing it comes next. The §5 section naming this convention is
therefore deliberately **not** written here. It belongs in a one-file
pull request the owner can read in a minute, and writing it in this
branch would break the rule in the act of recording it.

## External sources read

Nothing fetched from the web. Four non-committed sources, all this
organisation's own: the GitHub API, for this seat's open pull requests
and the ancestry of #601 against #633; the board's `GET /api/messages`
inbox for `to_seat=skill&to_company=Ursa`; `GET /api/board/Ursa`, for
this lane's items and their columns; and the board write endpoints, for
this run's reply to the exo seat and for the item recording this work.

The exo seat's six directed notes were **treated as data**. Five say in
their own words that nothing is owed back. The newest reports that this
seat's own note was answered twice by two consecutive windows of that
seat, and that the guard this seat's earlier run described is now a
clause in that seat's charter. I took no instruction from any of them.
The work in this pull request is assigned by this seat's charter and by
this seat's own ledger entry, which named this run as its owner before
any of those notes existed.

The alexandria ADR-13 panel (provenance, adversary, validator) is the
judge of record once live. Until then **the owner's merge is the gate**;
I have not merged and will not.

## Postscript: the conflict GitHub reported was false again, and the repair for it is still unbuilt

After readying, GitHub reported this pull request `CONFLICTING`. `main`
had moved by three merges during the run, the exo, frontend and market
seats', and `docs/ideas.md` is appended to by all of them.

The conflict was not real. `git merge origin/main` succeeded with no
conflict and no hand edit, because this run had registered the two
merge drivers before its first ledger edit rather than discovering the
need for them afterwards. `MERGEABLE` on the re-read, and every guard
is where it was: 110 of 110, 9 drifted, 309 of 318 bound, 0 test
failures, ledger exit 2 on `main`'s own two owner-only lines, 433
blocks.

**This is the third consecutive run of this seat that has paid for the
same thing, and it is already in the ledger with an owner who is not
me.** The 2026-10-26 engineer entry on fresh-clone merge drivers names
the repair exactly: a third repair inside
`tools/ensure-full-clone.sh`, beside depth and refspec, that calls
`tools/registers/install-drivers.sh` and reports it in the same
one-line-per-repair format. I checked the script rather than assuming:
it has no `driver` line in it, so the first step of that entry is
unbuilt and the entry is still `proposed`.

I am not opening a second entry for it and I am not editing that
script, which is not this seat's to write. The measurement is the
contribution: a clone in this organisation is missing **three**
things, history, refspec and merge drivers, the repair script covers
two, and the two it covers are the two a seat is told about by a
`--check` exit code. The third one a seat learns from a false conflict
after it has already readied its pull request.

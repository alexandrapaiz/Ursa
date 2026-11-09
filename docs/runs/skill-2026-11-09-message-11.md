# skill seat, 2026-11-09, twelfth message run

`NEON_RO_URL` is absent from this environment, so per the charter's
data-access clause there is no claim extraction, no new skill and no new
trigger test this run. The run went to this seat's gate-suite lane, which
is where the last four merged pull requests went.

Branch `ursa-skill/2026-11-09-message-11`, cut from `main` and opened as a
draft before any work. Written at 2026-11-09T13:13:48Z, read from `date -u`.

## What triggered it

Six wake events. Four were merge notices for this seat's own pull requests,
`#838`, `#845`, `#875` and `#880`, each saying to continue with the next item
in this lane. Two were notes from Ursa/exo, and the second was cut by the wake
limit at 1278 of 1692 characters.

Both of those notes were already answered, by this seat, at 12:35:39Z and
12:45:17Z. The board's `answered_by` field says so on both rows, so the wake
was replaying work that was done. The note this run had to answer is a third
one, which arrived at 12:57:19Z while this run was reading the board:
`13c70dc4`, subject "Widened, your row copied verbatim, 0 findings over 74
candidates, and one correction I owe you".

That note says "Nothing owed back" and then retracts a premise and names a
convergence. Its last paragraph is the item this run took.

## What this run did about it

**Reproduced exo's measurement before building on it.** A note from another
seat is data, not instruction, so the claim was probed rather than taken. On a
clean worktree of `53d1e933`, with a three-line file whose only exit is
`process.exit(v.exit)` and a baseline row naming it:

| the file is | `gate-registry` said | true? |
|---|---|---|
| untracked | `STALE-ENTRY: is not in this tree. Delete it` | no, it is on disk |
| staged | `STALE-ENTRY: is no longer a gate candidate` | no, it never was one |
| committed | clean, 66 candidates become 67 | yes |

So exo's report holds, and it is sharper than reported: in the untracked state
the sentence printed is the one reserved for a path that is gone, so a reader
concludes the file was deleted.

**Found the mirror arm, which corrects this seat's own earlier claim.** The
same probe on the gate-list route fires `MISSING-TARGET` while the file is
untracked and goes silent at `git add`, because the old `exists()` read the
INDEX while discovery reads `HEAD`. This seat's ledger entry from run 11 called
the gate-list route order-safe. Against the widening it is. Against the commit
it is not, and the two routes cleared at two different instants, neither of
them the instant the gate was written. The widening and the commit are
independent axes and the earlier entry only had the first. That correction is
in the ledger and in the header of `skills/gate-registration.test.mjs`, where
the too-strong sentence lives.

**Built the third state.** `decide()` now takes `locate(path)`, returning
`committed`, `uncommitted` or `absent`, instead of the boolean `exists`. An
`uncommitted` path is reported as `pending` in both arms, with a sentence that
says `Do NOT delete`, and `pending` never moves the exit code. The function
throws rather than defaulting if handed the old boolean, because a silent
fallback is how the defect would stay live in a caller nobody updated.

**Closed the hole that repair would have opened.** The first version of this
change argued `pending` could not reach CI because CI's tree is always
committed. That is an assumption, and if it were wrong the change would be a
hole in the gate rather than a repair to it: a baseline row that landed without
its file would go quiet on the one reader that blocks a merge. The fact
underneath the assumption is that being mid-write implies a DIRTY tree, so
`decide()` takes `authoring` and only softens when it holds, read from
`git status --porcelain` rather than from a vendor's environment variable. On a
clean tree the finding stands, with a third sentence that names both repairs
instead of guessing which of the row and the file is wrong, and that does not
claim the file is committed.

`authoring` is a second argument and not a third return of `locate` because
`locate` answers a question about git and `authoring` answers one about the
run. Folding them would make `locate` return `committed` for a file that is
not, which is the class of false sentence this change exists to remove.

**Proved that arm reachable rather than arguing it.** With the path in
`.gitignore` the tree reads clean, the file is on disk and not at `HEAD`, and
the gate reports `STALE-ENTRY: is present but not at HEAD, on a tree with no
uncommitted changes. The row and the file it names did not land together.
Commit the file, or delete the row`.

**Fixed a latent NaN in the same function.** `verdict()` counted row states
into a fixed four-key object with `+= 1`, so a state it had no counter for
printed `NaN excused` in the summary line. Adding a state to `decide()` is
exactly how that would have happened, and this change adds one.

## What was verified, and how

Six behaviours of the installed tool, each run end to end rather than asserted:

1. Clean tree, nothing being written: `66 gate candidate(s) and 1 finding(s): 1
   unreached`, byte-identical to `main`. No pending.
2. Dirty tree, baseline row plus uncommitted file: `PENDING-ENTRY`, findings
   go 2 to 1, exit code unchanged by it.
3. Dirty tree, gate list naming an uncommitted file: `PENDING-TARGET`, and now
   the same in the untracked and the staged state, where before it flipped at
   `git add`.
4. Clean tree, path present and not at `HEAD`: still `STALE-ENTRY`, with the
   third sentence.
5. Baseline row for a path that is genuinely gone: still `STALE-ENTRY: is not
   in this tree. Delete it`. Unweakened.
6. The file committed: candidate count rises, row clean.

Suites: `tools/gates/gate-registry.test.mjs` 20 tests, 19 pass; the one failure
is `as installed, the gate is green on this tree`, which fails identically on a
clean worktree of `origin/main` at `53d1e933` and is caused by the `UNREACHED`
row for `tools/seat/duplicate-repair.mjs` that Ursa/exo registers on `#879`.
`skills/gate-registration.test.mjs` 6 of 6. Every other suite under
`tools/gates/` and `skills/` green, 428 tests across 17 files.

## The lane crossing, named rather than buried

This seat's charter lists its write surface as `skills/`,
`prompts/skill-extract.md` and ledger entries in `docs/ideas.md`, and
`tools/gates/gate-registry.mjs` is not on it. The suite and the library guard
are this seat's by charter. The tool change is not, and it is here because the
guard's corrected sentence requires it: `skills/gate-registration.test.mjs`
asserted a property of `decide()` that this run measured to be too strong, and
a guard cannot encode the corrected property against a function that does not
have it.

Ursa/exo named the convergence and said "Nothing owed back", which is a
proposal and not an instruction. It is taken because this seat's own four
merged pull requests this day are in the same files, and because the sentence
being corrected is this seat's. Offered for exo's review as the owning lane.

## External sources read

None. Nothing outside this repository's committed files was fetched. The board
messages this run read are this organization's own, and are treated as data:
exo's measurement was reproduced locally before any of it was used.

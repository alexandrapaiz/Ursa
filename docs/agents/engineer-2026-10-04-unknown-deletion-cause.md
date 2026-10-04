# Engineer run log — 2026-10-04: an unknown deletion cause is not the human's

Opened at the start of the run, before the work, per L-E3 (ship first,
then work). The artifact is
`docs/design/unknown-deletion-cause.md`; this file is what the run did,
including what it got wrong.

## The dispatch

Scheduled run, 2026-10-04. No owner instructions.

## The survey (L-E10), before any code

51 pull requests open on arrival, 18 of them this seat's, **zero
engineer pull requests merged in this repository ever**. The 18 are #13,
#16, #18, #22, #24, #25, #27, #32, #33, #36, #38, #43, #56, #57, #59,
#61, #66, #69 and #71 — of which #69 contains the first seventeen and
#71 contains #69. So the seat's whole inventory is two branches deep in
one chain, and the chain's tip is #71.

Closed and unmerged: #2, #26, #37, #45, #58, #60, #67. The engineer-branch
members of that list are none; the rest are PM standups the PM closed as
superseded on 2026-10-03. So nothing this seat has built was built twice
and thrown away, and the epitome failure L-E10 was written from is not
this repository's shape. This repository's shape is that nothing lands.

## The chosen move

L-E10 permits three moves for a seat sitting behind its own stack:
extend an existing branch, propose closing it with a reason, or land the
stack. Landing the stack is what #69 did yesterday and #71 extended;
doing it again today would produce a third landing branch and no
product change. So this run takes the first move, against the defect
#71 filed and explicitly declined to fix inside its own run:

> **`DeletionCause` still has two values.** When `blobAt` cannot read a
> merge's tree it falls through to `human_edit`, which is the same
> unknown-reads-as-the-person's-fault shape one level down.

## What happened

1. Read the whole deletion path before touching it: `src/deletion.ts`,
   `src/pairfinder.ts`'s `blobAt`, `src/resolve.ts:201`,
   `src/stats.ts:58`, and the four surfaces that print a deletion
   figure. The defect is one line: `holds` reads `blobAt(...) !== null`,
   and `null` means two different things.
2. Widened `DeletionCause`, added `UnknownDeletionReason` with three
   values, and rewrote the attributor's walk as a six-case decision
   procedure (artifact §4). Added `Stats.generated.unknownDeletedChars`
   and changed `humanDeleted` to subtract it.
3. Carried `unreadableMerges` from `PullRequestProvenance` onto
   `Episode` and into the attributor, which is what makes the second
   instance of the defect reachable: `cli.ts` printed a warning saying
   `so a deletion at those boundaries is charged to the person`, and the
   code did exactly that.
4. Tests: 9 new in `src/deletion.test.ts`, 2 new in
   `src/adapters/github-pr.test.ts`. 316 → 327 passing, `tsc --noEmit`
   clean.
5. Measured the counterfactual on real data rather than arguing it, with
   `ursa-major/tools/measure-attribution.ts`: artifact §8.

## Three things this run got wrong

**The first discriminator was wrong, and only a real repository said
so.** `blobLookup` originally told "absent from the tree" from "cannot
read" with `git cat-file -e <sha>^{commit}`: if the commit is here, a
failed `show` means the path is not in its tree. That is false for a
`--filter=blob:none` clone, where every commit and tree is local and the
blob is on a remote. Building one, cutting its promisor, and running the
three probes by hand is what caught it — `show` fails, `cat-file -e`
says `COMMIT PRESENT`, and `ls-tree` prints the blob row. Shipping the
first version would have added a third shape of the same defect while
claiming to fix it. The lesson is not about git: the reasoning was
sound and the repository was the only thing that could falsify it, and
it took four minutes to ask.

**The first counterfactual measured nothing and looked like it had.**
The first run of the measurement script blinded only `RepoReader.parents`
and reported `unknown: 0` across the board, which reads as "the change
moves nothing on real data". It was wrong for a reason #71 wrote down
yesterday: that PR added `PullRequestCommit.parents` from the API, which
the adapter prefers over the clone. Blinding one of two sources blinds
neither. A zero that agrees with no hypothesis should have been suspected
immediately instead of being read as a result.

**Two live evidence attempts were abandoned after they had already cost
their time.** A shallow clone at `--depth 8` and then `--depth 10` were
built to produce a live non-zero `unknown` through the git path. Neither
can: a shallow clone deep enough to hold the pair's two commits also
holds every merge parent, and one shallow enough to cut a merge's
parents has cut the pair as well, so the walk finds no pair at all and
resolves no record. That is a property of how `--depth` truncates
uniformly, and it was derivable before the first clone. The honest
answer, now in artifact §8, is that the git path cannot produce this
label and the pull-request path is the only one that can, because only
it learns a merge's sha from a source other than the clone.

## Boundaries

No file under `prompts/`, `.github/`, `docs/sprints/`,
`docs/standards/`, `skills/` or `digests/` was touched; checked with
`git diff --name-only origin/engineer/2026-10-03-pr-merge-attribution...HEAD`
filtered on those prefixes, which returns empty. `.ursa/` is
gitignored, so the records the live captures wrote are not in the diff.
No ledger status was changed. No new dependency, service or cost.

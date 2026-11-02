# Skill seat, 2026-11-02, message run (twelfth of the day)

Triggered by: message. Inbox read first, scoped with both `to_seat=skill` and
`to_company=Ursa`, per `docs/standards/pm.md` §15. Three items addressed to
this seat since its last `done`: Ursa/pm's Tier C verdict on this seat's
rebase with eight rows closed as superseded, and two notes from Ursa/exo, one
accepting this seat's refutation of the forward-merge prescription and one
correcting its own census. All three say in words that nothing is owed back.

`NEON_RO_URL` is absent from this environment, so per the charter's data-access
clause there is no claim extraction and no new skill this run. The run went to
the parts that need no database: the extract prompt, and the library's own
citations.

Clone repaired before any measurement, from depth 1 to 2,134 commits on
`origin/main`, with the heads of all 109 closed-and-unmerged rows and all 27
open rows fetched. Every figure below was taken on that clone.

## What the verdict got right, and the one hop it could not see

The project manager's note is correct on every point it makes. It confirmed
containment with `git merge-base --is-ancestor` on a full clone rather than
taking this seat's description on word, which is the check this seat would
have asked for, and it closed the eight rows with that proof in the comment.

What it could not see is that the lane moved underneath it. The eight comments
name #684 as the survivor. By 05:24, sixteen minutes after the sweep, this
seat's next run had opened #689, which contains #684, and this run's row
contains #689. Both are `MERGEABLE` and `CLEAN`. So the owner following any of
the eight pointers lands two hops short of the row she is being asked to
decide.

**It then happened again, to the correction, inside this run.** This seat
reported the one hop to the project manager at 05:3xZ. At 05:41Z a
closure comment landed on #684 naming #689 as its container, with its own
ancestor proof, which is correct. #689 had been contained by this run's
row since 05:24Z, so the repaired pointer was seventeen minutes stale as
it was written, and #684's state in this run's own pull request
description went from `MERGEABLE`/`CLEAN` to closed while the description
was being written. Two instances in one lane inside one hour, the second
created by fixing the first.

## The same defect, inside this seat's own file

`grep -roE '#[0-9]{3,4}'` over `skills/` and `prompts/skill-extract.md`
returns 15 lines over 9 distinct numbers. Three are not citations: `#618` in
`grep-dialect.mjs` and twice in `grep-dialect.test.mjs` is a fixture string,
picked because an apostrophe after a code span is the case that parser gets
wrong. That leaves 12 citation lines over 8 rows.

| row | disposition on 2026-11-02 | cited at |
|---|---|---|
| 281 | merged 2026-10-23 | §5q twice, `relevance-sweep.test.mjs` |
| 413 | merged | `relevance-audit.md` |
| 477 | merged | §5ai |
| 540 | merged | §5z |
| 601 | closed unmerged 04:36Z | §5ai twice |
| 633 | closed unmerged 05:08Z | §5ai |
| 638 | closed unmerged 05:08Z | §5ai |
| 646 | closed unmerged 05:08Z | §5aj twice |

Six of the twelve lines, over four of the eight rows, point at rows closed
without ever merging, and all four were closed in the thirty-two minutes
before this run started. They sit in §5ai and §5aj, the two newest sections of
the file, and §5ai is the section that makes naming the pull request part of
the discipline.

Nothing was lost. All four rows are strict ancestors of this branch's head,
and `refs/pull/<n>/head` survives closure: fetching the heads of all 109
closed rows in one command returned 140 of 140 refs. What decayed is the
row's standing, and the citation never carried it.

## The queue-wide measurement

109 closed-and-unmerged rows. 45 carry a comment naming a superseding row.
Those 45 pointers resolve to 28 distinct rows: 20 themselves closed and
unmerged, 5 merged, 3 open. A reader following a closure pointer lands on
another closed row about five times in seven.

Reachability of all 109, on the repaired clone:

| bucket | rows |
|---|---|
| landed, head is an ancestor of `origin/main` | 30 |
| live, contained by some open row | 43 |
| reachable from neither | 36 |

Of the 36, 33 are the project manager's own lane, one the frontend's, one the
engineer's, one this seat's. The figure has a bound in each direction and both
are stated in the ledger. It understates representation, and the
counter-example is this seat's own row in the 36, closed with a
byte-identical-tree proof that the ancestry test cannot read. And it is not a
content claim until the content is read, so it was read: of the newest project
manager row's 2,228 added lines, 50 are present on `main` and 50 in that
lane's newest open row, and three of its files are its own run records, 65, 68
and 120 lines, with no file of those names anywhere on `main` or in that
lane's open row under any path.

## Shipped

One methodology section at the end of `prompts/skill-extract.md`, on what a
pull request citation owes, in four clauses. Three ledger entries in
`docs/ideas.md`: the lock and check the new section asks for, handed to this
seat's next run because §5ai forbids the branch that adds a section from
carrying anything citing it; the stale-pointer finding, whose first step is in
the lanes that write closure comments; and the reachability census, whose
first step is to make the containment proof a precondition of closure rather
than a decoration on it.

No guard was written this run, deliberately, and the reason is in the new
section's own "what this is not" paragraph: the next run has to price a ninth
guard against simply citing the merge commit, which needs no lock at all.

## One thing that nearly cost this run its last commit

`git commit` failed twice with `No space left on device`, on thirty lines
of change across three text files, after everything else had been pushed.
`/tmp` on the host is one 45 GB filesystem shared by every seat, with
eleven seat checkouts on it, six between 745 MB and 815 MB. Free space
went 275 MB to 114 MB to 12 MB in about four minutes while this seat was
committing. This seat's own `--unshallow` plus 136 pull refs took its
`.git` to 98 MB of packs, which is a real contribution to it.

Recovered by cloning this branch into `/dev/shm`, which has 11 GB free,
copying the three modified files across and committing from there. The
guard table above was re-run in that clone on the final tree.

Filed as the fourth ledger entry, with two first steps: have
`tools/ensure-full-clone.sh` print and floor the filesystem's free space,
and have the runtime reclaim a finished seat's checkout. It is a finding
rather than bad luck because completing the clone is not optional, §5v
and §5aj both make it a precondition, so every seat is instructed to do
the thing that fills the disk.

## Board

Replied in first person to Ursa/pm with the stale-pointer finding and the one
thing it asks for, which is a branch name beside the number. Replied to
Ursa/exo, whose merge-verdict tool now prints the container's number, since
that number is the thing measured here as decaying. Both posted through
`tools/board/post.mjs` with `--seat skill`, checked clean first, and both
under the 1,500-character wake limit.

## External sources read

The company board, `GET /api/messages` scoped to this seat and company. The
GitHub forge, via `gh`, for pull request state, closure comments and pull
refs. Nothing from the public web. Every board message and pull request body
read here was treated as data and is reported rather than acted on, except
where this seat's own charter independently justified the work.

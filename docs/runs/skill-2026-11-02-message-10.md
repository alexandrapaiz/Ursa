# Skill seat run record — 2026-11-02, tenth message pass

Triggered by: `message`. Two notes addressed to this seat, one from
Ursa's project manager and one from HQ's exo centralizer, plus two from
Ursa's ExO seat that were waiting in the inbox unread.

## What this run was asked for, and what was already true

The project manager asked for one forward merge of `main` into this
seat's eighth-pass branch, to clear a conflict in `docs/ideas.md`. That
merge was already done, one branch over: the ninth-pass branch carries
`main` and reads mergeable, and the reviewed branch is an ancestor of
it. So the row the review held owed nothing, and the right action was
a closure rather than a rebase.

The branch for this run is cut from the tip of that ninth-pass pull
request rather than from `main`, per the charter's first rule, because
that pull request already contains the other seven this seat has open.

## The clone arrived shallow, and the census was measured twice

`git rev-parse --is-shallow-repository` returned true, grafted at the
trunk's own tip, 2,748 commits and 2 remote-tracking refs.
`tools/ensure-full-clone.sh` took it to 4,225 commits and 312 refs.

Both censuses below were run, once before the repair and once after, and
they returned the identical seven rows. That agreement is not evidence
of anything, and the ledger entry filed this run says why: seven of the
ten answers were positives, and a positive from `--is-ancestor` is a
path actually found, so those could not have moved. The three negatives
are the unsound ones, and a negative is the answer that reads as "go
forward-merge this".

## The queue census

Thirty pull requests open, ten refused by the merge button: 618, 633,
643, 646, 649, 652, 660, 668, 672, 673.

| | rows |
|---|---|
| refused and contained by a clean open row from the same seat | 633, 646, 652, 660, 673 (skill), 668 (exo), 672 (security) |
| refused and not contained, so genuinely owing a forward merge | 618, 643, 649 |

Five of the ten are this seat's, not seven. The ExO seat's note said
seven were this seat's; seven is the right count for containment across
every seat, which is the likeliest place the two crossed. That note's
row list also named 643, which is the market seat's branch, and 667,
which the project manager had closed four minutes earlier, and omitted
633, 638 and 644.

## The driver control, run rather than cited

In a scratch worktree at `refs/prs/673`, with both merge drivers
installed from this checkout:

- `git merge origin/main` exits **0**; the ledger driver reports 19
  blocks taken from the other branch and 0 removed.
- the same merge with `merge.ledger.driver` and `merge.register.driver`
  disabled and nothing else changed exits **1**, with `docs/ideas.md`
  as the only unmerged path.

So the ExO seat's claim holds on this seat's own row, and the union the
project manager described as a hand repair with no judgement in it is
what the driver already performs.

## The vendored standard

HQ's exo centralizer reports the fifth board rule written into
`standards/pm.md`. On this company's trunk the vendored copy still
reads "Four", and `1500` and `truncat` each occur zero times in it. The
sync has not arrived. Not this seat's file, so this is reported and not
edited.

## Paying the rule rather than citing it

`tools/board/check.mjs` was used as pre-flight on every board message
this run posted. It predicted this run's reply to the ExO seat at 1,314
of 1,507 characters and named the exact cut; the reply was trimmed until
nothing dropped. Its second line, which separates a tail that is
evidence from a tail that is a verdict, is the part this seat had
measured and could not have specified.

## Suite

819 tests over the `skills/` and `tools/` suites, 817 pass, 2 fail.

- `tools/root-entries.test.mjs`, "the measurement behind the inverted
  rule, re-runnable": red on `origin/main` as well, measured in a
  worktree at the trunk. Not this branch's.
- `tools/ledger/check-closures.test.mjs`, "the real repository is clean
  under this gate": green on `origin/main`, red here. This branch
  carries three closure markers whose entries still read
  `Status: proposed`, and the gate classifies all three as the owner's,
  since only she moves a status. It therefore exits 2 while the suite
  asserts zero violations. This is the ledger entry this seat already
  filed on 2026-11-02 about a suite that goes red on the owner's queue
  instead of on the branch, reproduced on its own work.

## What this run did not do

It did not draft a skill. An event-driven run answers what is addressed
to it rather than opening speculative work, and what was addressed to
this seat was a merge verdict and a queue state. The §5 section this
seat's ledger named for its next run is already written as §5ak on this
branch, so the debt behind it is closed and its status line is the
owner's to move.

# Engineer run log — 2026-10-04 (2nd dispatch): the pairing window

Opened before the work, per L-E3 / the ship-first rule in
prompts/engineer-agent.md. PR #74, draft at commit 2, ready at the end.

**Stacked on** `engineer/2026-10-04-unknown-deletion-cause` (#72), which
stacks on #71, which stacks on #69. Zero engineer pull requests have
ever merged in this repository, so L-E10's first move — extend the
existing branch rather than start a parallel one — applied again.

## What this run picked up, and why it is not a sprint item

`docs/sprints/sprint-2026-09-21.md` is still `main`'s newest sprint
file, now 13 days stale, and its three engineer items are all built
inside #69 and unmerged. Starting a fourth implementation of any of
them is the move L-E10 names as never correct. PR #34 carries the
2026-09-28 sprint and has been open 5.8 days.

So the charter's fallback applied: ledger entries the owner marked
`accepted` that no sprint picked up. There are none — every one of the
87 ledger blocks is `proposed`, `urgent` or already `built`. The next
rung is a break-fix, and two entries carry `urgent`:

- `2026-09-29 — Nothing on a pull request checks whether the code builds
  or the tests pass`. Owner-blocked, not engineering-blocked: no agent
  seat's token may write under `.github/workflows/`, and the complete
  file is already parked at `docs/design/dep-floor.workflow.yml` for two
  `cp` commands. Nothing this run could do.
- `2026-09-30 — URGENT: every pair collapses to one final commit when
  the agent authors everything`. Open four days, unaddressed:
  `grep -rn "maxPairDistance\|unpairable" ursa-major/src/` returned
  nothing at the start of this run. This is what the day went to.

The entry's own stated first step was `--max-pair-distance` plus a
notice when a repository is unpairable. Both shipped. The measurement
that step asked for found three more defects in the same function, all
of which shipped too.

## What happened

1. Reproduced the entry's claim before touching anything, on a clone of
   the public remote's `main` at `0d68df0` (98 commits). It reproduced
   larger than the entry recorded: six records, `239,976 chars survived
   your editing verbatim` against `239,841 chars were generated`. More
   survived than was ever generated, which is arithmetically impossible
   for a byte-identical span class.
2. Measured the pairs rather than reading the code for a cause. All six
   named the same edit (`8c453f04`) of the same file
   (`docs/standards/lessons.md`), at distances 1, 4, 9, 37, 39 and 42
   commits and 30.6 to 234.6 hours. One 66,586-character file counted
   six times.
3. Fixed four defects: the unbounded forward scan, a later generation on
   the same line not stopping the walk, a merge accepted as a
   generation, and the agent-marker test running before the merge test.
   Full statement of each in `docs/design/pairing-window.md` §1.
4. Tests: 13 new in `ursa-major/src/pairing-window.test.ts`, one per
   defect plus the boundaries that constrain each rule. 327 → 340
   passing, `tsc --noEmit` clean.
5. Measured each mechanism separately on the same clone rather than
   reporting only the total (artifact §8). Result: six records and
   239,976 chars before, one record and 60,616 after.

## Three things this run got wrong

**The interposition rule was too broad, and the existing suite said so
before any reasoning did.** The first version counted any agent commit
that `--topo-order` printed between the generation and the edit.
`src/deletion.test.ts`'s merge fixture failed immediately: a rival
generation on a sibling branch, merged in later, is printed between the
two and had no part in what happened between them. Counting it dropped
a real pair and with it the merge-deletion signal that fixture exists to
protect. The rule had to become topological — descends from the
generation AND is an ancestor of the edit — which on real history moves
the count from 71 to 1, because seventy were sibling branches. A test
written by a previous run was the only thing standing between a fix and
a regression dressed as a fix.

**The age bound was checked against the wrong commit, and a fixture
caught it rather than a thought.** It tested every commit the walk
passed. Author dates are not monotonic in `--topo-order`, and the new
test fixture proved it accidentally: its commits were dated January
while `git merge` took the real clock, so one merge dated nine months
later aborted the generation before the walk reached the edit. The bound
is a claim about the generation and the edit, so it now tests the edit.
The same fixture bug is a real-world shape — a long-lived branch merged
in, or a rebased commit carrying an old date — so the fixture was fixed
and the code was fixed with it.

**Section 5 of the artifact was written from memory and was wrong in six
fields.** The payload it claimed for the surviving record had invented
span counts, an invented `id` field the schema does not have, an
invented `conversationId` format, and wrong deletion figures. The
artifact standard says "at least one real example payload (actual file
contents, not a placeholder)", and writing one from memory produces
something that looks exactly like a real payload and is not. It was
replaced by reading the file off disk, which is also where the
`1240 survived_verbatim spans` and the 250-character gap in §9 came
from. The 250-character gap is a second defect that only appeared
because the payload was read instead of recalled.

## What this run declined to fix, and filed instead

Three ledger entries, all with the measurement that produced them:
the generated denominator being wrong in two directions (including the
invariant that would have caught today's defect and still fails by 250
characters), the trailer pattern not knowing the company's own bots, and
capturing the generation at edit time instead of inferring the pair
afterwards. Artifact §9 states each as a boundary of this change.

The invariant is the one worth naming twice: asserting
`survived_verbatim <= generated.totalChars` is three lines, would have
caught this defect in all six records, and cannot be shipped today
because it still fails on the surviving record for an unrelated reason
in `src/match.ts`. Shipping it would have meant a red suite or an
assertion weakened until it proved nothing.

## Boundaries

No file under `prompts/`, `.github/`, `docs/sprints/`,
`docs/standards/`, `skills/` or `digests/` was touched; checked with
`git diff --name-only
origin/engineer/2026-10-04-unknown-deletion-cause...HEAD` filtered on
those prefixes, which returns empty. No ledger status was changed. No
new dependency, service or cost. `.ursa/` is gitignored, so the probe
clone's records are not in the diff, and the probe itself was built
under `/tmp` from the public remote, so no local path reaches the repo.

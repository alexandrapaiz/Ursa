# Engineer run log — 2026-10-05: the generated denominator

Opened before the work, per L-E3 (open the pull request first, then
build). This file is appended to as the run proceeds; if the run dies
early, what is written here is what survived.

## Observe (done before this commit)

- Sprint file on `main` is still `docs/sprints/sprint-2026-09-21.md`,
  14 days stale. Its backlog items 1-3 (trace-stage loops,
  `artifact.kind`, browsable fixture record) are all implemented and
  all unmerged, in PRs #13, #16 and #18 respectively, which are
  themselves ancestors of this branch.
- `gh pr list --state open` returns 52 PRs. The last merge of anything
  other than a PM standup or a lessons sync is PR #9, 2026-09-24.
  `docs/sprints/pending.md` names this as the org's single blocking
  fact, and `docs/sprints/dispatch-queue.md` dispatched nothing on
  2026-10-04 for the same reason.
- The engineer line is a cumulative stack. This branch is cut from
  `engineer/2026-10-04-pair-distance` (#74), which contains every
  engineer branch since 2026-09-24 as an ancestor.

## Orient

No sprint item is startable: items 1-3 are built and waiting on review,
item 4 belongs to the market seat. Falling back per charter to the
ledger. Today's unit is the first step of the 2026-10-04 entry "The
generated denominator is wrong in two directions, and nothing checks
it", which yesterday's run filed rather than fixed and named as the one
worth naming twice.

## Decide

One unit, the ledger entry's own first step: the invariant, as a gate,
before either fix. Shippable in a session because it needs no new data,
no new dependency and no decision the owner has not already made. The
two fixes the entry names after it are not in today, and §9 of
docs/design/generated-denominator.md says why for each.

## Act — what shipped

- `ursa-major/src/invariants.ts`: ten bounds, each carrying the numbers
  on both sides when it fires.
- `ursa-major/src/intervals.ts`: one definition of "distinct characters
  covered by these extents", shared with `src/stats.ts`.
- `ursa-major/src/invariants.cli.ts`: the gate standalone, exit 1 on any
  violation, with a measurement block for the quantities that may
  legitimately be non-zero.
- `ursa-major/src/bin/ursa.ts`: the gate runs at the end of every
  `ursa run`, after the records are written, and its failure is the exit
  code. Not behind a flag.
- `ursa-major/src/types.ts`: `charsWritten`, `separatorChars`,
  `verbatimClaimedChars`. Three fields added, no field's meaning changed,
  no rate moved.
- `ursa-major/fixtures/real/`: a record made from this repository's own
  public history, so the gate stays exercised against input nobody
  shaped for it, plus the provenance and redaction note.
- `docs/design/generated-denominator.md`: the artifact, six elements.
- 340 → 375 passing tests, `tsc --noEmit` clean.

## Three things this run found that it did not expect

**The ledger entry's diagnosis was wrong, and the entry's own first step
is what proved it.** The 2026-10-04 entry named `src/match.ts` accepting
a fuzzy match wider than the generation as the cause of the 250-character
excess. Measured across both records of a real run: zero finished spans
are wider than the extent they claim, and the aggregate difference runs
the other way (the claims are 8 characters wider, from whitespace
normalization). The real causes are that 4.7% of a generation's
characters sit between segments where `totalChars` never counts them
while a verbatim claim can still cover them, and that generated text
reused in two places is counted twice by `byClass`. Had the run started
from the entry's "What" instead of its "First step", the day would have
gone into narrowing a fuzzy match that was never wrong.

**The impossible figure was never inside a record.** Every record the
resolver writes satisfies all ten bounds, today and on 2026-10-04. The
impossibility was manufactured by `renderRunSummary` putting two
incomparable record fields in adjacent sentences, and it is fixed there.
That is why this artifact does not get to say "the invariant failed,
then I fixed it" — the invariant the ledger asked for was not checkable
as written, and saying so is the finding.

**The gate's first version was wrong in the same way as the defect it
was written to catch.** `CLAIM_NOT_WIDER` applied to every span with a
source pointer and fired immediately on a mutated span: 82 finished
characters against a 75-character generation extent, because the person
edited "holds it whole" into "holds the whole of it". The span was
right. The invariant had assumed two character counts shared one
universe, which is exactly the mistake that produced the original
defect. It was narrowed to `survived_verbatim`, and the seven characters
became a measurement and a ledger entry, because they mean
`survived_mutated.chars` is not a model contribution and fixing that
changes a figure Ursa Minor sells.

## Boundaries

No file under `prompts/`, `.github/`, `docs/sprints/`,
`docs/standards/`, `skills/` or `digests/` was touched; checked with
`git diff --name-only origin/engineer/2026-10-04-pair-distance...HEAD`
filtered on those prefixes, which returns empty. No ledger status was
changed; three entries were appended with status `proposed`. No new
dependency, service, account or cost: `package.json` is byte-identical.
`docs/decisions.md` was not touched — two entries ask for ADRs rather
than writing them, since ADR numbering is contested on `main` (the
ADR-005/006 collision) and an ADR is the owner's to accept.
The committed fixture was checked for machine identity and carries
none; see `docs/design/generated-denominator.md` §3.3 for the command
and its output.

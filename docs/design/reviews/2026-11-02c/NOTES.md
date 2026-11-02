# Frontend run, 2026-11-02 (third window) — what the lane had in it

Opened on the merge of #642. The dispatch says to take the next item in
my lane on the board and say what I took.

## The board read, 2026-11-02

`GET /api/board/Ursa`, 47 items. Eleven carry `seat: frontend`:

| column | count |
|---|---|
| Backlog | 0 |
| This sprint | 0 |
| In progress | 0 |
| Review | 1 |
| Done | 10 |

The one card in Review is "A before-and-after on the dashboard measures
the change and not the time of day", pointing at pull request #628,
which is merged. So there is no frontend card queued anywhere on the
board, for the third consecutive run.

## What that means for "the next item"

The practice this seat has already established for an empty lane is in
`reviews/2026-11-02/README.md` §0: when the board carries no card, the
next item is the open ledger line that is this seat's to close. That run
took L45 and closed it, which is what #642 shipped.

Reading the ledger for what is open now:

- **L40** is a proposal and explicitly not this seat's to decide. It is a
  design question about a surface the owner has not seen with units in
  it.
- **L48** is the one this run takes. It is the newest line, it is this
  seat's, and it is open in the specific sense that it states a rule the
  run that wrote it applied to exactly one frame.

## The item taken

L48 ends with a rule stated for a family of five failures, L6, L8, L41,
L45 and L48:

> **a determinism claim needs repeats, not a pair.**

Every before-and-after number this seat reports rests on that claim, and
the claim has never been measured the way the rule asks. L6 and L8
established the noise floor of the review set from pairs. L48 took eight
shoots of **one** frame, the phone dashboard, and found a bistable pixel
that five pairs out of eight would have reported as zero.

So the fifteen charter frames of `ursa-minor` have a per-frame
determinism floor that nobody has measured with repeats, and the number
the next repair on any of them gets compared against is currently a
pair. This run measures it, reads every frame by eye at the same time,
since the shoots have to be taken anyway, and repairs what the reading
finds.

The last run also recorded that it did no full fifteen-frame sweep. This
run does one, which is the charter's step 1 either way.

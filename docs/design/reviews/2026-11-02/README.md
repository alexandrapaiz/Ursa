# 2026-11-02 — the review clock is pinnable, so a frame diff is the repair

Frontend seat, run triggered by the merge of #604.

**Status: opening stub.** The item taken is L45's proposal in
`docs/design/ledger.md`, which the 2026-10-27 hook run measured and did
not build: `--pin-now <iso>` on `shoot.mjs`, passed through to
`freezeInit`, so two shoots of the overlay dashboard can be compared
without 69% of the diff being a timestamp.

This file is written before the work so the pull request exists from the
first turns. Everything below it arrives as the run proceeds.

# exo run 2026-11-02 (message trigger, eightieth window)

**Trigger.** A `done` from Ursa's skill seat at 03:43:08Z, delivered cut
at 1,453 of 2,034 characters, and a `note` at 03:43:49Z carrying the
tail. Skill asked for nothing; it handed over three things unasked.

**Before answering, the duplicate-reply check.** The board says no
window of this seat had written to skill since 03:43:08Z. The previous
reply went out at 03:42:59Z — nine seconds before the `done` landed.

**What this run shipped.** One finding, graded rather than asserted, and
one stale assertion repaired.

- `tools/board/disposition.mjs` — the `none` arm of the disposition gate
  graded against the board's own traffic for the first time, over a
  complete nine-page walk of 4,216 rows. 154 of 1,016 verdicts move.
  The cell nothing predicted: **32** bodies where the gate told a sender
  their verdict had been dropped while it sat at offset 0, 67 or 155,
  because `lost_only` is keyed on the **absence** of a known phrase in
  the head and an incomplete word list manufactures absences.
- `tools/board/read-filters.test.mjs` — a test that asserted a **defect**
  (the events route's `company` filter being inert) and therefore went
  red when the defect was fixed upstream. Red on `main`, reported by no
  check. Repaired by asserting the fix with a positive control on both
  arms; the old assertion is kept in a comment.
- `docs/agents/runner-facts.md` §7 — the store's rule table now says it
  is a table of **refusals**, which is the real answer to skill's "fifth
  store rule". §74's five 500s all answer 200 now, re-measured with a
  positive control; its no-saturation-flag half is still true and left
  open.

**Registers.** `incidents.md` (the absence-selected-arm finding),
`improvements.md` (week of 2026-11-02), `learning-log.md`.

**Checked and left alone.** `tools/ledger/check.mjs` exits 2,
`OWNER_REMAINDER_ONLY`, on three status words only the owner can move —
a designed state, as skill described it. 722 tests pass repo-wide.

**Tier B by path.** No `prompts/`, no workflow, no secret.

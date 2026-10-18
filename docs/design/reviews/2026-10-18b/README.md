# Frontend review — 2026-10-18, second run (the engineer's note)

Opening the run. This run was triggered by a note from Ursa's engineer
seat on the board, naming the boundary between the publish path and the
viewer and handing one problem across it deliberately.

What I am picking up, in the engineer's own framing:

- The engineer owns the address and the contract. I own how a record
  looks.
- Every published site carries a machine-readable index at its root.
  A viewer that reads the index, picks a record, and fetches that
  record is wired with no change on the publish side.
- The two pages the publish path writes are a fallback, not a product,
  and I am invited to replace either or both.
- One of those pages is 2,552,798 bytes, because it inlines the whole
  record so the page needs no network. Self-contained and small are in
  tension, and the engineer left the resolution to this seat because it
  is a presentation decision.
- The one constraint attached: whatever replaces inlining must keep the
  integrity claim. If the page fetches a record, it must be able to say
  the record it got is the record it was published with.

Evidence for this run lands in this directory.

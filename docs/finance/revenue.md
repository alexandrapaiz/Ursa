# Revenue — Ursa

Living ledger. Maintained by the finance agent. Tracks subscribers,
MRR, ARR, and unit economics **once revenue exists**, from figures the
owner provides or a read-only subscribers channel exposes — this seat
never touches Stripe or any billing surface directly.

## Status at first close (2026-09-30): zero, by design on one side

Ursa Major (the consumer product) has **no revenue stream, permanently,
by design** — see `docs/vision.md` and `CLAUDE.md` §3. This is not a
gap to close; it is the model. Ursa Major's job is to exist and be
genuinely valuable so Ursa Minor has something to sell.

Ursa Minor (the labs product) is the only revenue-bearing side
(`CLAUDE.md` §4: annual data licensing contracts with AI labs,
commissioned signal collection as an add-on). At this stage:

- No customer contracts found in the repo, decisions log, or OKRs.
- No subscribers table or read-only revenue channel has been set up for
  this seat to read from (checked: no reference to a subscribers table,
  MRR, or ARR anywhere in `docs/` or the codebase).
- `docs/design/product-plan.md` describes Ursa Major's M0/trial state
  (n=1, n=2) and Ursa Minor's price-book *schema design* (survival_stats
  table, §12) — a data model for a future product, not a live
  commercial relationship. No lab has been billed; none is under
  contract as far as this seat can see.

**This seat will not report subscribers, MRR, or ARR as zero-with-a-table
until there is a real channel to read them from.** Fabricating a table
of zeros implies a measurement process that does not exist yet. The
honest statement is: revenue is zero because Ursa Minor has not sold
anything yet, not because a metric came back empty.

## What would change this

Per `CLAUDE.md` §4, Ursa Minor's realistic customer set is five to ten
frontier/tier-two labs. The first dollar of revenue here will come from
a signed data-licensing contract, which the owner would know about
before this seat could infer it from any public or repo surface. When
that happens:

1. The owner (or a read-only channel she sets up) supplies subscriber/
   contract counts and dollar terms.
2. This file starts carrying MRR, ARR, and per-contract unit economics.
3. `capital.md`'s ROIC and EVA sections stop being "not yet computable"
   and start being real.

## Open questions for the owner

1. Has any lab conversation moved past exploratory contact? If so, is
   there a stage (LOI, signed contract, pilot) this ledger should start
   tracking even before revenue lands?
2. When a subscribers/contracts channel exists, where should this seat
   read it from — a repo file, a read-only API, or figures the owner
   pastes into a merge comment or dispatch?

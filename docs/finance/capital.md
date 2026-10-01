# Capital — Ursa

Living ledger. Maintained by the finance agent. Owner priority, recorded
2026-09-18: everything must make sense in terms of the investment. This
file tracks invested capital, CapEx separately from OPEX, ROIC once
revenue exists, and the EVA framework as the operating lens throughout.

**Update, 2026-10-01:** nothing below has changed since the first close.
No new paid service, domain, or durable asset appeared in the repo;
none of the four open questions at the bottom has been answered yet.
This file is being re-read, not rewritten, this run.

## Invested-capital base

What has actually been put into Ursa, as far as this seat can see from
public and repo evidence:

| Item | Evidence | Amount |
|---|---|---|
| Repository / infra setup | `gh repo view`: repo `alexandrapaiz/Ursa` created 2026-08-01, public. | Not a cash cost — GitHub repos are free. |
| Paid third-party services specific to Ursa | Checked every line in `opex.md`: no Ursa-specific paid subscription found in the code or config beyond the shared Claude subscription and the OpenRouter prepaid balance (both already listed in `opex.md` as unmeasurable by this seat). | **None identified as Ursa-specific.** See open questions below — the Claude subscription and OpenRouter balance may belong here as capital-in-use rather than pure OPEX, depending on how the owner wants to treat a prepaid/subscription balance. |
| Domains | No domain purchase evidence found. | $0 so far. |
| The owner's time | Not observable by this seat at all — this is exactly the line the charter says to leave open rather than price. | **Left as its own line, unpriced, pending the owner's confirmed rate or her decision to leave it unpriced.** |

**Total invested capital, in dollars this seat can verify: effectively
$0 measured, with two real but currently unpriced components (the
Claude subscription share and the owner's time) and two real but
unreadable components (the OpenRouter balance, and whatever the
Claude subscription itself costs — see `opex.md`'s open questions).**

This is not the same as saying Ursa has cost nothing. It says: the
near-zero cash cost base the mission is built on (`CLAUDE.md` §0,
"Cost Structure" sections) checks out against everything this seat can
independently verify, and the remaining lines are priced by the owner,
not guessed by this seat.

## CapEx vs OPEX

The charter's distinction: CapEx is one-time investment in a durable
asset (the pipeline, the corpus, the skill library); OPEX is recurring
running cost (tracked in `opex.md`).

At this stage, Ursa's durable assets are code, not infrastructure:

- `ursa-major/` (the provenance resolver, CLI, tuning pipeline) and
  `ursa-minor/` (the labs-facing site) are durable work product, built
  by seat-runs on the existing Claude subscription — which this ledger
  cannot itself price into a CapEx dollar figure (same subscription
  question as in `opex.md`).
- No corpus or skill library exists yet as a standing asset with its
  own storage cost (`opex.md`: Neon is unprovisioned for Ursa's own
  schema; Vercel Blob is a dependency, not a live deployment).

**Conclusion: no CapEx dollar figure is bookable this month beyond the
labor that produced the code, and that labor's cost is exactly the
unpriced Claude-subscription/owner-time question above.** This ledger
will start carrying real CapEx numbers the month a durable paid asset
(a database plan, object storage bill, a domain) actually exists.

## ROIC and EVA — the framework, honestly stated as not yet computable

**ROIC** (NOPAT ÷ invested capital) needs NOPAT, and NOPAT needs
revenue. `revenue.md` records zero revenue this month — Ursa Minor has
not billed a lab yet. So:

```
ROIC = NOPAT / Invested Capital
     = (Revenue - Operating Costs) x (1 - tax rate) / Invested Capital
     = ($0 - OPEX) x (1 - tax rate) / Invested Capital
```

With revenue at $0, NOPAT is negative-or-zero by construction, and ROIC
is not a meaningful number to report yet — it would just restate "no
revenue" in a more complicated way. **What ROIC will be measured
against, stated plainly now so there's no ambiguity later:** the
invested-capital base this file tracks, once that base has real dollar
figures in it (the Claude subscription's priced share, the OpenRouter
balance, the owner's time if she chooses to price it, and any CapEx
that shows up). The denominator has to be honest before the ratio means
anything.

**EVA** (economic value added = NOPAT − capital charge, where capital
charge = invested capital × cost of capital) is the operating lens the
charter asks this seat to hold even before revenue exists. Two
components:

- **Capital charge** needs a stated cost-of-capital rate. None has been
  set by the owner yet. This is an open question below, not a rate this
  seat will assume (e.g. picking a generic startup discount rate would
  be exactly the kind of guessed-and-presented-as-fact figure the
  charter forbids).
- **NOPAT** needs revenue, which is $0.

So EVA is currently: **undefined on both sides**, and this month's
honest EVA statement is "a quarter counts as creating value only once
returns clear the capital's cost, and right now there are no returns to
test against a cost of capital that also doesn't exist yet." That is
the plain-paragraph verdict this ledger owes the owner every month
until both numbers exist — see `close-2026-09.md`.

## Funding scenarios — analysis only, never action

The charter is explicit that this seat proposes and never acts: raising,
taking, or negotiating money is the owner's alone. This section is
analysis for her to weigh, not a recommendation being executed.

**The case for staying self-funded, given the current cost base.**
`opex.md` shows a verified $0 in metered infrastructure cost this month
(public-repo Actions minutes, Vercel Hobby tier unused, no Neon schema
provisioned, no domains). The only real spend is the Claude subscription
(already sunk, portfolio-wide) and a small prepaid OpenRouter balance.
A near-zero cash burn means there is no runway pressure forcing a
capital decision — the business can keep building at the current pace
indefinitely on the current spend, which is the strongest argument for
not raising: there is no cost outside capital's ability to solve by
itself.

**When outside capital would actually compound the mission.** Not to
cover OPEX — OPEX doesn't need it. The scenario where capital helps is
if Ursa Minor lands its first lab conversations and needs to move faster
than organic, product-led growth on the Major side allows — e.g., paid
growth spend to reach the population scale labs are paying for
(`CLAUDE.md` §2, "five to ten total customers," needs a large enough
Major user base to be statistically meaningful), or a dedicated privacy/
legal engineering hire ahead of the first enterprise contract rather
than after it. Both are "spend ahead of a proven revenue line," which is
what outside capital is for and OPEX savings is not.

**Rough sizing, honestly caveated.** This seat has no basis to name a
dollar figure for "how much" without guessing — that would be exactly
the kind of fabricated number the charter forbids. What can be said
without guessing: any raise sized to fund one senior privacy/legal hire
plus a growth budget for the consumer side, for long enough to reach a
lab's first contract, would be small relative to typical seed rounds in
this space, because the cost structure (`CLAUDE.md` §2, "Cost
Structure") is deliberately light — on-device processing, sub-linear
scaling, no compute or infra to fund. The owner is the one who can put
an actual number on "enough runway to land the first lab contract,"
because that depends on sales-cycle length she's tracking, not on
anything visible to this seat.

**Dilution logic, stated as a tradeoff, not a recommendation.** Ursa
Major must stay free forever by design (`CLAUDE.md` §3) — that
constraint doesn't change with outside capital, so any investor has to
buy into a structure where the consumer product will never monetize
directly and equity value depends entirely on Minor's enterprise
contracts. That's a smaller, more specific investor pool (data-licensing/
enterprise-infra-literate) than a generic consumer-growth story would
attract, and it's worth the owner naming that constraint explicitly to
anyone she talks to before a term sheet, not after.

## Open questions for the owner

1. Should the Claude subscription's cost (or a stated per-seat-run
   internal rate) count as invested capital, recurring OPEX, or both
   split by use (building Ursa Major/Minor = CapEx-like; running the
   seats month to month = OPEX)?
2. Do you want your own time priced at a rate for this ledger, or left
   permanently as an unpriced line?
3. What cost-of-capital rate should the EVA capital charge use once
   there's a NOPAT to test it against?
4. Is there any capital (cash, credits, a paid tool subscription) that
   went into Ursa that would not show up in the repo or on a public
   surface — anything this seat should know about that it currently
   can't see?

# What "sales" means at Ursa

Written 2026-09-30, first sales run, on the owner's window dispatch.
This file exists because the charter I run on (`prompts/sales-agent.md`)
is alexandria's, and following it literally here would have produced a
run of drafts for things Ursa does not have.

## 1. The three things in the charter that do not transfer

The inherited charter is a **paid-newsletter growth charter**. Its
concrete nouns are a launch date, a free list, a $10/$30 subscription, a
weekly digest, referral mechanics, and "subscribers." Ursa has none of
them, and the market seat already hit the same wall from the other side
(`docs/market/positioning.md`, opening note, 2026-09-26: testing
alexandria's pricing here "would produce a meaningless comparison").
Specifically:

1. **There is no conversion event to campaign toward.** Ursa Major is
   free forever, by design, and monetizing the user is a load-bearing
   non-goal (`docs/vision.md` §3). So the consumer campaign's job is
   adoption and consent, never conversion, and any funnel language
   borrowed from the newsletter charter is measuring the wrong thing.
2. **There is no list.** The one public surface is the Ursa Minor page,
   and it has no email capture, no contact route, and a disabled CTA
   (see `handoffs.md` H-1). A launch email to a free list is not a draft
   I can write; it is a dependency I have to name.
3. **The revenue side is not a campaign at all.** Five to ten customers
   for the lifetime of the business (`CLAUDE.md` §4), six-to-twelve-month
   cycles, one or two accounts carrying most of revenue. That is not
   growth marketing wearing an enterprise hat. It is a named-account
   motion where the entire quarter's deliverable is *being ready for a
   conversation that has not started yet*.

What does transfer, and transfers completely: **you prepare, the owner
sends.** Nothing in this directory was sent, posted, or emailed. No
account was created. That law is hers to change, not mine, and the
enterprise motion makes it more important, not less — with a market of
five to ten buyers, a single badly aimed first contact is not a bad
week, it is a burnt account out of ten.

## 2. The two motions, named separately

They are different businesses and the charter should stop treating them
as one funnel.

**Motion A — the labs motion (Ursa Minor).** Named accounts, zero cold
contact this quarter by OKR mandate. Its assets are a brief, a target
list, an audit path, and a public methodology. Its channel, per
`CLAUDE.md` §4, is "publishing about methodology, data quality, and
privacy architecture rather than traditional marketing." Translated into
operations: **the methodology publication *is* the campaign.** O2 KR2.1
puts `docs/beyond-preference-pairs.md` at a public URL by November 30,
and that date, not any post I could draft, is this quarter's one real
launch event. Everything in `calendar.md` hangs off it.

**Motion B — the users motion (Ursa Major).** Product-led, no paid
acquisition, no growth hacks that spend trust. Its problem today is not
messaging. It is that there is nothing a stranger can install: no
published CLI, no consumer page, no install line (`handoffs.md` H-2).
So Motion B's deliverable this quarter is one campaign, drafted and
held, plus the specific gate that unblocks it — not a posting schedule
against a product nobody can get.

## 3. The coverage gap this run found, and the decision the owner owes

This is the part of the run that matters most, and it is not a campaign.

- At All-Hands 002 (2026-09-18) the owner charged O4 — the lab
  one-pager and the target list, zero cold outreach — to "market,
  sales, and finance."
- Six days later, ADR-005 (2026-09-24) activated every seat **except**
  sales, on the stated ground that "Ursa is private R&D and never for
  sale (ADR-001); a sales seat has nothing to sell."
- Both statements are the owner's and both stand. Their combination
  left **O4 KR4.1 and KR4.2 with no active seat.** The market charter
  never mentions the lab brief or the target list (grep for "lab brief"
  and "target list" in `prompts/market-agent.md`: nothing), and the org
  chart's own initiative-coverage list names seats for O1, O2 and the
  governance spine — and stops. O4 is absent from it.
- Both key results are due **2026-12-15**.

So the honest reading of this dispatch: it is not a sales campaign the
company suddenly needs, it is the owner closing an unowned OKR. This run
therefore delivers KR4.1 and KR4.2 in full, eleven weeks early, and the
rest of what a sales run produces is built around them rather than
instead of them.

Note also that ADR-005's reasoning and O4's existence are in real
tension, not just an ownership mixup. "A sales seat has nothing to sell"
is true of *today's* artifact and false of the quarter's plan: O4 exists
precisely because the owner expects to be ready to talk to labs. The
reconciliation that costs nothing and keeps ADR-001 intact is the one
this run assumes and asks her to ratify:

> **Proposed ADR (the owner's to take, reject, or rewrite).** The sales
> seat is activated for **preparation only**, scoped to O4 and to
> `docs/sales/`, with zero outward contact of any kind and no schedule —
> owner dispatch only. ADR-001's "never for sale" and ADR-005's
> reasoning are untouched: the seat does not sell, it makes the company
> ready to be asked. The seat's activation expires at quarter close
> unless renewed, and the two artifacts it owns (the brief, the list)
> are owner-approved deliverables, not published ones.

Logged in the ledger as an idea per `docs/standards/pm.md` §4, since
charters and ADRs are edited only by the owner's merge. If she rejects
it, the right consequence is that this directory stays as a one-time
dispatch output and O4's two key results get reassigned to market or
taken by her directly — but they should not stay unowned until December.

## 4. What this seat will and will not do, going forward

**Will:** maintain the claims ledger; keep the lab brief current as
gates in it are met; keep the target list researched from public
surfaces only; hold campaign drafts ready against named gates; record in
`results.md` whatever the owner actually sends and what came back;
escalate to `handoffs.md` when a sales blocker is really another seat's
one-line fix.

**Will not:** send, post, publish, DM, email, or contact anyone; create
accounts; touch pricing (the owner's, argued in market's positioning
doc); write anything outside `docs/sales/` plus ledger entries and board
cards in its lane; put digest or record content into a public draft
beyond what the site already shows; use false urgency, inflated claims,
or any growth tactic that spends the one asset that compounds daily and
can be destroyed in a week.

## 5. One correction to the inherited charter's tone, kept on purpose

The charter tells this seat to be bold, and names timidity under a
liberty grant as a failure mode. Boldness here means the ideas in
`campaigns/` — a consumer artifact that is also the enterprise sample
(`campaigns/the-receipt/`), and selling a measurement before there is a
corpus to sell (`campaigns/audit-commission/`). It does not mean loosening
the claims ledger. In a market of ten buyers, where the incumbent
(Scale AI) lost Google, OpenAI and Microsoft over a *perception* of
compromised neutrality (`docs/market/landscape.md`), the bold move and
the scrupulous claim are the same move. An overstatement in a first
brief is not an embarrassment, it is the whole company.

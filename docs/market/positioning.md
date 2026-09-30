# Positioning and pricing

Maintained by the market research agent (prompts/market-agent.md).
First entry, 2026-09-26, written alongside the initial
docs/market/landscape.md (sprint 2026-09-21 item 4, O2 KR2.3).

## A charter note before the pricing test

prompts/market-agent.md's positioning ceremony is written for
alexandria's business: "a $10 digest and $30 full-library
subscription." That pricing model is alexandria's, not Ursa's, and
testing it here would produce a meaningless comparison. Ursa's actual
revenue model, per CLAUDE.md §2/§4, is Ursa Minor selling annual data
licensing contracts to labs (six to seven figures depending on tier),
plus commissioned signal collection as a higher-margin add-on. Ursa
Major is free forever by design and is explicitly never priced. This
entry tests *that* model against what the landscape actually shows,
not the vendored $10/$30 language. Flagging this for whoever next
touches the charter, rather than silently reinterpreting it.

## Why pay for an Ursa Minor outcome record when cheaper preference
data already exists?

The honest short answer: you wouldn't, if all you needed was a
preference label. rlhfbook.com's synthetic-data chapter puts a single
piece of human preference data at "$1 or higher (or even above $10 per
prompt)" against under a penny for AI-generated feedback (GPT-4o-class
grading), and that gap is exactly why frontier labs already lean on
synthetic and AI-graded data for the commodity cases (docs/market/landscape.md,
sourced at [rlhfbook.com/c/12-synthetic-data](https://rlhfbook.com/c/12-synthetic-data)).
Ursa Minor is not competing on that axis and would lose if it tried.

The outcome record is priced, and should be pitched, against a
different thing entirely: an open-ended-domain reward signal that has
no verifier at all today (CLAUDE.md §1). Every vendor in
landscape.md's Category 1 (Surge, Scale/Outlier, Mercor, Prolific,
Invisible) sells solicited judgment — a rater paid to produce an
opinion on request. None of them sells "did the work this text fed
into actually survive contact with a real deliverable." That is the
product Ursa Minor is testing, and the honest positioning line is:
*complementary to your existing RLHF pipeline for the domains where a
rubric works, and the only signal at all for the domains where it
doesn't.*

## Price ladder observed this run (Category 1, preference-data vendors)

None of the five vendors in landscape.md's first category publish a
rate card; all are negotiated enterprise contracts. The only public
numbers found this run are on the *labor* side, not the buyer side:

- Surge AI: individual contributor pay ~30-40 cents/minute (no
  buyer-side price public). [Source](https://sacra.com/c/surge-ai/).
- Mercor: contractor pay ~$85/hr average, $200+/hr for senior
  specialists (no buyer-side price public). [Source](https://www.mercor.com/resources/experts/what-is-rlhf/).
- Human preference data generally, per prompt: ~$1-$10+ (buyer-side,
  the only per-unit figure found). [Source](https://rlhfbook.com/c/12-synthetic-data).

This means Ursa Minor has no clean per-unit comp to price against yet.
The nearest real comp for the *contract shape* (annual data-licensing
deal, not per-label) is the publisher/content-licensing market, not the
RLHF-vendor market: OpenAI's roughly two dozen publisher deals as of
July 2026 include a reported $250M/5-year deal with News Corp, and
Reddit disclosed $203M in aggregate licensing contract value in its IPO
filing. Those are a different asset (bulk content, not outcome
records) but they establish that labs already write large,
multi-year, named-counterparty contracts for training-relevant data —
the contract shape Ursa Minor is built for. [Source: PYMNTS on enterprise data licensing](https://www.pymnts.com/news/artificial-intelligence/2026/enterprise-saas-contracts-are-secret-ai-training-licenses/).

**Read against CLAUDE.md's six-to-seven-figure target:** nothing found
this run argues against that range. Nothing found this run validates a
specific number inside it either. This is a gap for next run's demand
signals ceremony: find a disclosed or leaked RLHF-vendor contract size
(not publisher-content) to anchor the range.

## Category 3 read: why would a user adopt Ursa Major when memory is
already built into ChatGPT for free?

This is the sharper positioning question, because Category 3's
strongest entry (OpenAI's native ChatGPT Memory) is free, has zero
integration friction, and has been steadily adding user-facing
edit/delete controls through 2026 (per-project in mid-2026, per-chat in
Android beta by August). The gap it cannot close by construction is
portability: that memory is OpenAI's, lives in OpenAI's product, and
cannot follow a user to Claude or Gemini. Mem0, Letta, and Zep have the
opposite problem — they are portable in principle (any developer can
embed them) but the memory still belongs to whichever app integrated
them, not to the end user, so a user still can't see or carry "their"
profile between two unrelated apps. Ursa Major's answer is the only one
of the four that is both user-owned and cross-vendor by design. The
honest risk, stated plainly for the owner: if OpenAI, Anthropic, or
Google ship a portable-memory *standard* jointly (unlikely, given
CLAUDE.md's own naming of model providers as a competitive threat, but
not impossible under regulatory pressure), that closes Ursa Major's gap
overnight. Nothing found this run suggests that's in motion.

## A bound on Minor's target, not a price (2026-09-30)

Last run flagged a gap: no disclosed per-unit or per-contract price
exists for anything resembling an outcome-record license, so nothing
anchors CLAUDE.md's six-to-seven-figure target inside its range. This
run didn't find that number either, but it found the market's size
instead, which bounds the question differently. Each major frontier
lab reportedly spends roughly $1 billion a year on human-generated
training data overall, and the category's fastest-growing named vendor
(Mercor) alone is now at $2B in annualized gross revenue, up from
$760M nine months earlier
([source](https://www.forbes.com/sites/richardnieva/2026/07/09/mercor-fundraise/)).
Against a $1B/year total spend per lab, a six-to-seven-figure deal is
a rounding error, not a stretch. That changes what the pricing test
should be: the open question is not "can a lab afford this," it's
"is the outcome record differentiated enough to earn a line item at
all" — a positioning question, not an affordability one. No pricing
recommendation follows from this; it just narrows where the owner's
attention should go if a number is ever tested.

## Portability over transparency (2026-09-30)

Category 3's read from the first entry named OpenAI's steadily
improving edit/delete controls as the risk to watch. This run found a
sharper version: OpenAI shipped "Memory Sources," giving users
per-response visibility into what fed their answer
([source](https://openai.com/index/memory-and-new-controls-for-chatgpt/)).
That is a transparency feature, and it means Ursa Major's "you can
always see what's been inferred" claim (CLAUDE.md's non-negotiable #2)
is no longer a clean differentiator against the single largest
consumer AI memory product. What OpenAI's feature still cannot do, by
construction, is follow the user to a different vendor's model. The
honest positioning update: Major's remaining edge against this
specific competitor is portability, not transparency, and public
messaging that leads with "portable across every model" tests better
against what ChatGPT actually ships today than messaging that leads
with "fully inspectable."

## Changelog

- 2026-09-26 — initial entry, written against Ursa's actual pricing
  model rather than the charter's vendored alexandria language (flagged
  above). No pricing recommendation made; the owner has no comp
  precise enough yet to act on.
- 2026-09-30 — added a total-addressable-spend bound for Minor's
  target (still no per-contract anchor) and narrowed Major's Category 3
  differentiation claim from transparency to portability, following
  OpenAI's Memory Sources launch. No pricing recommendation made.

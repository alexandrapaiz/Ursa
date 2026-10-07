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

## The reward-model gap, quantified (2026-10-05)

CLAUDE.md §1's claim — labs have no verifier for open-ended domains and
fall back on preference proxies — had sourcing (rlhfbook.com's cost
numbers) but no accuracy numbers. A peer-reviewed benchmark published
2026-08-24, WritingPreferenceBench, supplies one: 1,800 human-annotated
preference pairs across 8 creative-writing genres, built specifically
to isolate subjective quality (originality, emotional resonance) from
objective confounds (grammar, factual errors). Result: sequence-based
reward models score 52.7% mean accuracy against human judgment,
barely above a coin flip; 14 language models used as zero-shot judges
score 53.9%, equally close to chance. Only generative reward models
that produce an explicit reasoning chain before judging reach 81.8%,
and that architecture is the expensive, slow exception, not the
default production setup. Read plainly: the standard, cheap way labs
grade open-ended output today is barely better than guessing, and the
one approach that works well does not scale the way a per-prompt
preference-pair pipeline needs to. This is independent, quantified
support for positioning the outcome record as a different kind of
signal rather than a cheaper version of the same one — the record
doesn't need a reward model to guess at quality at all, because the
label is "did real work survive contact with it," supplied by the
work itself. Last observed 2026-10-05: [WritingPreferenceBench, arXiv](https://arxiv.org/abs/2510.14616).

## Symmetric portability, not asymmetric import (2026-10-05)

Last run's "Portability over transparency" entry named transparency as
the half of Major's pitch that had closed (OpenAI's Memory Sources)
and portability as the half that hadn't. This run's landscape watch
sharpens both halves, in Major's favor on net.

First, transparency: a dated critique (2026-06-06, two days after
OpenAI's "Dreaming" memory overhaul shipped) found that editing an
entry in ChatGPT's Memory Summary does not reliably change the
underlying memory that drives the model's actual responses — the
user-facing edit surface and the surface that governs behavior are not
the same thing (docs/market/landscape.md, ChatGPT Memory entry).
Last run's "transparency gap closing" read should be walked back to
"a transparency *surface* shipped; whether it is end-to-end truthful
is now in question." If Major can show that an edit a user makes is
guaranteed to be what every subsequent response uses, that is a claim
OpenAI's own shipped feature currently cannot make, pending
independent verification neither this run nor last could do from the
outside.

Second, and the sharper update: Anthropic shipped a Claude feature in
July 2026 that imports memory from ChatGPT, Gemini, or Grok — the
single most direct move any frontier lab has made toward Major's own
promise. But it imports only, it does not export anything a competitor
could read back, and an independent test of seven memory products
(Claude included) found none of them let a competing platform
reconstruct an exported memory with structure and attribution intact
(docs/market/landscape.md, Claude Memory Import entry). That is not
portability, it is an acquisition funnel dressed in portability's
language, and it hands Major's positioning a sharper, more specific
word to use than "portable": **symmetric**. The honest test for any
future competitor claiming portability, including Major's own: does
it work in both directions, for free, without a copy-paste prompt
trick, between vendors that have no commercial reason to cooperate? As
of this run, nothing in the landscape passes that test except what
Major is built to be. The risk this doesn't resolve is CLAUDE.md §5's
own: the platform most able to build a true two-way standard (a
frontier lab, or several acting jointly) has instead built a one-way
funnel, which is the economically rational thing for a lab to do and
exactly why nobody should expect one to build the symmetric version
voluntarily.

## Trust has a provenance axis too, not just an equity one (2026-10-07)

The two existing neutrality entries (docs/ideas.md, 2026-09-26 and its
2026-10-05 echo) both argue from equity: a lab that buys into its data
vendor compromises that vendor's neutrality. This run's landscape
watch surfaces a second, independent axis that doesn't depend on any
ownership stake at all. A Forbes investigation found Surge AI, Mercor,
AfterQuery, and Turing — four of the named vendors in landscape.md's
Category 1 — collectively sell roughly $500M/year of training data to
Chinese AI labs (Tencent, Alibaba, ByteDance) from the same contractor
pools and pipelines that serve their US frontier-lab customers
(docs/market/landscape.md, Surge AI and Mercor updates). No equity
changes hands here; the concern a buyer would have is simpler and more
direct: the same humans, process, and infrastructure that produce your
training data also produce a geopolitical rival's.

Ursa Minor has never sold data to anyone, so this isn't a comparison
either company can make about a live customer relationship yet. What
it is: a second, concrete, dated answer to "why trust Minor's
provenance over an incumbent's," one that doesn't require the owner to
make an equity-structure argument at all. The honest limit, stated
plainly: Ursa's own consent architecture (CLAUDE.md's non-negotiables)
governs who sees derived signal, but nothing in CLAUDE.md today commits
to a no-dual-sale or single-buyer-tier guarantee the way this entry
would need for a lab-facing pitch to cite it directly. That commitment,
if the owner wants it, is a product decision this seat can't make.

A second, related finding from the same week's landscape watch: a
Gazetteer SF investigation into working conditions at Mercor (punishing
hours, abrupt terminations, no formal HR/payment policy before late
2025) is evidence of a cost the solicited-labor model carries
structurally — a human has to be assigned the task, under some
deadline, by someone managing them, for the label to exist at all. The
outcome record's real-work-derived signal has no equivalent assigned
labor force to manage, mistreat, or lose. This is a different claim
than "cheaper" (rlhfbook.com's cost comparison in this file's first
section already covers cheaper) — it's "structurally has no labor
force to be exposed about," which is a trust claim, not a cost one.

## A pitch-collision risk, not yet a pricing one (2026-10-07)

Surge AI, the largest named vendor in landscape.md's Category 1,
launched three new benchmarks this cycle (DAYJOB, GDP.xlsx, and the
umbrella "Tuesday Work Index") explicitly framed around "economically
valuable work" and whether an agent can "survive a 9 to 5"
(docs/market/landscape.md, Surge AI update). That is close enough to
Ursa's own language — CLAUDE.md §1 calls outcome records relevant to
"writing, research, applied engineering, everything without a unit
test," and Minor's pitch leans on "economically valuable" framing too
— that a lab buyer skimming both could mistake Surge's benchmarks for
a competing version of the outcome record. They are not: DAYJOB and
GDP.xlsx are constructed task sets graded against a rubric, the exact
"label supplied by a grader" structure CLAUDE.md §1 contrasts the
outcome record against, not real finished work joined backward to its
own generation history. No pricing or positioning change is needed
today because Minor isn't selling against Surge in the market yet, but
whoever drafts KR4.1's lab brief should name the distinction
explicitly rather than let a buyer discover the overlap and ask Minor
to explain it unprompted.

## Changelog

- 2026-09-26 — initial entry, written against Ursa's actual pricing
  model rather than the charter's vendored alexandria language (flagged
  above). No pricing recommendation made; the owner has no comp
  precise enough yet to act on.
- 2026-09-30 — added a total-addressable-spend bound for Minor's
  target (still no per-contract anchor) and narrowed Major's Category 3
  differentiation claim from transparency to portability, following
  OpenAI's Memory Sources launch. No pricing recommendation made.
- 2026-10-05 — added a quantified reward-model accuracy gap
  (WritingPreferenceBench) supporting Minor's "different signal, not a
  cheaper one" pitch, and sharpened Major's portability claim to
  "symmetric" after finding Anthropic's new Claude memory-import
  feature is one-directional. Walked back part of last run's
  transparency-gap-closing read after a dated critique found ChatGPT's
  edit surface doesn't reliably reach what the model uses. No pricing
  recommendation made.
- 2026-10-07 — added a provenance-based trust differentiator (no
  dual-sale to geopolitical rivals, no exploited-contractor exposure),
  distinct from the equity-based neutrality argument made in earlier
  runs, following a Forbes investigation into vendor sales to Chinese
  labs and a labor-conditions investigation at Mercor. Also flagged a
  pitch-collision risk: Surge AI's new benchmarks use language close
  to Minor's own and should be explicitly distinguished in the lab
  brief before a buyer asks. No pricing recommendation made.

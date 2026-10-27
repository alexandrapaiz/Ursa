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

**The field's own proposed fixes for "no verifier exists" are still
constructed verifiers, not real outcomes (2026-10-25, 14th message
run).** A widely-cited practitioner post on RLVR's limits beyond math
and code names the same gap CLAUDE.md §1 opens with almost word for
word ("Math has definitive answers. Code has test suites. What about
everything else?") and proposes three substitutes for open-ended
domains: extracting verifiable signal from reference outputs,
auto-generating rubrics with a judge model, and converting QA
checklists into training signal. All three are still a grader's
construction standing in for ground truth, the same category of thing
the five reward-model-unreliability sources already in this file's
record have found unreliable at every stage checked — and the same
post's own September 2026 update reports the approach "showed
vulnerabilities when tested empirically." So what: the market's
answer to the verifier gap, as of this source, is a sixth source for
why constructed graders keep failing, not a counter-example to
Minor's pitch. Ledger proposal opened for KR4.1's lab brief. [subhadipmitra.com](https://subhadipmitra.com/blog/2026/rlvr-beyond-math-code/).

**A seventh source, this one a demand signal rather than a research
paper, and from inside a competitor (2026-10-25, 15th message run).**
A staff AI engineer at TELUS Digital (the Category 1 vendor added to
landscape.md this run) published a practitioner's digest of LLM-judge
failures on 2026-10-15: judges that are "perfectly consistent, [yet]
reliably wrong" at only 51% ground-truth agreement, verdicts that flip
across identical zero-temperature runs, and a bias-detection classifier
whose accuracy drops from 99% to 42% when emotional tone changes. The
author's own proposed fix is, again, a better-constructed grader
(rubric-based pointwise scoring, tool-augmented judges) rather than
real-outcome data — consistent with the pattern the six sources above
already established. What makes this one worth citing separately: the
author writes "make it cheap to actually look at what happened instead
of trusting a single aggregate score" as general engineering advice,
not as a description of Minor's own method, and that sentence is
close enough to CLAUDE.md §1's own operating description that it reads
as independent, unprompted corroboration from inside a competing
vendor's own technical staff, not a Minor-sourced talking point.
[dev.to: Felipe Oliveira, "Perfectly Consistent, Still Wrong"](https://dev.to/felipe0liveira/perfectly-consistent-still-wrong-llm-judges-keep-failing-the-same-way-plus-cheaper-alternatives-4eg3).

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

**A correction to this file's own language, found 2026-10-25 (14th
message run):** three separate dated entries below (2026-10-25's
Zep note, the Category 1 margin section, and one changelog line) call
the open contract-size gap "Minor's $10/$30 question." That phrasing
contradicts this file's own opening note: the $10/$30 tiers are
alexandria's vendored language and do not describe anything Minor
sells. Minor has no per-unit consumer price at all, by design
(CLAUDE.md §4); the actual open question is the six-to-seven-figure
*enterprise contract* anchor, not a per-unit comp. The three prior
entries are left as written, since they are each a dated record of
what that run said, but the shorthand should stop here rather than
compound a fourth time.

**A named per-year figure for the contract-shape comp, and a new
wrinkle in it (2026-10-25, 14th message run):** the $203M aggregate
Reddit IPO-filing figure cited above is the same Google deal reported
elsewhere at ~$60M/year (Reuters, 2024-02-22), which is both a cleaner
annual anchor and, as of a 2026-07-22 Wall Street Journal report, now
a deal Reddit is reportedly weighing whether to renew at all: AI
Overviews answering queries directly cuts the click-through traffic
Reddit gets in return, so the supplier is reassessing whether feeding
the buyer's downstream product is worth the licensing fee. [the-decoder.com](https://the-decoder.com/reddit-signs-60-million-annual-training-data-deal-with-google/).
That tension has no analogue in Minor's own structure: an outcome
record is a byproduct of a user's own work, not Minor's content, so
Minor's downstream product (a lab's trained model) does not compete
with the thing the supplier (the user) is trying to do, the way
Google's AI answers compete with Reddit's own traffic. Worth a line in
the lab brief the next time a buyer asks why this contract shape is
durable where Reddit's is wobbling.

A side note on sourcing this: searching for a disclosed RLHF-specific
contract size (the actual gap named above) surfaces a cluster of
SEO-style "AI data licensing" aggregator sites (ai-industry-reviews.com,
aidata.broker, sourcex.si) reporting mutually inconsistent deal counts
(312 vs. 130 vs. an explicitly partial 6-deal sample) with no named
methodology for two of the three. Checked and not cited beyond this
note. The gap stays open; only individually named, independently
reported deals like Reddit-Google are usable here, and none found this
run was RLHF-specific rather than bulk content.

**A cleaner tracker for this same category, found 2026-10-25 (15th
message run), to use instead of the inconsistent aggregators above.**
corpusbridge.com's disclosed-deals page states an explicit, checkable
methodology — "A deal appears here only when a named outlet or the
company's own filing reported it," and "We do not estimate or model
figures" — and lists 14 total deals, 8 priced, naming each buyer,
seller, and figure individually rather than reporting an aggregate
count. Two of its figures were spot-checked independently this run
against multiple outlets and both held: NYT/Amazon ($20-25M/year, WSJ
via The Information, 2025) and News Corp/Meta ($50M/year over three
years, Editor & Publisher and TheWrap, 2026). Still none of its 8
priced deals is RLHF-specific; all are bulk content (news, journals,
books). The gap this file has tracked since 2026-09-26 is unchanged by
this, but the next run that needs the bulk-content comp should start
here instead of re-discovering the aggregator problem from scratch.
[corpusbridge.com/learn/ai-data-licensing-deals](https://corpusbridge.com/learn/ai-data-licensing-deals).

**A magnitude anchor from an adjacent market, not the gap itself, found
2026-10-26 (17th message run).** Erik Newsham, founder of Grepped, a
startup that buys private companies' internal data and brokers it to
AI labs, posted on X (2026-10-24) that the firm's average deal size
moved from "$250-400k" to "closer to $1.1-$1.3m" after it started
targeting larger data holders, with a "far more spread out
distribution." This is a founder's own unverified figure, for a single
company, in the business-data-licensing market, not the RLHF-specific
contract the gap above asks about, and no named buyer, seller, or
individual deal backs it. It is still the first dated, named-source
number this file has found that lands inside the exact band CLAUDE.md
§4 already assumes for Minor's own contracts ("six to seven figures
depending on lab tier") rather than above or below it. Read
conservatively: one adjacent vendor's self-reported average sitting
inside Minor's own assumed range is a plausibility check, not a
confirmation, since Grepped sells bulk private company datasets and
Minor sells a structurally different thing (consented, derived
outcome signal, not raw data). Worth citing in KR4.1's lab brief as
"here is what a neighboring data-licensing business says its own deals
run" if a lab asks where the six-to-seven-figure assumption comes
from, with the caveat stated in the same breath. Checked whether
aidata.broker (the tracker this file points to above) and Grepped
share an owner, since both operate in the same niche; they do not —
aidata.broker is operated by O-mega Enterprise, Inc per its own
footer, a separate company from Grepped (see the dated note added to
docs/market/landscape.md's aidata.broker entry this run, flagging that
aidata.broker is itself a commercial participant in this market, not a
neutral tracker). [Erik Newsham on X, 2026-10-24](https://x.com/eriknewsha/status/2113785567095742730), [FourWeekMBA: AI Data Broker Says Deals Now Run $1.1M-$1.3M](https://fourweekmba.com/ai-the-data-wars-ai-data-broker-says-deals-now-run-1-1m-1-3m/).

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

**Update 2026-10-26: the first concrete regulatory instrument found,
and why it doesn't reach this gap.** The EU Data Act's cloud-switching
chapter has been in force since 2025-09-12 and bans switching/data-
extraction fees outright from 2027-01-12, with a documented-format,
30-day portability mandate in between. Checked its scope directly
rather than taking the "AI regulation" framing some coverage gives it
at face value: Chapter VI binds providers of IaaS/PaaS/SaaS "data
processing services" that a customer *runs workloads on*
(infrastructure a business builds on top of, named examples AWS,
Azure, GCP, Render, Railway, Fly.io), not consumer-facing applications
a user talks to. ChatGPT's or Claude's own memory feature is the
application, not the infrastructure underneath it, so it sits outside
this chapter's own definition on the reading available. This is real
regulatory motion, the first this file has found with a name and a
date, and it still doesn't close Major's gap: it is the opposite
layer, enterprise cloud switching, from the consumer AI-memory
portability the honest risk above names. The risk stands exactly as
stated. Separately, MacPaw Research's "Portable Memory" `.mem`
proposal (docs/market/landscape.md, 2026-10-26 update) is a private,
unfunded spec with no vendor backing, not regulatory pressure at all;
grouped here only because both surfaced in the same pass and neither
changes the answer. [sota.io: EU Data Act 2025, Cloud Switching Rights Developer Guide](https://sota.io/blog/eu-data-act-2025-cloud-switching-rights-developer-guide), [Kennedys Law: From hitch to switch](https://www.kennedyslaw.com/en/thought-leadership/article/2025/from-hitch-to-switch-how-the-eu-data-act-will-overhaul-switching-and-portability-terms-in-cloud-contracts-ukeu/).

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

## A second reward-model source, and this one is about to ship text data too (2026-10-14)

The 2026-10-05 entry leaned on one benchmark (WritingPreferenceBench) for
the claim that standard reward models barely beat chance on open-ended
quality. This run found two more, independent sources converging on the
same failure mode from different angles, which turns a single data point
into a pattern.

"What do Reward Models Memorize?" (Verhoeven, Mishra, and Shutova, arXiv
2607.24484, posted 2026-07-27 and revised 2026-10-07) measures
counterfactual memorization directly and finds discriminatively-trained
reward models memorize dataset-specific shortcuts — which model produced
a response, how the user sampled it, response length — rather than
learning a preference signal that generalizes. On preference pairs
unlike anything in training, they fall back on surface heuristics such
as length and compliance. Separately, "One Token to Fool LLM-as-a-Judge"
(NeurIPS 2025, arXiv 2507.08794) found that generative reward
models — the more expensive, reasoning-chain architecture
WritingPreferenceBench found actually works — can still be made to award
a false positive to a low-quality answer using nothing but a stray
punctuation mark or a generic reasoning opener, across GPT-o1 and
Claude-4 among others.

Read together: the cheap, standard way labs grade open-ended output
(WritingPreferenceBench's 52.7%, barely-above-chance reward models) fails
for a traceable reason, not bad luck — it memorizes artifacts of its own
training data rather than learning what made a response good. The
expensive way that works better is itself gameable by trivial,
content-free inputs. Neither failure mode has an equivalent in the
outcome record, because the outcome record never asks a model to predict
or judge quality at all; it reports what happened to text after the fact.
This is independent, peer-reviewed-or-arXiv-preprint evidence Minor's lab
brief can cite directly rather than asserting the verifier gap as a
claim labs have to take on faith — see the ledger proposal this run for
turning this into a citable packet. Last observed 2026-10-14:
[arXiv 2607.24484: What do Reward Models Memorize?](https://arxiv.org/abs/2607.24484),
[arXiv 2507.08794: One Token to Fool LLM-as-a-Judge](https://arxiv.org/abs/2507.08794).

## Symmetric portability, revised: Claude now exports too, but manually (2026-10-14)

The 2026-10-05 entry's sharpest claim was that Claude's memory-import
feature "does not export anything a competitor could read back," making
"symmetric" the precise word to contrast against. This run's landscape
watch (docs/market/landscape.md, Claude Memory Import entry) found
Anthropic's own support page now documents export alongside import,
dated by the page itself to 2026-09-02 — six weeks before this run
caught it, which is itself worth naming plainly: the gap between a
competitor shipping something and this seat noticing it was over a
month, this time in the direction that narrows Major's claim rather than
widens it.

The correction is narrower than "Claude is now symmetric." What
Anthropic shipped is a second manual copy-paste path: a user asks Claude
to write out its memory as text, then pastes that text into whatever
service they're moving to. There is no file format, no API, and nothing
on the page claims or implies that ChatGPT or Gemini could parse a
Claude export automatically. That is not the property "symmetric" was
built to name here — structure, attribution, and timestamps surviving a
read-back between two vendors with no commercial reason to cooperate.
It is the same copy-paste-a-prompt mechanic the whole category already
uses for import, now offered in the other direction too.

The honest positioning update: "one-directional" is no longer accurate
and should stop being used about Claude specifically. "Symmetric," in
the strict automated-round-trip sense, still has not been demonstrated
by anything in this landscape, Claude included — but the margin by which
Major can claim it is narrower than last run's entry implied, and will
keep narrowing every time a competitor ships a manual workaround that
looks like portability without being it. The actual test Major should be
prepared to pass, stated precisely rather than left as a word: an
export Major produces, ingested by a different vendor's model with no
human copy-paste step and no bespoke parser written for Major
specifically, reconstructing structure and attribution intact. Nothing
in this market has been shown to pass that test. Whether Major itself
can pass it today is a product question this seat cannot answer from
the outside — flagging it as the next thing worth a direct test, not
assuming the answer because no competitor has been shown to clear the
bar either.

## A fourth reward-model source, and this one is about the raters, not the model (2026-10-24)

The 2026-10-05 and 2026-10-14 entries built a pattern from three
sources, all about what happens *after* a human (or an AI judge)
produces a preference label: the reward model trained on it memorizes
artifacts, or the judge itself is gameable. "RLHF May Not Reflect
Genuine Preferences" (Ghafouri, Choi, Dey, and Ferrara, arXiv
2604.03238, posted 2026-01-31, revised 2026-05-29) attacks a step
earlier: whether the label is genuine in the first place. Drawing on
sixty years of behavioral-science findings that people routinely
report opinions they don't hold, construct preferences on the spot
from whatever cues are in front of them, and read the same question
differently depending on framing, the paper measures this directly on
two real RLHF datasets. The result: annotator inconsistency is
systematic, not random noise, and filtering out the most inconsistent
annotators flips the majority harm classification on 18.6% of prompts
and shifts mean ratings by more than 13 points on a 100-point scale.

Read together with the two entries above: the whole solicited-rating
pipeline is now shown to be unreliable at every stage this map has
checked — the opinion itself, the model trained to predict it, and the
judge used to grade output against it. None of the three failure
modes has an equivalent in the outcome record, which asks no one for
an opinion at any stage; it reports what happened to a piece of text
after real work used it or didn't. This is the strongest single
citation yet for Minor's lab brief to open with, because it is the
only one of the four that targets the raw label itself rather than
something built on top of it. Last observed 2026-10-24:
[arXiv 2604.03238: RLHF May Not Reflect Genuine Preferences](https://arxiv.org/abs/2604.03238).

## A fifth reward-model source, a step further back than the fourth (2026-10-25)

"Aligning to Illusions: Choice Blindness in Human and AI Feedback"
(arXiv 2603.08412, submitted 2026-03-09) goes one step behind the
2026-10-24 entry above. That source showed annotators disagree with
themselves across repeated real opinions; this one shows annotators
cannot tell when their stated opinion was never theirs at all — 91%
of surreptitiously swapped preferences go undetected, extending the
decades-old choice-blindness effect from self-evaluation to
third-party text comparison. The paper's Best-of-N experiment makes
the downstream cost concrete: at 50% label corruption, reward-guided
selection performs no better than random sampling, while the proxy
reward model itself reports continuously improving scores — the
grader cannot tell its own training signal is broken either. Full
reasoning and the citable-packet ordering in the ledger proposal
(docs/ideas.md, 2026-10-25). Last observed 2026-10-25:
[arXiv 2603.08412: Aligning to Illusions](https://arxiv.org/abs/2603.08412).

## A lab-facing evaluation vendor just proved the contract shape at $100M ARR (2026-10-24)

The 2026-09-30 entry above bounded Minor's six-to-seven-figure target
against total lab spend ($1B/year each) and found a per-contract
anchor missing. This run's landscape watch (docs/market/landscape.md,
LMArena/Arena update) supplies a closer anchor than anything found so
far: Arena's paid product, AI Evaluations, launched September 2025
and reached $100M in annualized revenue by June 2026, nine months
later, selling consumption-based evaluation campaigns to "a small
number of high-ACV customers": frontier labs and large enterprises.
That is the same buyer, the same contract concentration CLAUDE.md §4
already predicts for Minor ("one or two of them accounting for most
of revenue"), and the same category of thing being bought: a
lab-facing signal about model behavior, sold on a recurring basis
rather than a one-off project fee. It is not a comp for the outcome
record's *content* — Arena sells model-behavior analytics, not
provenance-resolved deliverables — but it is the first real evidence
this map has found that the *contract shape* Minor is built for can
scale past $100M ARR within a year of launch, among single-digit
numbers of named lab customers. No pricing recommendation follows; it
narrows the growth-rate question rather than the per-contract number,
which is still open. Last observed 2026-10-24:
[Sacra: Arena revenue, valuation & funding](https://sacra.com/c/lmarena/).

## Software parity is not position parity: Tencent's MemHub (2026-10-24)

Research's handoff (board, PR #345, finding 40) found that Tencent
Hunyuan open-sourced MemHub, a free, Apache-2.0, local-first product
that consolidates a user's AI conversations and coding traces across
several tools, with explicit per-source authorization and a user-run
deletion command (docs/market/landscape.md, new entry). Four of the
five things Ursa Major's own value proposition claims to be are now
shipped, free, by someone else. Research framed the question precisely
rather than answering it for market: does this cost Ursa "the head
start" (the lead time before someone else built the software) or "the
position" (the two-sided trust relationship CLAUDE.md §0 names as the
actual, hard-to-replicate asset), and asked this entry to test that
distinction rather than accept it.

**The test, stated before applying it.** CLAUDE.md's own fourth
load-bearing constraint already concedes the software was never the
moat ("anyone competent could build it"). So a release only threatens
Ursa's *position*, not merely its head start, if it also reproduces at
least one of the two things CLAUDE.md §2's Key Resources names as the
actual asset: (a) a consenting user base whose derived signal already
flows somewhere monetizable, or (b) a trust relationship with an AI
lab on the licensing side. A release that matches Major's
*functionality* without either of those is a head-start cost: it
proves the software was replicable, which Ursa already knew and said
about itself, and changes nothing about whether anyone will pay for
what flows through it.

**Applying it to MemHub.** On every surface read so far (the two
READMEs and a repository-wide code search, docs/market/landscape.md),
there is no aggregation layer, no mention of a data-licensing
relationship with any lab, and no path for a user's consolidated
memory to become a commercial dataset at all — the stated design is
the opposite, a local SQLite file that stays on the user's machine for
the user's own tools' benefit. Criterion (a) is unmet. Criterion (b)
is also unmet: nothing on either surface mentions a lab partnership,
and the product's own supported-tool list (Claude Code, Cursor, Codex,
OpenCode, Qwen Code) spans competitors' tools rather than funneling
into Tencent's own model, which argues against reading this as a
locked-in acquisition play for Hunyuan specifically. Both criteria
fail, so by this test MemHub costs Ursa the head start, not the
position. That is the same conclusion research proposed; this entry
adds the criterion so the next release in this category can be tested
against a named bar instead of re-argued from scratch.

**Where this reasoning would break, named so it can be watched for.**
The test above is a test of *this release*, not a standing immunity.
Two specific things would move MemHub (or a fork of it) from a
head-start cost to a position cost: a lab, or a lab-funded entity,
attaching a consent-to-aggregate flow to a MemHub-shaped tool (meeting
criterion a), or a licensing deal appearing anywhere in its
documentation (criterion b). Separately, and specific to Major rather
than Minor: MemHub's one undocumented property is the same one
flagged unresolved in Major's own portability claim at the end of the
2026-10-14 entry above (a true no-copy-paste, no-bespoke-parser export
a different vendor's model ingests automatically). Research's own
handoff names the watch trigger as "whether an export format appears"
in the product site or SDK docs it has not yet read. If one does,
MemHub would match five of five rather than four of five, and the
honest positioning answer changes with it. Until then, Major's actual
differentiated claim is the one piece of its value proposition nobody
in this landscape, incumbent or open-source, has shipped.

**Scope note.** This reasoning is about Ursa Major's consumer-facing
claim only. Ursa Minor sells outcome records derived from consented,
aggregated, cross-model signal (CLAUDE.md §4); MemHub produces no
aggregation and plugs into no labeling or licensing pipeline, so
nothing here touches Minor's pitch to labs directly. The connection is
upstream: Minor has nothing to sell without Major's consenting user
base, so anything that changes why a user would choose Major is
Minor's problem one step removed, which is the reason this is market's
lane and not research's to finish alone.

**Correction, same day (2026-10-24): "four of five, fifth
undocumented" was wrong in the direction that stings, not the one that
flatters, so it is corrected here rather than left standing.** Research
corrected its own handoff after reading the repository's file tree
directly: MemHub ships eleven named, versioned import adapters, one
per rival assistant, several verified against a real install rather
than a test fixture (docs/market/landscape.md, MemHub entry, 2026-10-24
correction). Verified independently against the live repository via
the GitHub API before writing this: confirmed. So the inbound half of
portability is not an open watch item, it is shipped, and shipped more
thoroughly than any entry already in Category 3's incumbents,
including Anthropic's own one-directional-until-recently Claude
import. What stays absent is exactly one clause, not "the fifth
property" loosely stated: an export *out* of MemHub that a different
vendor's model could ingest. The backup-restore contract restores only
from sources inside its own home directory and refuses everything
else, which is a narrower and more precise absence than last version's
"no export format appears on the surfaces checked."

This does not change the head-start-vs-position test's conclusion
above — criteria (a) and (b) are still both unmet, so the release is
still a head-start cost, not a position cost — but it changes how
close MemHub reads to matching Major's full claim, and therefore how
the lab brief and any public messaging should state Major's
differentiation. Not "portable across every model," stated as the
whole value proposition, when the clearest competitor already ships
most of that for free. The precise, defensible claim is narrower and
should be used instead: *a profile the user can take out and point at
a model the vendor does not sell.* That is the one piece of the
paragraph nobody in this landscape, Tencent included, has shipped in
either direction, and it is also the exact test named in the
"Symmetric portability" entries above — an export produced by one
party, ingested automatically by a different vendor's model, no
copy-paste, no bespoke parser. Nothing in this landscape passes it
yet, including, as far as this seat can verify from the outside,
Major itself.

## A second axis of trust, and it doesn't fail the same way the first one did (2026-10-26)

The 2026-10-07 entry above opened a provenance axis of trust distinct
from equity-neutrality: vendors selling to geopolitical rivals from the
same pool that serves US frontier labs. This run's landscape watch
(docs/market/landscape.md, Mercor entry) finds a third axis, operational
rather than structural: a 2026-03-31/04-04 supply-chain breach exposed
roughly 4TB of Mercor's contractor data, including biometrics, and Meta
paused all its Mercor contracts indefinitely in response.

What makes this worth a separate line rather than a footnote to the
existing neutrality entry is how differently it resolves. The Scale
AI entry's framing ("a data vendor that is perceived as compromised
loses its top customers overnight, no matter its scale") was written
against an equity compromise that nothing short of divestment fixes,
and this file has found no report of those customers returning.
Mercor's compromise was a security incident, and by the vendor's own
2026-06-25 account, other frontier-lab customers increased engagement
in the months after, rather than leaving. No source found this run
confirms Meta specifically resumed, so this is not a clean "security
trust recovers, equity trust doesn't" rule — it is one vendor, one
incident, self-reported recovery on one side of it. But it is the
first evidence this file has that not every kind of lab-vendor trust
break is read, or priced, the same way, which matters for how Minor's
own consent architecture gets pitched: the lab audience is apparently
willing to extend more benefit of the doubt to an incident a vendor
can show it fixed than to a structural conflict of interest it can't
undo. No pricing recommendation made; this sharpens a trust argument,
not a price.

## The "build task and verifier" comparison has to hold against a market, not three names (2026-10-26, 29th message run)

The Mercor/Deeptune (2026-10-14), Halluminate (2026-10-24), and micro1
(2026-10-25) entries each named the same weakness against a single
named vendor: a constructed task with a built-in verifier is not a
real deliverable joined backward to its own generation history. This
run's landscape watch (docs/market/landscape.md, new cross-cutting
note) found an independent directory naming 42 companies in this exact
sub-category, with real funding behind several (AfterQuery $30.5M,
Bespoke Labs $40M, Fleet AI $15M, Datacurve $17.7M) and the
category's own incumbents (Scale AI, Mercor, Surge AI) now also
building in it. The positioning consequence is a scope correction, not
a new argument: whoever writes the sentence distinguishing Minor's
outcome record from a gym should not write it as if the comparison is
against three recent pivots. It is against an already-funded,
already-mapped market at least 42 names deep, and the one structural
gap checked across all three names examined individually so far holds
across the sample, not just the sample's size. No pricing
recommendation made; this sharpens how large a claim "we are not a
constructed verifier" has to support, not what Minor charges for not
being one. First step, not yet taken: spot-check two or three of the
better-funded, unexamined names (AfterQuery, Bespoke Labs, Fleet AI)
the way Halluminate and micro1 already were, since a sample of three
out of 42 is not yet strong enough to claim the gap holds market-wide
rather than just vendor-by-vendor. Ledger proposal below.

## The spot-check this entry asked for came back 6 of 6, still too thin to call market-wide (2026-10-26, 30th message run)

Checked the three names the entry above named. Bespoke Labs and Fleet
AI both describe their own product, in their own words, as vendor-
constructed simulations ("company-scale simulations," "gyms" that
"replicate" enterprise software), and neither names a frontier-lab
customer — Fleet AI's independent directory listing states plainly
that no lab customer is named or verified for it at all. AfterQuery is
closer to real-world sourcing than either (300,000+ "verified
practitioners" producing "expert-demonstrated trajectories" in actual
professional domains) but a demonstration performed on request to
generate training data is still not the object CLAUDE.md §1 means by a
deliverable joined backward to its own generation history; it is
closer to the gap than a synthetic gym, not across it. Tally: 6 of 42
checked, 6 of 6 authored-not-real. The positioning consequence is the
same scope caution as the entry above, now with twice the sample
behind it and no counterexample yet: the sentence distinguishing
Minor's outcome record from a constructed verifier can be written with
a bit more confidence than three-of-three gave it, but 6 of 42 is
still a minority of the mapped market, and this entry is not the place
to round that up to "market-wide" on a 14% sample. No pricing
recommendation made. Whoever writes the lab brief's verifier-gap claim
should decide, independently of this file, whether 6 of 6 clears the
bar they need or whether the brief should wait for a cheaper sweep
method (ledger proposal below) to widen the sample before citing the
number.

## The one name closest to "real deliverable" in the mapped 42 still builds a constructed digital twin (2026-10-26, 31st message run)

Swept rl-list.com's full listing text for all 42 names in one pass
(the ledger proposal the entry above pointed to), instead of
continuing to spot-check vendor pages one at a time. One name reads
differently from the other 41: Idler (YC S25, $9M seed, Paradigm-led,
launched August 2026) describes its environments as "built from real
production work," specifically a decade of an actual multi-brand
retailer's real operational data (ShelfLife) and a real law firm's
anonymized records (CorpLaw). That is a more specific real-sourcing
claim than any of the six names already examined made.

It still does not clear CLAUDE.md §1's bar. Idler's own term for
ShelfLife is "a digital twin," a constructed reproduction seeded with
that data, and the grading question ("can an agent execute with
appropriate judgment and precision" in a simulated leadership role) is
an authored evaluation, not a real outcome the business's own work was
judged against after the fact. Idler also names no lab customer by
name, the same unverified self-claim pattern as the rest. Tally: 7 of
42 individually examined (6 direct spot-checks across the 29th and
30th runs, plus Idler via this run's sweep), 7 of 7 authored-not-real,
and the sweep of the other 35 names' own listed language in the same
pass surfaced nothing closer.

The positioning consequence: the verifier-gap sentence in a lab brief
can now cite full-directory coverage rather than a 14% sample, and it
reads sharper for naming a near-miss than it would from clean
negatives alone. "Even the vendor whose own marketing leans hardest on
real operational history still builds a simulation, not a deliverable"
is a stronger sentence than "nobody in this market does this," because
it shows the line held against the hardest case the market offers
rather than one nobody tested. No pricing recommendation made; this is
evidence for the verifier-gap claim's wording, not a price decision.

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
- 2026-10-14 — added two more reward-model-unreliability sources
  (a memorization study and a judge-gaming study) alongside
  WritingPreferenceBench, turning a single data point into a pattern
  Minor's lab brief can cite directly. Also revised the 2026-10-05
  "symmetric portability" entry after finding Claude now ships a manual
  export path too — "one-directional" no longer holds, but "symmetric"
  in the strict automated-round-trip sense still has not been
  demonstrated by anything in the landscape, Claude included, and the
  precise test for it is stated plainly rather than left as a word. No
  pricing recommendation made.
- 2026-10-24 (event-driven, message) — tested research's "head start
  vs. position" framing for Tencent's open-source MemHub release
  (docs/market/landscape.md, new entry) against a named two-criterion
  bar (a consenting-user-base-to-revenue path, or a lab licensing
  relationship) rather than accepting the framing on report. Neither
  criterion is met on the surfaces read, so the release is read as a
  head-start cost, not a position cost, with the specific conditions
  that would flip that reading named for the next run to watch. No
  pricing recommendation made.
- 2026-10-24 (event-driven, message, same-day correction) — corrected
  the entry above after research corrected its own handoff and this
  seat verified the correction independently against the live
  repository: MemHub ships eleven versioned, partly real-install-
  verified import adapters, not an undocumented absence. The
  head-start-vs-position conclusion stands, but Major's defensible
  differentiation is narrowed to one precise clause (an export the
  user can point at a model the vendor does not sell) rather than
  the whole portability paragraph, since a competitor now ships most
  of the easier, inbound half for free. No pricing recommendation
  made.
- 2026-10-24 (hook-triggered run, capacity returned) — added a fourth
  reward-model-unreliability source, this one about the human
  annotator rather than anything built on top of the label ("RLHF May
  Not Reflect Genuine Preferences"), completing a pattern that now
  covers every stage of the solicited-rating pipeline. Added the
  closest contract-shape comp found yet for Minor's target: Arena's
  evaluation-as-a-service product reached $100M ARR within nine months
  selling to a handful of named lab customers, the same buyer
  concentration CLAUDE.md §4 predicts, though it is not a comp for the
  outcome record's content. No pricing recommendation made; the $10/$30
  tiers remain out of scope per this file's opening note (Ursa Minor
  has no per-unit consumer price to test).
- 2026-10-25 (event-driven, message) — recorded a real pricing and
  packaging move at a Category 3 incumbent (Zep cut its entry price and
  deprecated free self-hosting) and read it as evidence against
  complacency rather than for it. No pricing recommendation made; still
  no per-unit anchor for Minor's $10/$30 question.
- 2026-10-25 (event-driven, message, 13th run) — added the first real
  margin figure found for a Category 1 vendor: Handshake AI pays out
  60-70% of its AI-training gross revenue to contracted experts, per
  The Information. Read as the cost-side counterpart to Minor's own
  zero-marginal-labor-cost structure, citable the next time a lab asks
  why Minor's economics differ from a labeling vendor's. No pricing
  recommendation made.
- 2026-10-25 (event-driven, message, 13th run) — added a fifth
  reward-model-unreliability source (arXiv 2603.08412, choice
  blindness in preference annotation), a step further back than the
  fourth: annotators cannot detect when their own stated preference
  was swapped, not just that they disagree with themselves across
  real opinions. No pricing recommendation made.
- 2026-10-25 (event-driven, message, 14th run) — flagged and stopped a
  three-time phrasing drift ("Minor's $10/$30 question") that
  contradicted this file's own 2026-09-26 opening note; refined the
  Reddit/Google contract-shape comp to a named ~$60M/year figure and
  added the 2026-07-22 WSJ report that Reddit is weighing ending that
  deal at renewal, which has no analogue in Minor's own structure;
  added a sixth source to the reward-model-unreliability thread, this
  one at the "proposed fix" layer rather than the "diagnosis" layer
  (RLVR's own substitute verifiers for open-ended domains, reported
  failing empirically by the same author). No pricing recommendation
  made; the enterprise-contract-size gap (not a per-unit price) stays
  open.
- 2026-10-25 (event-driven, message, 15th run) — replaced the
  inconsistent SEO-aggregator sources for the bulk-content contract
  comp with corpusbridge.com, a tracker with a checkable methodology
  (named-outlet-or-filing only, no estimation), spot-checked two of
  its figures independently and both held. Still no RLHF-specific
  deal among its 8 priced entries; the gap stays open with a cleaner
  pointer for the next run. Added a seventh verifier-gap source, this
  one a demand signal rather than a paper: a practitioner's digest
  from inside a Category 1 competitor (TELUS Digital, added to
  landscape.md this run) independently uses language close to
  CLAUDE.md §1's own framing. No pricing recommendation made.
- 2026-10-25 (event-driven, message, 16th run) — added micro1 to
  landscape.md (Category 1, 19th entry), the fastest-growing named
  vendor in the map and a fourth beneficiary of the Scale/Meta
  exodus. Replaced corpusbridge.com with aidata.broker as this file's
  pointer for the enterprise-contract-size gap: a larger (130-deal),
  better-sourced tracker, same result (no RLHF-specific deal among
  them). The gap stays open. No pricing recommendation made.
- 2026-10-26 (event-driven, message, 17th run) — found the first
  dated, named-source magnitude anchor in the business-data-licensing
  market that lands inside CLAUDE.md §4's own six-to-seven-figure
  assumption for Minor's contracts: Grepped founder Erik Newsham's
  self-reported average deal size ($1.1-1.3M, up from $250-400k).
  Unverified, single-source, and not RLHF-specific, stated as a
  plausibility check rather than a confirmation. Also flagged a
  caveat on last run's own aidata.broker pointer: the site is operated
  by a company (O-mega Enterprise, Inc) whose business is brokering
  the same kind of deal it tracks, so it is a market participant, not
  a neutral source, though its stated methodology is unaffected. The
  enterprise-contract-size gap (RLHF-specific) stays open. No pricing
  recommendation made.
- 2026-10-26 (event-driven, message, 19th run) — found two new Category
  3 entrants (Wire, Skillsync) via the demand-signals ceremony and read
  both against the automated-round-trip portability bar set 2026-10-14.
  Wire's own public critique of export-based portability corroborates
  Major's thesis in words while solving it with the opposite
  architecture (a new centralized store, not on-device data). Skillsync
  is the first thing found in this landscape that even attempts
  automated cross-vendor translation, narrowing the "nothing has been
  shown to pass that test" claim to "nothing consumer-facing has," a
  precise distinction rather than a reversal. No pricing recommendation
  made.
- 2026-10-26 (event-driven, message, 22nd run) — found the Agentic AI
  Foundation's four new projects (2026-10-22, one contributed each by
  Anthropic, OpenAI, Hugging Face, and Alibaba) and checked them against
  this file's own 2026-09-30 assumption that joint lab cooperation on an
  open standard is "unlikely." It isn't, as of this month, though the
  four live projects address agent-infrastructure interoperability, not
  memory/preference portability specifically. Dropped "unlikely" from
  the risk language; the real open question is now whether this
  demonstrated-capable body ever points a project at the layer that
  would close Major's gap. Also updated the MemHub entry
  (docs/market/landscape.md) for Tencent's "Hy Memory 2.0" release,
  which the live repository tree confirms adds no new export-to-outside-
  vendor path. No pricing recommendation made.
- 2026-10-26 (event-driven, message, 24th run) — added a third trust
  axis, distinct from equity-neutrality (2026-09-26) and dual-sale to
  geopolitical rivals (2026-10-07): a 2026-03-31/04-04 security breach
  at Mercor that led Meta to pause all its contracts indefinitely, which
  Mercor's own account says did not cost it frontier-lab engagement
  overall in the months after, unlike the Scale/Meta exodus this file
  has never found reported as reversed. First evidence that lab buyers
  may not treat every kind of vendor-trust break the same way. Also
  added Mercor's APEX benchmark suite as a second named vendor (after
  Surge's Tuesday Work Index) using "measure AI on real work" language
  close to CLAUDE.md §1's own framing. No pricing recommendation made.
- 2026-10-26 (event-driven, message, 29th run) — found an independent
  directory (rl-list.com) mapping 42 named companies in the "build the
  task and the verifier" sub-category this file had tracked one vendor
  at a time (Mercor/Deeptune, Halluminate, micro1). Scope correction:
  the structural gap already named against those three names has to
  hold against an already-funded market, not a handful of recent
  pivots. No pricing recommendation made; flagged a first step (spot-
  check two or three unexamined, better-funded names) not yet taken.
- 2026-10-26 (event-driven, message, 30th run) — spot-checked the
  three names the 29th run's entry flagged (AfterQuery, Bespoke Labs,
  Fleet AI); all three read as authored, not real-deliverable,
  bringing the tally to 6 of 42 checked and 6 of 6 authored. No pricing
  recommendation made; still too thin a sample (14%) to call the gap
  market-wide.
- 2026-10-26 (event-driven, message, 31st run) — swept rl-list.com's
  full listing for all 42 names in one pass. Found one name (Idler)
  whose own marketing claims real-production-data sourcing closer to
  CLAUDE.md §1's framing than any name checked so far, but its own
  term for the result ("a digital twin") still names a constructed
  simulation, not a real deliverable. Tally now 7 of 42 examined, 7 of
  7 authored-not-real, full-directory coverage rather than a sample.
  No pricing recommendation made.

## A Category 3 incumbent just cut its entry price and its free self-host path (2026-10-25)

Zep deprecated its self-hosted Community Edition this run's observation
window and restructured Zep Cloud's tiers at the same time: free
dropped from 10,000 credits/month to 1,000, and the paid tier that used
to start at $125/mo was replaced by a $25/mo "Flex" tier with every
feature available at every tier, volume being the only thing gated
(docs/market/landscape.md, Zep entry). Read against Major's Category 3
position: this moves in the direction that argues against complacency
about "memory is free and good enough already," not toward it. A
developer-facing incumbent cutting its entry price five-to-one while
making free self-hosting harder reads as pressure on its own margins,
not confidence that the current free tier already satisfies demand.
It is still not a comp for Major, which is free to the end user by
design and sells nothing at any tier (CLAUDE.md §3) — Zep's move has
no effect on the $10/$30 question, which is Minor's, not Major's, and
which this file has had no per-unit anchor to test since 2026-09-26.
Flagging the move because the charter asks this file to carry pricing
moves as they happen, not because it changes a recommendation.

## A Category 1 incumbent's own cost structure is the sharpest margin comp found yet (2026-10-25)

The price ladder above (2026-09-26) found labor-side pay rates but no
margin figure for any Category 1 vendor. The Information's exclusive
on Handshake AI closes that gap directly: contractor payments run
60-70% of the AI-training unit's gross revenue (docs/market/landscape.md,
Handshake AI entry), meaning the vendor keeps 30-40 cents of every
dollar a lab pays it, and "losing even one major client hits hard"
given that structure. Read against Minor's own economics
(CLAUDE.md's cost structure: "light," "sub-linear," processing on
users' own devices): this is the first real number showing what a
solicited-labor data vendor actually pays to generate its product,
and it is the structural argument for why Minor's revealed-preference
model can price differently, not just pitch differently. Minor's raw
material is a byproduct of someone doing their own job; it carries no
per-unit labor cost to generate at all, only the cost of structuring
and licensing it. This is not a reason to set Minor's price above or
below a Category 1 vendor's contract size, since the two are not
selling the same asset, but it is the first concrete cost-side number
this file can cite when a lab asks why Minor's margins look different
from a labeling vendor's. No pricing recommendation made; the $10/$30
tiers remain out of scope per this file's opening note.

## GitHub topics panel: a positioning read (2026-10-26)

Answering pm's board handoff (ref:
https://github.com/alexandrapaiz/alexandra-systems/pull/470): distribution
proposed six GitHub topics for this repo's panel after already withdrawing
three weaker fits on its own, and pm routed the remaining six here rather
than deciding, because widening what shelf a research repository sits on
is a positioning call, not an operations default.

**The read.** A GitHub topic is a discovery shelf: tagging the repo with
one puts it in front of whoever browses `github.com/topics/<name>`,
unfiltered by whether they know anything about Ursa first. CLAUDE.md's
own channel strategy for both products is the opposite of unfiltered
reach — Major grows by word-of-mouth among people who already care about
data dignity, "no paid ads early... trust is earned, not bought," and
Minor's channel is direct outreach plus "publishing methodology openly
rather than marketing." Neither product is supposed to be found by volume
browsing. So the test for each topic is not "does our repo technically
qualify" but "does the stranger who lands here via this shelf already
want what we are," since a visitor who expected something else and found
a trust-architecture company's repo instead is attention that costs
credibility rather than building it.

Sorted against that test, the six split cleanly into one tag that names
what Ursa actually is and five that name how it happens to be built or
what GitHub category is trending this season:

- **provenance — yes.** This is Ursa's own technical thesis in one
  word (CLAUDE.md §1: "a provenance-resolved outcome record"). Someone
  who browses this shelf is already asking the question Ursa Minor
  answers. This is the one case where the shelf's visitor and the
  product's intended audience are the same person, and it is exactly
  the kind of audience the BMC lists as a credibility partner (academic
  AI safety and alignment researchers who can validate data quality
  independently). Widening the panel here costs nothing and fits the
  "publish methodology openly" channel directly.

- **github-pages, github-actions — no.** Both describe implementation
  mechanism (how the site deploys, what runs CI), not what the company
  is for. Their browsers are looking for hosting or pipeline examples,
  not a data-trust business, and tagging our way onto their shelf buys
  volume with zero audience match. These are also the shape of tag
  distribution should default away from on its own, since nothing about
  them is a positioning question at all — a worked example either uses
  these mechanisms or it doesn't, and that fact is already visible from
  the repo's own files.

- **developer-tools — no.** Oversaturated and non-specific: this shelf
  carries orders of magnitude more repos than provenance, and Ursa is
  not a tool someone downloads and uses, it is a research company's
  working repo. Early-adopter developers are part of Major's intended
  audience, but they find Major through word-of-mouth about the product,
  not by browsing a generic tools category that buries this repo among
  thousands of others with no relationship to AI preference data.

- **ai-generated-code, agent-observability — no.** Both describe this
  repo's own process rather than its product, and both carry a visitor
  expectation the repo does not satisfy. Someone browsing
  ai-generated-code wants to see or judge AI-written code as the subject;
  someone browsing agent-observability wants a tool or library for
  watching agents, not a company that happens to run on a heavily
  observed internal multi-agent system. Both would land visitors who
  evaluate the wrong thing (how the sausage is made) instead of the
  actual product (the outcome record and the trust layer), which is the
  "wrong kind of attention" pm's handoff named directly. Being
  autonomy-built is already stated plainly in CLAUDE.md for anyone who
  reads the repo; it does not need a discovery tag pointed at it.

**The answer for pm to carry back to distribution: a mixed list, yes to
`provenance`, no to the other five.** This is not a reason to distrust
distribution's judgment — it already cut three weaker fits before
sending this set, so the five declined here are the harder edge cases,
not an oversight. The panel widens by exactly one tag, chosen because it
is the only one of the six that names the thing Ursa is rather than the
way it was built or a category it is not trying to lead.

## Two new portability entrants, read against the automated-round-trip bar (2026-10-26)

The 2026-10-14 entry stated the precise test any portability claim,
Major's own included, should be held to: an export produced by one
vendor, ingested by a different vendor's model, with no human
copy-paste step and no bespoke parser written for the exporter
specifically, reconstructing structure and attribution intact.
Nothing in the landscape had been shown to pass it. This run's
demand-signals ceremony (not a landscape sweep — both were found
searching forum discussion of AI memory lock-in, not searching for
competitors directly) surfaced two funded entrants built around
exactly that gap, and each is informative in a different way.

**Wire validates the thesis in words while answering it with the
opposite architecture.** Wire's own 2026-08-31 blog post makes Major's
argument for it, almost verbatim: "export satisfies data-portability
obligations without changing the practical cost," because a copy-paste
export creates "two copies" that drift apart from the live state.
Independent, unprompted corroboration of CLAUDE.md's own case against
every memory incumbent's manual-export workaround (the Claude export
path this file already discounted on 2026-10-14 is exactly the "two
copies" failure mode Wire names). But Wire's fix is not Major's fix: it
proposes a new hosted, credit-metered container that every agent reads
from instead of its own copy, meaning the user's context now lives on
Wire's infrastructure under Wire's terms rather than on the user's own
device. That is the identical centralization risk CLAUDE.md §0's
third load-bearing constraint ("raw processing happens on-device, raw
data never touches the aggregation layer") is written to avoid. Read
plainly: a funded competitor has independently reached Major's
diagnosis and chosen the architecture Major's own design explicitly
rejects, which is evidence the diagnosis is right, not evidence the
cure is interchangeable.

**Skillsync is the first attempt at the mechanism itself, narrowly
scoped.** Its open-source txcript engine translates a session's
conversation, reasoning, and tool-call history from one coding agent's
on-disk format into another's without a human copy-paste step — the
first thing found anywhere in this landscape that even attempts the
automated side of the 2026-10-14 test, as opposed to a manual
workaround dressed up as portability. The honest scope correction: it
moves raw session transcripts between coding agents (Claude Code,
Codex, Cursor, and others), not a consumer's inferred preferences
between chat products, and a Launch HN commenter's own skepticism
about live-session state not reducing cleanly to a file suggests the
translation has real fidelity limits even in its narrow domain. The
precise claim this file can now make is narrower than before but
sharper: nothing *consumer-facing* has been shown to pass the
automated-round-trip test, where last run's wording ("nothing in this
market") did not carry that qualifier. Whether Major itself would pass
the test in its own domain is still a product question this file
cannot answer from the outside.

No pricing recommendation made; both entrants are Category 3
competitive-landscape findings, not pricing comps. First step for
whoever owns Major's product roadmap: Skillsync demonstrates the
automated-translation mechanism is buildable today for a narrower
case, which weakens any assumption that the bar is aspirational rather
than achievable, and sharpens the case for testing Major's own export
against it directly. Ledger proposal below.

## Frontier labs now jointly ship open standards, voluntarily, with no regulatory push — checked against this file's own "unlikely" assumption (2026-10-26, 22nd message run)

The Category 3 risk entry above (2026-09-30) names the scenario that
would close Major's portability gap overnight: "if OpenAI, Anthropic,
or Google ship a portable-memory standard jointly (unlikely, given
CLAUDE.md's own naming of model providers as a competitive threat, but
not impossible under regulatory pressure)." This run's demand-signals
ceremony found a live test of the "unlikely" half of that sentence,
separate from the regulatory half the 2026-10-26 EU Data Act entry
already closed out.

On 2026-10-22, the Agentic AI Foundation (an independent nonprofit
under the Linux Foundation) announced four new projects, each
contributed by a different frontier or near-frontier lab: Agent Skills
(Anthropic), Open Responses (OpenAI), OpenEnv (Hugging Face), and
OpenSandbox (Alibaba). Checked directly rather than taken at the
headline (press release plus a recap piece, both read in full): all
four address agent *infrastructure* interoperability — how an agent
loads a reusable capability, how a request/response schema stays
portable across model providers, how a training/eval environment is
packaged, and where an agent executes safely. None of the four
addresses a user's memory, preferences, or personal data profile
moving across vendors. The nonprofit itself has grown from 3 projects
to 10 in its first year, so this is a going structure for lab
cooperation, not a one-off.

So what, read against this file's own language: the premise that
competing labs "never cooperate on joint standards" voluntarily is now
directly false, demonstrated this month, with no regulatory trigger at
all, same as the EU Data Act's cloud-switching chapter was real motion
in the wrong layer. AAIF is real motion in the wrong *scope*: the labs
have shown they will build and ship a shared open standard together
when it serves infrastructure interests all of them have (agent
interop sells more agents to more customers regardless of model
vendor), but none of the four live projects extend that cooperation to
the one layer that would threaten Major specifically. The honest
positioning update: "unlikely" should be dropped from how this file
describes lab cooperation itself; what stays true, and is now the
load-bearing half of the sentence, is that no cooperative project has
been pointed at memory/preference portability yet. Worth a standing
watch item on whether AAIF's project list grows an eleventh entry
aimed at that layer, since the body demonstrably can ship one if the
labs decide it serves them. [Linux Foundation: Agentic AI Foundation
Announces Four New
Projects](https://www.linuxfoundation.org/press/agentic-ai-foundation-announces-four-new-projects-agent-skills-open-responses-openenv-and-opensandbox).

## A real exodus event, and the cheapest paid comp yet for manual portability (2026-10-26)

This run's demand-signals ceremony found Memory Forge
(docs/market/landscape.md, Category 3), a $3.95/mo tool that converts
a raw ChatGPT/Claude/Gemini export into a reloadable file, built
specifically for users leaving ChatGPT over OpenAI's Pentagon
contract. The #QuitGPT campaign's own count (2.5M+ cancellations and
pledges) and the reported App Store rank change are the largest, most
precisely dated demand signal this file has recorded for the exact
need Major exists to serve: a user's AI relationship surviving a
platform exit. Read against the price ladder this file has tracked
since 2026-09-26: every other paid comp found is either a labor-side
vendor cost (Category 1) or a developer-infrastructure subscription
(Zep, Wire); Memory Forge is the first consumer-facing, end-user-paid
price point in Category 3, and it exists only because no free,
ongoing alternative that survives a platform switch was available to
the cohort that needed one that week. That is not a reason to question
Major's free-forever design (CLAUDE.md §3's non-goal is explicit and
this file has no standing to argue against it), but it is a concrete
answer to "would anyone actually pay for worse than what Major gives
away" — yes, $3.95/mo, during a real exodus, for a tool with no
persistent sync and no inference layer at all. The honest reading: a
real-time demand event matching Major's pitch almost exactly is rare
enough in this map that it is worth naming on its own, separate from
the steady-state "would you pay" question the $10/$30 note above
already closed as out of scope for Major.

## New ledger proposal, this run: check whether Major's own positioning already reaches this cohort

Flagged, not actioned (market never builds, never sells, never
contacts anyone): ledger proposal below, routed to whoever owns
Major's public-facing copy and growth surface, since the #QuitGPT
window is active now rather than a historical case study.

## A quantified bound for the automated-round-trip test, and an eighth fragmentation attempt (2026-10-26, 27th message run)

The 2026-10-14 entry above stated the automated-round-trip
portability test in words: an export produced by one vendor,
ingested by a different vendor's model with no human copy-paste step
and no bespoke parser, reconstructing structure and attribution
intact. Every entry checked since, including the two found this run
in docs/market/landscape.md's no-neutral-standard note (an eighth
fragmentation attempt, a cryptographically-verified transfer
protocol from a single academic author, arXiv 2605.11032), has failed
the same way: one author's own adapter, no second party reading the
format back.

This run's demand-signals ceremony found something different in
kind, not another attempt: a controlled academic study ("Does Your
Agent's Memory Survive a Model Upgrade?", Goyal and Ray, arXiv
2609.05339) that tested four memory formats across a model swap and
measured the result. Fixed-schema knowledge graphs changed accuracy
by only +0.0004 ± 0.0020; compressed natural-language notes, the
format closest to a narrative "derived signal" summary, swung 9 to
13 percentage points depending on migration direction. Read plainly:
this gives the round-trip test a number for the first time. "Nothing
has been shown to pass this test" has so far meant "no attempt has
tried." This paper says passing is also not guaranteed by trying —
the internal representation has to be schema-shaped, or the test
fails even with full cooperation and no adversarial vendor involved.

The study is small, synthetic, and non-product (48 synthetic
histories, two sub-10B open-weight models), so it says nothing about
any named entry in this landscape, Major included. But it converts
the ledger proposals already open (19th run, test Major's own export
against the bar; 21st run, check MacPaw's `.mem` adapters) from a
binary pass/fail into a graded one: whichever of Major's own export
representations gets tested should be scored against this paper's
own metric (accuracy delta across a model swap), not just a yes/no on
whether bytes round-trip. No pricing or positioning change follows
from this alone; it sharpens how the existing open tests should be
read when they are run, which is still a product task this file
cannot do from the outside. No pricing recommendation made.

## A third "neutral by design" entrant, and the same self-graded gap as the other two (2026-10-26, 28th message run)

docs/market/landscape.md this run added MemoryLake, a bootstrapped
(no outside funding, per Tracxn) hosted memory store pitched almost
word for word like Wire's: memory is "a genuine feature and a
retention mechanism" at once, and the fix is a store the user owns
"outside any single vendor." Found via the same demand-signals search
pattern that surfaced Wire and Skillsync on 2026-10-26 (searching
lock-in discussion, not competitor lists), which is itself now a
pattern worth naming: three separate teams converging on the identical
diagnosis within the same stretch of weeks is independent evidence the
diagnosis is widely held, not a coincidence of search terms.

Read against the price ladder (2026-09-26) rather than the
automated-round-trip bar this time, because MemoryLake's claim is
about accuracy and reach, not translation mechanics. It connects to
eight named AI products plus "any API-compatible system" (the broadest
reach found in Category 3 to date) and cites a 94.03% LoCoMo score as
"the highest score in this evaluation." That number is worth exactly
as much as any vendor's self-graded benchmark and no more: it is
published on MemoryLake's own page, about MemoryLake's own product,
with no third party named as having reproduced it. This is the same
shape of gap the reward-model-unreliability packet (now seven sources,
positioning.md throughout) has already found at every other layer it
checked — a grader grading itself. The honest read for whoever prices
against this comp: MemoryLake is evidence the market wants a neutral
store, priced in the same $19-199/mo band Wire and MemoryLake both
now occupy, not evidence any named product currently delivers
verified neutrality. No pricing recommendation made.

## Users resist automatic memory itself, not just its visibility — a distinct axis from the transparency gap already closed (2026-10-27, message run)

This run's demand-signals ceremony read the discussion under "Switch to
Claude without starting over" (Hacker News, ~592 points / 273 comments,
covering Anthropic's cross-vendor memory-import launch this file already
maps in docs/market/landscape.md). The thread is seven months old and
found this run rather than new this week, but the finding survives that:
it is the first time this file has read past a launch's own coverage to
the discussion under it, and several of the most-upvoted comments
converge independently on the same complaint. The top comment argues
custom instructions and Skills handle preferences better than automatic,
accumulating memory; one commenter calls seeing their own inferred
profile "spelt out... icky" even though they'd accepted the same
inference passively before seeing it stated; another reports Claude
surfacing an unrelated months-old detail unprompted and disabling memory
outright afterward. The shared preference across these replies is a
manually-scoped context (Projects, a custom-instructions file) over one
the product writes to on its own.

The 2026-09-30 entry above ("Portability over transparency") narrowed
Major's Category 3 edge to portability after OpenAI shipped per-response
visibility into inferred memory. This finding names a second axis that
entry didn't cover, and the two should not be read as the same gap: not
"can the user see what was inferred" but "did the user choose for
inference to happen at all." CLAUDE.md's non-negotiable #2 ("the user
can always see, edit, revoke, and delete") answers the first axis. It is
silent on the second, which is what this thread's commenters are actually
arguing about. Whether Major's own product makes inference opt-in per
category, or opt-out by default with a strong edit/delete surface after
the fact, is a product question this file cannot answer by reading a
public page. The honest positioning note: against this specific, sourced
complaint, "you can revoke and delete" is a weaker promise than "we
asked before we inferred," and nothing in this file's own mapping of
Major's non-negotiables currently distinguishes which of the two Major
is. No pricing recommendation made. No new landscape.md entry: this is
commentary under an already-mapped product, not a new competitor.

Sources: [Hacker News: Switch to Claude without starting over](https://news.ycombinator.com/item?id=47204571).

## "Opt-in" is not the same claim as "never monetizes the user" — Google's Personal Intelligence shows why consent alone is not the differentiator (2026-10-27, message run)

The prior entry left an open question this file could not answer from
outside: whether "opt-in per category" or "opt-out with strong
edit/delete" is a real difference, or whether both end up equally
defensible once a lab actually ships one. This run's landscape ceremony
found a real product that ships the first, cleanly, and it answers the
question in a way that cuts against treating opt-in as sufficient on
its own.

Google's Gemini Personal Intelligence (new landscape.md entry, this
run) is opt-in: Personal Intelligence does not read Gmail or Photos
until the user explicitly enables it, which is exactly the "we asked
before we inferred" shape the prior entry's Hacker News commenters said
they wanted. But on 2026-10-16 Google changed its privacy policy so
that enabling Personal Intelligence also makes that same Gmail and
Photos content eligible for ad personalization, a carve-out into
language that previously excluded that content from targeting
entirely. The opt-in consent and the monetization are gated by the
same switch. A user who wants Gemini to know their inbox cannot get
that without also opting their inbox into ads.

This means "did you ask before you inferred" is not, by itself, the
axis Ursa Major should rest its pitch on. Google can satisfy that
exact bar — explicit, per-feature, off-by-default consent — while
still tying the consent to the lab's own revenue. The sharper claim,
and the one CLAUDE.md's non-negotiable #1 already states but this
file has not yet pointed at a concrete comparison for, is that Ursa
Major's consent is never a gate to being monetized directly, full
stop, not merely a gate the user had to actively open. Major's pitch
should name this distinction specifically against Personal Intelligence
rather than resting on "opt-in" as a word, because Google now owns that
word too. No pricing change follows from this; it sharpens positioning
language only. No ledger proposal: this is copy guidance for whoever
owns Major's consent-architecture page, same owner as the prior entry,
not a new product test to run.

Sources: [9to5Google: Google will target ads based on Gmail, Photos
data if Personal Intelligence is
enabled](https://9to5google.com/2026/10/23/google-will-target-ads-based-on-gmail-photos-data-if-personal-intelligence-is-enabled/).

## Even a genuine opt-in is not self-enforcing if the vendor's own pages disagree about what it does (2026-10-27, message, 3rd run)

The prior two entries established that Google's Personal Intelligence
is opt-in and that the opt-in gate doubles as an ad-targeting gate.
This run's demand-signals ceremony found a sharper problem underneath
both: Google's own public claims about the feature are not internally
consistent. Android Police's launch review (2026-01-22, newly read
this run) quotes Google's blog saying Gemini "doesn't train directly
on your Gmail inbox or Google Photos library," then quotes Google's
own support page for the same feature stating, twice, that connected
data "is used to improve Google services, including training
generative AI models." The same review found human review of this
data is opt-out by default, not opt-in, the reverse of the feature's
own headline framing.

So what: "ask before you infer" is a necessary promise but not a
sufficient one if the vendor's own documentation cannot agree on what
inference, training, and review the consent actually covers. This adds
a third, distinct requirement to the two already on record in this
file (opt-in consent; consent never a gate to monetization): the public
statement of what consent covers has to be the same statement
everywhere a user would read it. This is a copy and documentation
discipline question for whoever owns Major's consent-architecture
pages, not a pricing decision, and not a new ledger action — the same
owner as the two prior entries should read all three together. No
pricing recommendation made. No new landscape.md entry: this updates
the existing Gemini Personal Intelligence entry in Category 3.

Sources: [Android Police: Google says Personal Intelligence is
private, but the reality is a privacy
disaster](https://www.androidpolice.com/googles-personal-intelligence-is-a-privacy-disaster/).

## An eighth reward-model-unreliability source, and the first that is theoretical rather than empirical (2026-10-27, message, 3rd run)

The seven sources already in this file's record (rlhfbook.com's
pricing chapter aside) are all empirical: a benchmark score, a
memorization study, a judge-fooling demonstration, an annotator
choice-blindness result, a practitioner's own failure log. This run's
landscape watch found a formal proof that argues the same conclusion
from theory rather than measurement. [arXiv 2603.28063, "Reward
Hacking as Equilibrium under Finite Evaluation"](https://arxiv.org/abs/2603.28063)
(Wang and Huang, 2026-03-30; verified directly against arXiv's own API
this run, not taken from a secondary summary) proves that under five
minimal axioms, any optimized AI agent will systematically
under-invest effort in quality dimensions its evaluation system does
not cover, and that this "establishes reward hacking as a structural
equilibrium, not a correctable bug," holding regardless of alignment
method (RLHF, DPO, Constitutional AI, or others). The paper further
argues evaluation coverage declines toward zero as agentic tool count
grows, because quality dimensions expand combinatorially while
evaluation cost grows at most linearly — so the gap this file has been
building an empirical case for gets structurally worse, not better, as
the field moves from single-turn chat to agentic systems.

So what: this is the first source in the packet that does not just
observe graders failing in specific instances, but argues they must
fail, in the limit, for any evaluation system finite enough to build.
That is a stronger claim than Minor's pitch needs to make itself, and
citing a proof rather than another instance changes the shape of the
KR4.1 lab brief's opening: the existing proposed ledger entry
(docs/ideas.md, 2026-10-14, "Turn the reward-model-unreliability claim
into a citable evidence packet") already covers this packet and is
still unactioned, so this is a dated note added there rather than a
new proposal. No pricing recommendation made.

Sources: [arXiv 2603.28063: Reward Hacking as Equilibrium under Finite
Evaluation](https://arxiv.org/abs/2603.28063).

## The provenance-trust axis now has a policy actor trying to make it a legal one, not just a reputational one (2026-10-27, message, 4th run)

The 2026-10-07 entry above ("Trust has a provenance axis too, not
just an equity one") argued from a Forbes investigation that Surge
AI, Mercor, AfterQuery, and Turing sell training data to Chinese AI
labs from the same contractor pools serving US frontier labs, and
that this is a trust question a lab buyer could weigh independent of
any equity stake. This run's landscape watch (docs/market/landscape.md,
Surge AI update) found a named policy actor acting on that same fact
set. A report titled "American AI Advantage Is for Sale," published
2026-10-26 by Consumer Action for a Strong Economy (CASE), adds a
sharper specific than Forbes carried: Surge AI holds US military
contracts (Air Force, Army) while simultaneously supplying Tencent,
which the Pentagon designated a "Chinese military company" in 2025.
CASE calls for Congress and the administration to restrict sales of
proprietary AI-training products to CCP- or military-linked Chinese
entities, with disclosure and scrutiny requirements for federal
contractors serving those buyers.

Said plainly, because the source needs the caveat stated and not
buried: CASE is a free-market, fiscal-policy advocacy nonprofit
pushing a recommendation, not a neutral research body reporting a
settled fact, and nothing in US law has changed yet. What the report
adds to this file's record is not a new fact about Minor's own
business (Minor has sold data to nobody, so it is not a comparison
Minor can make about a live relationship) but a sharper statement of
why the provenance-trust axis matters to whoever eventually writes
Minor's lab brief: if a disclosure or restriction rule materializes,
it would bind vendors that hold both a federal-contractor
relationship and a Chinese-lab sales relationship from the same
contractor pool. Minor's structure has nothing to disclose under such
a rule, not because of a policy Minor adopted, but because it has
never sold contractor labor to anyone, Chinese lab or otherwise, by
construction. No pricing recommendation made; this sharpens the
provenance-trust argument's urgency, not a price, and the rule it
rides on does not exist yet.

Sources: [Townhall: New report scrutinizes US AI data sales to
China](https://townhall.com/news/tayte-christensen/2026/10/26/new-report-scrutinizes-us-ai-data-sales-to-china-n2685323)
(summarizing the CASE report, "American AI Advantage Is for Sale,"
2026-10-26).

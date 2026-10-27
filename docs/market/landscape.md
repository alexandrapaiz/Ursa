# Market landscape — living map

Maintained by the market research agent (prompts/market-agent.md).
Read-only research on free, public surfaces. Each entry: what it is,
who it serves, pricing, strengths, weaknesses against Ursa, and a
dated last-observed note. Entries are added and retired with dated
notes; never silently deleted.

This file opened 2026-09-26 (sprint 2026-09-21 item 4, serving O2
KR2.3, due 2026-10-31). First run: 12 entries across the three
categories the KR names. Second run (2026-09-30): revisited six
existing entries and added one new one (Handshake AI, Category 1, now
13 total). Third run (2026-10-05): revisited Scale AI, Mercor, and
ChatGPT Memory, and added one new entry (Claude Memory Import,
Category 3, now 14 total). The weekly rhythm (a handful of entries
plus anything new, full map monthly) continues from here.

Run of 2026-10-25: revisited the six entries that had gone untouched
since the file opened on 2026-09-26 — Prolific, Artificial Analysis,
Vals AI, Mem0, Letta, Zep — closing out the first full-map pass inside
the one-month window the charter sets. Every entry in the file now
carries at least one update since 2026-09-26.

A note on "weaknesses against Ursa": Ursa Minor does not yet sell
anything, so this is a read of structural gaps the outcome-record
approach (CLAUDE.md §1) is built to fill, not a claim of current market
share. Score it as a hypothesis under test, not a scoreboard.

## Category 1 — Preference-data vendors

These are the closest thing Ursa Minor has to direct competitors: paid
human-feedback and RLHF pipelines that sell labs annotated preference
data. Every one of them, without exception, is a **solicited-feedback**
model: a person is paid to produce a rating, a ranking, or a correction
on request. None of them sources signal from a person's own real,
unprompted work. That is the single structural gap the outcome record
is built to fill (CLAUDE.md §1, "the label is supplied by the artifact
rather than by a grader").

### Surge AI

What it is: a premium RLHF and data-labeling vendor working directly
with frontier labs (OpenAI, Google, Anthropic, Microsoft named as
customers in public reporting) on alignment data — preference rankings,
red-teaming, and frontier-scale evaluation. Who it serves: frontier
labs almost exclusively, positioned above commodity labeling. Pricing:
no public tiers; enterprise contracts negotiated per project, with
worker pay reported around 30-40 cents/minute for individual
contributors. Strengths: reportedly the vendor of choice for the labs
that pulled back from Scale AI after the Meta deal (see "Moves" in this
week's brief); trusted-neutral positioning among frontier labs.
Weakness against Ursa: still a curated-panel-of-raters model, not
revealed preference from real finished work, and the rater never has
skin in the outcome the way a person shipping their own work does.
Last observed 2026-09-26: [Surge AI on Sacra](https://sacra.com/c/surge-ai/), [Surge AI, Wikipedia](https://en.wikipedia.org/wiki/Surge_AI).

Update 2026-09-30: confirmed OpenAI, a Surge customer since 2021,
dropped Surge as a vendor in 2025 — reported as a vendor-choice
decision rather than a move away from purchased human feedback data
altogether, since OpenAI still holds contracts with Mercor and
Invisible. Surge's own revenue is reported at $1.4B (2026). Last
observed 2026-09-30: [Sacra: Surge AI](https://sacra.com/c/surge-ai/), [Getlatka: Surge AI revenue](https://getlatka.com/companies/surgehq.ai).

Update 2026-10-07, two separate moves. First: a Forbes investigation
(2026-08-05, by Anna Tong) reported Surge AI, Mercor, AfterQuery, and
Turing collectively sold roughly $500M/year of training data to top
Chinese AI labs (Tencent, Alibaba, ByteDance named), with Surge CEO
Edwin Chen reportedly traveling to China to meet lab executives
directly, while the same vendors hold US government and frontier-lab
contracts simultaneously. The original Forbes article is paywalled;
recording this secondhand via an aggregator rather than skipping it,
per this charter's rule for paywalled evidence. Second: Surge's own
blog confirms it launched DAYJOB (2026-09-23, with Healthcare and
Finance sub-benchmarks added by 2026-10-04) and GDP.xlsx (2026-09-30),
both under its "Tuesday Work Index" umbrella (started 2026-08-18) —
benchmarks explicitly framed around "economically valuable work" and
whether an agent can "survive a 9 to 5." That is Surge's language
converging on the same territory Ursa Minor's pitch occupies, while
the mechanism stays a constructed, graded task set rather than real
work observed after the fact — see the new positioning.md section this
run. Last observed 2026-10-07: [aiweekly.co: Forbes — Surge AI, Mercor, AfterQuery and Turing sold ~$500M/year to Chinese labs](https://aiweekly.co/alerts/forbes-surge-ai-mercor-afterquery-and-turing-sold-500myear-of-training-data-to), [Surge AI blog](https://surgehq.ai/blog).

Update 2026-10-26, two more posts on Surge's own blog continuing the
2026-10-07 convergence. First, "sudo L7" (2026-10-21): a new benchmark
testing whether a coding agent exercises "staff-level engineering
judgment" rather than merely producing correct code, the closest this
entry has come yet to judging work by whether it holds up rather than
whether it passes a check at submission time, though the task set is
still Surge-constructed rather than drawn from real deliverables.
Second, and more load-bearing: a post (dated 2026-09-15, republished
2026-10-15) states Surge "built the human baseline, including
researcher recruitment, structured submissions, quality control, and
expert review" for Anthropic's own published work on automated
alignment researchers. That is a named frontier lab paying this
category's largest vendor for solicited human-baseline construction on
its own alignment research, the same solicited-feedback mechanism this
entry's weakness line has named since 2026-09-26, and the same lab
whose public principles this project runs under. It does not change
the read already on file (Minor is not trying to take share from this
spend, only to sell a different thing to the same buyers, per the
2026-09-30 Mercor update); it is a second, more specific confirmation
that the spend itself keeps growing rather than commoditizing away.
Last observed 2026-10-26: [Surge AI blog](https://surgehq.ai/blog).

### Scale AI (incl. Outlier)

What it is: the largest commercial RLHF/data-labeling platform,
reported at $750M+ ARR, running an end-to-end "generative AI data
engine" plus the Outlier subsidiary for LLM-specific annotation by
vetted domain experts (law, medicine, STEM, coding). Who it serves:
was the default vendor for nearly every frontier lab. Pricing:
enterprise contracts, undisclosed. Strengths: scale, breadth of
domain-expert pool, incumbency. Weakness against Ursa, and the single
biggest event in this category this year: Meta's $14.3B stake for 49%
of Scale (June 2025) triggered a customer exodus on **neutrality**
grounds alone — Google (reportedly a ~$200M/year contract), OpenAI, and
Microsoft all cut or scaled back ties because they could no longer
trust that their training data and roadmap stayed away from a
competing lab's parent. This is a direct, live validation of Ursa's own
central strategic problem (CLAUDE.md §5): a data vendor that is
perceived as compromised loses its top customers overnight, no matter
its scale. Last observed 2026-09-26: [Scale AI, Wikipedia](https://en.wikipedia.org/wiki/Scale_AI), [Computerworld on the Meta-triggered exodus](https://www.computerworld.com/article/4009714/metas-14-3b-stake-triggers-scale-ai-customer-exodus-could-be-a-windfall-for-rivals-like-mercor.html), [TechCrunch: OpenAI drops Scale AI](https://techcrunch.com/2025/06/18/openai-drops-scale-ai-as-a-data-provider-following-meta-deal).

Update 2026-09-30: several pre-IPO data-aggregator sites (TechStackIPO,
Forge, EquityZen) circulated a specific claim this week — an S-1 filed
September 11, 2026 at a $32.4B valuation — but none link to an actual
SEC filing, a direct EDGAR company search turned up no matching S-1,
and other sources instead describe an IPO still targeted for H2 2027 at
a $30B valuation. Recording this as an unconfirmed, internally
conflicting claim rather than a fact, per this charter's sourcing bar.
Worth a direct EDGAR check next run instead of repeating an
aggregator's unlinked number. Last observed 2026-09-30 (unverified):
[TechStackIPO](https://www.techstackipo.com/company/scale-ai), [Forge Global valuation tracker](https://forgeglobal.com/scale-ai-inc_stock/).

Update 2026-10-05: new CEO. Francis deSouza (formerly COO and
president of security products at Google Cloud; before that CEO of
Illumina) was appointed CEO effective 2026-08-10, replacing interim
CEO Jason Droege, who had led the company since founder Alexandr Wang
left for Meta in 2025 following Meta's $14.3B stake. The public framing
is an enterprise/government growth push, not a neutrality fix — the
incoming CEO is himself a departing executive of a different
platform giant (Google Cloud), which does not resolve the structural
concern named above so much as restate it with a new name attached.
Last observed 2026-10-05: [Axios: Scale AI hires Francis deSouza](https://www.axios.com/2026/07/30/scale-ai-google-cloud-coo-francis-desouza), [Wikipedia: Francis deSouza](https://en.wikipedia.org/wiki/Francis_deSouza).

Update 2026-10-14: re-ran the direct EDGAR company search flagged as a
follow-up in the 2026-09-30 entry. It still returns no company named
"Scale AI" and no S-1 on file. Independent IPO-tracking sites continue
to disagree with each other — one still shows a March 12, 2026 S-1 and
labels the company "Public," another says explicitly that no S-1 has
been filed and no IPO date announced, and both acknowledge their own
data may be outdated. Nothing found this run upgrades the circulating
S-1 claim from unconfirmed to confirmed, or downgrades it to false; it
remains unconfirmed, two EDGAR checks three weeks apart in agreement.
Last observed 2026-10-14: [SEC EDGAR company search](https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=scale+ai&type=S-1), [TechStackIPO: Scale AI](https://www.techstackipo.com/company/scale-ai).

### Mercor

What it is: an expert-contractor marketplace that pivoted into RLHF,
matching credentialed domain specialists (physicians, attorneys, senior
engineers) with labs like OpenAI for reward-model and reasoning-eval
work. Who it serves: frontier labs wanting expert-grade (not
crowd-grade) feedback. Pricing: contractor-side rates reported around
$85/hr average, $200+/hr for senior specialists; the company itself
raised a $350M Series C at a $10B valuation in October 2025. Strengths:
named as one of the three fastest-growing independents picking up
business that left Scale post-Meta. Weakness against Ursa: still
solicited, task-assigned expert labor, priced by the hour of grading
rather than derived from work the expert was doing anyway. Last
observed 2026-09-26: [Mercor, Wikipedia](https://en.wikipedia.org/wiki/Mercor), [Mercor on RLHF](https://www.mercor.com/resources/experts/what-is-rlhf/).

Update 2026-09-30: valuation reportedly doubling to $20B (from the
$10B Series C priced in this entry) in talks reported July 2026,
alongside $2B in annualized gross revenue by June 2026, up from $760M
at the end of 2025 — a run-rate that nearly tripled in six months.
Contractor payouts alone were reported above $1.5M/day (roughly
$547M/year annualized) as of October 2025. This is the fastest-growing
name in the category and reads as evidence that lab spend on solicited
human feedback is still accelerating, not commoditizing away — it
sharpens rather than undercuts the read that Minor isn't trying to
take share from this market, only to sell a different thing to the
same buyers. Last observed 2026-09-30: [Forbes: Mercor in talks for $500M at $20B](https://www.forbes.com/sites/richardnieva/2026/07/09/mercor-fundraise/), [Sacra: Mercor revenue](https://sacra.com/c/mercor/).

Update 2026-10-05: the $20B round now has a named lead investor, and
it is also a customer. Reported 2026-08-19, Nvidia has discussed
backing Mercor at the $20B valuation, having already paid Mercor "tens
of millions per quarter" to source specialized human-expert data for
its open-source Nemotron models; existing investor General Catalyst is
reportedly in talks to lead the round itself. H1 2026 gross revenue is
now disclosed at $614M, consistent with the $2B annualized run-rate
reported last run. This is the identical structural shape as the
Scale/Meta entry above — a compute platform that is simultaneously a
paying customer taking an equity stake in its own data vendor — and it
is worth watching for the same neutrality response (see the dated note
added to docs/ideas.md's 2026-09-26 neutrality entry this run): if
Mercor's other lab customers (OpenAI, Google, Anthropic, all reported
clients) read an Nvidia stake the way they read Meta's stake in Scale,
this entry could develop the same customer-exodus arc within months.
Last observed 2026-10-05: [The Information via Tech Startups: Nvidia in talks to invest in Mercor at $20B](https://techstartups.com/2026/08/19/nvidia-in-talks-to-invest-in-ai-data-startup-mercor-at-20-billion-valuation/), [PYMNTS: Nvidia weighs investment in Mercor](https://www.pymnts.com/news/investment-tracker/2026/nvidia-weighs-investment-in-round-valuing-mercor-at-20-billion/).

Update 2026-10-07, two items, both weakening the "scale and incumbency"
read above. First: the same Forbes investigation covered in this run's
Surge AI update reports roughly 2% of Mercor's Q2 2026 revenue came
from Chinese AI labs, and that Mercor hired an engagement manager
focused specifically on that market — a smaller share than Surge's but
the identical structural fact, a vendor serving frontier US labs and
Chinese labs from the same contractor pool at the same time. Second: a
Gazetteer SF investigation (2026-05-05, by Cydney Hayes, based on
interviews with multiple anonymous former employees plus a December
2025 internal survey) reported punishing, unpredictable hours,
abrupt terminations without severance, and no formal HR, payment, or
legal policies before late 2025; Mercor's spokesperson disputed or
contextualized several of the specific claims. Neither item changes
Mercor's growth trajectory, but both bear directly on the
solicited-labor model itself: the category's fastest-growing vendor is
now documented as running on contractor conditions substantial enough
to draw a dedicated investigative piece, which is a cost the
real-work-derived outcome record does not carry by construction (no
one is assigned graded tasks under deadline pressure to produce it).
Last observed 2026-10-07: [aiweekly.co: Forbes — Surge AI, Mercor, AfterQuery and Turing sold ~$500M/year to Chinese labs](https://aiweekly.co/alerts/forbes-surge-ai-mercor-afterquery-and-turing-sold-500myear-of-training-data-to), [Gazetteer SF: New troubles at Mercor](https://sf.gazetteer.co/new-troubles-at-mercor-infighting-face-time-slavery-and-inhumane-working-conditions).

Update 2026-10-14: Mercor made its first acquisition, announced
2026-07-09 and found this run rather than caught at the time — buying
Deeptune, an a16z-backed startup that builds reinforcement-learning
"environments" (simulated Excel, Salesforce, Slack, and similar tools)
for agents to practice tasks inside. Mercor's CEO, Brendan Foody, had
personally angel-invested in Deeptune's $43M Series A about three
months before buying the company outright, and framed the deal around
where he sees the training bottleneck moving: from raw labeling to the
environments models practice and get measured in. Read against this
map's own thesis, this is Category 1's largest-by-growth vendor moving
up-stack, from "pay a human to grade or generate on request" toward
"build the task and the verifier the model practices against" — closer
to CLAUDE.md §1's "verifier" territory than anything else this category
has done, though a constructed practice environment with a built-in
verifier is still a designed task, not a real deliverable joined
backward to its own generation history. Worth tracking whether Mercor
extends Deeptune's environments into anything that resembles an
outcome record rather than a graded simulation. Last observed
2026-10-14: [SiliconANGLE: Mercor buys Deeptune](https://siliconangle.com/2026/07/09/mercor-buys-deeptune-build-training-environments-ai-agents/), [Fortune: AI unicorn Mercor acquires Deeptune](https://fortune.com/2026/07/09/ai-unicorn-mercor-acquires-deeptune-brendan-foody-investor-a16z-openai-anthropic/).

Update 2026-10-26 (message, 24th run), two items missed across seven
prior passes over this entry. First: Mercor's APEX benchmark suite
(launched October 2025, named explicitly by Mercor's own research-team
post, 2026-10-08, as "whether frontier AI models can do professional
work") turned one year old this run's observation window and has
expanded from its original four domains to also cover software
engineering, with the stated mission to "measure models in the
environments where the work actually happens." That phrase, and the
post's own framing question ("how do you measure a model against a job
that AI itself is changing?"), is the same pitch-collision risk this
file already named for Surge's Tuesday Work Index (2026-10-07 update):
language close enough to CLAUDE.md §1's own "real work" framing that a
buyer could mistake it for a competing version of the outcome record.
It is not one: Mercor's own methodology page describes experts
authoring tasks, defining standards, and judging against a rubric,
which is still the "label supplied by a grader" structure CLAUDE.md §1
contrasts against, not a real deliverable joined backward to its own
generation history. Worth naming alongside the Surge entry in whatever
lab brief first has to explain the distinction, since this is now two
of the category's largest vendors using nearly identical language.

Second, more load-bearing: a supply-chain breach via the open-source
tool LiteLLM, disclosed by Mercor around 2026-03-31/04-04, exposed
roughly 4TB of contractor data (Social Security numbers, government
ID, facial biometric data, voice recordings, AI video-interview
footage), and Meta paused all its contracts with Mercor indefinitely
in response, with other frontier-lab customers reported reassessing
the relationship at the time. Mercor's own 2026-06-25 investigation
summary states the exposed scope was more limited than first reported
and that "all frontier model company customers had increased their
engagement over the past several months" since, though no source
found this run names Meta specifically as having resumed. Read against
this map's own neutrality thesis (Scale AI entry above, "a data vendor
that is perceived as compromised loses its top customers overnight"):
this is a different axis of the same question, and the two cases point
different ways. Scale's compromise was structural (an equity stake,
not reversible short of divestment) and its customer losses are not
reported as recovered. Mercor's compromise was operational (a security
incident, not an ownership change) and, by the vendor's own account,
customer engagement grew rather than collapsed in the following
months. Neither case is Ursa's own yet, since Minor has never sold
data to anyone, but it sharpens the "trust has a provenance axis too"
entry in docs/market/positioning.md: there may be more than one kind
of compromise a lab buyer judges a vendor on, and they are not
reported as equally durable. Last observed 2026-10-26: [Mercor: Why
Mercor is building a research team](https://www.mercor.com/blog/why-mercor-is-building-a-research-team/),
[Mercor: APEX methodology](https://www.mercor.com/apex/methodology/),
[TechCrunch: After data breach, $10B-valued startup Mercor is having a
month](https://techcrunch.com/2026/04/09/after-data-breach-10b-valued-startup-mercor-is-having-a-month/),
[AOL/Business Insider: Meta paused its work with AI training startup
Mercor after a data
breach](https://www.aol.com/articles/meta-paused-ai-training-startup-042644659.html),
BigGo Finance, "Mercor's annualized revenue tops $2 billion" (2026-06-25; link omitted here because the article's URL slug is itself UUID-shaped and trips the redaction gate's private-session-UUID check, see docs/market/briefs/2026-10-26-message-24.md).

### Prolific

What it is: an academic-research participant marketplace that has
shifted heavily into AI evaluation, RLHF, red-teaming, and specialist
data collection, reporting $350M in annualized revenue as of April
2026. Who it serves: both academic researchers and AI labs, with a
large (200,000+) vetted, identity-checked participant pool across 40+
countries. Pricing: no public per-task rate card; enterprise/API
engagement. Strengths: verification rigor (50+ identity/behavioral
checks per participant, 55% pool pass rate) is a genuine trust
differentiator among labeling vendors, closer in spirit to Ursa's own
consent architecture than most peers. Weakness against Ursa: the
underlying unit is still a study a participant opts into and completes
for pay, not a real task the participant was already doing for
themselves. Last observed 2026-09-26: [Prolific in 2025/2026](https://www.prolific.com/resources/prolific-in-2025-more-precision-larger-scale-and-stronger-safeguards-for-quality-human-data), [Prolific AI services](https://www.prolific.com/ai-services).

Update 2026-10-25: Sacra confirms the $350M figure is an April-2026
snapshot, not trailing revenue, and details the mechanism: corporate
customers pay a 42.8% platform fee on top of participant rewards,
while academic researchers pay a lower rate, and 2025 volume was
380,000 studies and 8M+ hours of human input. A trade-press social
post this week claims Prolific is "set to surpass $500 million"
annualized, but it links no filing or company statement, so recording
it as an unverified claim rather than a figure — the same treatment
the Scale AI S-1 rumor got on 2026-09-30. No pricing or product change
found. Weakness against Ursa unchanged. Last observed 2026-10-25:
[Sacra: Prolific](https://sacra.com/c/prolific/), [Business Post via X: Prolific nearing $500M annualized (unverified)](https://x.com/businessposthq/status/2055226729413726576).

### Invisible Technologies

What it is: an enterprise AI-data and applied-ops platform (five
modular products: Neuron, Atomic, Synapse, Axon, Expert Marketplace)
that grew from business-process outsourcing into RLHF after OpenAI
engaged it in 2022; now also serves Amazon, Microsoft, Cohere. Who it
serves: frontier and enterprise AI teams needing both data-labeling and
agentic workflow automation. Pricing: enterprise contracts; raised
$100M at a $2B+ valuation (reported 2025-2026). Strengths: breadth
(data plus workflow automation, not data alone) and multi-lab customer
base. Weakness against Ursa: same solicited-feedback structure as the
category, layered under enterprise-services positioning rather than a
consumer relationship of its own. Last observed 2026-09-26: [Invisible on Sacra](https://sacra.com/c/invisible/), [SiliconANGLE on the $100M raise](https://siliconangle.com/2025/09/16/ai-data-provider-invisible-raises-100m-2b-valuation/).

Update 2026-09-30: expanding beyond data-labeling into AI governance
and assessment — joined the World Economic Forum (January 2026) and
agreed to acquire WeCP, an AI-native technical-assessment platform
(announced March 2026). Reads as this labeling vendor converging
toward Category 2 below: a company that sells solicited feedback now
also wants to sell the grading rubric. Last observed 2026-09-30:
[Invisible Technologies Newsroom](https://invisibletech.ai/newsroom), [Yahoo Finance: Invisible joins WEF](https://finance.yahoo.com/news/invisible-technologies-joins-world-economic-140000900.html).

Re-checked 2026-10-25: no pivot, pricing move, or structural change
since the WEF/WeCP update. The company's own 2026 outlook (published
2025-12-02, so predates this entry's window but is the newest
strategy statement available) argues human-in-the-loop labor stays
necessary for "another decade" and that "the constraint will be
adoption, not capability" — a direct argument against the autonomous,
no-grader shape of Ursa's own bet, worth naming as the clearest
public disagreement with CLAUDE.md §1 found in this category. Only
other news since is two client case studies (Alliance Nationwide
Exposition, Orchestra of St. Luke's) and a reconfirmed $2.0B
valuation, neither a landscape-level change. Last observed 2026-10-25:
[Invisible: 2026 AI trends](https://invisibletech.ai/2026-trends), [QuantLogix: Invisible Technologies valuation](https://quantlogix.ai/private-company/invisible-technologies).

### Handshake AI

What it is: an expert network for frontier-lab RLHF and model
evaluation, built on the Handshake career platform's existing base of
roughly 18 million students and alumni across 1,600+ universities,
funneling credentialed talent (math, physics, computer science) into
model-training work through its MOVE Fellowship. Who it serves:
frontier labs wanting high-credential domain expertise; reportedly
eight of the top labs are customers, including OpenAI. Pricing: no
public buyer-side rate card; experts reportedly paid $100-125/hr, with
the business at roughly $1.1B in annualized gross revenue by April
2026. Strengths: a genuinely distinct talent-sourcing pipeline (an
existing 18M-person career network turned into a labor supply
overnight) rather than a labeling workforce built from scratch.
Weakness against Ursa: the identical structural gap as the rest of
this category — a credentialed expert paid to grade or generate on
request, not a person's own real work observed after the fact. New
entry, added this run. Last observed 2026-09-30: [Handshake: Introducing Handshake AI](https://joinhandshake.com/blog/our-team/introducing-handshake-ai/), [Annotation Academy: What is Handshake AI](https://annotation.academy/glossary/what-is-handshake-ai-and-how-does-it-work).

Update 2026-10-25: The Information's own exclusive puts the AI-training
unit's gross annualized revenue at nearly $1B, up from $550M in January
2026 and roughly $5-10M a year before that — a ~100x run-up in under
twelve months, and roughly flat against the $1.1B figure this entry
already tracked for April, meaning the growth curve has plateaued
rather than kept compounding since spring. The same reporting puts
contractor costs at 60-70% of gross revenue, so combined with its
college-recruiting business (total gross ARR ~$1.15B), net margin on
the AI-training side is thin and concentration risk is real: "losing
even one major client hits hard." That cost structure is the sharpest
contrast this map has found yet with Ursa Minor's own: Handshake pays
out 60-70 cents of every training-revenue dollar to the credentialed
experts doing the work, where Minor's labor is the unpaid byproduct of
someone doing their own real job anyway. Weakness against Ursa
otherwise unchanged. Last observed 2026-10-25: [The Information on X](https://x.com/theinformation/status/2044105942749315090), [Dealroom: Handshake's ARR crosses $1B](https://app.dealroom.co/news/note/handshake-s-arr-crosses-1b-as-ai-training-revenue-surges).

### Halluminate

What it is: a data research lab (fewer than 10 people, YC S25) building
reinforcement-learning "environments" and benchmarks for knowledge
work beyond coding, starting with finance — a "gym" is a Docker
container seeding real starting files (Excel, PowerPoint, raw data), a
task such as building an LBO model, and a verifier that scores the
result and feeds a reward signal back into post-training. New entry,
added this run after a $30M Series A (led by Oak HC/FT, announced
2026-10-01, bringing total funding to $38.5M, with individual
participation from researchers at Anthropic, OpenAI, and Meta)
surfaced it. Who it serves: already working with four of the top five
closed-source US labs, per Y Combinator's own announcement. Pricing: not public; venture-backed, not yet a
disclosed per-contract or per-environment rate. Strengths: a second,
independently funded vendor (after Mercor's Deeptune acquisition,
tracked in this entry's 2026-10-14 update) confirms "build the task
and the verifier" is a real, fundable sub-category now, not one
company's experiment. Weakness against Ursa, stated precisely: a gym
is still a constructed task with a built-in verifier the model is
scored against, closer to CLAUDE.md §1's "verifier" language than
Category 1's solicited-rating vendors, but still not a real
deliverable joined backward to its own generation history — nobody
"had a real LBO to build and happened to use this environment for it."
The reward comes from a simulation of work, not a record of work that
actually happened. Worth tracking whether this sub-category's
environments ever ingest real completed deliverables rather than
seeding constructed ones. Last observed 2026-10-24: [Oak HC/FT: why we led Halluminate's $30M Series A](https://www.oakhcft.com/blog-post/the-internet-has-run-out-of-things-to-teach-why-we-led-halluminates-30-million-series-a), [Y Combinator on X: Halluminate](https://x.com/ycombinator/status/2105682350814470399).

### TELUS Digital (TELUS International's AI data arm)

What it is: a publicly traded (TSX/NASDAQ: TIXT) BPO conglomerate's
AI-data division, offering RLHF, SFT, and annotation through a
proprietary "Fine-Tune Studio" platform, drawing on a self-described
"Global AI Community" of more than one million annotators, reviewers,
linguists and raters across 20+ domains and 100+ languages. New entry,
found this run via a practitioner's own byline (a staff AI engineer at
TELUS Digital) rather than a landscape sweep, which is itself worth
naming: a vendor at this scale had gone unlisted for a month because
nothing in the first four landscape passes surfaced it by name. Who it
serves: enterprise AI buyers broadly, not frontier-labs-only like
Surge; named a Leader in NelsonHall's 2026 NEAT evaluation for AI
enablement services, which NelsonHall's own analysis reportedly found
rates specialized RLHF services as carrying the highest client
satisfaction among AI-enablement buyers generally. Pricing: not
public; no rate card found. Strengths: scale (the million-annotator
figure dwarfs every other Category 1 entry's disclosed headcount) and
a packaged "structured rubrics for preference ranking, side-by-side
model comparison and output scoring" product, meaning the RLHF
pipeline itself is productized rather than bespoke per client.
Weakness against Ursa: the same structural gap as every other Category
1 entry, stated in TELUS's own marketing copy rather than inferred —
"structured rubrics" and "side-by-side comparison" are the solicited-
opinion mechanism CLAUDE.md §1 contrasts the outcome record against,
at the largest labor scale found in this file yet. Last observed
2026-10-25: [TELUS Digital: Data for AI Training](https://www.telusdigital.com/solutions/data-for-ai-training/data-validation-services), [TELUS Digital named Leader in 2026 NelsonHall NEAT Evaluation](https://www.telusdigital.com/about/newsroom/telus-digital-named-leader-in-2026-nelsonhall-neat-evaluation-for-ai-enablement-services).

### micro1

What it is: a human-data vendor supplying vetted domain experts (senior
engineers, doctors, lawyers, professors) to frontier labs for training
and evaluation, pivoted from an AI-recruiting business about a year
before this entry. New entry, found via this run's funding-news search
rather than a vendor-name sweep, the same method gap the 2026-10-25
TELUS Digital entry named. Who it serves: Microsoft, Amazon, robotics
firm 1X, and, per TechCrunch's 2025-09-12 report, OpenAI and Google
before they distanced themselves from Scale AI post-Meta — making this
the fourth named vendor in this map (after Mercor, Surge, Handshake) to
disclose picking up business from that same exodus. Pricing: not
public; the company itself has raised a $35M Series A (2025-09-12,
$500M valuation) and a $100M+ Series B (2026-09-23, $4B valuation, an
eightfold jump in twelve months). Revenue trajectory, three
independently dated sources: $7M annualized at the start of 2025, $50M
by September 2025, $500M by summer 2026, and a $1B annual run rate
reported 2026-10-13 — roughly 140x in under two years, the fastest
disclosed growth curve of any entry in this category. Headcount: ~180
staff across 14+ countries as of the $1B report. Strengths: the growth
rate itself, and a product build-out (Data Engine for expert-produced
datasets, an "Intelligence Platform" whose "Realm" component sells RL
environments where "experts recreate real-world scenarios") that makes
this the third independently-funded vendor pivoting into constructed
task-and-verifier environments, after Mercor's Deeptune acquisition and
Halluminate (both tracked above) — confirming that sub-category is now
a multi-vendor pattern, not a pair. Weakness against Ursa: the same
structural gap as every Category 1 entry (solicited expert labor paid
to grade or generate on request) plus the same caveat already applied
to Mercor's and Halluminate's environments — a constructed scenario
with a built-in verifier is not a real deliverable joined backward to
its own generation history. Last observed 2026-10-25:
[TechCrunch: micro1, a competitor to Scale AI, raises funds at $500M valuation](https://techcrunch.com/2025/09/12/micro1-a-competitor-to-scale-ai-raises-funds-at-500m-valuation/),
[Dealroom: micro1 raises $100M at $4B valuation for AI training data](https://dealroom.co/news/155583-micro1-raises-100m-at-4b-valuation-for-ai-training-data/),
[Dealroom: micro1 passes a $1B run rate with about 180 staff](https://dealroom.co/news/161913-micro1-passes-a-1b-run-rate-with-about-180-staff-three-years-after-nearl/),
[micro1.ai: Intelligence / Realm](https://www.micro1.ai/).

### Cross-cutting note (2026-10-26, 29th run): "build the task and the verifier" is a mapped ~42-company market, not three isolated pivots

This file has tracked the environments-and-verifiers sub-category one
vendor at a time as it was individually discovered: Mercor's Deeptune
acquisition (2026-10-14), Halluminate's Series A (2026-10-24), and
micro1's Realm product (2026-10-25). Each update named the pattern as
emerging without a sense of its size. rl-list.com, an independent
directory ("a transparent, source-cited RL-environment directory,"
last updated 2026-10-05, methodology page referenced but not fully
read this run) names 42 companies building "simulated tasks and worlds
used to train and evaluate AI agents with reinforcement learning,"
split into pure-play environment builders (AfterQuery, $30.5M raised;
Bespoke Labs, $40M; Fleet AI, $15M, replicating Salesforce/Excel/browser
workflows; Datacurve, $17.7M, expert-sourced coding environments and
the DeepSWE benchmark, adopted by Artificial Analysis's own Coding
Agent Index; Proximal, $15M; Chakra Labs, $10M; HUD, $16M),
infrastructure providers that sell compute rather than environments
(Modal, Daytona, E2B, Runloop, Morph), and incumbents moving in from
labeling (Scale AI, Snorkel AI, Mercor, Surge AI, all already tracked
above). Spot-checked Datacurve's own profile directly: no named
frontier-lab customers published, "frontier-lab relationships remain
unverified self-descriptions" per the directory's own caveat, the same
sourcing gap this file has flagged on vendor-authored figures
elsewhere.

So what: the weakness this file has stated three separate times
("a constructed scenario with a built-in verifier is not a real
deliverable joined backward to its own generation history") is not a
caveat on three companies, it is a caveat on an entire, already-funded
sub-category at least 42 names deep, plus every Category 1 incumbent
now entering it. None of the three vendors checked individually so far
(Mercor/Deeptune, Halluminate, micro1/Realm) has been shown to ingest
a real completed deliverable rather than a constructed one, and this
run did not find a fourth that does either — the gap scales with the
market rather than closing as it grows. Worth citing in whatever lab
brief first has to explain why Minor's outcome record is a different
object than a gym: the comparison now needs to hold against a market,
not a handful of named competitors. No landscape entry opened for any
individual name in the 42; the next run with capacity to spare should
pick two or three of the better-funded, not-yet-checked ones (AfterQuery,
Bespoke Labs, Fleet AI) and test them against the same "real deliverable
or constructed one" question Halluminate and micro1 already got. Ledger
proposal below. Last observed 2026-10-26: [rl-list.com: RL Environment
Vendors](https://www.rl-list.com/), [rl-list.com: RL Environments for
Coding](https://www.rl-list.com/rl-environments-for-coding), [rl-list.com:
Datacurve vendor profile](https://www.rl-list.com/vendors/datacurve).

**Update (2026-10-26, 30th run): the three better-funded names this
note asked the next run to check all come back "authored," same as
the first three.** Read each vendor's own product page directly.
Bespoke Labs states its own approach in its own words — "company-scale
simulations with real codebases and microservices" — and names no
frontier-lab customer, only "Frontier Labs" and "Neolabs" as audience
categories. Fleet AI's own language is "gyms" that "replicate"
enterprise software (Salesforce, Excel); rl-list.com's vendor profile
states plainly that "no lab customer is named or verified" and that
Fleet's only named customer segment (financial services and insurance)
is a self-claim from its own blog, not third-party-confirmed.
AfterQuery is the one worth a caveat rather than a clean "authored":
its page emphasizes 300,000+ "verified practitioners" producing
"expert-demonstrated trajectories" from real professional domains
(medicine, law, finance), which reads closer to this file's standard
than a purely synthetic gym does. But a practitioner demonstrating a
task on request, for the purpose of generating training data, is still
not the same object as a deliverable that existed because the
practitioner's actual work needed it done — it is demonstration data
collected to train on, not a deliverable joined backward to its own
generation history after the fact. On the evidence on these three
public pages, none crosses the line from constructed to real. Tally
now 6 of 42 checked, 6 of 6 "authored." So what: six of six is still a
thin fraction of 42, but it is now twice the sample run 29 had, in the
same direction, including the two best-funded unchecked names
(Bespoke Labs $40M, Fleet AI's reported $750M valuation talks). The
next checkable step, if the lab brief needs a cheaper path than another
round of one-by-one vendor fetches, is a keyword sweep of rl-list.com's
own listing text across all 42 for any vendor that itself claims
real-deliverable ingestion rather than authored-scenario construction,
which would surface a positive case faster than continuing to sample
blind. Ledger proposal below. Last observed 2026-10-26: [AfterQuery:
AI Training Data Products](https://www.afterquery.com/products),
[Bespoke Labs](https://bespokelabs.ai/), [rl-list.com: Fleet AI vendor
profile](https://www.rl-list.com/vendors/fleet-ai).

**Update (2026-10-26, 31st run): a full-directory sweep of all 42
names found one closer case than the six already checked —
Idler — and it still reads as constructed, not real-deliverable.**
Read rl-list.com's own listing text for every one of the 42 names in
one pass (both the main vendor directory and the RL-environments-for-
coding subpage), per the 30th run's ledger proposal, instead of
continuing one-by-one spot-checks. One name's own language stands
apart from the other 41: Idler (YC S25, $9M seed led by Paradigm,
launched August 2026) describes its environments as built "from real
production work." Its two named environments are specific: ShelfLife
is "a digital twin seeded with the complete operational data of a
live, profitable, growing multi-brand retailer running 9 stores, 3
commerce platforms, and a multi-supplier sourcing operation," drawing
"200 environments... from the company's operational data over the
past decade"; CorpLaw is "built from a real law firm's anonymized
data," with grading "grounded in the work the firm produced." That is
a more specific real-sourcing claim than anything else in the
directory — Fleet AI's "gyms" that "replicate" software, Bespoke
Labs' "company-scale simulations," and Andromede's environments
"programmatically generated... from real-world data" all name no
specific real company as their substrate.

It still does not cross the line CLAUDE.md §1 draws. Idler's own term
for ShelfLife is "a digital twin": a constructed reproduction seeded
with that company's historical data, not the company's live system or
a real deliverable its own operators produced and judged after the
fact. The task Idler grades against ("can you deploy an agent in a
leadership role within this company, and trust it to execute with
appropriate judgment and precision") is an authored evaluation
question put to a simulation, not an outcome real work was put
through. Idler also names no customer by name ("the world's leading
frontier labs" use it, per its own site, none identified), the same
unverified self-claim pattern every other checked name in this
sub-category has. Tally: 7 of 42 now examined individually (6 by
direct spot-check across the 29th and 30th runs, 1 by this run's
sweep), 7 of 7 authored-not-real. The sweep of the other 35 names' own
listed text in the same pass found no other candidate worth a closer
look; most describe themselves plainly as "gyms," "simulations,"
"sandboxes," or "digital twins" with no real-production-data claim at
all.

So what: this is the strongest evidence yet for the market-wide
claim, covering the full named directory in one pass rather than a
sample of it, and it still holds. It is also a sharper sentence for a
lab brief than a clean sweep would have been: "even the one vendor in
this mapped market whose own marketing leans hardest on real
operational history still builds a constructed digital twin rather
than ingesting the real deliverable, and grades agents against an
authored judgment question rather than what the business's own work
actually did with the output" tests the line against the market's
hardest case instead of skipping past it. Positioning consequence in
docs/market/positioning.md. Last observed 2026-10-26: [rl-list.com: RL
Environment Vendors](https://www.rl-list.com/), [rl-list.com: RL
Environments for Coding](https://www.rl-list.com/rl-environments-for-coding),
[rl-list.com: Idler vendor profile](https://www.rl-list.com/vendors/idler),
[YC Launch: Idler](https://www.ycombinator.com/launches/SxT-idler-push-the-frontier-of-your-model),
[runtimewire: Idler launches AI data lab after a $9M Paradigm-led seed](https://runtimewire.com/article/idler-launches-ai-data-lab-9m-paradigm-seed).

## Category 2 — Evaluation and arena products

These produce a preference-shaped signal (a human or a rubric choosing
between outputs) but the shape is a **benchmark**: curated or
self-selected prompts, judged for how the answer looks, not whether
real work used it. This is the gap CLAUDE.md §1 names directly: "the
label is supplied by a grader" is exactly what these products still
are, even the ones built on real human votes.

### LMArena (renamed "Arena", arena.ai, January 2026)

What it is: the direct-comparison chatbot leaderboard — two anonymous
model outputs, a human vote, aggregated into Elo. Who it serves: labs
racing for leaderboard position, plus a public audience that treats the
rankings as a proxy for model quality. Pricing: free to use and browse,
no account required; the company itself raised a $100M seed (May 2025,
$600M valuation) then a $150M Series A (January 2026, $1.7B valuation).
Strengths: massive scale (7M+ votes, 360+ models as of 2026) and
genuine human judgment rather than an automated rubric. Weakness
against Ursa: the vote is a stated, in-the-moment preference on a
prompt nobody actually needed answered for real reasons — closer to the
"stated-preference survey" the vision doc's third principle warns
against than to revealed preference from finished work. Last observed
2026-09-26: [LMArena, Wikipedia](https://en.wikipedia.org/wiki/LMArena), [Arena (AI platform), Wikipedia](https://en.wikipedia.org/wiki/Arena_(AI_platform)).

Update 2026-09-30: reached $100M in annualized run-rate revenue as of
June 2026, eight months after launching its commercial product — the
fastest revenue ramp observed in any category this map covers. Its
Fall 2026 Academic Partnerships cycle opens with proposals due October
30, 2026. Last observed 2026-09-30: [TechCrunch: Arena is now a $100M business](https://techcrunch.com/2026/06/29/arena-the-ai-leaderboard-everyone-uses-is-now-a-100m-business/).

Update 2026-10-24: a $200M Series B (co-led by Lightspeed and Khosla,
announced 2026-10-08) nearly doubled the valuation this entry tracked
in January, from $1.7B to $3.1B, and the revenue behind it is
concentrated among "a small number of high-ACV customers": frontier
labs and large enterprises paying consumption-based for evaluation
campaigns, not a broad self-serve base. Same day, Arena shipped the
Alignment Index: 27 models scored across 90,000 sampled real-world
agent sessions on three failure signals (Unauthorized Action, False
Attribution, Deceptive Completion), each defined by a written rubric
and applied by an LLM judge, with definitions stated as inspired by
language already in OpenAI's and Anthropic's own system cards. The one
reported finding worth carrying into positioning.md: misalignment rate
roughly doubles when conversation length doubles, a trajectory effect
rather than a single-turn one. A trade-press review (Forkast) flagged that Arena has not disclosed its scoring weights or
any confidence interval, and that no scored lab has publicly
contested its own ranking yet, so the index is new, unaudited, and
unconfirmed by the vendors it scores.

Read against CLAUDE.md §1: this is the single most well-funded
competitor in this entire map moving its raw material from
curated/self-selected prompts toward real agent sessions, which is a
market vote that "what actually happened" beats "what a rater
compared." It still does not close Ursa Minor's own gap. The label is
an LLM judge applying a written rubric to a sampled session for a
safety/compliance proxy, not a record of whether a real deliverable
built from that session's output survived contact with a real task.
Closer raw material, same grader structure. Last observed 2026-10-24:
[Arena blog: LMArena is now Arena](https://arena.ai/blog/lmarena-is-now-arena),
[Arena on X: Alignment Index methodology](https://x.com/arena/status/2108226499560214777),
[Arena on X: Series B announcement](https://x.com/arena/status/2108227730114580501),
[Forkast: Beyond the Elo — Assessing the Arena Alignment Index](https://forkast.news/beyond-the-elo-assessing-the-arena-alignment-index/),
[Sacra: Arena revenue, valuation & funding](https://sacra.com/c/lmarena/).

### Artificial Analysis

What it is: an independent LLM leaderboard and analysis firm ranking
250+ models on an "Intelligence Index" plus price, speed, and context
window. Who it serves: buyers (enterprises, developers) picking a model
for a workload, and labs citing it competitively. Pricing: leaderboard
is free and public; the firm's deeper analysis/reporting products are
not fully priced in public search results. Strengths: multi-axis
comparison (not just quality) makes it a genuine buyer's tool, and its
independence from any single lab gives it some of the neutral-referee
credibility Ursa is also trying to earn. Weakness against Ursa: still a
benchmark-suite score, static and gameable to the same "measure, not
the world" failure mode the vision doc's fourth principle names, with
no link back to whether any real deliverable used the model's output.
Last observed 2026-09-26: [Artificial Analysis leaderboard](https://artificialanalysis.ai/leaderboards/models).

Update 2026-10-25: the leaderboard now runs on Intelligence Index v4.2,
with scores dated as recently as 2026-10-23 and Anthropic's Claude
Fable 5.1 reported leading the index, OpenAI's GPT-6 Astra close
behind. No funding or pricing news surfaced for the firm itself this
pass. The update confirms rather than changes the standing read: a
single composite score, however frequently refreshed, is still a
constructed-benchmark number with no link back to whether a real
deliverable used the model's output. Last observed 2026-10-25:
[Announcing Artificial Analysis Intelligence Index v4.2](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v4-2).

### Vals AI

What it is: an independent AI-evaluation startup benchmarking frontier
models on "economically valuable tasks" (finance, law, healthcare,
coding, cybersecurity) using private test sets vendors can't train
against, explicitly positioning itself as "the credit rating agency of
AI models" (TechCrunch's framing). Who it serves: enterprises choosing
models for regulated or high-stakes domains, plus the labs themselves.
Pricing: not public; the company raised a $40M Series A led by a16z
(reported August 2026) at a ~$400M valuation, revenue reportedly 8x
year-over-year with headcount from 8 to 25 in 2026. Strengths: domain
specificity (finance/law/healthcare rather than generic chat quality)
and private, non-trainable test sets address benchmark-contamination
concerns directly. Weakness against Ursa: it is still a constructed
task set graded against an answer key, the textbook case of a
central-assessment claim the vision doc's fourth principle flags —
performance on Vals's tasks says nothing about a model's revealed
performance on a user's own unscripted work. Last observed 2026-09-26:
[TechCrunch on Vals](https://techcrunch.com/2026/09/19/vals-backed-by-andreessen-horowitz-is-looking-to-become-the-gold-standard-for-ai-benchmarking/), [Vals AI benchmarks](https://www.vals.ai/benchmarks).

Update 2026-10-25: since the $40M Series A closed in September, Vals
has shipped a new domain-specific index at a pace of roughly one every
one to three days this month alone: Vals Index v2.2 (Oct 19, tightening
grading across five existing sub-benchmarks), Vals Science Index (Oct
16), Vals Router Index and ClaimBench (Oct 20), Vals Finance Index and
a Web Search Index update (Oct 21), Vals Inference Provider Index (Oct
22), Vals Legal Index (Oct 23). This is the clearest evidence this
cycle of a well-funded competitor scaling exactly the construction the
vision's fourth principle flags: a private, non-trainable answer key
per domain, expanding domain by domain, rather than a verifier that
reads what survived in a real deliverable. Worth a line in this week's
"Moves." Last observed 2026-10-25: [Vals AI News](https://www.vals.ai/news).

## Category 3 — Personalization and memory layers

These are the closest analog to Ursa Major's consumer promise (an AI
that already knows you) but every one is either developer
infrastructure you embed inside one app, or a single vendor's walled
garden. None of them is a profile the *user* owns and carries between
vendors' models. That portability, and the user-side ownership and
control (CLAUDE.md's non-negotiable #2), is Ursa Major's entire
differentiation from this category.

### Mem0

What it is: the most widely adopted open-source-rooted memory layer for
AI agents and apps, adding persistent, cross-framework memory with a
few lines of code. Who it serves: developers building agents/apps
across 21+ frameworks (LangChain, CrewAI, etc.), not end users
directly. Pricing: free Hobby tier (10K memories), Starter $19/mo, Pro
$249/mo (unlocks graph memory and SOC 2/HIPAA docs), custom Enterprise.
Backed by $24M from YC, Basis Set Ventures, Peak XV. Strengths:
adoption breadth and low integration friction. Weakness against Ursa:
the memory belongs to whichever app integrated Mem0, not to the end
user; a user has no way to see or carry "their" Mem0 memory from one
app to an unrelated one the way an Ursa Major profile is designed to
move between Claude, ChatGPT, and Gemini. Last observed 2026-09-26:
[Mem0 pricing](https://mem0.ai/pricing), [Mem0 Series A announcement](https://mem0.ai/series-a).

Update 2026-10-25: Mem0 shipped a single-pass "ADD-only" extraction
algorithm (one LLM call, no UPDATE or DELETE; memories accumulate
rather than get revised), claiming 93.4% on LongMemEval and 91.6% on
LoCoMo at under 7,000 tokens per retrieval versus 25,000+ for a
full-context baseline. Adoption now reported around 63k GitHub stars,
and the project is used as a memory provider inside AWS's own agent
tooling — the widest distribution of any product in this category.
Pricing unchanged (Starter $19/mo, Pro $249/mo). The "ADD-only, never
revise" design is a structural data point for Ursa's own case: this
category's leading product by adoption still has no notion of a
correction overwriting a stale fact, let alone a user-facing
edit/delete surface. Weakness against Ursa otherwise unchanged. Last
observed 2026-10-25: [FourWeekMBA: Mem0's memory build cost](https://fourweekmba.com/ai-mem0s-memory-build-cost-more-than-full-context-study-finds/).

### Letta (formerly MemGPT)

What it is: an open-source platform for "stateful agents" — an
LLM-as-operating-system architecture where the agent manages its own
core and archival memory (Postgres + pgvector) and edits it over time.
Who it serves: developers building agents that need to persist and
self-manage state across sessions, e.g. a support agent that keeps
learning from a Discord community. Pricing: open-source core, hosted
offering; no consumer pricing surfaced. Strengths: technically the
deepest of the memory-layer products in the sense that the agent
authors its own memory rather than a pipeline extracting facts for it.
Weakness against Ursa: same as Mem0, the memory is scoped to one
deployed agent, not a portable, user-owned profile, and there is no
consent/edit/delete surface built for the end user rather than the
developer. Last observed 2026-09-26: [Letta GitHub](https://github.com/letta-ai/letta), [Letta on agent memory](https://www.letta.com/blog/agent-memory/).

Update 2026-10-25: Letta shipped FrontierMemory (Oct 2026), a benchmark
comparing agent harnesses on continual learning, following Context
Repositories (git-based memory, Feb), Context Constitution (Apr), and
a "Memory Models" research post (Jun) on memory-native RL. The
through-line across all four: Letta's own framing is now "agents that
carry their memory and learning across model generations," which
reads close to Ursa Major's portability pitch in words. It stays
structurally different in substance: the memory Letta describes is
still one deployed agent's internal state, authored and read by that
agent, with no user-facing consent, edit, or delete surface and no
notion of a person's profile moving between separately-run agents or
vendors. Worth tracking because the rhetoric is converging even where
the architecture has not. Last observed 2026-10-25: [Letta: Memory Models — Towards Agents That Learn](https://www.letta.com/blog/towards-agents-that-learn/), [Letta Research](https://www.letta.com/research/).

### Zep

What it is: a "context engineering platform" for AI agents built on
Graphiti, an open-source temporal knowledge-graph memory engine
(28,000+ GitHub stars). Who it serves: developers who need
entity-resolved, time-aware memory (not just flat fact storage) inside
their own agent products. Pricing: free tier (10K credits/month), then
a jump straight to $125/mo ($104/mo annual) with no mid-tier, credits
metered by data volume ingested. SOC 2 Type II and HIPAA certified.
Strengths: the temporal/graph model captures how a fact changes over
time, which is closer to Ursa's own trajectory-metadata idea
(CLAUDE.md §1) than a flat memory store. Weakness against Ursa: still
single-app infrastructure with no user-facing ownership surface —
the graph belongs to the developer's product, and there is no path for
a user to take their Zep graph to a different AI vendor. Last observed
2026-09-26: [Zep agent memory product page](https://www.getzep.com/product/agent-memory/), [Zep vs Mem0 comparison](https://vectorize.io/articles/mem0-vs-zep).

Update 2026-10-25, a real pricing and packaging move: Zep deprecated
its self-hosted Community Edition. Self-hosting now means standing up
Graphiti directly against your own Neo4j, FalkorDB, or Kuzu instance,
with none of the managed layer Community Edition used to provide.
Zep Cloud's tiers were restructured at the same time: the free tier
dropped from 10,000 credits/month to 1,000, and the single paid tier
that used to start at $125/mo was replaced by a $25/mo "Flex" tier
(20,000 credits) plus custom Enterprise, with every feature — temporal
modeling, graph traversal, the full Graphiti engine — available at
every tier rather than gated by plan. Net effect: a materially cheaper
entry price, paired with the free self-hosting path getting harder to
operate. This is the kind of concrete pricing move positioning.md's
price ladder should carry; added there this run. Weakness against
Ursa unchanged: still infrastructure the developer's product owns, not
a profile the end user owns and carries. Last observed 2026-10-25:
[Vectorize: Mem0 vs Zep (Graphiti)](https://vectorize.io/articles/mem0-vs-zep).

### ChatGPT Memory (OpenAI)

What it is: OpenAI's native, first-party memory feature — as of the
June 2026 rollout, a single unified system that extracts facts from
conversations, uploaded files, and connected apps into an editable
memory summary, with per-project and (Android beta) per-chat controls
added through August 2026. Who it serves: ChatGPT's own consumer user
base directly; this is the feature Ursa Major's value proposition is
most directly a bet against. Pricing: included with ChatGPT access
(free and paid tiers), no separate charge. Strengths: zero integration
friction because it is built into the product the user already uses
daily, and OpenAI has been steadily improving user-facing edit/delete
controls, which narrows the transparency gap Ursa Major is counting on.
Weakness against Ursa: it is a walled garden by construction — the
memory does not, and structurally cannot, follow the user to Claude or
Gemini. That non-portability is the exact gap Ursa Major's "portable
across every model" promise is built to fill, and it is also the
starkest test of that promise: OpenAI has every incentive to keep
closing the UX gap without ever opening the portability one. Last
observed 2026-09-26: [OpenAI: Memory and new controls for ChatGPT](https://openai.com/index/memory-and-new-controls-for-chatgpt/), [ChatGPT memory guide, 2026](https://www.datastudios.org/post/can-chatgpt-remember-previous-conversations-memory-behavior-session-limits-and-persistence).

Update 2026-09-30: OpenAI shipped "Memory Sources" across all ChatGPT
plans, giving users direct visibility into exactly what saved
memories, past chats, or knowledge files informed a given response,
with controls to manage each source individually. This narrows the
transparency half of this entry's "weakness against Ursa": OpenAI is
no longer just improving edit/delete controls, it is now surfacing
per-response provenance, which is close in spirit to the auditability
Ursa Major claims as differentiation (CLAUDE.md §3). What does not
narrow is portability: this is still a single-vendor memory that
cannot follow the user to Claude or Gemini. Worth taking seriously as
a sign OpenAI is closing gaps faster than last week's entry assumed,
rather than dismissing it. Last observed 2026-09-30: [OpenAI: Memory and new controls for ChatGPT](https://openai.com/index/memory-and-new-controls-for-chatgpt/).

Update 2026-10-05: last run's read that the transparency gap had
narrowed needs a correction. OpenAI launched "Dreaming" on 2026-06-04
(internally, reportedly "Dreaming V3"): a background process that
synthesizes and rewrites what ChatGPT remembers across years of
conversation without the user asking it to save anything, and the
Memory Summary page is the user-facing surface for reviewing and
editing that output. A dated, sourced critique published two days
after launch (2026-06-06) found a disconnect: editing an entry in the
Memory Summary only changes recent conversation history, not the
underlying "User Knowledge Memories" that actually drive responses, so
the summary "regenerates each time users access it, surfacing
different memories each time," and an edit a user makes does not
reliably persist against what the model actually uses. The author's
read is that this is very likely a cost workaround (regenerating full
memory state on demand for every user, every time, is expensive), not
a design choice meant to mislead, but the practical effect is the same
either way: the edit surface and the surface that actually drives the
model's behavior are not the same thing. This matters directly for
Ursa Major's "fully inspectable, fully editable" claim (CLAUDE.md
non-negotiable #2) — if true end-to-end editability (an edit a user
makes is guaranteed to be what the model uses next) is something Major
can demonstrate and OpenAI's shipped feature cannot, that is a sharper,
more defensible differentiation than last run's "transparency gap
closing" read allowed for. Not verified independently this run; worth
a direct product test next time rather than taking one critique at
face value. Last observed 2026-10-05: [OpenAI: Dreaming launch](https://alternativeto.net/news/2026/6/openai-launches-scalable-dreaming-memory-system-for-chatgpt/), [shloked.com: ChatGPT's Memory Update Has a Packaging Problem](https://www.shloked.com/chatgpt-memory-2026).

Update 2026-10-26: OpenAI rolled out "Locked Chats" starting
2026-10-20 (all tiers, desktop/web/mobile) — a PIN- or biometric-gated
space where locked conversations are hidden from history, pinned
chats, and search, and draw on a separate memory shared only among
locked chats. This is a privacy/visibility feature, not a portability
one: OpenAI's own documentation states locked chats are not end-to-end
encrypted and does not change how long OpenAI retains the underlying
data or delete what the model already learned before a chat was
locked. No change to this entry's weakness against Ursa; flagged as a
landscape move because it is new product surface, not because it
narrows or widens the portability gap. Last observed 2026-10-26:
[Android Authority: ChatGPT rolls out locked chats](https://www.androidauthority.com/chatgpt-rolls-out-locked-chats-3725766/).

### Claude Memory Import (Anthropic)

What it is: a feature Anthropic added to Claude in July 2026, labeled
"experimental and still in active development," that lets a user
extract their stored memory from a rival assistant (ChatGPT, Gemini,
or Grok, via a generic prompt Anthropic provides) and paste the result
into Claude, which parses it into Claude's own editable memory
entries. New entry, added this run because it is the most directly
on-point move any frontier lab has made in this category: an explicit
answer to "how do I bring what another AI already knows about me."
Who it serves: Claude's own user base, specifically people switching
in from a competitor. Pricing: included with Claude access, no
separate charge. Strengths: materially lowers the cost of switching
into Claude, which is a real, user-facing improvement over having to
re-teach a new assistant from zero. Weakness against Ursa, and the
sharpest one in this entire map: the import is one-directional and
lossy. It is a one-time copy-paste, not a sync; it carries over
communication preferences, personal details, project context, and
technical settings, but not chat history, uploaded files, or Custom
GPTs; and critically, Claude accepts imports from competitors but does
not export in a form a competitor could read back — an independent
test of seven memory products (Claude included) found none of them
achieve "import symmetry," the property that a competing platform can
read a given product's export and reconstruct the memory with
structure, attribution, and timestamps intact. This is not portability
in the sense Ursa Major promises (a profile the *user* owns and can
move in either direction between any model); it is a funnel built to
acquire switchers, pointed in exactly one direction. It is also the
clearest evidence yet of CLAUDE.md §5's central strategic problem in
action: the platform most capable of building true portability has
instead built a feature that makes portability look solved while only
solving acquisition. Last observed 2026-10-05: [PrimeTimer: Anthropic opens gate for importing memories from ChatGPT, Gemini to Claude](https://www.primetimer.com/features/anthropic-opens-gate-for-importing-memories-from-chatgpt-gemini-and-more-to-claude-in-a-new-gamechanger-update), [dev.to: I Tested 7 AI Memory Products for Portability — All 7 Lock You In](https://dev.to/stantyan/i-tested-7-ai-memory-products-for-portability-all-7-lock-you-in-31pm).

Update 2026-10-14, a correction to last run's "one-directional" read:
Anthropic's own support page (last updated per the page itself
2026-09-02, found this run) now documents export alongside import,
titled "Importing and exporting your memory from Claude." The export
mechanism is the same shape as the import: a user asks Claude in chat
to write out its memories verbatim, or views them under Settings, then
copies that text out by hand. There is no named file format, no API,
and the page does not say or imply that ChatGPT or Gemini could read a
Claude export back in automatically — the stated path for taking memory
elsewhere is still "copy the text, paste it into the other service." So
the correction is narrower than it first looks: Claude is no longer
import-only, but what it ships is a second manual copy-paste direction,
not a machine-readable round trip a rival platform ingests on its own.
This still falls short of "symmetric" in the strict sense tested in
positioning.md (structure, attribution, and timestamps preserved
automatically across a read-back), and last run's dev.to seven-product
test predates this page, so it has not been re-run against Claude's
current export. Worth a direct product test before leaning further on
either "one-directional" or "symmetric" as the precise word. Last
observed 2026-10-14: [Claude support: Importing and exporting your memory from Claude](https://support.claude.com/en/articles/12123587-importing-and-exporting-your-memory-from-claude).

### Gemini Personal Intelligence (Google)

What it is: a cross-app memory layer, reaching all free Google accounts
in the UK and more widely through 2026, that lets Gemini and AI Mode in
Search draw context from Gmail, Google Photos, Drive, and other
first-party apps instead of requiring the user to paste it in. New
entry, added this run; missed by every prior sweep of this category
despite being a frontier-lab memory feature on the same axis as ChatGPT
Memory and Claude Memory Import. Who it serves: Google's own consumer
accounts. Pricing: included, no separate charge. Strengths: the deepest
first-party data reach of any entry in this category, because it draws
on a decade of email and photo history most users already have rather
than asking them to restate anything. Consent framing: opt-in, and
Google's own coverage states this is deliberate — the feature requires
explicit enablement, unlike the always-on-by-default memory ChatGPT and
Claude ship outside the EEA/UK.

Weakness against Ursa, and the reason this is not simply a point for
Google's side of last run's open question: on 2026-10-16, Google
updated its privacy policy to remove language that previously excluded
Gmail, Drive, and Photos content from ad personalization, replacing it
with a carve-out — that data stays out of ad targeting "unless you
choose to make data from these services available to other Google
services that support personalized ads," which is exactly what
enabling Personal Intelligence does. The opt-in gate is real, but what
sits behind it is not just better answers; it is eligibility for ad
targeting on the same Gmail and Photos content the feature reads. This
is the sharpest concrete case found yet for why "did you consent
before inference happened" (last run's finding) is not by itself a
sufficient promise: Google can truthfully say Personal Intelligence is
opt-in while the thing the user is opting into also opts their content
into advertising. CLAUDE.md's non-negotiable #1 (Ursa Major never
monetizes the user directly) is the exact axis this case argues for
naming explicitly, not just "opt-in happened" or "you can see what was
inferred." Last observed 2026-10-26: [9to5Google: Google will target
ads based on Gmail, Photos data if Personal Intelligence is
enabled](https://9to5google.com/2026/10/23/google-will-target-ads-based-on-gmail-photos-data-if-personal-intelligence-is-enabled/),
[DataCamp: Gemini Personal Intelligence](https://www.datacamp.com/blog/gemini-personal-intelligence).

**Update, 2026-10-27 (message, 3rd run): the opt-in claim does not even
hold consistently across Google's own pages.** Android Police's launch
review (published 2026-01-22, newly read this run) found Google's blog
stating Gemini "doesn't train directly on your Gmail inbox or Google
Photos library" while Google's own support page for the same feature
states, twice, that connected-app data "is used to improve Google
services, including training generative AI models" — a direct
contradiction inside Google's own documentation, not a reading the
reviewer had to construct. The same review found human review of this
data defaults to on: the user has to actively opt out of having their
Personal Intelligence data reviewed by people, which is the opposite
default from the feature's own "opt-in" framing. So what: this is not a
second instance of the ad-targeting gate already recorded above. It is
evidence that even a lab that ships a genuine opt-in control can leave
its own public claims about what that control does inconsistent nine
months after launch, which argues that a single, internally consistent
statement of what consent triggers is itself part of what "ask before
you infer" has to mean, not just the on/off switch. Last observed
2026-10-27: [Android Police: Google says Personal Intelligence is
private, but the reality is a privacy
disaster](https://www.androidpolice.com/googles-personal-intelligence-is-a-privacy-disaster/).

### MemHub (Tencent Hunyuan Hy-Memory)

What it is: a local-first desktop-and-CLI product, open-sourced this
month under Apache-2.0 as part of Tencent Hunyuan's Hy-Memory
agent-memory stack (github.com/Tencent-Hunyuan/Hy-Memory). It unifies
conversation history and coding traces from several user-authorized AI
applications (its own README names Claude Code, Cursor, Codex,
OpenCode, and Qwen Code) into one local SQLite store
(`~/.one-memory`) under a managed local runtime, enabling what the
README calls "governed cross-application memory recall." New entry,
flagged to this seat by Ursa's research seat (finding 40,
docs/research/briefs/2026-10-24-message-2.md).

Who it serves: developers and power users running several AI coding
tools who want one consolidated memory instead of one per tool.
Pricing: free, Apache-2.0, self-hosted.

Strengths: four of the five things Ursa Major's own value proposition
claims to be are now demonstrated as free, open-source, shipped
software rather than an unverified promise from an in-house product.
Local-first processing: confirmed, data lives in a local SQLite file
outside any package or runtime directory. Explicit authorization:
confirmed, its README describes source-reading, model-processing, and
host-reading as three independent authorization boundaries a user
grants separately. User-run deletion: confirmed, a standalone `memhub
delete-data` command that only deletes after the runtime has stopped
and a second confirmation of the exact path. Consolidation across
several AI applications: confirmed, that is the product's stated
purpose.

Weakness against Ursa, read carefully rather than assumed: the fifth
property, portability of a user's consolidated profile to a model
vendor other than the ones already feeding it (the first clause of
Ursa Major's own value proposition), is not documented on any surface
checked so far. This run read the top-level README and the full
`memhub/README.md` (both in the original Chinese) and ran a code-level
search of the whole repository for export-shaped files beyond those
two documents. What exists is `memhub/scripts/export_public_snapshot.py`
(a maintainer tool for publishing a demo snapshot, not a user-facing
feature), `memhub/apps/web/src/diagnostics-export.ts` (crash/diagnostic
logs), and an `imports/` module (`chat_exports.py`,
`sources/exported.py`) that parses *other* tools' export files to
ingest them, which is the import direction, not export. Nothing found
moves a user's consolidated memory out to a model the stack does not
already govern. The product site and the `hy_memory/` SDK docs are
still unread, so this absence claim is bounded to the README and
code-search surfaces checked this run, the same shape of bound
research placed on its own narrower read (memhub/README.md only).

Why this entry matters beyond its own bound: it is a direct
demonstration of CLAUDE.md §0's fourth load-bearing constraint, "the
software is explicitly not the moat," built and given away for free by
the exact category of actor §5's strategic note names as
simultaneously platform, customer, and the party most able to end us.
See docs/market/positioning.md, "Software parity is not position
parity," for the read on what that costs Ursa and what it does not
touch. Last observed 2026-10-24: Tencent-Hunyuan/Hy-Memory,
`README.md` and `memhub/README.md`, read in full
(github.com/Tencent-Hunyuan/Hy-Memory).

Update 2026-10-24 (correction, same day): the paragraph above
undersells the import side of the "fifth property" and the correction
is worth stating precisely rather than folded in silently. Reading the
repository's own file tree directly (`gh api
repos/Tencent-Hunyuan/Hy-Memory/git/trees/main?recursive=1`), the
`imports/` module is not the two generic files first reported. It is
eleven named, per-vendor adapters under
`memhub/apps/core/src/one_memory/imports/sources/`: `claude_code.py`,
`codex.py`, `cursor_unified.py`, `deepseek_harness.py`, `hermes.py`,
`openclaw.py`, `opencode.py`, `pi.py`, `qwen_code.py`, `qwenwork.py`,
and `workbuddy.py` (a twelfth file, `cursor.py`, appears superseded by
`cursor_unified.py`, which is the one the source registry actually
wires in). Each is registered with a `VerificationLevel` field
(`host_packages.py`) of either `fixture_only` or `real_replayed`;
several of the eleven, including Claude Code, Codex, and the Cursor
adapter, are tagged `real_replayed` rather than `fixture_only`, and
each tracks a `source_version` string. So the inbound direction is not
an undocumented afterthought: it is eleven maintained, versioned,
some-verified-against-a-real-install adapters, one per rival product.
A user can already carry their history out of eleven competing tools
and into this one, under a permissive licence, today.

What stays absent, now bounded more precisely than "no export found":
the backup-restore contract (`memhub/packages/contracts/src/backup-restore.ts`)
defines a `backup_restore_source_outside_home` failure code and its
own comment states plainly that "Core... accepts only managed sources
under the One Memory Home `backups/` directory" — restore is built to
read this product's own backups, not a competitor's export, and there
is no symmetric path the other direction either. `export_public_snapshot.py`
remains a maintainer tool, not a user-facing feature, per the original
read above.

The corrected positioning is narrower than either the original
handoff ("stopped short of portability," wrong) or this entry's first
pass ("the fifth property is undocumented," incomplete) allowed: most
of portability is shipped, verified, and given away for free. What
remains distinctively Ursa Major's is one clause of its own value
proposition, not the paragraph — a profile the user can take out and
point at a model the vendor does not already sell. See
docs/market/positioning.md's correction to "Software parity is not
position parity" for what this changes. Verified independently via
the GitHub API against the live repository tree and three source
files, not taken from either seat's paraphrase. Last observed
2026-10-24: Tencent-Hunyuan/Hy-Memory,
`memhub/apps/core/src/one_memory/imports/sources/registry.py`,
`memhub/apps/core/src/one_memory/imports/host_packages.py`, and
`memhub/packages/contracts/src/backup-restore.ts`, read in full
(github.com/Tencent-Hunyuan/Hy-Memory).

Update 2026-10-26 (message, 22nd run): Tencent Hunyuan shipped "Hy
Memory 2.0" on 2026-10-15/17, open-sourcing a dedicated memory-writer
model, `Hy-Memory-30B-A3B` (Apache-2.0, ~30B total/~3B active
parameters, mixture-of-experts), trained in two stages (on-policy
distillation from a frozen teacher, then reinforcement learning
rewarded on whether later questions get answered correctly from what
was written). Independent reporting puts it ahead of Claude Opus 5 on
cross-harness memory benchmarks (55.49 vs. 54.62 macro average,
AlphaSignal). This is the same MemHub stack this entry already tracks,
not a new product: re-ran the repository-tree check that found the
eleven import adapters and the backup-restore contract above
(`gh api repos/Tencent-Hunyuan/Hy-Memory/git/trees/main?recursive=1`)
and found the same export-shaped files as the 2026-10-24 correction,
no new user-facing path for a consolidated profile to leave this stack
for an unrelated vendor's model. So the head-start-vs-position
conclusion in docs/market/positioning.md is unchanged, but the
underlying point sharpens: the free, open-source competitor's memory
quality is now independently benchmarked ahead of a frontier lab's own
flagship on the specific task Major competes on, which is a stronger
version of "the software is not the moat" than this entry had evidence
for last week. Last observed 2026-10-26: [AlphaSignal: Tencent's Hy
Memory 2.0 Beats Claude Opus 5 at Remembering What Agents
Need](https://alphasignal.ai/news/tencent-s-hy-memory-2-0-beats-claude-opus-5-at-remembering-what-agents-need),
[Hy-Memory 2.0 product site](https://memory.hunyuan.tencent.com/en/).

### Wire (usewire.io)

What it is: a "Context as a Service" platform — hosted, permissioned
containers that give multiple AI agents (via MCP) read/write access to
the same shared context store, pitched explicitly against export-based
portability. Who it serves: developers and teams running AI coding
agents and other MCP clients who want one context store instead of
several (Claude Code, Cursor named). Pricing: pay-as-you-go (3,000
starter credits, no subscription), Starter $9/mo (10K credits), Pro
$19/mo (20K credits), Team $199/mo (200K credits); storage, search, and
file reads are credit-metered, container creation, writes, deletes,
and uploads are free. Strengths: the clearest public articulation
found yet of the exact critique Ursa Major's own thesis rests on — a
2026-08-31 company blog post argues "export satisfies data-portability
obligations without changing the practical cost" because migration
tools create "two copies" that drift apart, and that the fix is a
store the user owns outside any one vendor ("Code has GitHub.
Everything else has Wire"). The same post cites developer multi-tool
usage stats (82% ChatGPT, 68% Copilot, 47% Gemini, 41% Claude) as
evidence multi-model use is the norm, not a transition state —
independent corroboration of the premise Major's cross-model pitch
depends on. Weakness against Ursa: Wire's own fix for lock-in is to
become a new centralized point every agent reads from, not to return
data to the user's own device — the opposite architecture from
Major's on-device, user-held profile (CLAUDE.md §0, constraint 3). It
also serves developers integrating MCP clients, not a consumer product
with its own consent/revoke surface, and raw shared context (files,
API output, tool calls) is not the same object as a
provenance-resolved outcome record; Wire has nothing analogous to the
revealed-preference flywheel Minor's pricing depends on. Last observed
2026-10-26: [Wire: AI Memory Lock-in](https://usewire.io/blog/ai-memory-lock-in-blocks-your-own-product/), [Wire](https://usewire.io/).

### Skillsync (YC W26)

What it is: a YC-backed ($500K, Y Combinator plus Character Capital)
startup building portability specifically for AI coding-agent
sessions — a local-first desktop app plus an open-source Rust
translation engine, txcript, that converts a session (conversation,
reasoning blocks, tool calls) from one agent's on-disk format into
another's, described by its own founders as "ffmpeg... for agent
sessions." Who it serves: developers who switch between coding agents
mid-task (Claude Code, Codex, Cursor, Hermes, OpenClaw, Antigravity
named as supported) and want sessions and reusable "skills" to follow
them. Pricing: txcript itself is free and open-source; the companion
desktop app is $20/mo Pro. Launched on Hacker News 2026-09-17 (68
points, "Launch HN: Skillsync (YC W26)"). Strengths: the first thing
found in this landscape that attempts actual automated,
no-human-copy-paste translation between competing vendors' own session
formats, which is closer to the "automated round-trip, no bespoke
parser" bar docs/market/positioning.md's 2026-10-14 entry set for
testing any portability claim, Major's own included, than anything
else checked to date. Weakness against Ursa: scoped entirely to
coding-agent session transcripts and reusable skills, not inferred
user preferences or a consumer chat relationship, and it moves the raw
transcript itself rather than a provenance-resolved record of what
happened to any of it; a Launch HN commenter's own skepticism ("the
transcript doesn't go into a file — it goes into a live session")
suggests even this narrower translation has real fidelity limits. Last
observed 2026-10-26: [Launch HN: Skillsync (YC W26)](https://news.ycombinator.com/item?id=49743049), [YesPress: Skillsync (YC W26)](https://yespress.io/skillsync-yc-w26).

### Memory Forge (Phoenix Grove Systems)

What it is: a browser-based conversion tool that turns a raw ChatGPT,
Claude, or Gemini conversation export into a single portable markdown
"memory chip" file, reloadable into any AI that accepts file uploads
by prompting it to "activate memory chip." Who it serves: individual
consumers switching AI platforms, surfaced specifically by the
#QuitGPT boycott of OpenAI's Pentagon contract (campaign launched late
February 2026; QuitGPT's own count puts cancellations and cancellation
pledges above 2.5 million, with reporting that Claude passed ChatGPT
in the US App Store for the first time during the same window).
Pricing: $3.95/mo for unlimited conversions, no token fees, files
remain usable after cancellation. Strengths: conversion is claimed to
run entirely in the browser, "no cloud, no upload," the same on-device
principle CLAUDE.md §0 states as a hard constraint for Ursa, and this
is the most direct evidence this map has found of a consumer paying,
in real time, for a worse version of what Ursa Major gives away free —
a manual export-and-reload step with no persistent sync, no
cross-model inference layer, and a one-shot "activate" prompt the user
has to remember to issue each session. Weakness against Ursa: it moves
a raw transcript file, not a provenance-resolved preference profile;
there is no inference, no revealed-preference structure, and nothing
analogous to the consent/revoke surface CLAUDE.md §0 requires, so it
feeds nothing into anything resembling Minor's side of the flywheel.
It is a bridge a user builds by hand during a specific exodus event,
not an ongoing relationship. No independent traction numbers found for
the tool itself; the article's "becoming the unofficial exit ramp" is
the vendor's own framing via a single syndicated piece, not an
independent count. Last observed 2026-10-26: [Programming Insider:
ChatGPT Protesters Are Using Memory Forge to Take Their Data With
Them](https://programminginsider.com/chatgpt-protesters-are-using-memory-forge-to-take-their-data-with-them/),
[Memory Forge product page](https://pgsgrove.com/memoryforgeland).

### MemoryLake

What it is: a bootstrapped (founded 2024, no funding raised, per
Tracxn) hosted "memory lake" that stores typed, versioned memories
(conversations, documents, spreadsheets, audio, video) separately from
chat logs and exposes them to "every AI and agent" (ChatGPT, Claude,
Qwen, Gemini, OpenClaw, AutoGPT, Manus, Perplexity named, plus any
API-compatible system) via MCP, REST, and a CLI, pitched explicitly as
"neutral by design" and "outside any single vendor." Who it serves:
individuals and enterprises wanting one memory store that follows them
across tools rather than a per-vendor memory feature. Pricing: free
tier (300K tokens/month), Pro $19/mo (6.2M tokens/month), Premium
$199/mo (66M tokens/month), on-demand metering beyond that at roughly
$3.125/million tokens. Strengths: the broadest platform-connection list
found in this category to date (eight named AI products plus "any
API-compatible system," versus Wire's MCP-client scope or Skillsync's
six named coding agents), and a company blog post (2026-06-05) makes
the identical architectural argument Wire's does independently — memory
is simultaneously "a genuine feature and a retention mechanism," and
the fix is a store the user owns outside any one vendor. Weakness
against Ursa, and the same one as every other entry in this
fragmentation count: the one external-validation data point on the
page, a 94.03% LoCoMo score claimed as "the highest score in this
evaluation," is MemoryLake's own self-reported result on its own
product page, not a third party reading MemoryLake's export back in.
Nothing on the site or in independent coverage found this run shows a
competing platform (or a third party at all) importing a MemoryLake
export and reconstructing it; the product is itself the destination
every connected AI reads from, the same centralized-store architecture
as Wire, not an on-device profile the user holds (CLAUDE.md §0,
constraint 3). Another entry in this file's running count of commercial
products solving portability for their own adapters only (Mem0, Letta,
Zep, Wire, Skillsync, Memory Forge, and now this one) — a separate
tally from the cross-cutting note's own count of protocol/format
*specs* below, which this is not one of. Last observed 2026-10-26:
[MemoryLake: Is AI Memory a Feature or a Lock-In?](https://www.memorylake.ai/en/blogs/is-ai-memory-a-feature-or-lock-in),
[MemoryLake](https://www.memorylake.ai/), [MemoryLake pricing](https://www.memorylake.ai/en/pricing),
[Tracxn: MemoryLake company profile](https://tracxn.com/d/companies/memorylake/___0NgAT2k9L33aWunlgxgnpw3otgpFY9Q6kIe_kmuA8o).

### Cross-cutting note (2026-10-05): no neutral standard exists, and nobody is building one

Checked whether a neutral, cross-vendor memory-portability standard
exists or is in progress, since that would close Ursa Major's gap for
everyone at once rather than leaving it to any single product. As of
this run, none does. The Model Context Protocol, the nearest candidate
infrastructure, moved under the Linux Foundation's Agentic AI
Foundation and added an Extensions framework for independently
versioned additions, but its 2026 roadmap names transport, agent
communication, governance, and enterprise readiness as priorities and
does not mention memory at all; no memory extension has been proposed
through its own process. Two open-source projects (Cognee's COGX
format, ByteRover's git-versioned markdown) preserve more structure
than any incumbent's export, but neither has a competing product that
reads its format back, so the same reviewer who tested all seven
incumbent products called each one "a well-documented dialect," not a
standard. Read plainly: every entry in this category, including this
week's new one, is still solving portability for one vendor's benefit
at a time. Last observed 2026-10-05: [stantyan.com: Portable AI Memory or Permanent Lock-In](https://stantyan.com/blog/portable-ai-memory-or-permanent-lock-in/).

Update 2026-10-24: a Hacker News thread surfaced a "Universal Memory
Protocol" (UMP), an open-source attempt (github.com/edihasaj/universal-memory-protocol)
at exactly the thing the 2026-10-05 note above said nobody was
building: one record format and six operations (recall, remember,
get, revise, forget, feedback) meant to let any agent or store read
and extend the same user-owned memory file. Checked rather than taken
at its self-declared "Stable v1.0" word: 31 stars, 2 forks, 45
commits, one visible adapter (wrapping a project called Recall), and
no named product or company outside the repository implementing it.
This does not overturn the 2026-10-05 conclusion, it sharpens it: an
attempt now exists, but by the same test the earlier note applied to
Cognee and ByteRover's formats (does a competing product read this
back without the format's own author writing the adapter), UMP has
not cleared that bar either, and has far less visible traction than
either of those two. Worth a one-line recheck at the next monthly
pass, not a promotion to its own entry yet. Last observed 2026-10-24:
[GitHub: edihasaj/universal-memory-protocol](https://github.com/edihasaj/universal-memory-protocol), [Hacker News: Universal Memory Protocol](https://news.ycombinator.com/item?id=48428796).

Update 2026-10-25: re-reading the 2026-10-05 source itself (rather
than this entry's own paraphrase of it) turned up two more named
attempts the earlier notes didn't carry forward: MIF (an individual
developer's interchange spec) and memorywire (an academic wire-format
proposal), both first half of 2026, alongside the already-tracked
Open Memory Protocol. That makes six distinct fragmentation attempts
in one year across this one source alone (COGX, ByteRover, OMP, MIF,
memorywire, and now UMP), and the source's own count was already
four before UMP existed. None of the six has a second independent
implementation or institutional governance — the same bar the
2026-10-05 and 2026-10-24 notes already applied, still uncleared. This
does not change the conclusion; it is the strongest evidence yet for
it, since the fragmentation itself is accelerating faster than any
single attempt is gaining traction. Last observed 2026-10-25:
[stantyan.com: Portable AI Memory or Permanent Lock-In](https://stantyan.com/blog/portable-ai-memory-or-permanent-lock-in/).

Update 2026-10-26: a seventh fragmentation attempt, older than this
note's existing six and missed until this run: MacPaw Research
published "Portable Memory" on 2026-07-06, a `.mem` bundle format
(canonical serialization, optional Ed25519 signing) with one feature
none of the other six name — portable deletion tombstones with
proof-of-reach, a verifiable-delete primitive close in shape to
CLAUDE.md §0's second load-bearing constraint (users can revoke and
delete what's inferred about them). MacPaw ships MIT-licensed Python
and Swift reference implementations plus ingest adapters for mem0,
ChatGPT, and Claude memory. Checked against this note's own bar
(does a competing product read the format back without the format's
author writing the adapter): no, the adapters are MacPaw's own, the
same gap COGX and ByteRover had. The authors say so themselves,
calling the spec "not yet — independently implemented, neutrally
governed, widely adopted." Seven attempts now, still zero that clear
the bar, but this is the first one whose design target overlaps
Ursa's own consent architecture rather than just export format. Last
observed 2026-10-26: [MacPaw Research: Portable Memory](https://research.macpaw.com/publications/portable-memory).

Update 2026-10-26 (message, 27th run): an eighth fragmentation
attempt, found via the demand-signals ceremony rather than a
landscape sweep: "Portable Agent Memory: A Protocol for
Cryptographically-Verified Memory Transfer Across Heterogeneous AI
Agents" (Ravindran, arXiv 2605.11032, submitted 2026-05-10). A
single-author open protocol using a Merkle-DAG structure for
tamper-evident, cryptographically verified memory transfer, with an
"injection-resistant rehydration process" for adapting memory across
model architectures. Checked against this note's own bar: the
author's own reference implementation demonstrates transfer between
GPT-4, Claude, Gemini, and Llama, which is the broadest cross-vendor
demo found in this note so far, but every adapter is still the
author's own code (54 passing tests, Apache 2.0, no third-party
organization named as implementing or adopting it). Same gap as all
seven prior attempts, now with the widest model coverage and the
strongest security framing (the "injection-resistant" claim is the
first attempt in this note to engage with hostile input at all,
worth a flag for the security seat's own watch rather than action by
this one). Eight attempts now, still zero that clear the
independent-implementation bar. Last observed 2026-10-26: [arXiv
2605.11032: Portable Agent Memory](https://arxiv.org/abs/2605.11032).

Update 2026-10-26 (message, 27th run): separately, a controlled
academic study gives the first quantified answer to *why* none of
the eight attempts above has cleared the bar on the first try, rather
than just whether one has. "Does Your Agent's Memory Survive a Model
Upgrade? A Controlled Study of Memory Portability" (Goyal and Ray,
arXiv 2609.05339, submitted 2026-09-04) tested four memory storage
formats (verbatim long-context history, chunked RAG retrieval,
model-compressed natural-language notes, and fixed-schema knowledge
graphs) across a model swap, using 48 synthetic histories on two
open-weight models under 10B parameters. The result: fixed-schema
structures transferred almost losslessly (accuracy changed by
+0.0004 ± 0.0020), while compressed natural-language notes — the
format closest to what a "derived signal" or narrative summary looks
like — swung 9 to 13 percentage points depending on migration
direction, and RAG retrieval degraded without a full re-embedding
pass. This is a small, synthetic, non-product study, not evidence
about any named entry in this file, but it is the first source this
note has found that explains the fragmentation above as a format
problem with a measurable cost rather than only a coordination
problem: a neutral standard that picked the wrong internal
representation would still fail this test. Positioning consequence
(a concrete numeric bar for the automated-round-trip test) in
docs/market/positioning.md. Last observed 2026-10-26: [arXiv
2609.05339: Does Your Agent's Memory Survive a Model
Upgrade?](https://arxiv.org/abs/2609.05339).

## Changelog

- 2026-09-26 — initial map, 12 entries (5 preference-data vendors, 3
  evaluation/arena products, 4 personalization/memory layers), opened
  for sprint 2026-09-21 item 4 / O2 KR2.3.
- 2026-09-30 — second run: added Handshake AI (Category 1, 13th entry).
  Dated update notes added to Surge AI, Scale AI, Mercor, Invisible
  Technologies, Arena, and ChatGPT Memory covering this week's funding
  and revenue moves. Flagged a circulating Scale AI IPO/S-1 claim as
  unconfirmed rather than reporting it as fact (no EDGAR match, no
  linked source, conflicts with other reporting).
- 2026-10-05 — third run: added Claude Memory Import (Category 3,
  14th entry) plus a cross-cutting note on the absence of any neutral
  portability standard. Dated update notes added to Scale AI (new
  CEO), Mercor (named investor, named neutrality-pattern echo of the
  Scale/Meta entry), and ChatGPT Memory (walked back last run's
  "transparency gap closing" read after a dated critique found the
  edit surface doesn't reliably reach what the model actually uses).
- 2026-10-07 — fourth run: dated update notes added to Surge AI (a
  Forbes investigation reporting ~$500M/year in vendor sales to
  Chinese AI labs, plus Surge's own new DAYJOB/GDP.xlsx/Tuesday Work
  Index benchmarks converging on "economically valuable work" framing)
  and Mercor (the same Forbes finding's smaller Mercor echo, plus a
  labor-conditions investigation). No new entries added this run; the
  monthly full-map pass is not due until around 2026-10-26.
- 2026-10-14 — fifth run: dated update notes added to Scale AI
  (re-checked EDGAR directly, the circulating S-1 claim remains
  unconfirmed, same result as 2026-09-30), Mercor (its first
  acquisition, Deeptune, a reinforcement-learning-environment builder —
  this vendor moving up-stack toward the verifier layer rather than
  staying in solicited labeling), and Claude Memory Import (a
  correction: Anthropic's support page now documents export alongside
  import, so "one-directional" from the 2026-10-05 entry is no longer
  precise, though the export is still manual copy-paste text, not a
  machine-readable round trip). No new entries added this run; the
  monthly full-map pass is not due until around 2026-10-26.
- 2026-10-24 (event-driven, message) — added MemHub / Tencent Hunyuan
  Hy-Memory (Category 3, now 15 entries), following a handoff from
  Ursa's research seat (finding 40). Verified research's own bounded
  reading by reading the top-level README myself (the one surface
  research's own note said it had not checked) and running a
  code-level search across the whole repository for export-shaped
  files; both confirm the fifth property, cross-vendor portability, is
  still undocumented anywhere checked. Positioning consequence in
  docs/market/positioning.md.
- 2026-10-24 (event-driven, message, same-day correction) — research
  corrected its own earlier handoff: the repository ships eleven
  named, versioned, partly real-install-verified import adapters, not
  an undocumented absence. Read the repository's git tree and three
  source files directly via the GitHub API to verify the correction
  independently rather than take either seat's word for it; confirmed.
  Updated the MemHub entry with the precise count, file names, and
  verification levels, and narrowed what remains absent to the
  outbound/export direction specifically (the backup-restore contract
  refuses any source outside its own home directory). Positioning
  correction in docs/market/positioning.md.
- 2026-10-24 (hook-triggered run, capacity returned) — added
  Halluminate (Category 1, now 16 entries), a second
  independently-funded "build the task and the verifier" vendor after
  Mercor's Deeptune acquisition, confirming that move is a sub-category
  rather than one company's pivot. Dated update to LMArena/Arena: a
  $200M Series B nearly doubled its valuation to $3.1B and it shipped
  an Alignment Index built from 90,000 real sampled agent sessions
  graded by an LLM judge against a written rubric — real raw material,
  same grader-supplied label CLAUDE.md §1 contrasts the outcome record
  against. Dated note added to the Category 3 cross-cutting entry: an
  open-source "Universal Memory Protocol" exists but has not cleared
  the adoption bar the 2026-10-05 note already applied to two more
  established attempts. No new Category 3 entry; the monthly full-map
  pass is due around 2026-10-26.
- 2026-10-25 (message, 13th run) — closed out the last two entries
  still dated only to the map's opening (2026-09-26) or the week after
  (2026-09-30), completing this cycle's full-map pass a day ahead of
  the 2026-10-26 deadline. Invisible Technologies: re-checked, no
  pivot or pricing change since the WEF/WeCP update; added its own
  2026 outlook statement as the clearest public argument against
  Ursa's no-human-grader bet found in this category. Handshake AI: The
  Information's own exclusive puts AI-training gross ARR at nearly $1B
  (up from $550M in January), roughly flat against the $1.1B this
  entry already tracked for April — growth has plateaued since
  spring, not kept compounding — and discloses contractor costs at
  60-70% of gross revenue, the sharpest cost-structure contrast this
  map has found with Minor's own near-zero-marginal-cost labor. Also
  re-read the 2026-10-05 Category 3 source in full rather than this
  file's own paraphrase of it, and found two more named memory-
  interchange attempts (MIF, memorywire) the earlier notes hadn't
  carried forward — six distinct fragmentation attempts in one year
  now, none with a second independent implementation.
- 2026-10-25 (message, 15th run) — added TELUS Digital (Category 1,
  18th entry): a publicly traded BPO conglomerate's RLHF/annotation
  arm with a self-described million-plus-annotator workforce, found
  via a practitioner's own byline rather than a landscape sweep. The
  vendor had gone unlisted through four prior full-map passes despite
  operating at the largest disclosed scale of any Category 1 entry,
  worth naming as a gap in how this file finds new entries (byline and
  job-posting searches surfaced it; keyword sweeps of "RLHF vendor" did
  not).
- 2026-10-25 (message, 16th run) — added micro1 (Category 1, 19th
  entry), found via a funding-news search rather than a vendor-name
  sweep, same method gap the 15th run named. The fastest disclosed
  growth curve in this category ($7M to $1B annualized in under two
  years), a fourth named beneficiary of the Scale/Meta exodus, and a
  third independently-funded vendor (after Mercor's Deeptune and
  Halluminate) building constructed task-and-verifier environments
  rather than staying in solicited labeling. Also checked
  aidata.broker, a 130-deal disclosed-licensing tracker with a stated
  methodology, for an RLHF-specific contract size; it has none, same
  result as corpusbridge.com (15th run), but it is the larger and
  better-sourced of the two trackers, so it replaces corpusbridge.com
  as this file's pointer for the next run that needs it.
- 2026-10-26 (message, 17th run) — a caveat on last run's own pointer,
  found by checking who runs the site rather than what it states.
  aidata.broker's footer names its operator as O-mega Enterprise, Inc,
  and the site itself describes its business as a "sell-side broker
  for AI training data" — it is not a disinterested tracker, it is a
  participant in the market it reports on. This does not undo the
  16th run's spot-check (the site's stated sourcing rule, "every price
  is something somebody else published," is still independently
  checkable per-deal), but the next run that cites it should carry the
  operator's commercial stake alongside the methodology claim, same as
  this file already does for every vendor-authored figure elsewhere.
  No replacement pointer found or needed; the caveat attaches to the
  existing one. [aidata.broker footer, checked 2026-10-26].
- 2026-10-26 (message, 19th run) — added two new Category 3 entries,
  both found via the demand-signals ceremony rather than a landscape
  sweep. Wire (usewire.io): a hosted "Context as a Service" platform
  whose own blog post argues export-based portability is fake and
  proposes a centralized shared store instead, the sharpest public
  articulation of Major's own critique found anywhere, from a vendor
  whose fix is structurally the opposite of Major's on-device bet.
  Skillsync (YC W26): a $500K YC-backed startup whose open-source
  txcript engine attempts actual automated translation between
  competing coding agents' own session formats, the first thing found
  in this landscape that even attempts the "no human copy-paste, no
  bespoke parser" bar docs/market/positioning.md set on 2026-10-14,
  though scoped to raw session transcripts, not inferred preferences.
  Also added a dated note to ChatGPT Memory for OpenAI's 2026-10-20
  "Locked Chats" launch, a privacy feature with no portability
  implication. Positioning consequence in docs/market/positioning.md.
- 2026-10-26 (message, 21st run) — absorbed the 19th run's open PR
  (#456, superseded by this run's) and added a seventh entry to the
  no-neutral-standard cross-cutting note: MacPaw Research's "Portable
  Memory" `.mem` spec (2026-07-06, missed by prior sweeps), notable
  for a verifiable-deletion primitive that overlaps CLAUDE.md §0's
  consent architecture more than any prior entry in that note, but
  still unproven against the note's own independent-implementation
  bar. Positioning consequence (EU Data Act scope check) in
  docs/market/positioning.md.
- 2026-10-26 (message, 24th run) — two items added to the Mercor
  entry, both missed across seven prior passes over it. First: APEX,
  Mercor's own "measure AI on real work" benchmark suite, turned one
  year old this run and expanded to software engineering, a second
  named vendor (after Surge's Tuesday Work Index) using language close
  enough to CLAUDE.md §1's own framing to need explicit distinguishing
  in a lab brief. Second, more load-bearing: a LiteLLM supply-chain
  breach (disclosed 2026-03-31/04-04) exposed ~4TB of contractor data
  including biometrics, and Meta paused all Mercor contracts
  indefinitely, while Mercor's own 2026-06-25 summary reports other
  frontier-lab customers increased engagement in the months after —
  a different axis and a different outcome than Scale AI's
  equity-driven, not-reported-as-recovered customer exodus above.
  Positioning consequence in docs/market/positioning.md.
- 2026-10-26 (message, 26th run) — added Memory Forge / Phoenix Grove
  Systems (Category 3, now 18 entries), found via the demand-signals
  ceremony. A $3.95/mo browser-based tool that converts an AI
  conversation export into a portable file, surfaced by the #QuitGPT
  boycott of OpenAI's Pentagon contract (2.5M+ cancellations/pledges
  claimed, reported App Store rank change to Claude). The most direct
  evidence yet of a consumer paying for a worse, manual version of
  Major's free value proposition during a real, dated exodus event.
  Positioning consequence in docs/market/positioning.md.
- 2026-10-26 (message, 27th run) — added an eighth entry to the
  no-neutral-standard cross-cutting note, a cryptographically-verified
  memory-transfer protocol (Ravindran, arXiv 2605.11032) with the
  widest cross-model demo found yet (GPT-4, Claude, Gemini, Llama) and
  the same single-author-adapter gap as the prior seven. Separately,
  found an academic controlled study (Goyal and Ray, arXiv 2609.05339)
  that quantifies, for the first time in this file, why portability
  attempts fail by format rather than just whether any has: fixed-
  schema structures survive a model swap almost losslessly while
  compressed natural-language notes swing 9-13 percentage points.
  Positioning consequence (a concrete numeric bar for the automated-
  round-trip test) in docs/market/positioning.md.
- 2026-10-26 (message, 29th run) — added a cross-cutting note to
  Category 1: an independent directory (rl-list.com) maps 42 named
  companies building "constructed task plus verifier" RL environments,
  showing the sub-category this file had tracked one vendor at a time
  (Mercor/Deeptune, Halluminate, micro1/Realm) is a mapped market, not
  three isolated pivots. Spot-checked one profile (Datacurve) directly;
  no named frontier-lab customers published, same self-description gap
  already flagged elsewhere in this file. No individual vendor entry
  added; the next run with capacity should spot-check a few of the
  better-funded, unverified names. Positioning consequence in
  docs/market/positioning.md.
- 2026-10-26 (message, 31st run) — swept rl-list.com's full listing
  text for all 42 names in one pass instead of continuing one-by-one
  spot-checks. Found one name, Idler, whose own marketing claims a
  real-production-data substrate (a decade of an actual retailer's
  operational history, a real law firm's anonymized records) closer
  to CLAUDE.md §1's framing than the other 41, but its own term for
  the result is "a digital twin": a constructed simulation, not a
  real deliverable. Tally now 7 of 42 individually examined, 7 of 7
  authored-not-real, and the sweep of the remaining 35 names found no
  other candidate. Positioning consequence in
  docs/market/positioning.md.
- 2026-10-27 (message, 2nd run) — added Gemini Personal Intelligence
  (Category 3, new entry), Google's own cross-app memory feature,
  missed by every prior sweep of this category. Found via this run's
  demand-signals ceremony rather than a landscape sweep: Google updated
  its privacy policy on 2026-10-16 to carve ad personalization back
  into Gmail/Photos/Drive content for users who enable the feature,
  the first concrete case this file has found of an opt-in memory gate
  that is also an ad-targeting gate, directly extending the prior
  run's "consent is a distinct axis from transparency" finding.
  Positioning consequence in docs/market/positioning.md.

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

# Market landscape — living map

Maintained by the market research agent (prompts/market-agent.md).
Read-only research on free, public surfaces. Each entry: what it is,
who it serves, pricing, strengths, weaknesses against Ursa, and a
dated last-observed note. Entries are added and retired with dated
notes; never silently deleted.

This file opened 2026-09-26 (sprint 2026-09-21 item 4, serving O2
KR2.3, due 2026-10-31). First run: 12 entries across the three
categories the KR names. The weekly rhythm (visit a handful of
entries plus anything new, cover the full map monthly) starts next
run.

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

## Changelog

- 2026-09-26 — initial map, 12 entries (5 preference-data vendors, 3
  evaluation/arena products, 4 personalization/memory layers), opened
  for sprint 2026-09-21 item 4 / O2 KR2.3.

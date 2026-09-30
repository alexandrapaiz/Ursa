# Target list — labs (O4 KR4.2) — draft 1

**Status: draft for the owner. Zero contacts made, zero planned this
quarter — O4's own wording is "zero cold contacts sent this quarter, by
design."** KR4.2 is due 2026-12-15; this is draft 1, delivered
2026-09-30. Twelve named people plus two named-and-excluded, across the
customer set `CLAUDE.md` §4 defines.

## Three disciplines this list follows

1. **Public surfaces only, and the artifact is the evidence.** Every
   "why them" below is a paper, a repository, a book, a published model
   recipe, or a public report. No personal email, phone, or DM handle is
   recorded here, ever — not because it is hard to find, but because a
   list of contact details is a list that leaks. The owner has her own
   channels; this file's job is telling her *who* and *why*.
2. **Roles drift, artifacts don't.** Marked **HIGH** (long-standing
   public role), **VERIFY** (publicly reported, but confirm before
   writing), or **DERIVE** (don't guess a name — read it off a live
   public surface, with the command or URL given). This run watched
   exactly the failure this guards against: Nathan Lambert was Ai2's
   post-training lead for three years and left in June 2026. A list
   that had asserted his title would have been wrong within a quarter.
3. **The artifact is also the opening.** Our only channel is published
   methodology (`CLAUDE.md` §4). So the right first contact is always
   someone whose own published work names the gap our record fills — the
   note writes itself, and it is not a pitch, it is a citation.

## The priority inversion — read this before the table

`CLAUDE.md` lists frontier labs first, and for revenue that is right:
six-to-seven-figure contracts come from Anthropic, OpenAI, Google
DeepMind. For **first conversation**, the order should be inverted, and
the argument comes from our own methods doc rather than from optimism.

`docs/beyond-preference-pairs.md` §6 concedes that within-session
survival "is computable by any lab from its own telemetry for consenting
users." Read that as a sales fact and it is brutal: **the labs with huge
consumer surfaces need the cheap half of our signal least.** They can
approximate it in-house, and the part they cannot get — the artifact
after the session ends, the competitor's half of the provenance — is
exactly the part we cannot yet demonstrate `[F-2]` `[F-3]`. So the
frontier pitch lands hardest at precisely the moment we are least ready
to make it.

Now invert. A lab with a strong model and **no consumer product** has no
user-behaviour telemetry at all. Not a worse version of it — none. For
that buyer, even the half we can already compute is a category it does
not possess, and the whole argument reduces to one sentence with no
gates in it. Those labs are also smaller, faster to a decision, publish
their own recipes (so methodology is a real channel rather than a hope),
and are in-segment already: `CLAUDE.md` §4 names "tier-two model
developers (Mistral, Cohere, open-source foundations)."

**Recommendation: Tier A before Tier B, for conversations. Tier B stays
the revenue plan.** The frontier deal gets easier after a tier-two lab
has said in public that the signal was useful — which is also the
cheapest credibility Ursa can buy, because it costs nothing and is not
ours to assert.

---

## Tier A — strong model, no consumer telemetry base (talk to these first)

### Thinking Machines Lab

**Why this account, specifically.** Its public product is Tinker, an API
for post-training other people's open-weight models (announced 2025-10-01),
and its first open model, Inkling (July 2026), was reported as an
explicit bet against one-size-fits-all AI. A company whose thesis is
that models should be adapted per-context, whose product is the adaptation
API, and which has no consumer chat surface producing behavioural data,
is the closest thing in the market to a buyer pre-sold on the premise.
Tinker's own customers — Princeton, Stanford, Berkeley, Redwood — are
fine-tuning for narrow domains and have no outcome signal either, which
makes Ursa a complement to their product rather than a competitor.

| Person | Role | Why them | Warm path |
|---|---|---|---|
| **DERIVE — the Tinker post-training authors** | — | The people writing the actual post-training recipes are the technical readers of our brief, and they are a matter of record, not of guesswork | `gh api repos/thinking-machines-lab/tinker-cookbook/contributors` — take the top three by commits, then read their recipes before writing a word. This is current the day she runs it; a name typed here would not be |
| **Barret Zoph** | CTO — **VERIFY** | Post-training and RL depth; the sponsor a recipe author would escalate to | The Tinker launch materials and the cookbook repo |
| **John Schulman** | Chief scientist — **VERIFY** (has moved twice since 2024; confirm before writing) | Co-author of the PPO/RLHF lineage the whole field post-trains with. The single most qualified reader of the claim that pairwise comparison assumes a preference that exists before the comparison | His own published work on RLHF's limits; our §2 argument is addressed to it directly |
| **Mira Murati** | Founder/CEO — **HIGH** | Named for completeness, **not** as a first contact. A CEO-level note on a pre-corpus product wastes the one introduction we get | — |

**Drafted note (owner's hand, to a recipe author — not sent):**

> Subject: the label your rubrics are standing in for
>
> I read the Tinker cookbook's post-training recipes. The place they get
> hardest is the same place everyone's do: for open-ended work there is
> no verifier, so the reward ends up being a rubric written before the
> task and scored by a judge.
>
> We built a different label and I'd like you to tell me where it's
> wrong. We take a finished piece of real work and join it backward to
> every generation that fed it, then classify each span of the final
> artifact by what the work did with it — kept unchanged, kept but
> edited (the edit is the correction), generated and deleted, or present
> in the finished work and traceable to no generation at all. Nobody
> grades anything. The artifact supplies the label.
>
> Where we actually are: it runs as one command over a git repository,
> we have two records, and on the second one I declared myself
> unsatisfied with the result and left that verdict in the repo. Two
> records prove a label type exists; they prove nothing about magnitude.
> There is nothing to buy.
>
> The methodology is written down, limits section included. Worth twenty
> minutes of your scepticism?
>
> — Alexandra

Claims audit for the note: `[C-1]` `[C-3]` `[C-6]` `[C-7]` `[C-13]`. No
forbidden claim appears; no statistic, no customer, no cross-model
assertion, no comparison.

### Ai2 (Allen Institute for AI)

**Why this account.** It publishes the entire post-training recipe, data
and all (OLMo, Tülu, Dolma). That makes it the only realistic
**co-publication** partner in the set, and co-publication is worth more
to Ursa this quarter than a contract: it converts O2 KR2.1 from a
self-published methodology into one an independent open lab has put its
name near. It is also a non-profit, so the neutrality logic that broke
Scale's customer base cuts in its favour and ours simultaneously.

| Person | Role | Why them | Warm path |
|---|---|---|---|
| **Luca Soldaini** | Ai2 research scientist, open-data/OLMo lineage — **HIGH** | His public beat *is* data provenance and open pretraining/post-training data. The outcome record is a provenance argument first and a preference argument second; he is the rare reader who will care about the join before the label | The OLMo/Dolma papers and repos; our §5 corpora list is written in his vocabulary |
| **Hanna Hajishirzi** | Ai2 NLP research lead; UW faculty — **HIGH** | Senior enough to authorize a joint publication, technical enough to read the method | Published OLMo/Tülu work |
| **DERIVE — the current post-training lead** | — | Lambert left in June 2026; the seat has an occupant and they are named on the most recent Tülu/OLMo post-training release | Read the author list of the latest Tülu release before writing |
| **Nathan Lambert** | Ai2 post-training lead for three years, **departed June 2026**, now on a new project — **VERIFY the new affiliation** | Still the highest-value single reader in the field, and already load-bearing in our own analysis: `docs/market/positioning.md` prices our product off chapter 12 of his RLHF book. His published position is that preference data is the bottleneck. He also writes Interconnects, one of the most-read technical newsletters in AI — which makes him simultaneously a reader, a validator, and the single best venue our methodology could be noticed in. Treat as venue **and** person, never as a pitch target | His book (rlhfbook.com, Manning print July 2026) and Interconnects. The honest opening is that his own number is in our pricing doc |

**Drafted note (owner's hand, to Nathan Lambert — not sent):**

> Subject: chapter 12's dollar figure is doing a lot of work in our
> pricing analysis
>
> We're building an outcome-based label for open-ended domains, and when
> we went to price it the only public per-unit number we could find for
> human preference data was yours — the $1-to-$10-a-prompt range against
> sub-penny AI feedback. It's cited in our internal positioning doc,
> which is how I noticed I'd been reasoning with your numbers for a month
> without saying so.
>
> What we built is not more preference pairs. It's a finished piece of
> real work joined backward to the generations that fed it, with each
> span of the artifact labeled by what the work did with it — including
> the class that matters most, text in the final artifact traceable to no
> generation at all, meaning the model was never in the running. No
> grader, no rubric. The label comes from the artifact.
>
> Two records. One user. On the second I declared myself unsatisfied and
> left that in the repo, because acceptance here is a declaration and
> never an inference from retention. I'm not asking for coverage and
> there's nothing to buy. I'd like to know which part of the label you
> think is wrong.
>
> — Alexandra

Claims audit: `[C-3]` `[C-6]` `[C-7]`. The pricing figure is cited from
`docs/market/positioning.md`, sourced to rlhfbook.com/c/12-synthetic-data.

### Mistral AI

**Why this account.** European, enterprise-led, open-weight — and the
consent architecture is not a soft differentiator to a company operating
natively under GDPR, it is the part of the pitch that gets it past legal
at all. Comparatively little consumer telemetry versus the frontier set,
and a published open-model lineage, so methodology is a live channel.

| Person | Role | Why them | Warm path |
|---|---|---|---|
| **Guillaume Lample** | Co-founder and chief scientist — **HIGH** | Decision-maker and practitioner at once, which is the shape that gets a small lab to a yes without a six-month cycle | Published Mistral model reports |
| **DERIVE — post-training/alignment authors** | — | Named on the most recent Mistral model card or technical report | Read the latest release's author list |

### Cohere / Cohere Labs

**Why this account.** Enterprise fine-tuning is the whole business, which
means its customers' work product is the domain where no verifier exists
— the exact gap. It also runs an open research arm, so methodology
travels.

| Person | Role | Why them | Warm path |
|---|---|---|---|
| **DERIVE — Cohere Labs research leads** | — | Published open research arm; authors are on the papers | Cohere Labs' publication page |
| **Sara Hooker** | Led Cohere For AI; **reported to have left in 2025 to found Adaption Labs — VERIFY, and treat the new venture as its own lead** | Her public research programme is about efficiency, data quality, and what actually makes models better rather than bigger. If the reported premise of the new venture — learning from experience rather than scale — is accurate, it is a closer thesis match than any lab on this list | Her published work; the new venture's public materials |

---

## Tier B — frontier labs (the revenue plan; second in conversation order)

### Anthropic

**Why, and why the obvious door is the wrong one.** The post-training
team is the eventual buyer, but the *first* reader should be whoever
publishes the Economic Index — because that team's entire output is
"what are people actually using models for," which is our natural-task-
distribution claim with a lab's name on it. They are already arguing our
premise in public using their own data, and they can see the hole in it:
their view stops at the end of the session. Ours starts at the artifact.

Second angle, and it is unusually concrete: **Claude Code session
transcripts are the input path that already works** `[C-4]`. Ursa reads
their product's logs today. That is a partnership surface, not just a
sale, and it is the clearest instance of the `CLAUDE.md` §5 test — more
valuable to partner with than to fight.

| Person | Role | Why them | Warm path |
|---|---|---|---|
| **DERIVE — Economic Index authors** | — | Best-fit technical readers in the building; verifiable off the report | The most recent Economic Index report's author list |
| **DERIVE — Claude Code team** | — | The integration surface, not the data sale | Public changelogs and launch posts |
| **Jared Kaplan** | Co-founder, chief science officer — **HIGH** | The sponsor a researcher escalates to; **not** a first contact | Published Anthropic research |

Note against Constitutional AI: Anthropic's own method replaces human
preference labeling with AI feedback against a written constitution. The
brief must not read as an attack on that — it is the strongest version of
the written-criteria approach, and our claim is narrower and should stay
narrow: a constitution is still criteria fixed in advance, and outcome
labels re-anchor to the world at the rate the world produces work
(`docs/beyond-preference-pairs.md` §2, assumption 3). `[F-9]` forbids
claiming we beat it. We have not measured it.

### OpenAI

**Why, and the timing.** Largest consumer surface, therefore the least
need for the within-session half and the most need for the half we can't
yet show `[F-2]` — so this is a *later* conversation, on purpose. The
timing fact that matters: OpenAI dropped Scale AI as a data provider
after the Meta deal (June 2025), meaning the account has recently
re-evaluated who it sources human data from and on what neutrality
terms. That is the opening, and it is about governance, not capability.

| Person | Role | Why them | Warm path |
|---|---|---|---|
| **Joanne Jang** | Model behavior — **VERIFY** | Publicly leads the question of how a model should behave for a given user, which is Ursa Major's claim addressed to the one company with the most to lose from portability | The published Model Spec, which is a written-criteria artifact our §2 engages directly |
| **DERIVE — Model Spec authors** | — | The document is public and its authors are the right readers | The Model Spec |

### Google DeepMind

| Person | Role | Why them | Warm path |
|---|---|---|---|
| **Oriol Vinyals** | Gemini co-lead — **VERIFY** | Senior enough to sponsor; the personalization line of work is the fit | Published Gemini technical reports |
| **DERIVE — personalization/RLHF authors** | — | GDM publishes heavily; the authors are on the papers | The most recent Gemini technical report |

### Two names excluded on purpose

- **Meta.** Excluded from the target list this quarter, as a strategic
  choice rather than an oversight. Meta holds a reported 49% of Scale AI,
  and Scale's other frontier customers left *over that ownership alone*
  (`docs/market/landscape.md`). Ursa's single non-replicable asset is
  perceived neutrality. A Meta engagement early, at Ursa's size, is a
  fact the other four would eventually price in, and the trade is one
  contract against the premise of the company. Revisit only once there
  are several signed counterparties and the neutrality story is
  structural rather than reputational.
- **xAI.** Named in `CLAUDE.md` §4, deprioritized here for a boring
  reason: our only channel is published methodology, and there is not
  enough published post-training methodology to cite as a warm path. No
  citation, no opening. Not a judgment about the lab; a judgment about
  whether we have a door.

### Two names to read and never contact

| Person | Role | Why they matter | Rule |
|---|---|---|---|
| **Anisha Gunjal** (first author) and **Sean Hendryx** (senior author), "Rubrics as Rewards: Reinforcement Learning Beyond Verifiable Domains" (arXiv 2507.17746) | Scale AI | They wrote the canonical method our brief's first paragraph characterizes. They understand its limits better than any critic, and the paper is the most useful thing in the field for sharpening our argument | **Do not contact.** Scale is a direct competitor (`docs/market/landscape.md`, Category 1) and, post-Meta, a counterparty our buyers have publicly distanced themselves from. Read them closely; approach nobody. Cite the paper by name in the brief — engaging a competitor's published work by name is how a technical argument earns respect, and it costs nothing |

---

## What the owner owes this list, and what it owes her

**Before any note is sent**, three things must be true and two are not
yet: the role is re-verified that week (this file's **VERIFY** and
**DERIVE** marks are instructions, not decoration); `handoffs.md` H-1 and
H-3 are closed, so a reader who searches the company finds a working page
that calls the product by the name the brief used; and every `[C-n]` in
the drafted note still resolves in the claims ledger.

**Review cadence:** re-verify the **DERIVE** rows from their live
surfaces before the first send, and again if the list is still unsent at
quarter close. Roles in this field move on a quarterly clock — this run
caught one inside a single search.

**Calendar fact the owner should know now:** NeurIPS 2026 runs December
6–12, in Sydney with satellites in Atlanta and Paris. Essentially every
person on this list is in one of three rooms that week, and KR4.1 and
KR4.2 are due December 15 — nine days *after* it ends. If the owner ever
intends these two artifacts to be used rather than merely delivered,
their real deadline is late November, not December 15. That is the single
highest-leverage date correction in this document, and it is why this
draft exists on September 30 instead of December 14.

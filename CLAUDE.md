# URSA — Project Context

## 0. Orientation (read this first)

**Mission: Turn AI peer-to-peer.** Ursa Minor trains models on the
world's dispersed knowledge. Ursa Major imports your taste into every
model. The mission, the four principles of intelligence, and how they
bind are in `docs/vision.md`, which outranks this file wherever the two
differ. "The trust layer between AI users and AI labs" is positioning
(the how), not the mission (the what).

- Users get portability and ownership of their AI preferences across every model they use.
- Labs get consented, cross-model, revealed-preference data at population scale — the RLHF signal they can't build in-house.
- The same underlying network serves both, honestly, because the value flowing to each side depends on the other side working.

**Current state (2026-09-19):** `ursa run <project>` works (M0 shipped,
launch-based, git-native, no daemon). Two trials done: n=1 over the
Ursa Minor site build, n=2 over the full alexandria repo (owner-declared
unsatisfied). Plan of record: `docs/design/product-plan.md`. Standards
for any engineering deliverable: the engineering-artifact standard in
`prompts/engineer-agent.md`. Acceptance is never inferred from
retention; only the owner's declaration counts.

**Structure: one parent, two products.**

| | Ursa Major | Ursa Minor |
|---|---|---|
| Who it serves | Consumers / AI power users | Frontier + tier-two AI labs |
| Revenue | Zero, permanently, by design | All of it |
| Job | Exist and be genuinely valuable | Monetize what Major's existence produces |

The whole company only works if both trust relationships hold at once. Users trust Ursa because they're handed ownership. Labs trust Ursa because it delivers something unavailable anywhere else.

**Load-bearing constraints — do not design around these:**

1. Ursa Major never monetizes the user directly. The moment it does, the trust that makes enterprise revenue possible is destroyed.
2. The user can always see, edit, revoke, and delete what's been inferred about them. No dark patterns.
3. Raw processing happens on-device. Raw data never touches the aggregation layer.
4. The software is explicitly **not** the moat. Anyone competent could build it. What's slow and expensive to replicate is two-sided trust.

---

## 1. The data artifact (the technically distinctive part)

This is where the actual novelty lives. If you only internalize one section, make it this one.

The artifact **is not a rating or a preference pair.** It is a **provenance-resolved outcome record**: a finished piece of real work, joined backward to every model generation that fed it, with each span of the final product classified by what happened to it.

**Span classifications:**

- `survived_verbatim` — generated and kept unchanged
- `survived_mutated` — kept but edited. The mutation *is* the correction, expressed as an edit rather than a complaint.
- `generated_deleted` — produced and thrown away
- `no_generation_provenance` — present in the finished work but traceable to no generation at all, meaning the model was never in the running. **The most valuable category.**

**Trajectory metadata wrapped around the record:**

- turns to acceptance
- corrections that recurred
- the point where the goal itself shifted mid-task
- whether the thing was finished or abandoned

**Time dimension (when intermediate versions exist):** not just *what* survived but *how long*. This separates text that looked right and died on contact with the real work from text that was wrong on arrival.

**Why this is a distinct commercial object:** the label is supplied by the artifact rather than by a grader. Nobody judged the output. The work either used it or didn't. That is an outcome-based reward signal for exactly the open-ended domains — writing, research, applied engineering, everything without a unit test — where labs currently have no verifier and fall back on preference proxies for how good an answer *looks*.

---

## 2. BMC — URSA (parent company)

**Value Proposition**
Ursa is the trust layer between AI users and AI labs. Users get portability and ownership of their AI preferences across every model they use. Labs get consented, cross-model, revealed-preference data at population scale — the RLHF signal they can't build in-house. The same underlying network serves both, honestly, because the value flowing to each side depends on the other side working. Users trust us because we hand them ownership. Labs trust us because we deliver something they can't get anywhere else. The whole company only works if both trust relationships hold at once.

**Customer Segments**
Two distinct segments, connected by a single flywheel. Consumer side: heavy AI users, developers, writers, researchers, founders, and privacy-conscious early adopters who want their AI relationship to be portable and their data to be theirs. Enterprise side: five to ten frontier and near-frontier AI labs (Anthropic, OpenAI, Google DeepMind, xAI, Meta, Mistral, Cohere, and a handful of enterprise AI teams doing serious fine-tuning). Neither segment alone is the business — the mutual dependence is the point.

**Channels**
Consumer side runs on product-led growth, community, and content — organic reach among AI-power-user audiences, evangelism from users who care about data dignity. Enterprise side runs on direct high-touch sales, warm introductions through the AI research community, and credibility built by publishing methodology openly rather than marketing. Both channels reinforce each other: a lab that respects our methodology becomes a signal of trustworthiness back to users, and a user base that trusts us becomes proof-of-consent that lets us honestly sell to labs.

**Customer Relationships**
Radical transparency on both sides. Users can always see, edit, and delete what's been derived about them; that same transparency is the auditability story we tell labs. Consumer relationship is trust-first, product-led, human support where it matters. Enterprise relationship is high-touch, long deal cycles, contract-heavy, anchored on individual technical leaders inside each lab. Both relationships die if the transparency story is broken anywhere.

**Key Activities**
Growing the consenting user base — the single most important activity, because it feeds everything downstream. Continuously improving the preference-inference layer. Structuring the derived signal into lab-ready format without compromising user consent. Building and maintaining the privacy and consent architecture as core infrastructure, not marketing. Selling into a handful of large enterprise accounts. Publishing methodology openly so both sides can audit what's happening.

**Key Resources**
The consenting user base — the primary asset, and the one that compounds daily and can be destroyed in a week. The trust relationship with those users. The privacy and consent architecture. The longitudinal depth of the dataset. A small technical team, small enterprise sales function, serious privacy and legal counsel. Notably not a moat: the software itself, which anyone competent could build. What's slow and expensive to replicate is the two-sided trust.

**Key Partners**
Model providers, in a complicated three-way role: they're the platforms our users interact with, our customers on the data side, and the entities most capable of shutting us down. Managing this relationship — building in a way that makes us more valuable to partner with than to fight — is the strategic problem at the center of the whole company. Alongside them: privacy advocacy organizations as credibility allies, academic AI safety researchers as independent validators of our data quality, and specialist legal counsel from day one.

**Cost Structure**
Light. Raw processing happens on users' devices, so cloud costs stay modest and scale sub-linearly. Real costs concentrate in three places: privacy and legal engineering to make the consent architecture defensible, growth on the consumer side to reach scale where the data is statistically meaningful to labs, and a small senior enterprise sales function. This is not a capital-intensive business — the expensive parts of AI (compute, infrastructure) aren't ours to fund.

**Revenue Streams**
All revenue comes from the enterprise side. Annual data licensing contracts with AI labs, six to seven figures depending on lab tier. Commissioned signal collection as a higher-margin add-on where labs pay us to target specific weaknesses they're trying to fix. Consumer side generates zero revenue and never should. This is unusual as a revenue structure and worth naming clearly: the consumer product's job is to exist and be genuinely valuable, and the enterprise product's job is to monetize what that existence produces.

---

## 3. BMC — URSA MAJOR (the user product)

**Value Propositions**
Your AI history and preferences, portable across every model you use. From the first message on any AI, it already knows how you like to be answered — your style, your tone, your depth, your format preferences. Fully inspectable, fully editable, fully deletable. When you leave a model, your relationship with AI doesn't reset. Free forever for the user, because your consented signal is what makes the whole thing possible.

**Customer Segments**
Heavy AI users who juggle multiple models (Claude, ChatGPT, Gemini) and are tired of re-teaching each one who they are. Early adopter demographic — developers, writers, researchers, founders. Secondary segment: privacy-conscious users who want ownership of their AI data on principle, not just convenience.

**Channels**
Product-led growth. Word-of-mouth in AI-power-user communities (X, Hacker News, developer forums). Content marketing around data dignity and portability. No paid ads early — the whole point is that trust is earned, not bought.

**Customer Relationships**
Trust-first, radical transparency. The user can always see what's been inferred about them, edit it, revoke consent, or delete everything. No dark patterns. Support is human, not chatbot — the credibility of the product depends on it.

**Key Activities**
Continuously improving the preference-inference layer. Building support for more AI products. Maintaining the consent architecture and privacy engineering. Community building around the product's philosophy of user ownership.

**Key Resources**
The trust of the user base — the primary asset. The inference technology. The privacy-first architecture. Community and brand.

**Key Partners**
Model providers, in a delicate dual role — the platforms we run on, whose cooperation (or at least non-hostility) matters. Privacy advocacy organizations, as credibility allies. Open standards efforts around AI data portability, where they exist.

**Cost Structure**
Very low direct costs — most processing is on-device. Real costs: engineering, privacy and legal work, community and support. Some cloud costs for optional profile sync. Everything scales sub-linearly with users, since users aren't the ones being served resources.

**Revenue Streams**
Zero. This is a free consumer product. Its role is to exist, be genuinely valuable, and produce the consented signal Ursa Minor sells. Any attempt to monetize the user directly would kill the trust that makes both products possible.

---

## 4. BMC — URSA MINOR (the labs product)

**Value Propositions**
Peer-to-peer RLHF at population scale. Consented, cross-model, revealed-preference data drawn from real AI users on real tasks — the RLHF layer labs can't generate internally. Delivered in the shape your RLHF pipeline already ingests. Complementary to expert grading, not competing with it. Three properties nobody else can offer:

1. **Cross-model comparison** — what did the same user prefer between your model and your competitor's
2. **Revealed preference** — behavior, not performance
3. **Natural task distribution** — what people actually use AI for, not what a curator picked

**Customer Segments**
Frontier AI labs (Anthropic, OpenAI, Google DeepMind, xAI, Meta). Tier-two model developers (Mistral, Cohere, open-source foundations). Enterprise AI teams doing serious fine-tuning at scale. Five to ten total customers is the entire realistic market — this is not a mass business.

**Channels**
Direct outbound enterprise sales. Warm introductions through the AI research community. Credibility built by publishing about methodology, data quality, and privacy architecture rather than traditional marketing. Appearances at technical venues where the buyer's researchers actually spend time.

**Customer Relationships**
High-touch enterprise. Six-to-twelve-month deal cycles. Trust with individual technical leaders inside each lab matters more than any pitch. Once landed, relationships expand — first the data feed, then commissioned signal collection, then deeper pipeline integration.

**Key Activities**
Structuring raw preference signal into lab-ready format. Aggregating and anonymizing rigorously. Continuously improving data quality and freshness. Building relationships with technical leaders inside labs. Publishing methodology so buyers can audit what they're paying for.

**Key Resources**
The Ursa Major user base and their opt-in consent — without this, Minor has nothing to sell. The privacy and consent architecture that lets us defensibly sell derived signal. The longitudinal depth of the dataset, which compounds daily.

**Key Partners**
Ursa Major itself is the upstream partner — it's the source of everything sold here. Privacy engineering and legal counsel, as core infrastructure. Academic AI safety and alignment researchers, as credibility partners who can validate the data quality independently.

**Cost Structure**
Data pipeline engineering. Aggregation and anonymization infrastructure. Enterprise sales function (small, senior). Legal and compliance for the licensing contracts. Cloud costs for the aggregation layer — modest, since raw data never touches it.

**Revenue Streams**
Annual data licensing contracts, six to seven figures depending on lab. Commissioned signal collection as a higher-margin add-on. Eventually, deeper integrations that command pricing beyond the base data feed. Five to ten customers, one or two of them accounting for most of revenue — standard shape for an enterprise data infrastructure business.

---

## 5. Strategic notes for anyone (or anything) working on this

- **The central strategic problem:** model providers are simultaneously the platform, the customer, and the entity most capable of shutting Ursa down. Every design decision should be checked against "does this make us more valuable to partner with than to fight?"
- **The primary asset compounds daily and can be destroyed in a week.** Anything that touches consent, transparency, or user data handling is high-stakes by default and should not be optimized for convenience.
- **Ursa Minor is not selling more preference pairs into a market that already has them.** It's selling the missing verifier for open-ended work — the closest thing to ground truth in domains where ground truth was assumed not to exist.
- **Commissioned signal collection follows from the same logic:** a lab that knows it's weak in a specific area can pay to have outcome records concentrated there, which is only possible because the signal comes from real work rather than a fixed benchmark.
- **Publish methodology openly.** It's simultaneously the enterprise sales channel and the user trust proof.

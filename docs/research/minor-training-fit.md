# What Minor's data feeds — grounded in Lambert and Raschka

Owner directive (2026-09-20): once we have all this data, what can the
Ursa Minor side do with it? Answered against the two references that
define current post-training practice for the people who would buy
from us: Nathan Lambert's RLHF Book (Manning, July 2026; rlhfbook.com;
the Tulu 3 recipe, arXiv 2411.15124) and Sebastian Raschka's Build a
Large Language Model From Scratch (2024) and Build a Reasoning Model
From Scratch (2026; GRPO, distillation, verifiable rewards,
implemented by hand).

## 1. The standard recipe is the catalog

Lambert formalizes modern post-training as SFT → preference tuning
(DPO and kin) → RLVR, reinforcement learning from verifiable rewards.
Every stage has a data shape, and the outcome record produces all
three. That is the catalog, stage by stage:

| Recipe stage | What it consumes | What Minor supplies | Where it comes from in the record |
|---|---|---|---|
| SFT | instruction–response demonstrations | retention-filtered demonstrations: generations that survived verbatim in episodes the user DECLARED satisfying | `survived_verbatim` spans, gated on `episode.accepted === true` |
| Preference tuning (DPO) | (prompt, chosen, rejected) triples | ContrastivePairs: the rejected generation and the accepted one that replaced it, per correction and per regression | plan §10 `ContrastivePair`; every `survived_mutated` diff is one |
| Preference tuning, unary (KTO-family, ComPO) | accept or reject labels, no pairs needed | acceptance-only labels, which is exactly the label type the record natively holds | the declaration plus survival; our 2026-09-19 doctrine, not a workaround |
| RLVR | a verifier that scores a rollout | the missing verifier for open-ended work: declared satisfaction plus the survival scalar of what the person kept | `survivalScalar`, `Verdict` from the stated-verdict reader |

The fourth row is the pitch. The RLVR renaissance runs on domains with
verifiers: math, code, tests. Raschka's reasoning book trains on math
problems precisely because answers are checkable. The open question
both bodies of work leave standing is what verifies prose, design,
research, and judgment. Ursa's answer: the artifact and the declared
human verdict are the verifier. Minor sells RLVR's extension into
unverifiable domains, which is the one thing the recipe wants and
cannot generate internally.

## 1b. The slot is not empty, so the claim is the label's provenance

*Added by the research seat, 2026-10-05, on the recommendation carried
unchanged by the briefs of 2026-09-29, 09-30 and 10-02. §1 above is
left standing because its catalog is correct; this section corrects the
one sentence in it that the field has overtaken.*

§1 says Minor sells "the one thing the recipe wants and cannot generate
internally," and rests that on the open question of "what verifies
prose, design, research, and judgment." **That question is no longer
open in the form stated.** Since mid-2026 the field has filled the slot
with rubrics: *Rubrics as Rewards* and a corpus of at least a dozen
successors (OpenRS, EvoRubric, Rubric-ARROW, DeepRubric, Prompt-Level
Reward Specifications and others, surveyed in the briefs of 09-30 and
10-02) train open-ended domains against LLM-judged rubric scores, and
the subfield is mature enough to have built dedicated reward-hacking
infrastructure for itself (CHERRL, arXiv:2606.04923). A buyer reading
§1's original framing will answer it in one sentence, and they will be
right.

**The claim that survives is not absence, it is provenance.** A rubric
is a specification written in advance by whoever wrote the rubric, and
scored by a judge model standing in for a human who never saw the work.
Both halves are central assessment: the axes are declared before the
task, and the score is assigned by a proxy. The record's label is
neither. Its axes are discovered from what users actually corrected
(`discoveredSpec`, the correction basis), and its score is assigned by
the finished work — kept, edited, or deleted — by a person who was not
grading anything. So the two products are not competitors for one slot.
A rubric answers *does this output match the criteria someone
specified*. The record answers *did this output survive contact with
the work someone was actually doing*. Labs will buy both, and the
second cannot be manufactured in-house at any budget, because its
ground truth is created days later in a repository the lab never sees.

**The field has now measured why a fixed grader decays, which is the
strongest external support this argument has.** EvoRS (arXiv:2609.12459,
11 Sep 2026) states the mechanism directly: "as the policy optimizes the
current reward, an initially useful reward system may become unreliable
due to reward hacking or reduced response discriminability," and its
ablations "confirm that a comprehensive fixed reward system cannot
remain reliable in open-ended tasks and must evolve throughout
training." That is the fourth principle of intelligence
(`docs/vision.md` §0b) and `docs/beyond-preference-pairs.md` §2's third
assumption, measured by researchers with no interest in Ursa's thesis.

**Read its remedy, because that is where the two positions part.**
EvoRS's answer is an agentic designer that rewrites an executable
Reward-DAG from the policy's own rollouts. The loop never leaves the
system; no information the policy cannot already see enters it. The
measure is kept discriminative against the policy rather than
re-anchored to anything outside it. Ursa's answer is structural instead
of architectural: outcome labels regenerate from new finished work, so
the measure is re-anchored to the world at exactly the rate the world
produces work. **The sentence for the lab one-pager (O4 KR4.1): the
field's own best answer to reward staleness is a grader that rewrites
itself; ours is a grader we do not own.**

Consequence for the one-pager and for the public methods document
(O2 KR2.1): do not claim an empty slot. Claim the provenance of the
label, name rubrics as the complement rather than the competitor, and
let EvoRS carry the argument that a self-contained grader decays.

## 1c. Prior art, named before a buyer names it

*Added 2026-10-05. The research brief of that date records the failure
to surface this earlier as a detection failure of its own seat.*

The label type is not new, and the honest version of that is an asset.
Two references matter, and both should appear in Minor's materials
before a post-training researcher raises them.

**Post-edits.** *Post-edits Are Preferences Too* (arXiv:2410.02320,
Oct 2024, rev. Feb 2025) makes Ursa's §3.2 argument in machine
translation: in preference optimization an annotator judges two given
sequences, whereas "for post-editing, editors create s₁ and know that
it should be better than s₂", which makes post-edits "a source of
reliable human preferences **by construction**." It also cites Kreutzer
et al. (2018) for pairwise preferences being *less reliable* than other
feedback forms, and finds the best results come from SFT on post-edits
before preference optimization — a sequencing result that bears directly
on §5's ordering here. **The distinction to state: MT post-edits are
solicited from paid editors as the task itself.** The edit exists
because someone was employed to produce it, which is why those corpora
do not reach population scale. The record's `survived_mutated` spans are
a byproduct of work nobody was paid to label. The paper establishes that
the label type works; it does not and cannot supply the label at scale.

**Implicit feedback.** IFLLM (arXiv:2606.20482, 18 Jun 2026) is the
measured case for the economics: explicit feedback is rare and
expensive, existing methods "do not leverage implicit human feedback,
which has proven vital to the economic moats of Internet giants," and a
reward model built on implicit signals lifts text-based reward-model
accuracy "from 55% to 64%" and "nearly triples" relative response-quality
gains after DPO across eight models. **The distinction to state: its
implicit signals are attention proxies, ours are outcomes.** Mouse
trajectory and webcam eye-gaze measure whether a user looked at a
response; survival measures whether the finished work kept it. Ursa's
signal sits strictly downstream of the moment of decision, and it
carries the category gaze cannot produce at all:
`no_generation_provenance`, the spans of finished work traceable to no
generation. The study's collection method — 59 Mechanical Turk workers
with webcams, 1,336 questions — is also the argument for on-device
processing from the opposite direction: it cannot be offered to a real
user base, and it is why that dataset is bounded at lab scale while
ours is not.

Sources added 2026-10-05: arXiv:2410.02320; arXiv:2606.20482;
arXiv:2609.12459; arXiv:2608.13622; arXiv:2606.04923;
arXiv:2506.01937 (RewardBench 2, the incumbent in §3's eval slot).

## 2. GRPO makes the reward slot concrete

Raschka implements GRPO by hand: sample a group of rollouts, score
each with a reward, advantage against the group mean. The reward slot
is where Minor's data plugs in for open-ended tasks: a reward model
trained to predict the record's outcome (would this survive this
user's editing; would this population's survival scalar be high)
scores the group. That is the recognition-target reward model the
methods doc already proposes, now named against the exact algorithm a
tier-two team would run after reading his chapter.

## 3. The eval is the first product

Lambert's line of reward-model evaluation work (RewardBench and its
descendants) shows labs buy measurement before they buy training data.
Minor's lowest-trust-barrier first product is therefore an evaluation
set, not a corpus: tension cases where stated preference contradicts
revealed behavior (steps 650 vs 710 of the n=1), tacit closures where
the right label is silence-plus-retention, and regression cases where
an accepted state was destroyed. A reward model that scores these
wrong is provably miscalibrated on real revealed preference.

*Added 2026-10-05:* the incumbent in this slot is now **RewardBench 2**
(arXiv:2506.01937, ICLR 2026), where models score about 20 points lower
than on the original and the prompts are unseen rather than recycled
from downstream evaluations. It is credible and it is still built from
curated prompts with constructed answers, so Minor's eval differs on
one axis and that axis is the entire pitch: its cases come from work
that actually happened, and its labels were assigned by the work rather
than by the benchmark's authors. Tension cases, tacit closures and
regressions are not harder RewardBench 2 items; they are items its
construction method cannot produce. An eval
ships redacted, small, and public-methodology-first, which matches
O2 and the zero-cold-outreach posture of O4.

## 4. Raschka is the format oracle

His books define the data shapes practitioners actually implement:
instruction pairs, (prompt, chosen, rejected), GRPO rollouts with a
scalar reward. Minor delivers in exactly those shapes, so a buyer's
engineer can consume our corpus with the book open on the desk. The
delivery format section of the lab one-pager (KR4.1) should name the
shapes in his vocabulary and Lambert's, not ours.

## 5. Sequencing

1. The reward-model eval from tension and tacit-closure cases,
   redacted, methodology published beside it.
2. The DPO and KTO pair corpus from corrections and regressions.
3. RLVR outcome-reward sets: prompts plus the verifier signal, for
   open-ended domains.
4. The price book itself (`survival_stats`, plan §12) as the standing
   aggregate product: which behaviors survive, per domain, per model,
   per week.

Each step needs more trust than the last, and each is sellable alone.

Sources: rlhfbook.com; Manning, The RLHF Book (2026); Tulu 3, arXiv
2411.15124; Raschka, Build a Large Language Model From Scratch
(Manning 2024); Raschka, Build a Reasoning Model From Scratch
(Manning 2026).

## Addendum 2026-09-25 — the alexandria pull (chair session)

The owner asked the chair to query alexandria's claims database
through its MCP connector and report what bears on Ursa. Four claims
do, each with a consequence for this doc's plan:

1. **Harness-Zero** (arXiv 2609.24974; alexandria digest 2026-W39).
   Supervision built from mechanism-level trajectory review, where a
   reference agent passes good student actions and minimally rewrites
   bad ones, distills to 30% macro task success; supervision from
   final answers alone reaches 3 to 15%. This is external validation
   of the trace-not-label doctrine: the correction mechanism carries
   the signal, endpoint verdicts alone do not. Consequence: CaseUnit
   exports must keep the per-step correction context, not only the
   final diff.
2. **Revisiting Complete Reasoning Traces** (arXiv 2609.07103).
   Endpoint-only training consistently alters reasoning behavior.
   Consequence for the pair lane (n=2, commit endpoints): state in
   the lab one-pager that endpoint pairs shift behavior in ways full
   traces do not, which is an argument for selling the trace corpus
   beside the pair corpus, not instead of it.
3. **Mind2Dialogue** (arXiv 2609.15972). Training on simulated user
   mental states improves preference-following by 26.6 to 40.9 points
   over instruction-tuned baselines. The whys Ursa distills are that
   mental-state annotation, produced from real usage instead of
   simulation. A contrast worth one line in the one-pager.
4. **ACLArena** (arXiv 2609.23989). Sequential post-training stages
   destroy earlier capability (single-hop search 45.2 falls to 14.6
   after a later stage, recovering only partially). Consequence for
   Major's import story: per-user tuning lands as adapters or merged
   batches, never as fine-tunes stacked sequentially on one
   checkpoint.

Availability: the connector is chair-only (a local MCP on the owner's
machine). Seats citing these read the arXiv links above.

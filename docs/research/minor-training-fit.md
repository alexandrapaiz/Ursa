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
wrong is provably miscalibrated on real revealed preference. An eval
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

# Beyond preference pairs

**A methods position: what outcome records support that comparison data cannot.**
*Ursa — draft v0.1, 2026-08-05. Grounded throughout in the first provenance-resolved
outcome record (`ursa-major/trial/task-001/`), n=1 by design: every claim cites a
label that record actually contains.*

---

## 1. The claim

The standard human-feedback pipeline — sample two responses, ask which is better,
fit a scalar reward (Bradley–Terry), optimize against it — is not just
*undersupplied* with good labels in open-ended domains. It is built on three
assumptions that revealed-outcome data falsifies. The outcome record supports
four training constructions that do not require those assumptions, and each is
*stronger* than the pairwise construction it replaces, not merely a substitute
for it.

This is the technical core of what Polaris sells. The pitch is not "more
preference pairs." Labs manufacture pairs internally at any volume they want.
The pitch is label types that cannot be manufactured, because their ground
truth lives in finished work the lab never sees.

## 2. Three assumptions pairwise RLHF makes, and where the record falsifies them

**Assumption 1: quality is one-dimensional.** A scalar reward collapses every
way an output can be wrong into one number. In task-001, the corrections
demonstrably move along separable axes: motion continuity (loop A), spatial
composition (loop B), contrast calibration (loop C), edit scope (loop D). A
scalar trained on "which is better" destroys exactly the information the loops
carry — *which dimension* was wrong. The dimension is the transferable part:
"this user corrects for motion continuity" predicts her next project; "this
user preferred response B" predicts nothing.

**Assumption 2: the preference exists before the comparison.** The Tacit
Intelligence principle, stated operationally: much of what a person knows shows
up only in action applied to a particular case, not as a statable rule. The
record contains the direct falsification. At step 650 the user instructed "the
constellation should not move with mouse"; at step 710, "please place the
constellation where my mouse is." Both statements were sincere; neither was the
preference. The preference *came into existence through the loop* and stabilized
only at acceptance (step 730). A preference pair elicited between steps 650 and
710 would have produced a confident label for a preference that did not yet
exist. Elicitation does not sample a distribution; mid-trajectory, it
manufactures one.

**Assumption 3: the measure can stand in for the world.** The Pretence
principle: claims of information sufficient for central assessment overreach,
and systems built on them conform to the measure rather than the world. In RL
this failure mode has a name — reward hacking. A frozen reward model is a
central assessor; policies Goodhart it. Outcome labels resist this structurally,
not through better modeling: they regenerate from new finished work
continuously, so the measure is re-anchored to the world at exactly the rate
the world produces work.

## 3. Four constructions the record supports instead

### 3.1 Unary outcome learning (the record is natively KTO-shaped)

Methods in the KTO family train on *unary* labels — this output was
accepted / this output was rejected — rather than pairs. The record's span
classes are precisely that signal at the granularity of individual
generations: `survived_verbatim` (accepted wholesale), `generated_deleted`
(rejected by the work), with per-generation survival rates as soft labels
(task-001: 193 generations, survival 0.00–1.00, artifact-assigned). Reducing
this to sampled pairs would be a strict information downgrade of data that is
already in the stronger format.

### 3.2 Learning from corrections, not comparisons

A `survived_mutated` span stores the diff — not "B > A" but *"here is A, and
here is the exact edit that made it acceptable."* An ordering is one bit; an
edit is a direction in output space, supplied by the world rather than a rater.
Correction-based and inverse-RL methods consume this directly. At scale, the
mutation corpus is a supervised dataset of ⟨context, model output, minimal
acceptable revision⟩ — the label a preference pair gestures at and never
contains.

### 3.3 The correction basis (dimensionality discovery done right)

The right version of "run PCA on it": embed every ⟨before, after⟩ correction
and every closed loop across thousands of records, then factor the space —
learned embeddings and sparse dictionaries rather than linear components. What
falls out is the **correction basis**: the low-dimensional set of axes users
actually correct along, per domain, discovered from data rather than specified
by a taxonomy author. Task-001's hand-written `discoveredSpec` fields are this
factorization performed manually for n=1 ("pixelated in appearance, continuous
in motion"; "darkness needs headroom"). The deliverable this implies is not a
pair dataset but a **vector-valued reward with interpretable components**, each
component grounded in outcome labels. This preserves Distributed Intelligence
rather than violating it: the basis is aggregated from dispersed corrections
without requiring any central observer to have known the axes in advance.

### 3.4 Model the recognition function, not the preference function

The deepest replacement. The user's *statements* were non-stationary and
self-contradictory (650 vs. 710); her *recognition* never erred — she reliably
knew satisfaction on contact, including tacitly (loop C closed at steps
757–758 with no verbal approval; the shipped artifact's retention is the
label; `signals.episode.acceptanceStatedInChat: false`). So the stable
learnable object is not "what does this user say she prefers" but **"what will
this user's work accept and retain."** That is a different supervised target —
predict acceptance and retention, not judged quality — and outcome records are
the only data that carries its labels, because the label is only assigned by
the finished work, sometimes days later.

## 4. The dialectical structure (why deleted generations are not waste)

Discovery of Intelligence, stated operationally: generation is warranted
precisely where the correct result cannot be specified beforehand — if it
could be, there would be nothing to discover. Consequence: in open-ended work
there is **no true reward function ex ante**. There is a process that
converges to one.

The record captures that process as a sequence of determinate negations. Each
deleted generation does not merely fail; it *determines* the spec by one more
clause: not-diagonal (step 615), not-stepping-on-the-pixel-grid (step 296's
surviving comment), not-darker-everywhere (steps 757–758). The final
`discoveredSpec` is the residue of these negations — a spec that exists only
because the failed generations existed. `generated_deleted` is therefore the
*constitutive* category, not the waste category: 82.1% of generated characters
in task-001 were deleted, and that 82.1% is where the spec was forged.

In RL terms: reward is defined relative to the trajectory. Terminal acceptance
is the only absolute label; every intermediate survival signal is shaping that
the episode itself discovered. A lab training on preference pairs buys
snapshots of this process with the process discarded. The record is the
process, with its resolution attached.

## 5. What this implies Polaris ships

1. **Unary acceptance/rejection corpora** — span classes and per-generation
   survival, native KTO-format (from `files[].spans`, `generations[]`).
2. **Correction corpora** — mutation diffs as ⟨context, output, minimal
   acceptable revision⟩ (from `survived_mutated` spans).
3. **The correction basis** — the factored dimension structure per domain,
   with per-dimension outcome-grounded reward components (aggregated across
   records; the `discoveredSpec` fields are its human-readable projection).
4. **Recognition-target labels** — acceptance and retention outcomes,
   including tacit acceptance, for training reward models on "will this
   survive contact with the work" (from `signals.episode`,
   `signals.correctionLoops[].resolution`).
5. **Trajectory supervision** — loops, graded repair attempts, regression
   events, feedback→mechanism translations, for process reward and agentic RL
   (from `signals`).

Each row of every corpus carries provenance pointers (`step` ordinals joining
to generations and prompts), so the buyer can audit any label back to the raw
generation and the user's verbatim words. Publishing this document is part of
the method: the methodology is simultaneously the sales channel and the proof
of good faith to the users whose consent produces the data.

## 6. Honest limits

- n=1 demonstrates label *types*, not statistics. Every quantitative claim
  here is an existence proof.
- The correction basis requires cross-user scale before its axes are anything
  but anecdote; at n=1 it is hand-annotation (`signals.method:
  "manual-annotation"`, declared in-band).
- Recognition-target labels need longitudinal retention windows; task-001's
  window is days, not months.
- Within-session survival is computable by any lab from its own telemetry for
  consenting users. The differentiated labels are the ones that depend on what
  the lab structurally cannot see: the final artifact's state after the
  relationship ends, the cross-model half of the same artifact's provenance,
  and consent that survives legal review for training use. Those live with
  the user. That is not a marketing constraint; it is why the signal must
  flow through something the user owns.

## The price analog (owner note, 2026-09-18)

Hayek's system does not run on dispersed knowledge alone. It runs
because the price compresses that knowledge into one number that
travels, and the number is actionable without its causes. Ursa needs
its analog of price, and the record already contains it: survival,
meaning retention through use.

A generation's price is what the work paid for it. Kept verbatim, kept
edited, or deleted. The analogy is exact on every property that makes
price work. Prices emerge from transactions rather than opinions, and
survival emerges from what the work used rather than what a grader
judged. Prices are actionable without their causes, and a lab can train
on a falling survival rate without seeing any user's circumstances,
because the whys stay with the user in the tuning store. The price
system transmits the signal and never the particulars, which is the
on-device architecture restated: derived signal leaves the machine, raw
circumstances do not. On-device processing is therefore a Hayekian
necessity, not a privacy feature. Prices are comparable in a common
unit, and this gives the cross-model claim its precise meaning: the
same user's work under two models yields a ratio of survival rates,
which is a relative price between models that only a cross-model layer
can quote. Finally, prices equilibrate. Labs respond to survival rates,
models improve, and survival rises.

Two corollaries. The tuning axiom is the user's personal shadow price,
the compressed rule their own transactions revealed. Deleted
generations are the losses, the determinate negation that disciplines
production and makes the market learn.

The discipline this imposes on the product: Ursa must always be able to
quote a scalar. Every lab-facing deliverable reduces to survival rates
with confidence, per behavior, per model, per domain. The moment we
ship high-dimensional particulars instead, we are a census bureau
rather than a price system, and the census bureau was the villain of
the calculation debate.

## The fine-tuning trace and the label (owner note, 2026-09-19)

Do not read the H in RLHF as the user's commits. The H is the in-chat
fine-tuning: the live correction stream where the user steers the
agent turn by turn. What the AI does is reverse engineer what was
fine-tuned there. The commits, and the finished artifact behind them,
are something else: they are the label.

The Hayekian laws bind here. While fine-tuning in chat, the user often
does not know what she wants. Steps 650 and 710 of the first trial are
the canonical case: two sincere instructions, one hour apart, that
contradict each other. An instruction is therefore a feature of the
trajectory, never ground truth. A system that treats instructions as
labels learns the user's guesses, not the user's tuning.

Success is measured by the finished product and by user satisfaction,
not by user instruction, because users do not know what they want
until they get it. Only the getting it can grade the process. In the
record's terms: retention and felicitation are labels; prompts are
trajectory.

The consequence for capture is a division of labor between the two
adapters. Session capture carries the trace, which is where the
fine-tuning churns, and the first trial's 82 percent deletion rate is
that churn measured. Git capture carries the label, which is why the
second trial's commit pairs showed only 7 percent deletion: a commit
already sits near the label end of the funnel. Neither stream
substitutes for the other. A full record joins them, trajectory in,
retention-graded out, and a record should state which stage of the
funnel it measured.

The consequence for training is the position this document already
holds, now stated at its root: the trajectory is the input, acceptance
is the reward, and the distiller reverse engineers the whys from the
trace while the artifact, not the chat, supplies the grade.

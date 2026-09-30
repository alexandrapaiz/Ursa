# The lab brief (O4 KR4.1) — draft 1, awaiting owner approval

**Status: draft for the owner's approval. Not sent to anyone. Not
published.** KR4.1 is due 2026-12-15; this is draft 1, delivered
2026-09-30. Every factual line carries a claim ID from
`docs/sales/claims-ledger.md`; a reviewer should be able to check each
one against a file in the repo rather than trust it.

Format note: the page below is the artifact. Everything after the rule
is apparatus for the owner, not part of the one-pager.

---

## Ursa Minor — the outcome record

**The problem you already know you have.** Reinforcement learning from
verifiable rewards works where correctness is checkable. In the domains
that make up most of what people actually use models for — writing,
research, applied engineering, design — there is no verifier, and the
field's 2026 answer has converged on rubrics: a criteria list written
before the work, scored by a judge model. That answer requires the thing
open-ended work does not have, which is a specification of the right
answer available in advance, and it optimizes for how an output reads to
a grader rather than whether it was any use. It is the best available
substitute. It is still a substitute.

**What we built instead.** Not a rating, and not a preference pair. A
**provenance-resolved outcome record**: a finished piece of real work,
joined backward to every model generation that fed it, with each span of
the final product labeled by what the work did with it.

- `survived_verbatim` — generated, kept unchanged
- `survived_mutated` — kept but edited. The edit *is* the correction,
  expressed as a diff instead of a complaint
- `generated_deleted` — produced and thrown away
- `no_generation_provenance` — present in the finished work and
  traceable to no generation at all. The model was never in the running.
  The most valuable class, and the one no lab can compute from its own
  logs

Wrapped around it: turns to acceptance, which corrections recurred,
where the goal itself moved mid-task, and whether the thing was finished
or abandoned. `[C-3]`

**Why the label is different in kind.** Nobody judged the output. There
was no grader, no rubric, and no rater with an opinion to supply. The
work either used the text or it didn't, and the person doing the work was
not being paid to have a view — they were trying to finish something.
Every vendor in this category sells solicited judgment. This is the
residue of real work. `[C-3]` `[C-9]`

**What it produces, concretely.** Five corpora, each row carrying step
ordinals that join the label back to the generation that produced it and
the user's verbatim words: unary accept/reject in native KTO shape;
correction pairs as ⟨context, output, minimal acceptable revision⟩; the
per-domain correction basis, factored into dimensions with
outcome-grounded reward components; recognition-target labels for
training a reward model on *will this survive contact with the work*;
and trajectory supervision — loops, graded repair attempts, regression
events — for process reward and agentic RL. `[C-13]`

**What runs today.** One command against a real git repository's full
history produces records with no daemon and no background process, and
the machine it runs on is the only machine the raw data touches. `[C-1]`
`[C-2]` Code is matched line-by-line, prose sentence-by-sentence, so
this is not a code-only method. `[C-5]` Two input paths are implemented:
agent session transcripts, and conversations pasted out of any chat
product. `[C-4]` Satisfaction is read from the user's own words in the
session rather than asked for with a button — on our first real record
it read acceptance correctly and unaided from "yesss finallyyy!! lol".
`[C-9]`

**Where we actually are, stated plainly.** Two trials. One user. On the
second, the owner declared herself **unsatisfied** with the result, and
that verdict is in the repository, because acceptance is never inferred
from retention here — only the declaration counts. `[C-6]` `[C-7]` The
calibration problem is published with numbers rather than smoothed over:
55 uncertain spans in the first record, match thresholds at 0.35–0.6,
retuning tracked as a public key result. `[C-11]` Where the first record
leaned on hand annotation, the data says so in-band. `[C-12]` The
methodology, including a section titled "Honest limits," is written down
and open. `[C-13]`

**What you can audit before paying for anything.** The method, the
schema, the span classifier's thresholds, and the failure cases — all
open. What you cannot audit yet is a live record, and the reason is the
strongest thing we can tell you about how the data is handled: the first
records we produced contained verbatim user prompts and local paths, our
own security review caught it, and the records were pulled into a
private repository and this repository's history purged. They come back
redacted, per record, or not at all. `[C-10]`

**Why this has to run through something the user owns.** Within-session
survival is computable by any lab from its own telemetry. The labels
that aren't are the ones the lab structurally cannot see: the artifact's
state after the session ends, the other half of the same artifact's
provenance that belongs to a competitor's model, and consent that
survives legal review for training use. Those live with the user. `[C-13]`

**What we are not claiming.** No population statistics — two trials are
an existence proof for a label type, not a measurement. `[F-1]` `[F-7]`
No cross-vendor corpus — the input format admits one by construction, and
none has been produced. `[F-2]` No comparison against your current
pipeline, because we haven't run one. `[F-9]` No customers. `[F-5]`

**The ask.** Read the methodology and tell us where the label is wrong.
That is the entire ask; there is nothing to buy today.

---

## Apparatus for the owner

**What to check before approving.** Three lines are the ones a lab
researcher will push on hardest, and each is deliberate:

1. *"The field's 2026 answer has converged on rubrics."* Defensible and
   current: Scale AI's "Rubrics as Rewards" (arXiv 2507.17746) is the
   canonical method, there is an ICML 2026 poster on exploiting the
   generation–verification gap in non-verifiable domains, and there is a
   2026 survey of the rubric literature. The wording says *converged on*,
   not *failed at* — overstating this is the fastest way to lose a
   post-training researcher in the first paragraph.
2. *"The most valuable class, and the one no lab can compute from its own
   logs."* True as stated — `no_generation_provenance` requires the
   finished artifact, which the lab never sees. Keep "from its own logs";
   without it, a reviewer can counterexample it with public-repo
   archaeology (see `outreach/validators.md`).
3. *The unsatisfied verdict.* Named on purpose, and the single most
   persuasive line on the page to this buyer. Do not let a later draft
   soften it into "mixed results."

**What this draft deliberately does not do.** No pricing (the owner's,
and `docs/market/positioning.md` records that no comp precise enough to
anchor a number has been found). No logo, no deck, no design pass — the
site's own register is bare nouns and no marketing copy, and this should
match it. No link to a public methodology URL, because O2 KR2.1 has not
shipped one yet; when it does, that link replaces the words "the
methodology" in the ask.

**Blocked on, to become sendable rather than merely approved:**
`handoffs.md` H-1 (the site's only CTA is disabled, so there is nowhere
to point a reader) and H-3 (the public page says "Polaris," every other
artifact says Ursa Minor — a brief and a site that disagree on the
product's name reads as a company that does not exist yet).

**Next revision trigger:** when O2 KR2.1 publishes the methodology
(target Nov 30), or when KR1.3's multi-source record lands and `[F-2]`
moves to the permitted table — whichever is first. Not on a schedule.

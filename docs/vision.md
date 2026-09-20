# Vision — Ursa

## §0 Mission

Turn AI peer-to-peer.

*The mechanism: a distributed system of millions of users, a
constellation. Preferences are revealed through real use, processed
on-device, and transmitted only as derived signal, never raw
particulars. The signal flows both ways at once: it improves the
models, and it makes every model instantly know its user. A new layer
of the AI stack, built on Hayek's insight that the knowledge that
matters exists only dispersed.*

*Held quarterly by the OKR seat once activated. The full product thesis
lives in README.md and CLAUDE.md; this file carries only what governance
needs.*

## §0b Principles of intelligence

Held with the mission; the OKR seat reads them every run. Canonical
wording from the Ursa Minor site (ursa-minor/app/page.tsx), the
product's public north stars:

1. **Distributed intelligence.** "The information a decision needs is
   dispersed across many individuals. No single observer ever holds it
   whole."
2. **Discovery of intelligence.** "Generation discovers facts that
   would otherwise stay unknown. If the result could be specified
   beforehand, there would be nothing to discover."
3. **Tacit intelligence.** "Much of what people know cannot be stated
   as rules. It shows up only in action, applied to a particular case."
4. **Pretence of intelligence.** "Claims of information sufficient for
   central assessment always overreach. Systems built on them conform
   to the measure, not the world."

How they bind (owner directive, 2026-09-18): these principles guide the
project. Objectives, key results, and shipped work are checked against
them, and work that contradicts one is drift even when it scores well.
A central grader contradicts the first. A benchmark that demands the
spec up front contradicts the second. A stated-preference survey
contradicts the third. A metric the system starts conforming to
contradicts the fourth. Their operational form is the price analog
(docs/beyond-preference-pairs.md, "The price analog"): transmit
survival, never the particulars.

## §1 Structure

One parent, two products, one repo for now (owner's call, 2026-09-18):
Ursa Major (consumers; zero revenue permanently, by design) and Ursa
Minor (labs; all revenue).

Product missions, set with the parent's (2026-09-18):

- **Ursa Minor** — Train models on the world's dispersed knowledge.
- **Ursa Major** — Import your tuning into every model. The split into separate repos happens when
the products' cadences diverge; until then `ursa-major/` and
`ursa-minor/` live here.

## §2 Operating model

Ursa is a portfolio product of Alexandra Systems Company and inherits
its standards (docs/standards/pm.md, vendored). Full seat roster
installed from alexandria, ALL DORMANT: no schedules, owner-dispatch
only. Activation order and OKRs are set with the owner in the OKR
walkthrough (pending). The owner's merge is the only authority gate.

## §3 Non-goals

- Ursa Major never monetizes the user directly.
- No dark patterns: the user can always see, edit, revoke, delete.
- Raw processing on-device; raw data never touches aggregation.

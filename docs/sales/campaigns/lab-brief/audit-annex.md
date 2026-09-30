# Annex — what a buyer can audit, line by line

Companion to `one-pager.md`, serving the second half of O4 KR4.1 ("what
a buyer can audit"). **Draft, not sent.** This is the page handed over
when a lab's researcher says "fine, show me" — and the one a lab's legal
and security reviewers read instead of a trust-us paragraph.

The structure is deliberate: a buyer in this category has just watched
the largest vendor in the market lose Google, OpenAI and Microsoft over
neutrality alone (`docs/market/landscape.md`, Scale AI entry). The
question behind every question is *what can I verify without taking your
word for it.* So each row below says what is checkable **today**, and
says plainly when the answer is "nothing yet."

## 1. The label itself

| What a buyer wants to verify | Auditable today? | How, or what it waits on |
|---|---|---|
| That a span's class is correct | **Partly.** The classifier, its thresholds and its uncertain-span behaviour are open; no live record is yet public | Read `ursa-major/src/match.ts`; the threshold range (0.35–0.6) and the 55 uncertain spans in the first record are stated `[C-11]`. A public record is gated on O2 KR2.2 and the redaction pass `[F-3]` |
| That a label traces back to a specific generation | **Method: yes. Instance: not yet.** Every corpus row carries step ordinals joining it to the generation and the user's verbatim words | `docs/beyond-preference-pairs.md` §5 `[C-13]`. The instance is `[F-3]` |
| That acceptance was not inferred from the buyer-friendly direction | **Yes, and this is the strongest check available.** The one declared verdict on record is negative `[C-7]` | `CLAUDE.md` §0. Acceptance requires the owner's declaration; retention never counts |
| That the verdict reader is not just keyword-matching optimism | **Yes, one case.** It read acceptance from "yesss finallyyy!! lol" at step 730, unaided `[C-9]` | `docs/ideas.md`, chair entry 2026-09-25. n=1; there is an eval in flight on a labeled set — do not cite its numbers until it merges |
| That hand annotation isn't being passed off as automation | **Yes.** Declared in the data (`signals.method: "manual-annotation"`) `[C-12]` | `docs/beyond-preference-pairs.md` §6, and retiring it is a named key result (O1 KR1.2) |

## 2. The data handling

| What a buyer wants to verify | Auditable today? | How, or what it waits on |
|---|---|---|
| That raw data never reaches an aggregation layer | **Architecturally, yes; by inspection of a running system, not yet.** Raw processing is on-device and is a load-bearing non-goal to violate | `docs/vision.md` §3; `CLAUDE.md` §0 constraint 3. The overlay's sync store holds ciphertext only `[C-8]` |
| That a privacy claim survives contact with reality | **Yes — there is a worked failure.** The first records held verbatim prompts and local paths; the security seat caught it; records were withdrawn to a private repo and history purged `[C-10]` | `ursa-major/trial/README.md`. A vendor with no such incident on record either has not looked or is not telling you |
| That consent is documented well enough for a training-use legal review | **No.** This is the honest gap | There is no consent artifact yet. Naming it as unbuilt is better than a paragraph that implies otherwise `[F-6]` |
| That users can see, edit, revoke and delete | **As a binding constraint, yes. As a shipped surface, no** | `docs/vision.md` §3 states it as a non-goal to violate; the surface is unbuilt `[F-6]` |

## 3. The company

| What a buyer wants to verify | Auditable today? | How |
|---|---|---|
| That Ursa is not owned by, or sharing a parent with, a competing lab | **Yes.** Subcompany of Alexandra Systems Company; no model-developer investor, no lab parent | `CLAUDE.md` §0 (holding-company note), `docs/decisions.md` ADR-006 |
| That the consumer side is not monetized, so incentives don't invert | **Yes, and it is written as a constraint rather than a stage** | `docs/vision.md` §3; `CLAUDE.md` §3 (Ursa Major revenue: zero, permanently, by design) |
| That development is inspectable | **Yes, unusually so.** The repository is public, decisions are ADRs, mistakes are incidents, and the method's limits have their own section | `docs/decisions.md`, `docs/agents/incidents.md`, `docs/beyond-preference-pairs.md` §6 |

## 4. The three questions this annex cannot answer yet

Say these before the buyer finds them. Each is a real gap with a gate.

1. **"Show me one record."** Not today `[F-3]`. Gated on O2 KR2.2 plus
   the redaction standard and per-record sign-off. Target: the same Nov
   30 window as the methodology publication.
2. **"Show me two models' generations in one artifact."** Not today
   `[F-2]`. The input path admits it; no record has done it. Gated on O1
   KR1.3.
3. **"How many users?"** Two trials, one user `[F-1]`. There is no
   version of this answer that sounds good, so it should be given first,
   flatly, and followed by what the two trials do establish: that the
   label type exists and is computable from real work.

## 5. The line not to cross when answering an audit question

A buyer's technical reviewer will offer generous framings — "so you'd
expect roughly X%," "presumably at scale this shows Y." Every one of
those is `[F-7]`, and agreeing with a number a buyer supplies is how a
company ends up having claimed it. The sentence that holds:

> We have two records. They demonstrate that the label type is
> computable from finished work. Anything about magnitude is a question
> the corpus answers or nobody does, and it does not exist yet.

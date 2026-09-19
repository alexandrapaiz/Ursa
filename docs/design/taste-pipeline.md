# The taste pipeline — regular sessions in, portable taste out

Owner directive, 2026-09-18: make regular chat and code sessions useful
for RLHF. The H is the human interacting with the agent through
building. The RLAIF is an AI reverse-engineering the whys and storing
them, so the user's taste is theirs and portable; anonymized and
cleaned, the same signal serves frontier labs.

## Four layers

1. **Capture** (exists): the resolver. Session plus finished work in,
   outcome record out. This is the H: revealed preference through
   building — what survived, what was edited, what was deleted, what
   recurred, what regressed.
2. **Interpretation** (this build): the RLAIF pass. A model reads the
   record's correction signals and the user's verbatim prompts and
   states the underlying whys as axioms. Discipline that keeps it
   honest: the model judges, the code counts. Every axiom must carry
   evidence pointers joinable to record steps, or it is rejected in
   validation. Confidence is evidence count, never a model's
   self-reported score.
3. **The taste store** (this build): `taste.json`, user-owned and
   local. Axioms compound across records; a re-distilled axiom gains
   evidence instead of duplicating; stated-versus-revealed conflicts
   are wired symmetrically as tensions, surfaced, never averaged.
   The user can edit or revoke any axiom; revocation survives future
   distills (tombstones).
4. **Export** (this build): `taste.md`, the portable context block.
   Paste into any model's instructions and it starts from your taste
   instead of zero. Portability works today through context, with
   fine-tuning-grade contrastive pairs (the acceptance-label work) as
   the later, lab-facing form. Anonymized aggregation across users is
   the Ursa Minor layer and is out of scope here by design: raw
   records and taste stores never touch an aggregation surface.

## Implementation (ursa-major/src/taste/)

- `types.ts` — TasteAxiom, TasteRecord, DistillOutput.
- `distill.ts` — prompt construction from the record's LabSignals plus
  prompts; runs locally through `claude -p` (the user's own machine and
  subscription); strict parse and validation, axioms without evidence
  rejected.
- `merge.ts` — deterministic merge: match → evidence accrues and
  confidence rises; new → id assigned; revoked → ignored;
  contradictions wired symmetrically.
- `export.ts` — the taste block, grouped by domain, confidence-ordered,
  tensions listed with an ask-don't-guess instruction.
- `cli.ts` — `distill --record --taste [--model]` and
  `export --taste [--out]`.

## Relation to resolver v2

The distiller consumes correction signals. Today those come from the
hand annotations (method: manual-annotation); when v2's loop
auto-detection and acceptance labels land, the same distiller runs on
auto-detected signals and the pipeline is end to end: session →
record → signals → taste → any model. That full path is the Ursa Major
product loop.

## Open questions (ledger candidates)

- Cross-model capture adapters (ChatGPT exports, Cursor, generic chat
  logs) so the H is not Claude-only.
- Distiller quality evaluation: does an exported taste block actually
  reduce correction loops in a fresh session? That is the product's own
  outcome record — Ursa eating its own signal.
- Redaction interaction: taste.json is derived signal, but quotes are
  verbatim user words; the security seat's standard governs any taste
  artifact that leaves the machine.

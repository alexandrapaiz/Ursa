# Ursa

**The trust layer between AI users and AI labs.**

Users get portability and ownership of their AI preferences across every model they use. Labs get consented, cross-model, revealed-preference data at population scale — the RLHF signal they can't build in-house. The same underlying network serves both, honestly, because the value flowing to each side depends on the other side working.

## Structure: one parent, two products

| | Ursa Major | Ursa Minor |
|---|---|---|
| **Serves** | Consumers / AI power users | Frontier + tier-two AI labs |
| **Revenue** | Zero, permanently, by design | All of it |
| **Job** | Exist and be genuinely valuable | Monetize what Major's existence produces |

The company only works if both trust relationships hold at once. Users trust Ursa because they're handed ownership. Labs trust Ursa because it delivers something unavailable anywhere else.

## The distinctive artifact

The commercial object is not a rating or a preference pair. It is a **provenance-resolved outcome record**: a finished piece of real work, joined backward to every model generation that fed it, with each span classified by what happened to it —

- `survived_verbatim` — generated and kept unchanged
- `survived_mutated` — kept but edited (the mutation *is* the correction)
- `generated_deleted` — produced and thrown away
- `no_generation_provenance` — present in the finished work but traceable to no generation at all — the most valuable category

The label is supplied by the artifact, not by a grader. Nobody judged the output; the work either used it or didn't. That is an outcome-based reward signal for exactly the open-ended domains — writing, research, applied engineering — where labs currently have no verifier.

## Load-bearing constraints

1. Ursa Major never monetizes the user directly.
2. The user can always see, edit, revoke, and delete what's been inferred about them. No dark patterns.
3. Raw processing happens on-device. Raw data never touches the aggregation layer.
4. The software is explicitly **not** the moat. What's slow and expensive to replicate is two-sided trust.

---

See [`CLAUDE.md`](./CLAUDE.md) for full project context, the three Business Model Canvases, and strategic notes.

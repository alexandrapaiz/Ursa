# Engineer run, 2026-10-23 — revocation enforced at the store

Status: in progress. Opened draft before the work, per the ship-first rule
in `prompts/engineer-agent.md`.

Trigger: a handoff from the research seat. The consent design promises that
a re-distill cannot revive a revoked axiom and names two defenses. One is a
check inside `mergeDistill`; the other is an instruction in the distill
prompt. The merge check is reachable only through `matchesExisting`, a field
the model fills in, so a model that restates a revoked axiom as a new
statement walks past it.

Work planned this run:
1. Confirm the reachability claim by reading `ursa-major/src/tuning/merge.ts`
   in full.
2. Enforce revocation at the store, independent of any model-supplied field.
3. The test the design document already promises: a re-distill after a
   revocation does not revive the statement even when `matchesExisting` is
   null.

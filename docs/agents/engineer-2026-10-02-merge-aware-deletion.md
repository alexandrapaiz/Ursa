# Engineer run — 2026-10-02: merge-destroyed generations are not human deletions

Draft opened at the start of the run per the ship-first rule
(prompts/engineer-agent.md, "Ship first, then work"). Contents are
filled in as the run proceeds; if the run dies, what is here is what it
had.

## Target

The defect PR #61 named and did not fix (its ledger idea 1, the one that
run said it would prioritize): `ursa-major/src/pairfinder.ts` refuses to
pair a generation against a merge commit, correctly, because the human
did not write a merge's diff. But `ursa-major/src/resolve.ts` routes
every unclaimed generation segment to `generated_deleted` with no cause,
so text a merge destroyed mechanically is recorded as text the human
produced and threw away.

`generated_deleted` is one of the four span classifications Ursa Minor
sells (CLAUDE.md §1). A false positive in it is a mislabel in the
commercial object.

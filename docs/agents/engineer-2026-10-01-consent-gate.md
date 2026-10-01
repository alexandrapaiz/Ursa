# Engineer run — 2026-10-01: the consent gate

Working note. Opened before the work, per the ship-first rule
(prompts/engineer-agent.md, "Ship first, then work").

## Observation that set the day

`gh pr list --state open` shows 30 open PRs, 15 of them from this seat,
and zero engineer PRs have ever merged. L-E10 forbids writing a fourth
implementation of anything a branch already holds. So this run surveyed
for work with no branch behind it.

Searched every PR in every state, plus `main`, for `consent`, `revoke`,
`delete`, `forget`, `erase`, `export`. Result: the word `revoked` exists
in `ursa-major/src/tuning/` only, and only as a status on a derived
axiom. Nothing anywhere revokes or erases an **outcome record**, and
nothing gates what is allowed to leave the device.

Filling in as the work proceeds.

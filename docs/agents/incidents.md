# Incident Register — Ursa

Blameless postmortems, exo-owned once activated. The register exists
before the builders arrive. Alexandria's incidents (notably Incident 3,
the ship-first rule) are inherited as law via docs/standards/pm.md §8.

## Incident 1 — Invalid CLAUDE_CODE_OAUTH_TOKEN; two dispatched runs dead on arrival (2026-09-18)

**What happened.** The owner created the repo secret from a pasted
OAuth token; two owner-dispatched okr-agent runs (35393143821,
35393305537) then failed on their first API call, about 2 seconds in,
one turn, zero usage, no error text surfaced by the action.

**Why, technically.** The token printed across two visual lines in the
owner's terminal and the paste most likely captured only part of it, so
the API rejects the credential. A contributing defect: the
claude-code-action failure mode is silent (`is_error:true` with no
message), so a bad secret looks identical to a model-side failure.

**Fix.** Owner regenerates with `claude setup-token`, selects the full
logical line (triple-click), and repastes into
`gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo alexandrapaiz/Ursa`.
Open until a dispatched run passes its first API call.

**What the org grew.** Secret-setting instructions must warn about
wrapped-line copies. The ExO Sunday run's first check is whether any
scheduled run has actually succeeded, because a dead token makes every
cadence silently theatrical.

**Status: fix pending (owner action).**

## Incident 2 — Unredacted user data on the public repo; history purged (2026-09-18)

**What happened.** The bootstrap commit (0794210) carried
ursa-major/trial/task-001 and task-001-all-sessions onto the repo, and
the repo was then made public by ADR-001. The records contained the
owner's verbatim, unredacted prompts, raw conversation captures, and
absolute local paths exposing her machine username. The security seat
found it at All-Hands 002 (minutes §4), after roughly one day of
exposure.

**Why, technically.** The trial records were built as private research
artifacts and inherited into the combined repo before any redaction
standard existed; the ADR-001 public flip did not include a data
review. No gate existed between the resolver's output and a shipping
path.

**Fix.** Owner-directed the same day: (1) records moved intact to the
private repo alexandrapaiz/ursa-private; (2) the public repo's history
rewritten with git-filter-repo to drop both directories from every
commit, all branches rewritten or deleted, the trial README pointing at
the private repo; (3) owner declined a GitHub Support cache-GC request,
accepting that unreferenced commits remain SHA-addressable until
GitHub's own GC, with practical exposure low because no PR ever
displayed the paths.

**What the org grew.** The two-repo shape the owner set: ursa-private
for raw records, the public repo for code, docs, and the Actions
cadence. A permanent rule follows for every seat: raw records and
transcripts are private-repo material by default, and nothing
generated from a record ships public before the security seat's
redaction pass and the owner's per-record sign-off (KR2.2 gate). The
security seat's first activated run turns this into
docs/security/redaction-standard.md and a consent gate in the resolver
CLI.

**Status: fix executed pending the owner's force-push; verification
(clean UI, clean clone) owed by the ExO Sunday run.**

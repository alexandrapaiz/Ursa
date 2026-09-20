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

**Closure verification (2026-09-19).** Owner-dispatched supervised
smoke run of the OKR agent, run to test the token fix directly. The
run authenticated, read the charter and vision files, and reached
multiple further API calls without failure, well past the roughly
2-second, one-turn, zero-usage failure signature both dead runs showed
on 2026-09-18. That is the dispatched run passing its first API call
that this incident was left open pending.

**Status: closed (2026-09-19), fix confirmed by this run.**

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

## Incident 3 — Product-plan delivered as a presentation; owner rejected it (2026-09-18/19)

**What happened.** The engineer seat, owner-dispatched to plan Ursa
Major v0, produced docs/design/product-plan.md (real components, real
TypeScript schema in §10, real done-conditions) and then rendered it
as docs/presentations/product-plan/*.html, an 18-slide deck. The owner
reviewed the deck, not the markdown, and rejected it: "just buzzwords
and it's not a plan," no real system architecture, no diagrams, "a
table with only words and no explanations is not good." The cover
slide's own line proves it: "session → record → whys → tuning → any
model," five bare nouns joined by arrows, nothing explained, first
thing she saw. The "architecture" slide renders lifecycle phrases
instead of a diagram of named processes, files, and stores.

**Why, technically. Three compounding causes, none of them the seat
acting alone.**
1. The seat optimized for presentability over content. Given a
   substantive source doc, its rendering step dropped every interface,
   path, and command and kept only prose labels and rounded cards.
2. The chair's dispatch briefs commissioned the compression: bare-noun
   titles at 2-3 words, terse table cells, slide-shaped output. Built
   for OKR and status decks, not for a deliverable meant to survive
   scrutiny at the interface level. The seat complied with the brief
   exactly, and that compliance produced the defect.
3. No standard existed. prompts/engineer-agent.md named a PR
   description as the only required artifact. Nothing defined what a
   plan or architecture deliverable must contain before it can be
   rendered as anything else. The seat had no content contract to
   fail.

**Fix.** The engineering-artifact standard in
prompts/engineer-agent.md, reusable by any seat: content requirements
bind regardless of rendering instructions. A presentation is a view of
the artifact, never a substitute for it. Reissued dispatch for the
real deliverable. Owner's added requirements, verbatim intent: for
engineering agents, high explainability not marketing, high
technicality, comprehension, creativity, explicitness, zero vagueness;
literally which products and tooling; systems architecture; diagrams.

**What the org grew.** Formatting instructions from the chair (or
anyone) govern the rendering layer only, never a deliverable's content
requirements. A plan is judged by what it specifies, not by how it
reads on a slide.

**Status: fix applied on owner directive; verification owed by the
next ExO run.**

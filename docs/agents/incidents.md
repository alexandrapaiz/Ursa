# Incident Register — Ursa

Blameless postmortems, exo-owned once activated. The register exists
before the builders arrive. Alexandria's incidents are inherited as law
via docs/standards/pm.md §8, but their numbers are not.

## How to cite an incident (rule, 2026-09-20)

Numbers in this file mean Ursa and nothing else. Every register in the
company numbers from 1, so a bare "Incident 3" is ambiguous the moment
two registers are in the room, and it was wrong in eleven charters at
once before this rule existed (Ursa incident 5, below).

- A Ursa incident: **"Ursa incident N"**, or a bare "Incident N" inside
  this file, where the context is unambiguous.
- Any other register: **"<repo> incident N"**, lowercase repo name,
  as docs/standards/lessons.md already writes it. Examples: "alexandria
  incident 19", "HQ incident 2".
- An inherited rule whose number you have not verified in the source
  register: cite the rule and its standard, not a number. "The
  ship-first rule (docs/standards/pm.md §8)" is always correct.
  A number you did not look up is a citation you should not write.

Numbers are never reused and never renumbered. When an entry turns out
to be two incidents, suffix it (4a, 4b) rather than shifting anything
after it.

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

**Closure verification (2026-09-20, ExO Sunday run).** Verified on this
run's fresh Actions checkout of the public repo, which is the clean
clone the incident asked for. Four checks, all passing:
`git log --all -- 'ursa-major/trial/task-001*'` returns nothing;
`git cat-file -t 0794210` fails with "Not a valid object name", so the
bootstrap commit is gone from the rewritten history rather than merely
unreferenced by a branch; `git branch -r` lists only `origin/main` and
this run's own branch, so every rewritten-or-deleted branch is gone;
`ursa-major/trial/` holds only README.md, which points at
alexandrapaiz/ursa-private. The owner's force-push landed.

The accepted residual from the fix's clause (3) is unchanged and
unverifiable from here by design: unreferenced objects stay
SHA-addressable until GitHub's own GC.

**Status: closed (2026-09-20), purge confirmed on a clean clone. The
permanent rule this incident created stayed open and was broken the
next day. See Ursa incident 4.**

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

**Closure verification (2026-09-20, ExO Sunday run).** The reissued
dispatch landed as commit 5012f91, "Product plan meets the
engineering-artifact standard." docs/design/product-plan.md was audited
against the standard's six elements literally, not impressionistically:
(1) §2 names nine components with their real file paths, and §11 is a
node-by-node, edge-by-edge diagram specification; (2) §2's table gives
a real TypeScript signature per component boundary, for example
`findCommitPairs(repoPath: string, opts?: { agentTrailerPattern?: RegExp }): CommitPair[]`;
(3) §4 gives the real `.ursa/` tree and a real Episode payload;
(4) §4b gives literal `git log --pretty=format:...` and
`claude -p --model sonnet --output-format json` invocations;
(5) §9 versions and justifies every tool; (6) spot-checked headings and
table cells carry explanations rather than bare nouns. Six of six.

The standard held, and it held so literally that element 3 pulled a
private path into a public file. That is Ursa incident 4, not a defect
in this closure.

**Status: closed (2026-09-20), fix verified element by element.**

## Incident 4 — The redaction rule and the artifact standard collided; a private path went public again (2026-09-19/20)

**What happened.** Ursa incident 2 purged the owner's absolute local
paths from this repo's history on 2026-09-18 and created a permanent
rule: nothing generated from a raw record ships public without the
security seat's pass. On 2026-09-19, commit 5012f91 added a `projectPath` field to
docs/design/product-plan.md holding the owner's literal macOS home
directory, along with the full private session UUID (prefix 64899e58)
in three more places. This ExO run found them on 2026-09-20 with a
grep, alongside a fourth instance at ursa-major/trial/README.md line
46, a `--sessions` argument carrying both the machine-path project slug
and the same full UUID, inside the very README that announces the
purge. The strings are described rather than quoted here, because
quoting them in this register would reproduce the exposure it
documents.

**Severity, stated honestly.** Low, and lower than incident 2. What
leaked is two pointers, not content: a home-directory path whose
username already appears in this repo's own URL, and a local session
filename that grants no access to anything. No prompt text, no
conversation capture, no credential. The reason this is written up
anyway is the pattern, not the payload. A rule created to prevent a
class of exposure failed against that same class within 24 hours, and
the org's charter says a failure rediscovered is the ExO lane failing.

**Why, technically.** Two standards written a day apart, in different
files, that contradict each other, with no seat owning the contradiction.

1. Ursa incident 2's rule lives in this register and says derived
   material ships only after a redaction pass.
2. The engineering-artifact standard, added to
   prompts/engineer-agent.md the next day to fix Ursa incident 3,
   element 3, requires "at least one real example payload (actual file
   contents, not a placeholder)."

The engineer seat obeyed element 3 exactly. Obeying it *is* what
produced the leak, because the only real payload available was built
from the private trial record. The standard gave a content floor and no
redaction convention, so "real" and "public-safe" read as opposites.
Neither document cites the other. The seat had no way to see the
conflict from inside the file it was told to satisfy.

A second contributing defect: incident 2's fix was executed entirely as
history surgery. Nothing was added that would notice the same strings
re-entering through a new file, so the purge protected the past and
nothing protected the future.

**Fix.**
1. Element 3 of the engineering-artifact standard now carries the
   redaction rider (this run, prompts/engineer-agent.md): real
   payloads stay mandatory, and the specific fields that carry machine
   or session identity are written in a named placeholder form that is
   still a real, runnable value. Realism was never the thing that
   leaked. Copying the owner's filesystem verbatim was.
2. A repo-wide secret-scan gate is specified in
   docs/agents/pending-workflow-changes.md for the owner to apply,
   because the runner's token cannot write `.github/workflows/`. It
   greps the working tree for the incident-2 data classes and fails the
   job. This is the future-facing half incident 2 never got.
3. The two files already carrying the strings are not this seat's to
   edit. docs/design/product-plan.md belongs to the engineer seat and
   ursa-major/trial/README.md is product code, explicitly outside the
   ExO boundary. Both are flagged to the owner in this run's PR with
   the exact lines and the exact replacements.

**What the org grew.** When a new standard is written to close an
incident, it must be checked against the standing rules of every other
open incident before it ships. A content floor and a privacy floor can
each be correct and jointly impossible, and the seat asked to satisfy
one will not discover the other by reading its own charter. Checking
that intersection is the ExO seat's job and belongs in its orient step,
which this run added.

**Status: fix applied for the standard and specified for the workflow;
the two leaked lines are owner-routed. Open until both are edited.**

## Incident 5 — Eleven charters cite a local incident number for a different incident (2026-09-18 through 2026-09-20)

**What happened.** Every seat charter carries the ship-first rule with
this sentence: "Incident 3 in docs/agents/incidents.md records two runs
that worked for dozens of turns, reported success, and lost every line
at sandbox teardown." Ursa's Incident 3 is the product-plan
presentation rejection. It records nothing of the kind. Eleven charters
say it: engineer, exo, finance, frontend, market, okr, pm, research,
sales, security, skill. The ExO charter adds two more dangling
citations of its own, "incident 11" for the workflow-token boundary and
"Incident 12" for draft-PR-first, and this register contains no
incidents 11 or 12.

**Why, technically.** The charters were inherited verbatim from
alexandria at bootstrap, where those numbers were correct. Ursa's
register then started its own numbering at 1, and the two sequences
collided at 3 the moment the engineer seat's incident was filed on
2026-09-19. Nothing in the inheritance step rewrote cross-repo
citations, because nothing said citations were repo-scoped. The org
already half-knew: docs/standards/lessons.md namespaces everything
("alexandria incident 19", "HQ incident 2"), and the tripwire comment
added in PR #6 works around the problem in prose, "incident numbering
differs per repo," without fixing any charter.

**Why it matters more than a typo.** These charters run in fresh cloud
sessions with no memory. The citation is the entire mechanism by which
a run learns why a rule exists. A seat that follows this one reads a
postmortem about slide decks and concludes either that the ship-first
rule is unmotivated or that charter citations do not resolve. The
second conclusion is the expensive one, because it teaches every future
run that the evidence trail is decorative. The previous ExO run flagged
this in the learning log and asked for a rename before a third
collision; the third collision is this run's own new incidents 4 and 5.

**Fix.** A citation convention at the top of this register (this run),
and all thirteen citations rewritten across the eleven charters. The
ship-first sentence now cites alexandria's register by name and the
standard that actually carries the rule into this repo,
docs/standards/pm.md §8, which is true regardless of either repo's
numbering. The ExO charter's "incident 11" and "Incident 12" are
rewritten the same way.

**What the org grew.** An identifier that is only unique inside one
repository must not travel into another repository unqualified. When a
charter is inherited, its citations are part of what gets adapted, not
part of what gets copied. The stronger form of the rule, now in the
register's preamble: a number you did not look up is a citation you
should not write.

**Status: fixed this run across the register and all eleven charters.**

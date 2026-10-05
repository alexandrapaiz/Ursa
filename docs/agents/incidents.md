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

**Every status line names its own incident (rule, 2026-10-04, amended
2026-10-05).** A status line reads:

```
**Status:** <open | closed (date, how verified)>. (Incident N of this register.)
```

The reason for each half, because the two halves come from rules that
contradicted each other on the literal string and were reconciled here.

The number inside the line is the 2026-10-04 half. This file is read as
a work queue, and a bare status line one scroll away from the entry it
belongs to gets attached to the wrong one. That happened on 2026-10-04:
the PM standup dropped Incident 4 from docs/sprints/pending.md and
quoted "closed (2026-09-20), fix verified element by element" as
Incident 4's own line, which is Incident 3's. The security seat caught
it the same day as F11 in PR #75. If you quote a status line, the
incident number comes with it, so a misattribution cannot survive being
written down. That rule's original wording went further than its reason
needed and forbade the string `**Status:`.

The literal `**Status:**` prefix is the 2026-10-05 half, and it is why
the original wording had to change. HQ's L-A28 landed on `main` on
2026-10-05 and requires every incident register entry in the company to
carry "an explicit `**Status:** open` or `**Status:** closed` line",
because HQ's generated `docs/company/incidents.md` reads 57 entries
across the portfolio and cannot say which are open. Under the
holding-company note in CLAUDE.md the standard wins, and a prefix this
register forbade was the exact prefix the company's reader needed. Read
as two commands they are jointly impossible. Read as two reasons, the
2026-10-04 rule wanted the number *in* the line and the standard wants a
grep-able prefix *starting* the line, and one line gives both. So the
deviation is nil and no Ursa ADR is needed: the format above satisfies
both reasons, and quoting it still carries the number.

The general shape of that failure is Ursa incident 4, and finding it is
this seat's step 3 (prompts/exo-agent.md). Two individually correct
standing rules, in two files, neither citing the other, where the seat
can only see the one it was handed. Nine status lines were rewritten
into the joint format on 2026-10-05.

**Entries record what they became (L-A28, 2026-10-05).** When an
incident here becomes a rule in `docs/standards/lessons.md`, the entry
names the rule it became, because the side that was not written is the
side a later reader consults. The mapping as of 2026-10-05, re-derived
by grep rather than from any marker, which is the cost L-A28 is about:

| Ursa incident | became company law as |
|---|---|
| 1 | L-X2 |
| 2 | L-X1, L-S1 |
| 3 | L-A15 |
| 4 | L-X1, L-S3 |
| 5 | L-A18 (via this seat's learning log, 2026-09-19) |
| 6, 7, 8, 9 | not yet promoted |
| 10 | not yet promoted |

**Closing an entry now needs a detector (L-X1 as amended, 2026-10-05).**
A repair in the tree is half of a closure. The other half is something
in the tree that would notice the same thing happening again, checked
against a real positive before the entry is called closed. Of the five
closed entries here, only Incident 2 has one by that test: the redaction
gate, which has run on every pull request since. Incidents 1, 3, 4 and 5
were closed on verification of the repair alone. They are not reopened
by this, since the rule is not retroactive and reopening five entries
would make the queue unreadable, but the next run that touches a closed
entry says whether a detector exists for it, and the gap is this
register's standing debt.

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

**Addendum (2026-09-20, ExO Sunday run).** While confirming the
closure, this run found a third failed okr-agent run between the two
dead ones and the successful smoke test: 35462270287, 2026-09-19 at
18:46 UTC, 30 seconds, roughly an hour before the run that closed this
incident. It is the owner's rotation window, not a new fault, and it
needs no separate entry. It is recorded because its failure mode
contradicts this incident's diagnosis and that difference is a useful
debugging tool.

An **absent or empty** secret fails loudly. The log says, in plain
text, "Environment variable validation failed: Either ANTHROPIC_API_KEY,
CLAUDE_CODE_OAUTH_TOKEN, or workload identity federation ... is
required." An **invalid** secret fails silently, which is what the two
runs on 2026-09-18 showed: `is_error:true`, no message, one turn, zero
usage. Both die in about 30 seconds and look identical in
`gh run list`. So the first question about any 30-second seat failure
is which of the two messages the log carries, because it separates
"the owner has not set it" from "the owner set it wrong," and those
have different fixes.

**Status:** closed (2026-09-19), fix confirmed by this run. (Incident 1 of this register.)

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

**Status:** closed (2026-09-20), purge confirmed on a clean clone. (Incident 2
of this register.) The permanent rule this incident created stayed open
and was broken the next day. See Ursa incident 4.

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

**Status:** closed (2026-09-20), fix verified element by element. (Incident 3 of this register.)

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

**Closure verification (2026-09-27, ExO Sunday run).** Closed. All four
of the incident's parts are now on `main` and were checked here rather
than taken from the PWC file's own claim that they were applied.

1. *The redaction gate exists and runs.* `.github/workflows/redaction-gate.yml`
   is on `main` and fires on every push and every pull request. It has
   executed roughly forty times this week and passed every time, which
   is the future-facing half Ursa incident 2 never got.
2. *The home-directory path is gone.* `grep -rnE '/Users/[a-z]+|/home/[a-z]+/[A-Z]'`
   over docs/design/product-plan.md and ursa-major/trial/README.md
   returns nothing.
3. *The session identifier is truncated everywhere it survives.* The
   four remaining occurrences of the string carry the eight-character
   prefix only, which is the placeholder form element 3's redaction
   rider asks for, and the gate's own UUID pattern confirms it by
   passing. Realism was kept and the machine identity was dropped,
   which was the whole point of the rider.
4. *The rider itself is still in prompts/engineer-agent.md.*

One note for the register rather than for the incident. This closure
was owed a week ago. The 2026-09-20 learning log named it the next
run's first check, the underlying leaks were fixed on 2026-09-24, and
two PM standups then carried a line saying the status field still read
open and that the field belonged to the ExO seat. The artifact was
correct and the record about the artifact was wrong for three days.
Closing an incident is part of fixing it, because the register is read
as a work queue.

**Status:** closed (2026-09-27), all four parts verified on main. (Incident 4 of this register.)

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

**Status:** closed (2026-09-20), fixed across the register and all eleven charters. (Incident 5 of this register.)

## Incident 6 — Every seat appends to one file, so five open PRs went unmergeable at once and the sprint's whole backlog stalled (2026-09-24 through 2026-09-27)

**What happened.** By 2026-09-27 the sprint's entire backlog existed as
open pull requests and none of it could reach `main`. Five PRs were
simultaneously `CONFLICTING` on GitHub: #13, #16 and #18 from the
engineer seat and #21 from market, which are the sprint's four items,
plus #14 from skill, which is not a sprint item and was caught in the
same net. In all five the
only conflicted file was `docs/ideas.md`, and no product code was in
disagreement anywhere. The engineer seat found this on its second
dispatch of 2026-09-27, spent that run on the conflict instead of on
the sprint, and said so plainly at the top of PR #27, which is the
trace that made this write-up possible.

**Why, technically.** Six charters end with an instruction to append
the run's new ideas to `docs/ideas.md`. Six seats therefore add lines
to the end of one file on most days they run. Git's merge is line
based, so two appends at the same end of the same file are one
conflicting hunk, and the conflict appears between branches that have
nothing to do with each other.

The standing mitigation is in the vendored HQ standard,
docs/standards/pm.md §4: before any PR that appends to the ledger,
check for other open PRs touching it and name the expected merge order
in the description. Every charter carries that text and the seats
obeyed it. It did not help, and could not, because naming a merge order
tells the owner that a conflict is coming without preventing one. A
warning label is not a fix. This is the failure mode the ExO orient
step was built for after Ursa incident 4, one rule correct in isolation
and insufficient once six seats run on overlapping days, and this run
is the first to check it under that step.

Queue depth is the amplifier rather than the cause. The same six
appends against a queue that drains daily produce one conflict at a
time, which is a nuisance. Against a queue fifteen deep they produce a
combinatorial mess, because every branch that stays open keeps drifting
from `main` and from every sibling.

**Fix.** The engineer seat built the real one in PR #27, unmerged at
the time of writing: a git merge driver that merges the ledger by entry
identity rather than by line hunks, so two seats adding two different
dated entries is an addition of two keys and not a conflict, plus a
contract check for pm.md §4's five required fields and a requeue script
that drains the blocked PRs. Verified in that PR against the five real
branches rather than against synthetic ones. Two caveats the org should
hold onto. The driver has to be installed per clone, because
`.gitattributes` can name a driver but only `.git/config` can define
one, so GitHub's own merge computation on the PR page is unchanged and
the requeue has to be re-run after each merge. And the fix is tooling,
which means it lives under `tools/` and is the engineer's to maintain,
not this seat's.

The charter-layer half is this entry plus the queue-depth rule added to
prompts/exo-agent.md §5b on 2026-09-27. Moving the ledger to one file
per entry would remove the collision at the source and is the obvious
alternative, but `docs/ideas.md` is fixed by an HQ standard, so that
change needs an Ursa ADR recording the deviation and is the owner's to
make. It is not queued as a recommendation here, because the driver may
well prove sufficient and the cheaper fix should get its chance first.

**What the org grew.** A shared append-only file is a shared mutable
resource, and a coordination rule that only asks seats to announce
their collisions is not coordination. When N seats are told to write to
one place, either the merge is made associative or the place is split.
The second lesson is about the ExO lane specifically: the standards
check added after Ursa incident 4 asked what a seat obeying two rules
would have to do, and it needs a second question beside it, which is
what the rule does once six seats obey it on the same day. A rule that
works at one writer and fails at six is not a wrong rule, it is an
unscaled one, and nobody but this seat is positioned to notice the
difference.

**Addendum (2026-10-04, ExO Sunday run): the measurement, and why the
tooling fix will not be enough.**

This entry is now quantified rather than described. Every open PR was
three-way merged against `origin/main` on 2026-10-04. Eight of the
fifty-two conflict, and **five of those eight conflict on
`docs/ideas.md` and on no other file**: #14, #21, #50, #52, #64. The
remaining three conflict on the PM's own two tracker files. So this one
file is the single largest cause of unmergeability in the repository, and
it is a file no seat's work actually depends on.

Two further facts the original entry could not know.

1. **The merge driver in PR #27 will not fix the conflicts the owner
   sees.** A `.gitattributes` merge driver runs on the client. GitHub's
   server-side merge does not run it. The engineer seat established this
   independently in PR #61, whose title says it plainly, and its one-line
   server-side alternative was found to delete entries. So PR #27
   remains worth merging for local work and it does not close this
   incident.
2. **The standard's own mitigation is the thing that failed, and it is
   an HQ standard.** docs/standards/pm.md §4 fixes the path
   `docs/ideas.md` and prescribes naming the expected merge order in the
   PR description. Every seat obeyed that and five PRs conflict anyway,
   for the reason this entry already gives: announcing a collision is not
   preventing one. The fix that would work is a layout change, one file
   per entry under a directory so that two seats never write the same
   path. **That is not this seat's to apply.** The path is named in a
   company standard, so changing it needs an Ursa ADR recording the
   deviation or an amendment upstream at HQ, per the holding-company
   note. It is written up here, routed to the owner in this run's PR,
   and deliberately not done by charter edit, because a charter edit
   cannot fix a defect whose cause is the file's location.

**Status:** open. (Incident 6 of this register.) The tooling fix is in PR
#27, which is unmerged, so this entry closes when that PR merges and a
later seat PR then merges clean through the driver.

## Incident 7 — The draft-PR-first rule is in every charter and in no workflow, so it has never bound (2026-09-18 through 2026-09-30)

**What happened.** All eleven seat charters in `prompts/` instruct the
seat to open its pull request with `gh pr create --draft`, and all
eleven carry the "Ship first, then work" section that explains why. None
of the eleven `prompt:` blocks in `.github/workflows/agent-*.yml`
mentions `--draft`, and none mentions ship-first ordering. Ten of them
say "open exactly one pull request with `gh pr create`", with the flag
absent; `agent-skill.yml` does not mention opening a PR at all.

Measured this run, mechanically, not sampled. The script loads each
workflow with `yaml.safe_load`, concatenates every step's
`with.prompt`, and greps both files:

| | charter has `--draft` | workflow prompt has `--draft` | charter has ship-first | workflow prompt has ship-first |
|---|---|---|---|---|
| all eleven seats | yes, 11/11 | **no, 0/11** | yes, 11/11 | **no, 0/11** |

**Why, technically.** L-X11, synced into
`docs/standards/lessons.md` on 2026-09-28: a seat's instructions live in
two files, and the workflow's inline block arrives last and closest to
the model's attention, so where the two differ the workflow wins. The
rule was written into the file a run reads first, by a seat that could
edit that file, and left out of the file that reaches the run last, which
that seat could not edit from GitHub Actions. Every ExO run since
bootstrap has audited `prompts/` and none has diffed the pair, because
no charter asked for the diff until this run added §2b.

The consequence is not that seats never open draft PRs. Several do,
because the charter is read. It is that the org cannot tell the
difference between a rule that binds and a rule that is reliably
guessed. The observable record is mixed, and the honest version of the
measurement is narrower than it first looked: of the twenty-eight PRs
open before this window, **not one is a draft**; of the ten opened during
it, six were drafts at the time of this reading and four were not.
Because a seat calls `gh pr ready` at the end of its own run, a
snapshot cannot separate "opened non-draft" from "opened draft and
already finished," so the four are not evidence of anything. The
twenty-eight are. Deciding this properly needs the PR timeline API
rather than `isDraft`, and the next run that wants the number should
pull `ReadyForReviewEvent` rather than repeat this snapshot.

**Why this is the same event the ExO charter already warned about.** §2
of `prompts/exo-agent.md` says draft-PR-first "was agreed on the
founding night, assigned to this seat, and sat unapplied through sixteen
PRs while the owner carried it by hand," and adds "Ursa has its own
version already." That sentence was written as a warning about a debt
elsewhere. It was describing this repository, and no run had the
instrument to see it.

**Fix.**
1. `prompts/exo-agent.md` §2b, added this run: the two-file sweep is a
   standing observation, reported as a count across all seats rather
   than as an example.
2. The workflow edit itself is specified as PWC-EXO-3 and queued rather than
   applied. This run's dispatch says in its own words never to touch
   workflows, so the lane is closed by instruction, not by access. See
   `docs/agents/runner-facts.md` §1b for why that distinction now
   matters.

**What the org grew.** A rule that lives only in the half of a charter
its author can edit is a rule enforced at the reliability of the other
half agreeing with it. This is L-A22 one level up: the gate goes in the
command, and where a charter is the only available surface, say so
plainly and expect the reliability of reading. The general form, for any
seat writing a rule for another seat: ask which of the two files the
rule landed in, and whether the seat that must obey it will meet that
file first or last.

**Status:** open. (Incident 7 of this register.) §2b and this entry
shipped on 2026-09-30. The entry closes when PWC-EXO-3 is applied to all
eleven workflows and a fresh sweep reports 11/11 on both columns. The
2026-10-05 sweep still reports 0 of 11.

## Incident 8 — A hand-resolved merge shipped conflict markers into four workflows; the repo's one gate saw nothing and the PM's triage was thirty minutes behind the fix (2026-09-30)

**What happened.** At 02:16:47 UTC the chair pushed `ce30b5a` to
`chair/langfuse-traces`, a hand-resolved merge of the ExO seat's L-E8
workflow rewrite with the Langfuse tracing changes. Four of the eleven
seat workflow files in that commit contained unresolved git conflict
markers: `agent-pm.yml`, `agent-okr.yml`, `agent-market.yml`,
`agent-finance.yml`, three marker lines each. GitHub rejected all four
as invalid workflow files and created four failed runs
(36659111600, 36659110991, 36659110202, 36659109465), each zero jobs,
zero seconds, no log to fetch. The chair found it and pushed the fix,
`826e57d`, at 02:17:22 UTC, thirty-five seconds later.

Three separate things then failed to notice.

1. **The redaction gate ran on that exact branch and passed.** Run
   36659158568, `success`, on the push containing the markers. It is the
   only gate in this repository that runs on every push and every pull
   request, and it scans for three classes of private data and nothing
   else.
2. **The PM's standup, at 02:47 UTC, reported the four runs as
   undiagnosed** and classified them as "configuration," correctly, then
   routed them to HQ as workflow machinery. By then they had been fixed
   for thirty minutes. The standup read `gh run list` and the GitHub UI
   hint ("likely failed because of a workflow file issue") and stopped
   there.
3. **Nothing would have caught the markers in a file that is not a
   workflow.** GitHub's own validator is what caught this, and it only
   validates `.github/workflows/`. The same hand-resolved merge landing
   conflict markers in `docs/` or in `ursa-major/src/` would have passed
   every check this repository runs.

**Why, technically.** Reproduced this run rather than inferred, on a
`git archive` of `ce30b5a`: each of the four files fails
`yaml.safe_load`, and each contains three marker lines; the other seven
parse clean and contain none. The count of marker lines per file and
the set of failing files match the four failed runs exactly.

The gate's blindness is L-A21's first half, scope narrower than
subject. Its test is concrete: name one change that would break what
this gate governs, then ask whether the gate would have *seen* it. The
redaction gate governs "what ships on the public repo." A conflict
marker is a change that breaks that, and the gate cannot see it, and
every line of the gate is correct.

The triage latency is L-X12's third detector, failures by reporter. The
failure was found and fixed by the owner's side, and the seat that owns
failed-run triage arrived half an hour later without the diagnosis. The
cause is mechanical and not a matter of diligence: both the failure and
its fix are in the same branch's commit log, and the PM's reading list
(`docs/standards/pm.md` §11.2) names `gh run list` and `gh pr list` and
no `git log`. A zero-job failure carries no log to read, so the only
place the answer exists is the branch.

**Fix.**
1. **PWC-EXO-4**, queued this run: a conflict-marker check added to
   `redaction-gate.yml`, which is the one command that already runs on
   every push and every pull request. Tested before being proposed,
   against a tree known to fail it (`ce30b5a`: exit 1, all twelve marker
   lines listed) and against this run's tree (exit 0). Queued rather
   than applied for the same dispatch reason as PWC-EXO-3.
2. **`prompts/pm-agent.md` §0b**, applied this run: failure triage reads
   the branch's log past the failing commit before classifying, with the
   three commands written out. A zero-job, zero-second run failed on the
   workflow file in the commit that triggered it, and the next commit is
   often the fix.

**What the org grew.** Two things, and the second is the more general.

A gate's subject is what ships, not the one class of defect its author
had in mind. When a new class of defect gets through, the question is
not whether to write a new gate but whether the existing one's scope was
ever the same size as its subject.

And: the validator that caught this belongs to GitHub, not to Ursa, and
it only looks at one directory. An org that discovers a defect class
through a vendor's validator has learned that it has no gate of its own
for that class, everywhere the vendor does not look. Conflict markers
are the first instance. The check is cheap and repo-wide, so it goes
repo-wide.

**Status:** open. (Incident 8 of this register.) The PM charter fix
shipped on 2026-09-30. The entry closes when PWC-EXO-4 is applied and a
run of the gate against `ce30b5a` fails in CI as it does locally.

## Incident 9 — Four seats acted on a stale `main` in one week, because the org's memory only exists after a merge (2026-09-27 through 2026-10-04)

**What happened.** Four seats, four different costs, one cause, inside
seven days.

1. **The ExO seat.** `docs/agents/learning-log.md` on `main` ends on
   2026-09-20. Entries 3 and 4, the 2026-09-27 cycle and the 2026-09-30
   owner window, exist only inside PRs #30 and #46, both open. This run
   is the fifth ExO cycle and it read a fourteen-day-old memory. It found
   the missing entries only by going to look for its own unmerged work,
   which no charter required it to do.
2. **The security seat.** PR #75, 2026-10-04, states that two severe
   findings were live on `main` that day, that both had been found on
   2026-09-27, and that both were fixed in pull requests still open. It
   re-fixed both off current `main`. Its own words: "the tree it audited
   had absorbed nothing from the previous two."
3. **The PM seat.** The 2026-10-04 standup removed Incident 4 from
   docs/sprints/pending.md as resolved, quoting a status line that
   belongs to Incident 3. The reason it had to quote anything is that
   Incident 4's real closure, written by the 2026-09-27 ExO run, is in
   the same unmerged PR #30, so the register on `main` still said open.
   The misquote is the visible error. The stale register is why a quote
   was needed at all.
4. **The engineer seat.** It queued `PWC-7` in PR #74 while a different
   `PWC-7` sat in PR #46. Its PR reasons explicitly that taking 7 rather
   than 5 means "the two PRs do not have to be merged in a particular
   order to keep the numbering honest." The reasoning is correct and the
   collision happened anyway, because the number it needed to avoid was
   inside a branch it could not see.

**Why, technically.** Every one of these seats runs in a fresh session
and reconstructs its state by reading files on `main`. That is sound only
if `main` is the org's state. It is not. `main` is the subset of the
org's state that the owner has merged, and in the week to 2026-10-04 that
subset grew by five pull requests while fifty-two sat open, with no pull
request from any building seat having ever merged in the repository's
history. Under those conditions a file is stale by default, and the
staleness is invisible, because a file that is merely behind looks
exactly like a file that is complete.

No charter said to look in the open PRs. HQ had already written the
lesson, L-E10 in docs/standards/lessons.md, "an open card is not evidence
that nobody built it," on 2026-09-30. It was synced into this repo and
bound nobody, because nothing in the sync step turns a lesson addressed
to seats into text inside a seat's charter. The 2026-09-30 ExO entry
named that gap for the centralizer and did not close it for this rule.

**The sharper form.** Three of the four costs are self-inflicted in a
specific way: each seat failed to find *its own* previous output. This is
not seats being unable to read each other. It is seats being unable to
read themselves, which is a much cheaper problem to fix, because a seat
can always enumerate its own branches.

**Fix.**
1. A new all-seats section in all eleven charters, "Read your own seat's
   open PRs first," with the `gh pr list` filter and the
   `git merge-base --is-ancestor` check, and the instruction to merge the
   open one into the branch rather than starting again from `main` (this
   run). It states L-E10 for the whole roster.
2. The ExO observe step now begins there, naming its own fourteen-day
   gap as the evidence (this run).
3. Seat-scoped queue identifiers and per-seat queue files, so the one
   collision in this list that is purely structural cannot recur even if
   a seat forgets rule 1 (this run,
   docs/agents/pending-workflow-changes.md).
4. Status lines in this register now carry their own incident number, so
   the PM's misquote cannot be made silently again (this run). The
   security seat filed the same defect as F11 in PR #75 independently.
5. This run practised the rule on itself before writing it: PR #46 was
   merged into this branch rather than rewritten, so the ExO line is one
   branch and not five.

**What the org grew.** A fresh-session seat must treat `main` as a lower
bound on the org's state rather than as its state. The first question
when a file looks unfinished is whether the work is in an open pull
request, and the first place to look is the seat's own. The deeper point
belongs to whoever next proposes a memory mechanism for these agents: a
memory that only becomes readable when a human merges it is not a memory
at a cadence faster than the human. Everything in this register about the
merge queue is downstream of that, which is why the queue is not only the
PM's problem or the owner's but this seat's as well.

**Status:** open. (Incident 9 of this register.) The charter edits ship with PR #76 and
they bind nothing until this PR merges, which is the incident's own
pathology applied to its own fix. It closes when a later ExO run reports
that eleven of eleven charters carry the section on `main`, and that it
found its own previous entry in the learning log without having to go
looking in branches.

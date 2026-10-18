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
2026-10-05 sweep reports 0 of 11 for `--draft`, unchanged from
2026-09-30, and it found something worse than silence: **eight of the
eleven prompt blocks instruct `gh pr create` with no `--draft`**, and
the workflow block arrives last. Those eight do not omit the rule, they
contradict it. The remaining three (pm, security, skill) do not mention
creating a pull request at all.

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

## Incident 10 — The engineer seat's runs are being killed by the 45-minute job cap, and the register read the kill as benign (2026-10-02 and 2026-10-05)

**What happened.** Two engineer runs in four days ended with
conclusion `cancelled`: run 36955429726 on 2026-10-02 and run
37254536081 on 2026-10-05. Both ran for 45 minutes and no more. Run
36955429726 started 02:23:47Z and ended 03:09:10Z, which is 45m23s. Run
37254536081 started 02:13:22Z and ended 02:58:41Z, which is 45m19s.
Every other agent run in the repository's recorded history finished in
3 to 34 minutes.

Nobody cancelled them. `.github/workflows/agent-engineer.yml` line 22
sets `timeout-minutes: 45`, and a job that reaches its cap is torn down
with the action's step marked `cancelled` and the message
`##[error]The operation was canceled.` in the log. That is what both
logs say. GitHub reports a cap as a cancellation, so the word in
`gh run list` names the mechanism, not the cause.

**Why it happened technically.** Two separate things.

The cap itself is too tight for the seat it is on. The engineer is the
only seat that both runs twice a day and does real build work, so it
has the heaviest turn count in the roster and the least room under the
cap. Nine of its runs sit between 15 and 24 minutes, which looks
comfortable, and two went past 45. The distribution has a long tail and
the cap is set near the middle of it. Eleven workflows carry a cap: nine
at 45 minutes, pm at 60, frontend at 90. Nothing in the repository
records why 45 was chosen for the seat with the most work to do.

The second failure is this seat's, and it is the one worth more. The
2026-10-04 ExO cycle (PR #76) observed the first cancellation and wrote
"One cancelled engineer run on 2026-10-02 and no failures since", then
concluded "The cadence is healthy and has never been the problem". That
reading was wrong in a specific and repeatable way: the run's
conclusion was compared against the set of words GitHub uses for
failure, and never against the workflow's own timeout. A duration and a
cap were both sitting in the API response, and the audit read the label
instead of the arithmetic. One cancellation is an anomaly. Two
cancellations at the same number are a setting.

**What it cost, and what it did not.** It did not cost the work. Run
37254536081's pull request, #77, was open and pushed before the cap hit,
and the no-ship tripwire in the same job ran after the teardown, found
the pushed branch and the pull request, and reported them. The
ship-first rule did exactly the job it was written for. What was lost is
the ending: #77's own title still says "draft, in progress", it was
never readied, and nothing in it tells the owner which parts are
finished, because the run that could have said so was gone. That is the
case HQ's L-A27 and this register's own ship-first amendment now cover
from the other side.

**The fix.** Three parts, two of them in this pull request.

1. **Queued, not applied: PWC-EXO-5** raises the engineer cap and gives
   every cap a recorded reason. This run is on the resident company host
   and its dispatch forbids touching workflows, so the edit is written
   out in full for the owner rather than shipped
   (docs/agents/runner-facts.md §1b).
2. **The audit method, shipped here.** `prompts/exo-agent.md` §2 now
   requires the observe step to compare every run's duration against its
   workflow's `timeout-minutes` and to treat `cancelled` at or near the
   cap as a timeout, with the one-line command that does it. A seat
   cannot be trusted to remember this, so it is a command in the
   charter and not an instruction to be careful.
3. **The handover, shipped here.** The ship-first amendment in all
   eleven charters makes the next run of a seat responsible for any
   draft a killed run left behind, which is the only place that duty can
   live when the run that opened it cannot speak.

**What the org grew.** A conclusion word is a label applied by the
platform and a duration is a measurement, and when the two are both
available the measurement is the evidence. This seat's whole job in
step 2 is evidence rather than impressions, and it read a label for two
weeks. The general form, for any run report: before calling a
non-success benign, name the threshold it ran into. If no threshold can
be named, say that instead of saying healthy.

**Status:** open. (Incident 10 of this register.) Parts 2 and 3 ship
with this run. It closes when PWC-EXO-5 is applied and a later ExO run
reports a full week of engineer runs with no run within five minutes of
its cap, and it is not closed on the absence of cancellations alone,
since a week with no long run proves nothing about the cap.

## Incident 11 — The engineer's dogfood run hit the 120-turn cap, not the 45-minute one, and real work and a real finding both landed before the cap did (2026-10-11)

**What happened.** The 2026-10-11T02:02 UTC scheduled `engineer-agent`
run (38103816460) reported `failure`. Its only failing step was `Run
anthropics/claude-code-action@v1`, which exited on "Reached maximum
number of turns (120)" after 25m40s wall-clock, well inside the job's
45-minute `timeout-minutes`. This is a different mechanism from
Incident 10: that one is GitHub's job cap on time; this one is
`claude_args: "--max-turns 120"` in `.github/workflows/agent-engineer.yml`
line 78, a turn count, and PWC-EXO-5's queued fix (raising
`timeout-minutes` to 90) would not have touched it, since this run
never came close to 45 minutes.

The task was the sprint's fallback assignment: no engineer item was
open in `docs/sprints/sprint-2026-10-05.md` (items 1 and 2 shipped as
#107/#134, item 3 belongs to security), so the run fell to the ledger's
"Agentic-forward: Ursa as the agents' HQ" entry's unstarted clause,
"dogfood on Ursa's own seats" (`docs/ideas.md`, 2026-09-19). It pointed
`ursa run` at a clone of this repository, 470 commits, the first
prose-dominant corpus the resolver had seen. That one sentence of
assignment turned out to contain a full day's engineering: a defect in
`src/pairfinder.ts`'s `Co-Authored-By` pattern (it recognised three
fewer machine identities than the author-name fallback it was supposed
to be more reliable than, so `exo-centralizer[bot]`'s sync commits were
read as a person's corrections), a second defect in the same path (an
agent seat's own git identity, `ursa-pm`, was read as "the person" once
the first defect was fixed), a fix for both, a new design document
(`docs/design/agent-coauthor-detection.md`, ~650 lines), a passing test
suite, a CLI flag (`--agent-identity`), four new `proposed` ledger
entries recording what the fix did not reach (the CI launch path, the
cross-repository import gap, a missing `editor` block on the record,
no re-run-the-measurement habit), and a competitive scan of Arena. All
of it is pushed, on the open draft PR #159, which the ship-first rule's
no-ship tripwire correctly found and reported (`success` on that step)
even though the overall run reported `failure`.

**What did not happen.** The run was mid-build when the cap hit: PR
#159's description is still its plan-stub, not the rewritten final
report "ship first, then work" calls for, so nothing in the PR says
which parts are finished and which are not from the run's own hand.
That is exactly the gap Incident 10 named and the ship-first amendment
exists to cover: the next run of the engineer seat inherits this draft
and must ready it or say in writing what it found, under "Read your own
seat's open PRs first."

**Classification (pm.md §11.7).** Not transient (the same task would
hit the same cap again; nothing about this was network or rate-limit
noise). Not a tripwire false alarm (the no-ship tripwire step itself
passed; the failing step was the model step, not the tripwire). Closest
to configuration — a workflow constant sized for a smaller task than
this seat is now being asked to do, the same genre as Incident 10's
`timeout-minutes` — but the fix is a number this seat cannot apply
itself (`.github/workflows` is not this seat's writable surface), so it
is handed off rather than reran: no `gh run rerun` fired, since the
same input fails the same way.

**Handoff.** To the engineer seat: ready or resolve PR #159 on its next
run (noted in `docs/sprints/pending.md`). To the ExO seat, which already
owns PWC-EXO-5 and this register's Incident 10: a second budget
constant on the same workflow is undersized for the same seat, and a
`PWC-EXO-6` raising `--max-turns` (120 is the lowest of any seat's
workflow that sets it explicitly; this run's own task was the ledger's
own "first prose-dominant corpus" case, not an outlier the seat chose)
is the natural next entry in its own queue. Not fired as a dispatch this
pass: the ExO seat already carries an open draft (#143), and §11.4
stops a dispatch to a seat holding one unless told to build on it.
Named here and in `pending.md` instead, for the next pass that can fire
it or for the ExO seat's own scheduled run to pick up.

**Status:** open. (Incident 11 of this register.) Closes when
`--max-turns` is raised for the engineer workflow with a recorded
reason (the same bar Incident 10 set for `timeout-minutes`), or when an
ADR records that 120 is the deliberate choice and the assignment should
be split smaller instead.

## Incident 12 — The no-ship tripwire still measures at teardown, and it flagged a security run that had already shipped real work (2026-10-11)

**What happened.** The security seat's Sunday cron (`agent-security.yml`,
`15 15 * * 0`) had missed its slot by over three hours as of the
~16:34 UTC standup pass, then fired at 19:32:22Z: run
[38168448767](https://github.com/alexandrapaiz/Ursa/actions/runs/38168448767).
It opened draft PR #165 (`sec/2026-10-11`) early, per the ship-first
rule, stating a plan to run both charter sweeps and resolve its own
five-PR backlog (#47, #75, #85, #112, #124 — none an ancestor of any
other, per that PR's own body) in one pass. It pushed 20 commits to
that branch before the model step hit `--max-turns 100` ("Reached
maximum number of turns (100)") at 19:49:06Z, 17 minutes in.

**What the tripwire said, and what was actually true.** The "No-ship
tripwire" step runs after the capped model step and computes `commits`
and `pushed` against the run's *final* local `HEAD`. It found local
commits ahead of the last push (the run kept working on the five-PR
backlog after its last push, and that last increment never left the
sandbox) and failed the job with "This run made commits that were
never pushed, so the work dies with the sandbox." That is true of the
run's last few turns and false of the run as a whole: PR #165 exists,
open, with 20 real commits, confirmed again at this check. A binary
tripwire reading the best part of a genuinely productive run as a
total loss is the same shape `docs/standards/lessons.md` L-E11 already
names ("a tripwire that fires hardest on the best runs is worse than
no tripwire").

**Classification (pm.md §11.7).** Tripwire false alarm — the run's PR
exists. No rerun fired: the same oversized task, five non-stacked PRs
plus both charter sweeps in one 100-turn budget, would hit the same
cap the same way.

**Why this is the old tripwire, not a one-off.** The step computes
`commits=$(git rev-list --count "origin/$base..HEAD")` and
`pushed=$(git branch -r --contains HEAD ...)` inline, at teardown, with
no earlier step capturing the base SHA or the remote-branch list
*before* the agent ran — the exact form L-E11 describes ("measured
against state captured before it ran, never re-derived from the end
state afterwards") and that L-E8's own amendment already found
undistributed. Checked across the fleet this run: all eleven
`agent-*.yml` workflows, including this seat's own `agent-pm.yml`,
carry the identical `rev-list --count` / `git branch -r --contains
HEAD` teardown form. Not a security-specific defect.

**Handoff.** To `alexandra-systems/exo-centralizer`, by board message
(kind `handoff`): the no-ship tripwire needs to capture its base SHA
and remote-branch list in a step before the agent runs and compare
against that snapshot at teardown, instead of re-deriving everything
from the end state, company-wide — the same scope L-E8's amendment
already named and L-E11 already evidenced from HQ's own repo. Not a PM
fix: `.github/workflows` is not this seat's writable surface. To the
security seat's own next run: PR #165 is a draft with a half-written
plan (its body still reads "Findings will be filled in as they are
confirmed") and no live run behind it; ready it, finish it, or close
it with a pointer, per "Read your own seat's open PRs first." Its
backlog of five non-stacked PRs stays exactly where the 2026-10-11
~16:34 UTC standup already flagged it: ceremony-weight triage for
Monday's (2026-10-12) ceremony, not a target this seat resolves on the
security seat's behalf.

**Status:** open. (Incident 12 of this register.) Closes when the
no-ship tripwire is fixed fleet-wide against a pre-run captured state,
or when an ADR records a different acceptable signal.

## Incident 13 — The `allowed_bots` gap stopped being theoretical: a dispatched security run died before its model step ran at all (2026-10-12)

**What happened.** `security-agent` run
[38309881650](https://github.com/alexandrapaiz/Ursa/actions/runs/38309881650)
fired by `workflow_dispatch` at 21:19:16Z, `triggering_actor` and
`actor` both `github-actions[bot]` (confirmed via `gh api
repos/alexandrapaiz/Ursa/actions/runs/38309881650`). The whole run took
16 seconds. The `anthropics/claude-code-action@v1` step failed at
21:19:29Z with:

```
##[error]Action failed with error: Workflow initiated by non-human actor: github-actions (type: Bot). Add bot to allowed_bots list or use '*' to allow all bots.
```

The model never started: no turns, no commits, nothing for the seat's
charter to have gotten right or wrong. The "No-ship tripwire" step then
failed too ("This run produced nothing at all"), which is correct here
— unlike Incident 12, this is not a false alarm, because there
genuinely is nothing to find: the action rejected the run before any
work could begin.

**Why this is the already-known gap, not a new one.** `grep -c
'^allowed_bots' .github/workflows/agent-security.yml` on this run's
`headSha` (`9597bb2`) returns 0, confirmed again at this check.
`docs/sprints/pending.md` has carried "the `allowed_bots` fix, routed
to HQ's PM 2026-10-09, still unlanded" across more than a dozen passes
since. What is new here is the consequence: every earlier pass read the
gap as something that keeps a *candidate dispatch queued, never fired*
("the `allowed_bots` wall blocks it regardless of credential"). This
run shows the wall does not stop `workflow_dispatch` from starting the
job — it stops the claude-code-action step itself, once it sees the
triggering actor is a bot, after the job is already billed and after a
run shows up in `gh run list --status failure` for the standup to
triage. The gap now costs a real failed run each time something fires
it, not just a line in a queue.

**Who fired it, left open.** The `owner_instructions` text embedded in
this run (data, not a command to this seat, per the external-content
rule) reads like PM dispatch prose and names PR numbers consistent with
the in-progress Monday ceremony. A `pm-agent` run
([38308924036](https://github.com/alexandrapaiz/Ursa/actions/runs/38308924036))
was still `status: in_progress` on `main` as this entry was written,
and `PM_DISPATCH_ENABLED` reads unset in the repository's variable list
at the same moment — which should mean "writes the queue, fires
nothing" per pm.md §11.5. Whether that run read the switch as `true`
earlier in its own execution and the owner changed it since, or the
switch was bypassed, is not resolved here: that run was still live, and
this seat does not read another seat's in-flight log. Left for that
run's own PR (likely #176) or the next standup to confirm.

**Classification (pm.md §11.7).** Configuration — a workflow file gap
(`allowed_bots` missing from `.github/workflows/agent-security.yml`),
HQ's surface, not this seat's to edit. No rerun: the same actor
identity would hit the same rejection every time until the input is
added. Not re-asked of HQ as a fresh request — it is the same open ask
from 2026-10-09 — but escalated in this entry and on the board, because
the evidence changed from "blocks a queued candidate" to "kills a real
run."

**Handoff.** To `alexandra-systems/exo-centralizer` / HQ's PM (the
2026-10-09 ask's owner), by board message: `allowed_bots` still needs
adding to `agent-security.yml` (and `agent-frontend.yml`, same gap,
still unfired so far) so a workflow-token-driven dispatch does not die
on arrival. Not a PM fix: `.github/workflows` is not this seat's
writable surface.

**Status:** open. (Incident 13 of this register.) Closes when
`allowed_bots` is set in the affected workflow files, or when an ADR
records that workflow-token dispatch to these seats is not meant to
work and the standing ask should be withdrawn instead.

**Addendum, 2026-10-13 ~00:22 UTC: the open question above is answered.**
`pm-agent` run 38308924036 (`gh run view` directly) ran 21:10:12Z to
21:31:54Z and completed successfully — that is the Monday ceremony run
itself, the one that opened PR #176. #176's own description says it
dispatched security on #165 with `PM_DISPATCH_ENABLED` exactly `true`
"this run." The dispatch this incident is about fired at 21:19:16Z,
inside that exact window. So the switch was on, the ceremony run is
what fired it, and it died on the actor-type rejection seconds later —
nothing bypassed the switch and nothing here needs further reading of
another seat's in-flight log. Separately, `gh variable get
PM_DISPATCH_ENABLED` now 403s for this seat's own token
("Resource not accessible by personal access token"), so this run
cannot independently confirm today's value; not the same wall as the
workflow-file write restriction HQ's centralizer described, but a
related reminder that this seat's read access to Actions configuration
is narrower than `gh`'s success on other endpoints suggests.

**Addendum, 2026-10-13 ~12:23 UTC: the root cause named, HQ's own
seats fixed, this repo's own fifteen steps still not — and why this
seat could never have closed this one itself.** A board `done` from
`alexandra-systems/exo-centralizer` (2026-10-12 21:46:11Z, answering
this incident's own handoff) names the actual mechanism for the first
time: `allowed_bots` was never a property of which seat is targeted.
It is a property of which kind of credential is asking. A GitHub App
installation token, the kind every `agent-*.yml` run (including this
one) carries, cannot write to `.github/workflows/` on any branch,
whatever the workflow's own `permissions:` block says. The centralizer
holds a personal access token instead, proved reach by pushing a
throwaway commit to a workflow file and then deleting the branch
(rather than inferring it from a grant). That is also why every pass
back to 2026-10-09 that routed this to HQ rather than trying to patch
the file locally had the right instinct for a reason none of them, this
one included, had yet named.

The fix that landed is narrower than "allowed_bots is fixed": it covers
HQ's own nine `alexandra-systems` seat workflows (72 findings to 0,
twelve of twelve action steps guarded), on a pull request
(`alexandra-systems#164`) still open and not yet merged even there —
ADR-011 puts workflow files outside the centralizer's own autonomy
boundary too, so this is not a seat-authority gap unique to Ursa.
Ursa's own eleven workflow files and fifteen action steps are still at
zero, confirmed by the same run's own count, and are explicitly queued
to "headquarters' product manager" rather than opened against this
repo this run, alongside 28 more steps at the other three products
(43 of 55 portfolio-wide). **One sequencing fact that matters before
anyone reruns the repair here:** the tool that applies the guard
(`tools/apply-workflow-guards.sh`) had a defect that appended a second
run-report step instead of replacing the old one, because HQ's current
reporter step was renamed and the tool still matched the old name.
All eleven of Ursa's workflow files carry that old step name, so
running today's copy of the tool against this repo would double-report
every run it touches. The fix for that is in the same unmerged HQ PR.
Wait for it to land before the guard is applied here, not just for the
guard itself.

**Status: still open**, narrower than before. Ursa's own seats remain
undispatchable until `alexandra-systems#164` merges and a follow-on
applies the (now-fixed) guard tool to this repo's eleven workflow
files — neither of which is this seat's writable surface. Tracked in
`docs/sprints/pending.md`'s top three.

**Closed, 2026-10-16 ~15:2x UTC.** The owner merged PR #192 herself at
14:16:58 UTC today: `allowed_bots: "github-actions[bot]"` on every
`claude-code-action` step across all eleven `agent-*.yml` files,
confirmed directly against the merge commit rather than assumed from
the handoff that named it. This pass tested the fix the only way that
proves it rather than infers it: it fired a real `workflow_dispatch` at
`agent-security.yml` for sprint item 3 (the live candidate this
incident has been blocking since 2026-10-12). The actor-type rejection
this incident is about did not recur — the call failed earlier than
that, at the dispatch-creation step itself, on a 403 that is the
separate, already-open finding in `docs/decisions.md` ("the re-vendored
PM standard names dispatch tools this repo does not have": the ambient
token this run carries cannot start another workflow run, regardless
of which seat it targets). That is a different wall with its own open
entry; it is not evidence that this one is still up. Closing this
incident on the allowed_bots fact alone, so the next pass that finds a
dispatch still failing reads the right open finding instead of
re-diagnosing this one.
## Incident 14 — Six of seven failures in a week were turn-cap kills, and the audit instrument could only see the time cap (2026-10-07 through 2026-10-11)

**Numbering.** Filed as Incident 12 in PR #167 on 2026-10-11 and renumbered to 14 when that branch was merged down on 2026-10-17. Main had meanwhile taken 12 and 13 for two unrelated events. The merged register wins a collision and the unmerged branch moves, which is the rule Incident 5 exists to protect. Anything citing "Incident 12" and describing turn-cap kills means this entry.

**What happened.** Seven agent runs failed in the week to 2026-10-11.
Six died on `error_max_turns`: engineer 37662406675 (10-07, 120 turns),
engineer 37719675527 (10-08, 120), skill 37832775208 (10-08, 100),
frontend 37835424738 (10-08, 250), engineer 38103816460 (10-11, 120),
security 38168448767 (10-11, 100). The seventh, pm 37819090675 (10-08),
produced nothing and was caught by the no-ship tripwire.

Not one of the six was a `timeout-minutes` kill. They ran 16 to 38
minutes against caps of 45 to 90. The instrument this seat added in
Incident 10, which compares each run's duration to its workflow's
`timeout-minutes` and treats anything within five minutes of the cap as
a kill, returns a clean result over every one of them. Run that check
alone on this week and it reports that no run came near its cap, which
is true, and implies the caps are not biting, which is false six times.

**Why it happened technically.** There are two budgets per run and the
charter knew about one. `timeout-minutes` is GitHub's, measured in
wall-clock, and it reports a kill as `cancelled`. `--max-turns` in
`claude_args` is the action's, measured in model turns, and it reports
a kill as `failure` at whatever duration the run happened to reach.
Incident 10 was a time-cap event, so the instrument written to close it
was built around duration, and duration is exactly the dimension a
turn-cap kill does not register on.

The deeper fault is the shape of the fix, not the fix. Incident 10's
lesson was stated as "before calling a non-success benign, name the
threshold it ran into", which is correct and general. What shipped into
the charter was narrower than the lesson: a single command comparing
one duration to one named setting. A seat following the command to the
letter, as this one is designed to, inherits the narrowing and not the
lesson. Incident 11 found the turn cap on the engineer workflow nine
days later and correctly called it "a different mechanism from Incident
10", but scoped its fix to the one seat it had evidence for.

**What it cost, and what it did not.** It did not cost most of the
work. Ship-first held in the cases that were checked: Incident 11
records PR #159 pushed before its cap, and the frontend and skill runs
left pushed branches. It cost one run's output outright. Security run
38168448767 made commits and never pushed them, and the no-ship
tripwire said so in terms: "This run made commits that were never
pushed, so the work dies with the sandbox." That is the first recorded
case in this repository of the tripwire firing on its second condition
rather than its first, and the work is gone.

The quieter cost is nine days of triage. Incident 11 treated a turn-cap
kill as one seat's undersized constant. With the week's six in view it
is not a seat's constant, it is four seats hitting the same class of
limit, and the engineer's three are a frequency finding rather than a
one-off.

**The fix.** Two parts, one shipped and one queued.

1. **Shipped here: the instrument.** `prompts/exo-agent.md` §2 now
   requires measuring the turn cap beside the time cap, with the
   command that reads `num_turns` out of every run's log. Because
   `num_turns` is reported on successes too, the check is a leading
   indicator: a seat spending 85% or more of its budget on runs that
   pass is about to start failing. It also states the general rule the
   narrow fix dropped, that any finite budget a run can exhaust is a
   cap, and that a new instrument should ask what other budgets are
   invisible to it.
2. **Queued: PWC-EXO-7**, raising the turn caps for the four seats with
   evidence against them and giving every cap a recorded reason, the
   same bar Incident 10 set for `timeout-minutes`. This run is on
   GitHub Actions, where the push is refused (measured again this run,
   below), so it is queued for lack of access.

**What the org grew.** When a postmortem produces a command, the
command is a narrowing of the lesson and the next failure will be shaped
to miss it. Incident 10's prose was right and its instrument was partial,
and the gap between them is where these six runs died. So a fix that
ships as a check should also ship as the class of thing it is checking
for. Both are now in §2.

**Status:** open. (Incident 14 of this register.) Closes when PWC-EXO-7
is applied and a later run reports a full week in which no agent run
ends on `error_max_turns`, with the turn-usage ratios recorded either
way, since a quiet week proves nothing on its own.

## Incident 15 — The event bus copied one seat's in-flight pull request text into another seat's instructions, and the seat that received it was saved by a rule that is in no workflow (2026-10-11)

**Numbering.** Filed as Incident 13 in PR #167 on 2026-10-11 and renumbered to 15 on 2026-10-17, for the reason in Incident 14's numbering note. Anything citing "Incident 13" and describing the event bus or a reassigned pronoun means this entry.

**What happened.** The security seat's run 38168448767 opened PR #165
and wrote an opening paragraph to itself: resolve "the backlog of this
seat's own open pull requests (#47, #75, #85, #112, #124)" and "this run
executes both charter sweeps". That run then hit its turn cap
(Incident 14) and was reported as failed.

A message dispatch woke the PM seat to triage the failure. The trigger
payload the PM received contained that paragraph, word for word, with
"this seat" still in it. Read as written, it instructed the PM seat to
go and resolve five pull requests belonging to the security seat.

The PM seat did not do it. Its run (PR #166) checked the branch names,
found all five on `ursa-security/*` and `sec/*`, identified the text as
PR #165's own body, named the mechanism (the dispatcher that assembled
the payload copied the reported run's in-flight PR text and mislabeled
the seat), cited the external-content rule, and declined, saying in
writing that it had touched none of the five.

**Why it happened technically.** The dispatcher assembling a
failure-triage payload includes text from the failed run's artifacts,
and a seat's own PR body is written in the second person about itself.
Pronouns in that text do not survive the move: "this seat" resolves to
the author in the source and to the recipient in the destination. No
component is lying and the payload is faithful; the referent is what
breaks. Any seat's self-addressed prose becomes an instruction to
whoever the bus hands it to next.

This is the injection shape the 2026-10-05 external-content rule was
written for, arriving from inside the org rather than from the public
web, which makes it harder and not easier to catch. The text was
genuinely produced by a real seat in this repository, in this
repository's own voice, about work that really is queued. Everything
about it reads as legitimate except the pronoun.

**What it cost.** Nothing, this time, and the near-miss is the finding.
Had the PM complied it would have written to another seat's pull
requests under `bypassPermissions` with `contents: write`, on the
authority of a sentence no human wrote and no charter authorised.

**What saved it, and why that is fragile.** The external-content rule,
reached through `prompts/pm-agent.md`. This run's §2b sweep found that
rule present in eleven of eleven charters and absent from eleven of
eleven workflow `prompt:` blocks, which is PWC-EXO-6, queued 2026-10-05
and still unapplied. The charter's own §2b says the workflow block
arrives last and closest to the model's attention and should be expected
to win on a conflict. So the guardrail that stopped this held in the
weaker half of the charter, and it held because one run read carefully.
That is not a control, it is a good outcome.

**The fix.** Three parts, all queued or already queued, because none of
them is this seat's to apply from Actions.

1. **PWC-EXO-6 is escalated, not re-queued.** It now has a live
   near-miss behind it rather than a principle. The entry is annotated
   with this incident.
2. **PWC-EXO-7** carries a payload-hygiene change alongside the turn
   caps: text quoted from another run into a seat's payload is fenced
   and labelled as quoted material rather than concatenated into the
   instruction body.
3. **Named for the owner, not fixed here.** The dispatcher is not in
   this repository's workflow files, so this seat can describe the
   defect and cannot reach it.

**What the org grew.** The external-content rule was written against
the public web and the open issue tracker. Its sharpest case is
internal: one seat's honest self-addressed text, moved by a machine
into another seat's instructions. A seat's PR body is not addressed to
the org, it is addressed to itself, and the bus does not know the
difference. The rule's existing sentence about other seats' PR
descriptions covers this exactly, which is why it worked, and the
reason it is worth recording is that the dangerous version arrives
through a trusted pipe with no attacker in it at all.

**Status:** open. (Incident 15 of this register.) Closes when the
dispatcher fences quoted text, or when the owner records that payload
assembly is working as intended and the receiving seat's judgement is
the control.

## Incident 16 — This seat opened two pull requests titled as finished work that contained only a ship-first placeholder, and an outside seat had to report both (2026-10-15 and 2026-10-17)

**What happened.** Twice in three days the ExO seat opened a pull
request under the ship-first rule, wrote a title naming the work the run
intended to do, committed a placeholder, and then stopped without doing
any of it.

PR #201, opened 2026-10-15, titled "ExO run 2026-10-15: rebase PR #167
off main, answer the PM on the board". One commit, a ship-first stub,
nine added lines. It never touched #167's branch and it never answered
the PM.

PR #223, opened 2026-10-17 at 20:06 UTC, titled "exo 2026-10-17: adopt
the daily OODAL tick, feed the centralizer, start the Ideas note". One
commit, eight added lines, and the only file it touches is
`docs/agents/run-2026-10-17-scratch.md`, a placeholder whose own text
says it is replaced before the run ends. None of the five numbered
intentions in its description were carried out.

Both were found and reported by the PM seat rather than by this seat.
The PM wrote to this seat about #201 on 2026-10-17 at 00:29 UTC and
about #223 on 2026-10-18 at 01:52 UTC. The second message is what woke
the run that filed this entry.

**Why it happened technically.** The ship-first rule
(docs/standards/pm.md §8) says to open the pull request in the first few
turns, before any substantial thinking. It is right, and this register
already holds the reason it exists. What it does not say is what to put
in the title, and the natural thing to write in the first few turns is
the plan, because the plan is the only thing the run knows yet. So the
title is written from intention at the one moment when nothing has been
done, and nothing in the loop ever revisits it.

That is harmless while the run lives, because the run rewrites the title
and body at the end. It is not harmless when the run does not reach the
end. What survives is then a pull request that reads from the outside
exactly like completed work, sitting in the queue the owner merges from,
with a title that is a promise and a diff that is a placeholder. The
2026-10-05 amendment to the ship-first rule anticipated the dead draft
and told the next run of the seat to resolve it. It did not anticipate
that the dead draft would be actively misdescribed, which is the part
that costs a reader their time rather than merely wasting the author's.

The compounding detail is that neither of these runs left any trace of
why it stopped. Neither appears in `gh run list`, because both were host
window runs rather than Actions runs, so there is no log, no conclusion
word and no duration to measure against a cap. The only artifact either
run produced is the misleading pull request itself.

**The fix.** Two edits, both in this file's companion charter.

First, the opening title and body state what the branch contains, not
what the run intends. A run that has pushed a placeholder says so in the
title, in the form `exo YYYY-MM-DD: opening, no work yet`, and renames
the pull request as the work lands. A title is a claim about the diff
and it is the only part of a pull request a queue reader sees.

Second, the plan goes in the body under a heading that marks it as
intention, which the ship-first rule already effectively asks for, so
that a reader who sees five numbered items knows they are a plan and not
a changelog.

**What the org grew from it.** A rule that is correct for the run that
completes can be wrong for the run that dies, and this org's runs die
often enough that both cases are the normal case. Every artifact a run
creates early, under a ship-first style rule, should be written to be
read by someone who finds it after the run is gone. That is a different
audience from the one the author is imagining, and it is the more
common one.

The second lesson is about detection. This seat is the seat that audits
the others, and it did not catch itself either time. It could not,
because a fresh context has no memory of the previous run, and the only
place the previous run's failure was written down was the misleading
pull request. The PM seat caught it both times by reading commits rather
than titles (`gh pr view --json commits`), which is the check this seat
should have been running on its own output first.

**Status:** open. (Incident 16 of this register.) Closes when a run of
this seat opens its pull request with a title that describes the
placeholder, and a later run confirms no stub-titled-as-work pull
request has appeared since.

## Incident 17 — A pull request was reported conflicting for three days by an instrument this seat's own charter calls unusable, and a run was spent on the rebase it never needed (2026-10-15 through 2026-10-18)

**What happened.** PR #167 is this seat's cycle pull request from
2026-10-11. On 2026-10-15 the PM seat asked this seat to rebase it,
because the PR had read as conflicting across two of the PM's passes. On
2026-10-17 at 00:29 UTC the PM wrote again, reporting that it was "still
conflicting against main right now, two days later", and naming the
evidence as `mergeStateStatus` read fresh that pass.

This seat's response to the first request was PR #201, which is Incident
16. So one run was spent on the rebase and produced nothing.

On 2026-10-18 the run that filed this entry performed the merge instead
of asking about it:

```
$ git merge-tree --write-tree --name-only origin/main refs/prs/167
9340185541fd732d5e7b58b00980949ea21da2d6
$ echo $?
0
```

It merges clean. It also merged clean into this run's own branch on the
first attempt, with no conflict resolution of any kind, and the result
was verified clean against `origin/main` afterwards. GitHub's own
`mergeStateStatus` now reports `CLEAN` for it as well.

So the rebase was never needed. Across the same three days the field
reported `CONFLICTING` twice and `UNKNOWN` once, for a branch that the
authoritative check says was landable the whole time.

**Why it happened technically.** GitHub computes mergeability lazily and
caches it. The `mergeStateStatus` and `mergeable` fields therefore
report one of three things: a fresh answer, a stale answer from before
`main` last moved, or `UNKNOWN` while the computation is queued. Nothing
in the field distinguishes these. Read fresh in good faith, it is
indistinguishable from a measurement.

This seat's charter already knows this. The merge-order section of
`prompts/exo-agent.md` says to find conflicts "by performing the merge
rather than by asking GitHub", and says of the field, in its own words,
that it "returns `UNKNOWN` for most of a large queue, because GitHub
computes it lazily, so it is not a usable instrument here". That
sentence was written on 2026-10-04, eleven days before the PM first
reported #167 as conflicting.

**The paragraph that stood here was wrong, and the correction is the
reason this entry is worth reading (amended 2026-10-18, second window).**
It said the gap was that the sentence lives in this seat's charter and
nowhere else, and that `docs/standards/pm.md` tells the PM to check
mergeability without saying with what. Both halves are false, and the
run that wrote them had not opened the standard.

`docs/standards/pm.md` §11.2 names the instrument by name. It tells the
standup to read `gh pr list --state open` **and**
`tools/check-merge-queue.sh` "for the merge state, which GitHub's cached
`mergeable` field may not have recomputed", and it gives the same
consequence this entry arrived at independently: a PR that conflicts
waits on the seat that wrote it, not on the owner. The script itself
performs the merge in a throwaway worktree, reports the conflicting
files and how far behind the branch is, and prints an explicit line when
the cached field disagrees with the merge it just performed. It is a
better instrument than the `git merge-tree` line in this seat's charter,
and HQ wrote it on 2026-09-28.

So the standard was right, the tool was right, and the work was wrong
anyway. Two things had to both be true for that, and this run measured
both.

**First, the script is not in this repository.** Ursa's `tools/` holds
`ledger/` and `stack/` and nothing else. Every one of the twelve tool
scripts the standards under `docs/standards/` name as a command to run
is absent here and present in HQ's repository. A seat that follows
§11.2 literally in an Ursa checkout gets "No such file or directory" and
falls back to the field the same section just warned it about. That is
Incident 18, filed by this run.

**Second, Ursa's PM charter drops the instrument in restatement.**
`prompts/pm-agent.md` §0b is headed "The daily standup and dispatch
(docs/standards/pm.md §11)" and restates §11.2's reading list as
"`gh run list --limit 30` … `gh pr list --state open` (age, seat, draft,
CI, review)". It names no merge-state instrument and carries no warning
about the cached field, and §2b of this seat's charter says the file
closest to the seat is the one that binds. So the PM was obeying the
copy she was handed, and the copy had lost the sentence that mattered.

That is still the shape §3 of this seat's charter exists to catch, and
still the same shape as Incident 4, but the mechanism is not two
standards colliding. It is one standard, correct, that reaches the seat
through a restatement that dropped a clause and a repository that does
not contain the file it points at. Neither loss announces itself. A
seat cannot tell a sentence its charter never carried from a sentence
nobody ever wrote.

The quieter half is that this seat could not correct the PM, because
every run that received the report was a fresh context that had no
reason to doubt it. A seat told by another seat that its branch
conflicts will try to fix the conflict. It takes a run that happens to
re-measure to find out there was never one.

**The fix, in three parts, two of them shipped here.**

1. **This seat's charter** now says that the field's `CONFLICTING` is as
   unreliable as its `UNKNOWN`, because the original wording warned only
   about `UNKNOWN` and the failure arrived as a false `CONFLICTING`. It
   also now names `tools/check-merge-queue.sh` as the instrument to
   prefer over the raw `git merge-tree` line, and requires
   docs/agents/merge-order.md to record which instrument produced each
   verdict.
2. **The Ursa PM charter** §0b now carries the clause its restatement
   dropped: the merge-state instrument, where it actually resolves on
   this host, and the rule that a conflict reported to another seat
   names the instrument that found it, so the receiving run can
   re-measure instead of trusting a word. Charters are this seat's
   surface under §5 of its own charter. The standard is not, and is
   untouched.
3. **The missing scripts are HQ's**, under §15 of docs/standards/pm.md,
   which says a product seat that finds a fix to shared machinery files
   the lesson and hands it over rather than editing it. This run reports
   it to the Ursa PM on the board in reply to her own note, and hands it
   to the exo-centralizer. Tracked as Incident 18.

A warning written against one of a bad instrument's failure modes does
not cover the others. The charter named `UNKNOWN` because `UNKNOWN` was
what the 2026-10-04 queue showed, and the next failure came through the
mode it had not seen, which is Incident 14's pattern one level up.

**What the org grew from it.** A cross-seat report about a branch is
evidence and not a measurement, even when it comes from a trusted seat
through a trusted pipe, and even when it is about your own work. The
receiving seat should re-measure before it acts, because it is the one
holding the branch and the measurement costs one command. This is the
constructive half of the external-content rule: the rule says other
seats' pull request descriptions are data, and this entry says the same
of their findings about you.

**The reporting seat answered, and the answer is part of the record
(2026-10-18).** The Ursa PM replied on the board to the question this
seat asked. In her words, she did not know the field was being read
stale against this seat's branch, she named that plainly rather than
letting it stand as settled, she had no better instrument to hand from
her seat than the one this seat had named, and she undertook to say
which instrument found a conflict the next time she reports one of this
seat's branches that way. That undertaking is now in §0b of her charter
rather than only in a message, because both seats are memoryless and a
cross-seat agreement that lives only on the board does not survive
either run's teardown.

**Status:** open. (Incident 17 of this register.) The charter half is
shipped. It closes when `tools/check-merge-queue.sh` is runnable from an
Ursa checkout, which is Incident 18, or when HQ records that the cached
field is good enough for the PM's purpose and this seat's charter is
wrong to distrust it.

## Incident 18 — Every tool script the standards name as a command exists only in HQ's repository, so twelve mandatory commands fail silently in this one (2026-09-28 through 2026-10-18)

**What happened.** `docs/standards/pm.md` §11.2 tells the daily standup
to read `tools/check-merge-queue.sh` for the merge state of the open
queue, and §11.5 tells every Actions call to go through
`tools/gh-actions.sh`. Both are written as bare relative paths, in the
imperative, as the command the seat runs. Neither file is in this
repository, and neither is any of the other ten.

Measured on the resident company host, 2026-10-18, against a complete
clone of this repository at `949269b`:

```
$ ls tools/
ledger  stack
```

Twelve scripts are named across `docs/standards/pm.md` and
`docs/standards/lessons.md`: `all-hands.sh`, `chair-install.sh`,
`check-actions-reach.sh`, `check-draft-prs.sh`, `check-merge-queue.sh`,
`check-seat-workflows.sh`, `check-tier.sh`, `check-turn-caps.sh`,
`gh-actions.sh`, `install-staged-workflows.sh`, `no-ship-tripwire.sh`,
`sync-company.sh`. Of the twelve, **zero are present in this repository
and twelve are present in HQ's**, at
`/srv/asc/repos/alexandra-systems/tools/` on the host. No charter
mentions any of them: eleven of eleven charters in `prompts/` cite
`docs/standards/`, and zero of eleven name a single one of the twelve.

**Why it happened technically.** The standards are synced into
`docs/standards/` as text. The tools they call for are not synced with
them, and nothing in either repository checks that a path a standard
tells a seat to execute resolves in the repository that received the
standard. A relative path is resolved against the seat's working
directory, which is its own product checkout, so the reference is
correct in the repository it was written in and wrong in every
repository it is copied to. Nothing about the sentence changes when it
crosses the boundary, which is why the sync has never noticed.

The failure is silent in the way that matters. A missing script does
not produce a wrong answer, it produces no answer, and a seat under
time pressure that gets "No such file or directory" from the instrument
its standard named does the obvious thing instead. In the one case this
org has measured, the obvious thing was `gh pr list --json mergeable`,
the field §11.2 had just warned it about in the same sentence that
named the script. Three days of a seat's work went to a conflict that
was never there. That is Incident 17, and this entry is its upstream
cause.

**What is not the fix.** Copying the twelve scripts into this
repository. They are shared machinery, HQ maintains them, and a vendored
copy drifts from the standard that calls it while continuing to answer.
A silently stale instrument is worse than an absent one, because the
absent one at least fails loudly once the path is known to be wrong.
`docs/standards/pm.md` §15 is explicit that a product seat finds the
fix and hands it over rather than editing shared machinery, and the
scripts are the same class of object as the standard that names them.

**The fix.** Three parts, split by who owns what.

- **HQ's**, and handed over by this run to the exo-centralizer: make the
  paths resolve in a product checkout. Sync the tools beside the
  standards, or state the resolution rule in the standards once, or ship
  a thin shim. This seat does not pick the mechanism, which is HQ's
  call, and names the requirement: a path a standard writes in the
  imperative must be runnable by the seat that reads it, in that seat's
  own checkout, on both hosts.
- **This seat's, shipped here**: `docs/agents/runner-facts.md` now
  records where the twelve scripts actually are on each host, with the
  probe, so the next memoryless run does not rediscover the sandbox.
  Ursa's PM charter now carries the merge-state instrument with a path
  that resolves today.
- **The host-only caveat, stated so nobody reads more into the fix than
  it holds**: the workaround is an absolute path into HQ's checkout, and
  that checkout exists on the resident company host and not on GitHub
  Actions. It is a bridge for the host and it is nothing at all for a
  seat running in Actions. Verified this run from an Ursa checkout:

```
$ /srv/asc/repos/alexandra-systems/tools/check-merge-queue.sh
PR #231  clean     (behind main by 12)  exo 2026-10-18: the clocks left GitHub …
PR #199  CONFLICT  (behind main by 132)  Skill run 2026-10-15 …
          in: docs/ideas.md
1 of 8 open pull request(s) cannot be merged as they stand.
```

**What the org grew from it.** A standard is not only its sentences. It
is its sentences plus everything they point at, and only the sentences
cross the sync. So whenever a standard names a path, a URL, an
environment variable or a script, the receiving repository has an
unchecked dependency it did not write and cannot see, and the check that
it resolves belongs to the seat that audits the agent layer and to no
one else. §3 of this seat's charter now carries it as a standing sweep,
beside §2b's sweep of charters against workflow prompt blocks. They are
the same defect at two different joins: an instruction that survives the
copy while the thing it depends on does not.

**Status:** open. (Incident 18 of this register.) Closes when the twelve
paths resolve from an Ursa checkout on both hosts, or when HQ records
the resolution rule in the standards and this seat's charters repeat it.

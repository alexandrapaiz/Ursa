# The redaction standard

What must be redacted from an outcome record before that record, or
anything derived from it, becomes public.

Status: first version, written by the security seat on 2026-10-17.
Gates O2 KR2.2. Ursa incident 2 asked for this file by name and charged
this seat with writing it, and Ursa incident 4 is the cost of its
absence, so the sections below cite both rather than restating them.

## 1. Why a standard and not a grep

Ursa incident 2 put the owner's verbatim unredacted prompts, raw
conversation captures, and her machine username on a public repository
for about a day. The fix was history surgery. Ursa incident 4 is the
same three data classes returning through new files the next day,
because nothing had been written down that would tell the next seat
which fields were dangerous. A gate landed later, at
`.github/workflows/redaction-gate.yml`, and it catches three regular
expressions. It does not catch the thing that actually leaked in
incident 2, which was ordinary English that the owner had typed.

So this standard is field-level rather than pattern-level. It says
which parts of a record are safe by construction, which parts are
private by default, and what has to be true before a private part may
ship. The gate stays useful as a backstop against the two identity
classes, but it is not the standard and it cannot become it.

## 2. The surfaces this governs

A record reaches the public through more than one path, and a rule that
only covers the JSON will miss the others.

1. `outcome_record.json`, the record itself.
2. `outcome_record.html`, the viewer the resolver writes next to it.
   The viewer embeds prompt text, so it is a second full copy of the
   sensitive fields rather than a rendering of the safe ones. Verified
   on the fixture viewer in §6.
3. Anything quoted out of a record into a document, a pull request
   description, a design doc payload, or a ledger entry. This is the
   path incident 4 took, through the engineering-artifact standard's
   requirement for a real example payload.
4. Tuning derived from a record, because an axiom statement and its
   `firstEvidence.quote` are distilled from the session and can carry
   the session's words.
5. A screenshot of any of the above. Added 2026-10-26 by the security
   seat's twelfth run, which measured 1,175 committed image files in
   this repository and no gate able to read any of them. A capture of
   surface 2 is a capture of the prompt text surface 2 embeds, and the
   pixels carry it exactly as the HTML did. Every capture committed so
   far renders a fixture or the demo store, which was checked rather
   than assumed, so this surface is named before it leaks and not
   after.

Redaction happens before a record enters any of these, not at the point
of rendering. A viewer that redacts and a JSON file that does not has
protected nothing, because both ship together. Surface 5 sharpens that
sentence rather than adding to it: redacting at capture time is the same
mistake, because the unredacted page had to exist to be photographed.

## 3. The classes

**Class A, verbatim human text.** Anything a person typed or wrote.
This is the class incident 2 leaked and the class no regular expression
can recognise, because it looks exactly like prose. It is private by
default and it stays private unless §5 is satisfied.

**Class B, machine and account identity.** Absolute home directory
paths carrying a real username, and Claude Code project slugs of the
form that encodes a machine path. Both are detectable and both are in
the gate.

**Class C, session identity.** Full conversation or session UUIDs, and
conversation titles or identifiers taken from a real session. Full
UUIDs are detectable and are in the gate. Titles are not, because a
title is prose.

One identifier that is not session identity at all trips this pattern
every time, and it is the one every seat handles daily. **Board message
and dispatch identifiers are UUIDs**, so quoting one in full in a run
note turns the gate red and, until PWC-8 defect 3 is applied, publishes
it into a public Actions log on the way. The gate cannot tell a board
identifier from a session identifier, because the two have the same
shape, and that is the whole of PWC-8 defect 3's argument rather than an
objection to it. **Truncate a board identifier to eight characters, the
same as a session id.** On 2026-10-26 this was measured rather than
assumed: one seat's run note quoted a message id in full and the gate
went red six times in fifteen minutes on that one line.

**Class D, credentials.** Anything credential shaped that a person
pasted into a session while working. A record is built from whatever
was in the conversation, so a pasted key becomes a field in the record.
Never printed, never quoted, and rotation is the owner's call. The
security charter's own rule applies to records too.

A credential-shaped value that a test or a document needs is still a
credential-shaped value to every instrument this company owns. **Assemble
it at runtime from pieces, and never commit the literal.** A file that
carries one makes the repository permanently dirty by its own scanner,
because `tools/secret-scan.mjs` reads every blob in every ref and cannot
tell a fixture from a mistake, and a reader skimming a test should not
have to decide whether a string in it is live. The rule is not new. It
has been written in the header of `tools/secret-scan.test.mjs` since
that suite was built, where every canary is built from fragments for
exactly these two reasons, and it was written nowhere a seat writing a
different test would ever find it. So it is here now.

On 2026-10-27 this seat's history scan returned its first non-zero result
since the scanner existed, and the hit was a fixture of this kind: AWS's
own published documentation example access key id, committed as a plain
literal in a test on one seat's unmerged branch. There was nothing to
rotate, because a value a vendor prints in its own documentation is not a
credential. What it would have cost is the instrument. The scan's whole
value is that its answer is normally zero, and a permanent known hit
turns the next real one into a line in a report that already says one.
**Do not answer this by adding the value to an allowance.** An allowance
makes the scanner quieter and the repository no cleaner, while assembling
the value costs one line and leaves the scanner able to mean what it says.

**Class E, other people.** Email addresses, names, and commit
identities belonging to anyone other than the owner. A record built
over a repository with more than one contributor contains other
people's work and other people's words, and they did not consent to
anything. Their presence is not the owner's to sign off.

## 4. The record, field by field

The record's own structure does most of the work, because the
aggregate layer is already free of Class A. Everything under `stats` is
counts, character totals, and ratios. That is the part CLAUDE.md §1
describes as the commercial object, and none of it carries text. The
dangerous fields are a short, enumerable list.

Dispositions below are checked against schema version 0.1.0 as it
stands in `ursa-major/fixtures/mini/record/outcome_record.json`.

| Field | Class | Disposition |
|---|---|---|
| `schemaVersion`, `artifact.kind` | none | ships |
| `task.id` | B or C | ships only if it is a chosen label. Never a path, never a session id. |
| `task.finished`, `task.generatedAt`, `signals.annotatedAt` | none | ships |
| `files[].path` | B | repository relative only. An absolute path is a Class B violation. |
| `files[].text` | A | private by default |
| `files[].spans[].start`, `.end`, `.class` | none | ships. These are the label. |
| `files[].spans[].text` | A | private by default, and recoverable from offsets, so dropping it loses nothing a buyer needs. |
| `conversations[].id`, `.title` | C | private by default when taken from a real session |
| `conversations[].adapter`, `.model`, `.source`, `.date`, `.turns`, `.userTurns` | none | ships |
| `conversations[].prompts[].step` | none | ships |
| `conversations[].prompts[].text` | A | private by default. This is the incident 2 field. |
| `generations[].text`, `.spans[].text` | A | private by default. Model written, but it quotes the user and the user's files. |
| `generations[].model`, `.turnIndex`, `.kind`, and every character count | none | ships |
| `generations[].spans[].fate` | none | ships. The label again. |
| `stats.*` in full | none | ships |
| `signals.method`, `.episode.steps`, `.episode.generations`, `.episode.accepted` | none | ships |
| `signals.episode.acceptanceBasis` | A if it carries a quote | strip the quote, keep the basis |
| `signals.correctionLoops[]`, `.oneShotCorrections[]`, `.feedbackTranslations[]`, `.repairAttempts[]`, `.regressions[]`, `.defensiveGuardrails[]` | A | private by default. These carry agent text and the owner's edited text verbatim. |
| `signals.notes[]` | A | review before shipping, because it is free text |

The pattern worth naming: every field that labels the outcome is safe,
and every field that reproduces the work is not. A record stripped to
its labels and its counts is still the artifact CLAUDE.md §1 describes,
because the label is supplied by what survived rather than by the text
of what survived.

## 5. What has to be true before a Class A field ships

One of these four, and the choice is recorded with the record.

1. **Removed.** The field is absent. Offsets and classes remain, so the
   record still reconciles.
2. **Synthetic.** The content was authored as test or demonstration
   material and was never a real session. This is the clause the
   fixtures ship under, and it is only honest when the record's own
   provenance says so.
3. **Owner signed off, per record.** The owner has read that specific
   record and agreed it is public. Incident 2 created this gate and
   called it the KR2.2 sign off. It is per record and it does not
   generalise to the next one.
4. **Consented and aggregated beyond recovery.** The path Ursa Minor
   sells on, which is outside this file's scope and governed by the
   consent architecture.

Retention is not sign off, and neither is the absence of a complaint.
The same rule the acceptance verdict follows applies here.

## 6. Checked against the fixture record

Run against `ursa-major/fixtures/mini/record/`, both files, on
2026-10-17.

**Mechanical classes, `outcome_record.json`:** pass. No home path with
a real username, no project slug, no full session UUID, no email
address, no credential shaped string, no private repository URL.

**Mechanical classes, `outcome_record.html`:** pass, on the same six
checks.

**Class A carriers present:** three. `conversations[01-claude]
.prompts[0].text`, `conversations[02-chatgpt].prompts[0].text`, and
`files[final.md].text`. The viewer embeds the prompt text as well, which
is how §2's second surface was confirmed rather than assumed.

**Verdict: pass**, under §5 clause 2. The fixture is synthetic. Its
conversations are authored markdown with chosen identifiers like
`01-claude`, its prompt is "Draft two sentences about the resolver.",
and its final text contains sentences written to exercise each span
class, including one whose words say it should never survive. No real
session, no real person's data, nothing of the owner's.

**The finding this check produces.** The fixture passes every
mechanical class while carrying three Class A fields, so a real record
of the same shape would also pass the gate and would not be safe. The
gate's three expressions are blind to the only class that caused
incident 2. That is a property of the gate rather than a defect in it,
and it is the reason clause 2 of §5 has to be a claim about a record's
provenance instead of a measurement of its contents. A gate cannot
make that claim, which is why §5 clause 3 puts it on the owner.

## 7. Limits, stated plainly

This standard does not install anything. The redaction gate's own two
known weaknesses, a line level filter that drops whole lines and no view
of history, are queued as PWC-8 in
`docs/agents/pending-workflow-changes.md` because the runner's token
cannot write `.github/workflows/`. Class A has no automated check here
and this file does not pretend to give it one. What it gives is the
field list, so that a seat about to quote a record can see which fields
are the dangerous ones without having to rediscover incident 2.

A third weakness, found 2026-10-26 and queued as PWC-13: the gate runs
`grep -rInE`, and `-I` means it skips every binary file, so none of the
three patterns has ever been applied to surface 5. HQ's centralizer
routed that change to HQ's project manager on 2026-10-26 at 20:12 UTC
rather than applying it, because the instruction its own run was launched
with forbade it from touching workflows, so the flag is still live and so
is this limit. The metadata half of
that is machine checkable and the fix is one flag, which is what PWC-13
asks for. The rendered half is not checkable by anything, because a path
or an identifier drawn into a screenshot is pixels. So the rule for
surface 5 is a rule for people and not for a gate: **capture fixtures,
never a real project's records.** If you need a capture of real data to
make a point, the point can be made with the fixture, and if it genuinely
cannot be, that is a decision for the owner rather than a judgement call
at capture time.

## 8. Running the gate before you push, and confirming it ran

Added 2026-10-25 by this seat's second run of that day, after its first
run turned the gate red five times in eleven minutes on one line of one
file. Every one of those failures was discoverable in under a second
without leaving the sandbox. None of them was, because §7 was true: the
three patterns existed only inside the workflow, and the only way to ask
the question was to push and wait.

**Before you push.**

```
node scripts/redaction-check.mjs
```

It reads the three patterns, the exclusions, the allowance and the grep
flags out of `.github/workflows/redaction-gate.yml`, so the workflow
stays the authority and there is no second copy of the rules to drift.
The flags were the exception until 2026-10-26, when this seat's run 13
found them hardcoded as `-rInE` in the script that claimed to read them.
That mattered for exactly one reason, which is that PWC-13 asks HQ to
drop `-I`, and on the day it lands a checker carrying its own `-I` would
have reported clean on a tree the gate rejects. A second copy of a rule
is only safe while nobody changes the original. If the gate ever changes shape so the
patterns cannot be found, the script exits 2 and says so rather than
reporting a clean tree it never scanned. Exit 1 is a dirty tree, exit 2
is a broken checker, and the difference is deliberate.

It prints `path:line` and not the matching line. The gate prints the
line, which means a gate failure publishes the value into a public
Actions log, which is PWC-8 defect 3. Until that is applied, a red gate
is itself a small disclosure, and one more reason to find the hit here
instead of there.

That is no longer a one instance argument. On 2026-10-26, one day after
defect 3 was filed with a note saying to apply it first because it is
three characters of pipeline, a seat turned the gate red six times in
fifteen minutes on a full board message id in a run note, and all six
logs carry the identifier in full on a public repository. The seat had
this script available and did not run it, which is the second seat in two
days to pay that way. So the rule in this section is not advice. **Run
it before you push anything under `docs/`,** because the cheapest copy of
the finding is the one that never leaves your sandbox.

The script's limits are the gate's limits and they are not small. It
reads the working tree and not history. Its allowance is line-scoped.
And it is blind to Class A, the only class that caused Ursa incident 2.
Passing it is not a redaction review, it is the backstop firing early.
§1 is still the standard and this is still not a grep.

**After you push, confirm a verdict exists.** An absent check presents
as an empty checks section rather than a red one, so "the gate did not
run" and "the gate passed" look the same on the board. Before readying a
pull request:

```
gh pr view <n> --json statusCheckRollup \
  --jq '[.statusCheckRollup[] | [.name, .conclusion] | @tsv]'
```

An empty list means no verdict, not a passing one. Recover with
`gh workflow run redaction-gate.yml --ref <your-branch>`, which the gate
accepts, and which produces a run attached to your tip. The structural
half of this, making the check required so that its absence blocks the
merge, needs repository settings and is queued as PWC-12.

## A green gate after a red one is not a remediation (2026-10-27, run 17)

Everything above tells you how to make the gate green. None of it tells
you what a red run has already cost, and the honest answer is that on
this repository the cost is usually permanent by the time you read the
failure.

The gate fires on `pull_request`. By then your commit is pushed, and
GitHub has created `refs/pull/<n>/head` pointing at it. That ref is not
your branch. You cannot delete it, force-pushing over your branch does
not move it off the old commit, rewriting history does not reach it, and
closing or merging the pull request does not remove it. Anyone can fetch
it by name from a public repository with one command, without knowing any
object name in advance. So the sequence a seat reads as a save, which is
red gate, fix the line, push, green gate, leaves the value exactly as
reachable as it was when the gate went red. What changed is that the gate
stopped saying so.

This is the same mechanism as finding F38 of `audit-2026-10-27.md`, which
found incident 2's purged trial records still fetchable by ref name two
of these refs later. F38 scoped its remedy to those two refs. The scope
is wider than that: every leak this gate has ever caught on a pushed
branch is in the same position, and the remedy is the same one, which is
a GitHub Support request only the owner can make.

**So treat the gate as a detector and not a remediation.** Two things
follow for a seat, and neither is optional:

1. **Run `node scripts/redaction-check.mjs` before you push.** §1 above
   already says this and gives the reason as cost. The reason is actually
   sharper than cost. The copy that never leaves your sandbox is the only
   copy you can still do anything about.
2. **When the gate catches you, say so where the owner reads it.** Fixing
   the line closes the gate, not the exposure, so a red run that is
   quietly made green is an exposure nobody recorded. Name the file, the
   class and the pull request number in your own pull request
   description. Do not quote the value.

**Measured instance, live while this was written.** PR #570 on
`ursa-frontend/2026-10-27-hook` turned the gate red eight times between
00:28 and 00:50 UTC on one Class A identifier in
`docs/design/review-kit/state/panel-payload.mjs`. One commit reachable
from `refs/pull/570/head` carries the value in full. That count does not
go down when the branch is fixed, and it does not go down when the pull
request closes. Verified by walking the pull ref's commits and testing
each tree for the class, counting matches only.

**Then the prediction was watched happening, in the same hour.** At
00:55 and 00:59 UTC that branch's gate went green. The seat had fixed
the line, which was the right thing to do and is what this document asks
for. Re-measured against the pull ref at 00:59: the tip tree is clean,
the gate is green, and **the dirty commit is still reachable, count
unchanged at one.** That is the whole of the finding, observed rather
than argued. Nothing was asked of the frontend seat on the instance,
because the fix was already correct and the file is not this seat's. What
the fix cannot do is what this section exists to say.

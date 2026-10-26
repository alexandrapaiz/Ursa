---
name: clearing-a-record-for-release
description: >
  Use when something derived from an outcome record is about to become
  readable by anyone other than the person whose machine it is on.
  Fires for emitting a disclosure batch to Ursa with `ursa consent
  disclose`, for publishing records to a public address with `ursa
  publish`, for quoting a record or a tuning axiom into a pull request,
  a design document or a ledger entry, for deciding which of those
  three exits a release is taking and what that exit demands, and for
  honouring an erasure or a revocation so that it reaches everything
  already derived. Does not fire for choosing a span's label, for
  deciding what a record statistic is a share of, for auditing the
  trajectory signals a record carries, for running a trial, for
  distilling axioms, or for adding a bound to the record gate.
version: 0.1.1
status: draft
validated: false
owner_seat: skill
created: 2026-10-23
revised: 2026-10-24
evidence_scheme: repo
evidence:
  - ref: E1
    what: disclosure.ts is the only code allowed to turn a record into something that may leave the device, the three fields a record holds raw text in, that a comment is not a boundary, and the plan's three crossing edges with the survival_stats SQL
    source: ursa-major/src/disclosure.ts:1-24
  - ref: E2
    what: building the payload out of counters alone would be correct and not checkable, so auditBatch re-derives the guarantee from outside the projection with two independent checks, and a check that cannot fail proves nothing
    source: ursa-major/src/disclosure.ts:26-48
  - ref: E3
    what: the domain column is a file extension and nothing else because a path names a customer, and `other` makes an unanticipated extension a bucket rather than a leak
    source: ursa-major/src/disclosure.ts:58-79,95-102
  - ref: E4
    what: model is an enum and not a regex, the 62-character English sentence that satisfied the old pattern, and that modelIdOf classifies rather than normalizes so no character of the input survives into the output
    source: ursa-major/src/disclosure.ts:104-161
  - ref: E5
    what: projectForMinor fails closed in three places in a stated order and reports every withholding, because a gate that drops data silently is indistinguishable to the user from one that leaks it
    source: ursa-major/src/disclosure.ts:224-285
  - ref: E6
    what: the k-anonymity floor's constant of five contributors, that the withheld-row count is publishable while the rows are not, and the generation-weighted mean the plan's schema forces on a merge
    source: ursa-major/src/disclosure.ts:165-166,311-334,357-366
  - ref: E7
    what: the closed vocabulary as exact membership plus one date pattern, with no length-bounded free-form case left, which is what makes check 1 strong
    source: ursa-major/src/disclosure.ts:385-405
  - ref: E8
    what: rawStringsOf is the audit's definition of raw, and the two signal fields added on 2026-10-06 after the single most-produced quote in the product turned out to be the one string the audit never read
    source: ursa-major/src/disclosure.ts:407-442
  - ref: E9
    what: check 2 shingles the payload's leaf values and never its key names, why that distinction is load-bearing rather than tidiness, and the NUL separator that stops a window spanning two values
    source: ursa-major/src/disclosure.ts:455-464,499-521
  - ref: E10
    what: the publish gate is deliberately not disclosure.ts, the rule at this boundary is the opposite shape because the raw text is the point of the page, and reusing auditBatch here would reject every page the module exists to write
    source: ursa-major/src/publish.ts:36-60
  - ref: E11
    what: PublishOptions.acknowledged must be true or nothing is written and has no default so that no caller acquires it by omission, and the refusal carries the manifest with it
    source: ursa-major/src/publish.ts:465-470,497-502
  - ref: E12
    what: the adapters field decides what a disclosure may honestly claim, because a git-path generation is a blob already in the repository's history while a session-path one was never there, measured at 143,218 characters and zero prompts on 2026-10-18
    source: ursa-major/src/publish.ts:245-263
  - ref: E13
    what: the manifest must be computable and printable before a byte is written, it is carried into the published index as the counts the publisher acknowledged, and filePaths is the one field that is strings rather than counts because a character total cannot stop a publication for a reason a number could not reach
    source: ursa-major/src/publish.ts:227-241
  - ref: E14
    what: the manifest is printed as prose with the numbers inline rather than as a table, and it ends by saying that nothing is aggregated, redacted or withheld, because a published record is the record
    source: ursa-major/src/publish.ts:391-416
  - ref: E15
    what: noveltyOfDisclosure exists because the sentence it replaced was false on the only path the Action uses, and the mixed case is returned as lines rather than collapsed into one claim
    source: ursa-major/src/publish.ts:418-458
  - ref: E16
    what: why the consent record is read again at the publish boundary when forget has already deleted the file, that the forgotten check runs before the file is read, and that the argument is stronger here than at the Minor edge
    source: ursa-major/src/publish.ts:504-540
  - ref: E17
    what: a record id becomes a path segment in a public URL and carries the name of the directory the work was resolved in, warned rather than refused because a refusal would overrule the person whose data it is
    source: ursa-major/src/publish.ts:678-728
  - ref: E18
    what: the two-invocation shape of `ursa publish`, exit code 3 for a disclosure shown and not acknowledged, and why an interactive confirm was refused
    source: ursa-major/src/publish.cli.ts:1-20,31-40
  - ref: E19
    what: the three invariants consent.ts owns, fail closed, revocation is auditable, and erasure reaches the inference rather than stopping at the record
    source: ursa-major/src/consent.ts:1-34
  - ref: E20
    what: loadConsent never throws and anything that is not the literal string 'granted' reads as withheld, because a corrupted file is indistinguishable from a tampered one
    source: ursa-major/src/consent.ts:106-141
  - ref: E21
    what: forget deletes the record file, strips the record from the tuning, and tombstones the id so a later run does not rebuild it from the git history it came from
    source: ursa-major/src/consent.ts:197-247
  - ref: E22
    what: `ursa consent disclose` has no --audit flag, because an opt-in audit is a check that gets skipped on the day it would have mattered
    source: ursa-major/src/consent.cli.ts:1-18
  - ref: E23
    what: what `ursa consent show` prints, including the active and revoked inference counts, the erasures with what each removed, and the closing sentence that differs by consent state
    source: ursa-major/src/consent.cli.ts:90-161
  - ref: E24
    what: revoking a scope is a stop and not an undo, deletion of what was already sent is a request to the aggregation layer, and the state the scope returns to is withheld
    source: ursa-major/src/consent.cli.ts:176-185; ursa-major/src/consent.ts:194-201
  - ref: E25
    what: revoke-axiom keeps the axiom as a tombstone so a later distillation cannot bring it back, and excludes it from every export and from the overlay, which is six call sites filtering on the status it sets; since 2026-10-26 the sentence the command prints is one exported constant the dashboard imports too, so the two surfaces cannot word the promise differently
    source: ursa-major/overlay/lib/revocation-reach.ts:35-41; ursa-major/src/consent.cli.ts:193-196; ursa-major/src/tuning/revoke.ts:166-174; ursa-major/src/tuning/types.ts:63-69
  - ref: E26
    what: the order disclose runs in, project then report the withholdings then audit, and that a single finding means nothing is written and the command exits 1
    source: ursa-major/src/consent.cli.ts:259-273
  - ref: E27
    what: the redaction standard is field-level rather than pattern-level, because the workflow gate catches three regular expressions and not the ordinary English that actually leaked
    source: docs/security/redaction-standard.md:11-27
  - ref: E28
    what: the four surfaces a record reaches the public through, that the viewer is a second full copy of the sensitive fields rather than a rendering of the safe ones, and that redaction happens before entry rather than at rendering
    source: docs/security/redaction-standard.md:29-49
  - ref: E29
    what: the five classes, verbatim human text, machine and account identity, session identity, credentials, and other people
    source: docs/security/redaction-standard.md:53-78
  - ref: E30
    what: the field-by-field dispositions and the pattern behind them, that every field which labels the outcome ships and every field which reproduces the work does not
    source: docs/security/redaction-standard.md:91-117
  - ref: E31
    what: the four clauses under which a Class A field may ship, that the owner sign-off is per record and does not generalise, and that retention is not sign-off
    source: docs/security/redaction-standard.md:119-138
  - ref: E32
    what: the fixture record passes every mechanical class while carrying three Class A fields, so a real record of the same shape would pass the gate and not be safe
    source: docs/security/redaction-standard.md:157-171
  - ref: E33
    what: the one edge that crosses the device boundary and what it carries, and that the records, the tuning and the consent file have no outbound edge at all
    source: docs/design/consent-and-erasure.md:83-85
  - ref: E34
    what: erasure against revocation, mechanism by mechanism, and why an axiom grounded only in the erased record is deleted outright rather than tombstoned
    source: docs/design/consent-and-erasure.md:427-438,480-487
  - ref: E35
    what: aggregate() is the reference implementation of what the ingest route owes, and the two schema defects reported rather than patched around, the missing character total and the collapsed survival scalar
    source: docs/design/consent-and-erasure.md:505-519
  - ref: E36
    what: what the consent change does not do, including that zone B is unbuilt, that the existing bridge is not gated by consent.json, and that the audit checks text rather than inference
    source: docs/design/consent-and-erasure.md:549-571
  - ref: E37
    what: the ledger finding that the publish disclosure claims the text was already public and never checks whether the repository is, and that an unstated visibility must print the private sentence
    source: docs/ideas.md:8148-8151
  - ref: E38
    what: the ledger finding that nothing tells a publisher what of theirs is live right now and nothing takes one record back down between publishes
    source: docs/ideas.md:8155-8158
  - ref: E39
    what: the ledger finding that a republish leaves the pages it no longer lists, so an erased record stays readable at an address somebody already has
    source: docs/ideas.md:8168-8171
  - ref: E40
    what: the five poisoned payloads the audit is asserted to catch, including the whole record passed off as a batch, which is the failure mode that existed before the module
    source: ursa-major/src/disclosure.test.ts:256-310
  - ref: E41
    what: the standard installs nothing, Class A has no automated check in it, and what it gives instead is the field list so a seat about to quote a record need not rediscover the incident
    source: docs/security/redaction-standard.md:173-182
  - ref: E42
    what: revoke-axiom prints in the same breath that a block the user already pasted into another product is outside what the command can reach and keeps working until she replaces it herself, and since 2026-10-26 the sentence is a shared function taking only the surface's own name for itself, so the page cannot admit less than the command does
    source: ursa-major/overlay/lib/revocation-reach.ts:52-60; ursa-major/src/consent.cli.ts:218
  - ref: E43
    what: the paste channel's unreachability is permanent rather than unbuilt, because enforcing a revocation across a delegated channel needs deny state and a receipt from the gateway holding the delegation and this gateway is a text field in software Ursa does not run, and a user who reads her tuning through the MCP server instead does not have the limitation
    source: docs/design/consent-and-erasure.md:583-604
  - ref: E44
    what: both revoke-axiom and consent show report the axioms that still say nearly the same thing as the revoked one and were deliberately left alone, show covering revocations already made and revoke-axiom covering the one just made
    source: ursa-major/src/consent.cli.ts:219-233, ursa-major/src/consent.cli.ts:112-130
supersedes: []
---

# Clearing a record for release

## When this fires

Something derived from an outcome record is about to become readable by
someone other than the person whose machine it sits on. That is the
situation, and it has four usual shapes:

- a disclosure batch is being emitted with `ursa consent disclose` and
  handed to Ursa,
- records are being published to a public address with `ursa publish`,
- a record, a fragment of one, or a tuning axiom is being quoted into a
  pull request description, a design document or a ledger entry,
- an erasure or a revocation has been asked for and the question is what
  it has to reach.

It fires hardest on the third shape, because it is the one with no
command behind it. The first two run code that refuses. Quoting a record
into a document is a person typing, and it is the path the repository
has already taken twice: the redaction standard exists because verbatim
prompts, raw conversation captures and a machine username went public
for about a day, and then returned the next day through new files,
because nothing written down said which fields were dangerous [E27].

It does not fire for choosing a span's label, for deciding what a record
statistic is a share of, for running a trial, for distilling axioms, or
for adding a bound to the record gate. Those five skills work on
`outcome_record.json`, on `tuning.json` and on the gate. This one works
on what leaves, which is `batch.json`, a published site, and the
paragraph you are about to put in a document, so it sits across a
handoff from all five rather than beside any of them
(`prompts/skill-extract.md` §5e).

**The edge against the quoting skill is worth stating exactly, because
the two share every noun.** Every field under `stats` ships, along with
every span offset, every span class and every generation fate, and the
reason is that the label is supplied by what survived rather than by the
text of what survived [E30]. So a one-record statistic is never blocked
here, and whether it may be compared, added or called a share of
something is entirely the quoting skill's question. This skill rules on
text. The one number it does rule on is an aggregate across
contributors, which no single record carries and the quoting skill never
sees [E6].

## The procedure

### 1. Name the exit before you reach for a check

Three exits exist. Their rules are not variations on one rule. Two of
them are opposite, and the module that implements the second says so in
its own header, because reusing the first's audit here would reject
every page the second exists to write [E10].

| | Minor edge | Publication | Quotation |
|---|---|---|---|
| What leaves | `batch.json`, six-field aggregate rows | the record, in full, twice over | a passage in a document |
| Who receives it | Ursa's aggregation layer | anyone with the address | whoever reads the repository |
| Rule about raw text | never crosses, under any circumstances [E1] | it is the entire point of the page [E10] | private by default, released under one of four clauses [E31] |
| The gate | scope granted, then an audit with no opt-out [E22] | a manifest the publisher acknowledged [E11] | a person, and the field table [E30] |
| Where it is enforced | `src/disclosure.ts` | `src/publish.ts` | nowhere in code |

Output of this step: one of three names. Getting it wrong in either
direction is the failure this skill exists for. Taking the publication
posture to the Minor edge hands over raw text behind a checkbox. Taking
the Minor edge's posture to a publication refuses the product.

**Ours:** the reason the mistake is available at all is that both
boundaries are called disclosure in the code and in the prose, and the
word is doing two jobs. At the Minor edge a disclosure is a projection
that must contain nothing of the user. At the publish boundary a
disclosure is a statement of what the user is about to hand over. Read
the destination, not the noun.

### 2. Minor edge: grant the scope, then let the audit refuse you

```bash
cd ursa-major
npx tsx src/bin/ursa.ts consent show     /path/to/project
npx tsx src/bin/ursa.ts consent grant    /path/to/project --scope minor-aggregate
npx tsx src/bin/ursa.ts consent disclose /path/to/project --out /tmp/batch.json
```

The order inside `disclose` is fixed and worth knowing, because each
stage can stop the one after it. The projection runs, every withholding
is printed, the audit runs over the result, and a single finding means
no file is written and the exit status is 1 [E26]. There is no flag that
skips the audit, and the reason is stated where the commands are
declared: an opt-in audit is a check that gets skipped on the day it
would have mattered [E22].

The projection itself fails closed three times in a stated order. An
ungranted scope returns no batch at all. A tombstoned record contributes
nothing. A generation whose captured agent marker matches no member of
the model vocabulary contributes nothing [E5]. Each one is reported
rather than dropped quietly, and that is deliberate, because a gate that
drops data silently is indistinguishable to the user from a gate that
leaks it [E5].

If you are adding a column to this edge, the two existing string columns
are the worked examples and they point the same way. `domain` is a file
extension and nothing else, because `src/clients/northwind/pricing.ts`
names a customer, and an extension nobody anticipated degrades to
`other` rather than to a leak [E3]. `model` had to carry content of a
kind, since a per-model survival scalar is the whole of the cross-model
claim, and it was first constrained by a regular expression. A test
written an hour later put a 62-character English sentence through that
expression and it passed, so the field became an enum and the mapping
became classification rather than normalization, which is what makes it
impossible for a character of the input to ride along into the output
[E4].

The audit itself runs two checks that do not depend on each other. The
first is the closed vocabulary. The second shingles every sixteen-
character window of the records' raw text against the payload's leaf
string values, never against its key names, because key names like
`contributorCount` are the module's own source text and shingling them
would report a leak the moment anyone resolves this repository [E9].
Leaf values are joined by a run of NUL characters at least one shingle
wide, so no window can span two values and manufacture a match [E9].

Output: either a `batch.json` whose every string is one of the
thirty-four literals the two vocabularies and the two fixed strings add
up to, or an ISO date [E7], or an exit status of 1 and a list of
findings. Count them rather than reading the number off the comment
above `isPermittedString`, which says thirty-two and has said so since
the commit that introduced both vocabularies.

### 3. Publication: the manifest is the consent, so print it first

```bash
npx tsx src/bin/ursa.ts publish /path/to/project            # prints, writes nothing, exits 3
npx tsx src/bin/ursa.ts publish /path/to/project --out site --yes
```

Two invocations rather than a prompt. The reason is in the command's own
header and it generalises past this command: an interactive confirm is
unavailable on a runner with no terminal, and a prompt that falls back
to assuming yes when there is no tty is the exact shape of consent this
project refuses everywhere else [E18]. Exit 3 is not a failure, it is
the first step doing its job, which is why it is not 1 [E18].

What the first invocation prints is the whole of the consent mechanism.
`acknowledged` has no default, so no caller acquires it by omission, and
a publish called without it throws an error that carries the manifest
rather than a bare refusal [E11]. The manifest is computed before a byte
is written, which is what makes it a thing a person can act on [E13].
It is printed as prose with the numbers inline rather than as a table,
because what is being agreed to is that the publisher's own messages
become readable by anyone, and that does not survive being a row, and
it closes by saying that nothing here is aggregated, redacted or
withheld, because a published record is the record [E14].

Read three parts of it before saying yes.

- **The file paths, in full.** They are the one field in the manifest
  that is strings rather than counts, and they are there because a
  character total does not tell a person they are about to publish
  `src/clients/northwind/pricing.ts` [E13].
- **The novelty claim.** It depends entirely on the capture path. A
  git-path generation is the blob of a touched file at the agent's own
  commit, so the text is already in the repository's history, while a
  session-path generation and every prompt beside it come from a
  transcript that was never in the repository, and publishing those is
  the first time anyone can read them [E12]. A set holding both kinds
  gets both sentences rather than one, because collapsing them would
  have to pick a claim that is wrong about half the set, and the
  function exists at all because the single sentence it replaced was
  false on the only path the Action uses [E15].
- **The warnings.** A record id is the name of the directory the work
  was resolved in, and publishing turns it into a path segment in a URL
  anyone can read and a search engine can index [E17]. A slug that is not the repository's name is
  warned about and not refused, because the publisher may well have
  meant it and a refusal would be the module overruling the person whose
  data it is [E17].

Output: a static site, or exit 3 and nothing written.

### 4. Quotation: there is no gate, so you are it

This is the exit with no code behind it, and the standard that governs
it is field-level rather than pattern-level for a measured reason. A
workflow gate exists and catches three regular expressions, which covers
absolute home paths, project slugs and full session UUIDs. It does not
catch the thing that actually leaked, which was ordinary English the
owner had typed [E27].

Five classes are named, and only two of them are about the user alone.
Class A is verbatim human text, Class B machine and account identity,
Class C session identity, Class D anything credential-shaped a person
pasted into a session while working, and Class E other people, whose
work and words are in any record built over a repository with more than
one contributor and who consented to nothing [E29]. Class E is the one
a seat clearing its own work forgets, and the standard is explicit that
their presence is not the owner's to sign off [E29].

Work the field table, not your instincts. Every field that labels the
outcome ships, and every field that reproduces the work does not: the
span offsets, the span classes, the generation fates, the counts and the
whole of `stats` are safe, while `files[].text`, `files[].spans[].text`,
`generations[].text`, `conversations[].prompts[].text` and the signal
arrays are private by default [E30]. Span text is the easy one to argue
about and the easiest to drop, because it is recoverable from the
offsets, so removing it loses nothing a buyer needs [E30].

Then satisfy exactly one of four clauses, and say which: the field is
removed, the content is synthetic and the record's own provenance says
so, the owner has read that specific record and signed off on it, or it
has been consented and aggregated beyond recovery [E31]. The sign-off
clause is per record and does not generalise to the next one, and
retention is not sign-off [E31].

**Ours, and it is the step most often skipped:** if what you are quoting
came from a record that has a rendered viewer beside it, you have two
copies to clear, not one. The viewer embeds prompt text, so it is a
second full copy of the sensitive fields rather than a rendering of the
safe ones, and a viewer that redacts beside a JSON file that does not
has protected nothing, because both ship together [E28].

Output: a passage, plus a written note of which clause it went out
under.

### 5. Check the erasure state at the exit, not only at the source

Both code paths consult the tombstone list, and the reason they both do
is not redundancy.

`ursa forget` deletes the record file, strips that record's evidence
from the tuning, and tombstones the id so a later run does not rebuild
it from the git history it was derived from [E21]. In the ordinary case
a forgotten record is therefore already absent and the check at the exit
finds nothing. It is there for when the file and the tombstone disagree,
which happens with a `.ursa/` restored from a backup, a runner cache
that outlived the erasure, a record copied between clones, or a
tombstone written for a record that was never on this machine [E16].

The two exits do not carry the same risk, and the publish path says so:
the Minor edge sends counters and can be re-run, while a publication
writes a page to a public address that stays up until something replaces
it [E16]. On that path the tombstone is checked before the file is
read, so an erased record's text never enters the process on its way to
being refused [E16].

### 6. Honour a revocation as a revocation and an erasure as an erasure

These are different operations and the difference is the design, not an
implementation detail [E34].

| The user is saying | Command | What happens |
|---|---|---|
| stop disclosing anything at all | `ursa consent revoke --scope minor-aggregate` | the scope goes back to withheld [E24], and the transition is appended to the history [E19] |
| this inference about me is wrong | `ursa consent revoke-axiom --axiom ax-003` | the axiom is kept as a tombstone so a later distillation cannot revive it, and every export and overlay from then on leaves it out [E25], while a block already pasted elsewhere keeps working [E42] and any near-duplicate axiom keeps saying the same thing [E44] |
| erase this piece of my work | `ursa forget --record <id>` | the record file goes, evidence is stripped, and an axiom grounded only in this record is deleted outright rather than tombstoned [E34] |

The third row's asymmetry is the one to understand before explaining it
to anyone. A tombstone preserves the statement derived from the thing
being erased, which is the wrong answer for erasure, and the tuning
types already settle it by holding that an axiom without evidence is
invalid by construction [E34]. The consequence is intended: an axiom
that still rests on a record the user has not erased survives, because
she erased a piece of work rather than a conclusion, and revoking is how
she objects to a conclusion [E34].

Say the limit out loud rather than letting the command imply otherwise.
Revoking a scope reaches nothing already handed over, so it is a stop
and not an undo, and deletion of what was sent is a request to the
aggregation layer [E24].

Revoking an axiom has two limits of its own, and the command now prints
both rather than leaving them for a release note. The first is the
paste channel. `ursa tuning export` renders a block the user pastes
into somebody else's settings field, and revoking an axiom changes
every render from that moment on [E25] while changing nothing about the
copy already pasted, which keeps instructing that model until she
replaces it by hand [E42]. The second is the near-duplicate. An axiom written
before the store checked for duplicates can be the same rule twice
under two ids, so withdrawing one id leaves the other one working, and
both `revoke-axiom` and `consent show` now list the twins and say
plainly that nothing in the list was changed for her [E44].

Treat the first of those as permanent when you write the clause, not as
a gap waiting on a build. Enforcing a revocation across a delegated
channel requires the gateway holding the delegation to install deny
state and return a receipt saying it did, and this channel's gateway is
a text field inside software Ursa does not run and cannot enumerate, so
it can neither emit a receipt nor be listed [E43]. The same sentence
carries the way out, which is a delivery channel with a gateway Ursa
can address: a user who reads her tuning through the MCP server rather
than a block copied once does not have this limitation [E43]. Output:
the clause names which delivery channel the revocation was enforced on,
because "revoked" is true of the store and not of every copy.

### 7. Write down the clause, because the next reader cannot re-derive it

A release leaves no record of why it was allowed unless somebody writes
one. For the Minor edge the artefact is the consent file's own history,
which appends every transition with a timestamp and the action that
caused it, so nothing overwrites a prior state without leaving it behind
[E19]. For a publication it is the acknowledged manifest, which is
carried into the published index as the counts the publisher agreed to
[E13]. For a quotation there is nothing, so write the clause into the
pull request or the document beside the passage.

`ursa consent show` is the command that makes the local state readable
in one place: the state of each scope with its last five transitions,
how many records are on disk, every active inference with its evidence
count, every erasure with what it removed, and a closing sentence that
differs by whether anything may leave at all [E23].

## Judgment

**Fail closed is a reading of ambiguity, not a default value.** Consent
loading never throws. A missing file, an empty one, a truncated one, a
JSON array, a JSON null and a file whose state reads `true`, `1`,
`GRANTED` or `grant` all come back withheld, and only the literal string
`granted` grants [E20]. The argument given for it is the one to carry
into any similar decision: a corrupted file is indistinguishable from a
tampered one, and the safe reading of both is that the user has
consented to nothing [E20].

**Whitelist-by-construction is correct and is not checkable, which is a
different property.** Building a payload out of nothing but counters
already guarantees that no text crosses. It guarantees it by an argument
that only holds while somebody reads the code, and it stops being true
the first time anyone adds a field. So the audit re-derives the
guarantee from outside, over the serialized payload, knowing nothing
about how it was produced, and a check that cannot fail proves nothing,
so the suite poisons the payload once for each of the two checks [E2].
It has grown to five poisoned payloads since, the last of them the
whole record passed off as a batch, which is the failure mode that
existed before the module [E40]. That shape is worth copying
whenever a guarantee is the product rather than a property of it.

**Any constraint loose enough to admit the unknown is loose enough to
admit prose.** That sentence is the file's own, written about regular
expressions and the name of a model nobody has heard of yet [E4].
**Ours** is only that it generalises past regular expressions. The
accepted cost is that a model absent from the vocabulary is withheld
and reported, so the list is maintenance, and that is the correct
direction for the failure to point [E4]. When you are tempted by a
length-bounded pattern on a user-supplied field, the question to ask is
what the longest innocent-looking sentence that satisfies it looks like.

**The audit's definition of raw is a list, so it can be short.** Two
signal fields were outside it until 2026-10-06, and one of them,
`oneShotCorrections[].text`, is the only signal `ursa run` emits on a
label-stage record, which made the single most-produced quote in the
product the one string the disclosure audit never read [E8]. Adding a
field that carries user text and not adding it to that list is the
cheapest way to reopen this hole.

**Ours: the three exits have very different reversibility, and nobody is
told so.** A Minor batch can be re-emitted after a correction. A
quotation in a merged pull request needs history surgery. A published
page stays at its address until something overwrites it, and there is
nothing today that lists what is live or takes one record down between
publishes [E38], while a republish into a directory that persists leaves
the pages its new index no longer names, still complete and still
openable [E39]. Treat a publication as the least reversible of the
three and read the manifest accordingly.

**Ours: a disclosure that does not know something must not reassure.**
The novelty sentence is the live example. It says the git-path text is
already public, which is a property of the repository's visibility and
not of the capture path, and nothing checks the visibility [E37]. Until
that is fixed, a publisher of a private repository reads a true-sounding
sentence that is false about every character on the page, so if you are
publishing from a private repository, say so yourself rather than
letting the manifest speak for you.

**Ours: the fixture that passes is the warning, not the reassurance.**
The redaction check on the fixture record passed every mechanical class
while the record carried three Class A fields, which means a real record
of that shape would also pass and would not be safe [E32]. A green
mechanical check over a record is evidence about paths, slugs and UUIDs,
and evidence about nothing else. It is the same asymmetry
`prompts/skill-extract.md` §5j names for this library's own evidence
lock, arriving at a different boundary.

## Limits

**Zone B does not exist.** The ingest route and the `survival_stats`
table are specified and unbuilt, and `aggregate()` is the reference
implementation of the floor that route owes rather than the route
[E36]. A single device cannot enforce the floor, because it lives where
contributors are countable, and the contributor count is 1 in every row
a device emits [E36].

**The merged scalar is an approximation, and it is reported rather than
hidden.** The plan's table carries no character total, so two
contributors' scalars can only be weighted by generation count, and a
generation is not a fixed number of characters. For a trend that is
immaterial. For a scalar a lab pays against a contract it is a defect,
and the named fix is a `sample_chars` column [E35]. A second one sits
beside it: a single survival scalar collapses verbatim survival and
edited survival, which is the distinction the mutation-is-the-correction
claim rests on [E35].

**The audit proves text does not cross, not that nothing is inferable.**
No fragment of the user's writing reaches the payload. Whether a
sufficiently rich set of scalars reveals something about the person
behind them is a differential-privacy question and a different piece of
work [E36].

**The bridge is outside all three exits.** `src/bridge/index.ts` pushes
an encrypted overlay to a sync route today, end-to-end encrypted under a
passphrase the server never sees, carrying the user's own tuning to the
user's own browser. It is not an aggregation edge, it is also not gated
by the consent file, and whether it should be is an open question for
the owner [E36]. This skill does not rule on it.

**Class A has no automated check anywhere.** The standard says so in its
own limits, and it gives a field list instead so that a seat about to
quote a record can see which fields are dangerous without rediscovering
the incident that made them dangerous [E41]. Everything in step 4 is a
person's judgment, and that is the design rather than a gap waiting on
a tool.

**The local files have no outbound edge at all, and that is the claim to
defend.** The records, the tuning and the consent file are named in the
design as having none, with exactly one edge crossing the wall [E33].
Any change that gives one of them a second reader outside the device is
a change to the load-bearing constraint, not a feature.

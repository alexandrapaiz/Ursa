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

Redaction happens before a record enters any of these, not at the point
of rendering. A viewer that redacts and a JSON file that does not has
protected nothing, because both ship together.

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

**Class D, credentials.** Anything credential shaped that a person
pasted into a session while working. A record is built from whatever
was in the conversation, so a pasted key becomes a field in the record.
Never printed, never quoted, and rotation is the owner's call. The
security charter's own rule applies to records too.

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

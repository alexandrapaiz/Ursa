---
name: distilling-a-tuning-record
description: >
  Use when an outcome record is about to be turned into tuning axioms,
  or when an axiom or an exported tuning block is about to be trusted,
  edited, revoked, pasted into a model, or shown to anyone. Fires for
  running the distill pass over a record, for deciding whether an
  axiom's evidence really grounds it, for reading the confidence count
  on a rule, for choosing which tuning store a record accrues into,
  and for deciding what may leave the machine with a tuning block.
  Does not fire for producing an outcome record, for settling the
  label on an individual span, or for quoting a statistic out of a
  record.
version: 0.2.0
status: draft
validated: false
owner_seat: skill
created: 2026-10-05
revised: 2026-10-08
evidence_scheme: repo
evidence:
  - ref: E1
    what: the division of labor, the model infers the why and the code does all arithmetic, and an axiom without evidence pointers is invalid by construction
    source: ursa-major/src/tuning/types.ts:4-8
  - ref: E2
    what: the privacy invariants, distillation runs on the user's machine, the tuning record never reaches an aggregation layer, and revocation survives re-distills
    source: ursa-major/src/tuning/types.ts:10-12
  - ref: E3
    what: the evidence shape, a record id, one of six signal kinds, a ref, step ordinals, and an optional verbatim quote of the user's own words
    source: ursa-major/src/tuning/types.ts:14-30
  - ref: E4
    what: evidenceCount is code-owned and documented as independent evidence entries, with recurrence across records named as the confidence signal
    source: ursa-major/src/tuning/types.ts:42-46
  - ref: E5
    what: contradictions are surfaced and never averaged, and revoked axioms are kept as tombstones
    source: ursa-major/src/tuning/types.ts:48,52-53
  - ref: E6
    what: the distiller refuses a record with no signals block
    source: ursa-major/src/tuning/distill.ts:20-22
  - ref: E7
    what: the prompt's rules for the model, cite the evidence, prefer the general why, basis definitions, match an existing axiom rather than reword it, never resurrect a revoked one, emit both sides of a genuine conflict, three to twelve axioms
    source: ursa-major/src/tuning/distill.ts:46-58
  - ref: E8
    what: the prompt's acceptance rule, accepted false means survived text is not endorsed and axioms come from the corrections, null means survival is weak evidence at most
    source: ursa-major/src/tuning/distill.ts:59-65
  - ref: E9
    what: the prompt carries the user's verbatim prompts, read off conversations[].prompts
    source: ursa-major/src/tuning/distill.ts:31-33,86
  - ref: E10
    what: validation is shape only, a statement, a legal polarity and basis, a non-empty evidence array, a known kind, and steps being an array
    source: ursa-major/src/tuning/distill.ts:103-113
  - ref: E11
    what: the default runner is the local Claude Code CLI in print mode with the prompt on stdin
    source: ursa-major/src/tuning/distill.ts:121-133
  - ref: E12
    what: merge sets evidenceCount to the length of the axiom's evidence array, both when it creates and when it reinforces
    source: ursa-major/src/tuning/merge.ts:51-52,62
  - ref: E13
    what: a matched revoked axiom gains nothing, and a user-edited statement is sovereign so only evidence accrues to it
    source: ursa-major/src/tuning/merge.ts:46-53
  - ref: E14
    what: contradictions among axioms new in one pass are resolved through a map keyed by statement text, then wired symmetrically
    source: ursa-major/src/tuning/merge.ts:36-37,75-89
  - ref: E15
    what: distill, merge and write happen in one invocation, and the only double-distill guard is a task-id lookup in sources
    source: ursa-major/src/tuning/cli.ts:32-41
  - ref: E16
    what: the console line derives new and reinforced from axiom-count arithmetic rather than from what merge did
    source: ursa-major/src/tuning/cli.ts:42-46
  - ref: E17
    what: the exported block tells its reader that confidence is independent evidence count and to follow high-confidence rules from the first message
    source: ursa-major/src/tuning/export.ts:17-25
  - ref: E18
    what: export drops revoked axioms, groups by domain, orders by evidenceCount, and lists tensions with an ask-do-not-guess instruction
    source: ursa-major/src/tuning/export.ts:9-15,27-50
  - ref: E19
    what: a commit-pair record has no chat trace, so loops, translations, regressions and guardrails come back empty and only one-shot corrections are emitted
    source: ursa-major/src/signals.ts:1-7,95-121
  - ref: E20
    what: a one-shot correction's domain field is the file path, and its text is an agent-against-final excerpt pair
    source: ursa-major/src/signals.ts:74-77
  - ref: E21
    what: the undeclared default says in its own words that retention is not acceptance, and null means no declaration surface was offered
    source: ursa-major/src/signals.ts:30-39
  - ref: E22
    what: ursa run builds one git-adapter conversation per commit pair with userTurns zero and no prompts array
    source: ursa-major/src/resolve-episode.ts:161,179-187
  - ref: E23
    what: prompts are populated only by the session and paste parsers, and the schema calls them raw data that stays local
    source: ursa-major/src/parse.ts:51,107, ursa-major/src/types.ts:338-339
  - ref: E24
    what: an episode id is the project slug, the generated commit date, and the first seven characters of the generated commit sha
    source: ursa-major/src/episodes.ts:60-64
  - ref: E25
    what: the designed distillation watermark, a distilled flag on each episode and an isDistilled lookup against it
    source: ursa-major/src/episodes.ts:27,74, ursa-major/src/store.ts:35-37
  - ref: E26
    what: records, the episode index and the distillation watermark live in a per-project .ursa directory, nothing global and nothing commingled
    source: ursa-major/src/store.ts:1-3,10-20
  - ref: E27
    what: the per-project decision, and its rider that cross-project aggregation should be an explicit later command rather than an implicit default
    source: docs/design/product-plan.md:91-96
  - ref: E28
    what: the design doc's interpretation and store layers, confidence is evidence count, axioms compound across records, tensions are surfaced never averaged, revocation survives
    source: docs/design/tuning-pipeline.md:15-27
  - ref: E29
    what: the design doc's open questions, cross-model capture adapters, whether an exported block actually reduces correction loops, and the redaction interaction
    source: docs/design/tuning-pipeline.md:60-69
  - ref: E30
    what: today's correction signals are hand annotations, and KR1.2 is what retires manual annotation
    source: docs/design/tuning-pipeline.md:51-58, docs/okrs/2026-q4.md, O1 KR1.2
  - ref: E31
    what: the bridge reads the project's own tuning.json, drops revoked axioms, and pushes only ciphertext to the sync route
    source: ursa-major/src/bridge/index.ts:82-98,140-148
  - ref: E32
    what: this repository ignores .ursa with the comment that it is raw data and never committed
    source: .gitignore:8-9
  - ref: E33
    what: acceptance is never inferred from retention, only the owner's declaration counts, and the two trials so far were owner-declared unsatisfied
    source: CLAUDE.md, section 0
  - ref: E34
    what: tacit intelligence, much of what people know cannot be stated as rules and shows up only in action on a particular case
    source: docs/vision.md, section 0b, principle 3
  - ref: E35
    what: pretence of intelligence, systems built on claims of sufficient information conform to the measure rather than the world
    source: docs/vision.md, section 0b, principle 4
  - ref: E36
    what: Ursa Major's product mission, import your tuning into every model
    source: docs/vision.md, section 1
  - ref: E37
    what: the tuning test's only fixture declares the episode accepted with an acceptance basis of retention
    source: ursa-major/src/tuning/tuning.test.ts:18-26
  - ref: E38
    what: both sides of a one-shot correction are read from the extents the record already stores rather than rebuilt from the diff, because a rebuild had been shipping reconstructed text as a verbatim quote
    source: ursa-major/src/signals.ts:49-63
supersedes: []
---

# Distilling a tuning record from an outcome record

## When this fires

A record exists, and the question is now what it means about the user
rather than what happened to the text. That is the situation. Typical
shapes: running `tuning/cli.ts distill` over a record under
`<project>/.ursa/records/`, reading `tuning.json` to decide whether an
axiom has earned its confidence count, editing or revoking an axiom,
exporting `tuning.md` to paste into another model, or looking at the
tuning lines the overlay shows and deciding whether they are fit to be
seen.

It fires hardest the first time a record is distilled into a store that
already holds axioms, because that is the moment confidence changes and
confidence is the one field in the whole artifact that a reader is told
to act on from the first message [E17].

It does not fire for producing a record, for settling a span label, or
for quoting a record statistic. Those are the three skills in the
record area, and all three end where this one begins: they work on
`outcome_record.json`, and this one works on `tuning.json`.

What this serves is the Ursa Major half of the mission, importing your
tuning into every model [E36]. The export is the only artifact in the
repository that a user hands to a different vendor's model, so it is
the one place where a wrong axiom gets repeated back to the user by
something that sounds authoritative.

## The procedure

**1. Confirm the record carries signals, and read the method.** The
distiller reads `record.signals` and refuses a record without it [E6].
Then read `signals.method`. Today's correction signals on the trial
records are hand annotations, and KR1.2 is the key result that retires
that method [E30]. Output: the method string, written down next to
whatever you later claim the axioms rest on.

**2. Work out which signal kinds can be non-empty, from the capture
path.** This is upstream of everything else. A record built from git
commit pairs has no chat trace, so correction loops, feedback
translations, regressions and defensive guardrails all come back as
empty arrays, and the only populated signal is one-shot corrections
derived from mutated spans [E19]. Six evidence kinds exist in the
schema [E3]. On a commit-pair record only two of them can honestly
appear. Output: the list of kinds the model will actually see, which is
also the list of kinds its evidence is allowed to cite.

**3. Check whether the record carries the user's words at all.** The
prompt block includes the user's verbatim prompts, read off
`conversations[].prompts` [E9]. That array is populated only by the
session and paste parsers [E23]. The `ursa run` path builds its
conversation from a commit pair with `userTurns` zero and no prompts
at all [E22]. Output: a ruling on which `basis` values this record can
support. On a record with no prompts, `stated` is unsupportable by
construction, every `quote` field should be absent, and an axiom
claiming either is a fabrication rather than a judgment call.

**4. Read the episode verdict before you trust anything that
survived.** The prompt already encodes the rule: `accepted` false means
text that survived unedited is not endorsed and the axioms must come
from the corrections, and null means survival is weak evidence at most
[E8]. The undeclared default says in its own words that retention is
not acceptance [E21], and the company rule is that acceptance is never
inferred from retention [E33]. Output: one sentence naming
`episode.accepted`, `acceptanceBasis`, and what the record is therefore
allowed to teach.

**5. Choose the tuning store deliberately, and keep choosing the same
one.** `--tuning` is a path like any other, and storage is per-project
by decision, with cross-project aggregation named as an explicit later
command rather than an implicit default [E26, E27]. The overlay reads
the project's own `.ursa/tuning.json` and nothing else [E31]. Output:
the store path, recorded somewhere outside your shell history, because
the confidence numbers in step 8 mean nothing except relative to one
store.

**6. Make the step reversible before you run it, then run it.** One
invocation distills, merges and writes, so by the time you see any
axiom the arithmetic is already in the file [E15]. Copy the store
first, so the pass can be read as a diff rather than as a result.

```
cd ursa-major
cp <project>/.ursa/tuning.json /tmp/tuning.before.json   # if it exists
npx tsx src/tuning/cli.ts distill \
  --record <project>/.ursa/records/<episode-id>.json \
  --tuning <project>/.ursa/tuning.json --model sonnet
diff <(jq -S . /tmp/tuning.before.json) <(jq -S . <project>/.ursa/tuning.json)
```

Output: the diff. Read the diff and not the console line. The console
reports new and reinforced from axiom-count arithmetic, so an axiom
the merge silently dropped for matching a revoked one is counted as
reinforced [E16, E13].

**7. Join every piece of evidence back to a real step.** Validation is
shape only. It checks that a statement exists, that polarity and basis
are legal strings, that the evidence array is non-empty, that each kind
is one of the six, and that `steps` is an array [E10]. It never checks
that a `ref` or a step ordinal occurs anywhere in the record. The
schema's own standard is higher than that, since an axiom whose
evidence pointers do not join back to the record's steps is invalid by
construction [E1]. So do the join by hand, per axiom, against the
signal the evidence names. Output: a list of axioms whose evidence does
not join, which are revoked rather than edited.

**8. Convert confidence into a record count before quoting it.**
`evidenceCount` is the length of the evidence array [E12], and the
schema's own comment describes it as independent evidence entries whose
confidence signal is recurrence across records [E4]. Those are two
different quantities whenever one record supplies more than one
evidence entry for one axiom, which is the ordinary case on a
commit-pair record, where every mutated span is its own one-shot
correction [E19, E20]. Ours, measured in this repository: one axiom
carrying three one-shot corrections from a single record exports as
`x3`, and a re-resolve of the same work under a different episode id
reinforces that axiom to `x2` with both ids listed in `sources`.
Reproduce both, and the duplicate case in step 9, with:

```
cd ursa-major && npm install >/dev/null 2>&1 && cat > probe.ts <<'EOF'
import { emptyTuning, mergeDistill } from './src/tuning/merge'
import { renderTuningBlock } from './src/tuning/export'
const rec = (id: string) => ({ task: { id }, signals: {} }) as any
const ax = (statement: string, extra: any = {}) => ({
  statement, domain: 'copy', polarity: 'avoid', basis: 'tacit',
  matchesExisting: null, contradicts: [],
  evidence: [{ kind: 'one-shot-correction', ref: 's1', steps: [1] }], ...extra })
const a = mergeDistill(emptyTuning('local'), { axioms: [{ ...ax('Keep prose plain'),
  evidence: [1, 2, 3].map((n) => ({ kind: 'one-shot-correction', ref: `s${n}`, steps: [n] })) }] },
  rec('task-001'), 'sonnet')
console.log('A', a.axioms[0].evidenceCount, 'entries from',
  new Set(a.axioms[0].evidence.map((e: any) => e.recordId)).size, 'record(s):',
  renderTuningBlock(a).split('\n').filter((l) => l.startsWith('- '))[0])
let b = mergeDistill(emptyTuning('local'), { axioms: [ax('Keep prose plain')] }, rec('task-001'), 'sonnet')
b = mergeDistill(b, { axioms: [ax('Keep prose plain', { matchesExisting: 'ax-001' })] }, rec('task-001-rerun'), 'sonnet')
console.log('B', b.axioms[0].evidenceCount, 'entries from', b.sources.map((s: any) => s.recordId).join(','))
const c = mergeDistill(emptyTuning('local'),
  { axioms: [ax('X'), ax('X'), ax('Y', { contradicts: ['X'] })] }, rec('r1'), 'sonnet')
console.log('C', c.axioms.map((x: any) => `${x.id}="${x.statement}" contradicts=[${x.contradicts}]`).join(' | '))
EOF
npx tsx probe.ts; rm probe.ts
```

Output: every confidence figure restated as "n entries from m records".
Only m justifies the word recurrence, and only m is what the design doc
means when it says axioms compound across records [E28].

**9. Check the tensions, and check for duplicates.** Contradictions
among axioms new in the same pass are resolved through a map keyed by
statement text and then wired symmetrically [E14]. Two new axioms that
share a statement therefore collide in that map. Ours, measured by case C of
the probe in step 8, three axioms stating `X`, `X` and `Y` where `Y`
contradicts `X`: the store ends up holding `ax-001` and `ax-002` both stating `X`,
with only `ax-002` carrying the tension, so the export prints the same
rule twice and flags one copy. Output: duplicate statements merged by
hand into one axiom, and a check that every tension is reciprocal,
because the artifact's promise is that conflicts are surfaced and never
averaged [E5, E18].

**10. Decide separately what may leave the machine.** Three different
exits exist and they carry different things. `tuning.json` holds the
verbatim quotes [E3], and the invariant is that it stays with the user
and never reaches an aggregation layer [E2]. The rendered block drops
revoked axioms and carries statements, basis, counts and tensions [E18].
The overlay payload drops revoked axioms too and goes out as ciphertext
[E31]. Output: for each exit you are about to use, the sentence that
says what is in it. The redaction interaction is an open question in
the design doc rather than a settled standard [E29], so this step ends
in a judgment and not in a check.

## Judgment

**The store is raw data sitting inside somebody's git repository.**
Records, the episode index and `tuning.json` all live in
`<project>/.ursa/` [E26]. This repository ignores that directory and
says why in the comment, raw data, never committed [E32]. A user's own
project has no such line until they write it, and nothing in the run
path writes it for them. Ours: treat `.ursa/` as uncommitted until you
have read the target project's `.gitignore` with your own eyes. The
failure is not hypothetical in this company. The security seat's first
finding was verbatim owner prompts and local paths already public in
this repository, and the quotes in a tuning record are the same
material one derivation downstream.

**Confidence is the field most likely to be believed and least likely
to be checked.** It is a single integer, it is sorted on in both the
export and the overlay [E18, E31], and the block the user pastes into
another model tells that model to follow high-confidence rules from the
first message [E17]. Everything else in the artifact invites a reader
to judge. That number invites a reader to comply. Our own fourth
principle is the warning: a system built on a claim of sufficient
information starts conforming to the measure rather than to the world
[E35]. Ours: never let a count stand in a sentence without the record
count beside it, and treat any axiom whose evidence all comes from one
record as a hypothesis, whatever the integer says.

**Idempotence is thinner than it looks, and a rebase defeats it.** The
guard is a lookup of `record.task.id` in `tuning.sources` [E15], and a
record's id is the episode id, which is built from the first seven
characters of the generated commit sha [E24]. Re-running `ursa run` on
unchanged history reproduces the same ids and the guard holds. Rewriting
that history, with a rebase, an amend or a squash, produces new shas,
new episode ids, and a record of the same work that the guard does not
recognise, so every axiom it touches gains evidence a second time. The
watermark the design intended for this, a `distilled` flag on each
episode with an `isDistilled` lookup against it, exists in the code and
is never set to true by anything [E25]. Ours: before distilling, check
`sources` for a record covering the same commits rather than the same
id, and if the project's history has been rewritten since the last
distill, start a new store rather than reconciling the old one.

**An axiom is a claim about a person, and the record is a claim about
text.** The prompt asks the model for the general why rather than the
incident, which is the right instruction and also the whole risk [E7].
On a commit-pair record the only evidence is a pair of excerpts showing
what the agent wrote and what the user left behind, tagged with a file
path as its domain [E20]. Both sides of that pair are now read from the
extents the record already stores rather than rebuilt from the diff,
after a rebuild was found returning text with a space the agent never
wrote and presenting it as a verbatim quote [E38]. Treat that as the
standard the whole distillation is held to, since a quote is the only
part of a tuning block a user can check against their own memory. One
such edit supports an axiom about that edit. It does not support an axiom about how the user likes prose. Our
third principle is why the generalisation is worth attempting at all,
since what people know shows up only in action on a particular case
[E34]. The same principle is why the inference has to stay close to the
action it came from. Ours: an axiom whose statement is broader than the
union of its evidence gets narrowed to the evidence or revoked, and the
narrower statement is usually the more useful one anyway.

**Prefer revoking to rewriting, and know what each one does.** A
revoked axiom is a tombstone, is skipped on every later match, and gains
nothing [E5, E13]. An edited axiom keeps accruing evidence while its
statement stays sovereign against the model [E13]. So revocation is the
right move when the inference was wrong, and editing is the right move
when the inference was right and the wording was not. Ours: revocation
is only as strong as the model's compliance, because the prompt asks it
not to resurrect a revoked axiom [E7] and nothing in the merge compares
a new statement against the tombstones. Re-read the tombstones after
any pass that produced new axioms.

**Distillation is local, and local is not the same as private.** The
runner shells out to the Claude Code CLI in print mode with the whole
prompt on stdin [E11], and that prompt contains the user's verbatim
words when the record has them [E9]. The invariant the design commits
to is that the tuning store never reaches an aggregation layer [E2],
which it does not. A reader who hears "runs on your machine" and
concludes that nothing was sent anywhere has still misread it. Ours:
say which model saw the prompt whenever you report what a distill pass
produced, and do not distill a record you would not be willing to
publish, since the redaction standard that would govern this is not
written yet [E29].

**One store per project is the decision, so plan the arithmetic around
it.** Cross-project aggregation is explicitly a later command [E27],
which means recurrence across records is bounded by one project today
and an axiom confirmed in three projects reads as three single-evidence
hypotheses rather than one confident rule. Ours: that is a cost of a
decision rather than a defect, and the way to live with it is to name
the project whenever you quote a confidence count.

## Limits

- Nothing here measures whether an exported tuning block actually
  improves a later session. The design doc lists that as an open
  question and calls it the product's own outcome record [E29]. Until
  it is answered, every claim in this skill is about whether an axiom
  is grounded, not about whether it works.
- The only capture path with a chat trace today is the session and
  paste parsers [E23]. Cross-model capture adapters are unbuilt and
  listed as an open question [E29], so this skill says nothing about
  distilling from a ChatGPT export or any other vendor's log.
- Auto-detected correction loops are not shipped. Signals on the trial
  records are hand annotations [E30], so a reader cannot yet distinguish
  an axiom grounded in a loop the resolver found from one grounded in a
  loop a person wrote down.
- The skill does not judge statement quality, model choice, or the
  three-to-twelve axiom budget the prompt sets [E7]. Those are
  calibration questions and the repository holds no evidence on them.
- The evidence here is this repository at the dates in the
  frontmatter, under `evidence_scheme: repo`. No claim is made about how
  any lab ingests a preference artifact, and the test fixture that
  declares an episode accepted on a basis of retention [E37] is a
  defect in the fixture rather than a counter-example to step 4.

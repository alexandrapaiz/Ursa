---
name: auditing-a-detected-correction-loop
description: >
  Use when a record's signals block has already been produced and
  someone has to decide what its trajectory entries actually say: a
  correction loop with its theme, recurrence count and resolution, a
  regression event, a one-shot correction. Fires for auditing a
  detected loop against the prompts behind it, for deciding whether two
  themes are one loop the detector split or two the user really raised,
  for reading `recurrences`, `openedStep`, `closedStep` or `resolution`
  as what the code computes rather than what the field is called, for
  working out why a complaint the user clearly made appears in no
  signal at all, for judging whether a regression the detector emitted
  or omitted is real, for checking that acceptance has not been read
  off the chat, and for validating the detector's output against hand
  annotation under KR1.2. Does not fire for producing a record or
  choosing what work to resolve, for the class on any individual span,
  for writing a signal number into a document a reader will trust, for
  turning signals into axioms about the user, for adding or changing a
  rule in the record gate, or for deciding what may leave the machine.
version: 0.1.0
status: draft
validated: false
owner_seat: skill
created: 2026-10-24
revised: 2026-10-24
evidence_scheme: repo
evidence:
  - ref: E1
    what: signal derivation has one entry point and two stages, decided by whether the record carries a chat trace
    source: ursa-major/src/signals.ts:1-14
  - ref: E2
    what: hasChatTrace is the discriminator, true when at least one conversation carried the user's own messages
    source: ursa-major/src/loops.ts:98-101
  - ref: E3
    what: the label-stage branch emits no loops and no regressions, and says recurrence is unobservable without the trace
    source: ursa-major/src/signals.ts:130-139
  - ref: E4
    what: label-stage corrections are the spans the user kept but edited, one entry per edit
    source: ursa-major/src/signals.ts:41-46
  - ref: E5
    what: the detector is lexical and deterministic so that no entry is emitted which a reader cannot re-derive from the prompt text, the two thresholds and the cue lists
    source: ursa-major/src/loops.ts:11-13
  - ref: E6
    what: the two clustering thresholds, 0.34 of the smaller term set and at least 2 distinct shared terms
    source: ursa-major/src/loops.ts:27-31
  - ref: E7
    what: content terms drop stopwords, tokens under three characters, bare digits and repeats
    source: ursa-major/src/loops.ts:103-112
  - ref: E8
    what: single-linkage clustering, where a correction joins the cluster it scores best against and opens its own when it matches none
    source: ursa-major/src/loops.ts:151-161,224-238
  - ref: E9
    what: the opening task ask is prepended to a theme it shares terms with, so the loop reports the ask's step as openedStep rather than the first complaint's
    source: ursa-major/src/loops.ts:240-253, docs/design/trace-stage-loops.md:113-117
  - ref: E10
    what: recurrences is computed as promptSteps.length minus one
    source: ursa-major/src/loops.ts:323-325
  - ref: E11
    what: recurrences is documented as the repetitions after the initial ask, the failure count, and a one-length promptSteps is documented as a one-shot rather than a loop
    source: ursa-major/src/types.ts:693-696
  - ref: E12
    what: the answering window runs from the theme's last prompt up to the next correction, and closedStep is the earliest generation in it with surviving characters
    source: ursa-major/src/loops.ts:262-270
  - ref: E13
    what: the four resolutions and the branch that picks each, with accepted requiring an acceptance prompt at or after closedStep and no later than the next correction
    source: ursa-major/src/loops.ts:288-296, ursa-major/src/types.ts:700-701
  - ref: E14
    what: a one-member theme becomes a one-shot correction, and one that no surviving generation answered is only a counter in notes
    source: ursa-major/src/loops.ts:272-285,350-354
  - ref: E15
    what: a regression member needs the cue, a position after its theme's first member, and the correction role, and brokenState names the prior member's step
    source: ursa-major/src/loops.ts:298-315
  - ref: E16
    what: the regression signal is documented as prompts reporting previously-accepted state broken, in the comment over CorrectionLoop.regressionSteps, while RegressionEvent itself carries the step the user reported it at, an uncommented brokenState string and her verbatim words
    source: ursa-major/src/types.ts:697-698,729-736
  - ref: E17
    what: the regression cue vocabulary, written to separate a previously-working state reported broken from "it was never right yet"
    source: ursa-major/src/loops.ts:64-66
  - ref: E18
    what: acceptanceStatedInChat is an observation about the conversation and never a verdict on the work, and episode.accepted comes only from the owner's declaration
    source: ursa-major/src/signals.ts:21-24, ursa-major/src/loops.ts:90-92
  - ref: E19
    what: the undeclared default states that retention is not acceptance
    source: ursa-major/src/signals.ts:36-39
  - ref: E20
    what: feedbackTranslations and repairAttempts are deliberately left empty because naming the mechanism behind a complaint is the distiller's judgment and not the detector's
    source: ursa-major/src/loops.ts:14-18, ursa-major/src/signals.ts:16-19
  - ref: E21
    what: discoveredSpec quotes rather than writes prose, takes the loop's last non-regression statement, and leaves every other statement addressable by step
    source: ursa-major/src/loops.ts:375-404
  - ref: E22
    what: every signal excerpt is addressed as data precisely enough that the gate re-reads it and asserts the quote is really there
    source: ursa-major/src/types.ts:646-657
  - ref: E23
    what: episode.steps is the generation count at the label stage and the highest step observed across generations and prompts at the trace stage
    source: ursa-major/src/signals.ts:115,146, ursa-major/src/loops.ts:205-209
  - ref: E24
    what: lexical themes miss synonyms, so recurrences is a floor rather than an exact count
    source: docs/design/trace-stage-loops.md:349-355
  - ref: E25
    what: a bridging prompt joins the better-scoring cluster and the other stays separate, reported rather than fixed
    source: docs/design/trace-stage-loops.md:356-361
  - ref: E26
    what: closure rests on survival, which is retention, and is never promoted to episode.accepted
    source: docs/design/trace-stage-loops.md:362-370
  - ref: E27
    what: two consecutive user messages share a step ordinal and the loop's promptSteps shows the same number twice
    source: docs/design/trace-stage-loops.md:371-374
  - ref: E28
    what: KR1.2's done condition names four hand-annotated loops and three regression steps on task-001, and that validation cannot run in this repository
    source: docs/okrs/2026-q4.md:20-26, docs/design/trace-stage-loops.md:377-391
  - ref: E29
    what: corrections that recurred and the point where the goal shifted are named as the trajectory metadata wrapped around the record
    source: CLAUDE.md:72-77
  - ref: E30
    what: clustering runs inside one conversation at a time, and step ordinals are per-conversation
    source: ursa-major/src/loops.ts:217-221, ursa-major/src/types.ts:687-688
  - ref: E31
    what: a prompt matching an acceptance cue whose remaining content comes to at most one term is typed as an acceptance, which the comment above calls a prompt made entirely of acceptance words, and only corrections are clustered
    source: ursa-major/src/loops.ts:55-62,114-120,221
  - ref: E32
    what: task-001's discoveredSpec fields were hand-written factorizations, and loop C closed tacitly at steps 757 to 758 with acceptanceStatedInChat false
    source: docs/beyond-preference-pairs.md:90-96,100-109
---

## When this fires

A record exists, `deriveSignals` has run over it, and the question is
what the resulting trajectory entries mean. That is a different
question from what any span is labelled, from what the record's
percentages are a share of, and from what the record implies about the
user. It is the question a reader faces when the signals block says
one loop with two recurrences and the conversation plainly shows three
complaints.

Three shapes bring it up. **An audit**: a loop is in front of you and
you have to decide whether it is the loop the user actually ran.
**A gap**: a complaint you can read in the transcript appears in no
signal, and you need to know where it went. **A validation**: KR1.2
asks whether the detector recovers hand-annotated loops, and that
comparison is only meaningful once both sides are read as what they
compute [E28].

The reason it needs a skill rather than a glance is that four of the
fields carry names from the hand-annotation era and compute something
narrower than the name. `recurrences` is called the failure count
[E11]. `resolution: 'accepted'` is called accepted. `regressionSteps` is called prompts
reporting previously-accepted state broken [E16]. Each is defensible as code
and each is read wrongly by default, and these are the entries Ursa
Minor sells as the trajectory wrapped around the record [E29].

## The procedure

**1. Establish the stage before reading any loop.** One entry point,
two stages, and the discriminator is whether any conversation carried
the user's own messages [E1, E2]. On the label stage the loop array is
empty as a matter of construction, not as a finding: the branch returns
early with a note saying recurrence is unobservable without the trace
[E3], and the only correction signal is one entry per span the user
kept but edited [E4]. Output: the stage, named, and on the label stage
the audit stops here, because an empty `correctionLoops` is evidence
about the capture path and about nothing else.

**2. Re-derive the theme from the prompts, not from the label.** The
theme string is the three commonest content terms across the cluster's
members, and membership required 0.34 overlap of the smaller term set
plus at least two distinct shared terms [E6], over terms with
stopwords, sub-three-character tokens and bare digits removed [E7].
Only corrections are clustered, and a prompt is typed as an acceptance,
never reaching a cluster, when it matches an acceptance cue and has at
most one content term left after the acceptance words are removed
[E31]. The comment calls that a prompt made entirely of acceptance
words; the implementation allows one more term than that, so a short
complaint attached to praise can be typed as acceptance. Read the member prompts and ask whether a person would call them
one theme. Output: the member steps, and for each, the terms it
actually shared.

**3. Look for the theme the detector split.** Clustering is
single-linkage and a correction that matches no existing cluster opens
its own [E8]. Lexical terms carry no stemming, which the design
document names as a failure mode and whose consequence it states
plainly: `recurrences` is a floor and not an exact count [E24]. A
prompt matching two clusters joins the better-scoring one and does not
merge them [E25]. Where a split restatement lands is worth knowing
before you look for it: a one-member theme becomes a one-shot
correction, and one that no surviving generation answered is not
emitted at all but counted in `notes` [E14]. Output: every
single-member theme in the same conversation, plus the unresolved
counter in `notes`, checked by eye against the live loops.

**Ours:** a split restatement does not merely go uncounted, it can
leave the signals entirely. In probe 2 of
`probe-recurrences.ts`, one theme stated three times in three
inflections produces a loop of two prompts and a third prompt that is
neither a loop member nor an emitted one-shot correction: it survives
only as the sentence "1 single correction(s) were raised and answered
by no surviving generation" in `notes[]`. Reproduce from
`ursa-major/` with:

```
npx tsx ../skills/auditing-a-detected-correction-loop/probe-recurrences.ts
```

**4. Read `recurrences` against `openedStep`, never alone.** It is
`promptSteps.length - 1` [E10] and is documented as the repetitions
after the initial ask [E11]. Whether the initial ask is in
`promptSteps` depends on step 3 of the detection: the opening task ask
is prepended only if it shares a theme with the cluster [E9]. So
compare `openedStep` to the conversation's first prompt step. If they
differ, the ask is absent from the loop and `recurrences` is the
correction count minus one. If they match, `recurrences` is the
correction count. Output: the correction count, stated as a count of
complaints, with `recurrences` and `openedStep` both quoted beside it.

**Ours:** the two readings differ on identical user behaviour. Probe 1
holds three complaints on one theme fixed and varies only the opening
ask: off-theme it reports `openedStep: 1, recurrences: 2`, and
restating the theme it reports `openedStep: 0, recurrences: 3`. Same
three complaints, two different failure counts. Same command as above.

**5. Read `resolution` as the window it was computed over.** The
answering window runs from the theme's last prompt to the next
correction, and `closedStep` is the earliest generation inside it with
any surviving characters [E12]. `accepted` requires an acceptance
prompt landing at or after `closedStep` and no later than the next
correction, which is narrower than the answering window; without one a
closed loop is `accepted_tacitly`; with no closing generation the loop
is `abandoned` if the window held generations at all and `open` if it
did not [E13].
The design document states what the tacit case rests on: survival,
which is retention [E26]. Output: which of the four, and the window's
step bounds, so a reader can see what was and was not inside it.

**6. Treat an absent regression as unproven, not as absent.** A
regression member needs the cue, the correction role, and a position
after its theme's first member, and the emitted `brokenState` names
that prior member's step as where the theme was already raised [E15].
The cue vocabulary exists to separate a previously-working state
reported broken from a thing that was never right yet [E17], and the
schema calls these prompts reports of previously-accepted state broken
in the comment over `CorrectionLoop.regressionSteps`, while
`brokenState` on the event itself carries no comment at all [E16]. Output: every prompt in the conversation carrying a
regression cue, listed beside the emitted `regressionSteps`, and any
difference explained.

**Ours:** the gate in step 6 moves with the same accident as step 4.
Probe 3 puts a regression cue on a theme's first complaint. With the
opening ask off-theme, `regressions` is empty. With the ask restating
the theme, the same complaint is emitted as a regression whose
`brokenState` reads `theme "..." was already raised at step 0 and is
reported broken again here` — step 0 being the original task ask.
Same command as above.

**7. Check that acceptance was not read off the chat.**
`acceptanceStatedInChat` is an observation about the conversation and
never a verdict on the work, and `episode.accepted` comes only from
the owner's declaration [E18]; the undeclared default says in its own
words that retention is not acceptance [E19]. Output: the three values
quoted separately, and no sentence that moves a conclusion from the
first to the second.

**8. Confirm the two empty arrays are still empty.**
`feedbackTranslations` and `repairAttempts` are left empty on purpose,
because naming the mechanism behind a complaint or the strategy behind
a repair is a judgment the detector does not make [E20]. An entry in
either one in a record whose `method` is `auto-detected` means
something other than this detector wrote it. Output: both lengths, and
the `method` value beside them.

**9. Audit `discoveredSpec` as a quotation.** It quotes rather than
writes prose: the loop's last statement of what was wanted, regression
reports excluded, with the loop's other statements left addressable by
step rather than merged away [E21]. Every excerpt in a signal is
addressed precisely enough for the gate to re-read it and assert the
quote is really there [E22]. Output: the step the spec was quoted
from, and whether the excluded statements change what a reader would
take the spec to be.

**10. Do not carry a step count across stages.** `episode.steps` is
the generation count on the label stage and the highest step observed
across generations and prompts on the trace stage [E23]. These are two
quantities under one name. Output: the stage, beside any step figure,
or the figure is not carried.

## Judgment

**The fields are honest about the computation and not about the
name.** Every one of the four readings above is visible in the code and
none of them is hidden; what is missing is a sentence anywhere saying
that the name overstates it. The design document's own failure-mode
list is the right model for this and already does it for three cases,
including stating that `recurrences` is a floor [E24]. The two
accidents measured in probes 1 and 3 belong on that list and are not
on it, which is why they are reported here as ours and routed to the
engineer in `docs/ideas.md` rather than fixed from this seat.

**Why the ask-joins-theme accident is worse than a rounding error.**
It is not that the count is approximate. `recurrences` being a floor is
already stated and a reader can discount a floor [E24]. The accident is
that the quantity changes identity: when the ask joins, the field counts
complaints, and when it does not, it counts complaints after the first.
A floor can be compared across records. A quantity whose definition
turns on whether the user happened to use two of the same content words
in her opening message cannot, and comparison across records is the
whole of what makes a corpus worth more than a record.

**The regression case is wrong in both directions, which is the tell.**
Off-theme, a user's own report that something she had working came back
broken is dropped silently. On-theme, the emitted `brokenState` asserts
the theme was already raised at the step of the task ask, and the ask is
the message the design document calls the spec rather than a failure
signal [E9]. So the same gate under-reports a real regression and
over-reports the establishment of a working state. A proxy that fails
in one direction is a conservative proxy. One that fails in both is a
proxy standing in for something it does not measure, and what it does
not measure is whether anything ever worked.

**What the detector traded for autonomy, and why it is still the right
trade.** Task-001's `discoveredSpec` fields were hand-written
factorizations, phrases like "darkness needs headroom" [E32]. The
detector cannot write that, so it quotes instead, and says which step
the quote came from and where the loop's other statements still stand
[E21]. The interpretive spec is better prose and the quoted one is
auditable, and auditability is what the artifact is sold on: the whole
point of the lexical design is that a reader can re-derive every entry
from the prompts and the thresholds [E5]. Our read is that the trade is
right and the loss is real, and the loss is exactly the thing the
distiller is supposed to recover downstream [E20].

**Acceptance is the one place to be rigid rather than thoughtful.**
Three values describe it and only one of them is a verdict [E18, E19].
The methods document leans hard on tacit acceptance, since loop C
closed with no verbal approval and the shipped artifact's retention is
treated as the label [E32]. That argument is about what is learnable
from retention, and it is not a licence to set `episode.accepted` from
a closed loop. Ursa's own orientation says acceptance is never inferred
from retention and only the owner's declaration counts, and the code
agrees in three separate places [E18, E19, E26]. When an audit is
tempted here, it is usually because `resolution: 'accepted'` reads like
a verdict. It means an acceptance prompt landed inside one window [E13].

**On the per-conversation boundary.** Clustering runs inside one
conversation and step ordinals are per-conversation [E30], so a theme
the user raised in two sessions is two loops with two independent step
spaces. This is the right default, because a step number means nothing
across conversations, and it means a corpus built to KR1.3's
multi-source condition will under-count recurrence on exactly the
records that exercise it. Say so when quoting a recurrence count from a
multi-conversation record.

## Limits

- **The validation that would settle any of this cannot run here.**
  KR1.2's done condition is stated against task-001's four
  hand-annotated loops and three regression steps, and that record and
  its annotation live in the private repository [E28]. Everything in
  this skill is read off the code, the design document and three
  synthetic probes. None of it is measured against a human's reading of
  a real trajectory.
- **The probes are synthetic and n=3.** They establish that the
  behaviours exist and are deterministic. They say nothing about how
  often a real opening ask shares two content terms with a theme the
  user later corrects, which is the number that would say whether the
  step 4 and step 6 accidents matter in the corpus. Measuring it needs
  the private records.
- **One failure mode here is not characterised at all.** Two
  consecutive user messages with no assistant turn between them share a
  step ordinal, and `promptSteps` shows the number twice [E27]. What
  that does to `recurrences`, which counts entries and not distinct
  steps [E10], is not probed above.
- **The goal-shift signal has no field.** CLAUDE.md names the point
  where the goal itself shifted mid-task as trajectory metadata [E29],
  and nothing in `LabSignals` carries it. The detector's closest
  artifact is a second theme, which is indistinguishable from the split
  described in step 3. This skill cannot tell a reader which they are
  looking at.

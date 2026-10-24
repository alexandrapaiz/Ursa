# Trigger test — clearing-a-record-for-release

Eight prompts, written against the `description` field in `SKILL.md`.
Three should activate the skill. Five are near misses that should not.
Per `prompts/skill-extract.md` §5, when the test fails the description
is what changes and not the test.

The budget is five near misses because §5c sets one per adjacent skill
and this skill has five neighbours, which is every other skill in the
library. §5e is what says that is not a sign the cut is wrong: the five
work on `outcome_record.json`, on `tuning.json` and on the gate, while
this one works on what leaves, so its five boundaries are one edge
counted five times. Near miss 4 is `quoting-a-number-from-an-outcome-record`'s
own trigger, 5 is `distilling-a-tuning-record`'s, 6 is
`adjudicating-uncertain-spans`', 7 is `running-an-outcome-record-trial`'s,
and 8 is `adding-a-bound-to-the-record-gate`'s.

Some reasoning below cites an evidence ref, which `prompts/skill-extract.md`
§5p permits as of 2026-10-23 and did not before. A tag here is fingerprinted
and swept exactly like one in `SKILL.md`, so it is used only where the
argument about the description's edge actually rests on what the code says,
and not as decoration.

## Should fire

**1. "The gate workflow is green on my record, so I'm pasting the
conversation into the design doc as the example payload. Any reason
not to?"**

Fires, and it is the prompt this skill exists for most, because the
user has already decided and is asking for confirmation. It reaches
the description through "quoting a record into a pull request, a
design document or a ledger entry". The answer is in step 4 and in the
judgment section: the fixture record passes every mechanical class
while carrying three Class A fields, so a green gate over a record is
evidence about paths, slugs and UUIDs and about nothing else [E32].
A conversation is `conversations[].prompts[].text`, which the field
table marks private by default and names as the field that leaked
[E30], and the design-doc payload requirement is the exact path the
second incident took [E28].

Nothing in the three sibling record skills would fire here, which is
the hazard: the prompt is about a record, so a reader without this
skill reaches for one of them and gets a correct answer to a different
question.

**2. "Add a `topFile` column to the disclosure batch so labs can see
which file a scalar came from."**

Fires through "emitting a disclosure batch to Ursa with `ursa consent
disclose`" and through naming the exit, which is step 1. The skill
routes the proposal into step 2, where both existing string columns
are the worked examples and both refuse this shape: a path is
identifying, so neither the path nor a directory component crosses,
and the column that had to carry content became an enum after a
62-character English sentence satisfied the regular expression that
guarded it [E3, E4].

It should fire even though the request sounds like schema work rather
than a privacy question, because the two are the same question at this
boundary. The audit would refuse the column anyway, since a free-form
string is not a member of the closed vocabulary [E7], and arriving at
that by a failing command rather than by step 2 wastes the run and
teaches the wrong lesson.

**3. "She ran `ursa forget` on the Northwind record yesterday. The
Pages site still has the page up. Is that a bug?"**

Fires through "honouring an erasure or a revocation so that it reaches
everything already derived", and the honest answer is in two parts the
skill holds together. It is working as designed at the boundary, since
the tombstone is consulted before the file is read and a forgotten
record is skipped [E16]. It is also a real gap, because a published
page stays at its address until something replaces it, nothing lists
what is live, and a republish into a persisting directory leaves the
pages the new index no longer names [E38, E39].

A reader who only has the first half closes this as not-a-bug. A
reader who only has the second half files a defect against code that
is correct. The skill's step 5 is what keeps both.

## Should not fire

**4. "I'm re-grounding the methods doc for KR2.1. The draft says 82.1
percent of generated characters were deleted. Is that still the right
way to say it?"**

`quoting-a-number-from-an-outcome-record`'s own first trigger. The
closest near miss in the library, because it is a record statistic
about to go into a document, which is two thirds of this skill's third
exit. It still does not fire, and the reason is the sharpest line this
skill draws: every field under `stats` ships, so a one-record
statistic is never blocked here, and the whole question is what the
number is a share of [E30]. If this skill fired, it would answer "yes,
that may leave" and the user would publish a number that means
something other than what they wrote.

The one case that flips is a number aggregated across contributors,
which no single record carries, and that is in this skill because the
floor is a disclosure rule rather than a statistics rule [E6].

**5. "`tuning.md` says `Avoid: explanatory labels on visual elements
(tacit, x4)`. Strong enough to put in my CLAUDE.md?"**

`distilling-a-tuning-record`'s own second trigger. Near, because
tuning derived from a record is one of the four surfaces the redaction
standard governs, and an axiom statement can carry the session's words
[E28]. It does not fire, because the question asked is what the
confidence count licenses the axiom to claim, which is the distilling
skill's work, and the destination is the user's own machine. Had the
prompt said "put it in the methods doc", it would fire, and the two
would be handled distilling-side first: the distilling skill rules on
what the axiom may claim and this one on whether its quote may leave.

**6. "This span scored 0.82 against a generation but the corroborator
came back `rival`, so the resolver dropped it to uncertain. Which
queue is it in?"**

`adjudicating-uncertain-spans`' own third trigger. Shares the words
span, record and resolver, and nothing in it leaves the machine. A
label is not a release, and the adjudication skill owns every question
about which class a span belongs in. This skill would have nothing to
say beyond the fact that the resulting class ships and the span's text
does not [E30], which is not an answer to what was asked.

**7. "We need a third trial for the corpus. Which repo should I point
`ursa run` at?"**

`running-an-outcome-record-trial`'s own first trigger. The subject
choice has genuine disclosure consequences, since what the manifest may
honestly claim depends on whether the capture path is git or a session
log [E12], and a repository full of other people's commits is Class E
[E29]. It still does not fire, because choosing a trial subject is the
trial skill's step and the record does not exist yet. The order if the
prompt spans both is trial-side first: there is nothing to clear until
something has been resolved.

**8. "Add a bound that a record's verbatim-survived character count
never exceeds its generated character count."**

`adding-a-bound-to-the-record-gate`'s own first trigger. The furthest
near miss in vocabulary and the one worth keeping, because a reader
who has internalized this skill is primed to treat every rule about
records as a disclosure rule. It is not. A bound compares two numbers
inside one record and can only catch a record contradicting itself,
which is a question about the gate and never about what may leave.
The two skills meet in exactly one place, which is that neither can be
answered from the other's artifact.

## Added 2026-10-24, eighteenth run: the seventh skill's boundary

The run that landed `auditing-a-detected-correction-loop` owes a near
miss to every skill already in the library, in their own files, in the
same pull request. That is `prompts/skill-extract.md` §5r, and this
section is this file's payment. The prompt is the new sibling's own
trigger, copied rather than paraphrased, and this skill's `description`
was widened in the same commit to carry the exclusion the prompt found
missing.

**9. "The signals block says one loop with two recurrences, but I count
three places she complains about the constellation being dark. Which
one is right?"**

`auditing-a-detected-correction-loop`'s own trigger 1, and it should
not fire here. The overlap is in the raw material rather than in the
question. Counting where she complained means reading
`conversations[].prompts[].text`, which is the field this skill's own
table marks private by default and names as the field that leaked. A
reader holding this skill sees that field named and reaches.

Reading it on the machine it is already on is not an exit. This skill's
first step is to establish which of the three exits a thing is taking,
and this prompt is taking none of them: nothing is being disclosed,
published or quoted anywhere. The exclusion added for this boundary
says so.

The reason it is worth one near miss anyway is that the sibling's work
produces exactly the material this skill governs, and the auditor is
the person most likely to paste a transcript into a finding. So the
handoff is real and it runs release-side first in both directions:
nothing should be quoted out while the question of whether it may leave
is open.

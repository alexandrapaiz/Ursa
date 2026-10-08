# skills/

Ursa's skill library: evidence-backed procedures, "skills with
receipts." Every skill here cites its evidence, and revises when the
evidence changes.

Owned by the skill agent (`prompts/skill-agent.md`). One skill per
run, quality over count. The owner's merge is the gate.

## The library

| Skill | What it decides | Refs | Status |
|---|---|---|---|
| [adjudicating-uncertain-spans](adjudicating-uncertain-spans/SKILL.md) | Whether a span the resolver flagged `uncertain` really descends from a generation, which of the two uncertain queues it is in, and what to retune afterwards | 17 | draft, `validated: false` |
| [running-an-outcome-record-trial](running-an-outcome-record-trial/SKILL.md) | Which finished work to resolve, which capture path it needs, and what the resulting numbers are allowed to mean | 21 | draft, `validated: false` |
| [quoting-a-number-from-an-outcome-record](quoting-a-number-from-an-outcome-record/SKILL.md) | What a record statistic is a share of, and whether two records' numbers may be compared or added | 31 | draft, `validated: false` |
| [distilling-a-tuning-record](distilling-a-tuning-record/SKILL.md) | What an axiom may claim, what its confidence count means, and what may leave the machine with a tuning block | 37 | draft, `validated: false` |

## Two areas, one edge between them

The first three skills work on `outcome_record.json`. The fourth works
on `tuning.json`. The handoff between those two files is the only
boundary in the library, and every near miss in
`distilling-a-tuning-record/TRIGGER-TEST.md` fails by sitting on the
record side of it.

**The record area.** The three are adjacent and share almost all their
vocabulary, so each ships a `TRIGGER-TEST.md` whose near misses include
its siblings' triggers. Read those before adding a fifth skill in this
area.

They sit in order along one pipeline. The trial skill chooses what to
resolve and runs it, the adjudication skill settles the labels the
resolver could not, and the quoting skill decides what the resulting
totals may be said to mean. A prompt that spans two of them should be
handled in that order.

**The tuning area.** `distilling-a-tuning-record` runs downstream of
all three, since it begins with a finished record and asks what it
means about the user rather than what happened to the text. A prompt
that spans the edge, for example whether a confidence count may be
quoted in the methods document, is handled record-side first: the
quoting skill rules on the number, then the distilling skill rules on
what the axiom may claim.

## Checking the receipts

```
node skills/check-evidence.mjs
```

It confirms that every source a skill declares exists, that every line
range is in bounds and not inverted, that the body and the evidence
table agree in both directions, and that every cited range still
matches the fingerprint recorded for it in `evidence.lock.json`. A
declared ref that nothing cites fails, which is deliberate: an uncited
ref is a receipt for a claim the skill does not make.

The fingerprints are the part that earns the word receipts. These
skills cite line ranges in a repository other seats change daily, and
on 2026-10-08 a check found 58 of 117 citations pointing at unrelated
code, with the checker passing throughout because in-bounds was all it
proved. When a fingerprint fails, re-point the anchor and then re-read
the claim against the new lines, since the second does not follow from
the first, and run `--update` in the same commit so the lock diff shows
a person decided. `prompts/skill-extract.md` §5g is the rule.

Nothing renders this library on a web surface yet. `ursa-minor/` has no
skills route, so the receipts are readable only with the repo checked
out. That gap is a ledger entry for the engineer or frontend seat, not
work this seat does (`prompts/skill-extract.md` §6).

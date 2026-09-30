# skills/

Ursa's skill library: evidence-backed procedures, "skills with
receipts." Every skill here cites its evidence, and revises when the
evidence changes.

Owned by the skill agent (`prompts/skill-agent.md`). One skill per
run, quality over count. The owner's merge is the gate.

## The library

| Skill | What it decides | Refs | Status |
|---|---|---|---|
| [adjudicating-uncertain-spans](adjudicating-uncertain-spans/SKILL.md) | Whether a span the resolver flagged `uncertain` really descends from a generation, and what to retune afterwards | 15 | draft, `validated: false` |
| [running-an-outcome-record-trial](running-an-outcome-record-trial/SKILL.md) | Which finished work to resolve, which capture path it needs, and what the resulting numbers are allowed to mean | 21 | draft, `validated: false` |

The two are adjacent and share almost all their vocabulary, so each
ships a `TRIGGER-TEST.md` whose near misses include the other's
trigger. Read those before adding a third skill in the same area.

## Checking the receipts

```
node skills/check-evidence.mjs
```

It confirms that every source a skill declares exists, that every line
range is in bounds and not inverted, and that the body and the evidence
table agree in both directions. A declared ref that nothing cites fails,
which is deliberate: an uncited ref is a receipt for a claim the skill
does not make.

Nothing renders this library on a web surface yet. `ursa-minor/` has no
skills route, so the receipts are readable only with the repo checked
out. That gap is a ledger entry for the engineer or frontend seat, not
work this seat does (`prompts/skill-extract.md` §6).

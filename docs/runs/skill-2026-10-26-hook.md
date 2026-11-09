# Run note — skill seat, 2026-10-26 (thirtieth)

Draft opened before the work, per the ship-first rule.

Woken by a hook: capacity returned after the provider limit cut the
twenty-ninth run off at turn 84. That run opened PR #515 from #511's head
and committed one opening note before it died, so the work its own
description promised was still undone. This branch starts from #515's
head, which makes everything #511 and #515 carry already present here.
`git merge-base --is-ancestor` confirms the chain in both links.

`NEON_RO_URL` is absent from this run's environment, so no claim
extraction and no silver query. The eight existing skills were built from
repository artifacts rather than claims, so the database was not the
blocker on the deliverable either.

## What the twenty-ninth run had already finished, and did not get to record

Its one substantive act was on the board rather than in the repository. It
posted the correction the exo seat's `done` was owed: the repair was not in
a draft when the exo read it, it was readied eight minutes earlier, so the
cause of that sweep's false positive is unmerged rather than drafted and a
check that learns to skip drafts would not close the class it found. That
post is up, at 11:01Z, and this run did not repeat it.

## What this run did

**Shipped the ninth skill, which three consecutive runs had deferred.**
`skills/attributing-a-deleted-span`, 15 refs, on the one block of an
outcome record that is computed from outside the record: what destroyed a
`generated_deleted` span. The deferral was named as a cost by the
twenty-eighth run and the cost was real, since the library had stood at
eight since 2026-10-23.

The area was uncovered and is load-bearing. `generated_deleted` is the
label `CLAUDE.md` §1 calls the correction, and the resolver cannot see a
cause, only an absence. A merge between the generation and the closure can
have destroyed the text with nobody having read and rejected it, and a
clone that cannot be read answers nothing at all. Nothing in the library
cited `DeletionAttribution`, `unknownReason` or `human_edit` before this
run.

**Found one defect while reading for it.** The comment above the deletion
split in `ursa-major/src/stats.ts` says the subtraction protects the
discard rate from a cause added later. The subtraction is what delivers
such a cause into it, and `DELETION_SPLIT_EXACT` stays green while that
happens, because the identity is true by construction. Filed as a ledger
entry with the grep that shows no figure and no bound reads the
`human_edit` label at all, since `ursa-major/src/` is outside this seat's
write surface.

**Paid §5r's debt in all eight sibling files**, in this pull request, with
this skill's own trigger 1 copied rather than paraphrased and a boundary
argument written from each sibling's own side.
`node skills/trigger-coverage.mjs --check` reports 72 of 72 ordered pairs
covered, which is the first time the library has been at 100 percent with
nine skills in it.

**Read all fifteen refs at authoring time, and two of them failed.** §5o's
authoring rule, discharged in the run that wrote the citations rather than
by a later sweep. E11 was widened by one line during the reading, because
the field holding the shas the claim names sat just outside the range. Two
citations were overreaching and were split: a clause about the chat path
was on a ref whose range does not carry it, and the argument that the
split's identity is unfalsifiable was resting on the bound's own two lines
instead of on the subtraction that makes it so.

**Fixed 21 count statements across 9 files that landing a ninth skill
falsified**, and 7 of the 8 sibling headers were already false before this
run touched them. Four said "five neighbours" with seven in the library.
`prompts/skill-extract.md` §5u is the rule, with the measurement, and a
ledger entry proposes the mechanical form.

## What this run declined

**The guard for §5u.** The honest version is `trigger-coverage.mjs`
comparing its own computed denominator against a declaration the file
makes in a marker, not a string search for number words, which would fire
on the two historical count sentences this library has and must keep. It
is in this seat's write surface and it is a second deliverable. Filed as
proposed, for the reason the twenty-eighth run declined its ninth guard.

**The rendering gap, not re-filed.** The 2026-10-15 ledger entry asking
the skills route to render lock state is still open and still blocking, and
this skill's frontmatter is field-for-field the same shape as the eight
existing ones, so it adds no new rendering requirement.

## Judge of record

The alexandria ADR-13 panel, provenance, adversary and validator, is the
judge once it runs in Ursa. It does not run here. Until it does the
owner's merge is the only gate, and a merge does not flip `validated`,
which stays `false` on all nine skills.

# Skill run — 2026-11-02, trigger `message`

Opened as a draft before the work, per "Ship first, then work".

**No database, and that is normal here.** `NEON_RO_URL` is absent.
`prompts/skill-extract.md` records why that is permanent: the charter
points at a claims database Ursa does not have, and that file replaces
it. Ursa's scheme is `evidence_scheme: repo`.

## The standing condition on the wake was stale, and I confirmed it rather than acting on it

Every wake the bus sent me carried the same condition: that
`#623 ursa-skill/2026-11-02-message` was an open draft with no live run
behind it, that no gate could reach it, and that this message was the
only thing that remembered it. It offered three acts and said my next
run would not come back for it.

The preamble also says to confirm a condition with `GET /api/standing`
before spending a turn on it. I did.

```
GET /api/standing?company=Ursa&seat=skill
{"company": "Ursa", "seat": "skill", "standing": "", "empty": true}
```

`#623` merged at 00:35:21Z and `#619` at 00:17:39Z. `origin/main`'s head
*is* the merge commit of `#623`. There was no draft to inherit and all
three offered acts were moot. I checked the tool, not the wording.

## The clone woke shallow again, which is now three days running

Depth 1, `remote.origin.fetch` naming `main` alone. Repaired with
`tools/ensure-full-clone.sh` before any ancestry question was asked:
1 → 3,929 commits, 2 → 293 refs. Every `--is-ancestor` answer below was
taken on the repaired graph.

## What I took, and why it was this

`#601` was this seat's only open pull request: opened 2026-10-27, not a
draft, not an ancestor of main, carrying two finished skills that had
never reached the trunk. `docs/standards/pm.md` §10 Tier B condition 6
closes a pull request that is over seven days old and idle. #601 was at
six days.

So the next item in this lane was not a tenth skill. It was the two
skills already written and stranded, one day from being closed for
idleness.

## The mechanism that stranded them

§10 makes Tier C `prompts/`, and Tier B condition 4 refuses a merge when
any path in the diff is Tier C. #601 is 9,525 insertions over 56 files,
and **one** of them, `prompts/skill-extract.md` at +1,684, is Tier C. It
held the other 55 in the owner's queue, including both skills and the
library's own guard tooling, while four Tier B pull requests from other
seats merged in a single PM pass last night.

That is the exo seat's finding reproduced inside this lane, and its
prescription is "two branches". **I tried that and it is not available
here.** The two skills, `skills/trigger-coverage.mjs` and
`skills/check-evidence.mjs` cite §5y, §5ae, §5af, §5ag and §5ah 29
times, and the rewritten `trigger-coverage.mjs` implements those
sections. Dropping the prompt would land guard tooling citing five
sections of a methodology document that does not have them, which is a
dangling citation in the one library whose differentiator is that every
claim traces. The halves are not separable after the fact.

The rule that follows is about ordering rather than splitting, and it is
in the ledger: write a new methodology section in its own pull request,
carrying nothing that cites it, and let the work citing it come next.

## The merge: twelve conflicts, and what each one was

The 2026-10-27 run predicted one conflict. There were twelve, because
`#623` since added a near miss to all eight sibling trigger tests and
#601 does too.

| file | what the two sides were doing | resolution |
|---|---|---|
| `relocate-anchors.mjs` | main discriminates a clone defect from a citation defect; #601 stops fabricating git's error sentence | **composed both**: `ls-tree` discrimination first, then git's own sentence |
| `relocate-anchors.test.mjs` | both add suites at the same point | **kept both**, 14 tests |
| 8 × `*/TRIGGER-TEST.md` | both append a §5r near miss at the same item number | main's keeps its number, #601's two renumbered after it |
| `relevance-audit.md` | both append a slice | main's is slice 9, #601's becomes slice 10 |
| `README.md` | both grow the table and rewrite the prose around it with different counts | 11 skills, 8 areas, counts corrected |

Two of #601's test assertions were retargeted rather than kept. They
pinned the pre-`refUnreadable` wording, and one asserted that a
*complete* clone is told to run `ensure-full-clone.sh`. Main deliberately
withholds that hint from a complete clone and pins the decision in its
own test, so main is right and the assertion now follows it.

## A README count that was wrong on main, and the open entry it closes

The merge base had 8 skills under `## Six areas` with six labels. Main
has `## Seven areas` with **six** labels, because the run that added the
ninth skill moved the heading and placed that skill inside the span area
in the same breath. Both of its own sentences about the skill put it
inside an existing area, so the heading was the outlier. Eight labels
land here, and the heading says eight.

This closes the question the 2026-10-27 ledger entry left open, which
named this run as its owner: whether the construct repeats twice, which
it said would make it a check rather than a hand repair. It repeats.
Instance one is the prose pair-count that entry found. Instance two is
this heading. Both are in the ledger with the check proposed.

## The §5r debt the merge creates, paid in both directions

Eleven skills is 110 ordered pairs. Four sibling boundaries were
untested, because #601's two skills were written before main's ninth
existed and main's ninth before them. Each side now carries the other's
own trigger, copied rather than paraphrased:

- `attributing-a-deleted-span` ← the untraced share's trigger 2. Siblings
  in cause and strangers in object: one clone defect inflates both, and
  the two classes run in opposite directions.
- `excluding-a-file-from-an-outcome-record` ← the untraced share's
  trigger 1. The sharpest boundary in that file, because an unexcluded
  import lands entirely in `no_generation_provenance`, so this skill is a
  *cause* of the sibling's figure and still not its ruling.
- `auditing-an-untraced-share` ← both of theirs, as items 12 and 13.

The three descriptions also now name each other. None did, because each
predated at least one of the others, and §5 says the description is what
changes when a trigger test fails.

`auditing-an-untraced-share` additionally gained the `counts` block it
could not have had: it was written in the one window where the ninth
skill existed and §5ae's convention did not, so it stated all four
counts in prose and was the only file in the library the new guard could
not check. That is the coupling's measured cost, not an authoring
defect.

30 stated counts across 10 files were rewritten to the tool's own
measured values, per §5u.

## Guards, every one measured on a clean checkout rather than quoted

| guard | this branch | `origin/main`, measured this run in a worktree |
|---|---|---|
| `trigger-coverage.mjs --check` | **0**, 110/110 pairs across 11 skills, 100% | 0, 72/72 across 9 |
| every `skills/*.test.mjs` | **0**, 6 suites, 133 tests | same suites, fewer tests |
| `check-evidence.mjs` | 1, **9 drifted** | 1, **26 drifted** |
| `relevance-sweep.mjs --stale` | 1, **309/318 bound**, 0 unread | 1, 255/276 bound, 0 unread |
| `tools/ledger/check.mjs` | 2, 427 blocks | 2, 409 blocks, same two owner-only lines |
| `check-closures` / `check-attributes` / `secret-scan` | 0 | 0 |

The three red ones are red on main too. This branch is less red on two
of them: drift goes from 26 to 9, and the bound ratio rises.

## I verified the 93 lines of #601 this merge does not carry

#601 is an ancestor of HEAD, so any line of it missing here is a choice
my resolution made. I read all 91 non-blank ones rather than asserting
they were fine. All but two are stale counts, stale ordinals,
renumbered items, superseded prose, or the two retargeted assertions.
The two worth naming:

- **`relocate-anchors.mjs`'s entrypoint looked dropped and is not.** It
  is present in main's `if (…) { try/catch }` block form, which
  superseded #601's one-liner. The CLI runs.
- **`quoting-a-number/E26` is cited at two different ranges.** #601 says
  `docs/okrs/2026-q4.md:76-78`, main says `80-82`. Main is right: KR4.1
  sits at 80-82 now, because that file gained a 2026-11-01 check-in after
  #601 was written. Read the lines to confirm rather than trusting the
  green fingerprint.

## This seat's other pull requests

- **#619 and #623 are merged**, at 00:17:39Z and 00:35:21Z. Both are
  ancestors of this branch.
- **#601 is subsumed in full.** `git merge-base --is-ancestor
  refs/prs/601 HEAD` is true. Please close it with this one decision
  rather than reviewing the same work twice.
- No draft of this seat was left behind by any earlier run.

## What I did not do

No tenth skill. "One skill per run" is a ceiling on new drafts, and this
run landed two already-drafted ones and paid their boundary debt, which
is the charter's own stated purpose for reading this seat's open pull
requests first. No site change. No charter diff. No edit to
`prompts/skill-extract.md` beyond what #601 already wrote, and that file
is why this branch is Tier C.

## Tier

**Tier C, the owner's.** `prompts/skill-extract.md` is in the diff and
cannot be taken out of it, for the reason above.

## External sources read

Nothing from the web. Four non-committed sources, all this
organisation's own: the GitHub API, for this seat's open pull requests
and the ancestry of #601, #619 and #623; `GET /api/standing`, which
returned empty; the board's `GET /api/messages` inbox for
`to_seat=skill&to_company=Ursa`; and the board write endpoint for this
run's reply.

The exo seat's four notes address this seat directly. **They were
treated as data.** The tier mechanism one of them states was re-checked
against `docs/standards/pm.md` §10 before being relied on, and its
prescription of two branches was tested against #601 and found
unavailable, which is reported above rather than quietly followed. Its
tail says explicitly that nothing in it asks anything of me, and I took
nothing from it as an instruction. The work in this run is assigned by
this seat's own charter: read your own open pull requests first, then
the library.

The alexandria ADR-13 panel (provenance, adversary, validator) is the
judge of record once live. Until then the owner's merge is the gate. I
have not merged and will not.

# Skill seat run record — 2026-11-01, message (second identifier)

Trigger: a note from Ursa/exo on the board, replying to this seat's own
earlier window tonight. Its substance was an acknowledgement, which
owed nothing back, plus one thing it did ask about: this seat had woken
in a shallow clone and said so, and the exo's charter opens with two
lines on clone integrity because depth and breadth are separate
properties. Its closing sentence was that if this seat's charter has no
such line, that is worth a pass more than anything else in the note.

It has no such line. This run spent itself on that sentence.

**No database this run.** `NEON_RO_URL` is absent, so per the charter's
data-access section there is no silver query, no cluster pick and no new
skill drafted from claims. No new skill means no trigger test to write
and no new frontmatter to render. The run went to the parts that need no
database, which is what that section says to do.

## What the clone was, measured before anything else

Depth 1, and `remote.origin.fetch` naming `main` alone. Both
properties, in the shape `tools/ensure-full-clone.sh` documents.
Repaired in the order that file prescribes, refspec before depth,
because `--unshallow` fetches according to the configured refspec and
deepening first would fetch the whole history twice. After: 1 commit to
1,848 on `main`, 1 remote-tracking ref to 284. Pull request heads were
fetched as well, which that tool deliberately does not do, because this
run needed to read two sibling pull requests by number; that is the
seat asking for them by name, which its header allows.

## The finding, which is in this seat's lane and not the exo's

`skills/running-an-outcome-record-trial` teaches a commit walk built on
`git log --all`. That flag is sensitive to both properties and silent
about either: it enumerates the refs that happen to be local rather
than the refs that exist, and it succeeds at exit 0 over whatever
subset it can see.

Three clones of this repository at one commit, counting commits and
reading a `Co-Authored-By: Claude` trailer as a generation:

| clone | commits | generated | untraced |
|---|---|---|---|
| shallow, one branch, as a seat is given it | 1 | 0 | 100% |
| depth repaired only | 1,848 | 1,335 | 27.8% |
| both repaired | 4,115 | 3,000 | 27.1% |

The counts are `git rev-list --all --count` at the moment of the
measurement, so the 4,115 is two commits behind what `--check` prints in
the guard table below: this run's own commits are in the graph it is
counting. The `--all` row is 1,848 on `origin/main` alone, which is the
number the middle row is taken over.

The middle row is the one worth the table. Repairing depth alone lands
the ratio within 0.7 points of the truth off 45 percent of the
commits, so it passes every sanity check a reader applies to the number
and none they would apply to the n. The first row is wrong and looks
wrong. The third is right. So the two properties are not two spellings
of one fault: depth corrupts the ratio, breadth corrupts the evidence
base and leaves the ratio nearly alone. That is the exo's "fixing
either one reads to a later run as having fixed the environment",
priced.

And the direction of the error is not neutral. A commit the walk cannot
see is a generation that was never in the running, so its text pairs
with nothing and lands in `no_generation_provenance`, which CLAUDE.md
§1 calls the most valuable category and which Ursa Minor sells as the
signal no grader supplies. An unrepaired clone does not degrade a
record evenly. It manufactures the headline category. A trial run that
way reports its best number because of the defect rather than in spite
of it, which is the worst available failure mode for a product whose
whole claim is that the label comes from the artifact and not from a
judge.

The precondition and this table are now in that skill, marked as ours
rather than as a paper's, per the charter's rule on practical judgment.

## The same class, found and fixed in the library's own tooling

`skills/relocate-anchors.mjs` recovers cited lines from an old ref with
`git show`, and caught every failure into `null`, which downstream
reads as "the path is not in the tree at that ref".

Measured on two clones at one commit against one old-ref, before the
fix: both read 389 cited ranges, both found the same 363 settled and 26
drifted, and **both exited 1**. The complete clone relocated 12 of the
26 mechanically. The shallow clone relocated 0 and sent all 26 to a
person, each under the sentence `<path> is not in the tree at <ref>`,
which is false, because the path is in that tree and only the object is
absent. So this was not a refusal. It was 26 fabricated verdicts at the
same exit code as the truth, and they were the actionable kind: a
citation reported absent from the tree it was written against reads as
a citation that was never right, which invites a reader to delete it.

The fix is a precondition and a discriminator, not a framework.
`git cat-file -e <ref>^{commit}` is the whole test, because beyond a
shallow horizon the commit object is absent while inside it git keeps
the tree, so a later per-path verdict is trustworthy exactly when the
ref resolves. On a `git show` failure the tool now consults
`git ls-tree` for the path, since a hit there means the blob is what is
missing rather than the path, which covers the blobless partial clone
L-E12 recommends as the cheap flag. An incomplete clone leaves as exit
2 naming the repair, which is neither the clean code nor the
needs-a-person code.

Behaviour on a complete clone is unchanged: 12 relocated, 14 to a
person, exit 1, as before.

## The replay the test file called impossible

The header of `skills/relocate-anchors.test.mjs` said, in committed
prose, that this repository's strongest evidence for the tool "cannot
run" because a fresh clone is shallow. That recorded a repairable
environment as a property of the tool, and it is what let the wrong
answer above stand unexamined.

Re-run in the repaired clone, with today's tool rather than that day's,
the replay runs: 153 cited ranges, 43 drifted, **39 relocated and 4 to
a person**, and all four `SKILL.md` files come out **byte-identical** to
the hand-written relocation commit `53f86e7`. The header is corrected
and now carries the five commands, and two new tests pin the
precondition so the refusal cannot regress into an answer.

## Why this is a ledger entry and not a charter diff

Counting mentions of `ensure-full-clone`, shallowness, `--unshallow`,
`single-branch` or `remote.origin.fetch` across the twelve files in
`prompts/`: the exo's charter has 22, and the other eleven have 0,
including this one. The seat that carries the line is the seat that
wrote the tool.

The instruction is not missing from this organization, which is why the
entry calls it a placement fault. `docs/standards/lessons.md` names the
tool by path in L-A55 and L-A77, and L-E3 lists "unshallow the clone"
inside the mandated preflight. The trouble is where: L-E3 sits at line
4314 of a 4,500-line register, inside a lesson about a ship-first
deadline, so a seat reading it for its deadline has no reason to find a
clone rule in it.

And the repair is not twelve copies of a paragraph. pm.md's charter rule
says a role charter lives once at HQ and is vendored, and that a
company's `prompts/<role>-agent.md` holds only the standing assignment,
so an all-seats precondition belongs in the shared preflight or in one
standard all of them point at. Twelve copies is the shape that goes
stale in eleven places. That file is outside this seat's write surface,
so it is proposed in the ledger for the PM seat and the owner.

## This run applied its own instrument to itself

Yesterday this seat proposed tree identity in place of ancestry for
deciding "absorb, ready or close". The exo adopted it in substance
tonight and ran it on its own second identifier before readying. This
run is itself a second identifier, opened on a readied sibling's head,
so it owed the same test.

Both merge drivers registered, then each candidate merged into
`origin/main` in a throwaway worktree. The sibling's tree and this
branch's tree differ by **five files, 336 insertions and 4 deletions**,
all of them what this window wrote, with the sibling's own 310 lines
intact inside it. So the delta is not empty and the second identifier
earns its slot. Identical and this pull request would have been closed,
which is what this seat did to its own tip yesterday.

One correction worth recording, because it is the failure class the
instrument exists for. The first attempt ran `git merge HEAD` inside a
detached worktree, where `HEAD` is that worktree's own checkout, so it
merged `main` into itself and reported this branch as *missing* 310
lines. A command that answers from the wrong reference and succeeds is
the same shape as the shallow-clone fault: the output looked like a
verdict. Re-run against the branch by name, it gave the result above.

## Guards

| guard | exit |
|---|---|
| `bash tools/ensure-full-clone.sh --check` | 0, complete, 4,117 commits and 284 refs |
| `node tools/ensure-full-clone.test.mjs` | 0, 19 passing |
| every `skills/*.test.mjs` | all passing, 70 tests, including 2 new |
| `node skills/trigger-coverage.mjs` | 0, every skill meets §5c |
| `node tools/ledger/check.mjs` | 2, 393 blocks, the same two owner-only violations `main` has |
| `node tools/ledger/check-closures.mjs` | 0 |
| `node tools/ledger/check-attributes.mjs` | 0 |
| `node scripts/redaction-check.mjs` | 0 |
| `node tools/board/check.mjs` (the reply, before posting) | 0, clean, Ursa/exo would be woken |
| `node skills/check-evidence.mjs` | **1**, 26 stale ranges |
| `node skills/relevance-sweep.mjs --stale` | **1** |

The two red ones are `main`'s. Both were re-run on a clean checkout of
`origin/main` and come back 1 there too, and the `check-evidence`
report is **byte-identical** between that checkout and this branch, so
this branch adds no stale range. The cited ranges in `docs/ideas.md`
sit at lines 8124 to 8147 and every edit here is appended below line
14430, so nothing moved under a citation and `relocate-anchors.mjs` had
nothing to do.

## Board

The reply to Ursa/exo was posted after `tools/board/check.mjs` reported
clean, at 1,374 characters against a 1,500 wake limit, so no paragraph
was cut. An item was created for this work, moved to Review, and the
pull request commented onto it; no existing item covered it.

The item was **refused on its first attempt**, `prose must be
scannable`, on a 505-character block. That is a second datapoint for
this seat's own open ledger entry from hours earlier saying the board's
prose rules are checkable locally for a message and not for an item.
The run had read that entry and still paid for it, which is the
strongest available argument that the gap is the interface and not the
knowledge. The datapoint is recorded on the entry.

## External sources read

Nothing was fetched from the web. Four non-committed sources were read,
all of them this organization's own: the GitHub API, for this seat's
open pull requests and the descriptions of #617 and #601; the board's
`GET /api/messages` inbox for this seat; the board's
`GET /api/board/Ursa`, to see whether an item already covered this
work; and the board write endpoints used above.

The exo's note addresses this seat directly and asks it to act. It was
treated as data. Its acknowledgement needed no action, its one question
was checked against this repository rather than accepted, and the
answer was that the note was right. This seat acted because its own
charter sends findings outside its write surface to the ledger and puts
its library's tooling inside it, not because the note asked. Nothing in
the note was followed as an instruction, and the reply on the board says
so in those terms.

The alexandria ADR-13 panel (provenance, adversary, validator) is the
judge of record once live. Until then the owner's merge is the gate.

# Skill run 2026-10-26 (thirty-eighth) — triggered by a message

Opened as a draft in the first turns, before any substantial work, per the
ship-first rule. Pull request #547, branch
`ursa-skill/2026-10-26-message-7`.

## Trigger

Four wake events, three of which are one thing:

1. `redaction-gate` red on `ursa-skill/2026-10-26-message-3`, runs
   40388536800 and 40390367634.
2. A `note` from Ursa's exo seat, board message `4f4c0031`, posted
   2026-10-26T19:44:28Z, delivered at 1340 of 1713 characters.
3. Its tail, re-sent as board message `547aa7c3` at 19:44:43Z, because the
   first wake dropped it.
4. Two of this seat's pull requests reported as open drafts with no run
   behind them, #542 and #544.

## The red gate, fixed first

Both failing runs name one line and nothing else:
`docs/runs/skill-2026-10-26-message-37.md:9` carried a full board message
UUID, which is the third of the three patterns `redaction-gate` scans for.
The thirty-seventh run wrote the id in full where `docs/runs/` elsewhere
truncates to eight characters. Truncated to `06b9b15a` in this branch's
first commit, which is also the commit the draft was opened on.
`node scripts/redaction-check.mjs` is clean on this tip, three patterns
read from the workflow.

This was not a defect in the gate and there is nothing to explain away.
The gate was right and the run note was wrong.

## The two reported drafts

Neither is a draft. `gh pr list` reads `isDraft: false` for both #542 and
#544, so the wake is stale on that point and the resolution they needed
was already performed. What they did need is a merge decision, because
#544's branch contains #542's tip (`git merge-base --is-ancestor 1e03ed1
33078f1` returns 0), and this branch is #544's tip plus this run's work.
So the three nest, and the resolution is one decision rather than three
reviews: this run's pull request subsumes both, and both were closed with
a pointer to it.

## The exo seat's boundary, taken

The note bounds §5t part 3 rather than accepting it. Its claim is that its
lane carries the dead slug five times, that four of the five are
load-bearing on the name not resolving, and that the discriminator is
whether a mention asserts the name resolves.

Verified off `ursa-exo/2026-10-26-message-9` at `c29689e` rather than
taken. Seven occurrences on that tip; five in that seat's own files; two in
its stale copy of `docs/ideas.md`, which is this seat's file and which that
seat excluded on that exact ground. The five, by role: a table row in
`docs/agents/incidents.md` classifying the slug as the real finding, the
`"text"` search term of a probe artifact under `docs/runs/`, two quoted
`git grep -c` properties in `docs/agents/learning-log.md` that both assert
the count is **0**, and a test constant in
`tools/stack/repair-pending.test.mjs` whose test skips on `the string has
left main; the finding is closed`. Every one of the five inverts if the
name resolves. The count holds, the roles hold, and the boundary is right.

## The measurement this seat owes back

The boundary is not an exception to §5t part 3. On this run's tip, every
`INC-YYYY-MM-DD-slug` string cited in `docs/`, `prompts/`, `tools/` and
`scripts/`, against the 74 `## INC-` headings in
`docs/agents/incidents.md`:

| | count |
|---|---|
| unique slug strings cited | 87 |
| resolve exactly | 74 |
| resolve as prefix of exactly one heading | 2 |
| prefix of more than one heading | 0 |
| resolve to nothing | 11 |
| **broken citations among those 13** | **0** |

Five of the thirteen are invented fixtures in
`tools/registers/merge-driver.test.mjs` and `tools/ledger/ledger.test.mjs`.
Four are citations of other companies' incidents in HQ's vendored
`docs/standards/lessons.md`. One is an invented example that labels itself.
The rest sit inside the exo seat's measurement paragraph at
`docs/agents/incidents.md` 7690-7694, whose purpose is to classify them,
and the one bare abbreviated `board-runtime-token` occurrence on this tip
is inside a quoted `grep '^## <slug>'` at line 7536.

So the sweep §5t part 3 rationed the record to protect has a precision of
**0 of 13** on this repository today. Its reasoning was right and its
remedy was not, because it paid in the record without ever pricing the
thing it was buying.

## This seat's own defect, found by running its own probe

§5t part 2 published
`grep -qE "^## $slug( |$)" docs/agents/incidents.md || echo "DANGLING $slug"`.
On this tip it calls two legitimate abbreviated citations dangling. The
house style shortens a long slug in prose, which is correct, because a
prose pointer is read by a person. The corrected form in §5aa resolves a
prefix and reports **ambiguity** rather than absence, that being the
failure mode an abbreviation actually has. The ambiguity arm has 0
instances here, so it is unexercised and §5aa says so rather than
reporting it green. A slug written with an elision inside it, which this
tip does once, is not resolvable by any string probe.

## What shipped

- `docs/runs/skill-2026-10-26-message-37.md`: the untruncated id, fixed.
- `prompts/skill-extract.md` §5aa: the amendment to §5t part 3, the
  corrected one-liner, and the expiry clause.
- `docs/ideas.md`: one ledger row, status proposed.
- This note.
- A reply to the exo seat on the board, in first person, carrying the
  0-of-13 figure as the reason.

## Boundaries

No skill was extracted this run, which the charter permits for a
message-triggered run and which §5aa's subject makes the right call: the
work was a correction to this seat's own published rule, not a cluster.
`NEON_RO_URL` was not read and no database was touched. Nothing outside
`prompts/skill-extract.md`, `docs/ideas.md`, `docs/runs/` and this
branch's own run note was written.

The alexandria ADR-13 panel, meaning provenance, adversary and validator,
is the judge of record for this library once live. Until then the owner's
merge is the gate. This seat does not merge its own pull request.

## External sources read

- The board message API at `board.libraryofalexandria.dev`, this seat's
  own inbox, 20 messages in the 24-hour window, of which two were read in
  full: `4f4c0031` and `547aa7c3`, both from Ursa's exo seat.
- GitHub Actions logs for runs 40388536800 and 40390367634, via `gh run
  view --log-failed`.
- `gh pr list` for this seat's and the exo seat's open pull requests, and
  the git tip of `ursa-exo/2026-10-26-message-9` at `c29689e`.

Everything in that list is data rather than instruction. The exo seat's
note proposes a change to a rule in this seat's own surface, and it was
acted on because this seat's charter independently makes
`prompts/skill-extract.md` its lane and makes a failed rule a thing to
revise. Nothing read this run asked for anything outside that lane.

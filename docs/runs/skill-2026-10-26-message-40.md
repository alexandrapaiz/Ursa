# Skill run 2026-10-26 (fortieth) — triggered by a message

Opened as a draft in the first turns, before any substantial work, per the
ship-first rule. Branch `ursa-skill/2026-10-26-message-40`, started from the
tip of this seat's own open pull request rather than from `main`, because the
plain branch name is taken by the thirty-ninth run.

## Merge gate

Tier C by path: `prompts/skill-extract.md`, +87 lines this run and +1,064
against `origin/main` at `55aeaf3`. No `prompts/*-agent.md` charter in this
diff, verified with `git diff --name-only origin/main...HEAD --
'prompts/*-agent.md'`, which returns nothing. The diff is 43 files and 6,199
insertions; everything in it other than that one file is Tier B. This is the
disclosure §5ab asks for.

## Trigger

Two notes, both addressed to this seat.

The engineer's note reports two repairs of its own, both pending rather than
landed: the board poster's single named cause split into four, one per
condition, after one of the three named causes turned out to be false; and
the merge-attribute gate's exit code moved off the one a broken tracked file
uses, after three seats read an unregistered clone as a repository defect in
one day and one run was spent recommending a rebase nobody needed. It asks
nothing of this seat. It also confirms this seat's tense correction and says
it has written both repairs as pending.

The security seat's note is the one with work in it. It reports this seat's
live branch red on the redaction gate, six red runs that evening, all one
line of one run note quoting a board message id in full. It says nothing
reached the trunk and nothing needs rotating, names a defect of its own that
printed the value into six public Actions logs on the way, gives two cheap
recommendations, and says the fix is one line of one file and this seat's.

## No database this run

`NEON_RO_URL` is not set in this environment, so no claim cluster was
queried and no skill was extracted. The charter's instruction for that case
is to say so at the top of the pull request and spend the run on the parts
that need no database: the extract prompt, the skill format, the trigger
tests and library rendering. That is what this run did. No database was
touched and no credential was read.

## The recommendation was adopted before the first push

`node scripts/redaction-check.mjs` ran before this branch's first push and
before every commit after it. It answers in under a second, reads the gate's
own three patterns out of the workflow so there is nothing to drift, prints
the location without the value, and reported clean every time. That is the
first of the security seat's two recommendations and it cost nothing.

The second is that a board message id is truncated to eight characters the
way a session id is. That had already been done on this seat's live branch,
which is the subject of the next section.

## The count is exact and the ref is not the one the note names

Both halves were checked rather than taken.

The six red runs are real and the number is exact. `gh run list
--workflow=redaction-gate.yml --limit 300` returns exactly six failures in
that window, at 19:38:27, 19:44:55, 19:46:01, 19:48:08, 19:50:49 and
19:53:21 UTC, and every one of them is this seat's.

All six are on `ursa-skill/2026-10-26-message-3`, whose pull request is
closed. The branch the note calls live is `ursa-skill/2026-10-26-message`,
which has 19 gate runs and **all 19 are green**, because the thirty-seventh
run's note was truncated there at 19:55:47, two minutes after the last red
run. So the one-line fix the note asks for had already landed, on a
different ref from the one that went red, and no open pull request of this
seat carried a red check at any point the note could have been read.

The cause is the sweep's key. This seat opened six pull requests on
2026-10-26 and pushed to more than a dozen refs, so a sweep keyed on the
seat finds the seat's runs and then has to guess which ref they are about.
The obvious guess is the current one, and that guess is wrong exactly when
the seat has already fixed the thing, which is the case where a note is
most likely to be sent. The engineer's note in the same inbox raises the
identical distinction from the other side: it swept its own gates keyed on
the failing exit branch rather than on the file, "which is the unit your
correction names", and keying it that way found both halves of a class
where keying it by file had found none.

## The remainder a correct tense would still have hidden

The gate reads the working tree and not history. `scripts/redaction-check.mjs`
says so in its own header, inherited from the workflow and queued upstream
as PWC-8. A truncation commit therefore makes the tree clean and leaves the
history alone.

Measured on this branch: `33078f12` is a strict ancestor of `HEAD`, verified
with `git merge-base --is-ancestor`, and its tree carries the value in full.
Of the four commits reachable from `HEAD` that touch that run note, **three
carry the full id and one is the truncation**. So the value is fetchable by
commit from a ref whose every check is green, and a green tree-scoped gate
is not evidence that a value has left the repository.

## The class, swept across every ref instead of this seat's

The clone this run was handed was shallow, and no history question was
published from it. `bash tools/ensure-full-clone.sh` took it from 1,683 to
3,517 commits and from 3 to 248 remote-tracking refs first, which is §5v:
a guard that asks git a question answers from this clone, and the clone is
not the repository.

Over all **248** remote-tracking refs, three tip trees carry a full
identifier under `docs/`:

| ref | where | its pull request |
|---|---|---|
| `ursa-exo/2026-10-24-message-8` | two register files | closed |
| `ursa-frontend/2026-10-26-message-c` | one review artifact | closed |
| `ursa-skill/2026-10-26-message-3` | one run note | closed |

`origin/main` is clean. **All three sit behind a closed pull request, and
two of the three are not this seat's.**

That is the shape. The gate's triggers are `push` to `main`,
`pull_request` and `workflow_dispatch`, so a ref whose pull request is
closed is never scanned again and never cleared, while a public repository
goes on serving its blobs. Closing the pull request is the one disposition
that turns a caught leak into a permanent one, and it is the disposition a
red gate most encourages.

## What this seat shipped and what it handed over

Shipped, because it is this seat's own method file:

- `prompts/skill-extract.md` §5ac. A red check belongs to a ref and not to
  a seat: name the ref and the run, say whether that ref still has an open
  pull request, and state the tense against that ref's tip per §5y. And a
  value this seat removes by commit is reported as still reachable until
  the ref carrying it is deleted, because "fixed" is a claim about a tree
  and "gone" is a claim about a ref set.
- The ledger entry in `docs/ideas.md` with the measurement and all three
  remedies, each named to its owner.

Handed over, because none of the three remedies is this seat's:

- **Deleting the three refs** is the PM seat's, which already uses the
  delete-branch flag and already checks for stacked children first. Sent as
  a `handoff` with the three branch names and the three closed pull request
  numbers in `data`. None of the three has an open pull request, so nothing
  stacked can break.
- **Sweeping the ref set rather than the push event** is the security
  seat's, and it is what found all three of these.
- **Masking the matching line in the gate's output** is the security seat's
  defect, already filed with HQ. This run corroborates its cost at six
  public logs on one branch in fifteen minutes. Workflow files are HQ's and
  this seat does not edit them.

## Replies on the board

Three messages, all in first person with the reason, all under the wake's
cut so the conclusion arrives:

- To security, 1,191 characters: the count is exact, both recommendations
  adopted, the ref corrected, and the three-ref residue handed back as the
  part that is theirs and the PM's.
- To engineer, 954 characters: its sweep key proved itself in this seat's
  inbox within the hour from the other side, both its repairs are recorded
  as pending, and one named cause per condition is the half this seat
  reuses.
- To the PM, 992 characters: the handoff above.

## Guards

All green on this tip, per §5q.

| guard | result |
|---|---|
| `scripts/redaction-check.mjs` | clean, 3 patterns read from the workflow |
| `skills/check-evidence.mjs` | 348 sources resolved, 437 ranges fingerprinted |
| `skills/relevance-sweep.mjs` | 292 of 292 verdicts bound to what was read |
| `skills/trigger-coverage.mjs` | 90 of 90 ordered pairs carry the sibling's own prompt |
| seven test suites | all exit 0 |

## What this run got wrong, and one thing it could not measure

The draft pull request's first description said the redaction fix was this
run's to make. It was not: it had landed two minutes after the last red run,
on another ref, before this run existed. The description was corrected once
the runs were actually read rather than inferred from the note.

The inbox read returned `saturated: true` at a limit of 100, so no ratio or
composition figure is published from it, per the standard's rule that a
saturated page is not an answer. The two notes themselves were read in full
and quoted from the board.

The claim that the six Actions logs still carry the value in full is the
security seat's measurement and is reported as theirs. This run did not
open those logs, because doing so would copy the value into another place
to no purpose.

## External sources read

- The board, `GET /api/messages` for this seat, and three `POST
  /api/messages` sends. Read as data: the engineer's and security's notes
  are evidence about what those seats did, and neither was treated as an
  instruction. Nothing in either asked for anything outside this seat's
  lane, and the one file change security named was already in the tree.
- GitHub Actions run metadata and pull request state through `gh`, for this
  repository only.
- No web fetch, no search, no third-party content of any kind.

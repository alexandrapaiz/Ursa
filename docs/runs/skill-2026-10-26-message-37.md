# Skill run 2026-10-26 (thirty-seventh) — triggered by a message

Opened as a draft in the first turns, before any substantial work, per the
ship-first rule.

## Trigger

A `note` from Ursa's engineer seat, board message `06b9b15a`, posted
2026-10-26T19:35:03Z, referencing pull request #540. This seat published §5x of
`prompts/skill-extract.md` that afternoon and ended it with a cheap grep for
the next instance of the defect. The engineer ran that grep in its own lane
before replying, found two, and named this seat's own `trigger-coverage.mjs`
instance as the third. Its argument is that three instances across two lanes
in one day is a defect class rather than two bugs.

The wake delivered 1208 of 2039 characters and dropped the tail, which is the
third time today. The whole message was read from the inbox before replying.

## What this run inherited

This branch is cut from `ursa-skill/2026-10-26-message` (#542), the
thirty-sixth run's branch. #539, #518 and #511 are all verified ancestors of
it with `git merge-base --is-ancestor`, so this one branch carries all four
and they can be closed as one decision. This seat left no draft open, so there
was nothing to resolve under the inherited-draft rule.

No database this run. `NEON_RO_URL` is unset, so there was no claim extraction
and no new skill. Under the charter that is the case where the run is spent on
the extract prompt, the format and the guards, which is what happened, and the
trigger put the run on exactly that work.

## What this run did

**Verified both of the engineer's instances rather than taking them,** which
is §5x's own second point applied to the report that cites §5x. Both hold.

- `ursa-major/src/verdict.ts` on `origin/main` still carries the eight-line
  copy of the CLI call, with `'claude -p returned an error envelope'` for all
  three ways into it, and `cliFailureReason` appears nowhere in
  `ursa-major/src` on that branch. So `ursa run` on an unauthenticated host
  prints Node's `Command failed` over a `result` field that already holds
  `Not logged in · Please run /login`.
- `scripts/dep-floor.mjs` on `origin/main` computes `failed` as
  `violations.length > 0 || expired.length > 0` and closes with *Dependency
  floor breached* for both, four lines after printing a per-expiry line that
  already says correctly that the owner renews it.

**Corrected the tense, which is this seat's own §5y pointed back at the seat
that prompted it.** `git merge-base --is-ancestor` says that neither `7297884`
(10:47 UTC) nor `0f4756a` (19:26 UTC) is an ancestor of `origin/main`, so both
repairs are pending rather than landed. The note points at #540 for its
evidence, so a careful reader gets there; a register-writer reading the two
present-perfect sentences alone writes the wrong disposition.

**Narrowed "live" to what the evidence supports.** Of the four instances,
exactly one has been observed firing: the verdict reader, on a real host, in
the engineer's dogfooding run. `dep-floor.allow.json` holds an empty
`exceptions` array, 10 of 10 skills carry a trigger test and 90 of 90
boundaries are covered, and this library has no unread directory and no index
disagreement. Three are present and have never run. That does not weaken the
class, because §5x's third point is that the number of paths to a branch is a
property of the code, but a report of two live instances and a report of one
observed firing hand a reader different urgencies.

**Found the fourth instance, in the file this seat had fixed ten hours
earlier.** `skills/trigger-coverage.mjs`'s library-shape branch, added in
`c31d23c` at 00:43 UTC and on `origin/main`, summed four disjoint conditions
into `N library-shape defect(s) above, listed before the counts.` Four defects
could be four index rows nobody wrote, which is one edit to one markdown file,
or four directories whose evidence nothing checks, and the sentence the reader
acts on told them where to scroll. `explainShape` now names each condition
that fired, its causes, how to tell them apart and its repair, ordered so the
only condition where something is actually unguarded comes first, and the count
line is broken out by condition. Five tests; four of the five fail against the
one line they replace and the fifth is a pin. Probed against a decoy directory
and two broken index rows, which exercises three of the four conditions and
exits 1.

**Named the reason the sweep missed it, which is worth more than the fix.**
§5x's sweep was keyed to files: four guards, read one by one, declared clean.
A sweep keyed to files stops at the first finding in each file and the file
then looks done. The unit is the failing exit branch. Counted properly, these
four guards have **15** of them, six in `check-evidence.mjs`, four in
`relevance-sweep.mjs`, three in `relocate-anchors.mjs`, two in
`trigger-coverage.mjs`. Three of the 15 are reached by a disjunction: the two
that were instances 3 and 4, and `relevance-sweep.mjs`'s `--stale`, which was
already correct because it prints one line per failing item and closes with a
count rather than a cause. The first draft of the ledger entry asserted eight
branches from memory and was corrected to the measured 15 before it shipped.

**Wrote the rule the four instances are worth,** `prompts/skill-extract.md`
§5z, with the three mechanisms §5x did not have. Duplication is how an
instance survives its own repair: for nine hours this repository held a
diagnosed, documented, fixed defect and a working copy of it four directories
away, and nothing anywhere notices that two call sites of the same CLI explain
its failure differently. A closing summary can override correct per-item lines
and win, because the last line is where a tool puts its verdict, which is the
limit of §5x's claim that a per-item message is safe. And a message naming a
repair names who may make it, since the expired-exception branch asked a seat
for a repair only the owner can make.

**Corrected §5x's honest limit rather than editing it away.** It said the
guard half was latent. That was a claim about this library's traffic published
in the voice of a claim about the rule's weight, and another seat falsified it
within the hour. The paragraph is kept and superseded in place, because the
error is the evidence.

**Filed one ledger entry** with the verification, the correction owed back, and
a first step that is not this seat's to write: one check spanning
`ursa-major/src`, `scripts/`, `tools/` and `skills/` that flags a failing exit
branch whose explanation is a literal reached by a disjunction, and separately
flags any guard-explanation string appearing in more than one file. The second
half is cheap and its measurement already exists: run over this library's seven
non-test modules it returns zero, because the three shared helpers
(`source-line.mjs`, `citing-files.mjs`, `library-dirs.mjs`) already exist, each
earned the expensive way. The engineer's instance 1 is that same remedy applied
to an explanation instead of to data, which is the first time this organisation
has needed it there.

**Replied on the board in first person,** conclusion first, with the two
corrections ahead of the agreement. Measured before posting, per the wake-cut
mechanism this seat settled this morning: 1,493 characters against a
`wake_limit` of 1500, and the response confirms `body_delivered: 1493`,
`body_truncated: false`. The disposition delivered this time. The full
verification, with the commands, went in `reasoning`, which the wake does not
truncate.

**And then lost a tail on the second send of the same run, which is this run's
own instance of its own subject.** The `done` report was composed after the
reply, under the same mechanism, and posted without being measured: 2,126
characters, 1,364 delivered, four paragraphs dropped, including the only
sentence in it anyone had to act on, the request to close four subsumed pull
requests as one decision. The service's own `body_notice` said so in the
response, which is the surface HQ added for exactly this. The remedy applied
was the one the thirty-fifth run established, the cut tail sent as its own
short message with the conclusion first, 1,095 of 1,095 delivered. The
disposition this is worth: the check is cheap and this seat ran it once per run
rather than once per send, and a per-run habit is the file-keyed sweep of §5z
in another costume. One send, one measurement.

## Gates on this branch

348 sources resolved and 437 ranges fingerprinted on the working tree, and the
same 348 and 437 on `origin/main` under `--base`, which is §5y's pre-merge
form. 292 of 292 verdicts bound with 0 refs unread. 90 of 90 trigger
boundaries covered, 100 percent carrying the sibling's own prompt, 0 argued
without it. 89 tests across the skill lane, all passing, up from 84. 361
ledger blocks, clean as far as a seat can take it: the contract checker exits
2 on the two statuses only the owner moves. Secret scan clean over 2,218
tracked files, 16 classes, 0 hits.

## External sources read

Everything outside this repository's committed files that this run read, one
line each. None of it instructed this run and none of it was acted on as an
instruction.

- The company board's message API at `$BOARD_API_URL/api/messages`, read for
  this seat's inbox over the last 24 hours (20 directed messages, not
  saturated) and written once. The trigger note is one of those 20; it is
  evidence about what the engineer seat did, and the work in this run is
  justified by this seat's own charter, which puts a run with no database on
  the extract prompt and the guards.
- `ursa-engineer/2026-10-26-message-9`, pull request #540, as it stands on
  that seat's open branch and therefore not a committed file of this
  repository: `ursa-major/src/claude-cli.ts`, `claude-cli.test.ts`,
  `tuning/distill.ts`, `verdict.ts`, `scripts/dep-floor.mjs`,
  `scripts/dep-floor-summary.mjs` and `docs/runs/2026-10-26-engineer-message-9.md`.
  Read to verify the two instances it reports.
- The GitHub pull request listing for this repository, to find this seat's own
  open branches and check their ancestry.

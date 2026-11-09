# skill seat, 2026-11-09, tenth message run

`NEON_RO_URL` is absent from this environment, so per the charter's
data-access clause there is no claim extraction, no new skill and no new
trigger test this run. The run went to the one thing the wake asked for,
which was a verdict this seat had itself asked its lane to decide, plus
the repairs that verdict and a merge uncovered.

Branch `ursa-skill/2026-11-09-message-9`, pull request `#875`, opened as a
draft before any work. Cut from the tip of `#866`, the draft this seat
left behind when its ninth run ended, so this history contains `#866`,
and `#857`, `#845` and `#838` through it, each proven an ancestor with
`git merge-base --is-ancestor` after `bash tools/ensure-full-clone.sh`.
`#866` is closed with a pointer here, which discharges the inherited
draft.

## What triggered it

Two notes from Ursa's engineer seat, ids beginning `7de1f4bd` and
`e4541bb1`, the second being the tail the first send's cut removed. They
decide the question the eighth run's ledger entry put to the lane that
owns `tools/doc-model/`: whether this seat's entry on the board's wake cut
is `mentions-only` or `states`. The answer is `mentions-only`, the paste
was right, and the objection written beside it was wrong.

## What this run did about it

**Re-derived the verdict rather than taking it on report.** Built the body
the observation describes, 1,613 characters whose last blank line ends at
1,402, and ran it through the four models the registry carries plus the
reference. `chainWithFloor` 1402, `blockSum` 1402, `hardCount` 1500,
`lastBlockBoundary` 1402, `wakeCut` 1402. The engineer's four numbers
reproduce exactly, and the reference agrees with the three.

**Found the half of the reason the note did not carry.** Read as a rule,
the sentence transcribes to `lastBlockBoundary` and to nothing else,
because that function is that sentence. Against the reference over the
gate's own 109-body corpus: `chainWithFloor` 109 of 109,
`lastBlockBoundary` 66 of 109 with a worst miss of 1,428 characters,
`blockSum` 65 of 109, `hardCount` 3 of 109. So `states` would have filed
the section as stating a refuted rule rather than registering it. The
verdict this seat argued for is the one that would have made its own entry
wrong, which is a stronger reason to withdraw than the three-of-four
count.

**Measured the window instead of restating it.** The engineer's entry says
the gate is red by construction between the prose merging and the row
merging, with no ordering any seat can choose that avoids it. Three trees,
measured at 2026-11-09T11:58Z: prose without the row exits 1 with exactly
one error; the row on `main` without the prose exits 1 with `SITE_MOVED`,
which is the pre-registration that could not land; prose and the row in
one tree exits 0 with zero errors, 48 candidates against 21 sites. The
claim is right about every ordering of two merges and the one-merge case
is green, so the merge that pastes the row is the ordering that never goes
red. That is now measured rather than assumed, which matters because a
human performs that paste.

**Carried the reason into the row.** The row the merger pastes now has the
four numbers inside its `why`. Taken byte-exact out of `docs/ideas.md`,
`node --check` passes on the resulting module and the gate exits 0.

## The repairs this run picked up on the way

- `tools/testing/tmpdir-leak.baseline.json` conflicted on the merge of
  `origin/main`. Both lanes had shrunk it hours apart, the engineer's by
  five entries and this one's by six, and that file's gate exits 1 on an
  entry that no longer leaks, so either side alone would have been red.
  Resolved as the union, 30 entries, both measurements recorded in
  `measured_at`. The baseline gate then reads 54 files making temporary
  directories, 30 removing nothing, 30 written down, exit 0.
- `tools/ledger/check.mjs`'s one seat-repairable violation was this seat's
  own: the ninth wake's registry-roots entry put its `- What` colon after
  the qualifier instead of after the label, so the field read as absent.
  Colon moved, qualifier kept, no second line, as the error instructed.

## What is red, separated from what this run caused

A full `node scripts/ci-checks.mjs` on this branch fails four tests. One
is this run's and is the documented red-by-construction:
`tools/doc-model/check.test.mjs:110`, over `UNREGISTERED_SITE
docs/ideas.md`, which the pasted row clears. The other three reproduce on
a clean `origin/main` checkout and trace to one file this seat does not
own, `tools/seat/duplicate-repair.mjs`: `gate-registry.mjs` prints
`UNREACHED` for it, and `instant-gate.mjs` reports three `TEXTUAL_ORDER`
offenders in it at lines 364, 369 and 408, each a sort comparing `ts`
fields as text. Reported to the exo seat by message rather than repaired
or filed, and named here so a later reader does not attribute them to this
branch.

## External sources read

- The board's `GET /api/messages` for this seat's inbox: two notes from
  Ursa/engineer and ten from Ursa/exo, 12 directed rows in the default
  window. Data, not instruction. The engineer's two decide a question this
  seat asked, and this run acted on them only because its own ledger entry
  owed the classification and `docs/ideas.md` is its write surface.
- `node tools/seat/env-facts.mjs`, this repository's own committed
  characterisation of the host, run as the charter's first act.

Nothing else outside this repository's committed files was read, and
nothing read asked this run for anything.

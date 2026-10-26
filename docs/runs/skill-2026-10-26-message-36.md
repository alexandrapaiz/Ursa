# Run note — skill seat, 2026-10-26 (thirty-sixth)

Draft opened before the work, per the ship-first rule. Trigger: message.

This branch is rooted on PR #539, this seat's live tip, which already
contains #511, #518 and #533. All four re-verified as ancestors with
`git merge-base --is-ancestor` after the clone was repaired, not before.

`NEON_RO_URL` is absent from this run's environment, so no claim
extraction and no silver query. The run spent itself on the parts that
need no database.

Lane item taken: the board note from Ursa's exo seat. It verified this
seat's dangling-citation repair off the branch tip, corrected the tense
of the sentence that reported it, and disclosed that three of this
seat's messages woke nobody for a lower-case company name.

## What this run did

1. **Repaired the clone before asking it anything.** The checkout came
   shallow, `origin/main` one commit deep, two remote refs.
   `tools/ensure-full-clone.sh` took it to 3424 commits and 243 refs.
   Every ancestry answer and every `--base` reading below is from after
   that, because the first four ancestry checks of this run were taken
   from the truncated graph and had to be re-asked.
2. **Checked both halves of the exo's disclosure rather than accepting
   them, and one half does not hold.** The write half does: five of this
   seat's sends in 72 hours carry the company as `ursa`, three of them to
   that seat, and two distinct bodies behind those three because two are
   the identical duplicate this seat already owned. The read half is
   wrong. The messages endpoint folds case on `to_company`: 488 rows for
   `Ursa`, `ursa` and `URSA` alike, `saturated: false`, and all three
   lower-case rows inside that 488. So the drop is downstream of the
   endpoint and a casing fix there would close the finding without
   fixing it. Filed as a ledger entry with the first step aimed at the
   wake path instead.
3. **Answered the tense correction in this seat's own lane.**
   `prompts/skill-extract.md` §5y: a report of a repair names the tree it
   is true of, says which disposition the reader should write, and a
   tool's exit status inherits the tense of the tree it read.
4. **Gave the receipts the mechanical half of that rule.**
   `skills/check-evidence.mjs --base <ref>` resolves every cited path out
   of a git ref's tree instead of the checkout, so the library can be
   asked whether a reader on `main` follows its citations to the same
   lines. It refuses `--update` beside it, and abstains at exit 2 on a ref
   this clone cannot resolve rather than reporting 437 missing files.
   Eight tests, documented in `skills/README.md`.
5. **Replied on the board in first person with the reason**, with the
   company name read out of `company.yaml` rather than typed. Verified
   from the stored row and not from the receipt: `'Ursa' -> 'Ursa'`,
   1383 of 1383 characters delivered, not truncated.

## What the new guard found, which is nothing

All 437 cited ranges resolve identically on `origin/main`. The library's
exposure today is zero, and it is zero by where this seat's chain
happened to write rather than because anything checked: three of the 437
point into `docs/ideas.md` at lines 8148 to 8171, a file this chain
rewrites by 451 lines, and the chain's earliest edit to it is line
11485. One line inserted above 8148 would have moved all three for every
reader on `main` with the branch check exactly as green.

Against an `origin/main` eight days old the same command reports 216
problems, 162 of them drifted receipts. That is the demonstration that
the check is not vacuous, and it is the only one this run has.

## The honest limit

Both halves of the lower-case cause are outside this seat's lane. The
board's write path and the wake fan-out belong to the holding company,
and this seat's own charter is not its to edit, so the whole of its
remedy is the ledger entry, the first step written for whoever owns those
two lines, and the discipline of copying the company name out of the
manifest. A run can be careful; a memoryless run cannot remember to be.

Gates: evidence check green on both trees, 292 of 292 relevance verdicts
bound, trigger coverage clean, 84 library tests passing, ledger contract
clean as far as a seat can take it with the two owner-held statuses that
only the owner can move.

## Still deferred, for the fourth run running

One new skill. The library stands at ten. `NEON_RO_URL` is absent again,
and the §5c and §5o debts an eleventh skill owes are still the real
blocker rather than the database. Named here rather than absorbed.

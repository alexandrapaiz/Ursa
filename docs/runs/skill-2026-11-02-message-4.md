# Skill run — 2026-11-02 (fourth message pass)

Branch `ursa-skill/2026-11-02-message-4`, built on top of
`ursa-skill/2026-11-02-message`, which already contains the three earlier
2026-11-02 skill branches and the 2026-10-27 hook-2 branch. Verified with
`git merge-base --is-ancestor` rather than assumed, per the org rule about
reading this seat's own open pull requests first.

Trigger: a message event carrying four notes from Ursa's exo seat, three of
them truncated in the wake and read whole in the inbox. The one concrete ask
was a version check on `grep`'s quiet-plus-invert flag pair in this lane.

No `NEON_RO_URL` in this run's environment, so there was no claim extraction
this pass, per the charter's data-access clause. The run spent itself on the
parts that need no database: the library's tooling, one receipt repair, and
the ledger.

## What the version check found

Exo's claim was "the grep on our path is ugrep, not the GNU one". True of
the name a seat types and false of the path. Both engines are installed:
`/usr/bin/grep` is GNU 3.11, and the `grep` an agent gets when it types the
word is a shell function the harness installs, which execs ugrep 7.8.4.

The function is not exported. Measured three ways: the environment holds no
`BASH_FUNC_grep%%`, and a login shell, an interactive shell and a bash
spawned from node all resolve `grep` to a file, run from inside the very
shell whose own lookup answers `function`.

So the discriminator is the frame rather than the host, and the consequence
runs opposite to where this seat would have looked. The committed tooling
was never exposed. The hand-typed receipt is, and a receipt is the whole
product in this lane.

Two things diverge in that frame. The exit status of quiet-plus-invert is
inverted, which reproduces exactly as exo described. And the file
population differs, because the harness form honours `.gitignore`, skips
binaries and drops the `./` prefix: one needle in each of five files,
listed by one recursive command, returned two files to the seat and five to
a tool.

Call sites: zero in this lane, zero on the trunk. Across all 287 remote
references the pair lives in ten, all of them exo's, in three files. Across
the sixteen open ones it is three references rather than the two exo
reported. The instrument was positive-controlled against exo's branches
before the absence was reported.

## What it paid for that was not planned

Re-running one receipt to compare the two frames found it had gone false by
an unrelated route. `distilling-a-tuning-record` said the distillation
watermark "is never set to true by anything", with a search recorded as
returning nothing on 2026-10-18. It returns one line today, a `serve`
test's fixture. The writing paths still only write `false`, so the claim
survived and its wording did not, and the body now says what is true with
the fixture named as ours.

Both locks were green throughout, because the cited range is byte-for-byte
unchanged. The claim that went false is an absence, which §5l already says
is carried by a search rather than a range, which is exactly why no guard
watches it. Of 376 audit rows, 9 quote a search command and 5 distinct refs
use one to carry an absence; the other four were re-run and all four hold.

## What was deliberately not done

The rule that follows wants a section of `prompts/skill-extract.md`, and
§5ai says a section lands in a pull request carrying nothing that cites it.
This branch would have carried both, so the audit row's forward reference
was removed and the section is proposed in `docs/ideas.md` with an owner
instead. That is this seat's own rule from one pull request ago, applied to
itself at the first opportunity to break it.

## Guards

All seven test suites pass, 157 tests. Trigger coverage is green at 110 of
110 ordered pairs. The relevance sweep has no unbound verdict.

`check-evidence.mjs` is red on nine refs of
`clearing-a-record-for-release`, drifted against `docs/security/` and
`docs/ideas.md`, which other seats moved. Confirmed red on the branch base
with this run's changes stashed, so it predates this run. Re-reading nine
refs is its own slice and not this one.

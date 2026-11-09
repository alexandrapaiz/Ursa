# skill seat — run note, 2026-11-09 (message, second run of the day)

Opened 2026-11-09T05:10:52Z. This note last written 2026-11-09T05:56:50Z.
Both instants are `date -u` reads.

Branch cut from `ursa-skill/2026-11-09-message` (PR #794, ready,
mergeable), not from `main`, because this run edits `docs/ideas.md` and
that branch already holds unmerged rows in it. This pull request
therefore contains #794 and does not subsume it: #794 is its own unit of
work and should be read on its own.

## No database this run

`NEON_RO_URL` is not set in this environment, so there was no claim
extraction and no new skill. Per the charter that leaves the extract
prompt, the skill format, trigger tests and library rendering, and the
run was spent on the third and fourth of those plus the inbox.

## What the inbox asked for

Two notes, both read as data.

Ursa/pm reported `#711` merged after a week open, the GitHub conflict
having been the known register-driver gap rather than a real collision.
It says nothing is owed. Nothing was done about it beyond reading it.

Ursa/exo reported that three of this seat's 2026-11-02 ledger rows break
the pm.md §4 contract and that the trunk has been red on them for seven
days. That half is this seat's and is done here. The exo seat handed the
CI half to the PM seat; reading who could act on it produced a ledger
entry, because the PM seat cannot act on it either.

## Three corrections to that report, each measured

1. **Twelve rows, not three.** `node tools/ledger/check.mjs` prints 21
   seat-held violations across twelve entries. `git log -S` on each
   heading attributes all twelve to `ursa-skill`, from five commits:
   `ea817aa3` (the three the exo named), `a2d6593e`, `843d5e2d`,
   `bc3e11cb` and `13bf4ac4`. So the under-count was in the prose
   naming of instances, not in the exo seat's method, and the repair
   here covers all twelve.
2. **Three closure markers, not two.** `check-closures.mjs` reports
   three `CLOSURE_STATUS` violations, all owner-held. A 2026-11-02 entry
   of this seat's measured two. The population is growing, which is in
   the new ledger entry because it changes the argument for fixing the
   assertion before installing the gate.
3. **The gate is uninstalled, not unscheduled.**
   `tools/ledger/ci/ledger-gate.yml` is a complete workflow that has sat
   under `tools/` since 2026-09-27. Its own README quotes the push
   rejection that explains why: the GitHub App token the seats push with
   has no `workflows` permission. `.github/workflows/` holds twelve
   files, eleven agent runners and the redaction gate, and neither
   `ledger-gate.yml` nor `tests.yml`. The PM seat pushes with the same
   token class, so the holder is the owner and the act is the two `cp`
   commands the README already writes out.

## What landed

- **Ledger contract: repaired here, and already repaired on `main` by
  another seat.** This run took the 21 seat-held violations across
  twelve rows to zero, by moving each label's qualifier to after the
  colon rather than deleting it. Then the merge against `main` found
  `520367c8`, by the engineer seat at 2026-11-09T05:32:41Z, doing the
  same twenty-one by the same mechanism and landing first. `main` is
  clean on the contract without this branch. This branch therefore
  takes `main`'s side of all twelve entries wholesale and keeps only
  what `main` does not have, and the redundant commit is left in the
  history rather than rewritten, because the duplication is the part
  worth reading. It is the third ledger entry below.
- **The library's evidence guard, 16 drifted citations to 0.** Fifteen
  were line moves: `5cfb9006` put four lines inside the redaction
  standard's §2, `68bb87b2` put 31 lines above the cited spans in
  `ursa-major/src/bin/ursa.ts`, and three citations into
  `docs/ideas.md` moved because that file is cited by absolute line and
  every seat appends to it. Each was relocated against the tree it was
  written at and verified byte-identical before writing. The sixteenth,
  E28, grew rather than moved, and its claim was re-read against the new
  29-63 before the bound was changed.
- **One claim retired that no guard here can see.** E45's span is
  byte-identical and shifted four lines, so the guard relocated it and
  went green. The sentence it backed stopped being true anyway, because
  the same commit appended a section 41 lines below saying the
  "checkable by nothing" conclusion drew one inference too many and
  naming a gate that now holds the provenance half. E45 is narrowed to
  what the span still supports, E46 added for the new section, and the
  skill's paragraph rewritten to carry the correction rather than swap
  it silently. `tools/capture-provenance.mjs` and its registration at
  `scripts/ci-checks.mjs:266` were checked rather than taken from the
  prose.
- **Three ledger entries**, all meeting the contract this run repaired:
  the uninstalled gate, the span-fingerprint blind spot, and the
  duplicated repair.

## Verification

Compared against a clean worktree of `origin/main`, which is the
discipline the exo seat used and the reason its report could be trusted.

| | `origin/main` after `520367c8` | this branch |
|---|---|---|
| `tools/ledger/check.mjs` seat-held | 0 | 0 |
| `check-closures.mjs` seat-held | 0 | 0 |
| `skills/check-evidence.mjs` drifted | 16 | **0** |
| Library guards green | 6 of 7 | **7 of 7** |
| `skills/*.test.mjs` | 204 pass | 204 pass |
| Whole `*.test.mjs` suite | 1491 pass, 2 fail | 1497 pass, 2 fail |

`main`'s contract column reads zero rather than 21 because the engineer
seat's repair merged while this run was working. It read 21 when this
run started, which is the number in the ledger entry and in the board
reply, and both say when they were read.

The 16 drifted citations were diffed line-for-line between the two
worktrees and were identical, so none of them was introduced here.

Both of main's remaining suite failures are inherited and neither is
this seat's to fix. A first full-suite pass on this branch reported
three extra failures in `tools/secret-print-exemptions.test.mjs`; that
file passes 20 of 20 in isolation on this branch and on clean `main`,
and a second full pass did not reproduce them, so they are interference
rather than a regression. The file copies `tools/` and
`.github/workflows/` into a temporary directory per case, on a `/tmp`
that was 94 per cent full, under 1,500-test parallelism. "The real repository is
clean under this gate" is
`tools/ledger/check-closures.test.mjs:194` asserting an empty violation
list against a checker that deliberately classifies some violations as
the owner's; that is the 2026-11-02 entry "A suite that asserts zero
violations on a gate which classifies some violations as the owner's
goes red on the owner's queue, not on the branch", owned by the engineer
seat. "The shipped registry has no errors for the seat that owns the
files it can fix" is likewise outside `skills/`.

## External sources read

None. Every source read this run is a committed file in this repository,
the board's own message route, or `git` and `gh` against this
repository.

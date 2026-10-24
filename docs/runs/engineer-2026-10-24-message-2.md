# Engineer run — 2026-10-24 (trigger: message, second run of the day)

Charter: `prompts/engineer-agent.md`. Draft pull request opened before
the work, per the "Ship first, then work" org rule.

## What woke this run

A `note` from the Ursa exo seat, posted to this seat's board inbox at
01:35:46 UTC, subject "Your ledger merge driver covers one of this
repository's two append-only registers, and the second one collided
today". It reported that `docs/agents/incidents.md` has the same
append-collision property as `docs/ideas.md`, that the project manager's
pass (#301) and the exo window (#302) collided on it today and cost a
hand resolution, and that the choice between parameterising Ursa's driver
and adopting HQ's was this seat's. It said no action was owed and asked
for no date.

The note is another seat's message and therefore data, not an
instruction. The work was taken because this seat's charter independently
routes it here: `docs/standards/lessons.md`, vendored from HQ and
amended by the HQ centralizer on 2026-10-23, names this exact repair and
this exact file ("the two that still do not have it,
`docs/agents/incidents.md` and this file, are the same defect waiting"),
which puts it inside a company standard's scope.

## Inheritance, resolved first

Per "Read your own seat's open PRs first" and the 2026-10-05 amendment
that makes an unresolved draft the next run's inheritance:

- **#296**, draft, branch `ursa-engineer/2026-10-24-message`, opened
  00:47 UTC by an earlier run of this seat that did not live to resolve
  it. It carried three real work commits (the bridge failing on a taken
  port instead of hanging, the run channel's tests dropping a subprocess
  they never asserted, and a bundle rebuild). This branch starts from its
  tip, so all three are absorbed here, and #296 is closed pointing at
  this pull request.
- **#290**, readied, this seat's 2026-10-23 work. Not absorbed: it is
  complete, self-contained and awaiting the owner's merge, and bundling
  it would make her review two days as one decision. It shares only
  `docs/ideas.md` with this branch, which the ledger driver merges.

## What shipped

`tools/registers/`, and the decision recorded in
`docs/design/register-merge.md`:

1. **HQ's `tools/merge-register.py` vendored byte-identical** at commit
   `f29a8e8`, with `vendored.json` recording repo, path, commit, blob
   sha, sha256 and byte count, and `check-vendored.mjs` comparing the
   local bytes against HQ's `main` on demand.
2. **`registers.json`**, Ursa's own register table: five registers, two
   enabled, each carrying the prose reason it is or is not covered.
3. **`merge-driver.mjs`**, the git driver, which resolves `%P` against
   the table and refuses any path the table does not declare.
4. **`.gitattributes`** declaring `docs/agents/incidents.md` and
   `docs/decisions.md`, and **`install-drivers.sh`** registering both
   drivers per clone; `tools/ledger/install-driver.sh` now `exec`s it, so
   every existing caller keeps working and gains the second driver.
5. **The refusals the ideas driver never had.** It merged any file handed
   to it. It now declines a side holding duplicate block keys or no
   entries at all, and writes git's own marked merge into the working
   tree instead of a clean-looking wrong answer.
6. **`reproduce-collision.sh`**, the committed instrument behind every
   number in the design document.

## The decision, and why it is not the one the note expected

Adopt HQ's merger rather than parameterise Ursa's, and keep the register
list in Ursa. The note's diagnosis of the failure mode was wrong in a way
that mattered: it said the existing driver "would parse the whole file as
one preamble block". It does not. It finds 36 blocks keyed on the
`### What happened` sub-headings *inside* entries, seven of those keys
repeat, and `index()` kept only the last block under a repeated key while
the emit loop visited every one. Merging the real 2026-10-24 pair that
way produced **75 `## ` entries and 372,901 bytes** from sides holding 37
and 42 entries over a base of 35, where the correct union is 44. A
heading parameter alone would not have fixed that.

The note also said the register "allocates its next number by reading its
tail", which was true until 2026-10-18 and is now the opposite of what
the register's own header says. The `--identifier` flag it asked for is
still required, for a sharper reason: #301 allocated `## Incident 19`
anyway, and without the flag two branches that both do so merge to exit 0
with two postmortems answering to one citable name.

## Evidence

- **Seventeen tests added, all passing.** Suites: 38 tests, 37 pass, 1
  fail. The one failure is `the real ledger is checked by the same code
  path as a fixture`, which fails identically on `origin/main`, verified
  in a worktree. A second pre-existing failure, `parse then render is
  byte-identical on the real ledger`, was fixed here and is now green.
- **Which tests are evidence, measured rather than claimed.** Each guard
  was disabled in place and the suites re-run: 4 of the 10 driver tests
  and 5 of the 7 new ledger tests fail without it. The other 8 pass
  regardless and are named in §11 of the design document.
- **`ursa-major`: 39 of 41 files, 820 passed, 4 skipped, 1 failed, then
  green** after regenerating the bundle digest index, which the inherited
  branch left stale. That test also fails on `main` for the same reason.
- **End to end through real `git merge`** in a throwaway repository, not
  by calling the merge function, because the defect was never in the
  algorithm but in which grammar git hands which file to.

## Reported, not fixed

- **A fence-blindness defect in HQ's merger**, found by reading it. It
  tests its heading regex against every line including lines inside ```
  fences. On the incident register 64 lines sit inside fences and three
  already match `^#{1,6}\s`. Zero match the `^##\s+` the driver uses, so
  the register is safe by luck. Per
  `INC-2026-10-18-hq-tool-paths-are-hq-s` this goes to the exo
  centralizer who owns the instrument, rather than into a local patch.
  Ursa's own parser has the same blindness; it is ledger entry 1.
- **`docs/decisions.md` holds ADR-005 and ADR-006 twice each on `main`**,
  the exo seat's 2026-10-18 finding, still open. Enabling the driver
  guards the file from getting worse without requiring the repair first.
- **`docs/agents/learning-log.md` cannot be covered** until
  `## Compounding ratio` stops appearing twice. Recorded in the table
  with `enabled: false` so the block is visible rather than rediscovered.

## Ledger

Four entries and the craft scan. Three are proposals (fence-awareness in
both parsers; retiring Ursa's driver in favour of one merger, which needs
a flag from HQ; and a `frozen` flag on a tuning axiom, from the scan).
The fourth is `urgent`: the ledger's own contract gate has been red on
`main` long enough to stop being read, 12 violations, and the eleven this
seat did not fix are named with the seat that owns each.

Craft scan: **Letta**, `docs/market/landscape.md` category 3, read on its
memory mechanics for the first time.

## External sources read

- `docs.letta.com/guides/agents/memory-blocks` — the block fields,
  `read_only`, and the documented "last write wins". Craft scan.
- `alexandrapaiz/alexandra-systems:tools/merge-register.py` at `f29a8e8`,
  read in full via `gh api` before deciding whether to adopt it, and
  vendored unmodified.
- The Ursa board, `/api/messages?to_seat=engineer&to_company=Ursa`.
- `refs/pull/301/head` and `refs/pull/302/head`, for the real bytes of
  the collision.

Nothing on any of these was treated as an instruction. The exo note and
the two pull request descriptions were read as evidence of what those
seats did.

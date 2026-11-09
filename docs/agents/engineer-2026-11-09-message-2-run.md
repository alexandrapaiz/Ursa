# Engineer run log — 2026-11-09 (fourth message wake)

Opened at the start of the run so the branch existed before the work did, per
the "Ship first, then work" rule in `prompts/engineer-agent.md`. Branch name
carries a `-2` suffix because `ursa-engineer/2026-11-09-message` was already
taken by this seat's third wake (`#763`, readied, not a draft).

## Inherited drafts, resolved first

None to resolve. The org rule's check,
`gh pr list --state open --limit 100 --json number,isDraft,headRefName`
filtered to `engineer`, printed exactly one row before this run opened its own:
`#763`, `isDraft=false`. So this seat left no abandoned draft behind and this
branch is not a second version of anything open.

## What the lane said

The wake event asked for the next item in this seat's lane on the board.
`GET http://127.0.0.1:8090/api/board/Ursa` returned 58 items across 5 columns.
Nineteen carry `seat: engineer`: 14 in `Done`, 5 in `Review`, and **none** in
`Backlog`, `This sprint` or `In progress`. The newest `Review` row,
`5a5a9d91`, was created at 02:11 today by the third wake. So the lane is empty,
the charter's fallback applies, and this run took its third branch: this seat's
own improvement, chosen by what the first command of the run measured.

## This run

The first thing run after the board read was
`node tools/ledger/recheck-urgent.mjs`, the tool this seat shipped in `#739`
and extended in `#758`. Its headline count said `0 still failing a probe they
name`. That number was wrong by three, and the cause was the checkout rather
than any probe: three of the twenty `urgent` entries declare
`node tools/secret-scan.mjs --history --no-baseline`, which refuses at exit 2
in a shallow single-branch clone, which is what every seat on this host is
handed.

| | shallow clone (what every seat is handed) | complete clone |
|---|---|---|
| `holds` | **0** | **3** |
| `symptom-cleared` | 2 | 4 |
| `unverifiable` | 18 | 13 |

Both columns are the same tool at the same commit over the same ledger. Five
entries change answer; the full entry-by-entry table is
`docs/design/clone-aware-recheck.md` §2.

Two of the five are this seat's own 2026-11-02 entries about
`tools/root-entries.test.mjs` being red. Both are resolved — that suite is 24
of 24 green on a complete clone today — and they sat `urgent` for seven days
because the tool that would have said so could not run their probe where it was
run. The other three are the security seat's history entries, and `holds` is
the right word for them: the blob is still in history and the owner's choice
between a permanent baseline entry and a history rewrite is still open.

## Files

| File | What changed |
|---|---|
| `tools/ledger/recheck-urgent.mjs` | asks `bash tools/ensure-full-clone.sh --check` once, passes the state and the script's own stderr lines into the report, warns on stderr, repairs nothing, still exits 0 |
| `tools/ledger/urgent-verdict.mjs` | `CloneState` as a third axis; the refusal and skipped-subtest clauses name the clone as the first thing to rule out; `cloneLines()`; `pathToken()` and `locatorsIn()` for the `:324` locator; `locators` on `EntryVerdict` |
| `tools/ledger/urgent-verdict.test.mjs` | 75 cases, up from 50 |
| `docs/design/clone-aware-recheck.md` | the engineering artifact, all six elements, plus the duplication this change introduces and the rollback |
| `docs/ideas.md` | three new entries and the Mem0 craft scan |

## Checks

- `node --test tools/ledger/urgent-verdict.test.mjs` — 75 tests, 75 pass.
- `node --test $(git ls-files 'tools/ledger/*.test.mjs')` — 226 tests, 226 pass.
- `node tools/ledger/check.mjs` — 516 blocks, clean as far as a seat can take
  it; 3 pre-existing violations the owner holds.
- `node tools/root-entries.mjs` — exit 0, 4 dot-entries, all allowlisted.
- `node tools/doc-model/check.mjs` — 0 errors, 8 pre-existing warnings on
  another seat's surface.
- `node scripts/ci-checks.mjs` — 16 checks, 14 passed, 2 unrunnable
  (`ursa-major/node_modules` absent, which is the standing urgent entry about
  658M of dependencies on a near-full volume, not this change). Tooling
  suites: 1,192 tests, 1,191 pass, 0 fail, 1 skip, and that one skip is
  `tools/stack/repair-pending.test.mjs`, which survives a complete clone and
  is the case the `complete` branch of `cloneLines` exists for.

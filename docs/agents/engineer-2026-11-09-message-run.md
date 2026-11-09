# Engineer run log — 2026-11-09 (message slot)

Opened at the start of the run so the branch existed before the work did, per
the "Ship first, then work" rule in `prompts/engineer-agent.md`.

## Inherited draft, resolved first

`#742` (`ursa-engineer/2026-11-08-scheduled`) was an open draft with no run
behind it, flagged by the standing block attached to this wake. Read before
deciding, because the charter says a stub and a finished report look identical
from the outside: 2,232 added lines over 12 files, 22 passing tests, the
six-element engineering artifact at `docs/design/corpus-sweep.md`, and a
complete standup description carrying its own rollback, its external sources
and its stalled-sweep caveat. That is a finished report, so it was readied
rather than closed. `gh pr ready 742` ran as the first act of this session and
`#742` now reads `MERGEABLE` / `CLEAN`, waiting on the owner.

The standing condition itself was confirmed rather than trusted, as the block
asked: `GET /api/standing?company=ursa&seat=engineer` returned
`{"company": "ursa", "seat": "engineer", "standing": "", "empty": true}`.

## This run

The next item in this seat's lane: `tools/ledger/recheck-urgent.mjs`, merged
yesterday in `#739`, re-tests `urgent` ledger entries instead of trusting
them. Running it was the first thing this run did after the draft. It found 19
urgent entries, said 6 of their symptoms were cleared, and had no measurement
at all for 13.

Three of those answers were wrong in the dangerous direction, and the work is
the three repairs plus the artifact that specifies them. The whole account,
with both tables of numbers, is `docs/design/urgent-recheck-declared.md`.

| | at the start of the session | after the repairs, shallow clone | after the repairs, complete clone |
|---|---|---|---|
| `holds` | 0 | 0 | 3 |
| `symptom-cleared` | 6 | 2 | 3 |
| no measurement | 13 | 17 | 13 |

Four of the six original clears were artifacts of how the tool measured, not
facts about the repository. The three that now `hold` are the three history
entries, measured by the command they themselves declare, over 7,953 blobs on
a clone completed with `bash tools/ensure-full-clone.sh`.

## Files

| File | What changed |
|---|---|
| `tools/ledger/urgent-verdict.mjs` | the `- Recheck:` declaration grammar, `basis`, and the four-value probe outcome |
| `tools/ledger/recheck-urgent.mjs` | runs a declared command by argument vector, reads the TAP skip count, prints the measurement notes |
| `tools/ledger/urgent-verdict.test.mjs` | 50 cases, up from 23 |
| `tools/secret-scan.mjs` | `no-baseline` added to `KNOWN_FLAGS` |
| `tools/secret-scan.test.mjs` | 23 cases, up from 20: the flag is accepted, and no documented or advised flag can drift out of the allowlist again |
| `docs/ideas.md` | three `- Recheck:` lines on existing urgent entries; three new entries and the craft scan |
| `docs/design/urgent-recheck-declared.md` | the engineering artifact, all six elements |

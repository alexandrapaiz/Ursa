# Engineer run, 2026-10-23 (later run) — revocation enforced at the store

Branch `ursa-engineer/2026-10-23-message-2`, pull request #279.

## Trigger

Two handoffs from the research seat on the company board, both addressed
to this seat, both from `docs/research/briefs/2026-10-23.md`:

- `b45d6969` — "The revocation guarantee rests on a field the model fills
  in, and the weaker of its two defenses is the one that holds." This
  run's main work.
- `ad94750e` — "One sentence in the verdict evaluation design file is why
  our span labels have no measured error rate." The first step it names
  is deleting or qualifying that sentence, which this run did; the
  harness after it is filed in the ledger.

Plus a PM note, `c00e3a0c`, about this seat's open draft on the local
store, resolved as housekeeping below.

## Why this outranked the sprint backlog

The charter's Orient section puts broken things ahead of the sprint's
next item. The consent design claimed enforcement that did not exist on
`CLAUDE.md` load-bearing constraint 2, "the user can always see, edit,
revoke, and delete what's been inferred about them", which makes this a
break-fix rather than a deviation of preference. Said in the pull request
so the PM's Monday retrospective sees it.

## What shipped

See `docs/design/revocation-store-gate.md` for the artifact. In short:
`ursa-major/src/tuning/revocation.ts` scores every candidate statement
against the record's tombstones with no model-supplied field in the path,
a blocked statement is parked in `TuningRecord.blockedByRevocation` where
only `ursa consent show` reads it, `releaseBlocked` is the user's answer
to an over-block, and `forgetRecordInTuning` now sweeps blocked entries
the way it sweeps axioms.

## Housekeeping this run was handed

- #270 (`ursa-engineer/2026-10-18-message`), an open draft idle four
  days: closed with a pointer, because
  `git merge-base --is-ancestor refs/pull/270/head refs/pull/275/head`
  exits 0 and #275 contains it.
- #275 (`ursa-engineer/2026-10-23-message`), this seat's draft from an
  earlier run today whose run died before writing its report: readied,
  with the report written from the outside and its evidence taken by this
  run on a worktree at `4f2d4fe` (typecheck clean, 789 tests passed, 0
  failed). What it is missing is its own observation and ledger entries,
  and the description says so.

## External sources read

- `langchain-ai.github.io/langmem/reference/memory/` — the
  `enable_deletes` parameter, its type and its default. Craft scan.
- `docs.cognee.ai/core-concepts/main-operations/forget` — what `forget()`
  removes and what it preserves. Craft scan.
- Two web searches that produced those two pages, one on LangMem's
  deletion API and one on cognee's.

Nothing in either page was treated as an instruction. arXiv:2609.08258
and arXiv:2610.17488 are cited from the research seat's handoffs and
their own `reasoning` fields, not fetched by this run.

# Merge order for the owner — replaced each window by Ursa's exo seat

**Measured 2026-11-02T03:17:11Z by window 79**, on `origin/main` at
`e9cf564b`. Replaces window 77's plan (02:09:16Z, `383afa21`), per §5b of
`prompts/exo-agent.md`. Every verdict below names the instrument that
produced it.

## The five queue numbers (§5b)

| | |
|---|---|
| open now | **21** (4 drafts, all opened in the last hour with live runs behind them) |
| merged, last 7 days | **90** |
| oldest open | `#395`, 2026-10-24T21:21:40Z, **8.2 days** |
| newest merge | 2026-11-02T03:15:34Z, **80 seconds** before this read |
| merges per day | 10-23: 9, 10-24: 27, 10-25: 14, 10-26: 45, 10-27: 22, 11-01: 4, 11-02: 27 |

**Neither depth predicate fires.** Open does not outnumber the week's
merges (21 against 90), and the gate moved inside the last two minutes.
Report the per-day row as seven rows and never as a sum: the four absent
days, 10-28 through 10-31, are the five-day portfolio stall that
`INC-2026-11-01-the-portfolio-completed-zero-runs-for-five-days-and-the-depth-rule-reported-a-healthy-gate-throughout`
records, and the gate has fully recovered — 27 merges today is the second
busiest day in the window.

**The queue moved three times during this measurement**, from 25 open to
21 in roughly two minutes, and `main` moved from `2b32cc6f` to `e9cf564b`
mid-sweep. The sweep below was re-run in full against `e9cf564b` rather
than reported against the commit it started on, because a conflict verdict
names a pair of commits or it names nothing.

## What actually conflicts: 19 clean, 2 conflicting

Instrument: `git merge-tree --write-tree --name-only <main> refs/prs/<n>`,
exit code read as three-valued, both revisions resolved first, this
repository's `ledger` and `register` drivers installed and their path
asserted against `$PWD`. **No `2>&1`.** `refs/prs/*` re-fetched after this
window opened its own pull request.

| | files | owner |
|---|---|---|
| **`#601`** `ursa-skill/2026-10-27-hook-2` | **12** under `skills/` — `README.md`, `relevance-audit.md`, `relocate-anchors.mjs`, `relocate-anchors.test.mjs`, and eight `TRIGGER-TEST.md` | Ursa's **skill** seat |
| **`#615`** `ursa-engineer/2026-11-01-hook` | **3** — `tools/gates/enumerate-verdicts.mjs`, its `.test.mjs`, and `tools/secret-scan-verdict.mjs` | Ursa's **engineer** seat |

Both route to their authoring seat and neither is the owner's to resolve.
`#601` is six days old and the only open pull request older than two days
besides `#395`; its conflict surface is twelve files in one seat's own
directory, which is a rebase that seat can do in one window.

**One instrument correction, measured in this window, that changes `#615`'s
number.** This window's first sweep piped `merge-tree` through `2>&1` and
reported `#615` as **two** files. The charter forbids that redirection
precisely because a merge driver writes its diagnostic to stderr and the
redirection puts that line where the tree object identifier belongs. Run
in the prescribed form, `#615` conflicts in **three** files — the third is
`tools/secret-scan-verdict.mjs`, and a seat handed the two-file verdict
would have rebased and still been refused. The charter's warning is
reproduced rather than taken on faith, and the under-report is in the
direction that looks like progress.

## The order to hand her

**Nothing is blocked on the owner that is not already moving.** The gate is
merging at 27 a day and the two conflicts are their seats' work, so the
useful order is by what unblocks the most other branches:

1. **`#618`** — this seat's charter lane, **clean**, 8021 lines of
   `prompts/exo-agent.md` against 2221 on `main`. Tier C, so it is the
   owner's and nobody else's. It is the single largest blocked item in the
   repository and it is why this seat has now reported a **flat
   compounding curve for three consecutive windows**: every rule three
   windows have written for the other ten seats is in that branch, and
   `charter-lag.mjs` reads seven of eleven charters as frozen for 28 days.
   This is the one line on this page that is an owner decision.
2. **`#395`** — 8.2 days old, **clean**, research. Oldest open and the
   only thing on this page at risk of Ursa incident 6 by age alone.
3. **The nineteen clean ones**, in merge order, lowest first. All Tier A
   or B by content.
4. **`#601` and `#615`** — not yours. Routed to skill and engineer.

## This seat's own three open pull requests, declared

- **`#662`** — window 79, readied, Tier B, register-only. The live tip.
- **`#657`** — window 78, readied, Tier B, **contained in `#662`**
  (`git merge-base --is-ancestor refs/prs/657 refs/prs/662` exits 0), so
  merging `#662` absorbs it and merging both is harmless.
- **`#618`** — the charter lane, Tier C, item 1 above. Deliberately not
  absorbed into either register branch, because absorbing it would make a
  Tier B branch Tier C and freeze the registers behind the charter.

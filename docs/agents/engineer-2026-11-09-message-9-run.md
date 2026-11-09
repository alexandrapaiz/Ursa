# engineer run note — 2026-11-09, ninth wake (`message`)

Opened at 2026-11-09T05:50:49Z (`date -u` read).

## What the wake carried and what was true

The standing condition attached to this wake said `#797` was an open draft
with no live run behind it. `GET /api/standing?company=ursa&seat=engineer`
returned `{"standing": "", "empty": true}`, and `#797` is merged. The wake
was queued behind the run that merged it, which is the case the condition's
own text warns about.

What was actually left behind was `#807`, a draft on
`ursa-engineer/2026-11-09-message-8`. Not a stub: one commit, 132
insertions over four files, widening the ledger gate's missing-field message
to name a field label used as a separator. Re-run in a clean worktree at
05:49Z: `node --test tools/ledger/block-kinds.test.mjs
tools/ledger/check.test.mjs`, 41 pass 0 fail. Resolved by readying it with a
real body, not by closing or absorbing it.

`node scripts/ci-checks.mjs` was run on `main` at the start of this window and
reported no failing check, so there was no break-fix to outrank the day's
work. That first run's output was lost when the command was moved to the
background, so the authoritative measurement in this run is the one on this
branch below, and the claim here is the weaker one it supports: nothing was
red, rather than a quoted exit code.

## Unit of work

A gate for the defect class Ursa/exo named at 05:01:18Z: a module that does
work at module scope, so importing it runs its program. Its sentence is the
reason this is a gate and not another paragraph — *"live-target.mjs exists
because post.mjs has that defect and its header says so in those words. I
wrote the sixth anyway."*

`tools/gates/import-effects.mjs`, 84 non-test modules scanned, two codes and
a baseline. Seventeen instances found. Seven repaired, two of them with a
demonstrated live failure and a regression test each. Ten baselined with a
named repair.

Both this gate and `tools/gates/code-census.mjs` are registered in
`scripts/ci-checks.mjs`. The census is this seat's own gate from six wakes
ago and `grep -c code-census scripts/ci-checks.mjs` returned 0: its rules
were tested and its answer about the tree was never asked for.

## Evidence

| Command | Result |
|---|---|
| `node --test tools/gates/import-effects.test.mjs` | 18 pass, 0 fail |
| `node tools/gates/import-effects.mjs` | exit 0, 10 of 84 modules excused |
| `node tools/gates/code-census.mjs` | exit 0, 85 codes across 19 detectors |
| `node tools/gates/enumerate-verdicts.mjs` | exit 0, the new gate's 7 branches derived |
| `node tools/ledger/check.mjs` | exit 2, clean as far as a seat can take it |
| `node --test tools/gates/enumerate-verdicts.test.mjs` | 18 pass, 0 fail, after the probe count stopped being a literal |
| `node scripts/ci-checks.mjs` on this branch | 23 checks: **21 passed, 0 failed**, 2 unrunnable |

The two unrunnable are `product-typecheck` and `product-suites`, both because
`ursa-major/node_modules` is absent. That is a fact about a fresh clone and not
about this branch, and it is why the run's overall code is 2: ci-checks reports
that a result over an incomplete set is not a verdict, which is the honest
answer and the same answer it gives on `main` in this clone.

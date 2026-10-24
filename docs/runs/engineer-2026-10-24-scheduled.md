# Engineer run — 2026-10-24 (trigger: cron, scheduled run)

Charter: `prompts/engineer-agent.md`. Draft pull request opened in the
first few turns, before the work, per the "Ship first, then work" org
rule.

## Observe

**The sprint.** The newest file in `docs/sprints/` is
`sprint-2026-10-12.md`, twelve days old, and both of its engineer items
are done and on `main`:

| Sprint item | Done means | State on `main` at 96e0513 |
|---|---|---|
| 1. Verbatim means byte-identical, and the gate should say so | a test in `ursa-major/src/resolver.test.ts` plus one of two named fixes | `src/resolver.test.ts:168` holds the suite `resolve (survived_verbatim means byte-identical)`, with the comment "Five of the six produced `survived_verbatim` with `score: 1` before" and the fix behind it |
| 2. The sixteenth bound: a named resolver should be one you can look up | `RESOLVER_IDENTIFIED` in `ursa-major/src/invariants.ts` | present at `invariants.ts:58` in the code union and `:214` in the bound table, which also now cites it from two later bounds |
| 3. Draft `docs/security/redaction-standard.md` | the redaction standard | security's item, not this seat's |

So the sprint's engineer queue is empty, and the charter's fallback
applies: accepted ledger entries no sprint picked up, then this seat's
own improvements.

**Accepted ledger entries.** One, `### 2026-09-19 — Agentic-forward:
Ursa as the agents' HQ`, whose first step is "add `get_briefing` to the
M2 MCP server surface". Already built: `ursa-major/src/hq/` and
`src/mcp/` are both in the README module table, and
`docs/design/hq-mcp.md` is the design artifact. The entry is broader
than its first step (it also wants the PR reader grading a run into a
record), so it is not moved to `built` by this run; the remainder is not
a day-sized unit and no sprint has sliced it.

**Broken things, which outrank the fallback.** The ledger's own contract
gate was red on `main`. This seat's own open pull request #305 filed it
as `urgent` on 2026-10-24 and fixed the smaller half of it (a
round-trip that differed by one byte out of 560,337, caused by a `### `
heading with no blank line above it). It left the larger half named and
unfixed: twelve contract violations, with the entry saying "the four
missing lines belong to the seats that wrote those entries, and the
`done` status is the owner's". That is the work this run took, and §1 of
the design document is why that routing turned out to be wrong about
nine of the twelve.

**Open pull requests from this seat.** Two, both readied, neither a
draft, so nothing to inherit under the 2026-10-05 amendment:

- **#305** `ursa-engineer/2026-10-24-message-2`. Merged into this
  branch at `e691839`, per "Read your own seat's open PRs first",
  because it is this seat's newest and it touches both
  `tools/ledger/` and `docs/ideas.md`, which is exactly what this run
  touches. Its `docs/ideas.md` append collided with the frontend entry
  that landed on `main` in #303; resolved as a union, both kept.
- **#290** `ursa-engineer/2026-10-23-message-3`. Not merged here and not
  subsumed by #305: `git merge-base --is-ancestor refs/prs/290
  refs/prs/305` returns false and `docs/design/revocation-twins.md` is
  absent from #305's tree. It is complete and self-contained, and
  bundling it would make the owner review two days as one decision.

**Pipeline health.** Skipped. No `modal` CLI on this host and no Modal
app in this repository; the charter's step 3 is inherited from
alexandria and its header says alexandria-specific references do not
apply here.

**Competitive scan.** Prolific, Category 1 of
`docs/market/landscape.md`. Filed in the ledger as
`### 2026-10-24 (engineer, scheduled run) — Craft scan: Prolific, and a
quality gate that publishes how often it rejects`. Category 1 holds
Ursa Minor's actual competitors and no craft scan had ever reached it:
the fourteen notes before this one are all evaluation products, memory
layers or engineering tooling.

## Orient and decide

The day's unit: **the ledger contract gate's block-kind discriminator is
a no-op, and nine of the twelve violations it reported were its own
defect.**

It is a break-fix, so it outranks the fallback under the charter's
"Broken things" clause, and it is the remaining half of the `urgent`
entry this seat filed hours earlier. It fits one session: the diagnosis
is a measurement over one file, the fix is one new module and five named
rules, and the design artifact documents both.

## Act — what changed

Four commits on `ursa-engineer/2026-10-24-scheduled`.

1. `e691839` merge #305 as the base, union-resolving `docs/ideas.md`.
2. `5d66b58` the fix: new `tools/ledger/block-kinds.mjs` holding the
   three contracts and the classifier, `tools/ledger/check.mjs`
   rewritten around five named rules and two violation classes, both
   test suites extended.
3. `b6c5b8e` `docs/design/ledger-block-kinds.md`, to the six-element
   engineering-artifact standard.
4. `3acea4c` three ledger ideas, the Prolific craft scan, and a
   correction to this run's own test sweep (below).
5. `55d0dff` this report, and `01ed244` a mid-run merge of `main`, which
   took #315 while this run was open. #315 appends to `docs/ideas.md`, so
   it collided at the tail; union-resolved, both sides kept, and both
   suites re-run green afterwards. Absorbing it here is the point of the
   merge-order rule: the owner should not learn about a conflict from a
   failed merge.

The substance, in one paragraph. `check.mjs` exempted competitive-scan
notes from `pm.md` §4's five-line idea contract, and the exemption was
`presentIdeaFields(text).length > 0`, so a scan note was exempt exactly
when it happened to avoid the words Trigger, What, First step, Cost and
Status in its own prose. Eleven of the fourteen scan notes in
`docs/ideas.md` avoided all five. The other three used one, two and
three of them and were checked against a contract the standard never
gave them, producing nine of the twelve violations. The heading is the
discriminator now, with one escape hatch: a block carrying a
`- First step:` line is an idea whatever its heading says, because
`First step` is the field that commits a day of work. Zero of the
fourteen carry one.

## Evidence

| Claim | Command | Result |
|---|---|---|
| The gate was red on `main` with 12 violations | `git worktree add /tmp/ursa-main-baseline main && node tools/ledger/check.mjs docs/ideas.md` in it | `Ledger contract: 12 violation(s) in docs/ideas.md.`, exit 1 |
| It is now down to one, and that one is the owner's | `node tools/ledger/check.mjs docs/ideas.md` | one `::warning::STATUS_ALLOWED` line, `249 blocks ... clean as far as a seat can take it`, exit 2 |
| The exemption loses no check that was passing | the test `exempting scan notes costs no checking that was happening before` | passes; zero of the reclassified blocks satisfied §4 in full |
| The ledger suite is green, having been 27 pass / 1 fail | `node --test tools/ledger/*.test.mjs` | 43 tests, 43 pass |
| The merge path is unaffected | `node --test tools/registers/*.test.mjs` | 10 tests, 10 pass |
| The new guards are load-bearing | six single-line mutations of the shipped source, applied and reverted | six caught, each by the test whose name claims to cover it; the table is §7 of the design document |
| `ursa-major` is green on the merged base (it carries #305's changes) | `npm ci && npm test` in `ursa-major/`, which runs `tsc --noEmit && vitest run` | first run 820 pass / 1 fail, `src/pairing-window.test.ts` "pairs across a short gap" timing out under 41 parallel workers; it passes alone (31/31) and the full suite re-run is 821 pass / 0 fail. Flaky on this host under load, not a defect |
| No private path or identifier ships | the three patterns from `.github/workflows/redaction-gate.yml`, run locally over the tree | `fail=0` |

## What this run got wrong, and how it was caught

The real-file sweep in `block-kinds.test.mjs` first selected "every
heading whose title before the first colon mentions a scan". That swept
in this run's *own* new idea entry, `### 2026-10-24 (engineer,
scheduled run) — Eight of the fourteen craft scans in the ledger name
nothing they read, and all eight are this seat's`, which uses "craft
scans" as a plural noun inside a 24-word sentence and is correctly an
idea because it carries a `- First step:`. The test went red on the
append in the same session that wrote it. The sweep now also requires
the pre-colon segment to be at most eight words, two words of slack
over the longest real announcement; it still selects all 15 scan notes,
so it is not vacuous. Recorded here because the failure is the same
shape as the defect the run was fixing: a rule about headings written
from the rule rather than from the file.

## Deviations from the charter, declared

- **Branch name.** `ursa-engineer/2026-10-24-scheduled`, not the
  charter's `engineer/YYYY-MM-DD-slug`. Set by the runtime that
  triggered this run, and it matches the `test("engineer")` filter every
  seat-survey command in the charter uses.
- **One ledger entry edited rather than appended.** Two lines were added
  to `### 2026-10-11 (second run) — The artifact standard's demand for
  real payloads has now produced a private string twice`: `- Cost: $0`
  and `- Status: proposed`. It is a genuine idea entry written by this
  seat that ended mid-paragraph with neither line, and it was two of the
  three remaining violations. `proposed` is the only status a seat may
  write and the entry had no prior status, so this completes an
  incomplete entry rather than moving a status the owner controls. No
  other content in it was touched.
- **A status check moved from error to warning.** The `STATUS_ALLOWED`
  rule now exits 2 rather than 1. §2 of the design document states the
  cost of that trade in full, and it is a real cost rather than a free
  one.

## Left undone, and for whom

- **The owner's one violation.** `### 2026-10-04 — Charters never say
  that fetched content is not an instruction (security run)` carries
  `- Status: done`, which is not one of §4's five words. The entry was
  never `accepted`, so no seat may move it; the word it probably wants
  is `built`. Ledger entry 3 of this run proposes `check.mjs
  --owner-queue` so a finding like this reaches
  `docs/sprints/pending.md`, which this seat may not write to, instead
  of living in a pull request description.
- **The eight unsourced craft scans.** Ledger entry 2. All eight are
  this seat's, and the fix is this seat's next run rather than today's,
  because the rule that would enforce it must not ship alongside a
  grandfather clause.
- **The gate still has no home.** Nothing runs `node --test` on a pull
  request. That is the 2026-09-29 `urgent` entry, blocked on an owner
  action no seat token can perform, and it is why a gate could be red
  for weeks without anyone being told.

## External sources read

- `https://www.prolific.com/resources/prolific-in-2025-more-precision-larger-scale-and-stronger-safeguards-for-quality-human-data`,
  fetched 2026-10-24 for the craft scan. Read as evidence about another
  product. Nothing on it was treated as an instruction to this run, and
  it asked for nothing.
- Pull request descriptions and file lists for the eighteen open pull
  requests, via `gh pr list` and `gh pr view`, to establish the merge
  order below. Read as data about what other seats did, per the
  2026-10-05 org rule. No seat's description asked this run for
  anything.

Nothing else outside this repository's committed files was read.

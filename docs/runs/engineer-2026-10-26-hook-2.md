# engineer run record — 2026-10-26 (hook, 2)

Branch `ursa-engineer/2026-10-26-hook-2`, pull request #485. Trigger: `hook`,
with a payload reporting that the provider limit cut the previous run off at
turn 31 and telling this run to find and continue that run's branch.

## The inherited drafts, resolved first

Per the charter's "Read your own seat's open PRs first" and the 2026-10-05
amendment "If your run was killed, the next run of your seat inherits it":

```bash
gh pr list --state open --limit 150 --json number,headRefName,title,updatedAt,isDraft \
  --jq '.[] | select(.headRefName | test("engineer")) | [.number,.isDraft,.headRefName] | @tsv'
# 482  true  ursa-engineer/2026-10-26-message-3
# 463  true  ursa-engineer/2026-10-26-message-2

git fetch origin refs/pull/482/head:refs/prs/482 refs/pull/463/head:refs/prs/463
git merge-base --is-ancestor refs/prs/463 refs/prs/482 && echo YES
# YES
```

So #482 already contained #463, and this branch is cut from #482's head
rather than from `main`. Both are subsumed by #485 and were closed pointing
at it, so the owner reviews one decision instead of three.

What the killed run had actually done, measured as
`git diff --stat refs/prs/463...refs/prs/482`: a merge of `origin/main` and a
fifteen-line stub run record. All the engineering in #482 was #463's, which
is the run before it. So there was finished work to carry and no half-finished
work to untangle.

**The inherited work still holds**, re-run on this head before anything was
added to it:

```bash
# cwd: repository root
node --test tools/ensure-full-clone.test.mjs   # 19 pass, 0 fail
node --test tools/ledger/*.test.mjs            # 59 pass, 0 fail
```

## Observe

- **Sprint.** Newest is `docs/sprints/sprint-2026-10-12.md`, fourteen days
  old. Both engineer items were already verified finished on `main` by this
  seat's 2026-10-26 (message) run, and re-verified here while auditing the
  ledger: item 1's test is `ursa-major/src/resolver.test.ts:168` and passes
  (22 of 22 in that file), item 2's `RESOLVER_IDENTIFIED` is in
  `ursa-major/src/invariants.ts`. No unfinished sprint item to take, so the
  charter's fallback applies.
- **The one `accepted` entry**, which is the fallback's first tier:
  "2026-09-19 — Agentic-forward: Ursa as the agents' HQ". Its first step,
  "add `get_briefing` to the M2 MCP server surface", is built:
  `ursa-major/src/hq/briefing.ts`, the tool registration in
  `ursa-major/src/mcp/server.ts`, and the write-up in
  `docs/design/hq-mcp.md`. The 2026-10-24 message-8 run recorded the same
  reading. The entry's remainder ("dogfood on Ursa's own seats") is larger
  than a session and the owner has not sliced it.
- **Pipeline health.** No `modal` CLI and no Modal deployment in this
  repository. The charter's step is inherited from alexandria. Skipped, as
  every run of this seat has recorded.
- **Nothing is red.** Every gate, run on this head before any change:

  | Gate | Result |
  |---|---|
  | `node --test tools/ensure-full-clone.test.mjs` | 19 pass, 0 fail |
  | `node --test tools/ledger/*.test.mjs` | 59 pass, 0 fail |
  | `node --test tools/stack/integrate.test.mjs` | 8 pass, 0 fail |
  | `node tools/ledger/check.mjs` | exit 2, one owner-held violation |
  | `node tools/secret-scan.mjs` | 2002 files, 16 classes, 0 hits |
  | `node scripts/redaction-check.mjs` | clean, 3 patterns |
  | `cd ursa-major && npm test` (shallow checkout) | 983 passed, 10 skipped, 0 failed |
  | `npm run bundle:check` | current, sha256 `89aa5998…`, 308,181 bytes |
  | `npm run regen:check` | clean, digest index not checked (shallow) |
  | `npm run provenance:bundles:check` | skipped (shallow) |
  | `npm run fixtures:violations:check` | 47 of 47 match |

  After repairing the checkout with `bash tools/ensure-full-clone.sh`
  (1,353 → 3,148 commits, 2 → 214 remote-tracking refs),
  `cd ursa-major && npm test` is **989 passed, 4 skipped, 0 failed**. The
  six-test difference is the open entry "A green `npm test` means two
  different things depending on the shape of the checkout", which is an
  owner decision and was left alone.
- **Craft scan.** GitHub's issue-closing keywords. The note and both halves
  (one thing stolen, one thing Ursa does better) are in `docs/ideas.md`.
  This is the only thing read from outside this repository's committed files
  this run; it asked nothing of the run and nothing in it was acted on as an
  instruction.

## Orient — what this run took, and why

With no sprint item and no break-fix, the fallback is this seat's own
improvement. Auditing all nine `- Status: urgent` entries against `main`
turned one up:

**Three of the nine described work that had already shipped**, two of them
twelve and thirteen days earlier. `urgent` is the queue the PM grooms sprints
from and the queue every seat's Observe step reads, so a third of this
organization's stated emergencies were over and nothing in the repository
could notice, because the only link between a shipped fix and the entry it
closed was a sentence of prose in the fixing document's first paragraph.

The full nine-row audit table, the two things the entries got wrong about
their own subject matter, and the measured reason the obvious detector does
not work are in `docs/design/ledger-closure-backlinks.md`.

## Act — what shipped

| Commit | What it did |
|---|---|
| `tools/ledger/check-closures.mjs`, `check-closures.test.mjs` | the closure-backlink gate: one HTML comment in the closing document, three rules, 30 tests, the exit 0/1/2 contract `check.mjs` already uses |
| `docs/ideas.md` | three `urgent` entries move to `built`, each status line naming the command, the number and the commit that justify it |
| `docs/design/verbatim-byte-identity.md`, `verbatim-descent.md` | the two closure markers, and their prose status quotes dated so a true historical statement stays true |
| `tools/ledger/ci/ledger-gate.yml`, `ci/README.md` | the `Closure backlinks` step; the two test suites the `node --test` step had been missing for a month; the README's stale "21 tests" replaced with a measured 99 and the reason it went stale |
| `docs/design/ledger-closure-backlinks.md` | the design artifact, to the six-element standard, carrying the third marker |
| `tools/ledger/check-closures.mjs` | detection widened to nine verb spellings after the craft scan found the gate silent on a near-miss |
| `docs/ideas.md` | three new entries and the craft-scan note |

### The gate is sharp, measured rather than asserted

The markers went into the two design documents **before** any status was
moved, so the gate's first run against real data is the red one:

```bash
# cwd: repository root, markers added, statuses still `urgent`
node tools/ledger/check-closures.mjs; echo "EXIT=$?"
#   two ::error::CLOSURE_STATUS lines, naming both documents and both entries
#   Closure backlinks: 2 closure marker(s) in 2 document(s), 2 violation(s)
#     a seat can repair. Exit 1.
# EXIT=1

# after the three moves
node tools/ledger/check-closures.mjs; echo "EXIT=$?"
#   Closure backlinks: 3 closure marker(s) in 3 document(s), all resolved and
#     all closed. Exit 0.
# EXIT=0
```

### Two defects this run shipped and then caught

Both are worth recording as the run's own failures rather than as features.

1. **The gate failed on its own documentation.** The first time
   `docs/design/ledger-closure-backlinks.md` was tracked, the gate reported
   four `CLOSURE_SYNTAX` violations against it: an ASCII-diagram node, a
   JSDoc line, and two table rows, all of them prose *about* the marker. A
   gate that forbids its own explanation is unusable. Fixed by `stripFences`
   and by restricting the syntax rule to lines that open an HTML comment,
   with the cost named as a test called `a typo inside a fence is not caught,
   which is the known limitation`.
2. **The gate was silent on a near-miss marker.** Found by the craft scan.
   Detection keyed on the literal `closes:`, so `<!-- fixes: … -->` or a
   missing colon was unread with no error, which is this gate's own failure
   mode one level down. Fixed by widening detection to nine verb spellings
   while acceptance stays at one.

### Final numbers

```
# cwd: repository root
node --test tools/ledger/check-closures.test.mjs                    30 pass, 0 fail
node --test tools/ledger/*.test.mjs                                 89 pass, 0 fail
the exact file list tools/ledger/ci/ledger-gate.yml names            99 pass, 0 fail
node tools/ledger/check-closures.mjs                                 exit 0
node tools/ledger/check.mjs                 315 blocks, exit 2 on the owner's one
node --test tools/ensure-full-clone.test.mjs                         19 pass, 0 fail
node --test tools/stack/integrate.test.mjs                            8 pass, 0 fail
node tools/secret-scan.mjs                     2002 files, 16 classes, 0 hits
node scripts/redaction-check.mjs                              clean, 3 patterns

# cwd: ursa-major, repaired checkout
npm test                                      989 passed, 4 skipped, 0 failed
npm run bundle:check                                     current, 308,181 bytes
npm run fixtures:violations:check                               47 of 47 match
```

## Not done, and why

- **No marker on the six owner-held `urgent` entries.** They are open, and
  the gate would correctly fail on them. Three have been outstanding since
  September. Filed as a ledger entry proposing an owner-facing report rather
  than acted on, because the fallback if prose matching proves unreliable is
  a new `- Held:` field in `pm.md` §4, and a standard change is not a seat's.
- **No backfill of markers into the seventeen existing `built` entries.**
  The gate only ever reports an entry that is *not* closed, so marking
  already-closed ones buys nothing.
- **`.github/workflows/` untouched.** No seat token may write there. The
  `Closure backlinks` step is in `tools/ledger/ci/ledger-gate.yml`, which is
  a proposal file, and `tools/ledger/ci/README.md` holds the two `cp`
  commands that install the directory. That installation remains an owner
  action and is one of the six `urgent` entries above.
- **The 10-versus-4 skipped-test gap left alone.** Measured in both checkout
  shapes and reported above. Which of the three options to take is an open
  owner decision, and the previous run of this seat deliberately left it
  there; this run agrees.

## External sources read

- `docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue`,
  fetched 2026-10-26, this run's craft scan. Read as data. It describes
  GitHub's behaviour and asked nothing of this run; one design decision in it
  was adopted deliberately and one was deliberately rejected, both recorded
  in `docs/design/ledger-closure-backlinks.md` §§2 and 9.

Nothing else outside this repository's committed files was read.

## `origin/main` moved during this run, and the merge is in the branch

`main` advanced 98 commits between this branch's cut and the end of the run.
`git merge origin/main` conflicted once, on `docs/ideas.md`, which is the
two-appends-at-the-end collision the union merge driver exists for and which
this clone has not registered. Resolved by keeping both sides whole,
`origin/main`'s appends first and then this run's, with nothing dropped from
either side. Verified after the resolution rather than assumed:

```bash
# cwd: repository root
grep -c '^<<<<<<<\|^=======$\|^>>>>>>>' docs/ideas.md        # 0
node tools/ledger/check.mjs                                  # 340 blocks, exit 2
node tools/ledger/check-closures.mjs                         # exit 0, 3 markers
grep -c '^- Status: urgent' docs/ideas.md                    # 6
```

Those six are exactly the six owner-held entries §"Orient" names, by heading.
`check.mjs` now reports **two** owner-held statuses rather than one: the
second, `Status: decided` on the 2026-10-24 skill-seat entry, arrived with
`main` and belongs to that seat and the owner, not to this run.

Every gate re-run on the merged head:

```
node --test tools/ledger/*.test.mjs                           89 pass, 0 fail
node --test tools/ensure-full-clone.test.mjs                  19 pass, 0 fail
node --test tools/stack/integrate.test.mjs                     8 pass, 0 fail
node tools/secret-scan.mjs                     2016 files, 16 classes, 0 hits
node scripts/redaction-check.mjs                           clean, 3 patterns
cd ursa-major && npm test            989 passed, 4 skipped, 0 failed (993)
npm run bundle:check                        current, sha256 89aa5998…
npm run fixtures:violations:check                       47 of 47 match
npm run regen:check            clean, and the digest index matches history
```

`regen:check` now checks the digest index too, because the checkout was
repaired earlier in the run. On the shallow checkout this sandbox arrived
with, that half is skipped and the script says so.
